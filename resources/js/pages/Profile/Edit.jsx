import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { User, KeyRound, Trash2, AlertTriangle } from 'lucide-react';

function ProfileInfoForm({ user }) {
    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <div className="card">
            <div className="card-header flex items-center gap-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">Informasi Profil</h3>
            </div>
            <form onSubmit={submit} className="card-body space-y-4">
                <div>
                    <label className="form-label">Nama Lengkap</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                    />
                    {errors.name && <p className="form-error">{errors.name}</p>}
                </div>
                <div>
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                    />
                    {errors.email && <p className="form-error">{errors.email}</p>}
                </div>
                <div>
                    <label className="form-label">Nomor Telepon</label>
                    <input
                        type="text"
                        value={data.phone}
                        onChange={e => setData('phone', e.target.value)}
                        className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                    />
                    {errors.phone && <p className="form-error">{errors.phone}</p>}
                </div>
                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        Simpan Perubahan
                    </button>
                    {recentlySuccessful && <span className="text-sm text-emerald-600">Tersimpan.</span>}
                </div>
            </form>
        </div>
    );
}

function PasswordForm() {
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        put(route('profile.password'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="card">
            <div className="card-header flex items-center gap-2.5">
                <KeyRound className="w-4 h-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900 text-sm">Ubah Password</h3>
            </div>
            <form onSubmit={submit} className="card-body space-y-4">
                <div>
                    <label className="form-label">Password Saat Ini</label>
                    <input
                        type="password"
                        value={data.current_password}
                        onChange={e => setData('current_password', e.target.value)}
                        className={`form-input ${errors.current_password ? 'form-input-error' : ''}`}
                    />
                    {errors.current_password && <p className="form-error">{errors.current_password}</p>}
                </div>
                <div>
                    <label className="form-label">Password Baru</label>
                    <input
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    />
                    {errors.password && <p className="form-error">{errors.password}</p>}
                </div>
                <div>
                    <label className="form-label">Konfirmasi Password Baru</label>
                    <input
                        type="password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        className="form-input"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button type="submit" disabled={processing} className="btn btn-primary">
                        Ubah Password
                    </button>
                    {recentlySuccessful && <span className="text-sm text-emerald-600">Password berhasil diubah.</span>}
                </div>
            </form>
        </div>
    );
}

function DeleteAccountForm() {
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, delete: destroy, processing, errors, reset } = useForm({ password: '' });

    const submit = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            onSuccess: () => setShowConfirm(false),
            onError: () => {},
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="card border-red-100">
            <div className="card-header flex items-center gap-2.5 bg-red-50 rounded-t-xl">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-red-800 text-sm">Hapus Akun</h3>
            </div>
            <div className="card-body">
                <p className="text-sm text-slate-500 mb-4">
                    Setelah akun dihapus, seluruh data dan sesi Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                </p>
                {!showConfirm ? (
                    <button onClick={() => setShowConfirm(true)} className="btn btn-danger">
                        <Trash2 className="w-4 h-4" /> Hapus Akun Saya
                    </button>
                ) : (
                    <form onSubmit={submit} className="space-y-3 max-w-sm">
                        <div>
                            <label className="form-label">Masukkan password untuk konfirmasi</label>
                            <input
                                type="password"
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                                autoFocus
                            />
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowConfirm(false)} className="btn btn-secondary">
                                Batal
                            </button>
                            <button type="submit" disabled={processing} className="btn btn-danger">
                                Konfirmasi Hapus Akun
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ProfileEdit({ user }) {
    return (
        <AppLayout breadcrumbs={[{ label: 'Profil Saya' }]}>
            <Head title="Profil Saya" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Profil Saya</h1>
                    <p className="page-subtitle">Kelola informasi akun dan keamanan Anda</p>
                </div>
            </div>

            <div className="max-w-2xl space-y-6">
                <ProfileInfoForm user={user} />
                <PasswordForm />
                <DeleteAccountForm />
            </div>
        </AppLayout>
    );
}
