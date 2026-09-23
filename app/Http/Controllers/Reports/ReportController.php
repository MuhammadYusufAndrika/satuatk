<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\MasterCategory;
use App\Models\MasterDepartment;
use App\Models\MasterItem;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Reports hub — quick summary + links to each report.
     */
    public function index(Request $request): Response
    {
        $totalItems = MasterItem::active()->count();

        $lowStockCount = MasterItem::active()
            ->whereHas('stocks', function ($q) {
                $q->whereRaw('inventory_stocks.quantity > 0')
                  ->whereRaw('inventory_stocks.quantity <= master_items.min_stock');
            })
            ->count();

        $outOfStockCount = MasterItem::active()
            ->whereDoesntHave('stocks', fn($q) => $q->where('quantity', '>', 0))
            ->count();

        $requestsThisMonth = ATKRequest::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return Inertia::render('Reports/Index', [
            'summary' => [
                'total_items'         => $totalItems,
                'low_stock_count'     => $lowStockCount,
                'out_of_stock_count'  => $outOfStockCount,
                'requests_this_month' => $requestsThisMonth,
            ],
        ]);
    }

    /**
     * Item stok perlu perhatian (kritis & menipis).
     */
    public function inventory(Request $request): Response
    {
        $status = $request->string('status', '')->toString(); // '', 'kritis', 'menipis'
        $search = $request->string('search', '')->toString();
$itemId = $request->input('item_id', '');
        $perPage = 20;
        $page    = (int) $request->input('page', 1);

        $items = MasterItem::active()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
->when($itemId, fn ($q) => $q->where('id', $itemId))
            ->withSum('stocks as total_stock', 'quantity')
            ->withSum('stocks as reserved_stock', 'reserved_quantity')
            ->get()
            ->map(function ($item) {
                $totalStock = $item->total_stock ?? 0;
                $reserved   = $item->reserved_stock ?? 0;
                $available  = $totalStock - $reserved;
                $min        = $item->min_stock ?? 0;
                $max        = $item->max_stock ?? ($min > 0 ? $min * 2 : 10);

                if ($available <= 0 || $available <= $min) {
                    $itemStatus = 'KRITIS';
                } elseif ($available <= $max) {
                    $itemStatus = 'MENIPIS';
                } else {
                    $itemStatus = 'AMAN';
                }

                return [
                    'id'            => $item->id,
                    'name'          => $item->name,
                    'current_stock' => $totalStock,
                    'min_stock'     => $min,
                    'status'        => $itemStatus,
                ];
            })
            ->filter(fn ($i) => $i['status'] !== 'AMAN')
            ->when($status === 'kritis', fn ($c) => $c->filter(fn ($i) => $i['status'] === 'KRITIS'))
            ->when($status === 'menipis', fn ($c) => $c->filter(fn ($i) => $i['status'] === 'MENIPIS'))
            ->sortBy(fn ($i) => $i['status'] === 'KRITIS' ? 0 : 1)
            ->values();

        $paginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Reports/Inventory', [
            'items'   => $paginated,
            'filters' => $request->only('search', 'status', 'item_id'),
        ]);
    }

    /**
     * Usage report — item consumption via request items.
     */
    public function usage(Request $request): Response
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();

        $usage = DB::table('request_items')
            ->join('master_items', 'request_items.item_id', '=', 'master_items.id')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->groupBy('master_items.id', 'master_items.name', 'master_items.code')
            ->select(
                'master_items.id',
                'master_items.code',
                'master_items.name',
                DB::raw('COUNT(request_items.id) as total_transactions'),
                DB::raw('SUM(request_items.quantity_requested) as total_requested')
            )
            ->orderByDesc('total_requested')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Reports/Usage', [
            'usage'   => $usage,
            'filters' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
        ]);
    }

    /**
     * Usage report grouped by department.
     */
    public function department(Request $request): Response
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();

        $departments = DB::table('requests')
            ->join('master_departments', 'requests.department_id', '=', 'master_departments.id')
            ->leftJoin('request_items', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->groupBy('master_departments.id', 'master_departments.name', 'master_departments.code')
            ->select(
                'master_departments.id',
                'master_departments.code',
                'master_departments.name',
                DB::raw('COUNT(DISTINCT requests.id) as total_requests'),
                DB::raw('SUM(COALESCE(request_items.quantity_requested, 0)) as total_items_requested')
            )
            ->orderByDesc('total_requests')
            ->get();

        return Inertia::render('Reports/Department', [
            'departments' => $departments,
            'filters' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
        ]);
    }
    /**
     * Tren pemakaian ATK per bulan.
     */
    public function trend(Request $request): Response
    {
        $from   = $request->date('from') ?? now()->subMonths(5)->startOfMonth();
        $to     = $request->date('to') ?? now()->endOfMonth();
        $itemId = $request->input('item_id', '');

        $bulanIndo = [
            '01' => 'Jan', '02' => 'Feb', '03' => 'Mar', '04' => 'Apr',
            '05' => 'Mei', '06' => 'Jun', '07' => 'Jul', '08' => 'Agu',
            '09' => 'Sep', '10' => 'Okt', '11' => 'Nov', '12' => 'Des',
        ];

                $trend = DB::table('request_items')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->when($itemId, fn ($q) => $q->where('request_items.item_id', $itemId))
            ->select(
                DB::raw("DATE_FORMAT(requests.created_at, '%Y-%m') as period"),
                DB::raw('COUNT(request_items.id) as total_transactions'),
                DB::raw('SUM(request_items.quantity_requested) as total_requested'),
                DB::raw('SUM(COALESCE(request_items.quantity_approved, 0)) as total_approved'),
                DB::raw('SUM(COALESCE(request_items.quantity_fulfilled, 0)) as total_fulfilled')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period'             => $row->period,
                'period_label'       => $bulanIndo[substr($row->period, 5, 2)] . ' ' . substr($row->period, 0, 4),
                'total_transactions' => $row->total_transactions,
                'total_requested'    => (int) $row->total_requested,
                'total_approved'     => (int) $row->total_approved,
                'total_fulfilled'    => (int) $row->total_fulfilled,
            ]);

        $items = MasterItem::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Reports/Trend', [
            'trend'   => $trend,
            'items'   => $items,
            'filters' => [
                'from'    => $from->toDateString(),
                'to'      => $to->toDateString(),
                'item_id' => $itemId,
            ],
        ]);
    }
    /**
     * Laporan distribusi — daftar request per tanggal, unit kerja, dan status.
     */
    public function distribution(Request $request): Response
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();
        $status = $request->string('status', '')->toString();
        $departmentId = $request->input('department_id', '');

        $requests = ATKRequest::with('department')
            ->whereBetween('requests.created_at', [$from, $to])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $requests->through(fn ($r) => [
            'id'           => $r->id,
            'date'         => $r->created_at->format('Y-m-d'),
            'department'   => $r->department->name ?? '-',
            'status'       => $r->status,
            'status_label' => $r->status_label,
        ]);

        $departments = MasterDepartment::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Reports/Distribution', [
            'distribution' => $requests,
            'departments'  => $departments,
            'filters' => [
                'from'          => $from->toDateString(),
                'to'            => $to->toDateString(),
                'status'        => $status,
                'department_id' => $departmentId,
            ],
        ]);
    }

    /**
     * Rekapitulasi request per bulan dan status.
     */
    public function recap(Request $request): Response
    {
        $from = $request->date('from') ?? now()->subMonths(5)->startOfMonth();
        $to   = $request->date('to') ?? now()->endOfMonth();

        $bulanIndo = [
            '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
            '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
            '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
        ];

        $rows = DB::table('requests')
            ->whereBetween('created_at', [$from, $to])
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw("COUNT(*) as total_masuk"),
                DB::raw("SUM(CASE WHEN status IN ('approved','fulfilled') THEN 1 ELSE 0 END) as total_approved_full"),
                DB::raw("SUM(CASE WHEN status = 'partially_approved' THEN 1 ELSE 0 END) as total_approved_partial"),
                DB::raw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as total_rejected")
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(function ($row) use ($bulanIndo) {
                $percentRejected = $row->total_masuk > 0
                    ? round(($row->total_rejected / $row->total_masuk) * 100, 1)
                    : 0;

                return [
                    'period'                 => $row->period,
                    'period_label'           => $bulanIndo[substr($row->period, 5, 2)] . ' ' . substr($row->period, 0, 4),
                    'total_masuk'            => $row->total_masuk,
                    'total_approved_full'    => $row->total_approved_full,
                    'total_approved_partial' => $row->total_approved_partial,
                    'total_rejected'         => $row->total_rejected,
                    'percent_rejected'       => $percentRejected,
                ];
            });

        return Inertia::render('Reports/Recap', [
            'recap'   => $rows,
            'filters' => [
                'from' => $from->toDateString(),
                'to'   => $to->toDateString(),
            ],
        ]);
    }

    /**
     * Export a report as CSV.
     */
    public function export(Request $request): HttpResponse
    {
        $type = $request->string('type', 'inventory');

        return match ((string) $type) {
            'usage'        => $this->exportUsage($request),
            'department'   => $this->exportDepartment($request),
            'distribution' => $this->exportDistribution($request),
            'recap'        => $this->exportRecap($request),
'trend'        => $this->exportTrend($request),
            default        => $this->exportInventory($request),
        };
    }

    private function exportInventory(Request $request): HttpResponse
    {
        $items = MasterItem::active()
            ->withSum('stocks as total_stock', 'quantity')
            ->withSum('stocks as reserved_stock', 'reserved_quantity')
            ->get()
            ->map(function ($item) {
                $totalStock = $item->total_stock ?? 0;
                $reserved   = $item->reserved_stock ?? 0;
                $available  = $totalStock - $reserved;
                $min        = $item->min_stock ?? 0;
                $max        = $item->max_stock ?? ($min > 0 ? $min * 2 : 10);

                if ($available <= 0 || $available <= $min) {
                    $status = 'KRITIS';
                } elseif ($available <= $max) {
                    $status = 'MENIPIS';
                } else {
                    $status = 'AMAN';
                }

                return [$item->name, $totalStock, $min, $status];
            })
            ->filter(fn ($row) => $row[3] !== 'AMAN')
            ->sortBy(fn ($row) => $row[3] === 'KRITIS' ? 0 : 1)
            ->values();

        $rows = [['Nama Barang', 'Stok Saat Ini', 'Min Stok', 'Status']];
        foreach ($items as $row) {
            $rows[] = $row;
        }

        return $this->csvResponse($rows, 'laporan-item-perlu-perhatian.csv');
    }

    private function exportUsage(Request $request): HttpResponse
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();

        $usage = DB::table('request_items')
            ->join('master_items', 'request_items.item_id', '=', 'master_items.id')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->groupBy('master_items.id', 'master_items.name', 'master_items.code')
            ->select(
                'master_items.code',
                'master_items.name',
                DB::raw('COUNT(request_items.id) as total_transactions'),
                DB::raw('SUM(request_items.quantity_requested) as total_requested')
            )
            ->orderByDesc('total_requested')
            ->get();

        $rows = [['Kode', 'Nama Barang', 'Jumlah Transaksi', 'Total Qty Diminta']];
        foreach ($usage as $u) {
            $rows[] = [$u->code, $u->name, $u->total_transactions, $u->total_requested];
        }

        return $this->csvResponse($rows, 'laporan-item-terbanyak-diminta.csv');
    }

    private function exportDepartment(Request $request): HttpResponse
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();

        $departments = DB::table('requests')
            ->join('master_departments', 'requests.department_id', '=', 'master_departments.id')
            ->leftJoin('request_items', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->groupBy('master_departments.id', 'master_departments.name', 'master_departments.code')
            ->select(
                'master_departments.code',
                'master_departments.name',
                DB::raw('COUNT(DISTINCT requests.id) as total_requests'),
                DB::raw('SUM(COALESCE(request_items.quantity_requested, 0)) as total_items_requested')
            )
            ->orderByDesc('total_requests')
            ->get();

        $rows = [['Kode', 'Departemen', 'Total Permintaan', 'Total Barang Diminta']];
        foreach ($departments as $d) {
            $rows[] = [$d->code, $d->name, $d->total_requests, $d->total_items_requested];
        }

        return $this->csvResponse($rows, 'laporan-departemen.csv');
    }

    private function exportDistribution(Request $request): HttpResponse
    {
        $from = $request->date('from') ?? now()->subDays(30)->startOfDay();
        $to   = $request->date('to') ?? now()->endOfDay();

        $requests = ATKRequest::with('department')
            ->whereBetween('created_at', [$from, $to])
            ->orderByDesc('created_at')
            ->get();

        $rows = [['Tanggal', 'Unit Kerja', 'Status']];
        foreach ($requests as $r) {
            $rows[] = [$r->created_at->format('Y-m-d'), $r->department->name ?? '-', $r->status_label];
        }

        return $this->csvResponse($rows, 'laporan-distribusi.csv');
    }

    private function exportRecap(Request $request): HttpResponse
    {
        $from = $request->date('from') ?? now()->subMonths(5)->startOfMonth();
        $to   = $request->date('to') ?? now()->endOfMonth();

        $bulanIndo = [
            '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
            '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
            '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
        ];

        $data = DB::table('requests')
            ->whereBetween('created_at', [$from, $to])
            ->whereNull('deleted_at')
            ->where('status', '!=', 'draft')
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
                DB::raw("COUNT(*) as total_masuk"),
                DB::raw("SUM(CASE WHEN status IN ('approved','fulfilled') THEN 1 ELSE 0 END) as total_approved_full"),
                DB::raw("SUM(CASE WHEN status = 'partially_approved' THEN 1 ELSE 0 END) as total_approved_partial"),
                DB::raw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as total_rejected")
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $rows = [['Bulan', 'Req Masuk', 'Disetujui Penuh', 'Disetujui Sebagian', 'Ditolak', '% Ditolak']];
        foreach ($data as $row) {
            $percentRejected = $row->total_masuk > 0
                ? round(($row->total_rejected / $row->total_masuk) * 100, 1)
                : 0;
            $label = $bulanIndo[substr($row->period, 5, 2)] . ' ' . substr($row->period, 0, 4);
            $rows[] = [$label, $row->total_masuk, $row->total_approved_full, $row->total_approved_partial, $row->total_rejected, $percentRejected . '%'];
        }

        return $this->csvResponse($rows, 'laporan-rekapitulasi-status.csv');
    }
            private function exportTrend(Request $request): HttpResponse
    {
        $from   = $request->date('from') ?? now()->subMonths(5)->startOfMonth();
        $to     = $request->date('to') ?? now()->endOfMonth();
        $itemId = $request->input('item_id', '');

        $bulanIndo = [
            '01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April',
            '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus',
            '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
        ];

        $trend = DB::table('request_items')
            ->join('requests', 'request_items.request_id', '=', 'requests.id')
            ->whereBetween('requests.created_at', [$from, $to])
            ->whereNull('requests.deleted_at')
            ->when($itemId, fn ($q) => $q->where('request_items.item_id', $itemId))
            ->select(
                DB::raw("DATE_FORMAT(requests.created_at, '%Y-%m') as period"),
                DB::raw('COUNT(request_items.id) as total_transactions'),
                DB::raw('SUM(request_items.quantity_requested) as total_requested'),
                DB::raw('SUM(COALESCE(request_items.quantity_approved, 0)) as total_approved')
            )
            ->groupBy('period')
            ->orderBy('period')
            ->get();

        $rows = [['Bulan', 'Jumlah Transaksi', 'Total Diminta', 'Total Disetujui']];
        foreach ($trend as $row) {
            $label = $bulanIndo[substr($row->period, 5, 2)] . ' ' . substr($row->period, 0, 4);
            $rows[] = [$label, $row->total_transactions, (int) $row->total_requested, (int) $row->total_approved];
        }

        return $this->csvResponse($rows, 'laporan-tren-pemakaian.csv');
    }

    private function csvResponse(array $rows, string $filename): HttpResponse
    {
        $handle = fopen('php://temp', 'w+');
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}