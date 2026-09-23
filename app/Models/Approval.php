<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use App\Models\Requests\Request as ATKRequest;

class Approval extends Model
{
    protected $fillable = [
        'uuid',
        'request_id',
        'level',
        'required_level',
        'status',
        'approver_id',
        'notes',
        'action_at',
        'due_at',
        'notified_at',
    ];

    protected $casts = [
        'level'          => 'integer',
        'required_level' => 'integer',
        'action_at'      => 'datetime',
        'due_at'         => 'datetime',
        'notified_at'    => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function request(): BelongsTo
    {
        return $this->belongsTo(ATKRequest::class, 'request_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ApprovalLog::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    public function getLevelLabelAttribute(): string
    {
        return match ($this->level) {
            1 => 'Level 1',
            2 => 'Level 2 (SM)',
            3 => 'Level 3 (GM)',
            default => "Level {$this->level}",
        };
    }

    public function getSlaStatusAttribute(): string
    {
        if (! $this->due_at || $this->status !== 'pending') {
            return 'ok';
        }
        $minutesLeft = now()->diffInMinutes($this->due_at, false);
        if ($minutesLeft < 0)   return 'overdue';
        if ($minutesLeft < 120) return 'warning';
        return 'ok';
    }

    public function getSlaRemainingLabelAttribute(): ?string
    {
        if (! $this->due_at || $this->status !== 'pending') return null;

        $minutesLeft = now()->diffInMinutes($this->due_at, false);

        if ($minutesLeft < 0) {
            return 'Overdue ' . now()->diff($this->due_at)->format('%h j %i m');
        }

        $h = intdiv($minutesLeft, 60);
        $m = $minutesLeft % 60;
        return $h > 0 ? "{$h}j {$m}m tersisa" : "{$m}m tersisa";
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser($query, User $user)
    {
        // Only show approvals that require at most this user's approval_level
        return $query->where('required_level', '<=', $user->approval_level);
    }
}
