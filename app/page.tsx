'use client';

import {useAuthStore} from '@/stores/auth.store';

import {AuthState} from '@/stores/auth.store';

export default function Home() {
    const user = useAuthStore((state: AuthState) => state.user);

    return (
        <div className='flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black'>
            Main Page
            <div className='flex flex-col items-center'>
                {user ? (
                    <div className='flex flex-col items-center'>
                        <div className='flex items-center gap-1'>
                            <span>ID:</span> <span>{user.userId}</span>
                        </div>

                        <div className='flex items-center gap-1'>
                            <span>User:</span>{' '}
                            <span>
                                {user.name} ({user.role})
                            </span>
                        </div>

                        <div className='flex items-center gap-1'>
                            <span>Email:</span> <span>{user.email}</span>
                        </div>

                        <div className='flex items-center gap-1'>
                            <span>Login:</span> <span>{user.login}</span>
                        </div>
                    </div>
                ) : (
                    <div>Пользователь не авторизован</div>
                )}
            </div>
        </div>
    );
}
