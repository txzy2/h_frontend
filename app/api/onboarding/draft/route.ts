// app/api/onboarding/draft/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';
import {OnboardingService} from '@/lib/services/onboarding.service';
import {db} from '@/lib/db-client';

const onboardingService = new OnboardingService(db);

export async function GET(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const draft = await onboardingService.getOrCreateDraft(payload.sub);
        return NextResponse.json({success: true, data: draft});
    } catch {
        return errorResponse('Internal server error', 500);
    }
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}
