<?php

namespace Database\Seeders;

use App\Models\InventoryStock;
use App\Models\InventoryTransaction;
use App\Models\MasterCategory;
use App\Models\MasterItem;
use App\Models\MasterLocation;
use App\Models\MasterUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ItemSeeder extends Seeder
{
    public function run(): void
    {
        $location = MasterLocation::where('code', 'GDG-UTAMA')->firstOrFail();
        $admin    = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'Admin'))->first();

        // ─── Helper closures ──────────────────────────────────────────────────
        $cat  = fn(string $code) => MasterCategory::where('code', $code)->value('id');
        $unit = fn(string $code) => MasterUnit::where('code', $code)->value('id');

        // ─── Item catalogue ───────────────────────────────────────────────────
        // Format: [code, name, brand, category_code, unit_code, price, min_stock, max_stock, description, initial_stock]
        $items = [

            // ── Alat Tulis ────────────────────────────────────────────────────
            ['ATK-001', 'Pulpen Ballpoint',         'Pilot',      'ALAT_TULIS', 'PCS',  3_500,  20, 100, 'Pulpen tinta hitam 0.7mm',      50],
            ['ATK-002', 'Pulpen Ballpoint Merah',   'Snowman',    'ALAT_TULIS', 'PCS',  3_000,  10,  50, 'Pulpen tinta merah 0.7mm',       30],
            ['ATK-003', 'Pensil 2B',                'Faber-Castell','ALAT_TULIS','PCS', 2_500,  10,  50, 'Pensil kayu 2B untuk menulis',   24],
            ['ATK-004', 'Spidol Whiteboard',        'Snowman',    'ALAT_TULIS', 'PCS',  8_000,   5,  30, 'Spidol whiteboard tinta hitam',  15],
            ['ATK-005', 'Spidol Permanent',         'Artline',    'ALAT_TULIS', 'PCS',  6_500,   5,  30, 'Spidol permanent warna hitam',   20],
            ['ATK-006', 'Marker Highlighter',       'Joyko',      'ALAT_TULIS', 'PCS',  4_000,  10,  40, 'Stabilo / highlighter kuning',   24],
            ['ATK-007', 'Penghapus Pensil',         'Faber-Castell','ALAT_TULIS','PCS', 2_000,  10,  50, 'Penghapus karet putih',          36],
            ['ATK-008', 'Penggaris 30cm',           'Joyko',      'ALAT_TULIS', 'PCS',  5_000,   5,  20, 'Penggaris plastik 30cm',         12],
            ['ATK-009', 'Gunting Besar',            'Kangaro',    'ALAT_TULIS', 'PCS', 15_000,   5,  15, 'Gunting kertas ukuran besar',     8],
            ['ATK-010', 'Cutter / Pisau Kertas',    'NT',         'ALAT_TULIS', 'PCS',  8_500,   5,  20, 'Cutter kertas L-300',            10],
            ['ATK-011', 'Stapler Sedang',           'Max',        'ALAT_TULIS', 'PCS', 35_000,   3,  10, 'Stapler ukuran sedang HD-10',     5],
            ['ATK-012', 'Isi Staples No.10',        'Max',        'ALAT_TULIS', 'BOX',  5_000,   5,  20, 'Refill staples no.10 isi 1000',  10],
            ['ATK-013', 'Lem Stick Glue',           'UHU',        'ALAT_TULIS', 'PCS',  8_000,   5,  25, 'Lem stik 21gr',                  12],
            ['ATK-014', 'Double Tape',              'Kenko',      'ALAT_TULIS', 'PCS',  7_500,   5,  20, 'Double tape 1 inch x 10m',       10],
            ['ATK-015', 'Selotip Bening',           'Kenko',      'ALAT_TULIS', 'PCS',  4_500,  10,  30, 'Selotip/tape bening 1" x 36m',   15],
            ['ATK-016', 'Klip Kertas (Binder Clip)','Joyko',      'ALAT_TULIS', 'BOX',  6_000,   5,  20, 'Binder clip 25mm isi 12 buah',   10],
            ['ATK-017', 'Paper Clip / Klip Kecil',  'Deli',       'ALAT_TULIS', 'BOX',  3_500,   5,  20, 'Paper clip logam kecil isi 100', 15],
            ['ATK-018', 'Pita Koreksi / Correction Tape','Kenko', 'ALAT_TULIS', 'PCS',  9_000,   5,  20, 'Tipe-x pita putih 5mm x 8m',    12],
            ['ATK-019', 'Tinta Koreksi Cair',       'Kenko',      'ALAT_TULIS', 'PCS',  5_000,   5,  20, 'Tipe-x cair putih 7ml',         10],
            ['ATK-020', 'Sticky Note / Post-it',    '3M',         'ALAT_TULIS', 'PKT', 12_000,   5,  20, 'Sticky note kuning 75x75mm 4pad', 8],
            ['ATK-021', 'Amplop Putih A4',          'Sinar Dunia','ALAT_TULIS', 'BOX', 25_000,   3,  10, 'Amplop putih ukuran A4 isi 50',   5],
            ['ATK-022', 'Map Snelhecter Plastik',   'Bantex',     'ALAT_TULIS', 'PCS',  5_500,  10,  40, 'Map plastik dengan klip snelhecter',20],
            ['ATK-023', 'Ordner / Binder A4',       'Bantex',     'ALAT_TULIS', 'PCS', 28_000,   3,  15, 'Ordner A4 lebar 8cm warna hitam', 8],
            ['ATK-024', 'Penjepit Kertas Kupu-kupu','Deli',       'ALAT_TULIS', 'BOX',  8_000,   3,  15, 'Penjepit butterfly clip isi 50',  6],

            // ── Kertas & Formulir ─────────────────────────────────────────────
            ['KER-001', 'Kertas HVS A4 70gr',       'Sinar Dunia','KERTAS',    'RIM',  45_000,   5,  30, 'Kertas HVS A4 70gr isi 500 lembar', 20],
            ['KER-002', 'Kertas HVS A4 80gr',       'Paperone',   'KERTAS',    'RIM',  55_000,   5,  20, 'Kertas HVS A4 80gr isi 500 lembar', 15],
            ['KER-003', 'Kertas HVS F4/Folio 70gr', 'Sinar Dunia','KERTAS',    'RIM',  48_000,   3,  15, 'Kertas HVS folio 70gr isi 500 lembar',10],
            ['KER-004', 'Buku Tulis 58 Halaman',    'Sidu',       'KERTAS',    'PCS',  4_000,  10,  50, 'Buku tulis garis isi 58 hal',     24],
            ['KER-005', 'Buku Agenda Harian',       'At-a-Glance','KERTAS',    'PCS', 35_000,   2,  10, 'Agenda harian hardcover A5',       5],
            ['KER-006', 'Nota Bon Kecil',           'Kiky',       'KERTAS',    'PCS',  5_000,   5,  20, 'Buku nota rangkap 2 isi 50 lembar',10],

            // ── Toner & Cartridge ─────────────────────────────────────────────
            ['TNR-001', 'Toner HP LaserJet CF217A', 'HP',         'TONER',     'PCS', 350_000,  2,   6, 'Toner cartridge HP CF217A (M102w)', 3],
            ['TNR-002', 'Toner Canon 328',          'Canon',      'TONER',     'PCS', 320_000,  2,   6, 'Toner cartridge Canon CRG-328',     2],
            ['TNR-003', 'Tinta Printer Epson 003 Hitam','Epson',  'TONER',     'BTL', 85_000,   2,   8, 'Tinta epson 003 black 65ml',        4],
            ['TNR-004', 'Tinta Printer Epson 003 Warna','Epson',  'TONER',     'SET', 280_000,  1,   4, 'Tinta epson 003 set 3 warna (CMY)', 2],

            // ── Perlengkapan Kantor ───────────────────────────────────────────
            ['PLG-001', 'Kalkulator Saintifik',     'Casio',      'PERLENGKAPAN','PCS',125_000,  1,   5, 'Kalkulator Casio FX-350ES',        3],
            ['PLG-002', 'Tempat Pensil / Pen Holder','Deli',      'PERLENGKAPAN','PCS', 28_000,  2,  10, 'Tempat pensil meja plastik',       5],
            ['PLG-003', 'Bak Surat / In-Out Box',   'Bantex',     'PERLENGKAPAN','PCS', 55_000,  2,  10, 'Bak surat plastik 2 tingkat',      4],
            ['PLG-004', 'Papan Nama Meja',          'Joyko',      'PERLENGKAPAN','PCS', 22_000,  3,  15, 'Name plate meja akrilik',          8],
            ['PLG-005', 'Hekter / Stapler Kecil',   'Max',        'PERLENGKAPAN','PCS', 18_000,  2,   8, 'Mini stapler HD-88',               4],

            // ── Perlengkapan Komputer ─────────────────────────────────────────
            ['KOM-001', 'Flash Disk 32GB',          'Sandisk',    'KOMPUTER',  'PCS', 75_000,   2,  10, 'Flash disk USB 3.0 32GB',          5],
            ['KOM-002', 'Mouse USB',                'Logitech',   'KOMPUTER',  'PCS', 85_000,   2,   8, 'Mouse USB optik kabel',            4],
            ['KOM-003', 'Kabel USB-A to USB-B',     'Generic',    'KOMPUTER',  'PCS', 25_000,   2,  10, 'Kabel data USB-A ke USB-B 1.5m',   5],
            ['KOM-004', 'CD-R 700MB',               'Verbatim',   'KOMPUTER',  'PKT', 35_000,   2,   8, 'CD-R 700MB isi 10 pcs',            4],
        ];

        // ─── Seed items & stocks ──────────────────────────────────────────────
        foreach ($items as [$code, $name, $brand, $catCode, $unitCode, $price, $minStock, $maxStock, $desc, $initialQty]) {
            $categoryId = $cat($catCode);
            $unitId     = $unit($unitCode);

            if (! $categoryId || ! $unitId) {
                $this->command->warn("  ✗ Skipping {$code}: category/unit not found");
                continue;
            }

            $item = MasterItem::firstOrCreate(
                ['code' => $code],
                [
                    'uuid'        => Str::uuid(),
                    'name'        => $name,
                    'brand'       => $brand,
                    'description' => $desc,
                    'category_id' => $categoryId,
                    'unit_id'     => $unitId,
                    'price'       => $price,
                    'min_stock'   => $minStock,
                    'max_stock'   => $maxStock,
                    'is_active'   => true,
                ]
            );

            // Create or update stock
            $stock = InventoryStock::firstOrCreate(
                ['item_id' => $item->id, 'location_id' => $location->id],
                ['uuid' => Str::uuid(), 'quantity' => 0, 'reserved_quantity' => 0]
            );

            // Only create opening balance if stock is still zero
            if ($stock->quantity === 0 && $initialQty > 0) {
                $stock->update(['quantity' => $initialQty]);

                // Record opening balance transaction
                InventoryTransaction::create([
                    'uuid'             => Str::uuid(),
                    'item_id'          => $item->id,
                    'location_id'      => $location->id,
                    'transaction_type' => 'in',
                    'reference_type'   => 'opening_balance',
                    'reference_number' => 'OB-' . date('Ym') . '-' . str_pad($item->id, 3, '0', STR_PAD_LEFT),
                    'quantity_before'  => 0,
                    'quantity_change'  => $initialQty,
                    'quantity_after'   => $initialQty,
                    'notes'            => 'Stok awal (opening balance)',
                    'created_by'       => $admin->id,
                ]);
            }
        }

        $total = count($items);
        $this->command->info("✓ {$total} barang ATK berhasil di-seed dengan stok awal.");
        $this->command->line("  Lokasi: {$location->name} ({$location->code})");
    }
}
