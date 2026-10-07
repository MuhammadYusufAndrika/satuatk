<?php

namespace Database\Seeders;

use App\Models\MasterCategory;
use App\Models\MasterUnit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MasterCategoryAndUnitSeeder extends Seeder
{
    public function run(): void
    {
        // Kode kategori wajib sinkron dengan ItemSeeder.
        $categories = [
            'ALAT_TULIS'  => 'Alat Tulis',
            'KERTAS'      => 'Kertas & Formulir',
            'TONER'       => 'Toner & Cartridge',
            'PERLENGKAPAN' => 'Perlengkapan Kantor',
            'KOMPUTER'    => 'Perlengkapan Komputer',
            // Kode lawas (dipertahankan agar DB lama tidak rusak).
            'ATK' => 'Kategori ATK',
            'KER' => 'Kategori KER',
            'TNR' => 'Kategori TNR',
            'PLG' => 'Kategori PLG',
            'KOM' => 'Kategori KOM',
        ];
        foreach ($categories as $code => $name) {
            if (class_exists("App\Models\MasterCategory")) {
                MasterCategory::firstOrCreate(
                    ["code" => $code],
                    ["uuid" => (string) Str::uuid(), "name" => $name, "is_active" => true]
                );
            }
        }

        // Kode satuan wajib sinkron dengan ItemSeeder (PKT & BTL sebelumnya hilang).
        $units = ["PCS", "PACK", "BOX", "ROLL", "SET", "RIM", "PKT", "BTL"];
        foreach ($units as $unit) {
            if (class_exists("App\Models\MasterUnit")) {
                MasterUnit::firstOrCreate(
                    ["code" => $unit],
                    ["uuid" => (string) Str::uuid(), "name" => $unit, "is_active" => true]
                );
            }
        }
    }
}
