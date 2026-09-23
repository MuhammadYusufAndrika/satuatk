import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Search, Eye, FileText } from 'lucide-react';
import { cn, formatDate } from '@/utils';

const STATUS_MAP = {
    scheduled: { cls: 'badge-slate', label: 'Terjadwal' },
    ready:     { cls: 'badge-blue',  label: 'Siap Diambil' },
    picked_up: { cls: 'badge-green', label: 'Selesai' },
};

export default function DistributionIndex({ distributions, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const handleFilter = (newStatus = status) => {
        router.get(route('distribution.index'), { search, status: newStatus }, { preserveState: true, replace: true });
    };

    const rows = distributions?.data ?? [];

    return (
        <AppLayout breadcrumbs={[{ label: 'Distribusi Barang' }]}>
            <Head title="Distribusi Barang" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Distribusi Barang</h1>
                    <p className="page-subtitle">Kelola pengiriman dan distribusi barang ke berbagai unit atau lokasi</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="card mb-5">
                <div className="card-body">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleFilter()}
                                placeholder="Cari nomor referensi, tujuan..."
                                className="form-input pl-9"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={e => {
                                setStatus(e.target.value);
                                handleFilter(e.target.value);
                            }}
                            className="form-select w-44"
                        >
                            <option value="">Semua Status</option>
                            <option value="scheduled">Terjadwal</option>
                            <option value="ready">Siap Diambil</option>
                            <option value="picked_up">Selesai</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>No. Referensi</th>
                            <th>Tujuan / Unit</th>
                            <th>Tanggal</th>
                            <th>Total Item</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length > 0 ? rows.map(item => {
                            const st = STATUS_MAP[item.status] ?? { cls: 'badge-slate', label: item.status };
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {item.pickup_number}
                                        </span>
                                    </td>
                                    <td>
                                        <p className="font-medium text-slate-900">{item.request?.department?.name ?? '—'}</p>
                                        <p className="text-xs text-slate-400 line-clamp-1">{item.request?.request_number}</p>
                                    </td>
                                    <td className="text-slate-500 text-sm">{formatDate(item.scheduled_date)}</td>
                                    <td>
                                        <span className="text-sm font-medium">{item.request?.items?.length ?? 0}</span>
                                        <span className="text-xs text-slate-400 ml-1">item</span>
                                    </td>
                                    <td>
                                        <span className={cn('badge', st.cls)}>{st.label}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={route('distribution.show', item.uuid)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                title="Lihat detail"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Belum ada data distribusi</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {distributions?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {distributions.from}–{distributions.to} dari {distributions.total} data
                    </p>
                    <div className="flex gap-1">
                        {distributions.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={cn(
                                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                                    link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </AppLayout>
    );
}