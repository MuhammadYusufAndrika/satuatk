import { useEffect, useRef, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Chart from 'react-apexcharts';
import {
    XCircle, ClipboardList,
    CheckSquare, Star, CheckCircle, Clock, Ban,
    Building2, Lightbulb, ShieldCheck, AlertTriangle,
    TrendingUp, Package, ArrowRight, Plus,
    Flame, Trophy, PackageCheck, Truck, Timer, ChevronRight,
} from 'lucide-react';

// ─── Tone: navy pekat + royal blue solid (korporat, tanpa glass/gradient warna-warni)
const ROYAL = '#2B5CFF';
const NAVY = '#0B1C36';

function greeting() {
    const h = new Date().getHours();
    if (h < 11) return 'Selamat pagi';
    if (h < 15) return 'Selamat siang';
    if (h < 19) return 'Selamat sore';
    return 'Selamat malam';
}

// ─── Stat Card: putih solid, ikon biru — hanya status penting pakai aksen ────
const STAT_TONE = {
    blue:  { box: 'bg-[#EEF3FF] text-[#2347C5]', bar: 'bg-[#2B5CFF]' },
    green: { box: 'bg-emerald-50 text-emerald-700', bar: 'bg-emerald-500' },
    red:   { box: 'bg-red-50 text-red-600', bar: 'bg-red-500' },
    amber: { box: 'bg-amber-50 text-amber-700', bar: 'bg-amber-500' },
    slate: { box: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' },
};

function StatCard({ title, value, icon: Icon, tone = 'blue', subtitle }) {
    const t = STAT_TONE[tone] ?? STAT_TONE.blue;
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-md">
            <span className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
            <div className="flex items-start gap-3 p-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.box}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="text-2xl font-extrabold leading-tight text-[#0B1C36]">{value}</p>
                    {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
}

// ─── Alert ringkas: putih + aksen kiri solid ──────────────────────────────────
const ALERT_TONE = {
    red:   { bar: 'bg-red-500', box: 'bg-red-50 text-red-600' },
    amber: { bar: 'bg-amber-500', box: 'bg-amber-50 text-amber-700' },
    blue:  { bar: 'bg-[#2B5CFF]', box: 'bg-[#EEF3FF] text-[#2347C5]' },
};

function AlertCard({ title, value, icon: Icon, tone = 'red', hint }) {
    const t = ALERT_TONE[tone] ?? ALERT_TONE.red;
    return (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white">
            <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} />
            <div className="flex items-center gap-3 p-4 pl-5">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.box}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
                    <p className="text-2xl font-extrabold leading-tight text-[#0B1C36]">{value}</p>
                    {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
                </div>
            </div>
        </div>
    );
}

function StockStatusBadge({ status }) {
    const kritis = status === 'KRITIS';
    return (
        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold ${
            kritis ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
        }`}>
            {kritis && <Flame className="h-3 w-3" />}
            {status}
        </span>
    );
}

function RequestStatusBadge({ status }) {
    const styleMap = {
        draft: 'bg-slate-100 text-slate-600',
        submitted: 'bg-[#EEF3FF] text-[#2347C5]',
        approved: 'bg-emerald-50 text-emerald-700',
        partially_approved: 'bg-amber-50 text-amber-700',
        fulfilled: 'bg-[#0B1C36] text-white',
        rejected: 'bg-red-50 text-red-700',
        cancelled: 'bg-slate-100 text-slate-500',
    };
    const labelMap = {
        draft: 'Draft',
        submitted: 'Diajukan',
        approved: 'Disetujui',
        partially_approved: 'Sebagian Disetujui',
        fulfilled: 'Selesai',
        rejected: 'Ditolak',
        cancelled: 'Dibatalkan',
    };
    return (
        <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-bold ${styleMap[status] ?? 'bg-slate-100 text-slate-600'}`}>
            {labelMap[status] ?? status}
        </span>
    );
}

// ─── Donat komposisi: biru dominan ────────────────────────────────────────────
function RequestDonut({ approved, rejected, cancelled }) {
    const a = approved ?? 0, r = rejected ?? 0, c = cancelled ?? 0;
    const total = Math.max(1, a + r + c);
    const pA = (a / total) * 100;
    const pR = (r / total) * 100;
    const bg = `conic-gradient(${ROYAL} 0% ${pA}%, #DC2626 ${pA}% ${pA + pR}%, #CBD5E1 ${pA + pR}% 100%)`;
    return (
        <div className="flex items-center gap-5">
            <div className="relative h-28 w-28 shrink-0">
                <div className="h-full w-full rounded-full" style={{ background: bg }} />
                <div className="absolute inset-3.5 flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-xl font-extrabold text-[#0B1C36]">{a + r + c}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">total</span>
                </div>
            </div>
            <div className="flex-1 space-y-2 text-[13px]">
                {[
                    { dot: 'bg-[#2B5CFF]', label: 'Disetujui', val: a },
                    { dot: 'bg-red-600', label: 'Ditolak', val: r },
                    { dot: 'bg-slate-300', label: 'Dibatalkan', val: c },
                ].map((x) => (
                    <div key={x.label} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-sm ${x.dot}`} />
                        <span className="flex-1 text-slate-500">{x.label}</span>
                        <span className="font-bold text-[#0B1C36]">{x.val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Bar departemen: satu warna royal blue ────────────────────────────────────
function DepartmentRequestBar({ dept, maxValue }) {
    const pct = maxValue > 0 ? Math.round((dept.total_requests / maxValue) * 100) : 0;
    return (
        <div className="py-2">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-slate-700">{dept.name}</span>
                <span className="shrink-0 rounded-md bg-[#EEF3FF] px-2 py-0.5 text-xs font-bold text-[#2347C5]">{dept.total_requests}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-[#2B5CFF]" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

// ─── Kartu section korporat: header putih + aksen biru ───────────────────────
function SectionCard({ icon: Icon, title, subtitle, children, className = '', bodyClass = '' }) {
    return (
        <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B1C36]">
                    <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#0B1C36]">{title}</h3>
                    {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
                </div>
                <span className="ml-auto hidden h-1 w-10 rounded-full bg-[#2B5CFF] sm:block" />
            </div>
            <div className={`px-5 py-4 ${bodyClass}`}>{children}</div>
        </div>
    );
}

function NeedsInsightCard({ insight }) {
    const hasInsight = insight?.has_insight;
    return (
        <SectionCard icon={Lightbulb} title="Insight Kebutuhan ATK" subtitle="Proyeksi berbasis pola permintaan">
            {hasInsight ? (
                <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                    {insight.items?.length > 0 && (
                        <div className="rounded-lg border-l-4 border-[#2B5CFF] bg-[#EEF3FF] p-3 text-[13px] text-[#0B1C36]">
                            <strong>{insight.items.join(' dan ')}</strong> diproyeksikan menembus
                            ambang minimum dalam <strong>{insight.weeks} minggu</strong> ke depan.
                        </div>
                    )}
                    {insight.demand_increase && (
                        <p className="text-[13px]">
                            <strong className="text-[#0B1C36]">{insight.demand_increase.department}</strong> naik{' '}
                            <strong className="text-[#0B1C36]">{insight.demand_increase.item_name}</strong> sebesar{' '}
                            <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
                                +{insight.demand_increase.percent}%
                            </span>
                        </p>
                    )}
                    {insight.procurement?.length > 0 && (
                        <p className="text-[13px]">
                            Saran pengadaan awal{' '}
                            {insight.procurement.map((p, i) => (
                                <span key={i}>
                                    <strong className="text-[#0B1C36]">{p.qty} {p.unit} {p.name}</strong>
                                    {i < insight.procurement.length - 2 ? ', ' : i === insight.procurement.length - 2 ? ' dan ' : ''}
                                </span>
                            ))}{' '}
                            sebelum <strong className="text-[#0B1C36]">{insight.deadline}</strong>.
                        </p>
                    )}
                </div>
            ) : (
                <div className="py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1C36]">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-bold text-[#0B1C36]">Semua aman</p>
                    <p className="text-xs text-slate-400">Pola permintaan stabil, belum ada yang perlu diwaspadai</p>
                </div>
            )}
        </SectionCard>
    );
}

function TopItemsCard({ items }) {
    return (
        <SectionCard icon={Trophy} title="Barang Terpopuler" subtitle="30 hari terakhir">
            {items && items.length > 0 ? (
                <div className="divide-y divide-slate-100">
                    {items.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2.5">
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[13px] font-extrabold ${
                                i === 0 ? 'bg-[#0B1C36] text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                                {i + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-[#0B1C36]">{item.name}</p>
                                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                                    <div
                                        className="h-full rounded-full bg-[#2B5CFF]"
                                        style={{ width: `${Math.min(100, ((item.total_requested ?? 0) / Math.max(1, items[0]?.total_requested ?? 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <span className="shrink-0 rounded-md bg-[#EEF3FF] px-2 py-1 text-[11px] font-bold text-[#2347C5]">
                                {item.total_requested}×
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center">
                    <Star className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                    <p className="text-sm text-slate-400">Belum ada data</p>
                </div>
            )}
        </SectionCard>
    );
}

function DistributionHistoryTable({ rows, title, subtitle }) {
    return (
        <SectionCard icon={Truck} title={title} subtitle={subtitle ?? 'Aktivitas terbaru'} bodyClass="px-0 py-0">
            {rows && rows.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Tanggal</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">No. Request</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Departemen</th>
                                <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rows.map((row) => (
                                <tr key={row.id} className="transition-colors hover:bg-[#F5F8FF]">
                                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">{row.date}</td>
                                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[#0B1C36]">
                                        {row.request_number}
                                        {row.category === 'urgent' && <span className="badge badge-red ml-2">Urgen</span>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{row.department}</td>
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
        </SectionCard>
    );
}

// ─── Quick actions: kartu putih solid ─────────────────────────────────────────
function QuickActions({ isAdmin, isApprover, isRequester }) {
    const r = (name, fallback) => { try { return route(name); } catch { return fallback; } };
    const actions = [];
    if (isRequester || isAdmin) {
        actions.push({ href: r('requests.create', '/requests/create'), label: 'Buat Request', desc: 'Ajukan ATK baru', icon: Plus });
    }
    if (isApprover || isAdmin) {
        actions.push({ href: r('approvals.index', '/approvals'), label: 'Persetujuan', desc: 'Review pengajuan', icon: CheckSquare });
    }
    if (isAdmin) {
        actions.push({ href: r('inventory.index', '/inventory'), label: 'Inventori', desc: 'Kelola stok', icon: Package });
        actions.push({ href: r('reports.index', '/reports'), label: 'Laporan', desc: 'Analisis & ekspor', icon: TrendingUp });
    }
    if (actions.length === 0) return null;
    return (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {actions.map((a) => (
                <Link
                    key={a.label}
                    href={a.href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-[#2B5CFF] hover:shadow-md"
                >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0B1C36] transition-colors group-hover:bg-[#2B5CFF]">
                        <a.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[#0B1C36]">{a.label}</p>
                        <p className="truncate text-[11px] text-slate-400">{a.desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-[#2B5CFF]" />
                </Link>
            ))}
        </div>
    );
}

// ─── Dashboard Page ──────────────────────────────────────────────────────────
export default function Dashboard({ stats, department_requests, needs_insight, top_items, critical_stock_items, distribution_history, request_trend }) {
    const { auth } = usePage().props;
    const userName = auth.user?.name ?? 'Pengguna';
    const roles = auth.user?.roles ?? [];
    const isAdmin = roles.includes('Admin');
    const isApprover = roles.includes('SM') || roles.includes('GM');
    const isRequester = roles.includes('Requester');

    const s = stats ?? {};
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const leftColRef = useRef(null);
    const [leftColHeight, setLeftColHeight] = useState(null);

    useEffect(() => {
        if (!isAdmin) return;
        const el = leftColRef.current;
        if (!el) return;
        const updateHeight = () => setLeftColHeight(el.offsetHeight);
        updateHeight();
        const ro = new ResizeObserver(updateHeight);
        ro.observe(el);
        return () => ro.disconnect();
    }, [critical_stock_items, isAdmin]);

    const maxDeptRequests = Math.max(1, ...(department_requests ?? []).map((d) => d.total_requests));

    // ── Data kurva 14 hari ────────────────────────────────────────────────
    const trend = request_trend ?? { labels: [], total: [], done: [] };
    const trendLabels = trend.labels ?? [];
    const trendTotal = trend.total ?? [];
    const trendDone = trend.done ?? [];
    const sum = (arr) => arr.reduce((a, b) => a + (b ?? 0), 0);
    const total14 = sum(trendTotal);
    const done14 = sum(trendDone);
    const last7 = sum(trendTotal.slice(-7));
    const prev7 = sum(trendTotal.slice(-14, -7));
    const last7Done = sum(trendDone.slice(-7));
    const delta7 = prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 > 0 ? 100 : 0);
    const avgPerDay = (last7 / 7).toFixed(1).replace('.', ',');
    const fulfillmentRate = total14 > 0 ? Math.round((done14 / total14) * 100) : 0;

    const trendOptions = {
        chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
        colors: [ROYAL, NAVY],
        stroke: { curve: 'smooth', width: [3, 2] },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.28, opacityTo: 0.02, stops: [0, 100] },
        },
        markers: { size: 0, hover: { size: 5 } },
        legend: { position: 'top', horizontalAlign: 'left', fontSize: '12px', fontWeight: 600 },
        xaxis: {
            categories: trendLabels,
            labels: { style: { colors: '#64748B', fontSize: '11px' } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: '#64748B', fontSize: '11px' } } },
        grid: { borderColor: '#E7EDF7', strokeDashArray: 4 },
        dataLabels: { enabled: false },
        tooltip: { shared: true, intersect: false },
    };
    const trendSeries = [
        { name: 'Masuk', data: trendTotal },
        { name: 'Selesai', data: trendDone },
    ];
    const sparkOptions = {
        chart: { sparkline: { enabled: true }, fontFamily: 'inherit' },
        colors: [ROYAL],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
        tooltip: { enabled: false },
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Dashboard' }]}>
            <Head title="Dashboard" />

            {/* ── HERO: navy solid ala referensi ───────────────── */}
            <div className="relative mb-5 overflow-hidden rounded-2xl bg-[#0B1C36] text-white">
                {/* pola garis tipis */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '36px 36px' }}
                />
                <div className="relative flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{today}</p>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-[28px]">
                            {greeting()}, {userName.split(' ')[0]}
                        </h1>
                        <span className="mt-2 block h-1 w-12 rounded-full bg-[#2B5CFF]" />
                        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-slate-300">
                            Ringkasan pengendalian ATK — pantau request, stok kritis, dan insight pengadaan dalam satu layar.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#2B5CFF] px-3 py-1.5 text-xs font-bold text-white">
                                {(s.requests_total ?? 0)} total request
                            </span>
                            <span className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-slate-200">
                                {(s.pending_approvals ?? s.requests_processing ?? 0)} perlu perhatian
                            </span>
                        </div>
                    </div>
                    <div className="grid shrink-0 grid-cols-3 gap-2.5 lg:w-[340px]">
                        {[
                            { label: 'Item aktif', val: s.total_items ?? '-', icon: Package },
                            { label: 'Stok menipis', val: s.low_stock_items ?? 0, icon: AlertTriangle },
                            { label: 'Stok habis', val: s.out_of_stock_items ?? 0, icon: XCircle },
                        ].map((m) => (
                            <div key={m.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                                <m.icon className="mx-auto h-4 w-4 text-[#8FA6FF]" />
                                <p className="mt-1 text-xl font-extrabold">{m.val}</p>
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── QUICK ACTIONS ────────────────────────────────── */}
            <div className="mb-5">
                <QuickActions isAdmin={isAdmin} isApprover={isApprover} isRequester={isRequester} />
            </div>

            {/* ── STATISTIK ────────────────────────────────────── */}
            <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Statistik Request</h2>
                <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard title="Total Request" value={s.requests_total ?? 0} icon={ClipboardList} tone="blue" subtitle="Keseluruhan" />
                <StatCard title="Disetujui" value={s.requests_approved ?? 0} icon={CheckSquare} tone="blue" subtitle="Siap diproses" />
                <StatCard title="Ditolak" value={s.requests_rejected ?? 0} icon={XCircle} tone="red" subtitle="Perlu revisi" />
                <StatCard title="Selesai" value={s.requests_completed ?? 0} icon={CheckCircle} tone="blue" subtitle="Terdistribusi" />
                <StatCard title="Diproses" value={s.requests_processing ?? 0} icon={Clock} tone="amber" subtitle="Berjalan" />
                <StatCard title="Dibatalkan" value={s.requests_cancelled ?? 0} icon={Ban} tone="slate" subtitle="Batal" />
            </div>

            {/* ── KURVA STATISTIK ────────────────────────────────── */}
            <div className="mb-5 grid gap-4 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div>
                            <h3 className="text-sm font-bold text-[#0B1C36]">Tren Permintaan — 14 Hari Terakhir</h3>
                            <p className="text-[11px] text-slate-400">Request masuk vs selesai per hari</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${delta7 >= 0 ? 'bg-[#EEF3FF] text-[#2347C5]' : 'bg-red-50 text-red-600'}`}>
                                {delta7 >= 0 ? '+' : ''}{delta7}% / 7 hari
                            </span>
                            <span className="rounded-md bg-[#0B1C36] px-2 py-1 text-[11px] font-bold text-white">{total14} request</span>
                        </div>
                    </div>
                    <Chart options={trendOptions} series={trendSeries} type="area" height={290} />
                </div>

                <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5">
                        <h3 className="text-sm font-bold text-[#0B1C36]">Ringkasan 7 Hari</h3>
                        <p className="text-[11px] text-slate-400">Aktivitas minggu berjalan</p>
                        <div className="mt-3 grid grid-cols-2 gap-2.5">
                            <div className="rounded-lg bg-[#EEF3FF] p-3">
                                <p className="text-xl font-extrabold text-[#0B1C36]">{last7}</p>
                                <p className="text-[11px] font-medium text-slate-500">Request masuk</p>
                            </div>
                            <div className="rounded-lg bg-slate-100 p-3">
                                <p className="text-xl font-extrabold text-[#0B1C36]">{last7Done}</p>
                                <p className="text-[11px] font-medium text-slate-500">Selesai</p>
                            </div>
                        </div>
                        <div className="mt-3">
                            <Chart options={sparkOptions} series={[{ name: 'Masuk', data: trendTotal }]} type="area" height={84} />
                            <p className="mt-1 text-center text-[11px] text-slate-400">Rata-rata <strong className="text-[#0B1C36]">{avgPerDay}</strong> request / hari</p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-[#0B1C36] p-5 text-white">
                        <h3 className="text-sm font-bold">Tingkat Penyelesaian</h3>
                        <span className="mt-2 block h-1 w-8 rounded-full bg-[#2B5CFF]" />
                        <p className="mt-2 text-3xl font-extrabold">{fulfillmentRate}<span className="text-base font-bold text-slate-400">%</span></p>
                        <p className="text-[11px] text-slate-400">{done14} dari {total14} request 14 hari terakhir selesai</p>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                            <div className="h-full rounded-full bg-[#2B5CFF]" style={{ width: `${fulfillmentRate}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ ADMIN ═══════════ */}
            {isAdmin && (
                <>
                    <div className="mb-5 grid gap-3 lg:grid-cols-3">
                        <AlertCard title="Duplicate Warning" value={s.duplicate_warnings ?? 0} icon={AlertTriangle} tone="red" hint="Request ganda 7 hari terakhir" />
                        <AlertCard title="Partial Fulfillment" value={s.partial_fulfillment ?? 0} icon={PackageCheck} tone="amber" hint="Disetujui sebagian" />
                        <AlertCard title="Menunggu Approval" value={s.pending_approvals ?? 0} icon={Timer} tone="blue" hint="Butuh persetujuan" />
                    </div>

                    <div className="mb-5 grid gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-bold text-[#0B1C36]">Komposisi Request</h3>
                            <p className="mb-4 text-[11px] text-slate-400">Hasil akhir pengajuan</p>
                            <RequestDonut approved={s.requests_approved} rejected={s.requests_rejected} cancelled={s.requests_cancelled} />
                        </div>

                        <SectionCard
                            icon={Flame}
                            title="Item Stok Kritis"
                            subtitle={`${critical_stock_items?.length ?? 0} item perlu perhatian`}
                            bodyClass="px-0 py-0"
                            className="lg:col-span-2"
                        >
                            {critical_stock_items && critical_stock_items.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100">
                                        <thead>
                                            <tr className="bg-slate-50">
                                                <th className="px-5 py-2.5 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Item</th>
                                                <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Stok</th>
                                                <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Min</th>
                                                <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {critical_stock_items.map((item) => (
                                                <tr key={item.id} className="transition-colors hover:bg-slate-50">
                                                    <td className="px-5 py-3 text-[13px] font-semibold text-[#0B1C36]">{item.name}</td>
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-[#0B1C36]">{item.current_stock}</td>
                                                    <td className="px-4 py-3 text-center text-sm text-slate-400">{item.min_stock}</td>
                                                    <td className="px-4 py-3 text-center"><StockStatusBadge status={item.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#0B1C36]">
                                        <ShieldCheck className="h-5 w-5 text-white" />
                                    </div>
                                    <p className="text-sm font-bold text-[#0B1C36]">Semua stok aman terkendali</p>
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <div ref={leftColRef}>
                            <DistributionHistoryTable rows={distribution_history} title="Histori Distribusi ATK" subtitle="Transaksi terbaru" />
                        </div>
                        <div className="flex flex-col gap-4" style={leftColHeight ? { height: `${leftColHeight}px`, overflowY: 'auto' } : undefined}>
                            <SectionCard icon={Building2} title="Request per Departemen" subtitle="Periode berjalan" bodyClass="max-h-80 overflow-y-auto">
                                {department_requests && department_requests.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {department_requests.map((d, i) => (
                                            <DepartmentRequestBar key={i} dept={d} maxValue={maxDeptRequests} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-10 text-center">
                                        <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                                        <p className="text-sm text-slate-400">Belum ada request bulan ini</p>
                                    </div>
                                )}
                            </SectionCard>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <NeedsInsightCard insight={needs_insight} />
                        <TopItemsCard items={top_items} />
                    </div>
                </>
            )}

            {/* ═══════════ SM & GM ═══════════ */}
            {isApprover && !isAdmin && (
                <>
                    <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <AlertCard title="Menunggu Persetujuan Saya" value={s.pending_approvals ?? 0} icon={Timer} tone="amber" hint="Segera review" />
                        <AlertCard title="Duplicate Warning" value={s.duplicate_warnings ?? 0} icon={AlertTriangle} tone="red" hint="7 hari terakhir" />
                        <AlertCard title="Partial Fulfillment" value={s.partial_fulfillment ?? 0} icon={PackageCheck} tone="blue" hint="Disetujui sebagian" />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <SectionCard icon={Building2} title="Request per Departemen" subtitle="Yang perlu perhatian" bodyClass="max-h-80 overflow-y-auto">
                            {department_requests && department_requests.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {department_requests.map((d, i) => (
                                        <DepartmentRequestBar key={i} dept={d} maxValue={maxDeptRequests} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                                    <p className="text-sm text-slate-400">Belum ada request bulan ini</p>
                                </div>
                            )}
                        </SectionCard>
                        <DistributionHistoryTable rows={distribution_history} title="Histori Distribusi ATK" />
                    </div>
                </>
            )}

            {/* ═══════════ REQUESTER ═══════════ */}
            {isRequester && !isAdmin && !isApprover && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <DistributionHistoryTable rows={distribution_history} title="Riwayat Permintaan Saya" subtitle="Pengajuan terakhirmu" />
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="rounded-xl border border-slate-200 bg-white p-5">
                            <h3 className="text-sm font-bold text-[#0B1C36]">Komposisi Saya</h3>
                            <p className="mb-4 text-[11px] text-slate-400">Status pengajuanmu</p>
                            <RequestDonut approved={s.requests_approved} rejected={s.requests_rejected} cancelled={s.requests_cancelled} />
                        </div>
                        <div className="rounded-xl bg-[#0B1C36] p-5 text-white">
                            <h4 className="text-sm font-bold">Butuh ATK cepat?</h4>
                            <span className="mt-2 block h-1 w-8 rounded-full bg-[#2B5CFF]" />
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">Ajukan permintaan baru, approval otomatis diteruskan ke atasan.</p>
                            <Link
                                href={(() => { try { return route('requests.create'); } catch { return '/requests/create'; } })()}
                                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#2B5CFF] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E46CC]"
                            >
                                <Plus className="h-3.5 w-3.5" /> Buat Request <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
