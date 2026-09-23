import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { cn } from '@/utils';

const STATUS_MAP = {
    approved:            { cls: 'badge-green',  label: 'Siap Diproses' },
    partially_approved:  { cls: 'badge-blue',   label: 'Disetujui Sebagian' },
};

const FULFILLMENT_MAP = {
    awaiting_confirmation: { cls: 'badge-yellow', label: 'Menunggu Requester' },
};

export default function FulfillmentIndex({ requests }) {
    return (
        <AppLayout breadcrumbs={[{ label: 'Pemenuhan Stok' }]}>
            <Head title="Pemenuhan Stok" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Pemenuhan Stok</h1>
                    <p className="page-subtitle">Permintaan yang telah disetujui, menunggu pengecekan stok dan pemenuhan.</p>
                </div>
            </div>

            <div className="card">
                <div className="table-wrapper !border-0">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>No. Permintaan</th>
                                <th>Departemen</th>
                                <th>Kebutuhan Tanggal</th>
                                <th>Status</th>
                                <th className="text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.data?.length > 0 ? requests.data.map(r => {
                                const s = STATUS_MAP[r.status] ?? { cls: 'badge-slate', label: r.status };
                                const f = FULFILLMENT_MAP[r.fulfillment_status];
                                return (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="font-medium text-slate-800">{r.request_number}</div>
                                            <div className="text-xs text-slate-400">{r.title}</div>
                                        </td>
                                        <td>{r.department?.name}</td>
                                        <td>{r.needed_date ?? '—'}</td>
                                        <td className="space-x-1.5">
                                            <span className={cn('badge', s.cls)}>{s.label}</span>
                                            {f && <span className={cn('badge', f.cls)}>{f.label}</span>}
                                        </td>
                                        <td className="text-right">
                                            <Link href={route('fulfillment.show', r.id)} className="btn-primary btn-sm">
                                                Proses
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-slate-400">
                                        Tidak ada permintaan yang perlu diproses saat ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}