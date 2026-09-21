// app/api/onboarding/draft/route.ts
import {NextRequest} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';
import {OnboardingService} from '@/lib/services/onboarding.service';
import {db} from '@/lib/db-client';

const onboardingService = new OnboardingService(db);

export async function GET(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        // create=false — только читаем текущий черновик, не создаём новый
        const createNew = request.nextUrl.searchParams.get('create') !== 'false';

        const draft = createNew
            ? await onboardingService.getOrCreateDraft(session.payload.sub)
            : await onboardingService.getCurrentDraft(session.payload.sub);

        return respond({success: true, data: draft});
    } catch (err) {
        console.error(err);
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
