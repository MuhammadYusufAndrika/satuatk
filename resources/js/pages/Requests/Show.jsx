import { useEffect, useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {
    ChevronLeft, Package, FileText, CheckCircle2, XCircle, Clock,
    Send, Pencil, Ban, User, Building2, Calendar, FolderOpen, Truck, AlertTriangle
} from 'lucide-react';
import { cn, formatCurrency, formatDate, requestStatusBadge } from '@/utils';

const CATEGORY_ICON = {
    urgent:  <span className="badge badge-red">Urgen</span>,
    regular: <span className="badge badge-slate">Reguler</span>,
};

const STATUS_ICON = {
    draft:   <Clock className="w-5 h-5 text-slate-400" />,
    submitted: <Clock className="w-5 h-5 text-blue-500" />,
    approved:  <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    partially_approved: <Clock className="w-5 h-5 text-amber-500" />,
    rejected:  <XCircle className="w-5 h-5 text-red-500" />,
    fulfilled: <CheckCircle2 className="w-5 h-5 text-purple-500" />,
    cancelled: <XCircle className="w-5 h-5 text-slate-300" />,
};

const PICKUP_STATUS_LABEL = {
    scheduled: 'Terjadwal',
    ready:     'Siap Diambil',
    picked_up: 'Sudah Diambil',
    cancelled: 'Dibatalkan',
};

export default function RequestShow({ request, fulfillmentCheck }) {
    const { auth, flash } = usePage().props;
    const [duplicateWarning, setDuplicateWarning] = useState(null);
    useEffect(() => {
        if (flash?.duplicate_warning) {
            setDuplicateWarning(flash.duplicate_warning);
        }
    }, [flash]);

    const [showFulfillmentModal, setShowFulfillmentModal] = useState(
        request.fulfillment_status === 'awaiting_confirmation'
    );
    useEffect(() => {
        if (request.fulfillment_status === 'awaiting_confirmation') {
            setShowFulfillmentModal(true);
        }
    }, [request.fulfillment_status]);

    const perms = auth.user?.permissions ?? [];

    const canEdit   = request.status === 'draft' && perms.includes('request.edit');
    const canSubmit = request.status === 'draft';
    const canCancel = ['draft', 'submitted'].includes(request.status) && perms.includes('request.cancel');

    const submitForm = useForm({});
    const cancelForm = useForm({});
    const confirmPartialForm = useForm({});
    const cancelStockForm = useForm({});
    const confirmReceiptForm = useForm({});

    
    const badge = requestStatusBadge(request.status);
    const showFulfillmentColumns = !['draft', 'submitted'].includes(request.status);
const effectiveQty = (ri) => ri.quantity_fulfilled ?? ri.quantity_approved ?? ri.quantity_requested;
const total = request.items?.reduce((sum, ri) => sum + (ri.item?.price ?? 0) * effectiveQty(ri), 0) ?? 0;

    return (
        <AppLayout breadcrumbs={[
            { label: 'Permintaan ATK', href: route('requests.index') },
            { label: request.request_number },
        ]}>
            <Head title={request.request_number} />

            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href={route('requests.index')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
                        <ChevronLeft className="w-3 h-3" /> Kembali ke daftar
                    </Link>
                    <h1 className="page-title">{request.request_number}</h1>
                    <p className="page-subtitle">{request.title}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    {canSubmit && (
                        <button
                            onClick={() => submitForm.post(route('requests.submit', request.uuid))}
                            disabled={submitForm.processing}
                            className="btn btn-primary"
                        >
                            <Send className="w-4 h-4" /> {submitForm.processing ? 'Mengirim…' : 'Ajukan'}
                        </button>
                    )}
                    {canEdit && (
                        <Link href={route('requests.edit', request.uuid)} className="btn btn-secondary">
                            <Pencil className="w-4 h-4" /> Edit
                        </Link>
                    )}
                    {canCancel && (
                        <button
                            onClick={() => cancelForm.post(route('requests.cancel', request.uuid))}
                            disabled={cancelForm.processing}
                            className="btn btn-danger btn-soft"
                        >
                            <Ban className="w-4 h-4" /> Batalkan
                        </button>
                    )}
                </div>
            </div>

            {request.fulfillment_status === 'awaiting_confirmation' && !showFulfillmentModal && (
                <button
                    onClick={() => setShowFulfillmentModal(true)}
                    className="card mb-6 border-amber-200 bg-amber-50 w-full text-left"
                >
                    <div className="card-body flex items-center gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <p className="text-sm text-amber-800">
                            Stok tidak mencukupi — klik untuk lihat detail dan konfirmasi.
                        </p>
                    </div>
                </button>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: details + items */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Info */}
                    <div className="card">
                        <div className="card-header flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Detail Permintaan</h3>
                            <span className={badge.cls}>{badge.label}</span>
                        </div>
                        <div className="card-body grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Pemohon</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-slate-400" /> {request.requestedBy?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Departemen</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {request.department?.name ?? '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kategori</p>
                                <p className="flex items-center gap-1.5">{CATEGORY_ICON[request.category]}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Tanggal Pengajuan</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(request.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Tanggal Dibutuhkan</p>
                                <p className="font-medium text-slate-900">{formatDate(request.needed_date)}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Delivery Point</p>
                                <p className="font-medium text-slate-900">{request.delivery_point ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Status</p>
                                <p className="font-medium text-slate-900 flex items-center gap-1.5">
                                    <FolderOpen className="w-3.5 h-3.5 text-slate-400" /> {request.status_label ?? badge.label}
                                </p>
                            </div>
                            {request.notes && (
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-0.5">Catatan Pemohon</p>
                                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{request.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Package className="w-4 h-4" /> Barang yang Diminta</h3></div>
                        <div className="overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Barang</th>
                                        <th className="text-center">Diminta</th>
                                        {showFulfillmentColumns && <th className="text-center">Disetujui</th>}
                                        {showFulfillmentColumns && <th className="text-center">Terpenuhi</th>}
                                        <th className="text-right">Harga Satuan</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {request.items?.map(ri => (
                                        <tr key={ri.id}>
                                            <td>
                                                <p className="font-medium text-slate-900">{ri.item?.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    {ri.item?.code} · {ri.item?.category?.name} · {ri.item?.unit?.symbol}
                                                </p>
                                            </td>
                                            <td className="text-center font-medium">{ri.quantity_requested}</td>
                                            {showFulfillmentColumns && (
                                                <td className="text-center">
                                                    <span className={cn(
                                                        'font-medium',
                                                        ri.quantity_approved < ri.quantity_requested ? 'text-amber-600' : 'text-slate-900'
                                                    )}>
                                                        {ri.quantity_approved ?? '—'}
                                                    </span>
                                                    {ri.status === 'unavailable' && (
                                                        <span className="block text-[10px] text-red-500 mt-0.5">Tidak tersedia</span>
                                                    )}
                                                    {ri.status === 'approved' && ri.quantity_approved < ri.quantity_requested && (
                                                        <span className="block text-[10px] text-amber-600 mt-0.5">Sebagian</span>
                                                    )}
                                                </td>
                                            )}
                                            {showFulfillmentColumns && (
                                                <td className="text-center font-medium text-slate-900">
                                                    {ri.quantity_fulfilled ?? '—'}
                                                </td>
                                            )}
                                            <td className="text-right text-sm">{formatCurrency(ri.item?.price)}</td>
                                            <td className="text-right font-semibold text-slate-900">
    {formatCurrency((ri.item?.price ?? 0) * effectiveQty(ri))}
</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50">
                                    <tr>
                                        <td colSpan={showFulfillmentColumns ? 5 : 3} className="text-right text-sm font-semibold text-slate-700 px-4 py-3">Total Nilai Permintaan</td>
                                        <td className="text-right px-4 py-3 font-bold text-slate-900">{formatCurrency(total)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: approvals + pickup */}
                <div className="space-y-5">
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Rantai Persetujuan</h3></div>
                        <div className="card-body">
                            {request.approvals?.length ? (
                                <div className="space-y-0">
                                    {[...request.approvals]
                                        .sort((a, b) => a.level - b.level)
                                        .map((step, idx) => {
                                            const isLast = idx === request.approvals.length - 1;
                                            return (
                                                <div key={step.id} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                                                            step.status === 'approved'  && 'bg-emerald-50 border-emerald-300',
                                                            step.status === 'rejected'  && 'bg-red-50 border-red-300',
                                                            step.status === 'pending'   && 'bg-blue-50 border-blue-300',
                                                            step.status === 'waiting'   && 'bg-slate-50 border-slate-200',
                                                            step.status === 'cancelled' && 'bg-slate-50 border-slate-100',
                                                        )}>
                                                            {STATUS_ICON[step.status]}
                                                        </div>
                                                        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                                                    </div>
                                                    <div className={cn('pb-5 flex-1', isLast && 'pb-0')}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-semibold text-slate-900">Level {step.level}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 space-y-0.5">
                                                            {step.approver && (
                                                                <p className="flex items-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {step.approver.name}{step.action_at ? ` • ${formatDate(step.action_at)}` : ''}
                                                                </p>
                                                            )}
                                                            {step.notes && (
                                                                <p className="mt-1 text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic text-xs">
                                                                    "{step.notes}"
                                                                </p>
                                                            )}
                                                            <p className={cn(
                                                                'capitalize',
                                                                step.status === 'approved' && 'text-emerald-600',
                                                                step.status === 'rejected' && 'text-red-600',
                                                                step.status === 'pending' && 'text-blue-600',
                                                                step.status === 'waiting' && 'text-slate-400',
                                                                step.status === 'cancelled' && 'text-slate-400',
                                                            )}>
                                                                {step.status === 'waiting' ? 'Menunggu level sebelumnya…' : step.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <p className="text-slate-300 text-sm text-center py-4">
                                    {request.status === 'draft'
                                        ? 'Belum ada rantai persetujuan (draft).'
                                        : 'Belum ada data persetujuan.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Pickup schedule */}
                    {request.pickupSchedule && (
                        <div className="card">
                            <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Truck className="w-4 h-4" /> Jadwal Pengambilan</h3></div>
                            <div className="card-body grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs mb-0.5">Tanggal</p>
                                    <p className="font-medium text-slate-900">{formatDate(request.pickupSchedule.scheduled_date)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs mb-0.5">Status</p>
                                    <p className="font-medium text-slate-900">{PICKUP_STATUS_LABEL[request.pickupSchedule.status] ?? request.pickupSchedule.status}</p>
                                </div>
                                {request.pickupSchedule.pickup_location && (
                                    <div className="col-span-2">
                                        <p className="text-slate-400 text-xs mb-0.5">Lokasi</p>
                                        <p className="font-medium text-slate-900">{request.pickupSchedule.pickup_location}</p>
                                    </div>
                                )}
                            </div>

                            {request.pickupSchedule.status === 'ready' && request.requestedBy?.id === auth.user?.id && (
                                <div className="card-body border-t border-slate-100 pt-4">
                                    <p className="text-sm text-slate-600 mb-3">
                                        Barang sudah disiapkan Admin Gudang dan siap diambil. Konfirmasi setelah kamu menerima barangnya.
                                    </p>
                                    <button
                                        onClick={() => confirmReceiptForm.post(route('distribution.confirm', request.pickupSchedule.uuid))}
                                        disabled={confirmReceiptForm.processing}
                                        className="btn btn-primary"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> {confirmReceiptForm.processing ? 'Mengonfirmasi…' : 'Konfirmasi Barang Diterima'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showFulfillmentModal && request.fulfillment_status === 'awaiting_confirmation' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowFulfillmentModal(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex items-start gap-2.5 mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                            <h3 className="font-semibold text-slate-900 text-lg">Konfirmasi Pemenuhan Diperlukan</h3>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                            Stok tidak mencukupi untuk memenuhi seluruh permintaan Anda. Anda dapat menyetujui
                            pemenuhan sebagian sesuai stok yang tersedia, atau membatalkan permintaan ini.
                        </p>
                        {fulfillmentCheck?.length > 0 && (
                            <ul className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 list-disc list-inside space-y-1 max-h-64 overflow-y-auto">
                                {fulfillmentCheck.map((fc) => (
                                    <li key={fc.request_item_id}>
                                        {fc.item_name} — tersedia {fc.available} dari {fc.requested} {fc.unit} yang diminta
                                    </li>
                                ))}
                            </ul>
                        )}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => cancelStockForm.post(route('fulfillment.cancel', request.uuid))}
                                disabled={cancelStockForm.processing}
                                className="btn btn-secondary"
                            >
                                Batalkan Permintaan
                            </button>
                            <button
                                onClick={() => confirmPartialForm.post(route('fulfillment.confirmPartial', request.uuid))}
                                disabled={confirmPartialForm.processing}
                                className="btn btn-primary"
                            >
                                Setujui Pemenuhan Sebagian
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {duplicateWarning && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setDuplicateWarning(null)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="font-semibold text-slate-900 text-lg mb-2">⚠️ Mohon Diperiksa Kembali</h3>
                        {duplicateWarning.duplicate_items?.length > 0 && (
                            <>
                                <p className="text-sm text-slate-600 mb-2">
                                    Kamu pernah meminta barang berikut dalam 7 hari kerja terakhir:
                                </p>
                                <ul className="text-sm text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 list-disc list-inside">
                                    {duplicateWarning.duplicate_items.map((name, i) => <li key={i}>{name}</li>)}
                                </ul>
                            </>
                        )}
                        {duplicateWarning.low_stock_items?.length > 0 && (
                            <>
                                <p className="text-sm text-slate-600 mb-2">
                                    Jumlah yang diminta melebihi stok yang tersedia saat ini:
                                </p>
                                <ul className="text-sm text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 list-disc list-inside">
                                    {duplicateWarning.low_stock_items.map((it, i) => (
                                        <li key={i}>{it.name} — diminta {it.requested} {it.unit}, tersedia {it.available} {it.unit}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <p className="text-sm text-slate-600 mb-5">
                            Pastikan ini sudah sesuai kebutuhan. Tetap lanjutkan jika memang diperlukan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDuplicateWarning(null)}
                                className="btn btn-secondary flex-1"
                            >
                                Kembali ke Draft
                            </button>
                            <button
                                onClick={() => {
                                    setDuplicateWarning(null);
                                    submitForm.transform(data => ({ ...data, force: true })).post(route('requests.submit', request.uuid));
                                }}
                                className="btn btn-primary flex-1"
                            >
                                Tetap Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}