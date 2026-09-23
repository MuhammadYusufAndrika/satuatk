<?php

namespace Database\Seeders;

use App\Models\ApprovalRule;
use Illuminate\Database\Seeder;

class ApprovalRulesSeeder extends Seeder
{
    public function run(): void
    {
        if (class_exists("App\Models\ApprovalRule")) {
            ApprovalRule::truncate();

            ApprovalRule::create([
                "level" => 1,
                "name" => "Level 1 - Senior Manager (SM)",
                "min_value" => 0,
                "max_value" => 10000000,
                "sla_hours" => 24,
            ]);

            ApprovalRule::create([
                "level" => 2,
                "name" => "Level 2 - General Manager (GM)",
                "min_value" => 10000001,
                "max_value" => null,
                "sla_hours" => 48,
            ]);
        }

        $this->command->info("? Default approval rules seeded (2 levels).");
        $this->command->table(
            ["Level", "Nama", "Min Value", "Max Value"],
            [
                ["1", "Level 1 - Senior Manager (SM)", "Rp 0", "Rp 10.000.000"],
                ["2", "Level 2 - General Manager (GM)", "> Rp 10.000.000", "Tanpa Batas"],
            ]
        );
    }
}
