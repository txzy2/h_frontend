'use client';

import {Button} from '@/components/ui/button';
import {Skeleton} from '@/components/ui/skeleton';
import {UserMenu} from '@/components/layout/user-menu';
import {UserData} from '@/types/auth/jwt.types';
import {useRouter} from 'next/navigation';

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
                <span className='text-lg font-bold tracking-tight'>HooBu </span>
                {/* Правая часть */}
                <div className='flex items-center'>
                    {isLoading ? (
                        <div className='flex items-center gap-2.5 px-2 py-1.5'>
                            <Skeleton className='h-8 w-8 rounded-full' />
                            <Skeleton className='h-4 w-20' />
                        </div>
                    ) : user ? (
                        <UserMenu user={user} onLogout={onLogout} />
                    ) : (
                        <Button variant='ghost' size='sm' onClick={() => router.push('/login')}>
                            Войти
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
