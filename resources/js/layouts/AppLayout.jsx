import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard, ClipboardList, Boxes, SlidersHorizontal,
    CheckCircle2, Truck, RefreshCcw, BarChart3, Database,
    Users, ScrollText, Settings, Menu, X, Bell, ChevronDown,
} from 'lucide-react';
import Dropdown from '@/Components/Dropdown';

function NavSection({ title, children }) {
    return (
        <div>
            <p className="px-3 mb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.14em]">
                {title}
            </p>
            <div className="space-y-1">{children}</div>
        </div>
    );
}

function NavLink({ href, active, icon: Icon, children, onNavigate }) {
    return (
        <Link
            href={href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                    ? 'bg-gradient-to-r from-[#b8892b] to-[#d9a94a] text-[#0b1c36] font-semibold shadow-lg shadow-black/25'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
        >
            <Icon
                className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                    active ? 'text-[#0b1c36]' : 'text-slate-400 group-hover:text-[#d9a94a]'
                }`}
            />
            <span className="truncate">{children}</span>
        </Link>
    );
}

export default function AppLayout({ header, breadcrumbs, children }) {
    const { auth, notifications_count } = usePage().props;
    const user = auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const roles = user?.roles ?? [];
    const hasRole = (role) => roles.includes(role);

    const isAdmin = hasRole('Admin');
    const isApprover = hasRole('SM') || hasRole('GM');
    const isRequester = hasRole('Requester');

    const closeSidebar = () => setSidebarOpen(false);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#b8892b] to-[#d9a94a] flex items-center justify-center shadow-lg shadow-black/30 shrink-0">
                    <span className="text-[#0b1c36] font-black text-[11px] leading-none">ATK</span>
                </div>
                <Link href="/" className="flex flex-col leading-tight" onClick={closeSidebar}>
                    <span className="font-bold text-[15px] text-white tracking-wide">SATU ATK</span>
                    <span className="text-[10px] text-slate-400 tracking-[0.28em] font-medium">SADAHANA</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-6 sidebar-dark-scroll">
                <div>
                    <NavLink
                        href={route('dashboard')}
                        active={route().current('dashboard')}
                        icon={LayoutDashboard}
                        onNavigate={closeSidebar}
                    >
                        Dashboard
                    </NavLink>
                </div>

                {isRequester && (
                    <NavSection title="Permintaan">
                        <NavLink
                            href={route('requests.index')}
                            active={route().current('requests.*') && !route().current('requests.reorder*')}
                            icon={ClipboardList}
                            onNavigate={closeSidebar}
                        >
                            Permintaan
                        </NavLink>
                    </NavSection>
                )}

                {(isAdmin || isApprover) && (
                    <NavSection title="Pengelolaan ATK">
                        {isAdmin && (
                            <NavLink
                                href={route('inventory.index')}
                                active={route().current('inventory.index') || route().current('inventory.items.*') || route().current('inventory.stock.*') || route().current('inventory.opname.*')}
                                icon={Boxes}
                                onNavigate={closeSidebar}
                            >
                                Inventori
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink
                                href={route('inventory.adjustment.index')}
                                active={route().current('inventory.adjustment.*')}
                                icon={SlidersHorizontal}
                                onNavigate={closeSidebar}
                            >
                                Penyesuaian Stok
                            </NavLink>
                        )}
                        {(isAdmin || isApprover) && (
                            <NavLink
                                href={route('approvals.index')}
                                active={route().current('approvals.*')}
                                icon={CheckCircle2}
                                onNavigate={closeSidebar}
                            >
                                Persetujuan
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink
                                href={route('distribution.index')}
                                active={route().current('distribution.*')}
                                icon={Truck}
                                onNavigate={closeSidebar}
                            >
                                Distribusi
                            </NavLink>
                        )}
                        {isAdmin && (
                            <NavLink
                                href={route('requests.reorder')}
                                active={route().current('requests.reorder*')}
                                icon={RefreshCcw}
                                onNavigate={closeSidebar}
                            >
                                Rekomendasi Reorder
                            </NavLink>
                        )}
                    </NavSection>
                )}

                {(isAdmin || isApprover) && (
                    <NavSection title="Laporan">
                        <NavLink
                            href={route('reports.index')}
                            active={route().current('reports.*')}
                            icon={BarChart3}
                            onNavigate={closeSidebar}
                        >
                            Laporan
                        </NavLink>
                    </NavSection>
                )}

                {isAdmin && (
                    <NavSection title="Master Data">
                        <NavLink
                            href={route('master.index')}
                            active={route().current('master.*')}
                            icon={Database}
                            onNavigate={closeSidebar}
                        >
                            Master Data
                        </NavLink>
                    </NavSection>
                )}

                {isAdmin && (
                    <NavSection title="Administrasi">
                        <NavLink
                            href={route('users.index')}
                            active={route().current('users.*')}
                            icon={Users}
                            onNavigate={closeSidebar}
                        >
                            Manajemen User
                        </NavLink>
                        <NavLink
                            href={route('audit.index')}
                            active={route().current('audit.*')}
                            icon={ScrollText}
                            onNavigate={closeSidebar}
                        >
                            Audit Trail
                        </NavLink>
                        <NavLink
                            href={route('settings.index')}
                            active={route().current('settings.*')}
                            icon={Settings}
                            onNavigate={closeSidebar}
                        >
                            Pengaturan
                        </NavLink>
                    </NavSection>
                )}
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/10 shrink-0">
                <div className="h-1 rounded-full bg-gradient-to-r from-[#b8892b] via-[#d9a94a] to-transparent mb-3" />
                <p className="text-[11px] text-slate-500">
                    SADAHANA &bull; SATU ATK <span className="text-slate-600">v1.0</span>
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#eef1f6] flex">
            {/* SIDEBAR — desktop */}
            <aside className="w-72 bg-gradient-to-b from-[#0b1c36] via-[#101f3c] to-[#16294c] hidden md:block shrink-0 md:sticky md:top-0 md:h-screen shadow-2xl shadow-slate-900/10">
                {sidebarContent}
            </aside>

            {/* SIDEBAR — mobile drawer */}
            <div
                className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity md:hidden ${
                    sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={closeSidebar}
            />
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-[#0b1c36] via-[#101f3c] to-[#16294c] shadow-2xl transition-transform duration-200 md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <button
                    onClick={closeSidebar}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Tutup menu"
                >
                    <X className="w-5 h-5" />
                </button>
                {sidebarContent}
            </aside>

            {/* MAIN */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            aria-label="Buka menu"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        {breadcrumbs && breadcrumbs.length > 0 ? (
                            <nav className="flex items-center gap-1.5 text-sm min-w-0">
                                {breadcrumbs.map((crumb, i) => (
                                    <span key={i} className="flex items-center gap-1.5 min-w-0">
                                        {i > 0 && <span className="text-slate-300">/</span>}
                                        {crumb.href ? (
                                            <Link href={crumb.href} className="text-slate-500 hover:text-[#0b1c36] transition-colors truncate">
                                                {crumb.label}
                                            </Link>
                                        ) : (
                                            <span className="font-semibold text-slate-800 truncate">{crumb.label}</span>
                                        )}
                                    </span>
                                ))}
                            </nav>
                        ) : (
                            header && <h1 className="text-lg font-semibold text-slate-800 truncate">{header}</h1>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <Link
                            href={route('notifications.index')}
                            className="relative p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#0b1c36] transition-colors"
                            aria-label="Notifikasi"
                        >
                            <Bell className="w-5 h-5" />
                            {notifications_count > 0 && (
                                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                                    {notifications_count > 9 ? '9+' : notifications_count}
                                </span>
                            )}
                        </Link>
                        <div className="w-px h-8 bg-slate-200 hidden sm:block" />
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center gap-2.5 rounded-xl pl-1 pr-1 sm:pr-2 py-1 hover:bg-slate-100 transition-colors focus:outline-none">
                                    <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#16294c] to-[#3a5788] text-white flex items-center justify-center font-bold text-xs ring-2 ring-[#d9a94a]/60 shadow">
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </span>
                                    <span className="hidden sm:flex flex-col items-start leading-tight">
                                        <span className="text-sm font-semibold text-slate-800 max-w-32 truncate">{user.name}</span>
                                        <span className="text-[11px] text-slate-400">{roles[0] ?? 'User'}</span>
                                    </span>
                                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content>
                                <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                                <Dropdown.Link href={route('logout')} method="post" as="button">Log Out</Dropdown.Link>
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 animate-fade-in">
                    {children}
                </main>
            </div>
        </div>
    );
}
