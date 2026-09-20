// app/api/auth/logout/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {resolveSession} from '@/lib/auth/session.service';
import {LogoutResponse} from '@/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
    // resolveSession при необходимости обновит access-токен,
    // чтобы удалить refresh-сессию в Redis даже после истечения access.
    const session = await resolveSession(request);

    if (session.ok) {
        try {
            await AuthService.logout(session.accessToken);
        } catch {
            // Auth-сервис недоступен — cookies всё равно чистим
        }
    }

    const response = NextResponse.json<LogoutResponse>(
        {success: true, data: 'Logged out'},
        {status: 200}
    );

    CookieService.clearAuthTokens(response);
    return response;
}
