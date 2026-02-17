// app/api/auth/logout/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {LogoutResponse} from '@/types/auth';

export async function POST(request: NextRequest): Promise<NextResponse<LogoutResponse>> {
    const accessToken = CookieService.getAccessToken(request);

    // Нет токена — считаем что уже разлогинен
    if (!accessToken) {
        return createLogoutResponse(true, 'Already logged out');
    }

    try {
        await AuthService.logout(accessToken);
        return createLogoutResponse(true, 'Logged out');
    } catch (error) {
        // Даже при ошибке — чистим cookies на клиенте
        if (error instanceof AuthenticationError) {
            // 401 — сессия уже не существует, это нормально
            if (error.statusCode === 401) {
                return createLogoutResponse(true, 'Session already expired');
            }
            return createLogoutResponse(false, error.message, error.statusCode);
        }
        return createLogoutResponse(false, 'Logout failed', 500);
    }
}

function createLogoutResponse(
    success: boolean,
    message: string,
    status: number = 200
): NextResponse<LogoutResponse> {
    const response = NextResponse.json<LogoutResponse>({success, data: message}, {status});
    CookieService.clearAuthTokens(response);
    return response;
}
