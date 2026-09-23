<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\StockOpname;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StockOpnameController extends Controller
{
    /**
     * Display a listing of stock opname sessions.
     */
    public function index(Request $request): Response
    {
        $opnames = StockOpname::with(['creator', 'location'])
            ->withCount('items')
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('opname_number', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%");
            }))
            ->when($request->status, fn($q, $st) => $q->where('status', $st))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Opname/Index', [
            'opnames' => $opnames,
            'filters' => $request->only('search', 'status'),
        ]);
    }
}
