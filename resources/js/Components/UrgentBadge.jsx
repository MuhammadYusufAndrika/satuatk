/**
 * Label "Urgen" untuk permintaan berkategori urgent.
 * Tidak menampilkan apa-apa kalau kategori bukan 'urgent', jadi aman
 * dipasang langsung tanpa pengecekan di tempat pemakaian.
 */
export default function UrgentBadge({ category, className = '' }) {
    if (category !== 'urgent') return null;

    return (
        <span className={`badge badge-red ${className}`.trim()}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Urgen
        </span>
    );
}