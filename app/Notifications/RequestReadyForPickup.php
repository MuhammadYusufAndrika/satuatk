<?php
namespace App\Notifications;
use App\Models\Requests\Request as ATKRequest;
use App\Models\PickupSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
class RequestReadyForPickup extends Notification
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
            'title'   => 'Permintaan Siap Diproses Distribusi',
            'message' => "Permintaan {$this->request->request_number} â€” {$this->request->title} telah lolos pengecekan stok dan dijadwalkan untuk pengambilan ({$this->pickup->pickup_number}).",
            'request_number' => $this->request->request_number,
            'request_uuid'   => $this->request->uuid,
            'pickup_number'  => $this->pickup->pickup_number,
            'url'            => route('requests.show', $this->request->uuid),
        ];
    }
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}