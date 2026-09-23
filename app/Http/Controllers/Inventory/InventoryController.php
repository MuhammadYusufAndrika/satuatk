<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\MasterCategory;
use App\Models\MasterItem;
use App\Models\StockOpname;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Unified inventory page: items + stock availability + stock opname.
     */
    public function index(Request $request): Response
{
    $user = $request->user();

    $baseQuery = fn () => MasterItem::query()
        ->withSum('stocks as total_stock', 'quantity')
        ->withSum('stocks as reserved_stock', 'reserved_quantity')
        ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
            $q->where('name', 'like', "%{$s}%")
              ->orWhere('code', 'like', "%{$s}%")
              ->orWhere('brand', 'like', "%{$s}%");
        }))
        ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c));

    $items = $baseQuery()
        ->with(['category', 'unit', 'supplier', 'stocks.location'])
        ->when($request->status, function ($q, $st) {
            match ($st) {
                'available' => $q->whereHas('stocks', fn($sq) =>
                    $sq->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) >= master_items.max_stock')
                ),
                'limited'   => $q->whereHas('stocks', fn($sq) =>
                    $sq->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) < master_items.max_stock')
                      ->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) > master_items.min_stock')
                ),
                'low'       => $q->whereHas('stocks', fn($sq) =>
                    $sq->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) <= master_items.min_stock')
                      ->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) > 0')
                ),
                'out'       => $q->whereDoesntHave('stocks', fn($sq) =>
                    $sq->whereRaw('(inventory_stocks.quantity - inventory_stocks.reserved_quantity - master_items.safety_stock) > 0')
                ),
            };
        })
        ->orderBy('name')
        ->paginate(20)
        ->withQueryString();

    $summary = ['available' => 0, 'limited' => 0, 'low' => 0, 'out' => 0];

    $baseQuery()
        ->get()
        ->each(function ($item) use (&$summary) {
            $safety = $item->safety_stock ?? 0;
            $avail  = ($item->total_stock ?? 0) - ($item->reserved_stock ?? 0) - $safety;
            $min    = $item->min_stock ?? 0;
            $max    = $item->max_stock ?? ($min > 0 ? $min * 2 : 10);

            if ($avail <= 0)        $summary['out']++;
            elseif ($avail <= $min) $summary['low']++;
            elseif ($avail < $max)  $summary['limited']++;
            else                    $summary['available']++;
        });

    $opnames = StockOpname::with(['creator', 'location'])
        ->withCount('items')
        ->when($user->hasPermissionTo('inventory.opname'), function () {})
        ->latest()
        ->limit(10)
        ->get();

    return Inertia::render('Inventory/Index', [
        'items'      => $items,
        'summary'    => $summary,
        'opnames'    => $opnames,
        'categories' => MasterCategory::active()->orderBy('name')->get(['id', 'name']),
        'filters'    => $request->only('search', 'category_id', 'status'),
    ]);
}
}