<?php

namespace App\Http\Controllers;

use App\Models\Approval;
use App\Models\InventoryStock;
use App\Models\MasterItem;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // ─── Stats ─────────────────────────────────────────────────────────────

        $totalItems = MasterItem::active()->count();

        $lowStockItems = MasterItem::active()
            ->whereHas('stocks', function ($q) {
                $q->whereRaw('inventory_stocks.quantity > 0')
                  ->whereRaw('inventory_stocks.quantity <= master_items.min_stock');
            })
            ->count();

        $outOfStockItems = InventoryStock::where('quantity', 0)->count();

        $pendingRequests = ATKRequest::whereIn('status', ['submitted', 'approved'])
            ->when(! $user->hasPermissionTo('request.view-all'), function ($q) use ($user) {
                $q->where('requested_by', $user->id);
            })
            ->count();

        $pendingApprovals = $user->hasPermissionTo('approval.approve')
            ? Approval::where('status', 'pending')->count()
            : 0;

        $requestsThisMonth = ATKRequest::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        // ─── Request Status Summary ──────────────────────────────────────────────

        $requestQuery = ATKRequest::when(! $user->hasPermissionTo('request.view-all'), function ($q) use ($user) {
            $q->where('requested_by', $user->id);
        });

        $approvedCount          = (clone $requestQuery)->where('status', ATKRequest::STATUS_APPROVED)->count();
        $partiallyApprovedCount = (clone $requestQuery)->where('status', ATKRequest::STATUS_PARTIALLY_APPROVED)->count();
        $fulfilledCount         = (clone $requestQuery)->where('status', ATKRequest::STATUS_FULFILLED)->count();
        $rejectedCount          = (clone $requestQuery)->where('status', ATKRequest::STATUS_REJECTED)->count();
        $cancelledCount         = (clone $requestQuery)->where('status', ATKRequest::STATUS_CANCELLED)->count();

        $requestsApproved   = $approvedCount + $partiallyApprovedCount + $fulfilledCount;
        $requestsProcessing = $approvedCount + $partiallyApprovedCount;
        $requestsCompleted  = $fulfilledCount;
        $requestsRejected   = $rejectedCount;
        $requestsCancelled  = $cancelledCount;
        $requestsTotal      = $requestsApproved + $requestsRejected + $requestsCancelled;

        // ─── Duplicate Warning & Partial Fulfillment ────────────────────────────

        $duplicateWindowStart = now()->subWeekdays(7);

        $duplicateWarnings = DB::table('request_items')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereNull('requests.deleted_at')
            ->whereNotIn('requests.status', [
                ATKRequest::STATUS_DRAFT,
                ATKRequest::STATUS_CANCELLED,
                ATKRequest::STATUS_REJECTED,
            ])
            ->where('requests.created_at', '>=', $duplicateWindowStart)
            ->select(
                'requests.requested_by',
                'request_items.item_id',
                DB::raw('COUNT(DISTINCT requests.id) as request_count')
            )
            ->groupBy('requests.requested_by', 'request_items.item_id')
            ->having('request_count', '>=', 2)
            ->get()
            ->count();

        $partialFulfillment = $partiallyApprovedCount;

        // ─── Critical & Low Stock Items ──────────────────────────────────────────

        $stockByItem = MasterItem::active()
            ->withSum('stocks as total_stock', 'quantity')
            ->withSum('stocks as reserved_stock', 'reserved_quantity')
            ->get()
            ->keyBy('id');

        $criticalStockItems = $stockByItem
            ->map(function ($item) {
                $totalStock = $item->total_stock ?? 0;
                $reserved   = $item->reserved_stock ?? 0;
                $available  = $totalStock - $reserved;
                $min        = $item->min_stock ?? 0;
                $max        = $item->max_stock ?? ($min > 0 ? $min * 2 : 10);

                if ($available <= 0) {
                    $status = 'KRITIS';
                } elseif ($available <= $min) {
                    $status = 'KRITIS';
                } elseif ($available <= $max) {
                    $status = 'MENIPIS';
                } else {
                    $status = 'AMAN';
                }

                if ($status === 'AMAN') {
                    return null;
                }

                return [
                    'id'            => $item->id,
                    'name'          => $item->name,
                    'code'          => $item->code,
                    'current_stock' => $totalStock,
                    'min_stock'     => $min,
                    'status'        => $status,
                ];
            })
            ->filter()
            ->sortBy(fn ($i) => $i['status'] === 'KRITIS' ? 0 : 1)
            ->values()
            ->take(5);

        // ─── Top Requested Items ────────────────────────────────────────────────

        $topItems = DB::table('request_items')
            ->join('master_items', 'request_items.item_id', '=', 'master_items.id')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->where('requests.created_at', '>=', now()->subDays(30))
            ->whereNull('requests.deleted_at')
            ->groupBy('master_items.id', 'master_items.name')
            ->select('master_items.name', DB::raw('SUM(request_items.quantity_requested) as total_requested'))
            ->orderByDesc('total_requested')
            ->limit(5)
            ->get();

        // ─── Distribution/Order History ──────────────────────────────────────────

        $distributionHistory = ATKRequest::with('department')
            ->when(! $user->hasPermissionTo('request.view-all'), function ($q) use ($user) {
                $q->where('requested_by', $user->id);
            })
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn ($r) => [
                'id'             => $r->id,
                'date'           => $r->created_at->format('d M Y'),
                'request_number' => $r->request_number,
                'department'     => $r->department?->name ?? '-',
                'status'         => $r->status,
            ]);

        // ─── Requests per Department ──────────────────────────────────────────────
        // Disamakan scope-nya dengan kartu "Total Request" di atas: permission-scoped,
        // all-time (tidak dibatasi bulan), dan status yang dihitung persis sama dengan
        // formula $requestsTotal (approved + partially_approved + fulfilled + rejected + cancelled).

        $requestsByDepartment = ATKRequest::with('department')
            ->when(! $user->hasPermissionTo('request.view-all'), function ($q) use ($user) {
                $q->where('requested_by', $user->id);
            })
            ->whereIn('status', [
                ATKRequest::STATUS_APPROVED,
                ATKRequest::STATUS_PARTIALLY_APPROVED,
                ATKRequest::STATUS_FULFILLED,
                ATKRequest::STATUS_REJECTED,
                ATKRequest::STATUS_CANCELLED,
            ])
            ->get()
            ->groupBy(fn ($r) => $r->department?->name ?? 'Tanpa Departemen')
            ->map(fn ($group, $name) => [
                'name'           => $name,
                'total_requests' => $group->count(),
            ])
            ->sortByDesc('total_requests')
            ->values();

        // ─── ATK Needs Insight (based on request patterns) ─────────────────────────
        // NB: dihitung dari pola request_items, bukan InventoryTransaction,
        // karena InventoryTransaction belum ada proses yang mengisinya.

        $insightWeeks         = 8; // jendela untuk hitung rata-rata permintaan mingguan
        $urgentThresholdWeeks = 4; // ambang "perlu diwaspadai": proyeksi habis dalam X minggu

        $demandWindowStart = now()->subWeeks($insightWeeks);

        $itemDemand = DB::table('request_items')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereNull('requests.deleted_at')
            ->whereNotIn('requests.status', [
                ATKRequest::STATUS_DRAFT,
                ATKRequest::STATUS_CANCELLED,
                ATKRequest::STATUS_REJECTED,
            ])
            ->where('requests.created_at', '>=', $demandWindowStart)
            ->groupBy('request_items.item_id')
            ->select('request_items.item_id', DB::raw('SUM(request_items.quantity_requested) as total_qty'))
            ->pluck('total_qty', 'item_id');

        $projectedItems = collect();

        foreach ($itemDemand as $itemId => $totalQty) {
            $item = $stockByItem->get($itemId);
            if (! $item) {
                continue;
            }

            $avgWeekly = $totalQty / $insightWeeks;
            if ($avgWeekly <= 0) {
                continue;
            }

            $available = ($item->total_stock ?? 0) - ($item->reserved_stock ?? 0);
            $min       = $item->min_stock ?? 0;
            $max       = $item->max_stock ?? ($min > 0 ? $min * 2 : 10);

            $weeksUntilMin = ($available - $min) / $avgWeekly;

            if ($weeksUntilMin <= $urgentThresholdWeeks) {
                $projectedItems->push([
                    'id'              => $item->id,
                    'name'            => $item->name,
                    'unit'            => $item->unit?->symbol ?? $item->unit?->name ?? '',
                    'weeks_until_min' => max(0, round($weeksUntilMin, 1)),
                    'avg_weekly'      => $avgWeekly,
                    'available'       => $available,
                    'max_stock'       => $max,
                ]);
            }
        }

        $projectedItems = $projectedItems->sortBy('weeks_until_min')->values();
        $soonestWeeks   = $projectedItems->first()['weeks_until_min'] ?? null;

        $groupedProjection = $soonestWeeks === null
            ? collect()
            : $projectedItems->filter(fn ($i) => $i['weeks_until_min'] <= ceil($soonestWeeks) + 1)->take(3);

        // ─── Kenaikan permintaan per departemen (untuk item yang di-flag) ───────────

        $demandIncrease = null;

        if ($groupedProjection->isNotEmpty()) {
            $itemIds = $groupedProjection->pluck('id');

            $currentPeriodStart  = now()->subDays(30);
            $previousPeriodStart = now()->subDays(60);
            $previousPeriodEnd   = now()->subDays(30);

            $currentByDept = DB::table('request_items')
                ->join('requests', 'request_items.request_id', '=', 'requests.id')
                ->whereNull('requests.deleted_at')
                ->whereNotIn('requests.status', [
                    ATKRequest::STATUS_DRAFT,
                    ATKRequest::STATUS_CANCELLED,
                    ATKRequest::STATUS_REJECTED,
                ])
                ->whereIn('request_items.item_id', $itemIds)
                ->where('requests.created_at', '>=', $currentPeriodStart)
                // NB: asumsi kolom FK departemen di tabel `requests` adalah `department_id`
                ->groupBy('requests.department_id', 'request_items.item_id')
                ->select(
                    'requests.department_id',
                    'request_items.item_id',
                    DB::raw('SUM(request_items.quantity_requested) as qty')
                )
                ->get();

            $previousByDept = DB::table('request_items')
                ->join('requests', 'request_items.request_id', '=', 'requests.id')
                ->whereNull('requests.deleted_at')
                ->whereNotIn('requests.status', [
                    ATKRequest::STATUS_DRAFT,
                    ATKRequest::STATUS_CANCELLED,
                    ATKRequest::STATUS_REJECTED,
                ])
                ->whereIn('request_items.item_id', $itemIds)
                ->whereBetween('requests.created_at', [$previousPeriodStart, $previousPeriodEnd])
                ->groupBy('requests.department_id', 'request_items.item_id')
                ->select(
                    'requests.department_id',
                    'request_items.item_id',
                    DB::raw('SUM(request_items.quantity_requested) as qty')
                )
                ->get()
                ->keyBy(fn ($r) => $r->department_id . '-' . $r->item_id);

            $bestIncrease = null;

            foreach ($currentByDept as $row) {
                $key     = $row->department_id . '-' . $row->item_id;
                $prevQty = $previousByDept->get($key)?->qty ?? 0;

                if ($prevQty <= 0) {
                    continue; // butuh baseline untuk hitung persentase
                }

                $percent = (($row->qty - $prevQty) / $prevQty) * 100;

                if ($percent >= 15 && ($bestIncrease === null || $percent > $bestIncrease['percent'])) {
                    $bestIncrease = [
                        'department_id' => $row->department_id,
                        'item_id'       => $row->item_id,
                        'percent'       => (int) round($percent),
                    ];
                }
            }

            if ($bestIncrease) {
                $department = \App\Models\Department::find($bestIncrease['department_id']);
                $item       = $stockByItem->get($bestIncrease['item_id']);

                $demandIncrease = [
                    'department' => $department?->name ?? '-',
                    'item_name'  => $item?->name ?? '-',
                    'percent'    => $bestIncrease['percent'],
                ];
            }
        }

        // ─── Rekomendasi pengadaan ──────────────────────────────────────────────────

        $procurementSuggestions = $groupedProjection->map(function ($i) {
            $suggestedQty = max(
                $i['max_stock'] - $i['available'],
                round($i['avg_weekly'] * 4) // cover kebutuhan ~1 bulan ke depan
            );

            $qty = (int) (ceil(max($suggestedQty, 0) / 10) * 10);

            return [
                'name' => $i['name'],
                'unit' => $i['unit'],
                'qty'  => $qty,
            ];
        })->filter(fn ($s) => $s['qty'] > 0)->values();

        $needsInsight = [
            'has_insight'     => $groupedProjection->isNotEmpty(),
            'weeks'           => $soonestWeeks !== null ? (int) ceil($soonestWeeks) : null,
            'items'           => $groupedProjection->pluck('name')->values(),
            'demand_increase' => $demandIncrease,
            'procurement'     => $procurementSuggestions,
            'deadline'        => now()->addMonth()->startOfMonth()->format('d M Y'),
        ];

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_items'               => $totalItems,
                'low_stock_items'           => $lowStockItems,
                'out_of_stock_items'        => $outOfStockItems,
                'pending_requests'          => $pendingRequests,
                'pending_approvals'         => $pendingApprovals,
                'total_requests_this_month' => $requestsThisMonth,
                'requests_total'            => $requestsTotal,
                'requests_approved'         => $requestsApproved,
                'requests_rejected'         => $requestsRejected,
                'requests_completed'        => $requestsCompleted,
                'requests_processing'       => $requestsProcessing,
                'requests_cancelled'        => $requestsCancelled,
                'duplicate_warnings'        => $duplicateWarnings,
                'partial_fulfillment'       => $partialFulfillment,
            ],
            'critical_stock_items' => $criticalStockItems,
            'distribution_history' => $distributionHistory,
            'department_requests'  => $requestsByDepartment,
            'needs_insight'        => $needsInsight,
            'top_items'            => $topItems,
        ]);
    }
}