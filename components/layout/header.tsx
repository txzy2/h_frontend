'use client';

import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {UserMenu} from '@/components/layout/user-menu';
import {ThemeToggle} from '@/components/layout/theme-toggle';
import {useBranding} from '@/components/providers/branding-provider';
import {UserData} from '@/types/auth/jwt.types';
import {useRouter} from 'next/navigation';
import {Lock} from 'lucide-react';
import {isAllowed} from '@/lib/auth/roles';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';
import {useEffect, useState} from 'react';

interface HeaderProps {
    user: UserData | null;
    isLoading: boolean;
    onLogout: () => void;
}

export function Header({user, isLoading, onLogout}: HeaderProps) {
    const router = useRouter();
    const {orgName, logoUrl} = useBranding();

    const brandName = user ? (orgName ?? 'HooBu') : 'HooBu';

    return (
        <header className='sticky top-0 z-50 w-full border-b border-header-fg/10 bg-header/70 backdrop-blur-xl'>
            <div className='mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4'>
                {/* Лого */}
                <button
                    onClick={() => router.push('/')}
                    className='flex min-w-0 items-center gap-2.5 transition-opacity hover:opacity-80'
                >
                    {user && logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={logoUrl}
                            alt={brandName}
                            className='h-8 w-8 shrink-0 rounded-lg object-cover'
                        />
                    ) : (
                        <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-[13px] font-bold text-brand-fg'>
                            {brandName.slice(0, 1).toUpperCase()}
                        </span>
                    )}
                    <span className='truncate text-lg font-bold tracking-tight text-header-fg'>
                        {brandName}
                    </span>
                </button>

                {/* Правая часть */}
                <div className='flex items-center gap-3'>
                    {user && <HeaderClock />}
                    <ThemeToggle className='shrink-0 rounded-lg p-1.5 text-header-fg/60 transition-colors hover:bg-header-fg/[0.08] hover:text-header-fg' />

                    {isLoading ? (
                        <div className='flex items-center gap-2.5 px-2 py-1.5'>
                            <Skeleton className='h-8 w-8 rounded-full' />
                            <Skeleton className='h-4 w-20' />
                        </div>
                    ) : user ? (
                        isAllowed(user.role) ? (
                            <UserMenu user={user} onLogout={onLogout} />
                        ) : (
                            <div className='flex items-center gap-3'>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className='flex cursor-pointer items-center gap-1.5'>
                                                <div className='flex h-7 w-7 items-center justify-center rounded-full border border-header-fg/15 bg-header-fg/10'>
                                                    <Lock size={12} className='text-header-fg/60' />
                                                </div>
                                                <span className='text-sm text-header-fg/70'>
                                                    {user.name}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side='bottom'
                                            className='border-app-border bg-surface text-app-fg/80'
                                        >
                                            <p className='text-xs'>
                                                Недостаточно прав для доступа к панели
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Button
                                    variant='ghost'
                                    size='sm'
                                    className='h-7 px-2 text-xs text-header-fg/60 hover:bg-header-fg/10 hover:text-header-fg'
                                    onClick={onLogout}
                                >
                                    Выйти
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className='flex items-center gap-2'>
                            <Button
                                variant='ghost'
                                size='sm'
                                className='text-header-fg/70 hover:bg-header-fg/10 hover:text-header-fg'
                                onClick={() => router.push('/login')}
                            >
                                Войти
                            </Button>
                            <Button
                                size='sm'
                                className='bg-header-fg font-semibold text-header hover:bg-header-fg/90'
                                onClick={() => router.push('/register')}
                            >
                                Регистрация
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function HeaderClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const time = now.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
    const date = now.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});

    return (
        <div className='hidden items-center gap-1.5 text-xs text-header-fg/50 sm:flex'>
            <span className='font-mono text-header-fg/70'>{time}</span>
            <span className='text-header-fg/30'>·</span>
            <span>{date}</span>
        </div>
    );
}
