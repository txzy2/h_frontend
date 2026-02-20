'use client';

import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {UserMenu} from '@/components/layout/user-menu';
import {UserData} from '@/types/auth/jwt.types';
import {useRouter} from 'next/navigation';
import {Lock} from 'lucide-react';
import {isAllowed} from '@/lib/auth/roles';
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from '@/components/ui/tooltip';

interface HeaderProps {
    user: UserData | null;
    isLoading: boolean;
    onLogout: () => void;
}

export function Header({user, isLoading, onLogout}: HeaderProps) {
    const router = useRouter();

    return (
        <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4'>
                {/* Лого */}
                {/* TODO: добавить далее название организаций */}
                <Button
                    variant={'link'}
                    className='text-lg font-bold tracking-tight m-0 p-0 transition-all hover:scale-105'
                    onClick={() => router.push('/')}
                >
                    HooBu
                </Button>

                {/* Правая часть */}
                <div className='flex items-center'>
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
                                            <div className='flex items-center gap-1.5 cursor-default'>
                                                <div className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700'>
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
                                    className='h-7 px-2 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800'
                                    onClick={onLogout}
                                >
                                    Выйти
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className='flex items-center gap-2'>
                            <Button variant='ghost' size='sm' onClick={() => router.push('/login')}>
                                Войти
                            </Button>
                            <Button
                                size='sm'
                                className='bg-amber-500 text-black hover:bg-amber-400 font-semibold'
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
