<?php

namespace App\Notifications;

use App\Models\PickupSchedule;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PickupReadyForCollection extends Notification
{
    use Queueable;

    public function __construct(
        public ATKRequest $request,
        public PickupSchedule $pickup,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'          => 'Barang Siap Diambil',
            'message'        => "Permintaan {$this->request->request_number} — {$this->request->title} sudah disiapkan Admin Gudang dan siap diambil.",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'pickup_uuid'    => $this->pickup->uuid,
            'url'            => route('requests.show', $this->request->uuid),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}