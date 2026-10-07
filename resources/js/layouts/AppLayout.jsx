import { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Dropdown from '@/Components/Dropdown';
import {
    LayoutDashboard, ClipboardList, Package, ArrowLeftRight,
    CheckSquare, Truck, BarChart3, Database, Users, ShieldCheck,
    Settings, Bell, Menu, X, ChevronRight, Home,
} from 'lucide-react';

function NavItem({ href, active, icon: Icon, label, badge }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                    ? 'bg-[#2B5CFF] text-white'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
            <span className="flex-1 truncate">{label}</span>
            {badge != null && badge > 0 && (
                <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-red-600 text-white'}`}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </Link>
    );
}

function SectionLabel({ children }) {
    return (
        <div className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            {children}
        </div>
    );
}

export default function AppLayout({ header, breadcrumbs, children }) {
    const { auth, notifications_count } = usePage().props;
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const roles = user?.roles ?? [];
    const hasRole = (role) => roles.includes(role);

    const isAdmin = hasRole('Admin');
    const isApprover = hasRole('SM') || hasRole('GM');
    const isRequester = hasRole('Requester');

    const safeRoute = (name) => {
        try {
            return route(name);
        } catch {
            return '#';
        }
    };
    const isCurrent = (pattern) => {
        try {
            return route().current(pattern);
        } catch {
            return false;
        }
    };

    const sidebar = (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B5CFF]">
                    <Package className="h-5 w-5 text-white" />
                </div>
                <Link href="/" className="flex flex-col leading-tight">
                    <span className="text-[16px] font-extrabold tracking-wide text-white">SATU ATK</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Sadahana</span>
                </Link>
            </div>

            {/* Nav */}
            <div className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5 text-sm">
                <div>
                    <NavItem
                        href={safeRoute('dashboard')}
                        active={isCurrent('dashboard')}
                        icon={LayoutDashboard}
                        label="Dashboard"
                    />
                </div>

                {isRequester && (
                    <div>
                        <SectionLabel>Permintaan</SectionLabel>
                        <div className="space-y-0.5">
                            <NavItem
                                href={safeRoute('requests.index')}
                                active={isCurrent('requests.*') && !isCurrent('requests.reorder*')}
                                icon={ClipboardList}
                                label="Permintaan"
                            />
                        </div>
                    </div>
                )}

                {(isAdmin || isApprover) && (
                    <div>
                        <SectionLabel>Pengelolaan ATK</SectionLabel>
                        <div className="space-y-0.5">
                            {isAdmin && (
                                <NavItem
                                    href={safeRoute('inventory.index')}
                                    active={isCurrent('inventory.index') || isCurrent('inventory.items.*') || isCurrent('inventory.stock.*') || isCurrent('inventory.opname.*')}
                                    icon={Package}
                                    label="Inventori"
                                />
                            )}
                            {isAdmin && (
                                <NavItem
                                    href={safeRoute('inventory.adjustment.index')}
                                    active={isCurrent('inventory.adjustment.*')}
                                    icon={ArrowLeftRight}
                                    label="Penyesuaian Stok"
                                />
                            )}
                            {(isAdmin || isApprover) && (
                                <NavItem
                                    href={safeRoute('approvals.index')}
                                    active={isCurrent('approvals.*')}
                                    icon={CheckSquare}
                                    label="Persetujuan"
                                />
                            )}
                            {isAdmin && (
                                <NavItem
                                    href={safeRoute('distribution.index')}
                                    active={isCurrent('distribution.*')}
                                    icon={Truck}
                                    label="Distribusi"
                                />
                            )}
                            {isAdmin && (
                                <NavItem
                                    href={safeRoute('requests.reorder')}
                                    active={isCurrent('requests.reorder*')}
                                    icon={ClipboardList}
                                    label="Rekomendasi Reorder"
                                />
                            )}
                        </div>
                    </div>
                )}

                {(isAdmin || isApprover) && (
                    <div>
                        <SectionLabel>Laporan</SectionLabel>
                        <div className="space-y-0.5">
                            <NavItem
                                href={safeRoute('reports.index')}
                                active={isCurrent('reports.*')}
                                icon={BarChart3}
                                label="Laporan"
                            />
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div>
                        <SectionLabel>Master Data</SectionLabel>
                        <div className="space-y-0.5">
                            <NavItem
                                href={safeRoute('master.index')}
                                active={isCurrent('master.*')}
                                icon={Database}
                                label="Master Data"
                            />
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div>
                        <SectionLabel>Administrasi</SectionLabel>
                        <div className="space-y-0.5">
                            <NavItem
                                href={safeRoute('users.index')}
                                active={isCurrent('users.*')}
                                icon={Users}
                                label="Manajemen User"
                            />
                            <NavItem
                                href={safeRoute('audit.index')}
                                active={isCurrent('audit.*')}
                                icon={ShieldCheck}
                                label="Audit Trail"
                            />
                            <NavItem
                                href={safeRoute('settings.index')}
                                active={isCurrent('settings.*')}
                                icon={Settings}
                                label="Pengaturan"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* User mini */}
            <div className="shrink-0 border-t border-white/10 p-4">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2B5CFF] text-xs font-extrabold text-white">
                        {user.name.substring(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
                        <p className="truncate text-[11px] text-slate-400">{(roles[0] ?? 'User')}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-[#F4F6FB]">
            {/* SIDEBAR desktop */}
            <aside className="hidden w-64 shrink-0 bg-[#0B1C36] md:block">
                <div className="h-screen sticky top-0">{sidebar}</div>
            </aside>

            {/* SIDEBAR mobile */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-[#0B1C36]/70" onClick={() => setMobileOpen(false)} />
                    <aside className="absolute inset-y-0 left-0 w-72 bg-[#0B1C36] shadow-2xl">
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="absolute right-3 top-4 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        {sidebar}
                    </aside>
                </div>
            )}

            {/* MAIN */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 md:hidden"
                            >
                                <Menu className="h-5 w-5" />
                            </button>
                            <div className="min-w-0">
                                {breadcrumbs?.length > 0 ? (
                                    <nav className="flex items-center gap-1.5 text-[13px]">
                                        <Link href={safeRoute('dashboard')} className="flex items-center gap-1 text-slate-400 hover:text-[#2B5CFF]">
                                            <Home className="h-3.5 w-3.5" />
                                        </Link>
                                        {breadcrumbs.map((b, i) => (
                                            <span key={i} className="flex items-center gap-1.5">
                                                <ChevronRight className="h-3 w-3 text-slate-300" />
                                                {b.href ? (
                                                    <Link href={b.href} className="text-slate-400 hover:text-[#2B5CFF]">{b.label}</Link>
                                                ) : (
                                                    <span className="font-bold text-[#0B1C36]">{b.label}</span>
                                                )}
                                            </span>
                                        ))}
                                    </nav>
                                ) : header ? (
                                    <h1 className="truncate text-[17px] font-bold text-[#0B1C36]">{header}</h1>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <Link
                                href={safeRoute('notifications.index')}
                                className="relative rounded-lg bg-slate-100 p-2.5 text-slate-500 transition-colors hover:bg-[#EEF3FF] hover:text-[#2B5CFF]"
                            >
                                <Bell className="h-5 w-5" />
                                {notifications_count > 0 && (
                                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] font-extrabold text-white">
                                        {notifications_count > 9 ? '9+' : notifications_count}
                                    </span>
                                )}
                            </Link>
                            <div className="relative">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center gap-2 rounded-lg bg-slate-100 py-1.5 pl-1.5 pr-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 focus:outline-none">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0B1C36] text-xs font-extrabold text-white">
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </span>
                                            <span className="hidden max-w-28 truncate sm:block">{user.name}</span>
                                            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link href={safeRoute('profile.edit')}>Profile</Dropdown.Link>
                                        <Dropdown.Link href={safeRoute('logout')} method="post" as="button">Log Out</Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <div className="mx-auto max-w-7xl animate-fade-in">
                        {children}
                    </div>
                    <p className="mx-auto mt-8 max-w-7xl pb-2 text-center text-[11px] text-slate-400">
                        SATU ATK • Sadahana — Sistem pengendalian ATK terpadu
                    </p>
                </main>
            </div>
        </div>
    );
}
