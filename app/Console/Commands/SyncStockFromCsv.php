<?php

namespace App\Console\Commands;

use App\Models\InventoryStock;
use App\Models\MasterItem;
use Illuminate\Console\Command;

class SyncStockFromCsv extends Command
{
    protected $signature = 'stock:sync-from-csv {path=storage/app/master_item_sync.csv}';
    protected $description = 'Sinkronkan price, min/max stock, safety stock, min/max request, dan quantity dari CSV';

    public function handle(): int
    {
        $path = base_path($this->argument('path'));

        if (! file_exists($path)) {
            $this->error("File tidak ditemukan: {$path}");
            return self::FAILURE;
        }

        $rows = array_map('str_getcsv', file($path));
        $header = array_shift($rows); // code, price, min_stock, max_stock, safety_stock, min_request, max_request, stock

        $updated = 0;
        $notFound = [];
        $noStockRow = [];

        foreach ($rows as $row) {
            if (count($row) < 8) {
                continue;
            }

            [$code, $price, $minStock, $maxStock, $safetyStock, $minRequest, $maxRequest, $stock] = $row;
            $code = trim($code);

            $item = MasterItem::where('code', $code)->first();

            if (! $item) {
                $notFound[] = $code;
                continue;
            }

            $item->update([
                'price'        => (float) $price,
                'min_stock'    => (int) $minStock,
                'max_stock'    => (int) $maxStock,
                'safety_stock' => (int) $safetyStock,
                'min_request'  => (int) $minRequest,
                'max_request'  => (int) $maxRequest,
                'stock'        => (int) $stock,
            ]);

            $stockRow = InventoryStock::where('item_id', $item->id)->first();

            if (! $stockRow) {
                $noStockRow[] = $code;
                continue;
            }

            $stockRow->update(['quantity' => (int) $stock]);
            $updated++;
        }

        $this->info("Berhasil update {$updated} barang (master data + quantity).");

        if (! empty($notFound)) {
            $this->warn('Kode tidak ditemukan di master_items (' . count($notFound) . '): ' . implode(', ', $notFound));
        }

        if (! empty($noStockRow)) {
            $this->warn('Barang belum punya baris inventory_stocks (' . count($noStockRow) . '): ' . implode(', ', $noStockRow));
        }

        return self::SUCCESS;
    }
}