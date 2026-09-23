import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ArrowLeft, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/utils';

const ITEM_STATUS_MAP = {
    cukup:  { icon: CheckCircle2, cls: 'text-emerald-600' },
    kurang: { icon: AlertTriangle, cls: 'text-amber-600' },
    kosong: { icon: XCircle, cls: 'text-red-600' },
};

export default function FulfillmentShow({ atkRequest, availability }) {
    const [showCancel, setShowCancel] = useState(false);
    const confirmForm = useForm({});
    const cancelForm = useForm({});

    const allSufficient = availability.every(a => a.status === 'cukup');

    return (
        <AppLayout breadcrumbs={[{ label: 'Pemenuhan Stok', href: route('fulfillment.index') }, { label: atkRequest.request_number }]}>
            <Head title={`Pemenuhan ${atkRequest.request_number}`} />

            <div className="page-header">
                <div>
                    <Link href={route('fulfillment.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pemenuhan Stok
                    </Link>
                    <h1 className="page-title">{atkRequest.request_number}</h1>
                    <p className="page-subtitle">{atkRequest.title} — {atkRequest.department?.name}</p>
                </div>
            </div>

            <div className="card mb-6">
                <div className="card-header flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900 text-sm">Pengecekan Stok</h3>
                    <span className={cn('badge', allSufficient ? 'badge-green' : 'badge-yellow')}>
                        {allSufficient ? 'Stok Cukup' : 'Stok Tidak Cukup'}
                    </span>
                </div>
                <div className="table-wrapper !border-0">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Barang</th>
                                <th>Diminta</th>
                                <th>Tersedia</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availability.map(row => {
                                const S = ITEM_STATUS_MAP[row.status];
                                return (
                                    <tr key={row.request_item_id}>
                                        <td className="font-medium text-slate-800">{row.item_name}</td>
                                        <td>{row.requested} {row.unit}</td>
                                        <td>{row.available} {row.unit}</td>
                                        <td>
                                            <span className={cn('inline-flex items-center gap-1 text-xs font-medium', S.cls)}>
                                                <S.icon className="w-3.5 h-3.5" />
                                                {row.status === 'cukup' ? 'Cukup' : row.status === 'kurang' ? 'Kurang' : 'Kosong'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {atkRequest.fulfillment_status === 'awaiting_confirmation' && (
                <div className="card">
                    <div className="card-body flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-600">
                            Menunggu konfirmasi requester karena stok tidak mencukupi. Requester dapat menyetujui
                            pemenuhan sebagian atau membatalkan permintaan melalui halaman detail permintaan mereka.
                        </p>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}