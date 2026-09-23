<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PickupLog extends Model
{
    public $timestamps = true;

    protected $fillable = [
        'pickup_schedule_id', 'picked_up_by', 'picked_up_at',
        'signature_path', 'proof_notes',
    ];

    protected $casts = [
        'picked_up_at' => 'datetime',
    ];

    public function pickupSchedule(): BelongsTo
    {
        return $this->belongsTo(PickupSchedule::class);
    }

    public function pickedUpBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'picked_up_by');
    }
}
