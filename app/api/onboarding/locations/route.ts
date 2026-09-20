// app/api/onboarding/locations/route.ts
import {NextRequest} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';

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
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        const body: LocationsBody = await request.json();

        const validationError = validateLocations(body);
        if (validationError) return respond({success: false, data: validationError}, 400);

        await onboardingService.saveLocations(body.draftId, body.locations);

        return respond({success: true, data: 'Точки сохранены'});
    } catch {
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
