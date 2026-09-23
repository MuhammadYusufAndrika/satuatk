import { Head, Link, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Settings, ShieldCheck, Save } from 'lucide-react';
import { cn } from '@/utils';

const TIMEZONES = [
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Pontianak',
    'Asia/Jayapura',
];

const LOCALES = [
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'en', label: 'English' },
];

// --- Tabs ---

export function SettingsTabs({ active }) {
    return (
        <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1 mb-6">
            <Link
                href={route('settings.index')}
                className={cn(
                    'flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition-colors font-medium',
                    active === 'general'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                )}
            >
                <Settings className="w-4 h-4" /> Umum
            </Link>
            <Link
                href={route('settings.approval-rules.index')}
                className={cn(
                    'flex items-center gap-2 px-4 py-1.5 text-sm rounded-lg transition-colors font-medium',
                    active === 'approval'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                )}
            >
                <ShieldCheck className="w-4 h-4" /> Aturan Approval
            </Link>
        </div>
    );
}

// --- Main ---

export default function SettingsIndex({ settings }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        app_name: settings?.app_name ?? '',
        timezone: settings?.timezone ?? 'Asia/Jakarta',
        locale:   settings?.locale   ?? 'id',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Administrasi' }, { label: 'Pengaturan' }]}>
            <Head title="Pengaturan Sistem" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Pengaturan</h1>
                    <p className="page-subtitle">Konfigurasi umum sistem dan aturan approval</p>
                </div>
            </div>

            <SettingsTabs active="general" />

            {flash?.success && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm mb-5">
                    {flash.success}
                </div>
            )}

            <form onSubmit={submit} className="card max-w-2xl">
                <div className="card-body space-y-5">
                    <div>
                        <label className="form-label">Nama Aplikasi</label>
                        <input
                            type="text"
                            value={data.app_name}
                            onChange={e => setData('app_name', e.target.value)}
                            className={`form-input ${errors.app_name ? 'form-input-error' : ''}`}
                            placeholder="Nama aplikasi sistem"
                        />
                        {errors.app_name && <p className="form-error">{errors.app_name}</p>}
                    </div>

                    <div>
                        <label className="form-label">Zona Waktu</label>
                        <select
                            value={data.timezone}
                            onChange={e => setData('timezone', e.target.value)}
                            className="form-select"
                        >
                            {TIMEZONES.map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                        {errors.timezone && <p className="form-error">{errors.timezone}</p>}
                    </div>

                    <div>
                        <label className="form-label">Bahasa</label>
                        <select
                            value={data.locale}
                            onChange={e => setData('locale', e.target.value)}
                            className="form-select"
                        >
                            {LOCALES.map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                            ))}
                        </select>
                        {errors.locale && <p className="form-error">{errors.locale}</p>}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={processing} className="btn btn-primary">
                            <Save className="w-4 h-4" /> {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}