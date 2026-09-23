import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/AppLayout';
import {
    CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight,
    Filter, BarChart3, Timer, Users2
} from 'lucide-react';
import { cn } from '@/utils';

// ─── Status & Level helpers ───────────────────────────────────────────────

const STATUS_MAP = {
    pending:  { label: 'Menunggu',  cls: 'badge-amber' },
    waiting:  { label: 'Antre',     cls: 'badge-slate' },
    approved: { label: 'Disetujui', cls: 'badge-green' },
    rejected: { label: 'Ditolak',   cls: 'badge-red'   },
    cancelled:{ label: 'Dibatalkan',cls: 'badge-slate'  },
};

const LEVEL_MAP = {
    1: { label: 'Level 1 - SM', cls: 'bg-blue-100 text-blue-700' },
    2: { label: 'Level 2 - GM',    cls: 'bg-purple-100 text-purple-700' },
};

const SLA_MAP = {
    ok:      { cls: 'text-emerald-600', icon: Clock },
    warning: { cls: 'text-amber-500',   icon: AlertTriangle },
    overdue: { cls: 'text-red-600',     icon: AlertTriangle },
};

// ─── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }) {
    const colors = {
        amber:   'bg-amber-50 text-amber-600 border-amber-100',
        slate:   'bg-slate-50 text-slate-500 border-slate-100',
        green:   'bg-emerald-50 text-emerald-600 border-emerald-100',
        red:     'bg-red-50 text-red-600 border-red-100',
        rose:    'bg-rose-50 text-rose-600 border-rose-100',
    };
    return (
        <div className={cn('stat-card border', colors[color] ?? colors.slate)}>
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colors[color])}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </div>
    );
}

// ─── Row ────────────────────────────────────────────────────────────────────

function ApprovalRow({ approval }) {
    const status  = STATUS_MAP[approval.status] ?? STATUS_MAP.pending;
    const level   = LEVEL_MAP[approval.level]   ?? LEVEL_MAP[1];
    const sla     = SLA_MAP[approval.sla_status ?? 'ok'];
    const SlaIcon = sla.icon;
    const req     = approval.request;

    return (
        <tr className="hover:bg-slate-50/50 transition-colors">
            <td>
                <span className="font-mono text-xs text-slate-500">{req?.request_number}</span>
            </td>
            <td>
                <p className="font-medium text-slate-900 text-sm truncate max-w-48">{req?.title}</p>
                <p className="text-xs text-slate-400">{req?.requester?.name}</p>
            </td>
            <td>
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', level.cls)}>
                    {level.label}
                </span>
            </td>
            <td>
                <span className={cn('badge', status.cls)}>{status.label}</span>
            </td>
            <td>
                {approval.due_at && approval.status === 'pending' ? (
                    <div className={cn('flex items-center gap-1 text-xs', sla.cls)}>
                        <SlaIcon className="w-3.5 h-3.5" />
                        {approval.sla_remaining_label}
                    </div>
                ) : (
                    <span className="text-slate-300 text-xs">—</span>
                )}
            </td>
            <td className="text-right">
                <Link
                    href={route('approvals.show', approval.uuid)}
                    className={cn(
                        'inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors',
                        approval.status === 'pending'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'text-slate-500 hover:bg-slate-100'
                    )}
                >
                    {approval.status === 'pending' ? 'Tinjau' : 'Lihat'}
                    <ChevronRight className="w-3 h-3" />
                </Link>
            </td>
        </tr>
    );
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function ApprovalsIndex({ approvals, stats, filters }) {
    const [status, setStatus] = useState(filters?.status ?? '');
    const [level, setLevel]   = useState(filters?.level  ?? '');

    const applyFilters = () => router.get(
        route('approvals.index'),
        { status: status || undefined, level: level || undefined },
        { preserveState: true, replace: true }
    );

    return (
        <AppLayout breadcrumbs={[{ label: 'Persetujuan' }]}>
            <Head title="Antrian Persetujuan" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Antrian Persetujuan</h1>
                    <p className="page-subtitle">Multi-level approval — tinjau dan setujui permintaan ATK</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard label="Menunggu Saya"   value={stats.pending}  icon={Clock}         color="amber" />
                <StatCard label="Antre Level Berikutnya" value={stats.waiting}  icon={Users2}  color="slate" />
                <StatCard label="Disetujui"        value={stats.approved} icon={CheckCircle2}  color="green" />
                <StatCard label="Ditolak"          value={stats.rejected} icon={XCircle}       color="red"   />
                <StatCard label="Overdue"          value={stats.overdue}  icon={AlertTriangle} color="rose"  />
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-36">
                            <option value="">Semua</option>
                            <option value="pending">Menunggu</option>
                            <option value="waiting">Antre</option>
                            <option value="approved">Disetujui</option>
                            <option value="rejected">Ditolak</option>
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Level</label>
                        <select value={level} onChange={e => setLevel(e.target.value)} className="form-select w-36">
                            <option value="">Semua Level</option>
                            <option value="1">Level 1 (SM)</option>
                            <option value="2">Level 2 (GM)</option>
                        </select>
                    </div>
                    <button onClick={applyFilters} className="btn btn-secondary">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>No. Permintaan</th>
                            <th>Judul</th>
                            <th>Level</th>
                            <th>Status</th>
                            <th>SLA</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvals?.data?.length > 0 ? (
                            approvals.data.map(a => <ApprovalRow key={a.id} approval={a} />)
                        ) : (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Tidak ada permintaan persetujuan</p>
                                    <p className="text-slate-300 text-sm mt-1">Semua permintaan sudah diproses.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {approvals?.last_page > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    {Array.from({ length: approvals.last_page }, (_, i) => i + 1).map(p => (
                        <button
                            key={p}
                            onClick={() => router.get(route('approvals.index'), { ...filters, page: p })}
                            className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                                approvals.current_page === p
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            )}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}
        </AppLayout>
    );
}