<?php

namespace App\Notifications;

use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RequestSubmitted extends Notification
{
    use Queueable;

    public function __construct(public ATKRequest $request) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'   => 'Permintaan Diajukan',
            'message' => "Permintaan {$this->request->request_number} — {$this->request->title} telah diajukan dan sedang menunggu persetujuan.",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'url'            => route('requests.show', $this->request->uuid),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
