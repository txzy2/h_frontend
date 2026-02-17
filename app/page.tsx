'use client';

import {Header} from '@/components/layout/header';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {Button} from '@/components/ui/button';

export default function Home() {
    const {isLoading} = useSession();
    const {user, clearUser, clearPermissions} = useAuthStore();
    const router = useRouter();

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearUser();
            clearPermissions();
        }
    };

    useEffect(() => {
        if (!isLoading && user) {
            router.replace('/dashboard');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            </div>
        );
    }

    if (user) return null;

    return (
        <div className='relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a0a]'>
            <Header user={user} isLoading={isLoading} onLogout={logout} />

            <div className='pointer-events-none absolute inset-0 overflow-hidden'>
                <div className='absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-amber-900/10 blur-[120px]' />
                <div className='absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-orange-900/10 blur-[120px]' />
                <div className='absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-amber-800/5 blur-[80px]' />
            </div>

            <div
                className='pointer-events-none absolute inset-0 opacity-[0.03]'
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(251,191,36,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,0.5) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }}
            />

            <main className='relative flex flex-1 flex-col'>
                <section className='flex flex-1 flex-col items-center justify-center px-4 py-24 text-center'>
                    <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-xs text-amber-400'>
                        <span className='h-1.5 w-1.5 rounded-full bg-amber-400' />
                        CRM для кальянных организаций
                    </div>

                    <h1 className='mb-6 max-w-3xl text-balance text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-7xl'>
                        Управляй{' '}
                        <span className='bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent'>
                            бронированием
                        </span>{' '}
                        без хаоса
                    </h1>

                    <p className='mb-10 max-w-xl text-balance text-lg text-zinc-400'>
                        HooBu — платформа для автоматизации бронирования столиков, управления
                        гостями и аналитики для кальянных заведений.
                    </p>

                    <div className='flex flex-wrap items-center justify-center gap-3'>
                        <Button
                            size='lg'
                            className='bg-amber-500 text-black hover:bg-amber-400 font-semibold px-8'
                            onClick={() => router.push('/login')}
                        >
                            Войти в систему
                        </Button>
                        <Button
                            size='lg'
                            variant='outline'
                            className='border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8'
                        >
                            Узнать больше
                        </Button>
                    </div>
                </section>

                <section className='relative px-4 pb-24'>
                    <div className='mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3'>
                        {FEATURES.map(f => (
                            <div
                                key={f.title}
                                className='rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm transition-colors hover:border-amber-500/30'
                            >
                                <div className='mb-3 text-2xl'>{f.icon}</div>
                                <h3 className='mb-1.5 font-semibold text-white'>{f.title}</h3>
                                <p className='text-sm text-zinc-500'>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className='relative border-t border-zinc-800/50 py-6 text-center text-xs text-zinc-600'>
                © {new Date().getFullYear()} HooBu. Все права защищены.
            </footer>
        </div>
    );
}

const FEATURES = [
    {
        icon: '📅',
        title: 'Бронирование',
        description: 'Управляйте столиками и временными слотами в реальном времени.'
    },
    {
        icon: '👥',
        title: 'Гости',
        description: 'База клиентов, история визитов и персональные предпочтения.'
    },
    {
        icon: '📊',
        title: 'Аналитика',
        description: 'Отчёты по загруженности, выручке и популярным позициям.'
    }
];
