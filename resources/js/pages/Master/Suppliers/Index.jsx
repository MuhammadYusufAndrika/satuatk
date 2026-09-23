import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Edit2, Trash2, Search, Truck } from 'lucide-react';

function SupplierModal({ supplier, onClose }) {
    const isEdit = !!supplier;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        code: supplier?.code ?? '', name: supplier?.name ?? '',
        contact_person: supplier?.contact_person ?? '', email: supplier?.email ?? '',
        phone: supplier?.phone ?? '', city: supplier?.city ?? '', address: supplier?.address ?? '',
    });
    const submit = (e) => {
        e.preventDefault();
        const onSuccess = () => { reset(); onClose(); };
        isEdit ? put(route('master.suppliers.update', supplier.id), { onSuccess })
               : post(route('master.suppliers.store'), { onSuccess });
    };
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
                <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Kode *</label>
                            <input type="text" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())}
                                className={`form-input font-mono ${errors.code ? 'form-input-error' : ''}`} placeholder="SUP-001" />
                            {errors.code && <p className="form-error">{errors.code}</p>}
                        </div>
                        <div>
                            <label className="form-label">Kota</label>
                            <input type="text" value={data.city} onChange={e => setData('city', e.target.value)} className="form-input" placeholder="Jakarta" />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Nama Supplier *</label>
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            className={`form-input ${errors.name ? 'form-input-error' : ''}`} placeholder="Nama perusahaan supplier" />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Contact Person</label>
                            <input type="text" value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} className="form-input" placeholder="Nama PIC" />
                        </div>
                        <div>
                            <label className="form-label">Telepon</label>
                            <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className="form-input" placeholder="021-xxxx" />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Email</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="form-input" placeholder="email@supplier.com" />
                    </div>
                    <div>
                        <label className="form-label">Alamat</label>
                        <textarea rows={2} value={data.address} onChange={e => setData('address', e.target.value)} className="form-input form-textarea" placeholder="Alamat lengkap" />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

export default function SuppliersIndex({ suppliers, filters }) {
    const [modal, setModal] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const applySearch = () => router.get(route('master.suppliers.index'), { search }, { preserveState: true, replace: true });
    const handleDelete = (id) => confirm('Hapus supplier ini?') && router.delete(route('master.suppliers.destroy', id));

    return (
        <AppLayout breadcrumbs={[{ label: 'Master Data' }, { label: 'Supplier' }]}>
            <Head title="Master Supplier" />
            <div className="page-header">
                <div><h1 className="page-title">Supplier</h1><p className="page-subtitle">Kelola daftar supplier ATK</p></div>
                <button onClick={() => setModal('create')} className="btn btn-primary"><Plus className="w-4 h-4" /> Tambah Supplier</button>
            </div>
            <div className="card mb-5"><div className="card-body flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applySearch()}
                        className="form-input pl-9" placeholder="Cari nama atau kode..." />
                </div>
                <button onClick={applySearch} className="btn btn-secondary"><Search className="w-4 h-4" /></button>
            </div></div>
            <div className="table-wrapper">
                <table className="data-table">
                    <thead><tr><th>Kode</th><th>Nama</th><th>Contact</th><th>Kota</th><th>Status</th><th className="text-right">Aksi</th></tr></thead>
                    <tbody>
                        {suppliers?.data?.length > 0 ? suppliers.data.map(s => (
                            <tr key={s.id}>
                                <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{s.code}</span></td>
                                <td className="font-medium text-slate-900">{s.name}</td>
                                <td>
                                    <p className="text-slate-700 text-sm">{s.contact_person ?? 'â€”'}</p>
                                    {s.phone && <p className="text-slate-400 text-xs">{s.phone}</p>}
                                </td>
                                <td className="text-slate-500">{s.city ?? 'â€”'}</td>
                                <td>{s.is_active !== false ? <span className="badge badge-green">Aktif</span> : <span className="badge badge-slate">Nonaktif</span>}</td>
                                <td><div className="flex justify-end gap-1">
                                    <button onClick={() => setModal(s)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={6} className="text-center py-10">
                                <Truck className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                <p className="text-slate-400 text-sm">Belum ada supplier</p>
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {modal && <SupplierModal supplier={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
        </AppLayout>
    );
}
