<?php

namespace App\Models;

use App\Models\Requests\Request as ATKRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PickupSchedule extends Model
{
    use SoftDeletes;

    const STATUS_SCHEDULED = 'scheduled';
    const STATUS_READY = 'ready';
    const STATUS_PICKED_UP = 'picked_up';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'uuid', 'pickup_number', 'request_id', 'status',
        'scheduled_date', 'pickup_time', 'qr_code',
        'prepared_by', 'prepared_at', 'notes',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'prepared_at'    => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(ATKRequest::class, 'request_id');
    }

    public function preparedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    public function log(): HasOne
    {
        return $this->hasOne(PickupLog::class, 'pickup_schedule_id');
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_SCHEDULED => 'Terjadwal',
            self::STATUS_READY     => 'Siap Diambil',
            self::STATUS_PICKED_UP => 'Sudah Diambil',
            self::STATUS_CANCELLED => 'Dibatalkan',
            default => ucfirst($this->status),
        };
    }

    public function scopeStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
