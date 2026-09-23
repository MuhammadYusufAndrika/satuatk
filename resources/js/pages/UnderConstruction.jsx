import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import { Construction } from 'lucide-react';

/**
 * Generic "Under Construction" page used as placeholder for
 * pages that are not yet fully implemented.
 */
export default function UnderConstruction({ title = 'Halaman ini', module = '' }) {
    return (
        <AppLayout>
            <Head title={title} />
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-5">
                    <Construction className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
                <p className="text-slate-500 max-w-sm">
                    Halaman ini sedang dalam pengembangan dan akan segera tersedia.
                </p>
            </div>
        </AppLayout>
    );
}
