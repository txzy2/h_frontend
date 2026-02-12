// lib/auth/cookie.service.ts
import {NextResponse} from 'next/server';
import {AuthTokens} from '@/types/auth';

export class CookieService {
    private static readonly ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 минут
    private static readonly REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

    /**
     * Устанавливает токены в httpOnly cookies
     */
    static setAuthTokens(response: NextResponse, tokens: AuthTokens): void {
        const isProduction = process.env.NODE_ENV === 'production';

        response.cookies.set('access_token', tokens.accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: this.ACCESS_TOKEN_MAX_AGE,
            path: '/'
        });

        response.cookies.set('refresh_token', tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: this.REFRESH_TOKEN_MAX_AGE,
            path: '/'
        });
    }

    /**
     * Удаляет токены из cookies
     */
    static clearAuthTokens(response: NextResponse): void {
        response.cookies.delete('access_token');
        response.cookies.delete('refresh_token');
    }
}
