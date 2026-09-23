<?php

namespace App\Models\Requests;

use App\Models\MasterItem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RequestItem extends Model
{
    protected $fillable = [
        'request_id', 'item_id', 'quantity_requested',
        'quantity_approved', 'quantity_fulfilled', 'status', 'notes',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'quantity_approved'  => 'integer',
        'quantity_fulfilled' => 'integer',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(Request::class, 'request_id');
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(MasterItem::class, 'item_id');
    }
}
