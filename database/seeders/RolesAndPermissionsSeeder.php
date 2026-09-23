<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ─── Permissions ──────────────────────────────────────────────────────

        $permissions = [
            // Dashboard
            'dashboard.view',

            // Master Data
            'master.view',
            'master.create',
            'master.edit',
            'master.delete',

            // Inventory
            'inventory.view',
            'inventory.manage',
            'inventory.adjust',
            'inventory.opname',
            'inventory.export',

            // Requests
            'request.view-own',
            'request.view-all',
            'request.create',
            'request.edit',
            'request.cancel',
            'request.reorder',

            // Approvals
            'approval.view',
            'approval.approve',

            // Distribution
            'distribution.view',
            'distribution.manage',
            'distribution.pickup',

            // Reporting
            'report.view',
            'report.export',

            // Notifications
            'notification.view',

            // Audit Trail
            'audit.view',

            // User Management
            'user.view',
            'user.create',
            'user.edit',
            'user.delete',
            'user.manage-roles',

            // Settings
            'settings.view',
            'settings.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ─── Roles ────────────────────────────────────────────────────────────

        // 1. Admin — full system access + approval level 1 (gudang/logistik)
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions(Permission::all());

        // 2. SM (Supervisor/Senior Manager) — approval level 2
        $sm = Role::firstOrCreate(['name' => 'SM']);
        $sm->syncPermissions([
            'dashboard.view',
            'inventory.view',
            'inventory.export',
            'request.view-all',
            'approval.view',
            'approval.approve',
            'distribution.view',
            'report.view',
            'notification.view',
        ]);

        // 3. GM (General Manager) — approval level 3, highest authority
        $gm = Role::firstOrCreate(['name' => 'GM']);
        $gm->syncPermissions([
            'dashboard.view',
            'inventory.view',
            'inventory.export',
            'request.view-all',
            'approval.view',
            'approval.approve',
            'distribution.view',
            'report.view',
            'report.export',
            'notification.view',
        ]);

        // 4. Requester — regular employee, submits ATK requests
        $requester = Role::firstOrCreate(['name' => 'Requester']);
        $requester->syncPermissions([
            'dashboard.view',
            'inventory.view',
            'request.view-own',
            'request.create',
            'request.edit',
            'request.cancel',
            'distribution.pickup',
            'notification.view',
        ]);
    }
}
