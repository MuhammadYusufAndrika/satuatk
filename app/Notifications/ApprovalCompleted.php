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
        public string $status = 'approved', // approved | rejected | unavailable
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        [$title, $message] = match ($this->status) {
            'approved' => [
                'Permintaan Disetujui',
                "Permintaan {$this->request->request_number} — {$this->request->title} telah disetujui seluruhnya.",
            ],
            'rejected' => [
                'Permintaan Ditolak',
                "Permintaan {$this->request->request_number} — {$this->request->title} telah ditolak.",
            ],
            'unavailable' => [
                'Permintaan Tidak Dapat Dipenuhi',
                "Permintaan {$this->request->request_number} — {$this->request->title} tidak dapat dipenuhi karena seluruh barang berstok kosong.",
            ],
            default => [
                'Status Permintaan Diperbarui',
                "Status permintaan {$this->request->request_number} diperbarui.",
            ],
        };

        return [
            'title'   => $title,
            'message' => $message,
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