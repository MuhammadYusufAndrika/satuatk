<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'item_id',
        'location_id',
        'quantity',
        'reserved_quantity',
    ];

    protected $casts = [
        'quantity'         => 'integer',
        'reserved_quantity' => 'integer',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(MasterItem::class, 'item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(MasterLocation::class, 'location_id');
    }
}
