// app/api/onboarding/organization/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

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

// app/api/onboarding/organization/route.ts
export async function POST(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const body: OrgBody = await request.json();
        console.log('organization body:', body); // ← добавь это

        const validationError = validateOrg(body);
        if (validationError) return errorResponse(validationError, 400);

        await onboardingService.saveOrganization(body.draftId, {
            name: body.name,
            inn: body.inn,
            kpp: body.kpp,
            director: body.director,
            phoneNumber: body.phoneNumber,
            plan: body.plan
        });

        return NextResponse.json({success: true, data: 'Организация сохранена'});
    } catch (e) {
        console.error('organization error:', e); // ← и это
        return errorResponse('Internal server error', 500);
    }
}
function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}
