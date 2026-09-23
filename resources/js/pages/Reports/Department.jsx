import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Download, ArrowLeft, Users } from 'lucide-react';

export default function ReportsDepartment({ departments, filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    const applyFilter = () => {
        router.get(route('reports.department'), { from, to }, {
            preserveState: true, replace: true,
        });
    };

    const totalRequests = (departments ?? []).reduce((sum, d) => sum + d.total_requests, 0);

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Permintaan per Departemen' }]}>
            <Head title="Permintaan Berdasarkan Departemen" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Permintaan Berdasarkan Departemen</h1>
                    <p className="page-subtitle">Rekap jumlah permintaan per departemen pada periode ini</p>
                </div>
                <a href={route('reports.export', { type: 'department', from, to })} className="btn btn-secondary">
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

            {departments?.length > 0 ? (
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Departemen</th>
                                <th>Jumlah Permintaan</th>
                                <th>Persentase</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(d => {
                                const percentage = totalRequests > 0
                                    ? (d.total_requests / totalRequests) * 100
                                    : 0;
                                return (
                                    <tr key={d.id}>
                                        <td className="font-medium text-slate-800">
                                            {d.name} <span className="text-xs text-slate-400">({d.code})</span>
                                        </td>
                                        <td className="font-semibold">{d.total_requests}</td>
                                        <td>{percentage.toFixed(1)}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card">
                    <div className="card-body text-center py-12">
                        <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium">Belum ada data permintaan pada periode ini</p>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}