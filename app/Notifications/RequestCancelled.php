<?php

namespace App\Notifications;

use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RequestCancelled extends Notification
{
    use Queueable;

    public function __construct(
        public ATKRequest $request,
        public ?string $reason = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'   => 'Permintaan Dibatalkan',
            'message' => $this->reason
                ? "Permintaan {$this->request->request_number} — {$this->request->title} dibatalkan. {$this->reason}"
                : "Permintaan {$this->request->request_number} — {$this->request->title} dibatalkan.",
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