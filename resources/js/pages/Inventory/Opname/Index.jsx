import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ClipboardCheck, Search, Filter } from 'lucide-react';
import { cn, formatDate } from '@/utils';

const STATUS_META = {
    draft:       { cls: 'badge-slate',  label: 'Draft' },
    in_progress: { cls: 'badge-blue',   label: 'Berjalan' },
    completed:   { cls: 'badge-green',  label: 'Selesai' },
    cancelled:   { cls: 'badge-red',    label: 'Dibatalkan' },
};

export default function OpnameIndex({ opnames, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const applyFilters = () => router.get(
        route('inventory.opname.index'),
        { search: search || undefined, status: status || undefined },
        { preserveState: true, replace: true }
    );

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.index') },
            { label: 'Stock Opname' },
        ]}>
            <Head title="Stock Opname" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Stock Opname</h1>
                    <p className="page-subtitle">Sesi perhitungan fisik stok barang</p>
                </div>
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
                                placeholder="Cari nomor atau judul opnameâ€¦"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-36">
                            <option value="">Semua</option>
                            <option value="draft">Draft</option>
                            <option value="in_progress">Berjalan</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
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
                            <th>Judul</th>
                            <th>Lokasi</th>
                            <th>Tanggal</th>
                            <th>Item</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {opnames?.data?.length > 0 ? opnames.data.map(op => {
                            const sm = STATUS_META[op.status] ?? { cls: 'badge-slate', label: op.status };
                            return (
                                <tr key={op.id}>
                                    <td>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {op.opname_number}
                                        </span>
                                    </td>
                                    <td>
                                        <p className="font-medium text-slate-900">{op.title}</p>
                                        {op.description && <p className="text-xs text-slate-400 line-clamp-1">{op.description}</p>}
                                    </td>
                                    <td className="text-slate-500 text-sm">{op.location?.name ?? 'Semua lokasi'}</td>
                                    <td className="text-slate-500 text-sm">{formatDate(op.opname_date)}</td>
                                    <td>
                                        <span className="text-sm font-medium">{op.items_count}</span>
                                        <span className="text-xs text-slate-400 ml-1">item</span>
                                    </td>
                                    <td>
                                        <span className={cn('badge', sm.cls)}>{sm.label}</span>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <ClipboardCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Belum ada stock opname</p>
                                    <p className="text-slate-300 text-sm mt-1">Sesi opname akan tercatat di sini.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {opnames?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {opnames.from}â€“{opnames.to} dari {opnames.total} sesi
                    </p>
                    <div className="flex gap-1">
                        {opnames.links.map((link, i) => (
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
