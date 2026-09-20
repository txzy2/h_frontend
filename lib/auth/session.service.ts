// lib/auth/session.service.ts
//
// Единая точка работы с сессией для всех API-роутов.
//
// Схема:
//   1. access-токен жив и не истекает в ближайшую минуту → используем его;
//   2. иначе пробуем refresh-токен (с защитой от параллельных обновлений);
//   3. если refresh не прошёл — сессия недействительна.
//
// Все роуты должны использовать resolveSession() + sessionResponder(),
// чтобы обновлённые токены всегда попадали в cookies, а 401 не приходил
// из-за обычного истечения access-токена.

import {NextRequest, NextResponse} from 'next/server';
import {AuthTokens, JwtPayload} from '@/types/auth';
import {AuthService, AuthenticationError} from './auth.service';
import {CookieService} from './cookie.service';
import {JwtService} from './jwt.service';

/** За сколько секунд до истечения access-токена начинаем обновление */
const REFRESH_SKEW_SECONDS = 60;

/**
 * Сколько миллисекунд после ротации старый refresh-токен ещё принимается.
 * Нужно для запросов, которые браузер отправил со старыми cookies
 * до того, как прилетел ответ с новой парой.
 */
const ROTATION_GRACE_MS = 15_000;

export type SessionFailureReason = 'unauthenticated' | 'config-error' | 'backend-error';

export type SessionResult =
    | {
          ok: true;
          accessToken: string;
          expiresAt: number;
          payload: JwtPayload;
          /** Заполнено, только если токены были обновлены в этом запросе */
          refreshedTokens?: AuthTokens;
      }
    | {ok: false; reason: SessionFailureReason};

export type AuthenticatedSession = Extract<SessionResult, {ok: true}>;

/** Параллельные обновления с одним refresh-токеном */
const inflightRefreshes = new Map<string, Promise<AuthTokens>>();

/** Недавно ротированные refresh-токены: старый → выданные новые */
const recentRotations = new Map<string, {tokens: AuthTokens; expiresAt: number}>();

function pruneRotations(): void {
    const now = Date.now();
    for (const [token, entry] of recentRotations) {
        if (entry.expiresAt <= now) recentRotations.delete(token);
    }
}

/**
 * Обновление токенов с защитой от гонок:
 * - параллельные запросы с одним refresh-токеном ждут один запрос к auth-сервису;
 * - запросы, пришедшие со старым токеном сразу после ротации, получают ту же пару.
 */
export function refreshTokensSingleFlight(refreshToken: string): Promise<AuthTokens> {
    const inflight = inflightRefreshes.get(refreshToken);
    if (inflight) return inflight;

    pruneRotations();
    const rotated = recentRotations.get(refreshToken);
    if (rotated) return Promise.resolve(rotated.tokens);

    const flight = AuthService.refreshTokens(refreshToken)
        .then(tokens => {
            recentRotations.set(refreshToken, {
                tokens,
                expiresAt: Date.now() + ROTATION_GRACE_MS
            });
            return tokens;
        })
        .finally(() => {
            inflightRefreshes.delete(refreshToken);
        });

    inflightRefreshes.set(refreshToken, flight);
    return flight;
}

/**
 * Возвращает живую сессию для запроса: при необходимости молча обновляет токены.
 */
export async function resolveSession(request: NextRequest): Promise<SessionResult> {
    if (!JwtService.isConfigured()) {
        return {ok: false, reason: 'config-error'};
    }

    const accessToken = CookieService.getAccessToken(request);
    const refreshToken = CookieService.getRefreshToken(request);

    // 1. Текущий access-токен ещё живой и не требует обновления
    if (accessToken && !JwtService.needsRefresh(accessToken, REFRESH_SKEW_SECONDS)) {
        let payload: JwtPayload | null = null;
        try {
            payload = JwtService.verify(accessToken);
        } catch {
            // Повреждённая подпись — попробуем обновить по refresh-токену
        }
        if (payload) {
            return {ok: true, accessToken, expiresAt: payload.exp, payload};
        }
    }

    // 2. Обновляем пару по refresh-токену
    if (refreshToken) {
        try {
            const refreshedTokens = await refreshTokensSingleFlight(refreshToken);
            const payload = JwtService.decode(refreshedTokens.accessToken);

            if (payload?.exp) {
                return {
                    ok: true,
                    accessToken: refreshedTokens.accessToken,
                    expiresAt: payload.exp,
                    payload,
                    refreshedTokens
                };
            }
            return {ok: false, reason: 'backend-error'};
        } catch (error) {
            if (error instanceof AuthenticationError) {
                const unauthorized = error.statusCode === 401 || error.statusCode === 403;
                return {ok: false, reason: unauthorized ? 'unauthenticated' : 'backend-error'};
            }
            return {ok: false, reason: 'backend-error'};
        }
    }

    return {ok: false, reason: 'unauthenticated'};
}

/**
 * Создаёт функцию ответа, привязанную к сессии:
 * - при обновлении токенов — кладёт новую пару в cookies;
 * - при недействительной сессии — очищает cookies.
 */
export function sessionResponder(session: SessionResult) {
    return function respond<T>(body: T, status = 200): NextResponse<T> {
        const response = NextResponse.json<T>(body, {status});

        if (session.ok) {
            if (session.refreshedTokens) {
                CookieService.setAuthTokens(response, session.refreshedTokens);
            }
        } else if (session.reason === 'unauthenticated') {
            CookieService.clearAuthTokens(response);
        }

        return response;
    };
}

/**
 * Готовый ответ для случая, когда сессию получить не удалось.
 * Cookies не трогаем при ошибках конфигурации/бэкенда, чтобы не разлогинивать зря.
 */
export function sessionFailureResponse(
    session: Extract<SessionResult, {ok: false}>,
    message?: string
): NextResponse {
    const respond = sessionResponder(session);

    switch (session.reason) {
        case 'unauthenticated':
            return respond({success: false, data: message ?? 'Not authenticated'}, 401);
        case 'config-error':
            return respond({success: false, data: message ?? 'Server configuration error'}, 503);
        default:
            return respond({success: false, data: message ?? 'Auth service unavailable'}, 503);
    }
}

/**
 * Ответ с очисткой cookies: сессия признана недействительной уже после
 * успешного resolveSession (например, бэкенд отверг пользователя).
 */
export function sessionRevokedResponse<T>(body: T, status = 401): NextResponse<T> {
    const response = NextResponse.json<T>(body, {status});
    CookieService.clearAuthTokens(response);
    return response;
}

/**
 * Прикладывает обновлённые cookies к произвольному ответу (в том числе бинарному).
 */
export function attachSession<T extends NextResponse>(response: T, session: SessionResult): T {
    if (session.ok && session.refreshedTokens) {
        CookieService.setAuthTokens(response, session.refreshedTokens);
    }
    return response;
}
