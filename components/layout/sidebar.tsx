'use client';

import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
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
            className={`hidden shrink-0 flex-col rounded-xl bg-zinc-900/70 backdrop-blur-xl transition-all duration-200 lg:flex ${w}`}
        >
            {/* Верх: часы + toggle */}
            <div className='flex items-start justify-between px-3 pt-4 pb-3'>
                {!collapsed && (
                    <div className='min-w-0'>
                        <p className='font-mono text-xl font-bold tracking-tight text-white'>
                            {time}
                        </p>
                        <div className='mt-2 rounded-md bg-white/[0.04] px-2 py-1'>
                            <p className='text-[11px] font-medium text-zinc-400'>{dateLong}</p>
                        </div>
                    </div>
                )}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={toggleCollapsed}
                                className={[
                                    'shrink-0 rounded-lg transition-colors',
                                    collapsed
                                        ? 'mx-auto p-2 text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                                        : 'mt-0.5 p-1.5 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300'
                                ].join(' ')}
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
                            className='border-zinc-700 bg-zinc-800 text-zinc-200'
                        >
                            {collapsed ? 'Развернуть' : 'Свернуть'}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Часы в свёрнутом виде */}
            {collapsed && (
                <div className='pb-3 text-center'>
                    <p className='font-mono text-xs font-bold text-zinc-400'>{time}</p>
                </div>
            )}

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
                                        ? 'bg-white/[0.07] text-white font-medium'
                                        : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200'
                                ].join(' ')}
                            >
                                <Icon size={18} className='shrink-0' />
                                {!collapsed && <span className='text-sm'>{item.label}</span>}
                            </button>
                        );

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                                    <TooltipContent
                                        side='right'
                                        className='border-zinc-700 bg-zinc-800 text-zinc-200'
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
            <div className='border-t border-white/[0.06] p-2'>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={[
                                'flex w-full items-center gap-3 rounded-lg transition-colors hover:bg-white/[0.04]',
                                collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2'
                            ].join(' ')}
                        >
                            <Avatar className='h-8 w-8 shrink-0'>
                                <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                                <AvatarFallback className='bg-zinc-800 text-xs text-zinc-400'>
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            {!collapsed && (
                                <div className='min-w-0 flex-1 text-left'>
                                    <p className='truncate text-sm font-medium text-zinc-200'>
                                        {user.name}
                                    </p>
                                    <p className='truncate text-[11px] text-zinc-500'>
                                        {user.role}
                                    </p>
                                </div>
                            )}
                            {!collapsed && (
                                <ChevronDown size={14} className='shrink-0 text-zinc-600' />
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side='top'
                        align='start'
                        sideOffset={8}
                        className='w-56 border-zinc-700/50 bg-zinc-900'
                    >
                        <DropdownMenuLabel className='font-normal'>
                            <div className='flex items-center gap-3'>
                                <Avatar className='h-9 w-9'>
                                    <AvatarImage src={getAvatarUrl(user.name)} alt={user.name} />
                                    <AvatarFallback className='bg-zinc-800 text-xs text-zinc-400'>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className='min-w-0'>
                                    <p className='truncate text-sm font-medium text-zinc-100'>
                                        {user.name}
                                    </p>
                                    <p className='truncate text-xs text-zinc-500'>{user.email}</p>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className='bg-zinc-800' />
                        <DropdownMenuItem
                            onClick={() => router.push('/dashboard/settings')}
                            className='gap-2 text-zinc-300 focus:bg-zinc-800 focus:text-white'
                        >
                            <Settings size={14} />
                            Настройки
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className='bg-zinc-800' />
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

    return (
        <>
            {/* Верхняя полоска — только лого и время */}
            <header className='flex h-12 items-center justify-between border-b border-white/[0.06] bg-zinc-900/70 px-4 backdrop-blur-xl lg:hidden'>
                <button
                    onClick={() => router.push('/')}
                    className='text-base font-bold tracking-tight text-white'
                >
                    HooBu
                </button>
                <HeaderClock />
            </header>

            {/* Нижний таббар */}
            <nav className='fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06] bg-zinc-900/90 backdrop-blur-xl lg:hidden'>
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
                                        isActive ? 'text-amber-400' : 'text-zinc-500'
                                    }
                                />
                                <span
                                    className={[
                                        'text-[10px]',
                                        isActive
                                            ? 'font-medium text-amber-400'
                                            : 'text-zinc-500'
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
                                    <AvatarFallback className='bg-zinc-800 text-[8px] text-zinc-400'>
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className='text-[10px] text-zinc-500'>Ещё</span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            side='top'
                            align='end'
                            sideOffset={8}
                            className='w-52 border-zinc-700/50 bg-zinc-900'
                        >
                            <DropdownMenuLabel className='font-normal'>
                                <div className='flex items-center gap-3'>
                                    <Avatar className='h-9 w-9'>
                                        <AvatarImage
                                            src={getAvatarUrl(user.name)}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className='bg-zinc-800 text-xs text-zinc-400'>
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className='min-w-0'>
                                        <p className='truncate text-sm font-medium text-zinc-100'>
                                            {user.name}
                                        </p>
                                        <p className='truncate text-xs text-zinc-500'>
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className='bg-zinc-800' />
                            <DropdownMenuItem
                                onClick={() => router.push('/dashboard/settings')}
                                className='gap-2 text-zinc-300 focus:bg-zinc-800 focus:text-white'
                            >
                                <Settings size={14} />
                                Настройки
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className='bg-zinc-800' />
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
        <span className='font-mono text-xs text-zinc-500'>
            {now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
        </span>
    );
}
