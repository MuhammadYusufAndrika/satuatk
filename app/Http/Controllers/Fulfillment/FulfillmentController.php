<?php

namespace App\Http\Controllers\Fulfillment;

use App\Http\Controllers\Controller;
use App\Models\Requests\Request as ATKRequest;
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

    public function confirmPartial(ATKRequest $atk): RedirectResponse
    {
        $this->svc->confirmPartial($atk);
        return back()->with('success', 'Pemenuhan sebagian disetujui, permintaan diteruskan ke picking.');
    }

    public function cancelForStock(ATKRequest $atk): RedirectResponse
    {
        $this->svc->cancelForInsufficientStock($atk);
        return back()->with('success', 'Permintaan dibatalkan karena stok tidak mencukupi.');
    }
}