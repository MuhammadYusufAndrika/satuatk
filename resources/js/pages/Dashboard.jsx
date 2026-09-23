import { useEffect, useRef, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {
    XCircle, ClipboardList,
    CheckSquare, Star, CheckCircle, Clock, Ban,
    Building2, Lightbulb, ShieldCheck,
} from 'lucide-react';

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ title, value, icon: Icon, color, subtitle }) {
    const colorMap = {
        blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    border: 'border-blue-100' },
        amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   border: 'border-amber-100' },
        red:     { bg: 'bg-red-50',     icon: 'text-red-600',     border: 'border-red-100' },
        green:   { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
        purple:  { bg: 'bg-purple-50',  icon: 'text-purple-600',  border: 'border-purple-100' },
        slate:   { bg: 'bg-slate-50',   icon: 'text-slate-600',   border: 'border-slate-100' },
    };
    const c = colorMap[color] ?? colorMap.blue;

    return (
        <div className={`stat-card border ${c.border}`}>
            <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-slate-500 font-medium mb-0.5">{title}</p>
                <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

function AlertCard({ title, value, color }) {
    const colorMap = {
        red:   { border: 'border-red-300',   text: 'text-red-600',   title: 'text-red-500' },
        amber: { border: 'border-amber-300', text: 'text-amber-600', title: 'text-amber-500' },
    };
    const c = colorMap[color] ?? colorMap.red;

    return (
        <div className={`border-2 border-dashed ${c.border} rounded-xl p-4`}>
            <p className={`text-xs font-medium ${c.title} mb-1`}>{title}</p>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        </div>
    );
}

function StockStatusBadge({ status }) {
    const styles = status === 'KRITIS'
        ? 'bg-red-100 text-red-700'
        : 'bg-amber-100 text-amber-700';
    return (
        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${styles}`}>
            {status}
        </span>
    );
}

// ─── Request Status Badge ──────────────────────────────────────────────────────

function RequestStatusBadge({ status }) {
    const styleMap = {
        draft:               'bg-slate-100 text-slate-600',
        submitted:           'bg-blue-100 text-blue-700',
        approved:            'bg-emerald-100 text-emerald-700',
        partially_approved:  'bg-amber-100 text-amber-700',
        fulfilled:           'bg-purple-100 text-purple-700',
        rejected:            'bg-red-100 text-red-700',
        cancelled:           'bg-slate-100 text-slate-500',
    };
    const labelMap = {
        draft:               'Draft',
        submitted:           'Diajukan',
        approved:            'Disetujui',
        partially_approved:  'Sebagian Disetujui',
        fulfilled:           'Selesai',
        rejected:            'Ditolak',
        cancelled:           'Dibatalkan',
    };
    const style = styleMap[status] ?? 'bg-slate-100 text-slate-600';
    const label = labelMap[status] ?? status;

    return (
        <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${style}`}>
            {label}
        </span>
    );
}

// ─── Department Request Bar ────────────────────────────────────────────────

function DepartmentRequestBar({ dept, maxValue }) {
    const pct = maxValue > 0 ? Math.round((dept.total_requests / maxValue) * 100) : 0;
    return (
        <div className="py-2.5">
            <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-slate-700 truncate">{dept.name}</span>
                <span className="text-sm font-semibold text-slate-800">{dept.total_requests}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── ATK Needs Insight Card ─────────────────────────────────────────────────

function NeedsInsightCard({ insight }) {
    const hasInsight = insight?.has_insight;

    return (
        <div className="card">
            <div className="card-header flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-slate-900 text-sm">Kebutuhan ATK Berdasarkan Pola Permintaan</h3>
            </div>
            <div className="card-body">
                {hasInsight ? (
                    <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                        {insight.items?.length > 0 && (
                            <p>
                                Berdasarkan pola permintaan saat ini,{' '}
                                <strong className="text-slate-900">{insight.items.join(' dan ')}</strong>{' '}
                                diproyeksikan menembus ambang minimum dalam{' '}
                                <strong className="text-slate-900">{insight.weeks} minggu</strong> ke depan.
                            </p>
                        )}

                        {insight.demand_increase && (
                            <p>
                                <strong className="text-slate-900">{insight.demand_increase.department}</strong>{' '}
                                menunjukkan kenaikan permintaan{' '}
                                <strong className="text-slate-900">{insight.demand_increase.item_name}</strong>{' '}
                                sebesar{' '}
                                <strong className="text-slate-900">{insight.demand_increase.percent}%</strong>{' '}
                                pada periode ini.
                            </p>
                        )}

                        {insight.procurement?.length > 0 && (
                            <p>
                                Disarankan pengadaan awal{' '}
                                {insight.procurement.map((p, i) => (
                                    <span key={i}>
                                        <strong className="text-slate-900">
                                            {p.qty} {p.unit} {p.name}
                                        </strong>
                                        {i < insight.procurement.length - 2
                                            ? ', '
                                            : i === insight.procurement.length - 2
                                            ? ' dan '
                                            : ''}
                                    </span>
                                ))}{' '}
                                sebelum <strong className="text-slate-900">{insight.deadline}</strong>.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="py-8 text-center">
                        <Lightbulb className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Pola permintaan stabil, belum ada yang perlu diwaspadai</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Distribution History Table (dipakai ulang di beberapa role) ─────────────

function DistributionHistoryTable({ rows, title }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
            </div>
            <div className="card-body py-0">
                {rows && rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">No. Request</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Departemen</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.date}</td>
                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.request_number}</td>
                                        <td className="px-4 py-3 text-slate-700">{row.department}</td>
                                        <td className="px-4 py-3"><RequestStatusBadge status={row.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-10 text-center">
                        <p className="text-sm text-slate-400">Belum ada histori</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard({ stats, department_requests, needs_insight, top_items, critical_stock_items, distribution_history }) {
    const { auth } = usePage().props;
    const roles = auth.user?.roles ?? [];
    const isAdmin = roles.includes('Admin');
    const isApprover = roles.includes('SM') || roles.includes('GM');
    const isRequester = roles.includes('Requester');

    const s = stats ?? {};

    const leftColRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(null);

    useEffect(() => {
        if (!isAdmin) return;
        const el = leftColRef.current;
        if (!el) return;

        const updateHeight = () => setLeftColHeight(el.offsetHeight);
        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, [critical_stock_items, isAdmin]);

    const maxDeptRequests = Math.max(1, ...(department_requests ?? []).map((d) => d.total_requests));

    return (
        <AppLayout breadcrumbs={[{ label: 'Dashboard' }]}>
            <Head title="Dashboard" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Ringkasan sistem pengendalian ATK</p>
                </div>
            </div>

            {/* Statistik request — muncul untuk semua role, datanya otomatis ke-scope: */}
            {/* Admin/SM/GM lihat semua, Requester cuma lihat miliknya sendiri.        */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                <StatCard title="Total Request" value={s.requests_total ?? 0} icon={ClipboardList} color="blue" />
                <StatCard title="Request Disetujui" value={s.requests_approved ?? 0} icon={CheckSquare} color="green" />
                <StatCard title="Request Ditolak" value={s.requests_rejected ?? 0} icon={XCircle} color="red" />
                <StatCard title="Request Selesai" value={s.requests_completed ?? 0} icon={CheckCircle} color="purple" />
                <StatCard title="Request Diproses" value={s.requests_processing ?? 0} icon={Clock} color="amber" />
                <StatCard title="Request Dibatalkan" value={s.requests_cancelled ?? 0} icon={Ban} color="slate" />
            </div>

            {/* ═══════════════════════ ADMIN: semua widget, sama seperti sebelumnya ═══════════════════════ */}
            {isAdmin && (
                <>
                    <div className="grid lg:grid-cols-2 gap-6 mb-6">
                        <div ref={leftColRef} className="flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <AlertCard title="Duplicate Warning" value={s.duplicate_warnings ?? 0} color="red" />
                                <AlertCard title="Partial Fulfillment" value={s.partial_fulfillment ?? 0} color="amber" />
                            </div>

                            <div className="card w-full">
                                <div className="card-header">
                                    <h3 className="font-semibold text-slate-900 text-sm">Item Stok Kritis</h3>
                                </div>
                                <div className="card-body py-0">
                                    {critical_stock_items && critical_stock_items.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Items</th>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Stok Saat Ini</th>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Min Stok</th>
                                                        <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {critical_stock_items.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                                                            <td className="px-4 py-3 text-center text-sm text-slate-700">{item.current_stock}</td>
                                                            <td className="px-4 py-3 text-center text-sm text-slate-500">{item.min_stock}</td>
                                                            <td className="px-4 py-3 text-center"><StockStatusBadge status={item.status} /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-sm text-slate-400">Semua stok dalam kondisi aman</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div
                            className="card flex flex-col overflow-hidden"
                            style={leftColHeight ? { height: `${leftColHeight}px` } : undefined}
                        >
                            <div className="card-header">
                                <h3 className="font-semibold text-slate-900 text-sm">Histori Distribusi/Pemesanan ATK</h3>
                            </div>
                            <div className="card-body py-0 flex-1 overflow-y-auto">
                                {distribution_history && distribution_history.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                                            <thead>
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Tanggal</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">No. Request</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Departemen</th>
                                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {distribution_history.map((row) => (
                                                    <tr key={row.id}>
                                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.date}</td>
                                                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{row.request_number}</td>
                                                        <td className="px-4 py-3 text-slate-700">{row.department}</td>
                                                        <td className="px-4 py-3"><RequestStatusBadge status={row.status} /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <p className="text-sm text-slate-400">Belum ada histori</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="card">
                            <div className="card-header flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <h3 className="font-semibold text-slate-900 text-sm">Request per Departemen</h3>
                            </div>
                            <div className="card-body py-0 max-h-80 overflow-y-auto">
                                {department_requests && department_requests.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {department_requests.map((d, i) => (
                                            <DepartmentRequestBar key={i} dept={d} maxValue={maxDeptRequests} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Belum ada request bulan ini</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <NeedsInsightCard insight={needs_insight} />

                        <div className="card">
                            <div className="card-header flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 text-sm">Barang Terpopuler</h3>
                                <Star className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="card-body py-0">
                                {top_items && top_items.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {top_items.slice(0, 5).map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 py-3">
                                                <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                                                    <p className="text-xs text-slate-400">{item.total_requested} diminta</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Star className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Belum ada data</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ═══════════════════════ SM & GM: fokus approval & pantauan ═══════════════════════ */}
            {isApprover && !isAdmin && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <AlertCard title="Menunggu Persetujuan Saya" value={s.pending_approvals ?? 0} color="amber" />
                        <AlertCard title="Duplicate Warning" value={s.duplicate_warnings ?? 0} color="red" />
                        <AlertCard title="Partial Fulfillment" value={s.partial_fulfillment ?? 0} color="amber" />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="card">
                            <div className="card-header flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                <h3 className="font-semibold text-slate-900 text-sm">Request per Departemen</h3>
                            </div>
                            <div className="card-body py-0 max-h-80 overflow-y-auto">
                                {department_requests && department_requests.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {department_requests.map((d, i) => (
                                            <DepartmentRequestBar key={i} dept={d} maxValue={maxDeptRequests} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Building2 className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Belum ada request bulan ini</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DistributionHistoryTable rows={distribution_history} title="Histori Distribusi/Pemesanan ATK" />
                    </div>
                </>
            )}

            {/* ═══════════════════════ REQUESTER: fokus ke permintaan sendiri ═══════════════════════ */}
            {isRequester && !isAdmin && !isApprover && (
                <DistributionHistoryTable rows={distribution_history} title="Riwayat Permintaan" />
            )}
        </AppLayout>
    );
}