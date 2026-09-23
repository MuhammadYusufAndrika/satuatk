<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryStock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockController extends Controller
{
    /**
     * Display a listing of stock across all items/locations.
     */
    public function index(Request $request): Response
    {
        $stocks = InventoryStock::with(['item', 'location'])
            ->when($request->search, fn($q, $s) => $q->whereHas('item', fn($iq) =>
                $iq->where('name', 'like', "%{$s}%")
                   ->orWhere('code', 'like', "%{$s}%")
            ))
            ->when($request->location_id, fn($q, $l) => $q->where('location_id', $l))
            ->when($request->status === 'low', fn($q) => $q->whereRaw('quantity <= (SELECT min_stock FROM master_items WHERE master_items.id = inventory_stocks.item_id) AND quantity > 0'))
            ->when($request->status === 'out', fn($q) => $q->where('quantity', 0))
            ->orderBy('item_id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Stocks/Index', [
            'stocks'    => $stocks,
            'filters'   => $request->only('search', 'location_id', 'status'),
            'locations' => \App\Models\MasterLocation::active()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
