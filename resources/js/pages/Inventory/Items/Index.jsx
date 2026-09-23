import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Search, Filter, Package, Edit2, Trash2, Eye, X, MapPin, Boxes } from 'lucide-react';
import { cn, formatCurrency } from '@/utils';

// â”€â”€â”€ Stock Badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StockBadge({ quantity, minStock }) {
    if (quantity === 0)      return <span className="badge badge-red">Habis</span>;
    if (quantity <= minStock) return <span className="badge badge-yellow">Rendah</span>;
    return <span className="badge badge-green">Tersedia</span>;
}

// â”€â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ItemDetailModal({ item, onClose }) {
    const totalStock = item.total_stock ?? 0;
    const available  = (item.stocks ?? []).reduce((s, st) => s + (st.quantity - (st.reserved_quantity ?? 0)), 0);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto">
                    <div className="p-5 border-b flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{item.name}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">{item.code} {item.brand ? `Â· ${item.brand}` : ''}</p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Boxes className="w-3 h-3" /> Total Stok</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{totalStock}</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3">
                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Boxes className="w-3 h-3" /> Tersedia</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{available}</p>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3">
                                <p className="text-xs text-amber-600 font-medium">Min. Stok</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{item.min_stock ?? 0}</p>
                            </div>
                            <div className="rounded-xl bg-purple-50 p-3">
                                <p className="text-xs text-purple-600 font-medium">Harga</p>
                                <p className="text-xl font-bold text-slate-900 mt-1">{formatCurrency(item.price)}</p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kategori</p>
                                <p className="font-medium text-slate-900">{item.category?.name ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Satuan</p>
                                <p className="font-medium text-slate-900">{item.unit?.name ?? 'â€”'} <span className="text-slate-400">({item.unit?.symbol})</span></p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Supplier</p>
                                <p className="font-medium text-slate-900">{item.supplier?.name ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Model / Barcode</p>
                                <p className="font-medium text-slate-900">{item.model ?? 'â€”'}{item.barcode ? ` / ${item.barcode}` : ''}</p>
                            </div>
                            {item.description && (
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-0.5">Deskripsi</p>
                                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100 text-sm">{item.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Stock per location */}
                        <div>
                            <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> Stok per Lokasi</p>
                            {item.stocks?.length ? (
                                <div className="overflow-hidden rounded-xl border border-slate-100">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Lokasi</th>
                                                <th className="text-center">Qty</th>
                                                <th className="text-center">Reserved</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {item.stocks.map(st => (
                                                <tr key={st.id}>
                                                    <td className="font-medium text-slate-900">{st.location?.name ?? 'â€”'}</td>
                                                    <td className="text-center font-medium">{st.quantity}</td>
                                                    <td className="text-center text-slate-500">{st.reserved_quantity ?? 0}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-6 bg-slate-50 rounded-xl">Belum ada stok untuk barang ini.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// â”€â”€â”€ Items Index Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ItemsIndex({ items, filters, categories, units }) {
    const { auth } = usePage().props;
    const canManage = auth.user?.permissions?.includes('inventory.manage');

    const [search, setSearch] = useState(filters?.search ?? '');
    const [category, setCategory] = useState(filters?.category_id ?? '');
    const [selected, setSelected] = useState(null);

    const applyFilter = (overrides = {}) => {
        router.get(route('inventory.items.index'), {
            search,
            category_id: category,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const handleDelete = (uuid) => {
        if (confirm('Yakin ingin menghapus barang ini?')) {
            router.delete(route('inventory.items.destroy', uuid));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.items.index') },
            { label: 'Barang' },
        ]}>
            <Head title="Daftar Barang" />

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Daftar Barang</h1>
                    <p className="page-subtitle">Kelola katalog barang ATK</p>
                </div>
                {canManage && (
                    <Link href={route('inventory.items.create')} className="btn btn-primary">
                        <Plus className="w-4 h-4" /> Tambah Barang
                    </Link>
                )}
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body">
                    <div className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilter()}
                                placeholder="Cari nama, kode, merek..."
                                className="form-input pl-9"
                            />
                        </div>
                        <select
                            value={category}
                            onChange={e => { setCategory(e.target.value); applyFilter({ category_id: e.target.value }); }}
                            className="form-select w-48"
                        >
                            <option value="">Semua Kategori</option>
                            {categories?.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button onClick={() => applyFilter()} className="btn btn-secondary">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama Barang</th>
                            <th>Kategori</th>
                            <th>Satuan</th>
                            <th>Stok</th>
                            {/* Kolom ini Hanya Muncul untuk Admin / yang punya izin manage */}
                            {canManage && (
                                <>
                                    <th>Min. Stok</th>
                                    <th>Harga</th>
                                </>
                            )}
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items?.data?.length > 0 ? items.data.map(item => (
                            <tr key={item.id}>
                                <td>
                                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                        {item.code}
                                    </span>
                                </td>
                                <td>
                                    <div>
                                        <p className="font-medium text-slate-900">{item.name}</p>
                                        {item.brand && <p className="text-xs text-slate-400">{item.brand}</p>}
                                    </div>
                                </td>
                                <td>{item.category?.name ?? 'â€”'}</td>
                                <td>{item.unit?.symbol ?? item.unit?.name ?? 'â€”'}</td>
                                <td>
                                    <span className="font-semibold">{item.total_stock ?? 0}</span>
                                </td>
                                {/* Data Kolom Khusus Admin */}
                                {canManage && (
                                    <>
                                        <td>{item.min_stock}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                    </>
                                )}
                                <td>
                                    <StockBadge quantity={item.total_stock ?? 0} minStock={item.min_stock} />
                                </td>
                                <td>
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => setSelected(item)}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                            title="Lihat detail"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {canManage && (
                                            <>
                                                <Link
                                                    href={route('inventory.items.edit', item.uuid)}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.uuid)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                {/* Sesuaikan colSpan jadi 9 jika admin, atau 7 jika user biasa */}
                                <td colSpan={canManage ? 9 : 7} className="text-center py-12">
                                    <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Belum ada barang</p>
                                    <p className="text-slate-400 text-xs mt-1">Tambahkan barang pertama Anda</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
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

            {selected && (
                <ItemDetailModal item={selected} onClose={() => setSelected(null)} />
            )}
        </AppLayout>
    );
}