import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Shield, Search, User, ChevronDown, ChevronUp } from 'lucide-react';
import { cn, formatDateTime } from '@/utils';

const EVENT_META = {
    created:  { cls: 'badge-green',  label: 'Dibuat' },
    updated:  { cls: 'badge-blue',   label: 'Diperbarui' },
    deleted:  { cls: 'badge-red',    label: 'Dihapus' },
    restored: { cls: 'badge-purple', label: 'Dipulihkan' },
    login:    { cls: 'badge-blue',   label: 'Login' },
    logout:   { cls: 'badge-slate',  label: 'Logout' },
};

function eventMeta(event) {
    return EVENT_META[event] ?? { cls: 'badge-slate', label: event ?? 'Aksi' };
}

function subjectLabel(a) {
    const type = a.subject_type ?? '';
    const short = type.split('\\').pop()?.replace('Master', '').replace('Inventory', '') ?? '';
    return short ? `${short} #${a.subject_id ?? ''}` : 'Sistem';
}

// â”€â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DetailModal({ log, onClose }) {
    const props = log.properties ?? {};
    const changes = props.attributes ?? null;
    const old = props.old ?? null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-auto">
                <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">Detail Audit Trail</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(log.created_at)}</p>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                        <span className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-500" />
                        </span>
                        <div>
                            <p className="text-sm font-medium text-slate-900">{log.causer?.name ?? 'Sistem'}</p>
                            <p className="text-xs text-slate-400">{log.causer?.email ?? 'â€”'}</p>
                        </div>
                        <span className={cn('badge ml-auto', eventMeta(log.event).cls)}>
                            {eventMeta(log.event).label}
                        </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 text-sm">
                        <p className="text-slate-600">{log.description}</p>
                    </div>

                    {changes && (
                        <div>
                            <p className="form-label">Perubahan Data</p>
                            <div className="table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Kolom</th>
                                            <th>Nilai Baru</th>
                                            {old && <th>Nilai Lama</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(changes).map(([key, val]) => (
                                            <tr key={key}>
                                                <td className="font-mono text-xs text-slate-500">{key}</td>
                                                <td className="text-sm">{String(val)}</td>
                                                {old && <td className="text-sm text-slate-400">{String(old[key] ?? 'â€”')}</td>}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button onClick={onClose} className="btn btn-secondary">Tutup</button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AuditIndex({ logs, filters, users }) {
    const [search, setSearch] = useState(filters?.search ?? '');
    const [causer, setCauser] = useState(filters?.causer ?? '');
    const [detail, setDetail] = useState(null);

    const applyFilters = () => router.get(
        route('audit.index'),
        { search: search || undefined, causer: causer || undefined },
        { preserveState: true, replace: true }
    );

    return (
        <AppLayout breadcrumbs={[{ label: 'Administrasi' }, { label: 'Audit Trail' }]}>
            <Head title="Audit Trail" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Audit Trail</h1>
                    <p className="page-subtitle">Riwayat aktivitas dan perubahan data dalam sistem</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <label className="form-label">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="form-input pl-9"
                                placeholder="Cari deskripsi aktivitasâ€¦"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Pengguna</label>
                        <select value={causer} onChange={e => setCauser(e.target.value)} className="form-select w-48">
                            <option value="">Semua Pengguna</option>
                            {users?.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={applyFilters} className="btn btn-secondary">
                        <Search className="w-4 h-4" /> Terapkan
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Pengguna</th>
                            <th>Aktivitas</th>
                            <th>Modul</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs?.data?.length > 0 ? logs.data.map(log => {
                            const em = eventMeta(log.event);
                            return (
                                <tr key={log.id}>
                                    <td className="text-sm text-slate-500 whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                                    <td>
                                        <span className="text-sm font-medium text-slate-800">{log.causer?.name ?? 'Sistem'}</span>
                                    </td>
                                    <td className="text-sm text-slate-600 max-w-md">
                                        <span className="line-clamp-1">{log.description}</span>
                                    </td>
                                    <td>
                                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                            {subjectLabel(log)}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={cn('badge', em.cls)}>{em.label}</span>
                                    </td>
                                    <td>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setDetail(log)}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="Lihat detail"
                                            >
                                                {detail?.id === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Belum ada catatan audit</p>
                                    <p className="text-slate-300 text-sm mt-1">Aktivitas sistem akan tercatat di sini.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {logs?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {logs.from}â€“{logs.to} dari {logs.total} catatan
                    </p>
                    <div className="flex gap-1">
                        {logs.links.map((link, i) => (
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

            {detail && <DetailModal log={detail} onClose={() => setDetail(null)} />}
        </AppLayout>
    );
}
