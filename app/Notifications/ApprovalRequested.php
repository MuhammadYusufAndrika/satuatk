<?php

namespace App\Notifications;

use App\Models\Approval;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApprovalRequested extends Notification
{
    use Queueable;

    public function __construct(
        public ATKRequest $request,
        public int $level,
        public string $approvalUuid,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title'   => "Persetujuan Level {$this->level} Dibutuhkan",
            'message' => "Permintaan {$this->request->request_number} — {$this->request->title} membutuhkan persetujuan Anda (Level {$this->level}).",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'approval_uuid'  => $this->approvalUuid,
            'level'          => $this->level,
            'url'            => route('approvals.show', $this->approvalUuid),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
