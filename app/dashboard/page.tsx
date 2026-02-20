'use client';

import {Header} from '@/components/layout/header';
import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import axios from 'axios';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CalendarDays, Users, TrendingUp, Clock} from 'lucide-react';
import {isAllowed} from '@/lib/auth/roles';
import {toast} from 'sonner';

const STATS = [
    {icon: CalendarDays, label: 'Броней сегодня', value: '—', color: 'text-amber-400'},
    {icon: Users, label: 'Гостей всего', value: '—', color: 'text-orange-400'},
    {icon: TrendingUp, label: 'Загруженность', value: '—', color: 'text-yellow-400'},
    {icon: Clock, label: 'Среднее время', value: '—', color: 'text-amber-300'}
];

export default function Dashboard() {
    const {isLoading} = useSession();
    const {user, clearUser, clearPermissions} = useAuthStore();
    const router = useRouter();

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } finally {
            clearUser();
            clearPermissions();
            router.replace('/');
        }
    };

    useEffect(() => {
        if (isLoading) return;
        if (user && !isAllowed(user.role)) {
            router.replace('/forbidden');
        }
    }, [isLoading, user, router]);

    useEffect(() => {
        if (isLoading || !user) return;

        const checkDraft = async () => {
            try {
                const {data} = await axios.get('/api/onboarding/draft');
                if (!data.success) return;

                const draft = data.data;
                if (draft.status === 'COMPLETED') return;

                const step = draft.currentStep;

                if (step === 1 || !draft.organization) {
                    toast('Организация не настроена', {
                        description: 'Заполните данные организации чтобы начать работу',
                        action: {
                            label: 'Заполнить',
                            onClick: () => router.push('/onboarding')
                        },
                        duration: Infinity // не скрывать пока не кликнут
                    });
                } else if (step === 2 || !draft.locations?.length) {
                    toast('Осталось добавить точки', {
                        description: 'Вы заполнили организацию — добавьте точки продаж',
                        action: {
                            label: 'Добавить точки',
                            onClick: () => router.push('/onboarding')
                        },
                        duration: Infinity
                    });
                }
            } catch {
                // ignore
            }
        };

        checkDraft();
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <div className='flex min-h-screen items-center justify-center bg-[#0a0a0a]'>
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent' />
            </div>
        );
    }

    return (
        <div className='flex min-h-screen flex-col bg-[#0a0a0a]'>
            <Header user={user} isLoading={isLoading} onLogout={logout} />

            <main className='mx-auto w-full max-w-screen-xl flex-1 px-4 py-8'>
                {/* Приветствие */}
                <div className='mb-8'>
                    <h1 className='text-2xl font-bold text-white'>
                        Добро пожаловать, <span className='text-amber-400'>{user.name}</span> 👋
                    </h1>
                    <p className='mt-1 text-sm text-zinc-500'>
                        Вот что происходит сегодня в вашем заведении
                    </p>
                </div>

                {/* Карточки статистики */}
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    {STATS.map(stat => (
                        <Card
                            key={stat.label}
                            className='border-zinc-800 bg-zinc-900/60 backdrop-blur-sm'
                        >
                            <CardHeader className='flex flex-row items-center justify-between pb-2'>
                                <CardTitle className='text-xs font-medium text-zinc-400'>
                                    {stat.label}
                                </CardTitle>
                                <stat.icon size={16} className={stat.color} />
                            </CardHeader>
                            <CardContent>
                                <p className='text-2xl font-bold text-white'>{stat.value}</p>
                                <p className='mt-1 text-xs text-zinc-600'>Данные появятся позже</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Заглушка основного контента */}
                <div className='mt-8 flex items-center justify-center rounded-xl border border-dashed border-zinc-800 py-24'>
                    <div className='text-center'>
                        <p className='text-3xl'>🪄</p>
                        <p className='mt-3 text-sm font-medium text-zinc-400'>
                            Здесь будет основной контент
                        </p>
                        <p className='mt-1 text-xs text-zinc-600'>
                            Таблица броней, календарь и управление гостями
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
