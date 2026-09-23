<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ["email" => "admin@gmail.com"],
            [
                "name" => "Admin",
                "password" => Hash::make("password"),
                "is_active" => true,
                "approval_level" => 0,
            ]
        );
        $admin->assignRole("Admin");

        $sm = User::firstOrCreate(
            ["email" => "sm@gmail.com"],
            [
                "name" => "Senior Manager",
                "password" => Hash::make("password"),
                "is_active" => true,
                "approval_level" => 1,
            ]
        );
        $sm->assignRole("SM");

        $gm = User::firstOrCreate(
            ["email" => "gm@gmail.com"],
            [
                "name" => "General Manager",
                "password" => Hash::make("password"),
                "is_active" => true,
                "approval_level" => 2,
            ]
        );
        $gm->assignRole("GM");

        $user = User::firstOrCreate(
            ["email" => "user@gmail.com"],
            [
                "name" => "User Biasa",
                "password" => Hash::make("password"),
                "is_active" => true,
                "approval_level" => 0,
            ]
        );
        $user->assignRole("Requester");

        $this->command->info("? 4 roles seeded with demo accounts:");
        $this->command->table(
            ["Role", "Email", "Approval Level"],
            [
                ["Admin", "admin@gmail.com", "Tidak ikut approval (Kelola System/ATK)"],
                ["SM", "sm@gmail.com", "L1 — Approve nominal Rp 0 - Rp 10.000.000"],
                ["GM", "gm@gmail.com", "L2 — Approve nominal > Rp 10.000.000"],
                ["Requester", "user@gmail.com", "Tidak bisa approve (Pemohon)"],
            ]
        );
        $this->command->info("  Password semua akun: password");
    }
}
