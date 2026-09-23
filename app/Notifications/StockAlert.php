<?php

namespace App\Notifications;

use App\Models\MasterItem;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockAlert extends Notification
{
    use Queueable;

    public function __construct(
        public MasterItem $item,
        public int $availableStock,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $unit = $this->item->unit?->symbol ?? $this->item->unit?->name ?? '';

        return [
            'title'   => 'Stok Menipis: ' . $this->item->name,
            'message' => "Stok {$this->item->name} tersisa {$this->availableStock} {$unit}, sudah mendekati/di bawah batas minimum ({$this->item->min_stock} {$unit}). Segera lakukan pengadaan.",
            'item_id'   => $this->item->id,
            'item_name' => $this->item->name,
            'available_stock' => $this->availableStock,
            'min_stock'       => $this->item->min_stock,
            'url' => route('reports.inventory', ['item_id' => $this->item->id]),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}