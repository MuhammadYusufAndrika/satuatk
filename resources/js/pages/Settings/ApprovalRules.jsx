import { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Shield } from 'lucide-react';
import { cn } from '@/utils';
import { SettingsTabs } from '@/pages/Settings/Index';

const LEVEL_COLORS = {
    1: 'bg-blue-100 text-blue-700 border-blue-200',
    2: 'bg-purple-100 text-purple-700 border-purple-200',
};

const LEVEL_LABELS = { 1: 'Level 1 - Senior Manager', 2: 'Level 2 - General Manager' };

function formatRp(v) {
    return v == null ? 'Tak terbatas' : new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(v);
}

// --- Rule Modal ---

function RuleModal({ rule, onClose }) {
    const isEdit = !!rule;
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name:        rule?.name        ?? '',
        level:       rule?.level       ?? 1,
        min_value:   rule?.min_value   ?? 0,
        max_value:   rule?.max_value   ?? '',
        sla_hours:   rule?.sla_hours   ?? 24,
        description: rule?.description ?? '',
        is_active:   rule?.is_active   ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        const onSuccess = () => { reset(); onClose(); };
        if (isEdit) {
            put(route('settings.approval-rules.update', rule.id), { onSuccess });
        } else {
            post(route('settings.approval-rules.store'), { onSuccess });
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="min-h-full flex items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
                <div className="p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <h3 className="font-semibold text-slate-900">{isEdit ? 'Edit Aturan Approval' : 'Tambah Aturan Approval'}</h3>
                </div>
                <form onSubmit={submit} className="p-5 space-y-4">
                    <div>
                        <label className="form-label">Nama Aturan *</label>
                        <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                            className={`form-input ${errors.name ? 'form-input-error' : ''}`} placeholder="e.g. Nilai Menengah - Level 2" />
                        {errors.name && <p className="form-error">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="form-label">Level Approver *</label>
                        <select value={data.level} onChange={e => setData('level', +e.target.value)} className="form-select">
                            <option value={1}>Level 1 - Senior Manager</option>
                            <option value={2}>Level 2 - General Manager</option>
                        </select>
                        <p className="text-xs text-slate-400 mt-1">
                            Aturan ini aktif jika nilai permintaan &gt;= Min Value di bawah.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Min. Nilai (Rp) *</label>
                            <input type="number" min="0" value={data.min_value} onChange={e => setData('min_value', +e.target.value)}
                                className="form-input" placeholder="0" />
                            {errors.min_value && <p className="form-error">{errors.min_value}</p>}
                        </div>
                        <div>
                            <label className="form-label">Maks. Nilai (Rp)</label>
                            <input type="number" min="0" value={data.max_value} onChange={e => setData('max_value', e.target.value || '')}
                                className="form-input" placeholder="Kosong = tidak ada batas" />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">SLA (jam) *</label>
                        <input type="number" min="1" max="720" value={data.sla_hours} onChange={e => setData('sla_hours', +e.target.value)}
                            className="form-input" placeholder="24" />
                        <p className="text-xs text-slate-400 mt-1">Waktu maksimum respons untuk level ini.</p>
                        {errors.sla_hours && <p className="form-error">{errors.sla_hours}</p>}
                    </div>

                    <div>
                        <label className="form-label">Deskripsi</label>
                        <textarea rows={2} value={data.description} onChange={e => setData('description', e.target.value)}
                            className="form-input form-textarea" placeholder="Penjelasan singkat aturan ini" />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Batal</button>
                        <button type="submit" disabled={processing} className="btn btn-primary">{processing ? 'Menyimpan...' : 'Simpan Aturan'}</button>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}

// --- Main ---

export default function ApprovalRules({ rules }) {
    const [modal, setModal] = useState(null);

    const handleDelete = (id) => confirm('Hapus aturan ini?') && router.delete(route('settings.approval-rules.destroy', id));
    const handleToggle = (id) => router.patch(route('settings.approval-rules.toggle', id));

    return (
        <AppLayout breadcrumbs={[{ label: 'Pengaturan' }, { label: 'Aturan Approval' }]}>
            <Head title="Konfigurasi Approval" />

            <div className="page-header">
                <div>
                    <h1 className="page-title">Aturan Approval</h1>
                    <p className="page-subtitle">Konfigurasi hierarki persetujuan berdasarkan nilai permintaan</p>
                </div>
                <button onClick={() => setModal('create')} className="btn btn-primary">
                    <Plus className="w-4 h-4" /> Tambah Aturan
                </button>
            </div>

            <SettingsTabs active="approval" />

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Cara kerja aturan approval:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-600 text-xs">
                        <li>Setiap permintaan akan dicek terhadap semua aturan aktif.</li>
                        <li>Jika nilai permintaan &gt;= Min. Nilai suatu aturan, level tersebut wajib menyetujui.</li>
                        <li>Persetujuan berjenjang: Level 1 harus selesai sebelum Level 2, dst.</li>
                        <li>SLA menghitung waktu sejak notifikasi dikirim ke approver level tersebut.</li>
                    </ul>
                </div>
            </div>

            {/* Rules by level */}
            {[1, 2].map(lv => {
                const lvRules = rules.filter(r => r.level === lv);
                if (!lvRules.length) return null;
                return (
                    <div key={lv} className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', LEVEL_COLORS[lv])}>
                                {LEVEL_LABELS[lv]}
                            </span>
                        </div>
                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Nama</th>
                                        <th>Min. Nilai</th>
                                        <th>Maks. Nilai</th>
                                        <th>SLA</th>
                                        <th>Status</th>
                                        <th className="text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lvRules.map(r => (
                                        <tr key={r.id} className={!r.is_active ? 'opacity-50' : ''}>
                                            <td>
                                                <p className="font-medium text-slate-900">{r.name}</p>
                                                {r.description && <p className="text-xs text-slate-400">{r.description}</p>}
                                            </td>
                                            <td className="font-mono text-sm">{formatRp(r.min_value)}</td>
                                            <td className="font-mono text-sm text-slate-400">{r.max_value ? formatRp(r.max_value) : 'Tak terbatas'}</td>
                                            <td>
                                                <span className="text-sm font-medium text-slate-700">{r.sla_hours}j</span>
                                                <span className="text-xs text-slate-400 ml-1">({Math.round(r.sla_hours / 24)} hari)</span>
                                            </td>
                                            <td>
                                                {r.is_active
                                                    ? <span className="badge badge-green">Aktif</span>
                                                    : <span className="badge badge-slate">Nonaktif</span>
                                                }
                                            </td>
                                            <td>
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleToggle(r.id)}
                                                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                                        title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                                        {r.is_active
                                                            ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                                                            : <ToggleLeft className="w-4 h-4" />
                                                        }
                                                    </button>
                                                    <button onClick={() => setModal(r)}
                                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(r.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}

            {rules.length === 0 && (
                <div className="card">
                    <div className="card-body text-center py-12">
                        <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-400 font-medium">Belum ada aturan approval</p>
                        <p className="text-slate-300 text-sm mt-1">Klik "Tambah Aturan" untuk mulai konfigurasi.</p>
                    </div>
                </div>
            )}

            {modal && (
                <RuleModal
                    rule={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                />
            )}
        </AppLayout>
    );
}