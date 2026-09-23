import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Search, Download, ArrowLeft, Boxes, X } from 'lucide-react';
import { cn } from '@/utils';

export default function ReportsInventory({ items, filters }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [itemId, setItemId] = useState(filters?.item_id ?? '');   // <-- baru

    const applyFilter = (overrides = {}) => {
        router.get(route('reports.inventory'), {
            search, status, item_id: itemId, ...overrides,   // <-- baru: ikut kirim item_id
        }, { preserveState: true, replace: true });
    };

    // Begitu user mulai ubah search/status manual, filter item_id dari notif dilepas
    const clearItemFilter = () => {
        setItemId('');
        router.get(route('reports.inventory'), {
            search, status, item_id: '',
        }, { preserveState: true, replace: true });
    };

    const filteredItemName = itemId && items?.data?.length > 0 ? items.data[0]?.name : null;   // <-- baru

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Item Perlu Perhatian' }]}>
            <Head title="Item Stok Perlu Perhatian" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Item Stok Perlu Perhatian</h1>
                    <p className="page-subtitle">Barang dengan status kritis atau menipis</p>
                </div>
                <a href={route('reports.export', { type: 'inventory' })} className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </a>
            </div>

            {/* Banner filter dari notifikasi */}
            {itemId && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-2.5 text-sm text-blue-700">
                    <span>
                        Menampilkan hasil untuk item dari notifikasi{filteredItemName ? `: ${filteredItemName}` : ''}
                    </span>
                    <button onClick={clearItemFilter} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 font-medium">
                        <X className="w-3.5 h-3.5" /> Lihat semua item
                    </button>
                </div>
            )}

            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilter({ item_id: '' })}
                            placeholder="Cari nama barang..."
                            className="form-input pl-9"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value, item_id: '' }); }}
                        className="form-select w-44"
                    >
                        <option value="">Semua</option>
                        <option value="kritis">Kritis</option>
                        <option value="menipis">Menipis</option>
                    </select>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nama Barang</th>
                            <th>Stok Saat Ini</th>
                            <th>Min Stok</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items?.data?.length > 0 ? items.data.map(item => (
                            <tr key={item.id}>
                                <td className="font-medium text-slate-800">{item.name}</td>
                                <td className="font-semibold">{item.current_stock}</td>
                                <td>{item.min_stock}</td>
                                <td>
                                    <span className={cn('badge', item.status === 'KRITIS' ? 'badge-red' : 'badge-yellow')}>
                                        {item.status === 'KRITIS' ? 'Kritis' : 'Menipis'}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-12">
                                    <Boxes className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Semua stok dalam kondisi aman</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {items?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {items.from}â€“{items.to} dari {items.total} barang
                    </p>
                    <div className="flex gap-1">
                        {items.links.map((link, i) => (
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