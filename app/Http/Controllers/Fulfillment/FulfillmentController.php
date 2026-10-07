<?php

namespace App\Http\Controllers\Fulfillment;

use App\Http\Controllers\Controller;
use App\Models\Requests\Request as ATKRequest;
use App\Models\User;
use App\Services\FulfillmentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FulfillmentController extends Controller
{
    public function __construct(private FulfillmentService $svc) {}

    public function index(Request $request): Response
    {
        $requests = ATKRequest::with(['department', 'requestedBy'])
            ->whereIn('status', ['approved', 'partially_approved'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Fulfillment/Index', ['requests' => $requests]);
    }

    public function show(ATKRequest $atk): Response
    {
        $atk->load(['department', 'requestedBy', 'items.item.unit']);
        $availability = $this->svc->checkAvailability($atk);

        return Inertia::render('Fulfillment/Show', [
            'atkRequest'   => $atk,
            'availability' => $availability,
        ]);
    }

    public function confirmPartial(Request $request, ATKRequest $atk): RedirectResponse
    {
        $this->ensureOwnerOrManager($request->user(), $atk);

        $oldStatus = $atk->status;

        $this->svc->confirmPartial($atk);
        $atk->refresh();

        // Audit Trail: persetujuan pemenuhan sebagian.
        activity()
            ->performedOn($atk)
            ->causedBy($request->user())
            ->event('updated')
            ->withProperties([
                'old'        => ['status' => $oldStatus],
                'attributes' => ['status' => $atk->status],
            ])
            ->log("Pemenuhan sebagian disetujui oleh {$request->user()->name} untuk {$atk->request_number}");

        return back()->with('success', 'Pemenuhan sebagian disetujui, permintaan diteruskan ke picking.');
    }

    public function cancelForStock(Request $request, ATKRequest $atk): RedirectResponse
    {
        $this->ensureOwnerOrManager($request->user(), $atk);

        $this->svc->cancelForInsufficientStock($atk);
        return back()->with('success', 'Permintaan dibatalkan karena stok tidak mencukupi.');
    }

    /**
     * Hanya pemilik permintaan, atau user dengan izin distribution.manage
     * (Admin Gudang), yang boleh melanjutkan. Requester lain mendapat 403.
     * Pengecekan ini dijalankan SEBELUM logika status di service.
     *
     * Kalau aksi ini seharusnya hanya boleh dilakukan pemilik saja, hapus
     * bagian "|| $user->hasPermissionTo('distribution.manage')".
     */
    private function ensureOwnerOrManager(User $user, ATKRequest $atk): void
    {
        abort_unless(
            (int) $atk->requested_by === (int) $user->id
                || $user->hasPermissionTo('distribution.manage'),
            403,
            'Hanya pemilik permintaan atau Admin Gudang yang dapat melakukan aksi ini.'
        );
    }
}