<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryAdjustment;
use App\Models\InventoryAdjustmentItem;
use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\MasterItem;
use App\Models\MasterLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AdjustmentController extends Controller
{
    /**
     * Display a listing of stock adjustments.
     */
    public function index(Request $request): Response
    {
        $adjustments = InventoryAdjustment::with(['creator'])
            ->withCount('items')
            ->when($request->search, fn($q, $s) => $q->where('adjustment_number', 'like', "%{$s}%"))
            ->when($request->type, fn($q, $t) => $q->where('type', $t))
            ->when($request->status, fn($q, $st) => $q->where('status', $st))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Adjustment/Index', [
            'adjustments' => $adjustments,
            'filters'     => $request->only('search', 'type', 'status'),
        ]);
    }

    /**
     * Show the create form (add/reduce stock).
     */
    public function create(): Response
    {
        return Inertia::render('Inventory/Adjustment/Create', [
            'items'     => MasterItem::active()
                ->with(['unit'])
                ->withSum('stocks as total_stock', 'quantity')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'unit_id']),
            'locations' => MasterLocation::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Store a stock adjustment and apply changes to inventory.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type'            => ['required', 'in:increase,decrease'],
            'reason'          => ['required', 'string', 'max:255'],
            'items'           => ['required', 'array', 'min:1'],
            'items.*.item_id'       => ['required', 'exists:master_items,id'],
            'items.*.location_id'   => ['required', 'exists:master_locations,id'],
            'items.*.quantity'      => ['required', 'integer', 'min:1'],
            'items.*.notes'         => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        // Preload nama barang & lokasi untuk keperluan Audit Trail.
        $itemsById = MasterItem::whereIn('id', collect($validated['items'])->pluck('item_id'))
            ->get()->keyBy('id');
        $locationsById = MasterLocation::whereIn('id', collect($validated['items'])->pluck('location_id'))
            ->get()->keyBy('id');

        DB::transaction(function () use ($validated, $user, $itemsById, $locationsById) {
            $adjustment = InventoryAdjustment::create([
                'uuid'              => Str::uuid(),
                'adjustment_number' => $this->generateAdjustmentNumber(),
                'type'              => $validated['type'],
                'reason'            => $validated['reason'],
                'status'            => 'approved',
                'created_by'        => $user->id,
                'approved_by'       => $user->id,
                'approved_at'       => now(),
            ]);

            foreach ($validated['items'] as $line) {
                $itemId = $line['item_id'];
                $locationId = $line['location_id'];
                $change = $validated['type'] === 'increase' ? $line['quantity'] : -$line['quantity'];

                $item     = $itemsById[$itemId];
                $location = $locationsById[$locationId];

                // Kunci baris stok agar dua penyesuaian bersamaan tidak saling menimpa.
                $stock = InventoryStock::lockForUpdate()->firstOrCreate(
                    ['item_id' => $itemId, 'location_id' => $locationId],
                    ['uuid' => Str::uuid(), 'quantity' => 0, 'reserved_quantity' => 0]
                );

                $before = $stock->quantity;
                $after = $before + $change;

                // Tolak jika stok hasil penyesuaian negatif (rollback seluruh transaksi,
                // termasuk catatan Audit Trail).
                if ($after < 0) {
                    throw ValidationException::withMessages([
                        'items' => "Stok tidak mencukupi untuk {$item->name}. Stok saat ini {$before}, pengurangan {$line['quantity']}.",
                    ]);
                }

                // Tolak jika stok fisik turun di bawah jumlah yang sedang direservasi.
                if ($validated['type'] === 'decrease' && $after < $stock->reserved_quantity) {
                    $available = max(0, $before - $stock->reserved_quantity);
                    throw ValidationException::withMessages([
                        'items' => "Stok tersedia {$item->name} hanya {$available} (ada {$stock->reserved_quantity} unit yang sedang direservasi).",
                    ]);
                }

                $stock->update(['quantity' => $after]);

                InventoryAdjustmentItem::create([
                    'adjustment_id'      => $adjustment->id,
                    'item_id'            => $itemId,
                    'location_id'        => $locationId,
                    'quantity_before'    => $before,
                    'quantity_adjustment' => $change,
                    'quantity_after'     => $after,
                    'notes'              => $line['notes'] ?? null,
                ]);

                InventoryTransaction::create([
                    'uuid'               => Str::uuid(),
                    'item_id'            => $itemId,
                    'location_id'        => $locationId,
                    'transaction_type'   => 'adjustment',
                    'reference_type'     => 'adjustment',
                    'reference_id'       => $adjustment->id,
                    'reference_number'   => $adjustment->adjustment_number,
                    'quantity_before'    => $before,
                    'quantity_change'    => $change,
                    'quantity_after'     => $after,
                    'notes'              => $validated['reason'],
                    'created_by'         => $user->id,
                ]);

                // Audit Trail: satu catatan per barang yang disesuaikan.
                // Pengguna (causer) dan waktu (created_at) dicatat otomatis oleh Spatie.
                // Properti dibuat datar agar tampil benar di DetailModal (Audit/Index.jsx).
                activity()
                    ->performedOn($adjustment)
                    ->causedBy($user)
                    ->event('updated')
                    ->withProperties([
                        'old' => [
                            'stok' => $before,
                        ],
                        'attributes' => [
                            'no_penyesuaian' => $adjustment->adjustment_number,
                            'barang'         => "{$item->code} - {$item->name}",
                            'lokasi'         => $location->name,
                            'stok'           => $after,
                            'selisih'        => $change,
                            'alasan'         => $validated['reason'],
                        ],
                    ])
                    ->log(
                        "Penyesuaian stok {$adjustment->adjustment_number}: {$item->name} ({$location->name}) "
                        . "{$before} → {$after} (" . ($change > 0 ? '+' : '') . "{$change})"
                    );
            }
        });

        $verb = $validated['type'] === 'increase' ? 'ditambahkan' : 'dikurangi';

        return redirect()->route('inventory.adjustment.index')
            ->with('success', "Stok berhasil {$verb} melalui penyesuaian.");
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function generateAdjustmentNumber(): string
    {
        $prefix = 'ADJ-' . date('Ym') . '-';
        $last   = InventoryAdjustment::where('adjustment_number', 'like', $prefix . '%')
            ->max('adjustment_number');
        $seq    = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}