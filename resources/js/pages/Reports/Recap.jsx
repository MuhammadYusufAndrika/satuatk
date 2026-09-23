import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Download, ArrowLeft, CalendarClock } from 'lucide-react';

export default function ReportsRecap({ recap, filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    const applyFilter = () => {
        router.get(route('reports.recap'), { from, to }, {
            preserveState: true, replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Rekapitulasi Status' }]}>
            <Head title="Rekapitulasi Request per Periode & Status" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Rekapitulasi Request per Periode & Status</h1>
                    <p className="page-subtitle">Jumlah permintaan masuk, disetujui, dan ditolak tiap bulan</p>
                </div>
                <a href={route('reports.export', { type: 'recap', from, to })} className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </a>
            </div>

            <div className="card mb-5">
                <div className="card-body flex flex-wrap items-end gap-3">
                    <div>
                        <label className="form-label">Dari Tanggal</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Sampai Tanggal</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input" />
                    </div>
                    <button onClick={applyFilter} className="btn btn-primary">Terapkan</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
    <tr>
        <th>Bulan</th>
        <th>Req Masuk</th>
        <th>Disetujui Penuh</th>
        <th>Disetujui Sebagian</th>
        <th>Ditolak</th>
        <th>% Ditolak</th>
    </tr>
</thead>
<tbody>
    {recap?.length > 0 ? recap.map(r => (
        <tr key={r.period}>
            <td className="font-medium text-slate-800">{r.period_label}</td>
            <td className="font-semibold">{r.total_masuk}</td>
            <td>{r.total_approved_full}</td>
            <td>{r.total_approved_partial}</td>
            <td>{r.total_rejected}</td>
            <td>{r.percent_rejected}%</td>
        </tr>
    )) : (
        <tr>
            <td colSpan={6} className="text-center py-12">
                <CalendarClock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Belum ada data pada periode ini</p>
            </td>
        </tr>
    )}
</tbody>
                </table>
            </div>
        </AppLayout>
    );
}