<?php

namespace App\Notifications;

use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApprovalCompleted extends Notification
{
    use Queueable;

    public function __construct(
        public ATKRequest $request,
        public string $status = 'approved', // approved | rejected
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $approved = $this->status === 'approved';
        return [
            'title'   => $approved ? 'Permintaan Disetujui' : 'Permintaan Ditolak',
            'message' => $approved
                ? "Permintaan {$this->request->request_number} — {$this->request->title} telah disetujui seluruhnya."
                : "Permintaan {$this->request->request_number} — {$this->request->title} telah ditolak.",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'status'         => $this->status,
            'url'            => route('requests.show', $this->request->uuid),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
