// app/api/auth/me/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {SessionResponse, SessionSuccessResponse} from '@/types/auth';

export async function GET(request: NextRequest): Promise<NextResponse<SessionResponse>> {
    const session = await resolveSession(request);

    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<SessionResponse>;
    }

    // Ответ уже умеет прикладывать обновлённые cookies
    const respond = sessionResponder(session);

    try {
        const userData = await AuthService.getMe(session.accessToken);

        return respond<SessionSuccessResponse>({
            success: true,
            data: userData,
            expiresAt: session.expiresAt
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                // Бэкенд явно отверг сессию — чистим cookies
                return sessionRevokedResponse<SessionResponse>({
                    success: false,
                    data: 'Session expired or invalid'
                });
            }

            // 429 — бэкенд заблокировал, не чистим cookies
            if (error.statusCode === 429) {
                return respond<SessionResponse>({success: false, data: 'Too many requests'}, 429);
            }

            // 5xx — бэкенд временно недоступен, не чистим cookies
            return respond<SessionResponse>(
                {success: false, data: 'Failed to verify session'},
                503
            );
        }

        return respond<SessionResponse>({success: false, data: 'Internal server error'}, 500);
    }
}
