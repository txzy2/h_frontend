// app/api/onboarding/submit/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

import {db} from '@/lib/db-client';
import {OnboardingService} from '@/lib/services/onboarding.service';

const onboardingService = new OnboardingService(db);
const MAIN_API_URL = process.env.MAIN_API_URL;

export async function POST(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const body = await request.json();
        const draft = await onboardingService.getOrCreateDraft(payload.sub);

        // Проверяем полноту черновика
        if (!draft.organization) return errorResponse('Данные организации не заполнены', 400);
        if (!draft.locations.length) return errorResponse('Добавьте хотя бы одну точку', 400);
        if (draft.currentStep < 3) return errorResponse('Не все шаги завершены', 400);

        // Отправляем в основной API
        const {data} = await axios.post(
            `${MAIN_API_URL}/orgs/register`,
            {
                name: draft.organization.name,
                inn: draft.organization.inn,
                kpp: draft.organization.kpp,
                director: draft.organization.director,
                phone_number: draft.organization.phoneNumber,
                plan: draft.organization.plan
            },
            {headers: {Authorization: `Bearer ${accessToken}`}}
        );

        if (!data.success) {
            await onboardingService.markFailed(draft.id);
            return errorResponse(data.message ?? 'Ошибка создания организации', 400);
        }

        await onboardingService.markCompleted(draft.id, data.data.id);

        return NextResponse.json({success: true, data: 'Организация зарегистрирована'});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log(error.response);
            const status = error.response?.status ?? 500;
            const message = error.response?.data?.message ?? 'Ошибка запроса к сервису';
            return errorResponse(message, status);
        }
        return errorResponse('Internal server error', 500);
    }
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}
