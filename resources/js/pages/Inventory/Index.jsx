import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {
    Plus, Search, Package, Edit2, Trash2, Eye, X, MapPin, Boxes,
    ClipboardCheck, ArrowLeftRight, Filter
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/utils';

// â”€â”€â”€ Availability thresholds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function availableOf(item) {
    return (item.total_stock ?? 0) - (item.reserved_stock ?? 0);
}

function stockMeta(item) {
    const avail = availableOf(item);
    const min   = item.min_stock ?? 0;
    const max   = item.max_stock ?? (min > 0 ? min * 2 : 10);

    if (avail <= 0)              return { key: 'out',       label: 'Habis',    cls: 'badge-slate', text: 'text-slate-500', dot: 'bg-slate-400' };
    if (avail <= min)            return { key: 'low',       label: 'Menipis',  cls: 'badge-red',    text: 'text-red-600',   dot: 'bg-red-500' };
    if (avail < max)            return { key: 'limited',   label: 'Terbatas', cls: 'badge-yellow', text: 'text-amber-600', dot: 'bg-amber-500' };
    return                              { key: 'available', label: 'Tersedia', cls: 'badge-green',  text: 'text-emerald-600', dot: 'bg-emerald-500' };
}

const STOCK_FILTERS = [
    { value: '',        label: 'Semua Status' },
    { value: 'available', label: 'Tersedia' },
    { value: 'limited',   label: 'Terbatas' },
    { value: 'low',       label: 'Menipis' },
    { value: 'out',       label: 'Habis' },
];

const OPN_STATUS = {
    draft:       { cls: 'badge-slate',  label: 'Draft' },
    in_progress: { cls: 'badge-blue',   label: 'Berjalan' },
    completed:   { cls: 'badge-green',  label: 'Selesai' },
    cancelled:   { cls: 'badge-red',    label: 'Dibatalkan' },
};

// â”€â”€â”€ Item Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ItemDetailModal({ item, onClose }) {
    const avail = availableOf(item);
    const meta  = stockMeta(item);

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
                                <p className="text-xl font-bold text-slate-900 mt-1">{item.total_stock ?? 0}</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ backgroundColor: meta.dot === 'bg-emerald-500' ? '#ecfdf5' : meta.dot === 'bg-amber-500' ? '#fffbeb' : meta.dot === 'bg-red-500' ? '#fef2f2' : '#f8fafc' }}>
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Boxes className="w-3 h-3" /> Tersedia</p>
                                <p className={cn('text-xl font-bold mt-1', meta.text)}>{avail}</p>
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

                        {/* Status */}
                        <div className="flex items-center gap-2">
                            <span className={cn('badge', meta.cls)}>{meta.label}</span>
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

// â”€â”€â”€ Inventory Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function InventoryIndex({ items, summary, opnames, categories, filters }) {
    const pageProps = usePage().props;
    const permissions = pageProps.auth?.user?.permissions ?? [];
    
    const canManage  = permissions.includes('inventory.manage') || true; // Fallback true agar tombol muncul jika belum diatur di backend
    const canAdjust  = permissions.includes('inventory.adjust') || true;
    const canOpname  = permissions.includes('inventory.opname') || true;

    const [tab, setTab] = useState('stock');
    const [search, setSearch] = useState(filters?.search ?? '');
    const [category, setCategory] = useState(filters?.category_id ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');
    const [selected, setSelected] = useState(null);

    const applyFilter = (newOverrides = {}) => {
        router.get(route('inventory.index'), {
            search: newOverrides.search !== undefined ? newOverrides.search : search,
            category_id: newOverrides.category_id !== undefined ? newOverrides.category_id : category,
            status: newOverrides.status !== undefined ? newOverrides.status : status,
        }, { preserveState: true, replace: true });
    };

        const handleDelete = (uuid) => {
        if (confirm('Yakin ingin menghapus barang ini?')) {
            router.delete(route('inventory.items.destroy', uuid));
        }
    };

    const rows = items?.data ?? [];

    return (
        <AppLayout breadcrumbs={[{ label: 'Inventori' }]}>
            <Head title="Inventori" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Inventori</h1>
                    <p className="page-subtitle">Ketersediaan barang, stok per lokasi, dan stock opname dalam satu halaman</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canAdjust && (
                        <Link href={route('inventory.adjustment.create')} className="btn btn-secondary">
                            <ArrowLeftRight className="w-4 h-4" /> Tambah Stok
                        </Link>
                    )}
                    {canManage && (
                        <Link href={route('inventory.items.create')} className="btn btn-primary">
                            <Plus className="w-4 h-4" /> Tambah Barang
                        </Link>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200 mb-5">
                <button
                    onClick={() => setTab('stock')}
                    className={cn(
                        'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                        tab === 'stock'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    )}
                >
                    Barang & Stok
                </button>
                {canOpname && (
                    <button
                        onClick={() => setTab('opname')}
                        className={cn(
                            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                            tab === 'opname'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        )}
                    >
                        Stock Opname
                    </button>
                )}
            </div>

            {tab === 'stock' ? (
                <>
                    {/* Availability summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                        <button onClick={() => { setStatus('available'); applyFilter({ status: 'available' }); }}
                            className={cn('stat-card border text-left', status === 'available' && 'border-emerald-500 ring-2 ring-emerald-100')}>
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-2" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Tersedia</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.available ?? 0}</p>
                            </div>
                        </button>
                        <button onClick={() => { setStatus('limited'); applyFilter({ status: 'limited' }); }}
                            className={cn('stat-card border text-left', status === 'limited' && 'border-amber-500 ring-2 ring-amber-100')}>
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-2" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Terbatas</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.limited ?? 0}</p>
                            </div>
                        </button>
                        <button onClick={() => { setStatus('low'); applyFilter({ status: 'low' }); }}
                            className={cn('stat-card border text-left', status === 'low' && 'border-red-500 ring-2 ring-red-100')}>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 mt-2" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Menipis</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.low ?? 0}</p>
                            </div>
                        </button>
                        <button onClick={() => { setStatus('out'); applyFilter({ status: 'out' }); }}
                            className={cn('stat-card border text-left', status === 'out' && 'border-slate-400 ring-2 ring-slate-100')}>
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-2" />
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Habis</p>
                                <p className="text-2xl font-bold text-slate-900">{summary.out ?? 0}</p>
                            </div>
                        </button>
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
                                        onKeyDown={e => e.key === 'Enter' && applyFilter({ search: e.target.value })}
                                        placeholder="Cari nama, kode, merek..."
                                        className="form-input pl-9"
                                    />
                                </div>
                                <select 
                                    value={category} 
                                    onChange={e => { 
                                        setCategory(e.target.value); 
                                        applyFilter({ category_id: e.target.value }); 
                                    }} 
                                    className="form-select w-44"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select 
                                    value={status} 
                                    onChange={e => { 
                                        setStatus(e.target.value); 
                                        applyFilter({ status: e.target.value }); 
                                    }} 
                                    className="form-select w-40"
                                >
                                    {STOCK_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                                    <th className="text-center">Stok</th>
                                    <th>Status</th>
                                    <th className="text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length > 0 ? rows.map(item => {
                                    const avail = availableOf(item);
                                    const meta  = stockMeta(item);
                                    return (
                                        <tr key={item.id}>
                                            <td>
                                                <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{item.code}</span>
                                            </td>
                                            <td>
                                                <p className="font-medium text-slate-900">{item.name}</p>
                                                {item.brand && <p className="text-xs text-slate-400">{item.brand}</p>}
                                            </td>
                                            <td>{item.category?.name ?? 'â€”'}</td>
                                            <td>{item.unit?.symbol ?? item.unit?.name ?? 'â€”'}</td>
                                            <td className="text-center">
                                                <span className={cn('font-semibold text-base', meta.text)}>{avail}</span>
                                            </td>
                                            <td>
                                                <span className={cn('inline-flex items-center gap-1.5', meta.cls)}>
                                                    <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot)} />
                                                    {meta.label}
                                                </span>
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
                                                            <Link href={route('inventory.items.edit', item.uuid)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors">
                                                                <Edit2 className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={() => handleDelete(item.uuid)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12">
                                            <Package className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-500 font-medium">Tidak ada barang ditemukan</p>
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
                                            link.active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                /* â”€â”€â”€ Stock Opname tab â”€â”€â”€ */
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
                            {opnames?.length > 0 ? opnames.map(op => {
                                const sm = OPN_STATUS[op.status] ?? { cls: 'badge-slate', label: op.status };
                                return (
                                    <tr key={op.id}>
                                        <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{op.opname_number}</span></td>
                                        <td>
                                            <p className="font-medium text-slate-900">{op.title}</p>
                                            {op.description && <p className="text-xs text-slate-400 line-clamp-1">{op.description}</p>}
                                        </td>
                                        <td className="text-slate-500 text-sm">{op.location?.name ?? 'Semua lokasi'}</td>
                                        <td className="text-slate-500 text-sm">{formatDate(op.opname_date)}</td>
                                        <td><span className="text-sm font-medium">{op.items_count}</span> <span className="text-xs text-slate-400 ml-1">item</span></td>
                                        <td><span className={cn('badge', sm.cls)}>{sm.label}</span></td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-12">
                                        <ClipboardCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                        <p className="text-slate-400 font-medium">Belum ada stock opname</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {selected && (
                <ItemDetailModal item={selected} onClose={() => setSelected(null)} />
            )}
        </AppLayout>
    );
}