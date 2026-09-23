<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MasterCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['uuid', 'code', 'name', 'description', 'icon', 'parent_id', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function parent() { return $this->belongsTo(MasterCategory::class, 'parent_id'); }
    public function children() { return $this->hasMany(MasterCategory::class, 'parent_id'); }
    public function items() { return $this->hasMany(MasterItem::class, 'category_id'); }
    public function scopeActive($query) { return $query->where('is_active', true); }
}
