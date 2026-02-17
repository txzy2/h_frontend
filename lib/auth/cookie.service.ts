// lib/auth/cookie.service.ts
import {NextResponse} from 'next/server';
import {AuthTokens} from '@/types/auth';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/'
};

const TOKEN_MAX_AGE = {
    ACCESS: 60 * 15, // 15 минут
    REFRESH: 60 * 60 * 24 * 7 // 7 дней
} as const;

const COOKIE_NAMES = {
    ACCESS: 'access_token',
    REFRESH: 'refresh_token'
} as const;

export class CookieService {
    static getAccessToken<
        T extends {cookies: {get: (name: string) => {value: string} | undefined}}
    >(request: T): string | undefined {
        return request.cookies.get(COOKIE_NAMES.ACCESS)?.value;
    }

    static getRefreshToken<
        T extends {cookies: {get: (name: string) => {value: string} | undefined}}
    >(request: T): string | undefined {
        return request.cookies.get(COOKIE_NAMES.REFRESH)?.value;
    }

    static setAuthTokens(response: NextResponse, tokens: AuthTokens): void {
        response.cookies.set(COOKIE_NAMES.ACCESS, tokens.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: TOKEN_MAX_AGE.ACCESS
        });

        response.cookies.set(COOKIE_NAMES.REFRESH, tokens.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: TOKEN_MAX_AGE.REFRESH
        });
    }

    static clearAuthTokens(response: NextResponse): void {
        response.cookies.delete(COOKIE_NAMES.ACCESS);
        response.cookies.delete(COOKIE_NAMES.REFRESH);
    }
}
