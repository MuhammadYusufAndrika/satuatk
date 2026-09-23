<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class StockOpname extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'opname_number',
        'title',
        'description',
        'location_id',
        'status',
        'opname_date',
        'started_at',
        'completed_at',
        'created_by',
        'completed_by',
    ];

    protected $casts = [
        'opname_date'   => 'date',
        'started_at'    => 'datetime',
        'completed_at'  => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(MasterLocation::class, 'location_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class, 'opname_id');
    }
}
