<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalRule extends Model
{
    protected $fillable = [
        'name',
        'level',
        'min_value',
        'max_value',
        'sla_hours',
        'description',
        'is_active',
    ];

    protected $casts = [
        'level'      => 'integer',
        'min_value'  => 'decimal:2',
        'max_value'  => 'decimal:2',
        'sla_hours'  => 'integer',
        'is_active'  => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get all levels required for a given request total value.
     * Returns array of active rules that apply, ordered by level asc.
     */
    public static function getRequiredLevelsForValue(float $totalValue): array
    {
        return static::active()
            ->where('min_value', '<=', $totalValue)
            ->orderBy('level')
            ->get()
            ->toArray();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getLevelLabelAttribute(): string
    {
        return match ($this->level) {
            1 => 'Level 1 (Admin)',
            2 => 'Level 2 (SM)',
            3 => 'Level 3 (GM)',
            default => "Level {$this->level}",
        };
    }
}
