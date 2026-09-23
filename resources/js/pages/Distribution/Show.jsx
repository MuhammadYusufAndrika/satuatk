import { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ArrowLeft, Truck, PackageCheck, CheckCircle2, User, Calendar } from 'lucide-react';
import { cn, formatDate, formatDateTime } from '@/utils';

const STATUS_MAP = {
    scheduled: { cls: 'badge-blue',   label: 'Terjadwal' },
    ready:     { cls: 'badge-yellow', label: 'Siap Diambil' },
    picked_up: { cls: 'badge-green',  label: 'Sudah Diambil' },
    cancelled: { cls: 'badge-slate',  label: 'Dibatalkan' },
};

export default function DistributionShow({ distribution }) {
    const { auth } = usePage().props;
    const canManage = auth.user?.permissions?.includes('distribution.manage');

    // Sesuai Business Rule #13: yang boleh konfirmasi penerimaan HANYA
    // requester pemilik request ini sendiri — bukan admin, bukan requester lain.
    const isOwner   = auth.user?.id === distribution.request?.requestedBy?.id;
    const canPickup = auth.user?.permissions?.includes('distribution.pickup') && isOwner;

    const [showConfirm, setShowConfirm] = useState(false);
    const prepareForm = useForm({});
    const confirmForm = useForm({ proof_notes: '' });

    const s = STATUS_MAP[distribution.status] ?? { cls: 'badge-slate', label: distribution.status };

    const handlePrepare = () => {
        prepareForm.post(route('distribution.prepare', distribution.uuid));
    };

    const handleConfirm = (e) => {
        e.preventDefault();
        confirmForm.post(route('distribution.confirm', distribution.uuid), {
            onSuccess: () => setShowConfirm(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Distribusi ATK', href: route('distribution.index') }, { label: distribution.pickup_number }]}>
            <Head title={`Distribusi ${distribution.pickup_number}`} />

            <div className="page-header">
                <div>
                    <Link href={route('distribution.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Distribusi
                    </Link>
                    <h1 className="page-title flex items-center gap-2.5">
                        {distribution.pickup_number}
                        <span className={cn('badge', s.cls)}>{s.label}</span>
                    </h1>
                    <p className="page-subtitle">{distribution.request?.request_number} — {distribution.request?.title}</p>
                </div>
                <div className="flex gap-2">
                    {canManage && distribution.status === 'scheduled' && (
                        <button onClick={handlePrepare} disabled={prepareForm.processing} className="btn btn-primary">
                            <PackageCheck className="w-4 h-4" /> Tandai Siap Diambil
                        </button>
                    )}
                    {canPickup && distribution.status === 'ready' && (
                        <button onClick={() => setShowConfirm(true)} className="btn btn-success">
                            <CheckCircle2 className="w-4 h-4" /> Konfirmasi Pengambilan
                        </button>
                    )}
                </div>
            </div>

            {distribution.status === 'ready' && !isOwner && (
                <div className="card mb-6 border-amber-200 bg-amber-50">
                    <div className="card-body text-sm text-amber-800">
                        Barang sudah siap diambil. Konfirmasi penerimaan hanya dapat dilakukan oleh
                        <span className="font-semibold"> {distribution.request?.requestedBy?.name ?? 'requester pemohon'} </span>
                        melalui akunnya sendiri.
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="card-header">
                        <h3 className="font-semibold text-slate-900 text-sm">Barang yang Diminta</h3>
                    </div>
                    <div className="table-wrapper !border-0">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Barang</th>
                                    <th>Diminta</th>
                                    <th>Disetujui</th>
                                    <th>Terpenuhi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {distribution.request?.items?.length > 0 ? distribution.request.items.map(ri => (
                                    <tr key={ri.id}>
                                        <td className="font-medium text-slate-800">{ri.item?.name}</td>
                                        <td>{ri.quantity_requested}</td>
                                        <td>{ri.quantity_approved ?? '—'}</td>
                                        <td>{ri.quantity_fulfilled ?? '—'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-400">Tidak ada data barang</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="font-semibold text-slate-900 text-sm">Informasi Jadwal</h3>
                        </div>
                        <div className="card-body space-y-3 text-sm">
                            <div className="flex items-start gap-2.5">
                                <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs">Tanggal Jadwal</p>
                                    <p className="text-slate-800 font-medium">{formatDate(distribution.scheduled_date)}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-2.5">
                                <User className="w-4 h-4 text-slate-400 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs">Departemen / Pemohon</p>
                                    <p className="text-slate-800 font-medium">{distribution.request?.department?.name}</p>
                                    <p className="text-slate-500 text-xs">{distribution.request?.requestedBy?.name}</p>
                                </div>
                            </div>
                            {distribution.prepared_by && (
                                <div className="flex items-start gap-2.5">
                                    <PackageCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Disiapkan Oleh</p>
                                        <p className="text-slate-800 font-medium">{distribution.prepared_by?.name}</p>
                                        <p className="text-slate-500 text-xs">{formatDateTime(distribution.prepared_at)}</p>
                                    </div>
                                </div>
                            )}
                            {distribution.log && (
                                <div className="flex items-start gap-2.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
                                    <div>
                                        <p className="text-slate-500 text-xs">Diambil Oleh</p>
                                        <p className="text-slate-800 font-medium">{distribution.log?.picked_up_by?.name}</p>
                                        <p className="text-slate-500 text-xs">{formatDateTime(distribution.log?.picked_up_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {distribution.notes && (
                        <div className="card">
                            <div className="card-header">
                                <h3 className="font-semibold text-slate-900 text-sm">Catatan</h3>
                            </div>
                            <div className="card-body text-sm text-slate-600">{distribution.notes}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm pickup modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                    <div className="min-h-full flex items-center justify-center p-4">
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto animate-fade-in">
                        <div className="p-5 rounded-t-2xl bg-emerald-50 border-b border-emerald-100">
                            <div className="flex items-center gap-3">
                                <Truck className="w-6 h-6 text-emerald-600" />
                                <h3 className="font-semibold text-lg text-emerald-800">Konfirmasi Pengambilan</h3>
                            </div>
                            <p className="text-sm mt-1 text-slate-600">{distribution.pickup_number}</p>
                        </div>
                        <form onSubmit={handleConfirm} className="p-5 space-y-4">
                            <div>
                                <label className="form-label">Catatan Bukti Serah Terima (opsional)</label>
                                <textarea
                                    rows={3}
                                    value={confirmForm.data.proof_notes}
                                    onChange={e => confirmForm.setData('proof_notes', e.target.value)}
                                    className="form-input form-textarea"
                                    placeholder="Nama penerima, keterangan tambahan, dll."
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button type="button" onClick={() => setShowConfirm(false)} className="btn btn-secondary">
                                    Batal
                                </button>
                                <button type="submit" disabled={confirmForm.processing} className="btn btn-success">
                                    Konfirmasi
                                </button>
                            </div>
                        </form>
                    </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
