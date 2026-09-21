'use client';

import {Sidebar, MobileNav} from '@/components/layout/sidebar';
import {QuickBookingButton} from '@/components/dashboard/quick-booking-button';
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
            <div className='flex min-h-dvh items-center justify-center bg-app'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent' />
            </div>
        );
    }

    return (
        <div className='flex h-dvh overflow-hidden bg-app p-0 lg:p-3'>
            <Sidebar user={user} onLogout={logout} />

            <div className='flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-app lg:ml-3 lg:rounded-xl'>
                <MobileNav user={user} onLogout={logout} />
                <main className='flex-1 overflow-auto pb-20 lg:pb-0'>{children}</main>
            </div>

            {/* Быстрое создание брони — только Manager / Admin / SuperUser */}
            <QuickBookingButton />
        </div>
    );
}
