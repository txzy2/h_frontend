'use client';

import {useSession} from '@/hooks/useSession';
import {useAuthStore} from '@/stores/auth.store';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {CalendarDays, Users, TrendingUp, Clock} from 'lucide-react';
import {isAllowed} from '@/lib/auth/roles';
import {toast} from 'sonner';
import axios from 'axios';

const STATS = [
    {icon: CalendarDays, label: 'Броней сегодня', value: '—', color: 'text-brand'},
    {icon: Users, label: 'Гостей всего', value: '—', color: 'text-orange-400'},
    {icon: TrendingUp, label: 'Загруженность', value: '—', color: 'text-yellow-400'},
    {icon: Clock, label: 'Среднее время', value: '—', color: 'text-brand'}
];

export default function Dashboard() {
    const {isLoading} = useSession();
    const {user} = useAuthStore();
    const router = useRouter();

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
                        duration: Infinity
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

    if (isLoading || !user) return null;

    return (
        <div className='p-6 lg:p-8'>
            {/* Приветствие */}
            <div className='mb-8'>
                <h1 className='text-2xl font-bold text-app-fg'>
                    Добро пожаловать, <span className='text-brand'>{user.name}</span>
                </h1>
                <p className='mt-1 text-sm text-app-subtle'>
                    Вот что происходит сегодня в вашем заведении
                </p>
            </div>

            {/* Карточки статистики */}
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                {STATS.map(stat => (
                    <Card
                        key={stat.label}
                        className='border-app-border bg-surface/60 backdrop-blur-sm'
                    >
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-xs font-medium text-app-muted'>
                                {stat.label}
                            </CardTitle>
                            <stat.icon size={16} className={stat.color} />
                        </CardHeader>
                        <CardContent>
                            <p className='text-2xl font-bold text-app-fg'>{stat.value}</p>
                            <p className='mt-1 text-xs text-app-subtle'>Данные появятся позже</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Заглушка */}
            <div className='mt-8 flex items-center justify-center rounded-xl border border-dashed border-app-border py-24'>
                <div className='text-center'>
                    <p className='text-sm font-medium text-app-muted'>Здесь будет основной контент</p>
                    <p className='mt-1 text-xs text-app-subtle'>
                        Таблица броней, календарь и управление гостями
                    </p>
                </div>
            </div>
        </div>
    );
}
