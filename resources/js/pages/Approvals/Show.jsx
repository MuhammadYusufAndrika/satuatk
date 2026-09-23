import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft,
    MessageSquare, User, Timer, Package, FileText
} from 'lucide-react';
import { cn } from '@/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LEVEL_MAP = {
    1: { label: 'Level 1 — Senior Manager (SM)',   color: 'blue' },
    2: { label: 'Level 2 — General Manager (GM)',      color: 'purple' },
};

const STATUS_ICON = {
    pending:   <Clock className="w-5 h-5 text-amber-500" />,
    waiting:   <Clock className="w-5 h-5 text-slate-400" />,
    approved:  <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    rejected:  <XCircle className="w-5 h-5 text-red-500" />,
    cancelled: <XCircle className="w-5 h-5 text-slate-300" />,
};

const ACTION_ICON = {
    approved:  <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    rejected:  <XCircle className="w-4 h-4 text-red-500" />,
    commented: <MessageSquare className="w-4 h-4 text-blue-500" />,
};

function formatRp(val) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val ?? 0);
}

// ─── Approval Chain Timeline ──────────────────────────────────────────────────

function ChainTimeline({ chain }) {
    return (
        <div className="space-y-0">
            {chain.map((step, idx) => {
                const lv   = LEVEL_MAP[step.level] ?? LEVEL_MAP[1];
                const isLast = idx === chain.length - 1;
                return (
                    <div key={step.id} className="flex gap-3">
                        {/* Spine */}
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2',
                                step.status === 'approved'  && 'bg-emerald-50 border-emerald-300',
                                step.status === 'rejected'  && 'bg-red-50 border-red-300',
                                step.status === 'pending'   && 'bg-amber-50 border-amber-300',
                                step.status === 'waiting'   && 'bg-slate-50 border-slate-200',
                                step.status === 'cancelled' && 'bg-slate-50 border-slate-100',
                            )}>
                                {STATUS_ICON[step.status]}
                            </div>
                            {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1" />}
                        </div>

                        {/* Content */}
                        <div className={cn('pb-5 flex-1', isLast && 'pb-0')}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-slate-900">{lv.label}</span>
                                {step.status === 'pending' && step.sla_status === 'overdue' && (
                                    <span className="badge badge-red text-xs">Overdue</span>
                                )}
                                {step.status === 'pending' && step.sla_status === 'warning' && (
                                    <span className="badge badge-amber text-xs">Hampir Jatuh Tempo</span>
                                )}
                            </div>

                            <div className="text-xs text-slate-400 space-y-0.5">
                                {step.status === 'pending' && step.due_at && (
                                    <p className="flex items-center gap-1">
                                        <Timer className="w-3 h-3" />
                                        SLA: {step.sla_remaining_label}
                                    </p>
                                )}
                                {step.approver && (
                                    <p className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {step.approver.name} • {step.action_at ? new Date(step.action_at).toLocaleString('id-ID') : ''}
                                    </p>
                                )}
                                {step.notes && (
                                    <p className="mt-1 text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 italic text-xs">
                                        "{step.notes}"
                                    </p>
                                )}
                                {step.status === 'waiting' && (
                                    <p className="text-slate-400 italic">Menunggu level sebelumnya selesai…</p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Comment Log ─────────────────────────────────────────────────────────────

function CommentLog({ logs }) {
    if (!logs?.length) return null;
    return (
        <div className="space-y-3">
            {logs.map(log => (
                <div key={log.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        {ACTION_ICON[log.action] ?? <MessageSquare className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-slate-900">{log.user?.name}</span>
                            <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        {log.notes && <p className="text-sm text-slate-600">{log.notes}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Approve / Reject Modal ───────────────────────────────────────────────────

function ActionModal({ approval, type, onClose }) {
    const isApprove = type === 'approve';
    const { data, setData, post, processing, errors } = useForm({ notes: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route(`approvals.${type}`, approval.uuid), {
            onSuccess: onClose,
        });
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
                <div className={cn('p-5 border-b rounded-t-2xl', isApprove ? 'border-emerald-100 bg-emerald-50' : 'border-red-100 bg-red-50')}>
                    <div className="flex items-center gap-3">
                        {isApprove
                            ? <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            : <XCircle className="w-6 h-6 text-red-600" />
                        }
                        <h3 className="font-semibold text-slate-900">
                            {isApprove ? 'Setujui Permintaan' : 'Tolak Permintaan'}
                        </h3>
                    </div>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div>
                        <label className="form-label">
                            Komentar / Catatan {!isApprove && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                            rows={4}
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            className={cn('form-input form-textarea', errors.notes && 'form-input-error')}
                            placeholder={isApprove
                                ? 'Tambahkan catatan (opsional)…'
                                : 'Jelaskan alasan penolakan (wajib diisi)…'
                            }
                        />
                        {errors.notes && <p className="form-error">{errors.notes}</p>}
                    </div>

                    {!isApprove && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3 border border-red-100">
                            ⚠️ Menolak akan membatalkan semua level approval yang tersisa dan menandai permintaan sebagai <strong>Ditolak</strong>.
                        </div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button
                            type="submit"
                            disabled={processing}
                            className={isApprove ? 'btn btn-success' : 'btn btn-danger'}
                        >
                            {processing ? 'Memproses…' : (isApprove ? '✓ Setujui' : '✕ Tolak')}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

// ─── Comment form ──────────────────────────────────────────────────────────────

function CommentForm({ approval }) {
    const { data, setData, post, processing, reset } = useForm({ notes: '' });
    const submit = (e) => {
        e.preventDefault();
        post(route('approvals.comment', approval.uuid), { onSuccess: () => reset() });
    };
    return (
        <form onSubmit={submit} className="flex gap-3 mt-4">
            <textarea
                rows={2}
                value={data.notes}
                onChange={e => setData('notes', e.target.value)}
                className="form-input form-textarea flex-1"
                placeholder="Tambahkan komentar…"
            />
            <button type="submit" disabled={processing || !data.notes.trim()} className="btn btn-secondary self-end">
                <MessageSquare className="w-4 h-4" />
            </button>
        </form>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ApprovalShow({ approval, chain }) {
    const { auth } = usePage().props;
    const roles = auth.user?.roles ?? [];
    const approvalLevel = auth.user?.approval_level ?? 0;
    const isApprover = roles.includes('SM') || roles.includes('GM');
    const canAct = approval.status === 'pending'
        && isApprover
        && (approvalLevel >= 2 || approvalLevel === approval.required_level);

    const [modal, setModal] = useState(null); // 'approve' | 'reject' | null
    const req  = approval.request;

    return (
        <AppLayout breadcrumbs={[
            { label: 'Persetujuan', href: route('approvals.index') },
            { label: req?.request_number ?? '—' },
        ]}>
            <Head title={`Persetujuan — ${req?.request_number}`} />

            {/* Header */}
            <div className="page-header">
                <div>
                    <Link href={route('approvals.index')} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-1">
                        <ChevronLeft className="w-3 h-3" /> Kembali ke daftar
                    </Link>
                    <h1 className="page-title">{req?.request_number}</h1>
                    <p className="page-subtitle">{req?.title}</p>
                </div>

                {canAct && (
                    <div className="flex gap-3">
                        <button onClick={() => setModal('reject')} className="btn btn-danger">
    <XCircle className="w-4 h-4" /> Tolak
</button>
<button onClick={() => setModal('approve')} className="btn btn-success">
    <CheckCircle2 className="w-4 h-4" /> Setujui Level {approval.level}
</button>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Request detail */}
                <div className="lg:col-span-2 space-y-5">

                    {/* SLA Banner */}
                    {canAct && approval.due_at && (
                        <div className={cn('flex items-center gap-3 p-4 rounded-xl border',
                            approval.sla_status === 'overdue'  && 'bg-red-50 border-red-200 text-red-700',
                            approval.sla_status === 'warning'  && 'bg-amber-50 border-amber-200 text-amber-700',
                            approval.sla_status === 'ok'       && 'bg-blue-50 border-blue-100 text-blue-700',
                        )}>
                            <Timer className="w-5 h-5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium">
                                    {approval.sla_status === 'overdue' ? 'SLA Terlewat!' : 'SLA Countdown'}
                                </p>
                                <p className="text-xs opacity-80">{approval.sla_remaining_label}</p>
                            </div>
                        </div>
                    )}

                    {/* Request info */}
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900">Detail Permintaan</h3></div>
                        <div className="card-body grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Pemohon</p>
                                <p className="font-medium text-slate-900">{req?.requester?.name}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Departemen</p>
                                <p className="font-medium text-slate-900">{req?.department?.name ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Tanggal Pengajuan</p>
                                <p className="font-medium text-slate-900">
                                    {req?.created_at ? new Date(req.created_at).toLocaleDateString('id-ID', { day:'2-digit',month:'long',year:'numeric' }) : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Kebutuhan Tanggal</p>
                                <p className="font-medium text-slate-900">
                                    {req?.needed_date ? new Date(req.needed_date).toLocaleDateString('id-ID', { day:'2-digit',month:'long',year:'numeric' }) : '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 text-xs mb-0.5">Delivery Point</p>
                                <p className="font-medium text-slate-900">{req?.delivery_point ?? '—'}</p>
                            </div>
                            {req?.notes && (
                                <div className="col-span-2">
                                    <p className="text-slate-400 text-xs mb-0.5">Catatan Pemohon</p>
                                    <p className="text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">{req.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items table */}
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Package className="w-4 h-4" /> Barang yang Diminta</h3></div>
                        <div className="overflow-hidden">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Barang</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Harga Satuan</th>
                                        <th className="text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {req?.items?.map(ri => (
                                        <tr key={ri.id}>
                                            <td>
                                                <p className="font-medium text-slate-900">{ri.item?.name}</p>
                                                <p className="text-xs text-slate-400">{ri.item?.category?.name} · {ri.item?.unit?.symbol}</p>
                                            </td>
                                            <td className="text-center font-medium">{ri.quantity_requested}</td>
                                            <td className="text-right text-sm">{formatRp(ri.item?.price)}</td>
                                            <td className="text-right font-semibold text-slate-900">
                                                {formatRp((ri.item?.price ?? 0) * ri.quantity_requested)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50">
                                    <tr>
                                        <td colSpan={3} className="text-right text-sm font-semibold text-slate-700 px-4 py-3">Total Nilai Permintaan</td>
                                        <td className="text-right px-4 py-3 font-bold text-slate-900">
                                            {formatRp(req?.items?.reduce((sum, ri) => sum + (ri.item?.price ?? 0) * ri.quantity_requested, 0))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Comment log */}
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Komentar & Log</h3></div>
                        <div className="card-body">
                            <CommentLog logs={approval.logs} />
                            {approval.logs?.length === 0 && (
                                <p className="text-slate-300 text-sm text-center py-4">Belum ada komentar.</p>
                            )}
                            <CommentForm approval={approval} />
                        </div>
                    </div>
                </div>

                {/* Right: Chain timeline */}
                <div className="space-y-5">
                    <div className="card">
                        <div className="card-header"><h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><FileText className="w-4 h-4" /> Rantai Persetujuan</h3></div>
                        <div className="card-body">
                            <ChainTimeline chain={chain} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {modal && (
                <ActionModal
                    approval={approval}
                    type={modal}
                    onClose={() => setModal(null)}
                />
            )}
        </AppLayout>
    );
}
