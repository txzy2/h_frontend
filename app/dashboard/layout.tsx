'use client';

import {Sidebar, MobileNav} from '@/components/layout/sidebar';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';

export default function DashboardLayout({children}: {children: React.ReactNode}) {
    const {isLoading} = useSession();
    const {user, clearUser, clearPermissions} = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (!user) router.replace('/login');
    }, [isLoading, user, router]);

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearUser();
            clearPermissions();
            router.replace('/');
        }
    };

    if (isLoading || !user) {
        return (
            <div className='flex min-h-dvh items-center justify-center bg-[#09090b]'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            </div>
        );
    }

    return (
        <div className='flex min-h-dvh bg-[#09090b] p-0 lg:p-3'>
            <Sidebar user={user} onLogout={logout} />

            <div className='flex min-w-0 flex-1 flex-col overflow-hidden bg-[#09090b] lg:ml-3 lg:rounded-xl'>
                <MobileNav user={user} onLogout={logout} />
                <main className='flex-1 overflow-auto pb-20 lg:pb-0'>{children}</main>
            </div>
        </div>
    );
}
