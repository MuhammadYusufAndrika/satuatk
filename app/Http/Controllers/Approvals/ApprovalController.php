<?php

namespace App\Http\Controllers\Approvals;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\ApprovalLog;
use App\Models\MasterItem;
use App\Models\User;
use App\Services\ApprovalService;
use App\Notifications\ApprovalCompleted;
use App\Notifications\StockAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function __construct(private ApprovalService $svc) {}

    // ─── Index: approval queue ────────────────────────────────────────────────

    public function index(Request $request): Response
    {
        $user = $request->user();

        $query = Approval::with([
                'request.department',
                'request.requester',
                'request.items.item',
                'approver',
            ])
            // Permintaan yang sudah Dibatalkan tidak boleh muncul di antrean.
            ->whereHas('request', fn ($q) => $q->where('status', '!=', 'cancelled'))
            ->when($request->status, fn($q, $s) => $q->where('status', $s));

        // Admin melihat semua approval tanpa filter level.
        // SM dan GM masing-masing hanya melihat approval yang levelnya sesuai dengan level dia sendiri.
        if (! $user->hasRole('Admin')) {
            $query->where('required_level', $user->approval_level);
        }

        // Filter by level
        if ($request->level) {
            $query->where('level', $request->level);
        }

        $approvals = $query
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'waiting' THEN 1 ELSE 2 END")
            ->orderBy('due_at')
            ->paginate(20)
            ->withQueryString();

        // Attach SLA info to each approval
        $approvals->getCollection()->transform(function ($a) {
            $a->sla_status         = $a->sla_status;
            $a->sla_remaining_label = $a->sla_remaining_label;
            return $a;
        });

        // Statistik juga tidak menghitung permintaan yang Dibatalkan.
        $stats = [
            'pending'  => $this->activeApprovals()->where('status', 'pending')->count(),
            'waiting'  => $this->activeApprovals()->where('status', 'waiting')->count(),
            'approved' => $this->activeApprovals()->where('status', 'approved')->count(),
            'rejected' => $this->activeApprovals()->where('status', 'rejected')->count(),
            'overdue'  => $this->activeApprovals()
                ->where('status', 'pending')
                ->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->count(),
        ];

        return Inertia::render('Approvals/Index', [
            'approvals' => $approvals,
            'filters'   => $request->only('status', 'level'),
            'stats'     => $stats,
        ]);
    }

    // ─── Show: single approval detail ────────────────────────────────────────

    public function show(Approval $approval): Response
    {
        $approval->load([
            'request.department',
            'request.requester',
            'request.items.item.unit',
            'request.items.item.category',
            'approver',
            'logs.user',
        ]);

        // Load all approvals in the chain for this request
        $chain = Approval::where('request_id', $approval->request_id)
            ->with('approver')
            ->orderBy('level')
            ->get()
            ->map(function ($a) {
                $a->sla_status          = $a->sla_status;
                $a->sla_remaining_label = $a->sla_remaining_label;
                return $a;
            });

        $approval->sla_status          = $approval->sla_status;
        $approval->sla_remaining_label = $approval->sla_remaining_label;

        return Inertia::render('Approvals/Show', [
            'approval' => $approval,
            'chain'    => $chain,
            // Dipakai frontend untuk menonaktifkan tombol Setujui/Tolak.
            'canAct'   => $approval->status === 'pending' && ! $this->isRequestCancelled($approval),
        ]);
    }

    // ─── Approve ──────────────────────────────────────────────────────────────

    public function approve(Request $request, Approval $approval): RedirectResponse
    {
        // Tolak aksi pada permintaan yang sudah Dibatalkan (validasi sisi server).
        if ($this->isRequestCancelled($approval)) {
            return redirect()->route('approvals.index')
                ->with('error', 'Permintaan ini sudah dibatalkan oleh pemohon dan tidak dapat diproses.');
        }

        abort_unless($approval->status === 'pending', 422, 'Persetujuan tidak bisa diproses (status: ' . $approval->status . ').');

        $user = $request->user();
        // General Manager (Level 2) atau level yang sesuai dengan required_level bisa memproses
        abort_unless($user->approval_level >= 2 || $user->approval_level === $approval->required_level, 403, 'Level approval Anda tidak sesuai untuk menyetujui ini.');

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($approval, $validated, $request) {
            // Mark this level as approved
            $approval->update([
                'status'      => 'approved',
                'approver_id' => $request->user()->id,
                'notes'       => $validated['notes'] ?? null,
                'action_at'   => now(),
            ]);

            // Log action
            $this->svc->log($approval, 'approved', $validated['notes'] ?? null);

            $chainComplete = $this->svc->advanceChain($approval);

            // Only reserve stock once the entire chain is complete
            if ($chainComplete) {
                // Approval chain selesai. FulfillmentService::process() sudah dipanggil
                // dari ApprovalService::advanceChain(), jadi jangan dipanggil lagi di sini.


                // Notify the requester that the request has been fully approved
                $approval->request->requestedBy?->notify(new ApprovalCompleted($approval->request, 'approved'));
            }
        });

        $approval->refresh();
        $chainDone = Approval::where('request_id', $approval->request_id)
            ->where('status', 'waiting')->doesntExist()
            && $approval->request->fresh()->status === 'approved';

        $msg = $chainDone
            ? 'Seluruh rantai approval selesai. Permintaan disetujui.'
            : 'Disetujui. Menunggu level approval berikutnya.';

        return redirect()->route('approvals.index')->with('success', $msg);
    }

    // ─── Reject ───────────────────────────────────────────────────────────────

    public function reject(Request $request, Approval $approval): RedirectResponse
    {
        // Tolak aksi pada permintaan yang sudah Dibatalkan (validasi sisi server).
        if ($this->isRequestCancelled($approval)) {
            return redirect()->route('approvals.index')
                ->with('error', 'Permintaan ini sudah dibatalkan oleh pemohon dan tidak dapat diproses.');
        }

        abort_unless($approval->status === 'pending', 422, 'Persetujuan tidak bisa diproses (status: ' . $approval->status . ').');

        $user = $request->user();
        // General Manager (Level 2) atau level yang sesuai dengan required_level bisa menolak
        abort_unless($user->approval_level >= 2 || $user->approval_level === $approval->required_level, 403, 'Level approval Anda tidak sesuai untuk menolak ini.');

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($approval, $validated, $request) {
            $approval->update([
                'status'      => 'rejected',
                'approver_id' => $request->user()->id,
                'notes'       => $validated['notes'],
                'action_at'   => now(),
            ]);

            $this->svc->log($approval, 'rejected', $validated['notes']);
            $this->svc->rejectChain($approval);

            // Mark all request items as rejected
            $approval->request->items()->update(['status' => 'rejected']);

            // Notify the requester that the request was rejected
            $approval->request->requestedBy?->notify(new ApprovalCompleted($approval->request, 'rejected'));
        });

        return redirect()->route('approvals.index')->with('success', 'Permintaan ditolak dan semua level lain dibatalkan.');
    }

    // ─── Add comment (without approve/reject) ────────────────────────────────

    public function comment(Request $request, Approval $approval): RedirectResponse
    {
        if ($this->isRequestCancelled($approval)) {
            return back()->with('error', 'Permintaan ini sudah dibatalkan oleh pemohon dan tidak dapat diproses.');
        }

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $this->svc->log($approval, 'commented', $validated['notes']);

        return back()->with('success', 'Komentar berhasil ditambahkan.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Query dasar approval yang permintaannya belum Dibatalkan.
     */
    private function activeApprovals()
    {
        return Approval::whereHas('request', fn ($q) => $q->where('status', '!=', 'cancelled'));
    }

    /**
     * Apakah permintaan milik approval ini sudah berstatus Dibatalkan?
     * Selalu ambil status terbaru dari database, supaya tab lama yang belum
     * di-refresh tetap ditolak.
     */
    private function isRequestCancelled(Approval $approval): bool
    {
        return $approval->request()->value('status') === 'cancelled';
    }

    /**
     * Cek apakah stok item ini sudah mendekati/di bawah batas minimum
     * setelah reservasi, dan kalau iya, kirim notifikasi ke semua Admin.
     */
    private function checkStockAlert(int $itemId): void
    {
        $item = MasterItem::find($itemId);
        if (! $item) {
            return;
        }

        $totalStock = \App\Models\InventoryStock::where('item_id', $itemId)->sum('quantity');
        $reserved   = \App\Models\InventoryStock::where('item_id', $itemId)->sum('reserved_quantity');
        $available  = $totalStock - $reserved;
        $minStock   = $item->min_stock ?? 0;

        if ($available <= $minStock) {
            $admins = User::role('Admin')->get();
            Notification::send($admins, new StockAlert($item, $available));
        }
    }
}