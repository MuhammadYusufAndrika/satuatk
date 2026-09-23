<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use Illuminate\Support\Str;

class MasterItem extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
    'uuid', 'code', 'name', 'brand', 'model', 'description', 'image',
    'category_id', 'unit_id', 'supplier_id', 'price',
    'min_stock', 'max_stock', 'safety_stock', 'min_request', 'max_request', 'stock',
    'barcode', 'qr_code', 'is_active',
];
protected $casts = [
    'is_active' => 'boolean',
    'price' => 'decimal:2',
    'min_stock' => 'integer',
    'max_stock' => 'integer',
    'safety_stock' => 'integer',
    'min_request' => 'integer',
    'max_request' => 'integer',
    'stock' => 'integer',
];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(fn($m) => $m->uuid ??= Str::uuid()->toString());
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()->logOnly(['name', 'code', 'is_active'])->logOnlyDirty();
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MasterCategory::class, 'category_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(MasterUnit::class, 'unit_id');
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(MasterSupplier::class, 'supplier_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(InventoryStock::class, 'item_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(InventoryTransaction::class, 'item_id');
    }

    public function getTotalStockAttribute(): int
    {
        return $this->stocks()->sum('quantity');
    }

    public function getAvailableStockAttribute(): int
    {
        return $this->stocks()->selectRaw('SUM(quantity - reserved_quantity) as available')->value('available') ?? 0;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeLowStock($query)
    {
        return $query->whereHas('stocks', function ($q) {
            $q->whereRaw('quantity <= master_items.min_stock');
        });
    }
}
