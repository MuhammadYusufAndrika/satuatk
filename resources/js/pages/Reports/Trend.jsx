import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Chart from 'react-apexcharts';
import { Download, ArrowLeft, TrendingUp } from 'lucide-react';

export default function ReportsTrend({ trend, items, filters }) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [itemId, setItemId] = useState(filters?.item_id ?? '');

    const applyFilter = () => {
        router.get(route('reports.trend'), { from, to, item_id: itemId }, {
            preserveState: true, replace: true,
        });
    };

    const categories = trend.map(t => t.period_label);
    const requestedSeries = trend.map(t => t.total_requested);
    const approvedSeries = trend.map(t => t.total_approved);

    const totalRequested = requestedSeries.reduce((a, b) => a + b, 0);
    const totalApproved = approvedSeries.reduce((a, b) => a + b, 0);
    const totalTrx = trend.reduce((a, t) => a + t.total_transactions, 0);

    const chartOptions = {
        chart: { toolbar: { show: false }, fontFamily: 'inherit' },
        colors: ['#2563eb', '#16a34a'],
        stroke: { curve: 'smooth', width: 3 },
        markers: { size: 4 },
        legend: { position: 'top', horizontalAlign: 'left' },
        xaxis: { categories },
        yaxis: { title: { text: 'Jumlah Qty' } },
        dataLabels: { enabled: false },
        grid: { borderColor: '#f1f5f9' },
    };

    const chartSeries = [
        { name: 'Total Diminta', data: requestedSeries },
        { name: 'Total Disetujui', data: approvedSeries },
    ];

    return (
        <AppLayout breadcrumbs={[{ label: 'Laporan', href: route('reports.index') }, { label: 'Tren Pemakaian ATK' }]}>
            <Head title="Tren Pemakaian ATK" />

            <div className="page-header">
                <div>
                    <Link href={route('reports.index')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Laporan
                    </Link>
                    <h1 className="page-title">Tren Pemakaian ATK</h1>
                    <p className="page-subtitle">Perkembangan permintaan dan persetujuan barang tiap bulan</p>
                </div>
                <a href={route('reports.export', { type: 'trend', from, to, item_id: itemId })} className="btn btn-secondary">
                    <Download className="w-4 h-4" /> Export CSV
                </a>
            </div>

            <div className="card mb-5">
                <div className="card-body flex flex-wrap items-end gap-3">
                    <div>
                        <label className="form-label">Dari Tanggal</label>
                        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Sampai Tanggal</label>
                        <input type="date" value={to} onChange={e => setTo(e.target.value)} className="form-input" />
                    </div>
                    <div>
                        <label className="form-label">Barang (opsional)</label>
                        <select value={itemId} onChange={e => setItemId(e.target.value)} className="form-input">
                            <option value="">Semua Barang</option>
                            {items.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={applyFilter} className="btn btn-primary">Terapkan</button>
                </div>
            </div>

            <div className="card mb-5">
                <div className="card-body">
                    {trend.length > 0 ? (
                        <Chart options={chartOptions} series={chartSeries} type="line" height={340} />
                    ) : (
                        <div className="text-center py-12">
                            <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-500 font-medium">Belum ada data pemakaian pada periode ini</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Bulan</th>
                            <th>Jumlah Transaksi</th>
                            <th>Total Diminta</th>
                            <th>Total Disetujui</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trend.length > 0 ? trend.map(t => (
                            <tr key={t.period}>
                                <td className="font-medium text-slate-800">{t.period_label}</td>
                                <td>{t.total_transactions}</td>
                                <td className="font-semibold">{t.total_requested}</td>
                                <td className="text-green-600 font-semibold">{t.total_approved}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-slate-500">Tidak ada data</td>
                            </tr>
                        )}
                    </tbody>
                    {trend.length > 0 && (
                        <tfoot>
                            <tr className="font-semibold border-t-2 border-slate-200">
                                <td>Total</td>
                                <td>{totalTrx}</td>
                                <td>{totalRequested}</td>
                                <td className="text-green-600">{totalApproved}</td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </AppLayout>
    );
}