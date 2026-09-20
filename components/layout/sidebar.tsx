'use client';

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {useBranding} from '@/components/providers/branding-provider';
import {ThemeToggle} from '@/components/layout/theme-toggle';
import {UserData} from '@/types/auth/jwt.types';
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    MapPin,
    BarChart3,
    PanelLeftClose,
    PanelLeftOpen
} from 'lucide-react';
import {useRouter, usePathname} from 'next/navigation';
import {useCallback, useEffect, useState} from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';

interface SidebarProps {
    user: UserData;
    onLogout: () => void;
}

const NAV_ITEMS = [
    {href: '/dashboard', label: 'Главная', icon: LayoutDashboard},
    {href: '/dashboard/bookings', label: 'Бронирования', icon: CalendarDays},
    {href: '/dashboard/guests', label: 'Гости', icon: Users},
    {href: '/dashboard/locations', label: 'Точки', icon: MapPin},
    {href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3},
    {href: '/dashboard/settings', label: 'Настройки', icon: Settings}
];

function getAvatarUrl(seed: string): string {
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function Sidebar({user, onLogout}: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const {orgName, logoUrl} = useBranding();
    const [clock, setClock] = useState(() => new Date());
    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('sidebar-collapsed') === 'true';
    });

    useEffect(() => {
        const interval = setInterval(() => setClock(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const toggleCollapsed = useCallback(() => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebar-collapsed', String(next));
            return next;
        });
    }, []);

    const time = clock.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const dateLong = clock.toLocaleDateString('ru-RU', {day: 'numeric', month: 'long', year: 'numeric'});

    const w = collapsed ? 'w-[68px]' : 'w-60';

    return (
        <aside
            className={`hidden shrink-0 flex-col rounded-xl border border-header-fg/10 bg-header/70 backdrop-blur-xl transition-all duration-200 lg:flex ${w}`}
        >
            {/* Верх: лого организации + управление */}
            <div
                className={[
                    'flex gap-2',
                    collapsed
                        ? 'flex-col items-center px-2 pt-4 pb-2'
                        : 'items-start justify-between px-3 pt-4 pb-2'
                ].join(' ')}
            >
                <button
                    onClick={() => router.push('/dashboard')}
                    className='flex min-w-0 items-center gap-2.5 rounded-lg transition-opacity hover:opacity-80'
                    title={orgName ?? 'HooBu'}
                >
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt={orgName ?? 'Логотип'}
                            className='h-8 w-8 shrink-0 rounded-lg object-cover'
                        />
                    ) : (
                        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-brand-fg'>
                            {(orgName ?? 'HooBu').slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    {!collapsed && (
                        <span className='truncate text-sm font-semibold text-header-fg'>
                            {orgName ?? 'HooBu'}
                        </span>
                    )}
                </button>

                <div
                    className={[
                        'flex shrink-0 gap-0.5',
                        collapsed ? 'flex-col items-center' : 'items-center'
                    ].join(' ')}
                >
                    <ThemeToggle side='right' />
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={toggleCollapsed}
                                    className='shrink-0 rounded-lg p-1.5 text-header-fg/60 transition-colors hover:bg-header-fg/[0.08] hover:text-header-fg'
                                >
                                    {collapsed ? (
                                        <PanelLeftOpen size={18} />
                                    ) : (
                                        <PanelLeftClose size={16} />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent
                                side='right'
                                className='border-app-border bg-surface-2 text-app-fg/90'
                            >
                                {collapsed ? 'Развернуть' : 'Свернуть'}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Часы */}
            <div className={collapsed ? 'pb-3 text-center' : 'px-3 pb-3'}>
                {collapsed ? (
                    <p className='font-mono text-xs font-bold text-header-fg/60'>{time}</p>
                ) : (
                    <div className='min-w-0'>
                        <p className='font-mono text-xl font-bold tracking-tight text-header-fg'>
                            {time}
                        </p>
                        <div className='mt-2 rounded-md bg-header-fg/[0.06] px-2 py-1'>
                            <p className='text-[11px] font-medium text-header-fg/60'>{dateLong}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Навигация */}
            <nav className='flex-1 space-y-0.5 px-2'>
                <TooltipProvider delayDuration={0}>
                    {NAV_ITEMS.map(item => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        const btn = (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className={[
                                    'flex w-full items-center gap-3 rounded-lg transition-colors',
                                    collapsed
                                        ? 'justify-center px-0 py-2.5'
                                        : 'px-3 py-2',
                                    isActive
                                        ? 'bg-header-fg/[0.10] text-header-fg font-medium'
                                        : 'text-header-fg/60 hover:bg-header-fg/[0.06] hover:text-header-fg'
                                ].join(' ')}
                            >
                                <Icon
                                    size={18}
                                    className={['shrink-0', isActive ? 'text-brand' : ''].join(' ')}
                                />
                                {!collapsed && <span className='text-sm'>{item.label}</span>}
                            </button>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                                    <TooltipContent
                                        side='right'
                                        className='border-app-border bg-surface-2 text-app-fg/90'
                                    >
                                        {item.label}
                                    </TooltipContent>
                                </Tooltip>
                            );
                        }

                        return btn;
                    })}
                </TooltipProvider>
            </nav>

            {/* Низ: профиль */}
            <div className='border-t border-header-fg/10 p-2'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={[
                                'flex w-full items-center gap-3 rounded-lg transition-colors hover:bg-header-fg/[0.06]',
                                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                            ].join(' ')}
                        >
                            <Avatar className='h-8 w-8 shrink-0'>
                                <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                                <AvatarFallback className='bg-header-fg/10 text-xs text-header-fg/70'>
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className='min-w-0 flex-1 text-left'>
                                    <p className='truncate text-sm font-medium text-header-fg/90'>
                                        {user.name}
                                    </p>
                                    <p className='truncate text-[11px] text-header-fg/50'>
                                        {user.role}
                                    </p>
                                </div>
                            )}
                            {!collapsed && (
                                <ChevronDown size={14} className='shrink-0 text-header-fg/50' />
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side='top'
                        align='start'
                        sideOffset={8}
                        className='w-56 border-app-border/50 bg-surface'
                    >
                        <DropdownMenuLabel className='font-normal'>
                            <div className='flex items-center gap-3'>
                                <Avatar className='h-9 w-9'>
                                    <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                                    <AvatarFallback className='bg-surface-2 text-xs text-app-muted'>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='min-w-0'>
                                    <p className='truncate text-sm font-medium text-app-fg'>
                                        {user.name}
                                    </p>
                                    <p className='truncate text-xs text-app-subtle'>{user.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className='bg-surface-2' />
                        <DropdownMenuItem
                            onClick={() => router.push('/dashboard/settings')}
                            className='gap-2 text-app-fg/80 focus:bg-surface-2 focus:text-app-fg'
                        >
                            <Settings size={14} />
                            Настройки
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-surface-2' />
                        <DropdownMenuItem
                            onClick={onLogout}
                            className='gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400'
                        >
                            <LogOut size={14} />
                            Выйти
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </aside>
    );
}

// ─── Мобильная навигация ─────────────────────────────────────────────────────

const MOBILE_NAV = [
    {href: '/dashboard', label: 'Главная', icon: LayoutDashboard},
    {href: '/dashboard/bookings', label: 'Брони', icon: CalendarDays},
    {href: '/dashboard/guests', label: 'Гости', icon: Users},
    {href: '/dashboard/locations', label: 'Точки', icon: MapPin},
    {href: '/dashboard/analytics', label: 'Аналитика', icon: BarChart3}
];

export function MobileNav({user, onLogout}: SidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const {orgName, logoUrl} = useBranding();

    return (
        <>
            {/* Верхняя полоска — лого и время */}
            <header className='flex h-12 items-center justify-between border-b border-header-fg/10 bg-header/70 px-4 backdrop-blur-xl lg:hidden'>
                <button
                    onClick={() => router.push('/dashboard')}
                    className='flex min-w-0 items-center gap-2'
                >
                    {logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt={orgName ?? 'Логотип'}
                            className='h-6 w-6 shrink-0 rounded-md object-cover'
                        />
                    ) : (
                        <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand text-[11px] font-bold text-brand-fg'>
                            {(orgName ?? 'HooBu').slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <span className='truncate text-sm font-semibold text-header-fg'>
                        {orgName ?? 'HooBu'}
                    </span>
                </button>
                <div className='flex items-center gap-1'>
                    <HeaderClock />
                    <ThemeToggle />
                </div>
            </header>

            {/* Нижний таббар */}
            <nav className='fixed inset-x-0 bottom-0 z-50 border-t border-app-border bg-surface/90 backdrop-blur-xl lg:hidden'>
                <div className='flex h-16 items-center justify-around px-2'>
                    {MOBILE_NAV.map(item => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.href}
                                onClick={() => router.push(item.href)}
                                className='flex flex-1 flex-col items-center gap-1 py-1'
                            >
                                <Icon
                                    size={20}
                                    className={
                                        isActive ? 'text-brand' : 'text-app-subtle'
                                    }
                                />
                                <span
                                    className={[
                                        'text-[10px]',
                                        isActive
                                            ? 'font-medium text-brand'
                                            : 'text-app-subtle'
                                    ].join(' ')}
                                >
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}

                    {/* Профиль */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className='flex flex-1 flex-col items-center gap-1 py-1'>
                                <Avatar className='h-5 w-5'>
                                    <AvatarImage
                                        src={getAvatarUrl(user.name)}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className='bg-surface-2 text-[8px] text-app-muted'>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className='text-[10px] text-app-subtle'>Ещё</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side='top'
                            align='end'
                            sideOffset={8}
                            className='w-52 border-app-border/50 bg-surface'
                        >
                            <DropdownMenuLabel className='font-normal'>
                                <div className='flex items-center gap-3'>
                                    <Avatar className='h-9 w-9'>
                                        <AvatarImage
                                            src={getAvatarUrl(user.name)}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className='bg-surface-2 text-xs text-app-muted'>
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium text-app-fg'>
                                            {user.name}
                                        </p>
                                        <p className='truncate text-xs text-app-subtle'>
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className='bg-surface-2' />
                            <DropdownMenuItem
                                onClick={() => router.push('/dashboard/settings')}
                                className='gap-2 text-app-fg/80 focus:bg-surface-2 focus:text-app-fg'
                            >
                                <Settings size={14} />
                                Настройки
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className='bg-surface-2' />
                            <DropdownMenuItem
                                onClick={onLogout}
                                className='gap-2 text-red-400 focus:bg-red-500/10 focus:text-red-400'
                            >
                                <LogOut size={14} />
                                Выйти
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </nav>
        </>
    );
}

function HeaderClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    return (
        <span className='font-mono text-xs text-header-fg/50'>
            {now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
        </span>
    );
}
