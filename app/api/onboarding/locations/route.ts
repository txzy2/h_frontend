// app/api/onboarding/locations/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

import {db} from '@/lib/db-client';
import {OnboardingService} from '@/lib/services/onboarding.service';

const onboardingService = new OnboardingService(db);

interface LocationItem {
    name: string;
    address: string;
    phone?: string;
    activePlaces: number;
}

interface LocationsBody {
    draftId: string;
    locations: LocationItem[];
}

function validateLocations(body: LocationsBody): string | null {
    if (!body.draftId) return 'draftId обязателен';
    if (!Array.isArray(body.locations) || body.locations.length === 0)
        return 'Добавьте хотя бы одну точку';
    for (const loc of body.locations) {
        if (!loc.name?.trim()) return 'Введите название точки';
        if (!loc.address?.trim()) return 'Введите адрес точки';
        if (!loc.activePlaces || loc.activePlaces < 1) return 'Укажите количество мест';
    }
    return null;
}

export async function POST(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const body: LocationsBody = await request.json();

        const validationError = validateLocations(body);
        if (validationError) return errorResponse(validationError, 400);

        await onboardingService.saveLocations(body.draftId, body.locations);

        return NextResponse.json({success: true, data: 'Точки сохранены'});
    } catch {
        return errorResponse('Internal server error', 500);
    }
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}
