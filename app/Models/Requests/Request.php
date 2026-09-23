<?php

namespace App\Models\Requests;

use App\Models\MasterDepartment;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Illuminate\Support\Str;

class Request extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $table = 'requests';

    protected $fillable = [
    'uuid', 'request_number', 'title', 'description', 'category', 'status',
    'department_id', 'requested_by', 'needed_date', 'delivery_point', 'notes', 'attachment',
    'submitted_at', 'fulfilled_at', 'fulfillment_status',
];

    protected $casts = [
        'needed_date' => 'date',
        'submitted_at' => 'datetime',
        'fulfilled_at' => 'datetime',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_SUBMITTED = 'submitted';
    const STATUS_APPROVED = 'approved';
    const STATUS_PARTIALLY_APPROVED = 'partially_approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_FULFILLED = 'fulfilled';
    const STATUS_CANCELLED = 'cancelled';

    const CATEGORY_REGULAR = 'regular';
    const CATEGORY_URGENT = 'urgent';
    const FULFILLMENT_AWAITING_CONFIRMATION = 'awaiting_confirmation';
    const FULFILLMENT_CANCELLED_STOCK = 'cancelled_stock';
    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['status', 'category'])->logOnlyDirty();
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(MasterDepartment::class, 'department_id');
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(RequestItem::class, 'request_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(\App\Models\Approval::class, 'request_id');
    }

    public function currentApproval(): HasOne
    {
        return $this->hasOne(\App\Models\Approval::class, 'request_id')
            ->where('status', 'pending')
            ->orderBy('level');
    }

    public function pickupSchedule(): HasOne
    {
        return $this->hasOne(\App\Models\PickupSchedule::class, 'request_id');
    }

    public function scopeForUser($query, User $user)
    {
        if ($user->hasPermissionTo('request.view-all')) {
            return $query;
        }
        return $query->where('requested_by', $user->id);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_SUBMITTED => 'Diajukan',
            self::STATUS_APPROVED => 'Disetujui',
            self::STATUS_PARTIALLY_APPROVED => 'Disetujui Sebagian',
            self::STATUS_REJECTED => 'Ditolak',
            self::STATUS_FULFILLED => 'Selesai',
            self::STATUS_CANCELLED => 'Dibatalkan',
            default => ucfirst($this->status),
        };
    }
}
