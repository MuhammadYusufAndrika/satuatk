<?php

namespace App\Console\Commands;

use App\Models\MasterItem;
use App\Models\User;
use App\Notifications\StockNearSafetyLevel;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckStockSafetyLevels extends Command
{
    protected $signature = 'stock:check-alerts';
    protected $description = 'Cek stok yang mendekati/di bawah safety stock dan kirim notifikasi ke Admin Gudang';

    public function handle(): void
    {
        $admins = User::role('Admin')->get();

        if ($admins->isEmpty()) {
            $this->warn('Tidak ada user dengan role Admin, notifikasi tidak dikirim.');
            return;
        }

        $items = MasterItem::active()
            ->whereNotNull('safety_stock')
            ->where('safety_stock', '>', 0)
            ->selectRaw('master_items.*, (SELECT COALESCE(SUM(quantity - reserved_quantity), 0) FROM inventory_stocks WHERE item_id = master_items.id) as available_stock')
            ->get()
            ->filter(fn ($item) => $item->available_stock <= $item->safety_stock);

        foreach ($items as $item) {
            // Jangan spam — skip kalau item ini sudah pernah dikasih notif dalam 24 jam terakhir
            $alreadyNotifiedToday = DB::table('notifications')
                ->where('type', StockNearSafetyLevel::class)
                ->where('data->item_id', $item->id)
                ->where('created_at', '>=', now()->subDay())
                ->exists();

            if ($alreadyNotifiedToday) {
                continue;
            }

            foreach ($admins as $admin) {
                $admin->notify(new StockNearSafetyLevel($item, (int) $item->available_stock));
            }

            $this->info("Notifikasi terkirim untuk: {$item->name} (tersisa {$item->available_stock})");
        }
    }
}