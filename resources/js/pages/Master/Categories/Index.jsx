import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Edit2, Trash2, Search, Tag } from 'lucide-react';
import { cn } from '@/utils';

// ─── Modal Form ───────────────────────────────────────────────────────────

function CategoryModal({ category, onClose }) {
    const isEdit = !!category;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: category?.code ?? '',
        name: category?.name ?? '',
        icon: category?.icon ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        const onSuccess = () => { reset(); onClose(); };
        if (isEdit) {
            put(route('master.categories.update', category.id), { onSuccess });
        } else {
            post(route('master.categories.store'), { onSuccess });
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div>
                        <label className="form-label">Kode <span className="text-red-500">*</span></label>
                        <input type="text" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())}
                            className={`form-input font-mono ${errors.code ? 'form-input-error' : ''}`} placeholder="e.g. ALAT_TULIS" />
                        {errors.code && <p className="form-error">{errors.code}</p>}
                    </div>
                    <div>
                        <label className="form-label">Nama <span className="text-red-500">*</span></label>
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            className={`form-input ${errors.name ? 'form-input-error' : ''}`} placeholder="Nama kategori" />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="form-label">Icon</label>
                        <input type="text" value={data.icon} onChange={e => setData('icon', e.target.value)}
                            className="form-input" placeholder="e.g. pencil, file, printer" />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

// ─── Categories Index ─────────────────────────────────────────────────────

export default function CategoriesIndex({ categories, filters }) {
    const [modal, setModal] = useState(null); // null | 'create' | category object
    const [search, setSearch] = useState(filters?.search ?? '');

    const applySearch = () => router.get(route('master.categories.index'), { search }, { preserveState: true, replace: true });

    const handleDelete = (id) => {
        if (confirm('Hapus kategori ini?')) {
            router.delete(route('master.categories.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Master Data' }, { label: 'Kategori' }]}>
            <Head title="Master Kategori" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Kategori Barang</h1>
                    <p className="page-subtitle">Kelola kategori barang ATK</p>
                </div>
                <button onClick={() => setModal('create')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
            </div>

            {/* Search */}
            <div className="card mb-5">
                <div className="card-body flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && applySearch()}
                            className="form-input pl-9" placeholder="Cari kategori..." />
                    </div>
                    <button onClick={applySearch} className="btn btn-secondary"><Search className="w-4 h-4" /> Cari</button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories?.data?.length > 0 ? categories.data.map(c => (
                            <tr key={c.id}>
                                <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{c.code}</span></td>
                                <td className="font-medium text-slate-900">{c.name}</td>
                                <td>
                                    {c.is_active !== false
                                        ? <span className="badge badge-green">Aktif</span>
                                        : <span className="badge badge-slate">Nonaktif</span>
                                    }
                                </td>
                                <td>
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => setModal(c)}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(c.id)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="text-center py-10">
                                    <Tag className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-slate-400 text-sm">Belum ada kategori</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modal && (
                <CategoryModal
                    category={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                />
            )}
        </AppLayout>
    );
}