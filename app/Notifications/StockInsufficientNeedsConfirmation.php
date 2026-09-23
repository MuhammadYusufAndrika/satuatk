<?php
namespace App\Notifications;
use App\Models\Requests\Request as ATKRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
class StockInsufficientNeedsConfirmation extends Notification
{
    use Queueable;
    public function __construct(
        public ATKRequest $request,
        public Collection $availability,
    ) {}
    public function via(object $notifiable): array
    {
        return ['database'];
    }
    public function toDatabase(object $notifiable): array
    {
        $kurang = $this->availability->where('status', '!=', 'cukup')->pluck('item_name')->implode(', ');
        return [
            'title'   => 'Konfirmasi Pemenuhan Diperlukan',
            'message' => "Stok tidak mencukupi untuk beberapa barang pada permintaan {$this->request->request_number}: {$kurang}. Mohon tinjau dan konfirmasi.",
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