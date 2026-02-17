// app/api/auth/me/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService, JwtSecretError} from '@/lib/auth/jwt.service';
import {LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import {Axios, AxiosError} from 'axios';

export async function GET(
    request: NextRequest
): Promise<NextResponse<LoginSuccessResponse | LoginErrorResponse>> {
    const accessToken = CookieService.getAccessToken(request);

    if (!accessToken) {
        return errorResponse('Not authenticated', 401);
    }

    // Верифицируем токен локально (без запроса к бэкенду)
    try {
        const payload = JwtService.verify(accessToken);

        if (!payload) {
            return clearAndError('Token expired', 401);
        }
    } catch (error) {
        if (error instanceof JwtSecretError) {
            return errorResponse('Server configuration error', 503);
        }
        return clearAndError('Invalid token', 401);
    }

    // Проверяем актуальность сессии на бэкенде
    try {
        const userData = await AuthService.getMe(accessToken);

        return NextResponse.json<LoginSuccessResponse>({
            success: true,
            data: userData
        });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            if (error.statusCode === 401 || error.statusCode === 403) {
                return clearAndError('Session expired or invalid', 401);
            }

            // 429 — бэкенд заблокировал, не чистим cookies
            if (error.statusCode === 429) {
                return errorResponse('Too many requests', 429);
            }

            // 5xx — бэкенд временно недоступен, не чистим cookies
            return errorResponse('Failed to verify session', 503);
        }
        return errorResponse('Internal server error', 500);
    }

    function clearAndError(message: string, status: number): NextResponse<LoginErrorResponse> {
        const response = NextResponse.json<LoginErrorResponse>(
            {success: false, data: message},
            {status}
        );
        CookieService.clearAuthTokens(response);
        return response;
    }

    function errorResponse(message: string, status: number): NextResponse<LoginErrorResponse> {
        return NextResponse.json<LoginErrorResponse>({success: false, data: message}, {status});
    }
}
