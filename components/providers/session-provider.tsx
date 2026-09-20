'use client';

import {useAuthStore} from '@/stores/auth.store';
import {RefreshResponse, SessionResponse, UserData, UserPermission} from '@/types/auth';
import {createContext, ReactNode, useEffect, useRef, useState} from 'react';

/** За сколько миллисекунд до истечения access-токена обновляем его */
const REFRESH_AHEAD_MS = 60_000;

/** Минимальная задержка перед обновлением (страховка от рассинхрона часов) */
const MIN_REFRESH_DELAY_MS = 5_000;

/** Страховочная проверка для вкладок, где таймеры тормозятся браузером */
const CHECK_INTERVAL_MS = 60_000;

/** Если бэкенд не вернул expiresAt — считаем, что access живёт 15 минут */
const FALLBACK_ACCESS_TTL_SECONDS = 15 * 60;

export type SessionContextValue = {
    isLoading: boolean;
    /** Принудительно обновить токены. true — если сессия жива */
    refreshSession: () => Promise<boolean>;
    /** Вызывается после логина: сохраняет пользователя и планирует обновление */
    startSession: (user: UserData, expiresAt?: number) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);

type JsonResult<T> = {status: number; body: T | null};

async function requestJson<T>(url: string, init?: RequestInit): Promise<JsonResult<T>> {
    try {
        const response = await fetch(url, {...init, credentials: 'same-origin'});

        let body: T | null = null;
        try {
            body = (await response.json()) as T;
        } catch {
            body = null;
        }

        return {status: response.status, body};
    } catch {
        // Сеть недоступна — не считаем это разлогином
        return {status: 0, body: null};
    }
}

async function fetchPermissions(): Promise<UserPermission[]> {
    const {body} = await requestJson<{success: boolean; data: UserPermission[]}>(
        '/api/users/permissions'
    );

    if (!body?.success || !Array.isArray(body.data)) return [];

    return body.data.map(permission => ({
        name: permission.name,
        description: permission.description ?? null
    }));
}

export function SessionProvider({children}: {children: ReactNode}) {
    const setUser = useAuthStore(state => state.setUser);
    const clearUser = useAuthStore(state => state.clearUser);
    const setPermissions = useAuthStore(state => state.setPermissions);
    const clearPermissions = useAuthStore(state => state.clearPermissions);
    const user = useAuthStore(state => state.user);

    const [isLoading, setIsLoading] = useState(true);

    const isMountedRef = useRef(true);
    const isCheckingRef = useRef(false);
    const isLoadingSessionRef = useRef(false);
    const expiresAtRef = useRef<number | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

    function clearRefreshTimer() {
        if (refreshTimerRef.current) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }

    function endSession() {
        clearRefreshTimer();
        expiresAtRef.current = null;
        clearUser();
        clearPermissions();
    }

    function scheduleRefresh(expiresAt: number) {
        clearRefreshTimer();
        expiresAtRef.current = expiresAt;

        const delay = Math.max(
            expiresAt * 1000 - Date.now() - REFRESH_AHEAD_MS,
            MIN_REFRESH_DELAY_MS
        );

        refreshTimerRef.current = setTimeout(() => {
            void refreshSession();
        }, delay);
    }

    /** Обновление токенов; параллельные вызовы разделяют один запрос */
    async function refreshSession(): Promise<boolean> {
        if (refreshPromiseRef.current) return refreshPromiseRef.current;

        // После логаута ничего не обновляем
        if (!useAuthStore.getState().user) return false;

        const promise = (async () => {
            const {status, body} = await requestJson<RefreshResponse>('/api/auth/refresh', {
                method: 'POST'
            });

            if (status === 200 && body?.success) {
                scheduleRefresh(
                    body.expiresAt ??
                        Math.floor(Date.now() / 1000) + FALLBACK_ACCESS_TTL_SECONDS
                );
                return true;
            }

            // Сессия действительно закончилась — выходим
            if (status === 401 || status === 403) {
                endSession();
            }

            // 5xx/сеть — оставляем как есть, повторим позже
            return false;
        })().finally(() => {
            refreshPromiseRef.current = null;
        });

        refreshPromiseRef.current = promise;
        return promise;
    }

    async function loadSession(userData: UserData) {
        isLoadingSessionRef.current = true;
        try {
            setUser(userData);
            const permissions = await fetchPermissions();
            if (isMountedRef.current) setPermissions(permissions);
        } finally {
            isLoadingSessionRef.current = false;
        }
    }

    async function checkSession(options?: {silent?: boolean}) {
        if (isCheckingRef.current) return;
        isCheckingRef.current = true;

        const silent = options?.silent ?? false;
        if (!silent) setIsLoading(true);

        try {
            const {status, body} = await requestJson<SessionResponse>('/api/auth/me');

            if (!isMountedRef.current) return;

            if (status === 200 && body?.success) {
                await loadSession(body.data);
                scheduleRefresh(body.expiresAt);
            } else if (status === 401 || status === 403) {
                endSession();
            }
            // 5xx/сеть — не разлогиниваем, повторим позже
        } finally {
            if (isMountedRef.current && !silent) setIsLoading(false);
            isCheckingRef.current = false;
        }
    }

    /** Обновляем, если access истёк или истекает */
    async function ensureFresh() {
        if (!useAuthStore.getState().user) return;

        const expiresAt = expiresAtRef.current;

        // Срок неизвестен (например, /me не ответил при старте) — тихо перепроверяем
        if (!expiresAt) {
            await checkSession({silent: true});
            return;
        }

        if (Date.now() < expiresAt * 1000 - REFRESH_AHEAD_MS) return;

        await refreshSession();
    }

    function startSession(userData: UserData, expiresAt?: number) {
        clearPermissions();
        setUser(userData);

        scheduleRefresh(
            expiresAt ?? Math.floor(Date.now() / 1000) + FALLBACK_ACCESS_TTL_SECONDS
        );
    }

    // Первичная проверка сессии + страховки на возврат к вкладке
    useEffect(() => {
        isMountedRef.current = true;
        void checkSession();

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') void ensureFresh();
        };

        const interval = setInterval(() => void ensureFresh(), CHECK_INTERVAL_MS);

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            isMountedRef.current = false;
            document.removeEventListener('visibilitychange', onVisibilityChange);
            clearInterval(interval);
            clearRefreshTimer();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Подтягиваем права после логина и снимаем таймер после логаута
    useEffect(() => {
        if (!user) {
            clearRefreshTimer();
            expiresAtRef.current = null;
            return;
        }

        // loadSession сам загрузит права — не дублируем запрос
        if (isLoadingSessionRef.current) return;

        if (useAuthStore.getState().permissions.length === 0) {
            void fetchPermissions().then(permissions => {
                if (permissions.length) setPermissions(permissions);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <SessionContext.Provider value={{isLoading, refreshSession, startSession}}>
            {children}
        </SessionContext.Provider>
    );
}
