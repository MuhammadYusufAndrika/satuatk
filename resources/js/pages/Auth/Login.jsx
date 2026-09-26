import { useForm, Head } from '@inertiajs/react';
import AuthLayout from '@/layouts/AuthLayout';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <AuthLayout>
            <Head title="Masuk" />

            <div className="w-full max-w-sm animate-fade-in">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
                    <div className="w-10 h-10 bg-[#0b1c36] rounded-xl flex items-center justify-center border-b-2 border-[#b8892b]">
                        <span className="text-white font-black text-xs">ATK</span>
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">SATU ATK</p>
                        <p className="text-xs text-slate-400">PT. Dahana</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900">Masuk ke Sistemmm</h2>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Email */}
                    <div>
                        <label className="form-label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                            placeholder="Masukkan email"
                            autoComplete="username"
                            autoFocus
                        />
                        {errors.email && <p className="form-error">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                className={`form-input pr-10 ${errors.password ? 'form-input-error' : ''}`}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="form-error">{errors.password}</p>}
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.remember}
                                onChange={e => setData('remember', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-[#0b1c36] focus:ring-[#0b1c36]"
                            />
                            <span className="text-sm text-slate-600">Ingat saya</span>
                        </label>
                    </div>

                    {/* Submit */}
                    <button
    type="submit"
    disabled={processing}
    className="btn-primary w-full !rounded-2xl py-2.5 shadow-[0_10px_25px_-5px_rgba(11,28,54,0.5)] transition-transform hover:scale-[1.01]"
>
    <span className="mx-auto inline-flex items-center gap-2 font-bold">
        {processing ? (
            <span className="animate-pulse-soft">Memproses...</span>
        ) : (
            <>
                Masuk
                <ChevronRight className="w-4 h-4" />
            </>
        )}
    </span>
</button>
                </form>

                <p className="text-center text-xs text-slate-400 mt-8">
                    © {new Date().getFullYear()} SADAHANA — SATU ATK
                </p>
            </div>
        </AuthLayout>
    );
}