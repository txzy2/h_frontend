'use client';

import {AdminDashboard} from '@/components/dashboard/admin-dashboard';
import {ManagerDashboard} from '@/components/dashboard/manager-dashboard';
import {useSession} from '@/hooks/useSession';
import {hasPermission, PERMISSIONS} from '@/lib/auth/permissions.constants';
import {isAllowed} from '@/lib/auth/roles';
import {useAuthStore} from '@/stores/auth.store';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {toast} from 'sonner';
import axios from 'axios';

export default function Dashboard() {
    const {isLoading} = useSession();
    const {user} = useAuthStore();
    const permissions = useAuthStore(state => state.permissions);
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        if (user && !isAllowed(user.role)) {
            router.replace('/forbidden');
        }
    }, [isLoading, user, router]);

    // Проверка незавершённого онбординга — только для администраторов
    useEffect(() => {
        if (isLoading || !user) return;
        if (user.role !== 'Admin' && user.role !== 'SuperUser') return;

        const checkDraft = async () => {
            try {
                // create=false — не создаём черновик тем, кто онбординг не проходил
                const {data} = await axios.get('/api/onboarding/draft', {
                    params: {create: false}
                });
                if (!data.success) return;

                const draft = data.data;
                if (!draft || draft.status === 'COMPLETED') return;

                const step = draft.currentStep;

                if (step === 1 || !draft.organization) {
                    toast('Организация не настроена', {
                        id: 'onboarding-organization',
                        description: 'Заполните данные организации чтобы начать работу',
                        action: {
                            label: 'Заполнить',
                            onClick: () => router.push('/onboarding')
                        },
                        duration: Infinity
                    });
                } else if (step === 2 || !draft.locations?.length) {
                    toast('Осталось добавить точки', {
                        id: 'onboarding-locations',
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

    // Финансовые показатели видят только пользователи с правом view.org.finance
    // (по умолчанию — SuperUser и Admin). Остальным — операционный дашборд смены.
    const canViewFinance = hasPermission(permissions, PERMISSIONS.VIEW_ORG_FINANCE);

    return canViewFinance ? <AdminDashboard user={user} /> : <ManagerDashboard user={user} />;
}
