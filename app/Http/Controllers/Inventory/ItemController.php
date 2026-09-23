<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\MasterCategory;
use App\Models\MasterItem;
use App\Models\MasterSupplier;
use App\Models\MasterUnit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    /**
     * Display a listing of items.
     */
    public function index(Request $request): Response
    {
        $items = MasterItem::with(['category', 'unit', 'supplier', 'stocks.location'])
            ->withSum('stocks as total_stock', 'quantity')
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('code', 'like', "%{$s}%")
                  ->orWhere('brand', 'like', "%{$s}%");
            }))
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c))
            ->when($request->status === 'low',  fn($q) => $q->whereHas('stocks', fn($sq) =>
                $sq->whereRaw('inventory_stocks.quantity <= master_items.min_stock AND inventory_stocks.quantity > 0')
            ))
            ->when($request->status === 'out',  fn($q) => $q->whereDoesntHave('stocks', fn($sq) =>
                $sq->where('quantity', '>', 0)
            ))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Inventory/Items/Index', [
            'items'      => $items,
            'categories' => MasterCategory::active()->orderBy('name')->get(['id', 'name']),
            'filters'    => $request->only('search', 'category_id', 'status'),
        ]);
    }

    /**
     * Show the create form.
     */
    public function create(): Response
    {
        return Inertia::render('Inventory/Items/Create', $this->formData());
    }

    /**
     * Store a new item.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateItem($request);
        $validated['uuid'] = Str::uuid();

        MasterItem::create($validated);

        return redirect()->route('inventory.items.index')
            ->with('success', 'Barang berhasil ditambahkan.');
    }

    /**
     * Show a single item.
     */
    public function show(MasterItem $item): Response
    {
        $item->load(['category', 'unit', 'supplier', 'stocks.location']);
        $item->loadSum('stocks as total_stock', 'quantity');

        return Inertia::render('Inventory/Items/Show', compact('item'));
    }

    /**
     * Show the edit form.
     */
    public function edit(MasterItem $item): Response
    {
        return Inertia::render('Inventory/Items/Edit', array_merge(
            ['item' => $item],
            $this->formData()
        ));
    }

    /**
     * Update an item.
     */
    public function update(Request $request, MasterItem $item): RedirectResponse
    {
        $item->update($this->validateItem($request, $item));

        return redirect()->route('inventory.items.index')
            ->with('success', 'Barang berhasil diperbarui.');
    }

    /**
     * Soft-delete an item.
     */
    public function destroy(MasterItem $item): RedirectResponse
    {
        $item->delete();

        return redirect()->route('inventory.items.index')
            ->with('success', 'Barang berhasil dihapus.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function formData(): array
    {
        return [
            'categories' => MasterCategory::active()->orderBy('name')->get(['id', 'name']),
            'units'      => MasterUnit::active()->orderBy('name')->get(['id', 'name', 'symbol']),
            'suppliers'  => MasterSupplier::active()->orderBy('name')->get(['id', 'name']),
        ];
    }

    private function validateItem(Request $request, ?MasterItem $item = null): array
    {
        $uniqueCode = 'unique:master_items,code' . ($item ? ",{$item->id}" : '');

        return $request->validate([
            'code'        => ['required', 'string', 'max:30', $uniqueCode],
            'name'        => ['required', 'string', 'max:255'],
            'brand'       => ['nullable', 'string', 'max:100'],
            'model'       => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'category_id' => ['required', 'exists:master_categories,id'],
            'unit_id'     => ['required', 'exists:master_units,id'],
            'supplier_id' => ['nullable', 'exists:master_suppliers,id'],
            'price'       => ['nullable', 'numeric', 'min:0'],
            'min_stock'   => ['nullable', 'integer', 'min:0'],
            'max_stock'   => ['nullable', 'integer', 'min:0'],
            'barcode'     => ['nullable', 'string', 'max:100'],
            'is_active'   => ['boolean'],
        ]);
    }
}
