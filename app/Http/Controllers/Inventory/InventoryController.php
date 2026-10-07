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
                // Stok fisik saja (tanpa dikurangi safety_stock) — itu cuma garis alarm.
                $avail  = '(COALESCE((SELECT SUM(s.quantity) FROM inventory_stocks s WHERE s.item_id = master_items.id), 0)'
                        . ' - COALESCE((SELECT SUM(s.reserved_quantity) FROM inventory_stocks s WHERE s.item_id = master_items.id), 0))';
                $safety = 'COALESCE(master_items.safety_stock, 0)';
                $min    = 'COALESCE(master_items.min_stock, 0)';

                match ($st) {
                    'out'       => $q->whereRaw("$avail <= 0"),
                    'low'       => $q->whereRaw("$avail > 0 AND $avail <= $safety"),
                    'limited'   => $q->whereRaw("$avail > $safety AND $avail <= $min"),
                    'available' => $q->whereRaw("$avail > $min"),
                    default     => null,
                };
            })
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        $summary = ['available' => 0, 'limited' => 0, 'low' => 0, 'out' => 0];

        $baseQuery()
            ->get()
            ->each(function ($item) use (&$summary) {
                $avail  = $item->available_stock;   // stok fisik, tanpa dikurangi safety_stock
                $min    = $item->min_stock ?? 0;
                $safety = $item->safety_stock ?? 0;

                if ($avail <= 0)          $summary['out']++;
                elseif ($avail <= $safety) $summary['low']++;
                elseif ($avail <= $min)    $summary['limited']++;
                else                        $summary['available']++;
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