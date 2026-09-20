// app/api/auth/refresh/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';
import {refreshTokensSingleFlight} from '@/lib/auth/session.service';
import {RefreshResponse} from '@/types/auth';

const ACCESS_TOKEN_FALLBACK_TTL_SECONDS = 15 * 60;

export async function POST(request: NextRequest): Promise<NextResponse<RefreshResponse>> {
    const refreshToken = CookieService.getRefreshToken(request);

    if (!refreshToken) {
        return createFailedResponse('No refresh token', 401);
    }

    try {
        // Single-flight: параллельные обновления не «съедают» друг другу ротацию
        const tokens = await refreshTokensSingleFlight(refreshToken);

        const expiresAt =
            JwtService.getExpiresAt(tokens.accessToken) ??
            Math.floor(Date.now() / 1000) + ACCESS_TOKEN_FALLBACK_TTL_SECONDS;

        const response = NextResponse.json<RefreshResponse>(
            {success: true, data: 'Tokens refreshed', expiresAt},
            {status: 200}
        );

        CookieService.setAuthTokens(response, tokens);
        return response;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            // 401/403 — refresh-токен мёртв, сессия действительно закончилась
            if (error.statusCode === 401 || error.statusCode === 403) {
                return createFailedResponse(error.message, 401);
            }

            // Ошибка auth-сервиса: cookies не трогаем, клиент повторит позже
            return createFailedResponse(error.message, error.statusCode, false);
        }

        return createFailedResponse('Refresh failed', 500, false);
    }
}

function createFailedResponse(
    message: string,
    status: number,
    clearCookies = true
): NextResponse<RefreshResponse> {
    const response = NextResponse.json<RefreshResponse>(
        {success: false, data: message},
        {status}
    );

    if (clearCookies) {
        CookieService.clearAuthTokens(response);
    }

    return response;
}
