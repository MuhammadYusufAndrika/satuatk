import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Bell, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { cn, formatDateTime } from '@/utils';

const NS = 'App\\Notifications\\';
const TYPE_META = {
    [NS + 'ApprovalRequested']:    { icon: CheckCircle2, cls: 'bg-blue-50 text-blue-600', label: 'Approval' },
    [NS + 'ApprovalCompleted']:    { icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-600', label: 'Disetujui' },
    [NS + 'RequestSubmitted']:     { icon: Info, cls: 'bg-blue-50 text-blue-600', label: 'Permintaan' },
    [NS + 'StockLow']:             { icon: AlertTriangle, cls: 'bg-amber-50 text-amber-600', label: 'Stok Rendah' },
    [NS + 'SystemError']:          { icon: XCircle, cls: 'bg-red-50 text-red-600', label: 'Error' },
};

function typeMeta(type) {
    return TYPE_META[type] ?? { icon: Info, cls: 'bg-slate-100 text-slate-500', label: 'Notifikasi' };
}

function notificationTitle(n) {
    const d = n.data ?? {};
    return d.title ?? d.subject ?? typeMeta(n.type).label;
}

function notificationBody(n) {
    const d = n.data ?? {};
    return d.message ?? d.body ?? d.text ?? '';
}

// â”€â”€â”€ Filter Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TABS = [
    { key: 'all',     label: 'Semua' },
    { key: 'unread',  label: 'Belum Dibaca' },
    { key: 'read',    label: 'Sudah Dibaca' },
];

// â”€â”€â”€ Notification Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function NotificationCard({ n }) {
    const meta = typeMeta(n.type);
    const Icon = meta.icon;

    const handleClick = () => {
        // Mark as read; the server redirects to the related page (data.url)
        router.post(route('notifications.read', n.id), {}, { preserveScroll: true });
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
                !n.read_at ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'
            )}
        >
            <span className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', meta.cls)}>
                <Icon className="w-4 h-4" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">{notificationTitle(n)}</span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">{formatDateTime(n.created_at)}</span>
                </span>
                {notificationBody(n) && (
                    <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{notificationBody(n)}</span>
                )}
            </span>
            {!n.read_at && (
                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
            )}
        </button>
    );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function NotificationsIndex({ notifications, filter, unread_count }) {
    const [active, setActive] = useState(filter ?? 'all');

    const switchTab = (key) => {
        setActive(key);
        router.get(route('notifications.index'), { filter: key === 'all' ? undefined : key }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleReadAll = () => {
        if (unread_count === 0) return;
        if (confirm('Tandai semua notifikasi sebagai sudah dibaca?')) {
            router.post(route('notifications.read-all'), {}, { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Administrasi' }, { label: 'Notifikasi' }]}>
            <Head title="Notifikasi" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Notifikasi</h1>
                    <p className="page-subtitle">
                        {unread_count > 0
                            ? `${unread_count} notifikasi belum dibaca`
                            : 'Tidak ada notifikasi belum dibaca'}
                    </p>
                </div>
                <button
                    onClick={handleReadAll}
                    disabled={unread_count === 0}
                    className="btn btn-secondary"
                >
                    <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
                </button>
            </div>

            {/* Filter tabs */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1 mb-5">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => switchTab(tab.key)}
                        className={cn(
                            'px-4 py-1.5 text-sm rounded-lg transition-colors font-medium',
                            active === tab.key
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="card">
                <div className="card-body py-2 divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
                    {notifications?.data?.length > 0 ? notifications.data.map(n => (
                        <NotificationCard key={n.id} n={n} />
                    )) : (
                        <div className="py-16 text-center">
                            <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 font-medium">Tidak ada notifikasi</p>
                            <p className="text-slate-300 text-sm mt-1">Notifikasi baru akan muncul di sini.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {notifications?.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Menampilkan {notifications.from}â€“{notifications.to} dari {notifications.total}
                    </p>
                    <div className="flex gap-1">
                        {notifications.links.map((link, i) => (
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
        </AppLayout>
    );
}
