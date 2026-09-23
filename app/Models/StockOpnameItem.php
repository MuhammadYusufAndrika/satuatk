<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class StockOpnameItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'opname_id',
        'item_id',
        'location_id',
        'system_quantity',
        'physical_quantity',
        'difference',
        'notes',
    ];

    protected $casts = [
        'system_quantity'   => 'integer',
        'physical_quantity' => 'integer',
        'difference'        => 'integer',
    ];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MasterItem::class, 'item_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(MasterLocation::class, 'location_id');
    }
}
