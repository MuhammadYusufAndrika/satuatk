import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ArrowLeftRight, Plus, Search, Filter } from 'lucide-react';
import { cn, formatDateTime } from '@/utils';

const TYPE_META = {
    increase: { cls: 'badge-green', label: 'Tambah' },
    decrease: { cls: 'badge-red',   label: 'Kurang' },
};

const STATUS_META = {
    pending:  { cls: 'badge-yellow', label: 'Pending' },
    approved: { cls: 'badge-green',  label: 'Disetujui' },
    rejected: { cls: 'badge-red',    label: 'Ditolak' },
};

export default function AdjustmentIndex({ adjustments, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [type, setType] = useState(filters?.type ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const applyFilters = () => router.get(
        route('inventory.adjustment.index'),
        {
            search: search || undefined,
            type: type || undefined,
            status: status || undefined,
        },
        { preserveState: true, replace: true }
    );

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.index') },
            { label: 'Penyesuaian Stok' },
        ]}>
            <Head title="Penyesuaian Stok" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Penyesuaian Stok</h1>
                    <p className="page-subtitle">Riwayat penyesuaian stok barang</p>
                </div>
                <Link href={route('inventory.adjustment.create')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Tambah Penyesuaian
                </Link>
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <label className="form-label">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="form-input pl-9"
                                placeholder="Cari nomor penyesuaianâ€¦"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Tipe</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="form-select w-32">
                            <option value="">Semua</option>
                            <option value="increase">Tambah</option>
                            <option value="decrease">Kurang</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-32">
                            <option value="">Semua</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>
                    <button onClick={applyFilters} className="btn btn-secondary">
                        <Filter className="w-4 h-4" /> Terapkan
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nomor</th>
                            <th>Tipe</th>
                            <th>Alasan</th>
                            <th>Item</th>
                            <th>Dibuat Oleh</th>
                            <th>Waktu</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {adjustments?.data?.length > 0 ? adjustments.data.map(adj => {
                            const tm = TYPE_META[adj.type] ?? { cls: 'badge-slate', label: adj.type };
                            const sm = STATUS_META[adj.status] ?? { cls: 'badge-slate', label: adj.status };
                            return (
                                <tr key={adj.id}>
                                    <td>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {adj.adjustment_number}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={cn('badge', tm.cls)}>{tm.label}</span>
                                    </td>
                                    <td className="text-sm text-slate-600 max-w-sm">
                                        <span className="line-clamp-1">{adj.reason}</span>
                                    </td>
                                    <td>
                                        <span className="text-sm font-medium">{adj.items_count}</span>
                                        <span className="text-xs text-slate-400 ml-1">item</span>
                                    </td>
                                    <td className="text-sm text-slate-500">{adj.creator?.name ?? 'â€”'}</td>
                                    <td className="text-sm text-slate-500 whitespace-nowrap">{formatDateTime(adj.created_at)}</td>
                                    <td>
                                        <span className={cn('badge', sm.cls)}>{sm.label}</span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <ArrowLeftRight className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Belum ada penyesuaian stok</p>
                                    <p className="text-slate-300 text-sm mt-1">Penyesuaian akan tercatat di sini.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {adjustments?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {adjustments.from}â€“{adjustments.to} dari {adjustments.total} penyesuaian
                    </p>
                    <div className="flex gap-1">
                        {adjustments.links.map((link, i) => (
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
