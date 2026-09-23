<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalLog extends Model
{
    protected $fillable = [
        'approval_id',
        'user_id',
        'action',
        'notes',
        'ip_address',
    ];

    public function approval() { return $this->belongsTo(Approval::class); }
    public function user()     { return $this->belongsTo(User::class); }
}
