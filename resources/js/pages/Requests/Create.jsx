import { useState, useEffect } from 'react';
import { useForm, Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Trash2, Search, Send, Save } from 'lucide-react';
import { formatCurrency } from '@/utils';

export default function RequestCreate({ departments, items: catalogItems }) {
    const { data, setData, post, processing, errors } = useForm({
    title:        '',
    description:  '',
    category:     'regular',
    department_id: '',
    needed_date:  '',
    delivery_point: '',
    notes:        '',
    items:        [],
    action:       'draft', // 'draft' or 'submit'
    force:        false,
});
const { flash } = usePage().props;
const [duplicateWarning, setDuplicateWarning] = useState(null);

useEffect(() => {
    if (flash?.duplicate_warning) {
        setDuplicateWarning(flash.duplicate_warning);
    }
}, [flash]);

    const [itemSearch, setItemSearch] = useState('');
    const [filteredItems, setFilteredItems] = useState([]);
    const [showCatalog, setShowCatalog] = useState(false);

    const searchItems = (q) => {
        setItemSearch(q);
        if (q.length < 2) { setFilteredItems([]); return; }
        setFilteredItems(
            catalogItems.filter(i =>
                i.name.toLowerCase().includes(q.toLowerCase()) ||
                i.code.toLowerCase().includes(q.toLowerCase())
            ).slice(0, 10)
        );
    };

    const addItem = (item) => {
        const exists = data.items.find(i => i.item_id === item.id);
        if (exists) return;
        setData('items', [...data.items, {
            item_id:            item.id,
            item_code:          item.code,
            item_name:          item.name,
            item_unit:          item.unit?.symbol ?? item.unit?.name,
            available_stock:    item.available_stock ?? 0,
            quantity_requested: 1,
            notes:              '',
        }]);
        setItemSearch('');
        setFilteredItems([]);
    };

    const updateItemQty = (idx, qty) => {
        const updated = [...data.items];
        updated[idx].quantity_requested = Math.max(1, parseInt(qty) || 1);
        setData('items', updated);
    };

    const removeItem = (idx) => {
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const quantityErrors = Object.entries(errors).filter(([key]) =>
        /^items\.\d+\.quantity_requested$/.test(key)
    );

    const [showQtyErrorModal, setShowQtyErrorModal] = useState(false);

    useEffect(() => {
        if (quantityErrors.length > 0) {
            setShowQtyErrorModal(true);
        }
    }, [errors]);

    const submit = (action) => {
        setData('action', action);
        setTimeout(() => post(route('requests.store')), 50);
    };
const confirmSubmitAnyway = () => {
    setDuplicateWarning(null);
    setData('force', true);
    setTimeout(() => post(route('requests.store')), 50);
};

    return (
        <AppLayout breadcrumbs={[
            { label: 'Permintaan', href: route('requests.index') },
            { label: 'Buat Permintaan' },
        ]}>
            <Head title="Buat Permintaan ATK" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Buat Permintaan ATK</h1>
                    <p className="page-subtitle">Pilih barang yang dibutuhkan lalu ajukan</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left — Request Info */}
                <div className="lg:col-span-1 space-y-5">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-sm font-semibold text-slate-900">Informasi Permintaan</h3>
                        </div>
                        <div className="card-body space-y-4">
                            <div>
                                <label className="form-label">Judul <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={e => setData('title', e.target.value)}
                                    className={`form-input ${errors.title ? 'form-input-error' : ''}`}
                                    placeholder="Judul permintaan"
                                />
                                {errors.title && <p className="form-error">{errors.title}</p>}
                            </div>

                            <div>
                                <label className="form-label">Departemen <span className="text-red-500">*</span></label>
                                <select
                                    value={data.department_id}
                                    onChange={e => setData('department_id', e.target.value)}
                                    className={`form-select ${errors.department_id ? 'form-input-error' : ''}`}
                                >
                                    <option value="">Pilih Departemen</option>
                                    {departments?.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {errors.department_id && <p className="form-error">{errors.department_id}</p>}
                            </div>

                            <div>
                                <label className="form-label">Jenis Permintaan</label>
                                <div className="flex gap-2 mt-1">
                                    {['regular', 'urgent'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setData('category', cat)}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                                                data.category === cat
                                                    ? cat === 'urgent'
                                                        ? 'bg-red-50 border-red-300 text-red-700'
                                                        : 'bg-blue-50 border-blue-300 text-blue-700'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {cat === 'urgent' ? 'Urgen' : 'Reguler'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">Dibutuhkan Tanggal</label>
                                <input
                                    type="date"
                                    value={data.needed_date}
                                    onChange={e => setData('needed_date', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div>
                                <label className="form-label">Delivery Point</label>
                                <select
                                    value={data.delivery_point}
                                    onChange={e => setData('delivery_point', e.target.value)}
                                    className={`form-select ${errors.delivery_point ? 'form-input-error' : ''}`}
                                >
                                    <option value="">Pilih Delivery Point</option>
                                    <option value="Plant Jakarta">Plant Jakarta</option>
                                    <option value="Plant Subang">Plant Subang</option>
                                </select>
                                {errors.delivery_point && <p className="form-error">{errors.delivery_point}</p>}
                            </div>

                            <div>
                                <label className="form-label">Keterangan</label>
                                <textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    className="form-input form-textarea"
                                    placeholder="Catatan tambahan (opsional)"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — Items */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Item search */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="text-sm font-semibold text-slate-900">Cari & Tambah Barang</h3>
                        </div>
                        <div className="card-body">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={e => searchItems(e.target.value)}
                                    className="form-input pl-9"
                                    placeholder="Cari nama atau kode barang..."
                                />
                                {filteredItems.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                                        {filteredItems.map(item => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => addItem(item)}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                                                    <p className="text-xs text-slate-400">{item.code} · {item.category?.name}</p>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <p className="text-sm font-semibold text-slate-700">{item.available_stock ?? 0}</p>
                                                    <p className="text-xs text-slate-400">{item.unit?.symbol} tersedia</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {errors.items && <p className="form-error mt-2">{errors.items}</p>}
                        </div>
                    </div>

                    {/* Selected items */}
                    <div className="card">
                        <div className="card-header flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-slate-900">Barang Dipilih</h3>
                            <span className="badge badge-blue">{data.items.length} item</span>
                        </div>
                        <div className="card-body p-0">
                            {data.items.length === 0 ? (
                                <div className="py-10 text-center text-slate-400">
                                    <p className="text-sm">Belum ada barang dipilih</p>
                                    <p className="text-xs mt-1">Gunakan pencarian di atas</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Barang</th>
                                            <th className="text-center w-32">Jumlah</th>
                                            <th className="text-center w-24">Tersedia</th>
                                            <th className="w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item, idx) => (
                                            <tr key={item.item_id}>
                                                <td>
                                                    <p className="font-medium text-slate-900">{item.item_name}</p>
                                                    <p className="text-xs text-slate-400">{item.item_code}</p>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1 justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItemQty(idx, item.quantity_requested - 1)}
                                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
                                                        >−</button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity_requested}
                                                            onChange={e => updateItemQty(idx, e.target.value)}
                                                            className={`w-14 text-center form-input py-1 px-1 ${errors[`items.${idx}.quantity_requested`] ? 'form-input-error' : ''}`}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => updateItemQty(idx, item.quantity_requested + 1)}
                                                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors"
                                                        >+</button>
                                                    </div>
                                                    <p className="text-xs text-center text-slate-400 mt-0.5">{item.item_unit}</p>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`text-sm font-semibold ${item.available_stock < item.quantity_requested ? 'text-red-600' : 'text-slate-700'}`}>
                                                        {item.available_stock}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
<div className="flex gap-3 justify-end">
    <button
        type="button"
        disabled={processing || data.items.length === 0}
        onClick={() => submit('draft')}
        className="btn btn-secondary"
    >
        <Save className="w-4 h-4" />
        Simpan Draft
    </button>

    <button
        type="button"
        disabled={processing || data.items.length === 0}
        onClick={() => submit('submit')}
        className="btn btn-primary"
    >
        <Send className="w-4 h-4" />
        {processing ? 'Mengirim...' : 'Ajukan Permintaan'}
    </button>
</div>
{duplicateWarning && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setDuplicateWarning(null)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 text-lg mb-2">⚠️ Mohon Diperiksa Kembali</h3>
            <p className="text-sm text-slate-600 mb-3">
                Kamu pernah meminta barang berikut dalam 7 hari kerja terakhir:
            </p>
            {duplicateWarning.duplicate_items?.length > 0 && (
    <>
       
        <ul className="text-sm text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 list-disc list-inside">
            {duplicateWarning.duplicate_items.map((name, i) => <li key={i}>{name}</li>)}
        </ul>
    </>
)}
{duplicateWarning.low_stock_items?.length > 0 && (
    <>
        <p className="text-sm text-slate-600 mb-2">
            Jumlah yang diminta melebihi stok yang tersedia saat ini:
        </p>
        <ul className="text-sm text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 list-disc list-inside">
            {duplicateWarning.low_stock_items.map((it, i) => (
                <li key={i}>{it.name} — diminta {it.requested} {it.unit}, tersedia {it.available} {it.unit}</li>
            ))}
        </ul>
    </>
)}
<p className="text-sm text-slate-600 mb-5">
    Pastikan ini sudah sesuai kebutuhan. Tetap lanjutkan jika memang diperlukan.
</p>
            <div className="flex gap-3">
                <button
                    onClick={() => setDuplicateWarning(null)}
                    className="btn-secondary flex-1"
                >
                    Batal, Cek Lagi
                </button>
                <button
                    onClick={confirmSubmitAnyway}
                    className="btn-primary flex-1"
                >
                    Tetap Lanjutkan
                </button>
            </div>
        </div>
    </div>
)}
{showQtyErrorModal && quantityErrors.length > 0 && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={() => setShowQtyErrorModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-semibold text-slate-900 text-lg mb-2">⚠️ Jumlah Melebihi Batas</h3>
            <p className="text-sm text-slate-600 mb-3">
                Beberapa barang yang kamu minta melebihi batas maksimal permintaan:
            </p>
            <ul className="text-sm text-slate-800 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 list-disc list-inside space-y-1">
                {quantityErrors.map(([key, message]) => (
                    <li key={key}>{message}</li>
                ))}
            </ul>
            <button
    onClick={() => setShowQtyErrorModal(false)}
    className="btn btn-primary w-full"
>
    Mengerti, Saya Perbaiki
</button>
        </div>
    </div>
)}
</div>
    </div>

        </AppLayout>
    );
}