// app/api/onboarding/organization/route.ts
import {NextRequest} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';

import {db} from '@/lib/db-client';
import {OnboardingService} from '@/lib/services/onboarding.service';

const onboardingService = new OnboardingService(db);

interface OrgBody {
    draftId: string;
    name: string;
    inn: string;
    kpp: string;
    director: string;
    phoneNumber: string;
    plan: string;
}

function validateOrg(body: OrgBody): string | null {
    if (!body.draftId) return 'draftId обязателен';
    if (!body.name?.trim()) return 'Введите название организации';
    if (!body.inn?.trim()) return 'Введите ИНН';
    if (!/^\d{10}(\d{2})?$/.test(body.inn)) return 'ИНН должен содержать 10 или 12 цифр';
    if (!body.kpp?.trim()) return 'Введите КПП';
    if (!/^\d{9}$/.test(body.kpp)) return 'КПП должен содержать 9 цифр';
    if (!body.director?.trim()) return 'Введите ФИО директора';
    if (!body.phoneNumber?.trim()) return 'Введите номер телефона';
    if (!body.plan?.trim()) return 'Выберите тарифный план';
    return null;
}

export async function POST(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        const body: OrgBody = await request.json();

        const validationError = validateOrg(body);
        if (validationError) return respond({success: false, data: validationError}, 400);

        await onboardingService.saveOrganization(body.draftId, {
            name: body.name,
            inn: body.inn,
            kpp: body.kpp,
            director: body.director,
            phoneNumber: body.phoneNumber,
            plan: body.plan
        });

        return respond({success: true, data: 'Организация сохранена'});
    } catch (e) {
        console.error('organization error:', e);
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
