<?php

namespace App\Notifications;

use App\Models\MasterItem;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StockNearSafetyLevel extends Notification
{
    use Queueable;

    public function __construct(
        public MasterItem $item,
        public int $available,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'        => 'Stok Mendekati Batas Aman',
            'message'      => "Stok {$this->item->name} tersisa {$this->available}, sudah mendekati/di bawah safety stock ({$this->item->safety_stock}).",
            'item_id'      => $this->item->id,
            'item_name'    => $this->item->name,
            'available'    => $this->available,
            'safety_stock' => $this->item->safety_stock,
            'url'          => route('requests.reorder', ['highlight' => $this->item->id]),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}