import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { BarChart3, Boxes, Users, Truck, CalendarClock, Download, TrendingUp } from 'lucide-react';

function ReportListItem({ title, description, icon: Icon, href, exportType }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-4 px-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={route(href)} className="btn-primary btn-sm">
                    <BarChart3 className="w-3.5 h-3.5" /> Lihat Laporan
                </Link>
                <a href={route('reports.export', { type: exportType })} className="btn-secondary btn-sm">
                    <Download className="w-3.5 h-3.5" /> Export CSV
                </a>
            </div>
        </div>
    );
}

export default function ReportsIndex() {
    const { auth } = usePage().props;
    const roles = auth.user?.roles ?? [];
    const isAdmin = roles.includes('Admin');

    const allReports = [
        {
            key: 'inventory',
            title: 'Laporan Item Stok Perlu Perhatian',
            description: 'Barang dengan status kritis atau menipis yang perlu segera ditindaklanjuti.',
            icon: Boxes,
            href: 'reports.inventory',
            exportType: 'inventory',
            adminOnly: true,
        },
        {
            key: 'usage',
            title: 'Laporan Jenis Barang Terbanyak Diminta',
            description: 'Barang yang paling banyak diminta dalam periode tertentu.',
            icon: BarChart3,
            href: 'reports.usage',
            exportType: 'usage',
            adminOnly: true,
        },
        {
            key: 'department',
            title: 'Laporan Permintaan Berdasarkan Departemen',
            description: 'Rekap jumlah permintaan per departemen.',
            icon: Users,
            href: 'reports.department',
            exportType: 'department',
            adminOnly: false,
        },
        {
            key: 'distribution',
            title: 'Laporan Distribusi',
            description: 'Daftar permintaan per tanggal diajukan, unit kerja, dan status.',
            icon: Truck,
            href: 'reports.distribution',
            exportType: 'distribution',
            adminOnly: true,
        },
        {
            key: 'recap',
            title: 'Rekapitulasi Request per Periode & Status',
            description: 'Jumlah permintaan masuk, disetujui, dan ditolak tiap bulan.',
            icon: CalendarClock,
            href: 'reports.recap',
            exportType: 'recap',
            adminOnly: false,
        },
        {
            key: 'trend',
            title: 'Tren Pemakaian ATK',
            description: 'Grafik dan ringkasan perkembangan pemakaian barang tiap bulan.',
            icon: TrendingUp,
            href: 'reports.trend',
            exportType: 'trend',
            adminOnly: true,
        },
    ];

    const visibleReports = allReports.filter(r => isAdmin || !r.adminOnly);

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan & Statistik' }]}>
            <Head title="Laporan & Statistik" />
            <div className="page-header">
                <div>
                    <h1 className="page-title">Laporan & Statistik</h1>
                    <p className="page-subtitle">Pilih laporan yang ingin dilihat atau diunduh</p>
                </div>
            </div>
            <div className="card">
                <div className="card-body divide-y divide-slate-100">
                    {visibleReports.map(r => (
                        <ReportListItem
                            key={r.key}
                            title={r.title}
                            description={r.description}
                            icon={r.icon}
                            href={r.href}
                            exportType={r.exportType}
                        />
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}