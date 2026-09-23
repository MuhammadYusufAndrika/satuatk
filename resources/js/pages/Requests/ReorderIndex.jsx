import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout.jsx';

export default function ReorderRecommendation({ reorderData, totalPerluReorder, highlightItemId }) {
    const isFiltered = Boolean(highlightItemId);
    const displayedData = isFiltered
        ? (reorderData ?? []).filter((row) => row.id === highlightItemId)
        : reorderData;

    const storeReorder = (itemId) => {
        if (confirm('Apakah kamu yakin ingin membuat draft request untuk item ini?')) {
            router.post(route('requests.reorder.store'), {
                item_id: itemId,
            }, {
                preserveScroll: true,
            });
        }
    };

    const storeAllReorder = () => {
        if (confirm(`Apakah kamu yakin ingin membuat draft request untuk semua (${totalPerluReorder}) item yang perlu reorder?`)) {
            router.post(route('requests.reorder.store-all'), {}, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AppLayout header="Rekomendasi Reorder">
            <Head title="Rekomendasi Reorder Stok" />

            <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Rekomendasi Reorder Stok</h1>
                        <p className="text-sm text-slate-500">Daftar item ATK yang mendekati atau berada di bawah minimum stok.</p>
                    </div>
                    {!isFiltered && totalPerluReorder > 0 && (
                        <button
                            onClick={storeAllReorder}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
                        >
                            Reorder Semua ({totalPerluReorder})
                        </button>
                    )}
                </div>

                {isFiltered && (
                    <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                        <p className="text-sm text-amber-800">Menampilkan 1 item dari notifikasi stok.</p>
                        <Link href={route('requests.reorder')} className="text-sm font-medium text-amber-700 hover:text-amber-900 underline">
                            Lihat semua rekomendasi ({totalPerluReorder})
                        </Link>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    {(!displayedData || displayedData.length === 0) ? (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-lg font-medium">Belum ada item yang memerlukan reorder saat ini.</p>
                            <p className="text-sm text-slate-400 mt-1">Semua stok terpantau aman!</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Item</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Stok Saat Ini</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Minimum Stok</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Saran Reorder</th>
                                        <th className="px-6 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-slate-200">
                                    {displayedData.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-slate-900">{row.name}</div>
                                                <div className="text-xs text-slate-500">Kode: {row.code || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2.5 py-1 inline-flex text-xs font-semibold rounded-full ${row.status === 'KRITIS' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-800">
                                                {row.stock} {row.unit}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                                                {row.min_stock}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-emerald-600">
                                                {row.saran}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <button
                                                    onClick={() => storeReorder(row.id)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition shadow-sm"
                                                >
                                                    Buat Request
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}