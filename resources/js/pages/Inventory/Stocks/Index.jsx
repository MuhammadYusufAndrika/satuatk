import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Boxes, Plus, Search, Filter } from 'lucide-react';
import { cn } from '@/utils';

function StockBadge({ quantity, minStock }) {
    if (quantity === 0) return <span className="badge badge-red">Habis</span>;
    if (quantity <= (minStock ?? 0)) return <span className="badge badge-yellow">Rendah</span>;
    return <span className="badge badge-green">Tersedia</span>;
}

export default function StocksIndex({ stocks, filters, locations }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [location, setLocation] = useState(filters?.location_id ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const applyFilters = () => router.get(
        route('inventory.stock.index'),
        {
            search: search || undefined,
            location_id: location || undefined,
            status: status || undefined,
        },
        { preserveState: true, replace: true }
    );

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.index') },
            { label: 'Stok' },
        ]}>
            <Head title="Stok Barang" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Stok Barang</h1>
                    <p className="page-subtitle">Pantau jumlah stok setiap barang per lokasi</p>
                </div>
                <Link href={route('inventory.adjustment.create')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Tambah Stok
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
                                placeholder="Cari kode atau nama barangâ€¦"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Lokasi</label>
                        <select value={location} onChange={e => setLocation(e.target.value)} className="form-select w-44">
                            <option value="">Semua Lokasi</option>
                            {locations?.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-32">
                            <option value="">Semua</option>
                            <option value="low">Stok Rendah</option>
                            <option value="out">Stok Habis</option>
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
                            <th>Kode</th>
                            <th>Barang</th>
                            <th>Lokasi</th>
                            <th>Stok</th>
                            <th>Reserved</th>
                            <th>Tersedia</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stocks?.data?.length > 0 ? stocks.data.map(stock => {
                            const available = (stock.quantity ?? 0) - (stock.reserved_quantity ?? 0);
                            return (
                                <tr key={stock.id}>
                                    <td>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                            {stock.item?.code}
                                        </span>
                                    </td>
                                    <td>
                                        <p className="font-medium text-slate-900">{stock.item?.name ?? 'â€”'}</p>
                                        {stock.item?.brand && <p className="text-xs text-slate-400">{stock.item.brand}</p>}
                                    </td>
                                    <td className="text-slate-500 text-sm">{stock.location?.name ?? 'â€”'}</td>
                                    <td>
                                        <span className="font-semibold">{stock.quantity}</span>
                                    </td>
                                    <td className="text-sm text-slate-500">{stock.reserved_quantity}</td>
                                    <td>
                                        <span className={cn('font-semibold', available <= 0 ? 'text-red-600' : 'text-emerald-600')}>
                                            {available}
                                        </span>
                                    </td>
                                    <td>
                                        <StockBadge quantity={stock.quantity} minStock={stock.item?.min_stock} />
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={7} className="text-center py-12">
                                    <Boxes className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Belum ada data stok</p>
                                    <p className="text-slate-300 text-sm mt-1">Stok akan muncul setelah ada barang & lokasi.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {stocks?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {stocks.from}â€“{stocks.to} dari {stocks.total} baris stok
                    </p>
                    <div className="flex gap-1">
                        {stocks.links.map((link, i) => (
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
