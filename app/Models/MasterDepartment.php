<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MasterDepartment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid', 'code', 'name', 'description', 'parent_id', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MasterDepartment::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MasterDepartment::class, 'parent_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'department_id');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
