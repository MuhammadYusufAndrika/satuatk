<?php

namespace App\Services;

use App\Models\Approval;
use App\Models\ApprovalLog;
use App\Models\ApprovalRule;
use App\Models\Requests\Request as ATKRequest;
use App\Models\User;
use App\Notifications\ApprovalRequested;
use App\Services\FulfillmentService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class ApprovalService
{
public function __construct(private FulfillmentService $fulfillmentSvc) {}
    // ─── Determine required approval levels ───────────────────────────────────

    /**
     * Based on configured rules, return which levels (1,2,3) are needed
     * for the given request total value. Always includes level 1.
     */
    public function determineRequiredLevels(ATKRequest $request): array
    {
        $totalValue = $this->calculateRequestValue($request);

        $rules = ApprovalRule::getRequiredLevelsForValue($totalValue);

        // Deduplicate and extract unique levels, always at least [1]
        $levels = collect($rules)->pluck('level')->unique()->sort()->values()->toArray();

        if (empty($levels)) {
            $levels = [1];
        }

        return $levels;
    }

    /**
     * Sum (quantity × price) for all items in the request.
     */
    public function calculateRequestValue(ATKRequest $request): float
    {
        return $request->items()
            ->join('master_items', 'master_items.id', '=', 'request_items.item_id')
            ->sum(\DB::raw('request_items.quantity_requested * master_items.price'));
    }

    // ─── Create approval chain ────────────────────────────────────────────────

    /**
     * Create all required approval records for a request, in sequential order.
     * Only level 1 starts as 'pending'; higher levels start as 'waiting'.
     */
    public function createApprovalChain(ATKRequest $request): void
    {
        $levels    = $this->determineRequiredLevels($request);
        $totalVal  = $this->calculateRequestValue($request);
        $rulesByLevel = ApprovalRule::active()
            ->whereIn('level', $levels)
            ->get()
            ->keyBy('level');

        foreach ($levels as $i => $level) {
            $rule     = $rulesByLevel->get($level);
            $slaHours = $rule?->sla_hours ?? 24;
            $isFirst  = $i === 0;

            Approval::create([
                'uuid'           => Str::uuid(),
                'request_id'     => $request->id,
                'level'          => $level,
                'required_level' => $level,
                'status'         => $isFirst ? 'pending' : 'waiting',
                'due_at'         => $isFirst ? now()->addHours($slaHours) : null,
                'notified_at'    => $isFirst ? now() : null,
            ]);
        }

        // Notify approvers of the first active (pending) level
        $this->notifyApprovers($request, $levels[0] ?? 1);
    }

    /**
     * Send an ApprovalRequested database notification to all active
     * approvers at the given level (excluding the requester).
     */
    public function notifyApprovers(ATKRequest $request, int $level): void
    {
        $requesterId = $request->requested_by;

        $approvers = User::active()
            ->where('approval_level', $level)
            ->where('id', '!=', $requesterId)
            ->get(['id', 'name', 'email']);

        if ($approvers->isEmpty()) {
            return;
        }

        $pending = Approval::where('request_id', $request->id)
            ->where('level', $level)
            ->first();

        $approvalUuid = $pending?->uuid ?? (string) Str::uuid();

        Notification::send($approvers, new ApprovalRequested($request, $level, $approvalUuid));
    }

    // ─── Advance chain after an approval ─────────────────────────────────────

    /**
     * Called after an approver approves a level.
     * Finds the next 'waiting' approval for this request and activates it.
     * Returns true if chain is complete (all levels approved).
     */
    public function advanceChain(Approval $approvedApproval): bool
    {
        $request = $approvedApproval->request;

        $next = Approval::where('request_id', $request->id)
            ->where('status', 'waiting')
            ->orderBy('level')
            ->first();

                if (! $next) {
            // All levels approved — complete the request
            $request->update(['status' => 'approved']);
            $this->fulfillmentSvc->process($request);
            return true;
        }

        // Activate next level
        $rule     = ApprovalRule::active()->where('level', $next->level)->first();
        $slaHours = $rule?->sla_hours ?? 24;

        $next->update([
            'status'      => 'pending',
            'due_at'      => now()->addHours($slaHours),
            'notified_at' => now(),
        ]);

        // Notify next-level approvers
        $this->notifyApprovers($request, $next->level);

        return false;
    }

    // ─── Reject chain ─────────────────────────────────────────────────────────

    /**
     * When any level rejects, cancel all other pending/waiting approvals
     * and mark the request as rejected.
     */
    public function rejectChain(Approval $rejectedApproval): void
    {
        $request = $rejectedApproval->request;

        // Cancel remaining waiting approvals
        Approval::where('request_id', $request->id)
            ->whereIn('status', ['waiting', 'pending'])
            ->where('id', '!=', $rejectedApproval->id)
            ->update(['status' => 'cancelled']);

        $request->update(['status' => 'rejected']);
    }

    // ─── SLA helpers ─────────────────────────────────────────────────────────

    /**
     * Returns all pending approvals that are overdue.
     */
    public function getOverdueApprovals()
    {
        return Approval::where('status', 'pending')
            ->whereNotNull('due_at')
            ->where('due_at', '<', now())
            ->with(['request.requester'])
            ->get();
    }

    /**
     * SLA status string for a pending approval: 'ok', 'warning' (< 2h), 'overdue'.
     */
    public function getSlaStatus(Approval $approval): string
    {
        if (! $approval->due_at || $approval->status !== 'pending') {
            return 'ok';
        }

        $minutesLeft = now()->diffInMinutes($approval->due_at, false); // negative = overdue

        if ($minutesLeft < 0) return 'overdue';
        if ($minutesLeft < 120) return 'warning';
        return 'ok';
    }

    // ─── Log helper ──────────────────────────────────────────────────────────

    public function log(Approval $approval, string $action, ?string $notes = null): void
    {
        ApprovalLog::create([
            'approval_id' => $approval->id,
            'user_id'     => Auth::id(),
            'action'      => $action,
            'notes'       => $notes,
            'ip_address'  => request()->ip(),
        ]);
    }
}
