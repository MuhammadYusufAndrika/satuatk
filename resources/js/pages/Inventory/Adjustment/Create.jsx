import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { ArrowLeft, Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils';

export default function Create({ items, locations }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'increase',
        reason: '',
        items: [{ item_id: '', location_id: '', quantity: 1, notes: '' }],
    });

    const addRow = () => setData('items', [...data.items, { item_id: '', location_id: '', quantity: 1, notes: '' }]);

    const updateRow = (i, key, value) => {
        const rows = [...data.items];
        rows[i] = { ...rows[i], [key]: value };
        setData('items', rows);
    };

    const removeRow = (i) => {
        if (data.items.length === 1) return;
        setData('items', data.items.filter((_, idx) => idx !== i));
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('inventory.adjustment.store'), { onSuccess: () => reset() });
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori', href: route('inventory.index') },
            { label: 'Penyesuaian Stok', href: route('inventory.adjustment.index') },
            { label: 'Tambah Penyesuaian' },
        ]}>
            <Head title="Tambah Penyesuaian Stok" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Tambah Penyesuaian Stok</h1>
                    <p className="page-subtitle">Tambah atau kurangi stok barang secara manual</p>
                </div>
            </div>

            {flash?.success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-5">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit}>
                {/* Type & reason */}
                <div className="card mb-5">
                    <div className="card-body space-y-4">
                        <div>
                            <label className="form-label">Jenis Penyesuaian *</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'increase')}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium',
                                        data.type === 'increase'
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    )}
                                >
                                    <TrendingUp className="w-4 h-4" /> Tambah Stok
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setData('type', 'decrease')}
                                    className={cn(
                                        'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors text-sm font-medium',
                                        data.type === 'decrease'
                                            ? 'border-red-500 bg-red-50 text-red-700'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                    )}
                                >
                                    <TrendingDown className="w-4 h-4" /> Kurangi Stok
                                </button>
                            </div>
                            {errors.type && <p className="form-error">{errors.type}</p>}
                        </div>

                        <div>
                            <label className="form-label">Alasan Penyesuaian *</label>
                            <textarea
                                rows={2}
                                value={data.reason}
                                onChange={e => setData('reason', e.target.value)}
                                className={`form-input form-textarea ${errors.reason ? 'form-input-error' : ''}`}
                                placeholder="e.g. Barang masuk dari pembelian, barang rusak, stock opnameâ€¦"
                            />
                            {errors.reason && <p className="form-error">{errors.reason}</p>}
                        </div>
                    </div>
                </div>

                {/* Item lines */}
                <div className="card mb-5">
                    <div className="card-header flex items-center justify-between">
                        <h3 className="font-semibold text-slate-900 text-sm">Daftar Barang</h3>
                        <button type="button" onClick={addRow} className="btn-secondary btn-sm">
                            <Plus className="w-3.5 h-3.5" /> Tambah Baris
                        </button>
                    </div>
                    <div className="card-body space-y-3">
                        {data.items.map((row, i) => (
                            <div key={i} className="grid grid-cols-12 gap-3 items-end p-3 rounded-xl bg-slate-50">
                                <div className="col-span-12 sm:col-span-4">
                                    <label className="form-label">Barang *</label>
                                    <select
                                        value={row.item_id}
                                        onChange={e => updateRow(i, 'item_id', e.target.value)}
                                        className={`form-select ${errors[`items.${i}.item_id`] ? 'form-input-error' : ''}`}
                                    >
                                        <option value="">â€” Pilih barang â€”</option>
                                        {items.map(it => (
                                            <option key={it.id} value={it.id}>
                                                {it.code} â€” {it.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-6 sm:col-span-3">
                                    <label className="form-label">Lokasi *</label>
                                    <select
                                        value={row.location_id}
                                        onChange={e => updateRow(i, 'location_id', e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">â€” Pilih lokasi â€”</option>
                                        {locations.map(l => (
                                            <option key={l.id} value={l.id}>{l.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-4 sm:col-span-2">
                                    <label className="form-label">Jumlah *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={row.quantity}
                                        onChange={e => updateRow(i, 'quantity', +e.target.value)}
                                        className="form-input"
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-2">
                                    <label className="form-label hidden sm:block">&nbsp;</label>
                                    <button
                                        type="button"
                                        onClick={() => removeRow(i)}
                                        disabled={data.items.length === 1}
                                        className="btn-ghost p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                                        title="Hapus baris"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {errors[`items.${i}.item_id`] && (
                                    <div className="col-span-12"><p className="form-error">{errors[`items.${i}.item_id`]}</p></div>
                                )}
                            </div>
                        ))}

                        {errors.items && <p className="form-error">{errors.items}</p>}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <a href={route('inventory.adjustment.index')} className="btn btn-secondary">
                        <ArrowLeft className="w-4 h-4" /> Kembali
                    </a>
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        {processing ? 'Menyimpan...' : data.type === 'increase' ? 'Simpan Tambah Stok' : 'Simpan Kurangi Stok'}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}
