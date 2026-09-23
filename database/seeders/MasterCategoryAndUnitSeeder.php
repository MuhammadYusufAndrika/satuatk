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
        $categories = ["ATK", "KER", "TNR", "PLG", "KOM"];
        foreach ($categories as $cat) {
            if (class_exists("App\Models\MasterCategory")) {
                MasterCategory::firstOrCreate(
                    ["code" => $cat],
                    ["uuid" => (string) Str::uuid(), "name" => "Kategori " . $cat, "is_active" => true]
                );
            }
        }

        $units = ["PCS", "PACK", "BOX", "ROLL", "SET", "RIM"];
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
