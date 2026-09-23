import {
    LayoutDashboard,
    Package,
    ClipboardList,
    CheckSquare,
    Truck,
    BarChart3,
    Shield,
    Users,
    Settings,
    Database,
    ArrowLeftRight,
} from 'lucide-react';

export const navigation = [
    {
        label: null,
        items: [
            {
                name: 'Dashboard',
                href: 'dashboard',
                icon: LayoutDashboard,
                permission: 'dashboard.view',
            },
        ],
    },
    {
        label: 'Pengelolaan ATK',
        items: [
            {
                name: 'Inventori',
                href: 'inventory.index',
                icon: Package,
                permission: 'inventory.view',
            },
            {
                name: 'Penyesuaian Stok',
                href: 'inventory.adjustment.index',
                icon: ArrowLeftRight,
                permission: 'inventory.adjust',
            },
            {
                name: 'Permintaan',
                href: 'requests.index',
                icon: ClipboardList,
                permission: 'request.view-own',
            },
            {
                name: 'Rekomendasi Reorder',
                href: 'requests.reorder',
                icon: Package,
                permission: 'request.reorder', // Menggunakan permission khusus admin
            },
            {
                name: 'Persetujuan',
                href: 'approvals.index',
                icon: CheckSquare,
                permission: 'approval.view',
            },
            {
                name: 'Distribusi',
                href: 'distribution.index',
                icon: Truck,
                permission: 'distribution.view',
            },
        ],
    },
    {
        label: 'Laporan',
        items: [
            {
                name: 'Laporan',
                href: 'reports.index',
                icon: BarChart3,
                permission: 'report.view',
            },
        ],
    },
    {
        label: 'Master Data',
        items: [
            {
                name: 'Master Data',
                href: 'master.index',
                icon: Database,
                permission: 'master.view',
                children: [
                    { name: 'Kategori', href: 'master.categories.index' },
                    { name: 'Satuan', href: 'master.units.index' },
                    { name: 'Lokasi', href: 'master.locations.index' },
                    { name: 'Supplier', href: 'master.suppliers.index' },
                    { name: 'Departemen', href: 'master.departments.index' },
                ],
            },
        ],
    },
    {
        label: 'Administrasi',
        items: [
            {
                name: 'Audit Trail',
                href: 'audit.index',
                icon: Shield,
                permission: 'audit.view',
            },
            {
                name: 'Pengguna',
                href: 'users.index',
                icon: Users,
                permission: 'user.view',
            },
            {
                name: 'Pengaturan',
                href: 'settings.index',
                icon: Settings,
                permission: 'settings.manage',
                children: [
                    { name: 'Umum',            href: 'settings.index' },
                    { name: 'Aturan Approval', href: 'settings.approval-rules.index', permission: 'settings.manage' },
                ],
            },
        ],
    },
];
