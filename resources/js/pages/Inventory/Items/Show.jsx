import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {
    ChevronLeft, Package, Pencil, Barcode, Tag, Layers,
    DollarSign, AlertTriangle, MapPin, Boxes
} from 'lucide-react';
import { formatCurrency } from '@/utils';

function StockBadge({ quantity, minStock }) {
    if (quantity <= 0) return <span className="badge badge-red">Habis</span>;
    if (quantity <= minStock) return <span className="badge badge-amber">Menipis</span>;
    return <span className="badge badge-green">Cukup</span>;
}

export default function ItemShow({ item }) {
    const totalStock = item.total_stock ?? 0;
    const minStock   = item.min_stock ?? 0;
    const available  = (item.stocks ?? []).reduce((s, st) => s + (st.quantity - (st.reserved_quantity ?? 0)), 0);

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.index') },
            { label: 'Barang', href: route('inventory.index') },
            { label: item.code },
        ]}>
            <Head title={`${item.code} â€” ${item.name}`} />

            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href={route('inventory.items.index')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
                        <ChevronLeft className="w-3 h-3" /> Kembali ke daftar barang
                    </Link>
                    <h1 className="page-title">{item.name}</h1>
                    <p className="page-subtitle font-mono text-xs">{item.code}</p>
                </div>
                <Link href={route('inventory.items.edit', item.uuid)} className="btn btn-secondary">
                    <Pencil className="w-4 h-4" /> Edit
                </Link>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="stat-card border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Total Stok</p>
                        <p className="text-2xl font-bold text-slate-900">{totalStock}</p>
                    </div>
                </div>
                <div className="stat-card border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                        <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Stok Tersedia</p>
                        <p className="text-2xl font-bold text-slate-900">{available}</p>
                    </div>
                </div>
                <div className="stat-card border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Stok Minimum</p>
                        <p className="text-2xl font-bold text-slate-900">{minStock}</p>
                    </div>
                </div>
                <div className="stat-card border border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-medium">Harga Satuan</p>
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(item.price)}</p>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Detail info */}
                <div className="lg:col-span-2 space-y-5">
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Tag className="w-4 h-4" /> Informasi Barang</h3></div>
                        <div className="card-body grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kode</p>
                                <p className="font-medium text-slate-900 font-mono">{item.code}</p>
                            </div>
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
                                <p className="text-slate-400 text-xs mb-0.5">Merek</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-slate-400" /> {item.brand ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Model</p>
                                <p className="font-medium text-slate-900">{item.model ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Barcode</p>
                                <p className="font-medium text-slate-900 font-mono flex items-center gap-1.5"><Barcode className="w-3.5 h-3.5 text-slate-400" /> {item.barcode ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Status</p>
                                <p className="font-medium text-slate-900">{item.is_active ? <span className="badge badge-green">Aktif</span> : <span className="badge badge-slate">Nonaktif</span>}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Stok Maks</p>
                                <p className="font-medium text-slate-900">{item.max_stock ?? 'â€”'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kondisi Stok</p>
                                <StockBadge quantity={totalStock} minStock={minStock} />
                            </div>
                            {item.description && (
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-0.5">Deskripsi</p>
                                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{item.description}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stock per location */}
                <div className="space-y-5">
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> Stok per Lokasi</h3></div>
                        <div className="overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Lokasi</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-center">Reserved</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {item.stocks?.length ? item.stocks.map(st => (
                                        <tr key={st.id}>
                                            <td className="font-medium text-slate-900">{st.location?.name ?? 'â€”'}</td>
                                            <td className="text-center font-medium">{st.quantity}</td>
                                            <td className="text-center text-slate-500">{st.reserved_quantity ?? 0}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={3} className="text-center py-10">
                                                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                                <p className="text-slate-400 text-sm">Belum ada stok untuk barang ini.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot className="bg-slate-50">
                                    <tr>
                                        <td className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                                        <td className="text-center px-4 py-3 font-bold text-slate-900">{totalStock}</td>
                                        <td className="text-center px-4 py-3 text-slate-500">
                                            {item.stocks?.reduce((s, st) => s + (st.reserved_quantity ?? 0), 0)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
