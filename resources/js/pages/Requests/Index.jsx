import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Search, ClipboardList, X, User, Building2, Calendar, Package, FileText } from 'lucide-react';
import { cn, requestStatusBadge, formatDate, formatCurrency } from '@/utils';

const CATEGORY_BADGE = {
    urgent: (
    <span className="badge badge-red">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Urgen
    </span>
),

    regular: <span className="badge badge-slate">Reguler</span>,
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function RequestDetailModal({ req, onClose }) {
    const badge = requestStatusBadge(req.status);
    const total = req.items?.reduce((sum, ri) => sum + (ri.item?.price ?? 0) * ri.quantity_requested, 0) ?? 0;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-auto">
                    <div className="p-5 border-b flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold text-slate-900 text-lg">{req.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-mono text-xs text-slate-400">{req.request_number}</span>
                                <span className={badge.cls}>{badge.label}</span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-5">
                        {/* Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5 flex items-center gap-1"><User className="w-3 h-3" /> Pemohon</p>
                                <p className="font-medium text-slate-900">{req.requested_by_user?.name ?? req.requestedBy?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5 flex items-center gap-1"><Building2 className="w-3 h-3" /> Departemen</p>
                                <p className="font-medium text-slate-900">{req.department?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kategori</p>
                                <p>{CATEGORY_BADGE[req.category]}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Tanggal Pengajuan</p>
                                <p className="font-medium text-slate-900">{formatDate(req.created_at)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Delivery Point</p>
                                <p className="font-medium text-slate-900">{req.delivery_point ?? '—'}</p>
                            </div>
                            {req.notes && (
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-0.5">Catatan</p>
                                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{req.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Items */}
                        <div>
                            <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5"><Package className="w-4 h-4 text-slate-400" /> Barang yang Diminta</p>
                            <div className="overflow-hidden rounded-xl border border-slate-100">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Barang</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-right">Harga</th>
                                            <th className="text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {req.items?.map(ri => (
                                            <tr key={ri.id}>
                                                <td>
                                                    <p className="font-medium text-slate-900 text-sm">{ri.item?.name}</p>
                                                    <p className="text-xs text-slate-400">{ri.item?.code} · {ri.item?.category?.name} · {ri.item?.unit?.symbol}</p>
                                                </td>
                                                <td className="text-center font-medium">{ri.quantity_requested}</td>
                                                <td className="text-right text-sm">{formatCurrency(ri.item?.price)}</td>
                                                <td className="text-right font-semibold text-slate-900 text-sm">
                                                    {formatCurrency((ri.item?.price ?? 0) * ri.quantity_requested)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50">
                                        <tr>
                                            <td colSpan={3} className="text-right text-sm font-semibold text-slate-700 px-4 py-2.5">Total</td>
                                            <td className="text-right px-4 py-2.5 font-bold text-slate-900">{formatCurrency(total)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Approval chain summary */}
                        {req.approvals?.length > 0 && (
                            <div>
                                <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5"><FileText className="w-4 h-4 text-slate-400" /> Rantai Persetujuan</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {[...req.approvals].sort((a, b) => a.level - b.level).map(step => (
                                        <div key={step.id} className="flex items-center gap-2">
                                            <span className={cn(
                                                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border',
                                                step.status === 'approved' && 'bg-emerald-50 border-emerald-200 text-emerald-700',
                                                step.status === 'rejected' && 'bg-red-50 border-red-200 text-red-700',
                                                step.status === 'pending' && 'bg-blue-50 border-blue-200 text-blue-700',
                                                step.status === 'waiting' && 'bg-slate-50 border-slate-200 text-slate-500',
                                                step.status === 'cancelled' && 'bg-slate-50 border-slate-100 text-slate-400',
                                            )}>
                                                <span className="font-semibold">L{step.level}</span>
                                                <span className="capitalize">{step.status}</span>
                                            </span>
                                            {step.level !== req.approvals.length && <span className="text-slate-300">→</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RequestsIndex({ requests, filters }) {
    const pageProps = usePage().props;
const auth = pageProps?.auth || {};
const canCreate = auth.user?.permissions?.includes('request.create') ?? false;

    const [search, setSearch] = useState(filters?.search ?? '');
    const [status, setStatus]   = useState(filters?.status ?? '');
    const [selected, setSelected] = useState(null);

    const applyFilter = (overrides = {}) => {
        router.get(route('requests.index'), { search, status, ...overrides }, {
            preserveState: true, replace: true,
        });
    };

    const statuses = [
        { value: '',              label: 'Semua Status' },
        { value: 'draft',         label: 'Draft' },
        { value: 'submitted',     label: 'Diajukan' },
        { value: 'approved',      label: 'Disetujui' },
        { value: 'rejected',      label: 'Ditolak' },
        { value: 'fulfilled',     label: 'Terpenuhi' },
        { value: 'cancelled',     label: 'Dibatalkan' },
    ];

    return (
        <AppLayout breadcrumbs={[{ label: 'Permintaan ATK' }]}>
            <Head title="Permintaan ATK" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Permintaan ATK</h1>
                    <p className="page-subtitle">Ajukan dan pantau status permintaan</p>
                </div>
                {canCreate && (
                    <Link
    href={route('requests.create')}
    className="btn btn-primary"
>
    <Plus className="w-4 h-4" />
    Buat Permintaan
</Link>


                )}
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applyFilter()}
                            placeholder="Cari nomor atau judul permintaan..."
                            className="form-input pl-9"
                        />
                    </div>
                    <select
                        value={status}
                        onChange={e => { setStatus(e.target.value); applyFilter({ status: e.target.value }); }}
                        className="form-select w-44"
                    >
                        {statuses.map(s => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>No. Permintaan</th>
                            <th>Judul</th>
                            <th>Departemen</th>
                            <th>Pemohon</th>
                            <th>Kategori</th>
                            <th>Tanggal</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests?.data?.length > 0 ? requests.data.map(req => {
                            const badge = requestStatusBadge(req.status);
                            return (
                                <tr key={req.id}>
    <td>
        <span className="font-mono text-xs text-slate-500">
            {req.request_number}
        </span>
    </td>
    <td>
        <p className="font-medium text-slate-900 text-sm max-w-xs truncate">{req.title}</p>
    </td>
    <td className="text-sm text-slate-600">{req.department?.name ?? '—'}</td>
    <td className="text-sm text-slate-600">{req.requested_by_user?.name ?? '—'}</td>
    <td>
        {req.category === 'urgent'
            ? <span className="badge badge-red">Urgen</span>
            : <span className="badge badge-slate">Reguler</span>
        }
    </td>
    <td className="text-sm text-slate-500 whitespace-nowrap">
        {formatDate(req.created_at)}
    </td>
    <td><span className={badge.cls}>{badge.label}</span></td>
    <td className="text-right">
        <Link href={route('requests.show', req.uuid)} className="btn-secondary btn-sm">
            Detail
        </Link>
    </td>
</tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={8} className="text-center py-12">
                                    <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Belum ada permintaan</p>
                                    {canCreate && (
                                        <Link href={route('requests.create')} className="text-blue-600 text-sm mt-1 hover:underline">
                                            Buat permintaan pertama
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {requests?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        {requests.from}–{requests.to} dari {requests.total} permintaan
                    </p>
                    <div className="flex gap-1">
                        {requests.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={cn(
    'px-3 py-1.5 text-sm rounded-lg transition-colors',
    link.active ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100 disabled:opacity-40'
)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {selected && (
                <RequestDetailModal req={selected} onClose={() => setSelected(null)} />
            )}
        </AppLayout>
    );
}
