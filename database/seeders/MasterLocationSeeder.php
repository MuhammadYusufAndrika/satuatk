<?php

namespace Database\Seeders;

use App\Models\MasterLocation;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MasterLocationSeeder extends Seeder
{
    public function run(): void
    {
        if (class_exists("App\Models\MasterLocation")) {
            MasterLocation::firstOrCreate(
                ["code" => "GDG-UTAMA"],
                [
                    "uuid" => (string) Str::uuid(),
                    "name" => "Gudang Utama",
                    "description" => "Lokasi Penyimpanan Utama ATK",
                    "is_active" => true,
                ]
            );
        }
    }
}
