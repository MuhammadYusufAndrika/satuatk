<?php

namespace App\Services;

use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\PickupSchedule;
use App\Models\Requests\Request as ATKRequest;
use App\Notifications\StockInsufficientNeedsConfirmation;
use App\Notifications\RequestReadyForPickup;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\User;
use App\Notifications\PickupReadyForPreparation;
use Illuminate\Support\Facades\Notification;

class FulfillmentService
{
    /**
     * Dipanggil tepat setelah approval chain selesai (semua level approve).
     * Menentukan apakah request bisa langsung lanjut ke Distribution,
     * atau perlu konfirmasi requester dulu karena stok kurang.
     */
    public function process(ATKRequest $request): void
    {
        $request->load('items.item');
        $availability = $this->checkAvailability($request);

        $allSufficient = $availability->every(fn ($row) => $row['status'] === 'cukup');

        if ($allSufficient) {
            $this->fulfill($request, useRequestedQty: true);
            return;
        }

        // Ada item kurang/kosong — tahan di sini, minta konfirmasi requester
        $request->update(['fulfillment_status' => ATKRequest::FULFILLMENT_AWAITING_CONFIRMATION]);
        $request->requestedBy?->notify(new StockInsufficientNeedsConfirmation($request, $availability));
    }

    /**
     * Cek stok tiap item request: quantity - reserved_quantity (lintas lokasi, dijumlah).
     */
    public function checkAvailability(ATKRequest $request)
    {
        return $request->items->map(function ($ri) {
            $totalStock = InventoryStock::where('item_id', $ri->item_id)->sum('quantity');
            $reserved   = InventoryStock::where('item_id', $ri->item_id)->sum('reserved_quantity');
            $safetyStock = $ri->item->safety_stock ?? 0;
            $available  = $totalStock - $reserved - $safetyStock;

            $status = $available >= $ri->quantity_requested
                ? 'cukup'
                : ($available > 0 ? 'kurang' : 'kosong');

            return [
                'request_item_id' => $ri->id,
                'item_name'       => $ri->item->name ?? '-',
                'unit'            => $ri->item->unit?->symbol ?? $ri->item->unit?->name ?? '',
                'requested'       => $ri->quantity_requested,
                'available'       => max(0, $available),
                'status'          => $status,
            ];
        });
    }

    /**
     * Requester menyetujui pemenuhan sebagian.
     */
    public function confirmPartial(ATKRequest $request): void
    {
        $this->fulfill($request, useRequestedQty: false);
    }

    /**
     * Requester membatalkan karena stok tidak cukup.
     */
    public function cancelForInsufficientStock(ATKRequest $request): void
    {
        $request->update([
            'status'             => 'cancelled',
            'fulfillment_status' => ATKRequest::FULFILLMENT_CANCELLED_STOCK,
        ]);
    }

    /**
     * Reservasi stok, isi quantity_approved, dan buat PickupSchedule.
     * $useRequestedQty=true artinya semua item pasti cukup (jalur normal).
     * $useRequestedQty=false artinya pakai qty sejumlah stok yang ada (partial).
     */
    private function fulfill(ATKRequest $request, bool $useRequestedQty): void
    {
        DB::transaction(function () use ($request, $useRequestedQty) {
            $anyPartial = false;

            foreach ($request->items as $ri) {
                $totalStock  = InventoryStock::where('item_id', $ri->item_id)->sum('quantity');
                $reserved    = InventoryStock::where('item_id', $ri->item_id)->sum('reserved_quantity');
                $safetyStock = $ri->item->safety_stock ?? 0;
                $available   = max(0, $totalStock - $reserved - $safetyStock);

                $qtyToReserve = $useRequestedQty
                    ? $ri->quantity_requested
                    : min($ri->quantity_requested, $available);

                if ($qtyToReserve < $ri->quantity_requested) {
                    $anyPartial = true;
                }

                $this->reserveAcrossLocations($ri->item_id, $qtyToReserve, $request);

                $ri->update([
                    'quantity_approved' => $qtyToReserve,
                    'status'            => $qtyToReserve > 0 ? 'approved' : 'unavailable',
                ]);
            }

            $request->update([
                'status'             => $anyPartial ? 'partially_approved' : 'approved',
                'fulfillment_status' => null,
            ]);

            $pickup = PickupSchedule::firstOrCreate(
                ['request_id' => $request->id],
                [
                    'uuid'           => Str::uuid(),
                    'pickup_number'  => 'PU-' . date('Ym') . '-' . str_pad($request->id, 4, '0', STR_PAD_LEFT),
                    'status'         => PickupSchedule::STATUS_SCHEDULED,
                    'scheduled_date' => $request->needed_date ?? now()->addDay(),
                ]
            );

            // Cuma kirim notif picking sekali, pas PickupSchedule baru pertama kali dibuat
            if ($pickup->wasRecentlyCreated) {
                $admins = User::role('Admin')->get();
                Notification::send($admins, new PickupReadyForPreparation($request, $pickup));
            }

            $request->requestedBy?->notify(new RequestReadyForPickup($request, $pickup));
        });
    }

    /**
     * Reservasi stok dari lokasi-lokasi yang ada (FIFO sederhana berdasar quantity tersedia terbesar dulu),
     * sekaligus catat inventory_transactions sebagai jejak audit.
     */
    private function reserveAcrossLocations(int $itemId, int $qty, ATKRequest $request): void
    {
        if ($qty <= 0) return;

        $stocks = InventoryStock::where('item_id', $itemId)
            ->orderByRaw('(quantity - reserved_quantity) DESC')
            ->get();

        $remaining = $qty;

        foreach ($stocks as $stock) {
            if ($remaining <= 0) break;

            $availableHere = $stock->quantity - $stock->reserved_quantity;
            if ($availableHere <= 0) continue;

            $take = min($availableHere, $remaining);

            $stock->increment('reserved_quantity', $take);
            $remaining -= $take;

            InventoryTransaction::create([
                'uuid'             => Str::uuid(),
                'item_id'          => $itemId,
                'location_id'      => $stock->location_id,
                'transaction_type' => 'reservation',
                'reference_type'   => 'request',
                'reference_id'     => $request->id,
                'reference_number' => $request->request_number,
                'quantity_before'  => $stock->quantity,
                'quantity_change'  => 0, // stok fisik belum berubah, cuma direservasi
                'quantity_after'   => $stock->quantity,
                'notes'            => "Reservasi {$take} unit untuk {$request->request_number}",
                'created_by'       => $request->requested_by,
            ]);
        }
    }

    public function distributeStock(ATKRequest $request): void
    {
        $request->load('items.item');

        DB::transaction(function () use ($request) {
            foreach ($request->items as $ri) {
                if ($ri->status !== 'approved' || ! $ri->quantity_approved) continue;

                $fulfilled = $this->deductAcrossLocations($ri->item_id, $ri->quantity_approved, $request);

                $ri->update([
                    'quantity_fulfilled' => $fulfilled,
                ]);
            }
        });
    }

    private function deductAcrossLocations(int $itemId, int $qty, ATKRequest $request): int
    {
        if ($qty <= 0) return 0;

        $stocks = InventoryStock::where('item_id', $itemId)
            ->where('reserved_quantity', '>', 0)
            ->orderByDesc('reserved_quantity')
            ->get();

        $remaining = $qty;

        foreach ($stocks as $stock) {
            if ($remaining <= 0) break;

            $take = min($stock->reserved_quantity, $stock->quantity, $remaining);
            if ($take <= 0) continue;

            $before = $stock->quantity;

            $stock->decrement('quantity', $take);
            $stock->decrement('reserved_quantity', $take);
            $remaining -= $take;

            InventoryTransaction::create([
                'uuid'             => Str::uuid(),
                'item_id'          => $itemId,
                'location_id'      => $stock->location_id,
                'transaction_type' => 'distribution',
                'reference_type'   => 'request',
                'reference_id'     => $request->id,
                'reference_number' => $request->request_number,
                'quantity_before'  => $before,
                'quantity_change'  => -$take,
                'quantity_after'   => $before - $take,
                'notes'            => "Distribusi {$take} unit untuk {$request->request_number}",
                'created_by'       => $request->requested_by,
            ]);
        }

        return $qty - $remaining;
    }
}