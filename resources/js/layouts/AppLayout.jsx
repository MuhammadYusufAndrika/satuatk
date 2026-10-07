import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';

export default function AppLayout({ header, children }) {
    const { auth, notifications_count } = usePage().props;
    const user = auth.user;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    const roles = user?.roles ?? [];
    const hasRole = (role) => roles.includes(role);

    const isAdmin = hasRole('Admin');
    const isApprover = hasRole('SM') || hasRole('GM');
    const isRequester = hasRole('Requester');

    const linkClass = (isActive) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg font-medium ${
        isActive
            ? 'bg-primary-50 text-primary-600'
            : 'text-gray-600 hover:bg-gray-50'
    }`;


    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex md:flex-col shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <Link href="/" className="flex flex-col">
                        <span className="font-bold text-lg text-gray-900 tracking-wide">SATU ATK</span>
                        <span className="text-xs text-gray-500">SADAHANA</span>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 text-sm">
                    <div>
                        <Link href={route('dashboard')} className={linkClass(route().current('dashboard'))}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                            Dashboard
                        </Link>
                    </div>

                    {isRequester && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Permintaan</div>
                            <div className="space-y-1">
                                <Link href={route('requests.index')} className={linkClass(route().current('requests.*') && !route().current('requests.reorder*'))}>
                                    Permintaan
                                </Link>
                            </div>
                        </div>
                    )}

                    {(isAdmin || isApprover) && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Pengelolaan ATK</div>
                            <div className="space-y-1">
                                {isAdmin && (
                                    <Link href={route('inventory.index')} className={linkClass(route().current('inventory.index') || route().current('inventory.items.*') || route().current('inventory.stock.*') || route().current('inventory.opname.*'))}>
                                        Inventori
                                    </Link>
                                )}
                                {isAdmin && (
                                    <Link href={route('inventory.adjustment.index')} className={linkClass(route().current('inventory.adjustment.*'))}>
                                        Penyesuaian Stok
                                    </Link>
                                )}
                                {(isAdmin || isApprover) && (
                                    <Link href={route('approvals.index')} className={linkClass(route().current('approvals.*'))}>
                                        Persetujuan
                                    </Link>
                                )}
                                {isAdmin && (
                                    <Link href={route('distribution.index')} className={linkClass(route().current('distribution.*'))}>
                                        Distribusi
                                    </Link>
                                )}
                                {isAdmin && (
                                    <Link href={route('requests.reorder')} className={linkClass(route().current('requests.reorder*'))}>
                                        Rekomendasi Reorder
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}

                    {(isAdmin || isApprover) && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Laporan</div>
                            <div className="space-y-1">
                                <Link href={route('reports.index')} className={linkClass(route().current('reports.*'))}>
                                    Laporan
                                </Link>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Master Data</div>
                            <div className="space-y-1">
                                <Link href={route('master.index')} className={linkClass(route().current('master.*'))}>
                                    Master Data
                                </Link>
                            </div>
                        </div>
                    )}

                    {isAdmin && (
                        <div>
                            <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Administrasi</div>
                            <div className="space-y-1">
                                <Link href={route('users.index')} className={linkClass(route().current('users.*'))}>
                                    Manajemen User
                                </Link>
                                <Link href={route('audit.index')} className={linkClass(route().current('audit.*'))}>
                                    Audit Trail
                                </Link>
                                <Link href={route('settings.index')} className={linkClass(route().current('settings.*'))}>
                                    Pengaturan
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0">
    <div className="flex items-center gap-4">
        {header && <h1 className="text-xl font-semibold text-gray-800">{header}</h1>}
    </div>

    <div className="flex items-center gap-4">
        <Link href={route('notifications.index')} className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {notifications_count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {notifications_count > 9 ? '9+' : notifications_count}
                </span>
            )}
        </Link>
        <div className="relative">
            <Dropdown>
                <Dropdown.Trigger>
                    <button className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none">
                        <span className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs">
    {user.name.substring(0, 2).toUpperCase()}
</span>

                        <span>{user.name}</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </Dropdown.Trigger>

                <Dropdown.Content>
                    <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                    <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                </Dropdown.Content>
            </Dropdown>
        </div>
    </div>
</header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}