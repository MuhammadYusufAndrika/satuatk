import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import {
    Plus, Edit2, Trash2, Search, Users, ShieldCheck,
    ToggleLeft, ToggleRight, Key, Filter
} from 'lucide-react';
import { cn } from '@/utils';

// --- Role config ---

const ROLE_CONFIG = {
    Requester: { cls: 'bg-slate-100 text-slate-600',   label: 'Requester', level: 'L0' },
    Admin:     { cls: 'bg-blue-100 text-blue-700',     label: 'Admin',     level: 'L1' },
    SM:        { cls: 'bg-purple-100 text-purple-700', label: 'SM',        level: 'L2' },
    GM:        { cls: 'bg-rose-100 text-rose-700',     label: 'GM',        level: 'L3' },
};

// --- User Form Modal ---

function UserModal({ user, departments, onClose }) {
    const isEdit = !!user;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:          user?.name          ?? '',
        email:         user?.email         ?? '',
        employee_id:   user?.employee_id   ?? '',
        phone:         user?.phone         ?? '',
        department_id: user?.department_id ?? '',
        role:          user?.role          ?? 'Requester',
        is_active:     user?.is_active     ?? true,
        password:      '',
    });

    const submit = (e) => {
        e.preventDefault();
        const onSuccess = () => { reset(); onClose(); };
        if (isEdit) {
            put(route('users.update', user.id), { onSuccess });
        } else {
            post(route('users.store'), { onSuccess });
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
                <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">
                        {isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'}
                    </h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="form-label">Nama Lengkap *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                className={`form-input ${errors.name ? 'form-input-error' : ''}`} placeholder="Nama lengkap pengguna" />
                            {errors.name && <p className="form-error">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="form-label">NIP / Employee ID *</label>
                            <input type="text" value={data.employee_id} onChange={e => setData('employee_id', e.target.value)}
                                className={`form-input font-mono ${errors.employee_id ? 'form-input-error' : ''}`} placeholder="ADM-001" />
                            {errors.employee_id && <p className="form-error">{errors.employee_id}</p>}
                        </div>
                        <div>
                            <label className="form-label">Telepon</label>
                            <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                className="form-input" placeholder="08xxxxxxxxxx" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Email *</label>
                        <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                            className={`form-input ${errors.email ? 'form-input-error' : ''}`} placeholder="email@perusahaan.com" />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Role *</label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className="form-select">
                                <option value="Requester">Requester - Pengaju permintaan</option>
                                <option value="Admin">Admin - Kelola inventori (L1)</option>
                                <option value="SM">SM - Supervisor/Senior Mgr (L2)</option>
                                <option value="GM">GM - General Manager (L3)</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1">
                                {data.role === 'Requester' && 'Tidak bisa approve. Hanya bisa mengajukan permintaan.'}
                                {data.role === 'Admin'     && 'Approval Level 1. Kelola barang & inventori.'}
                                {data.role === 'SM'        && 'Approval Level 2. Setujui permintaan >= Rp 500.000.'}
                                {data.role === 'GM'        && 'Approval Level 3. Setujui permintaan >= Rp 5.000.000.'}
                            </p>
                        </div>
                        <div>
                            <label className="form-label">Departemen</label>
                            <select value={data.department_id} onChange={e => setData('department_id', e.target.value)} className="form-select">
                                <option value="">- Pilih departemen -</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {!isEdit && (
                        <div>
                            <label className="form-label">Password *</label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                className={`form-input ${errors.password ? 'form-input-error' : ''}`} placeholder="Minimal 8 karakter" />
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>
                    )}

                    {isEdit && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={cn('relative w-10 h-6 rounded-full transition-colors', data.is_active ? 'bg-emerald-500' : 'bg-slate-200')}>
                                <input type="checkbox" className="sr-only" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                                <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', data.is_active ? 'translate-x-5' : 'translate-x-1')} />
                            </div>
                            <span className="text-sm text-slate-700">{data.is_active ? 'Akun Aktif' : 'Akun Nonaktif'}</span>
                        </label>
                    )}

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

// --- Password Reset Modal ---

function PasswordModal({ user, onClose }) {
    const { data, setData, put, processing, errors, reset } = useForm({
        password: '', password_confirmation: '',
    });
    const submit = (e) => {
        e.preventDefault();
        put(route('users.password', user.id), { onSuccess: () => { reset(); onClose(); } });
    };
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm my-auto">
                <div className="p-5 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900">Reset Password - {user.name}</h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div>
                        <label className="form-label">Password Baru *</label>
                        <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                            className={`form-input ${errors.password ? 'form-input-error' : ''}`} />
                        {errors.password && <p className="form-error">{errors.password}</p>}
                    </div>
                    <div>
                        <label className="form-label">Konfirmasi Password *</label>
                        <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                            className="form-input" />
                    </div>
                    <div className="flex gap-3 justify-end">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            {processing ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

// --- Main ---

export default function UsersIndex({ users, roles, departments, filters, stats }) {
    const [modal, setModal]   = useState(null);  // null | 'create' | user obj
    const [pwModal, setPwModal] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [role, setRole]     = useState(filters?.role   ?? '');
    const [status, setStatus] = useState(filters?.status ?? '');

    const applyFilters = () => router.get(
        route('users.index'),
        { search: search || undefined, role: role || undefined, status: status !== '' ? status : undefined },
        { preserveState: true, replace: true }
    );

    const handleDelete  = (u) => confirm(`Hapus pengguna ${u.name}?`) && router.delete(route('users.destroy', u.id));
    const handleToggle  = (u) => router.patch(route('users.toggle', u.id));

    return (
        <AppLayout breadcrumbs={[{ label: 'Manajemen Pengguna' }]}>
            <Head title="Manajemen Pengguna" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Manajemen Pengguna</h1>
                    <p className="page-subtitle">Kelola akun dan penetapan role pengguna sistem</p>
                </div>
                <button onClick={() => setModal('create')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Tambah Pengguna
                </button>
            </div>

            {/* Role stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
                    const count = stats?.by_role?.find(r => r.name === key)?.count ?? 0;
                    return (
                        <div key={key} className="card">
                            <div className="card-body flex items-center gap-3">
                                <span className={cn('px-2.5 py-1 rounded-full text-xs font-bold border', cfg.cls)}>
                                    {cfg.level}
                                </span>
                                <div>
                                    <p className="text-xs text-slate-400">{cfg.label}</p>
                                    <p className="text-xl font-bold text-slate-900">{count} <span className="text-sm font-normal text-slate-400">pengguna</span></p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters */}
            <div className="card mb-5">
                <div className="card-body flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-48">
                        <label className="form-label">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                className="form-input pl-9" placeholder="Nama, email, atau NIP..." />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="form-select w-36">
                            <option value="">Semua Role</option>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="form-label">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className="form-select w-32">
                            <option value="">Semua</option>
                            <option value="1">Aktif</option>
                            <option value="0">Nonaktif</option>
                        </select>
                    </div>
                    <button onClick={applyFilters} className="btn btn-secondary">
                        <Filter className="w-4 h-4" /> Filter
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Pengguna</th>
                            <th>NIP</th>
                            <th>Role</th>
                            <th>Departemen</th>
                            <th>Status</th>
                            <th className="text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users?.data?.length > 0 ? users.data.map(u => {
                            const rc = ROLE_CONFIG[u.role] ?? ROLE_CONFIG.Requester;
                            return (
                                <tr key={u.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-slate-600">
                                                    {u.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 text-sm">{u.name}</p>
                                                <p className="text-xs text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{u.employee_id}</span></td>
                                    <td>
                                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', rc.cls)}>
                                            {rc.label} <span className="opacity-60">({rc.level})</span>
                                        </span>
                                    </td>
                                    <td className="text-slate-500 text-sm">{u.department?.name ?? '-'}</td>
                                    <td>
                                        {u.is_active
                                            ? <span className="badge badge-green">Aktif</span>
                                            : <span className="badge badge-slate">Nonaktif</span>
                                        }
                                    </td>
                                    <td>
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => handleToggle(u)}
                                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                {u.is_active
                                                    ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                                                    : <ToggleLeft className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => setPwModal(u)}
                                                className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors" title="Reset Password">
                                                <Key className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setModal(u)}
                                                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(u)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">Tidak ada pengguna ditemukan</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {modal && (
                <UserModal
                    user={modal === 'create' ? null : modal}
                    departments={departments}
                    onClose={() => setModal(null)}
                />
            )}
            {pwModal && <PasswordModal user={pwModal} onClose={() => setPwModal(null)} />}
        </AppLayout>
    );
}