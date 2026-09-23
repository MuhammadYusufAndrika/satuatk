<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'uuid',
        'item_id',
        'location_id',
        'transaction_type',
        'reference_type',
        'reference_id',
        'reference_number',
        'quantity_before',
        'quantity_change',
        'quantity_after',
        'notes',
        'created_by',
    ];
}
