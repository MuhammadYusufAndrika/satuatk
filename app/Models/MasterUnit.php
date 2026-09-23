<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MasterUnit extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['uuid', 'code', 'name', 'symbol', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function scopeActive($query) { return $query->where('is_active', true); }
}
