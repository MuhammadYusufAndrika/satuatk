export default function AuthLayout({ children }) {
    return (
        <div className="min-h-screen flex">
            {/* Left panel — branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#16294c] via-[#0f2140] to-[#0b1c36] flex-col justify-center p-12 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                {/* Title */}
                <div className="relative">
                    <div className="inline-block">
                        <p className="text-[#d9a94a] text-xs font-semibold uppercase tracking-[0.2em] mb-1">
                            Selamat Datang di
                        </p>
                        <h1 className="text-white text-4xl font-bold leading-snug tracking-wide">
                            SATU ATK
                        </h1>
                        <div className="w-full h-1.5 bg-[#d9a94a] rounded-full mt-4" />
                    </div>

                    <p className="text-[#c6d1e3] text-lg leading-relaxed mt-6">
                        Sistem Terpadu Pengadaan Alat Tulis Kantor
                    </p>
                    <p className="text-[#93a4c2] text-sm leading-relaxed whitespace-nowrap mt-3">
                        Kelola permintaan, distribusi, dan inventori alat tulis kantor secara efisien dan transparan.
                    </p>

                    {/* Feature highlights */}
                    <div className="mt-10 space-y-4">
                        {[
                            "Pengajuan & persetujuan permintaan ATK secara digital",
                            "Distribusi dan stok inventori yang transparan",
                            "Laporan lengkap untuk setiap level approval",
                        ].map((text) => (
                            <div key={text} className="flex items-start gap-3">
                                <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-[#d9a94a]/15 flex items-center justify-center">
                                    <svg
                                        className="w-3 h-3 text-[#d9a94a]"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <p className="text-[#c6d1e3] text-sm leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                {children}
            </div>
        </div>
    );
}