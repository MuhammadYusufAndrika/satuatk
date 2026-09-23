<?php

namespace App\Http\Controllers\Distribution;

use App\Http\Controllers\Controller;
use App\Models\PickupLog;
use App\Models\PickupSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Notifications\PickupReadyForCollection;

class DistributionController extends Controller
{
    public function __construct(private \App\Services\FulfillmentService $fulfillmentSvc) {}

    public function index(Request $request): Response
{
    $pickups = PickupSchedule::with(['request.department', 'request.requestedBy', 'request.items', 'preparedBy'])
        ->when($request->search, fn($q, $s) => $q->where('pickup_number', 'like', "%{$s}%")
            ->orWhereHas('request', fn($rq) => $rq->where('request_number', 'like', "%{$s}%")))
        ->when($request->status, fn($q, $status) => $q->where('status', $status))
        ->orderByDesc('scheduled_date')
        ->paginate(20)
        ->withQueryString();

    return Inertia::render('Distribution/Index', [
        'distributions' => $pickups,
        'filters'       => $request->only('search', 'status'),
    ]);
}

    public function show(PickupSchedule $pickup): Response
{
    $pickup->load(['request.department', 'request.requestedBy', 'request.items.item', 'preparedBy', 'log.pickedUpBy']);

    $payload = $pickup->toArray();

    // requestedBy collide dengan kolom requested_by → override supaya frontend
    // (yang baca camelCase) dapet objek User yang benar.
    if ($pickup->request) {
        $payload['request'] = $pickup->request->toArray();
        $payload['request']['requestedBy'] = $pickup->request->requestedBy;
    }

    // preparedBy & log.pickedUpBy TIDAK perlu di-override — Laravel sudah
    // otomatis nulis ke key snake_case ('prepared_by', 'picked_up_by')
    // yang justru itu yang dibaca frontend.

    return Inertia::render('Distribution/Show', [
        'distribution' => $payload,
    ]);
}

    /**
     * Admin Gudang menandai barang sudah disiapkan dan siap diambil/didistribusikan.
     */
    public function prepare(Request $request, PickupSchedule $pickup): RedirectResponse
{
    $pickup->update([
        'status'      => PickupSchedule::STATUS_READY,
        'prepared_by' => $request->user()->id,
        'prepared_at' => now(),
    ]);

    $pickup->loadMissing('request.requestedBy');
    $pickup->request->requestedBy?->notify(new PickupReadyForCollection($pickup->request, $pickup));

    return back()->with('success', 'Barang siap untuk diambil.');
}

    /**
     * Requester (dan HANYA requester pemilik request tersebut) mengonfirmasi
     * bahwa barang sudah diterima. Sesuai Business Rule #13 di rancangan:
     * "Requester melakukan konfirmasi setelah ATK diterima" — bukan diwakilkan
     * oleh admin gudang, dan bukan requester lain di luar pemilik request ini.
     */
    public function confirm(Request $request, PickupSchedule $pickup): RedirectResponse
    {
        $pickup->loadMissing('request');

        abort_unless(
            $pickup->request->requested_by === $request->user()->id,
            403,
            'Hanya requester pemilik permintaan ini yang dapat mengonfirmasi penerimaan.'
        );

        abort_unless(
            $pickup->status === PickupSchedule::STATUS_READY,
            422,
            'Barang belum ditandai siap diambil oleh Admin Gudang.'
        );

        $validated = $request->validate([
            'proof_notes' => ['nullable', 'string'],
        ]);

        PickupLog::create([
            'pickup_schedule_id' => $pickup->id,
            'picked_up_by'       => $request->user()->id,
            'picked_up_at'       => now(),
            'proof_notes'        => $validated['proof_notes'] ?? null,
        ]);

        $pickup->load('request.items');
        $this->fulfillmentSvc->distributeStock($pickup->request);
        $pickup->update(['status' => PickupSchedule::STATUS_PICKED_UP]);
        $pickup->request()->update(['status' => 'fulfilled', 'fulfilled_at' => now()]);

        return back()->with('success', 'Penerimaan barang berhasil dikonfirmasi.');
    }
}
