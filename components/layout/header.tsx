'use client';

import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {UserMenu} from '@/components/layout/user-menu';
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

    return (
        <header className='sticky top-0 z-50 w-full border-b border-white/[0.06] bg-[#09090b]/70 backdrop-blur-xl'>
            <div className='mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4'>
                {/* Лого */}
                <Button
                    variant='link'
                    className='m-0 p-0 text-lg font-bold tracking-tight text-white transition-all hover:scale-105'
                    onClick={() => router.push('/')}
                >
                    HooBu
                </Button>

                {/* Правая часть */}
                <div className='flex items-center gap-4'>
                    {user && <HeaderClock />}

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
                                                <div className='flex h-7 w-7 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800'>
                                                    <Lock size={12} className='text-zinc-500' />
                                                </div>
                                                <span className='text-sm text-zinc-400'>
                                                    {user.name}
                                                </span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent
                                            side='bottom'
                                            className='border-zinc-700 bg-zinc-900 text-zinc-300'
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
                                    className='h-7 px-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-white'
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
                                className='text-zinc-400 hover:text-white'
                                onClick={() => router.push('/login')}
                            >
                                Войти
                            </Button>
                            <Button
                                size='sm'
                                className='bg-white font-semibold text-black hover:bg-zinc-200'
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
        <div className='hidden items-center gap-1.5 text-xs text-zinc-500 sm:flex'>
            <span className='font-mono text-zinc-400'>{time}</span>
            <span className='text-zinc-700'>·</span>
            <span>{date}</span>
        </div>
    );
}
