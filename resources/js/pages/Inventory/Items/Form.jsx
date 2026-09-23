import { useForm, Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Save, X } from 'lucide-react';

// â”€â”€â”€ Field wrapper â€” MUST stay OUTSIDE the parent component.
// Defining it inside would cause React to recreate it on every render
// â†’ inputs lose focus on each keystroke.
function Field({ label, name, errors, children, required }) {
    return (
        <div>
            <label className="form-label">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {errors?.[name] && <p className="form-error">{errors[name]}</p>}
        </div>
    );
}

export default function ItemForm({ item, categories, units, suppliers, isEdit = false }) {
    const { data, setData, post, put, processing, errors } = useForm({
        code:        item?.code        ?? '',
        name:        item?.name        ?? '',
        brand:       item?.brand       ?? '',
        model:       item?.model       ?? '',
        description: item?.description ?? '',
        category_id: item?.category_id ?? '',
        unit_id:     item?.unit_id     ?? '',
        supplier_id: item?.supplier_id ?? '',
        price:       item?.price       ?? 0,
        min_stock:   item?.min_stock   ?? 0,
        max_stock:   item?.max_stock   ?? 0,
        barcode:     item?.barcode     ?? '',
        is_active:   item?.is_active   ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        if (isEdit) {
            put(route('inventory.items.update', item.uuid));
        } else {
            post(route('inventory.items.store'));
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Inventori' },
            { label: 'Barang', href: route('inventory.items.index') },
            { label: isEdit ? 'Edit Barang' : 'Tambah Barang' },
        ]}>
            <Head title={isEdit ? 'Edit Barang' : 'Tambah Barang'} />

            <div className="page-header">
                <div>
                    <h1 className="page-title">{isEdit ? 'Edit Barang' : 'Tambah Barang'}</h1>
                    <p className="page-subtitle">
                        {isEdit ? `Mengubah data: ${item?.name}` : 'Tambahkan barang baru ke katalog ATK'}
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="max-w-3xl">
                {/* â”€â”€â”€ Informasi Dasar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="card mb-5">
                    <div className="card-header">
                        <h3 className="text-sm font-semibold text-slate-900">Informasi Dasar</h3>
                    </div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Kode Barang" name="code" errors={errors} required>
                            <input
                                type="text"
                                value={data.code}
                                onChange={e => setData('code', e.target.value.toUpperCase())}
                                className={`form-input font-mono ${errors.code ? 'form-input-error' : ''}`}
                                placeholder="e.g. ATK-001"
                            />
                        </Field>

                        <Field label="Nama Barang" name="name" errors={errors} required>
                            <input
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                                placeholder="Nama barang"
                            />
                        </Field>

                        <Field label="Merek" name="brand" errors={errors}>
                            <input
                                type="text"
                                value={data.brand}
                                onChange={e => setData('brand', e.target.value)}
                                className="form-input"
                                placeholder="Merek / Brand"
                            />
                        </Field>

                        <Field label="Model / Tipe" name="model" errors={errors}>
                            <input
                                type="text"
                                value={data.model}
                                onChange={e => setData('model', e.target.value)}
                                className="form-input"
                                placeholder="Model atau tipe"
                            />
                        </Field>

                        <div className="md:col-span-2">
                            <Field label="Deskripsi" name="description" errors={errors}>
                                <textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    className="form-input form-textarea"
                                    placeholder="Deskripsi singkat barang"
                                />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* â”€â”€â”€ Klasifikasi & Satuan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="card mb-5">
                    <div className="card-header">
                        <h3 className="text-sm font-semibold text-slate-900">Klasifikasi &amp; Satuan</h3>
                    </div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Kategori" name="category_id" errors={errors} required>
                            <select
                                value={data.category_id}
                                onChange={e => setData('category_id', e.target.value)}
                                className={`form-select ${errors.category_id ? 'form-input-error' : ''}`}
                            >
                                <option value="">Pilih Kategori</option>
                                {categories?.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Satuan" name="unit_id" errors={errors} required>
                            <select
                                value={data.unit_id}
                                onChange={e => setData('unit_id', e.target.value)}
                                className={`form-select ${errors.unit_id ? 'form-input-error' : ''}`}
                            >
                                <option value="">Pilih Satuan</option>
                                {units?.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Supplier" name="supplier_id" errors={errors}>
                            <select
                                value={data.supplier_id}
                                onChange={e => setData('supplier_id', e.target.value)}
                                className="form-select"
                            >
                                <option value="">Tidak Ada</option>
                                {suppliers?.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </div>

                {/* â”€â”€â”€ Stok & Harga â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="card mb-5">
                    <div className="card-header">
                        <h3 className="text-sm font-semibold text-slate-900">Stok &amp; Harga</h3>
                    </div>
                    <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Harga Satuan (Rp)" name="price" errors={errors}>
                            <input
                                type="number"
                                min="0"
                                value={data.price}
                                onChange={e => setData('price', e.target.value)}
                                className="form-input"
                            />
                        </Field>

                        <Field label="Stok Minimum" name="min_stock" errors={errors}>
                            <input
                                type="number"
                                min="0"
                                value={data.min_stock}
                                onChange={e => setData('min_stock', e.target.value)}
                                className="form-input"
                            />
                        </Field>

                        <Field label="Stok Maksimum" name="max_stock" errors={errors}>
                            <input
                                type="number"
                                min="0"
                                value={data.max_stock}
                                onChange={e => setData('max_stock', e.target.value)}
                                className="form-input"
                            />
                        </Field>

                        <Field label="Barcode" name="barcode" errors={errors}>
                            <input
                                type="text"
                                value={data.barcode}
                                onChange={e => setData('barcode', e.target.value)}
                                className="form-input font-mono"
                                placeholder="Barcode (opsional)"
                            />
                        </Field>
                    </div>
                </div>

                {/* â”€â”€â”€ Status Aktif â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="card mb-6">
                    <div className="card-body flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Status Aktif</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Barang tidak aktif tidak bisa diminta oleh karyawan
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setData('is_active', !data.is_active)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${data.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.is_active ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* â”€â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        <Save className="w-4 h-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Barang'}
                    </button>
                    <Link href={route('inventory.items.index')} className="btn btn-secondary">
                        <X className="w-4 h-4" /> Batal
                    </Link>
                </div>
            </form>
        </AppLayout>
    );
}
