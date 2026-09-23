import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Download, ArrowLeft, Truck } from 'lucide-react';
import { cn } from '@/utils';

const STATUS_OPTIONS = [
    { value: '', label: 'Semua Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Diajukan' },
    { value: 'approved', label: 'Disetujui' },
    { value: 'partially_approved', label: 'Disetujui Sebagian' },
    { value: 'rejected', label: 'Ditolak' },
    { value: 'fulfilled', label: 'Terpenuhi' },
    { value: 'cancelled', label: 'Dibatalkan' },
];

export default function ReportsDistribution({ distribution, departments, filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [departmentId, setDepartmentId] = useState(filters?.department_id ?? '');

    const applyFilter = (overrides = {}) => {
        router.get(route('reports.distribution'), {
            from, to, status, department_id: departmentId, ...overrides,
        }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Distribusi' }]}>
            <Head title="Laporan Distribusi" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Laporan Distribusi</h1>
                    <p className="page-subtitle">Daftar permintaan per tanggal diajukan, unit kerja, dan status</p>
                </div>
                <a href={route('reports.export', { type: 'distribution', from, to })} className="btn btn-secondary">
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
                    <div>
                        <label className="form-label">Unit Kerja</label>
                        <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); applyFilter({ department_id: e.target.value }); }} className="form-select w-44">
                            <option value="">Semua Unit Kerja</option>
                            {departments?.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }} className="form-select w-44">
                            {STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={() => applyFilter()} className="btn btn-primary">Terapkan</button>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tanggal</th>
                            <th>Unit Kerja</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {distribution?.data?.length > 0 ? distribution.data.map(d => (
                            <tr key={d.id}>
                                <td>{d.date}</td>
                                <td className="font-medium text-slate-800">{d.department}</td>
                                <td>
                                    <span className={cn('badge', d.status === 'rejected' || d.status === 'cancelled' ? 'badge-red' : d.status === 'fulfilled' || d.status === 'approved' ? 'badge-green' : 'badge-yellow')}>
                                        {d.status_label}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="text-center py-12">
                                    <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Belum ada data distribusi pada periode ini</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {distribution?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {distribution.from}â€“{distribution.to} dari {distribution.total} data
                    </p>
                    <div className="flex gap-1">
                        {distribution.links.map((link, i) => (
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