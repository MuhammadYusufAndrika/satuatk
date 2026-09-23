<?php

namespace App\Notifications;

use App\Models\PickupSchedule;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PickupReadyForPreparation extends Notification
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
            'title'          => 'Permintaan Baru Siap Diproses',
            'message'        => "Permintaan {$this->request->request_number} — {$this->request->title} sudah disetujui dan menunggu proses picking.",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'pickup_uuid'    => $this->pickup->uuid,
            'url'            => route('distribution.show', $this->pickup->uuid),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}