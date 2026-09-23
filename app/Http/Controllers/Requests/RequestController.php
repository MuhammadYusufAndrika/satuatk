<?php

namespace App\Http\Controllers\Requests;

use App\Http\Controllers\Controller;
use App\Models\InventoryStock;
use App\Models\MasterDepartment;
use App\Models\MasterItem;
use App\Models\Requests\Request as ATKRequest;
use App\Models\Requests\RequestItem;
use App\Services\ApprovalService;
use App\Services\FulfillmentService;
use App\Notifications\RequestSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RequestController extends Controller
{
    public function __construct(
        private ApprovalService $svc,
        private FulfillmentService $fulfillmentSvc,
    ) {}

    /**
     * List requests — admins see all, users see their own.
     */
    public function index(Request $request): Response
    {
        $user    = $request->user();
        $viewAll = $user->hasPermissionTo('request.view-all');

        $requests = ATKRequest::with(['department', 'requestedBy', 'items.item.unit', 'items.item.category', 'approvals.approver', 'pickupSchedule'])
            ->when(! $viewAll, fn($q) => $q->where('requested_by', $user->id))
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('request_number', 'like', "%{$s}%")
                  ->orWhere('title', 'like', "%{$s}%");
            }))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        // Rename relationship key for frontend
        $requests->getCollection()->transform(function ($r) {
            $r->requested_by_user = $r->requestedBy;
            return $r;
        });

        return Inertia::render('Requests/Index', [
            'requests' => $requests,
            'filters'  => $request->only('search', 'status'),
        ]);
    }

    /**
     * Show the create form.
     */
    public function create(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Requests/Create', [
            'departments' => MasterDepartment::active()->orderBy('name')->get(['id', 'name']),
            'items'       => MasterItem::active()
                ->with(['category', 'unit'])
                ->withSum('stocks as total_stock', 'quantity')
                ->selectRaw('master_items.*, (SELECT SUM(quantity - reserved_quantity) FROM inventory_stocks WHERE item_id = master_items.id) as available_stock')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store a new request (draft or submit).
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = validator($request->all(), [
            'title'         => ['required', 'string', 'max:255'],
            'description'   => ['nullable', 'string'],
            'category'      => ['required', 'in:regular,urgent'],
            'department_id' => ['required', 'exists:master_departments,id'],
            'needed_date'   => ['nullable', 'date'],
            'delivery_point'=> ['nullable', 'string', 'max:50'],
            'notes'         => ['nullable', 'string'],
            'action'        => ['required', 'in:draft,submit'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.item_id'            => ['required', 'exists:master_items,id'],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
            'force'         => ['nullable', 'boolean'],
        ]);

        $this->validateMaxRequest($validator, $request->input('items', []));

        $validated = $validator->validate();

        $user    = $request->user();
        $isDraft = $validated['action'] === 'draft';
        $force   = $request->boolean('force');

        // Kalau langsung mau submit (bukan simpan draft), cek duplikasi & stok dulu.
        if (! $isDraft && ! $force) {
            $itemIds = collect($validated['items'])->pluck('item_id');
            $duplicateItems = $this->findDuplicateItemsFor($itemIds, $user->id);

            $lowStockCheck = collect($validated['items'])->map(function ($i) {
                $item = MasterItem::with('unit')->find($i['item_id']);
                $totalStock = InventoryStock::where('item_id', $i['item_id'])->sum('quantity');
                $reserved   = InventoryStock::where('item_id', $i['item_id'])->sum('reserved_quantity');
                $available  = $totalStock - $reserved;

                if ($i['quantity_requested'] > $available) {
                    return [
                        'name'      => $item->name ?? '-',
                        'requested' => $i['quantity_requested'],
                        'available' => $available,
                        'unit'      => $item->unit?->symbol ?? $item->unit?->name ?? '',
                    ];
                }
                return null;
            })->filter()->values();

            if ($duplicateItems->isNotEmpty() || $lowStockCheck->isNotEmpty()) {
                return back()->withInput()->with('duplicate_warning', [
                    'duplicate_items' => $duplicateItems->values(),
                    'low_stock_items' => $lowStockCheck,
                ]);
            }
        }

        $atk = null;

        DB::transaction(function () use ($validated, $user, $isDraft, &$atk) {
            $atk = ATKRequest::create([
                'uuid'           => Str::uuid(),
                'request_number' => $this->generateRequestNumber(),
                'title'          => $validated['title'],
                'description'    => $validated['description'] ?? null,
                'category'       => $validated['category'],
                'status'         => $isDraft ? 'draft' : 'submitted',
                'department_id'  => $validated['department_id'],
                'requested_by'   => $user->id,
                'needed_date'    => $validated['needed_date'] ?? null,
                'delivery_point' => $validated['delivery_point'] ?? null,
                'notes'          => $validated['notes'] ?? null,
                'submitted_at'   => $isDraft ? null : now(),
            ]);

            foreach ($validated['items'] as $item) {
                RequestItem::create([
                    'request_id'         => $atk->id,
                    'item_id'            => $item['item_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'status'             => 'pending',
                ]);
            }

            // Create approval chain if submitted
            if (! $isDraft) {
                $this->svc->createApprovalChain($atk);
                if ($user) {
                    $user->notify(new RequestSubmitted($atk));
                }
            }
        });

        $msg = $isDraft ? 'Permintaan disimpan sebagai draft.' : 'Permintaan berhasil diajukan.';

        return redirect()->route('requests.index')->with('success', $msg);
    }

    /**
     * Show a single request.
     */
    public function show(ATKRequest $atk): Response
{
    $atk->load([
        'department',
        'requestedBy',
        'items.item.unit',
        'items.item.category',
        'approvals.approver',
        'pickupSchedule',
    ]);

    $fulfillmentCheck = $atk->fulfillment_status === 'awaiting_confirmation'
        ? $this->fulfillmentSvc->checkAvailability($atk)
        : null;

    $payload = $atk->toArray();
    $payload['requestedBy']    = $atk->requestedBy;
    $payload['pickupSchedule'] = $atk->pickupSchedule;

    return Inertia::render('Requests/Show', [
        'request'          => $payload,
        'fulfillmentCheck' => $fulfillmentCheck,
    ]);
}

    /**
     * Show the edit form (draft only).
     */
    public function edit(ATKRequest $atk): Response
    {
        abort_unless($atk->status === 'draft', 403, 'Hanya draft yang bisa diedit.');

        $atk->load('items.item.unit', 'items.item.category');

        return Inertia::render('Requests/Edit', [
            'request'     => $atk,
            'departments' => MasterDepartment::active()->orderBy('name')->get(['id', 'name']),
            'items'       => MasterItem::active()
                ->with(['category', 'unit'])
                ->selectRaw('master_items.*, (SELECT SUM(quantity - reserved_quantity) FROM inventory_stocks WHERE item_id = master_items.id) as available_stock')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Update a draft request.
     */
    public function update(Request $request, ATKRequest $atk): RedirectResponse
    {
        abort_unless($atk->status === 'draft', 403);

        $validator = validator($request->all(), [
            'title'         => ['required', 'string', 'max:255'],
            'category'      => ['required', 'in:regular,urgent'],
            'department_id' => ['required', 'exists:master_departments,id'],
            'needed_date'   => ['nullable', 'date'],
            'delivery_point'=> ['nullable', 'string', 'max:50'],
            'notes'         => ['nullable', 'string'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.item_id'            => ['required', 'exists:master_items,id'],
            'items.*.quantity_requested' => ['required', 'integer', 'min:1'],
        ]);

        $this->validateMaxRequest($validator, $request->input('items', []));

        $validated = $validator->validate();

        DB::transaction(function () use ($atk, $validated) {
            $atk->update([
                'title'          => $validated['title'],
                'category'       => $validated['category'],
                'department_id'  => $validated['department_id'],
                'needed_date'    => $validated['needed_date'] ?? null,
                'delivery_point' => $validated['delivery_point'] ?? null,
                'notes'          => $validated['notes'] ?? null,
            ]);

            $incomingItemIds = collect($validated['items'])->pluck('item_id');

            // Hapus barang yang sudah dihapus dari form
            $atk->items()->whereNotIn('item_id', $incomingItemIds)->delete();

            // Update qty barang yang sudah ada, atau buat baru kalau ditambahkan
            foreach ($validated['items'] as $item) {
                $atk->items()->updateOrCreate(
                    ['item_id' => $item['item_id']],
                    ['quantity_requested' => $item['quantity_requested'], 'status' => 'pending']
                );
            }
        });

        return redirect()->route('requests.show', $atk->uuid)->with('success', 'Draft diperbarui.');
    }

    /**
     * Submit a draft. Cek duplikasi dulu sebelum benar-benar submit.
     */
    public function submit(Request $request, ATKRequest $atk): RedirectResponse
    {
        abort_unless($atk->status === 'draft', 403, 'Hanya draft yang bisa diajukan.');
        abort_unless($atk->items()->exists(), 422, 'Permintaan harus memiliki minimal 1 barang.');

        $force = $request->boolean('force');
        $itemIds = $atk->items()->pluck('item_id');
        $duplicateItems = $this->findDuplicateItemsFor($itemIds, $atk->requested_by, $atk->id);
        $lowStockItems  = $this->findLowStockItems($atk->items()->with('item.unit')->get());

        if (($duplicateItems->isNotEmpty() || $lowStockItems->isNotEmpty()) && ! $force) {
            return back()->with('duplicate_warning', [
                'duplicate_items' => $duplicateItems->values(),
                'low_stock_items' => $lowStockItems->values(),
            ]);
        }

        DB::transaction(function () use ($atk, $duplicateItems) {
            $atk->update([
                'status'             => 'submitted',
                'submitted_at'       => now(),
                'duplicate_override' => $duplicateItems->isNotEmpty(),
            ]);
            $this->svc->createApprovalChain($atk);
            $atk->requestedBy?->notify(new RequestSubmitted($atk));
        });

        return redirect()->route('requests.show', $atk->uuid)->with('success', 'Permintaan berhasil diajukan.');
    }

    /**
     * Cari nama barang dari daftar item_id yang pernah diminta user yang sama
     * dalam 7 hari kerja terakhir, lewat request lain (opsional exclude 1 request tertentu)
     * yang statusnya bukan draft/cancelled/rejected.
     */
    private function findDuplicateItemsFor($itemIds, int $userId, ?int $excludeRequestId = null)
    {
        if (collect($itemIds)->isEmpty()) {
            return collect();
        }

        $windowStart = now()->subWeekdays(7);

        return DB::table('request_items')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->join('master_items', 'request_items.item_id', '=', 'master_items.id')
            ->where('requests.requested_by', $userId)
            ->when($excludeRequestId, fn ($q) => $q->where('requests.id', '!=', $excludeRequestId))
            ->whereIn('request_items.item_id', $itemIds)
            ->whereNotIn('requests.status', ['draft', 'cancelled', 'rejected'])
            ->where('requests.created_at', '>=', $windowStart)
            ->whereNull('requests.deleted_at')
            ->distinct()
            ->pluck('master_items.name');
    }

    /**
     * Tambahkan error validasi kalau ada item yang quantity_requested-nya
     * melebihi max_request item tersebut. min_request tidak dipakai —
     * batas minimum yang berlaku untuk semua item cukup 1 (lihat rule
     * 'items.*.quantity_requested' => min:1).
     */
    private function validateMaxRequest($validator, array $items): void
    {
        $itemIds = collect($items)->pluck('item_id')->filter()->values();

        if ($itemIds->isEmpty()) {
            return;
        }

        $maxRequestByItemId = MasterItem::whereIn('id', $itemIds)
            ->pluck('max_request', 'id');

        $validator->after(function ($validator) use ($items, $maxRequestByItemId) {
            foreach ($items as $index => $row) {
                $itemId = $row['item_id'] ?? null;
                $qty    = $row['quantity_requested'] ?? null;
                $max    = $maxRequestByItemId->get($itemId);

                if ($itemId && $qty !== null && $max !== null && $qty > $max) {
                    $item = MasterItem::find($itemId);
                    $validator->errors()->add(
                        "items.{$index}.quantity_requested",
                        "Maksimal permintaan untuk \"{$item?->name}\" adalah {$max} pcs."
                    );
                }
            }
        });
    }

    /**
     * Cek item mana yang quantity_requested-nya melebihi stok yang tersedia
     * (total_stock - reserved_quantity) saat ini.
     */
    private function findLowStockItems($requestItems)
    {
        return collect($requestItems)->map(function ($ri) {
            $totalStock = InventoryStock::where('item_id', $ri->item_id)->sum('quantity');
            $reserved   = InventoryStock::where('item_id', $ri->item_id)->sum('reserved_quantity');
            $available  = $totalStock - $reserved;

            if ($ri->quantity_requested > $available) {
                return [
                    'name'      => $ri->item->name ?? '-',
                    'requested' => $ri->quantity_requested,
                    'available' => $available,
                    'unit'      => $ri->item->unit?->symbol ?? $ri->item->unit?->name ?? '',
                ];
            }

            return null;
        })->filter()->values();
    }

    /**
     * Cancel a request.
     */
    public function cancel(ATKRequest $atk): RedirectResponse
    {
        abort_unless(in_array($atk->status, ['draft', 'submitted']), 403);

        $atk->update(['status' => 'cancelled']);

        return redirect()->route('requests.show', $atk->uuid)->with('success', 'Permintaan dibatalkan.');
    }

    /**
     * Tampilkan halaman Rekomendasi Reorder.
     */
    public function reorderIndex(Request $request): Response
{
    $items = MasterItem::active()
        ->with(['category', 'unit'])
        ->selectRaw('master_items.*, (SELECT COALESCE(SUM(quantity - reserved_quantity), 0) FROM inventory_stocks WHERE item_id = master_items.id) as available_stock')
        ->get()
        ->filter(function ($item) {
            return $item->available_stock <= $item->min_stock;
        });

    $reorderData = $items->map(function ($item) {
        $available = $item->available_stock ?? 0;
        $isCritical = $available <= ($item->min_stock * 0.5);
        $saranReorder = max(0, ($item->max_stock ?? ($item->min_stock * 2)) - $available);

        return [
            'id' => $item->id,
            'name' => $item->name,
            'code' => $item->sku ?? $item->code,
            'unit' => $item->unit->name ?? '',
            'stock' => $available,
            'min_stock' => $item->min_stock,
            'saran' => $saranReorder,
            'status' => $isCritical ? 'KRITIS' : 'RENDAH',
        ];
    })->values();

    return Inertia::render('Requests/ReorderIndex', [
        'reorderData' => $reorderData,
        'totalPerluReorder' => $reorderData->count(),
        'highlightItemId' => $request->query('highlight') ? (int) $request->query('highlight') : null,
    ]);
}

    /**
     * Proses buat draft request dari 1 item rekomendasi.
     */
    public function storeReorderRequest(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'exists:master_items,id'],
            'jumlah_saran' => ['required', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $gudangDepartmentId = 14; // ID Departemen Gudang dari database

        DB::transaction(function () use ($validated, $user, $gudangDepartmentId) {
            $atk = ATKRequest::create([
                'uuid' => Str::uuid(),
                'request_number' => $this->generateRequestNumber(),
                'title' => 'Reorder Otomatis Stok Menipis/Kritis',
                'category' => 'regular',
                'status' => 'draft',
                'department_id' => $gudangDepartmentId,
                'requested_by' => $user->id,
                'notes' => 'Generated automatically from Reorder Recommendation.',
            ]);

            RequestItem::create([
                'request_id' => $atk->id,
                'item_id' => $validated['item_id'],
                'quantity_requested' => $validated['jumlah_saran'],
                'status' => 'pending',
            ]);
        });

        return redirect()->route('requests.index')->with('success', 'Draft request ATK berhasil dibuat dari rekomendasi!');
    }

    /**
     * Proses buat draft request untuk SEMUA item rekomendasi sekaligus.
     */
    public function storeAllReorderRequest(Request $request): RedirectResponse
    {
        $user = $request->user();
        $gudangDepartmentId = 14; // ID Departemen Gudang dari database

        $items = MasterItem::active()
            ->selectRaw('master_items.*, (SELECT SUM(quantity - reserved_quantity) FROM inventory_stocks WHERE item_id = master_items.id) as available_stock')
            ->havingRaw('available_stock <= min_stock')
            ->get();

        if ($items->isEmpty()) {
            return redirect()->back()->with('error', 'Tidak ada item yang perlu direorder.');
        }

        DB::transaction(function () use ($items, $user, $gudangDepartmentId) {
            $atk = ATKRequest::create([
                'uuid' => Str::uuid(),
                'request_number' => $this->generateRequestNumber(),
                'title' => 'Reorder Massal Stok Menipis/Kritis',
                'category' => 'regular',
                'status' => 'draft',
                'department_id' => $gudangDepartmentId,
                'requested_by' => $user->id,
                'notes' => 'Generated automatically from Bulk Reorder Recommendation.',
            ]);

            foreach ($items as $item) {
                $available = $item->available_stock ?? 0;
                $saranReorder = max(0, ($item->max_stock ?? ($item->min_stock * 2)) - $available);

                RequestItem::create([
                    'request_id' => $atk->id,
                    'item_id' => $item->id,
                    'quantity_requested' => $saranReorder > 0 ? $saranReorder : 1,
                    'status' => 'pending',
                ]);
            }
        });

        return redirect()->route('requests.index')->with('success', 'Semua rekomendasi berhasil diajukan sebagai draft request!');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function generateRequestNumber(): string
    {
        $prefix = 'REQ-' . date('Ym') . '-';
        $last   = ATKRequest::where('request_number', 'like', $prefix . '%')
            ->max('request_number');
        $seq    = $last ? ((int) substr($last, -4)) + 1 : 1;
        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }
}
