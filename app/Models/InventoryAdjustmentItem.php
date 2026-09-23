<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryAdjustmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'adjustment_id',
        'item_id',
        'location_id',
        'quantity_before',
        'quantity_adjustment',
        'quantity_after',
        'notes',
    ];

    protected $casts = [
        'quantity_before'     => 'integer',
        'quantity_adjustment' => 'integer',
        'quantity_after'      => 'integer',
    ];

    public function adjustment(): BelongsTo
    {
        return $this->belongsTo(InventoryAdjustment::class, 'adjustment_id');
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
