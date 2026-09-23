import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Download, ArrowLeft, TrendingUp } from 'lucide-react';
import { cn } from '@/utils';

export default function ReportsUsage({ usage, filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    const applyFilter = (overrides = {}) => {
        router.get(route('reports.usage'), { from, to, ...overrides }, {
            preserveState: true, replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Item Terbanyak Diminta' }]}>
            <Head title="Jenis Item Terbanyak Diminta" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Jenis Item Terbanyak Diminta</h1>
                    <p className="page-subtitle">Barang yang paling sering dan paling banyak diminta pada periode ini</p>
                </div>
                <a href={route('reports.export', { type: 'usage', from, to })} className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </a>
            </div>

            <div className="card mb-5">
                <div className="card-body flex flex-wrap items-end gap-3">
                    <div>
                        <label className="form-label">Dari Tanggal</label>
                        <input
                            type="date"
                            value={from}
                            onChange={e => setFrom(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Sampai Tanggal</label>
                        <input
                            type="date"
                            value={to}
                            onChange={e => setTo(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <button onClick={() => applyFilter()} className="btn btn-primary">
                        Terapkan
                    </button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Barang</th>
                            <th>Jumlah Transaksi</th>
                            <th>Total Qty Diminta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usage?.data?.length > 0 ? usage.data.map(u => (
                            <tr key={u.id}>
                                <td className="font-mono text-xs">{u.code}</td>
                                <td className="font-medium text-slate-800">{u.name}</td>
                                <td>{u.total_transactions}</td>
                                <td className="font-semibold">{u.total_requested}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-12">
                                    <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Belum ada data pemakaian pada periode ini</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {usage?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {usage.from}â€“{usage.to} dari {usage.total} barang
                    </p>
                    <div className="flex gap-1">
                        {usage.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={cn(
                                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                                    link.active
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}