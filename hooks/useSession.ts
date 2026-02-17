// hooks/useSession.ts
import {useAuthStore} from '@/stores/auth.store';
import {LoginSuccessResponse, PermissionsData, UserPermission} from '@/types/auth';
import axios from 'axios';
import {useCallback, useEffect, useRef, useState} from 'react';

async function fetchMe(): Promise<LoginSuccessResponse> {
    const {data} = await axios.get<LoginSuccessResponse>('/api/auth/me');
    return data;
}

async function fetchPermissions(): Promise<UserPermission[]> {
    try {
        const {data} = await axios.get<PermissionsData>('/api/users/permissions');
        if (!data.success || !Array.isArray(data.data)) return [];

        return data.data.map(p => ({
            name: p.name,
            description: p.description ?? null
        }));
    } catch {
        return [];
    }
}

async function tryRefresh(): Promise<boolean> {
    try {
        await axios.post('/api/auth/refresh');
        return true;
    } catch {
        return false;
    }
}

export function useSession() {
    const {setUser, clearUser, setPermissions, clearPermissions} = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);

    // Защита от повторных вызовов и размонтирования
    const isMounted = useRef(true);
    const isChecking = useRef(false);

    const clearSession = useCallback(() => {
        clearUser();
        clearPermissions();
    }, [clearUser, clearPermissions]);

    const loadSession = useCallback(
        async (userData: LoginSuccessResponse['data']) => {
            setUser(userData);
            const permissions = await fetchPermissions();
            if (isMounted.current) {
                setPermissions(permissions);
            }
        },
        [setUser, setPermissions]
    );

    const refreshAndReload = useCallback(async (): Promise<boolean> => {
        const refreshed = await tryRefresh();
        if (!refreshed) return false;

        try {
            const me = await fetchMe();
            if (me.success && isMounted.current) {
                await loadSession(me.data);
                return true;
            }
        } catch {
            // refresh прошёл, но /me упал
        }
        return false;
    }, [loadSession]);

    const checkSession = useCallback(async () => {
        // Защита от параллельных вызовов
        if (isChecking.current) return;
        isChecking.current = true;

        setIsLoading(true);

        try {
            const me = await fetchMe();

            if (!isMounted.current) return;

            if (me.success) {
                await loadSession(me.data);
            } else {
                clearSession();
            }
        } catch (error) {
            if (!isMounted.current) return;

            const status = axios.isAxiosError(error) ? error.response?.status : undefined;

            if (status === 401) {
                if (!(await refreshAndReload())) clearSession();
                return;
            }

            if (status === 503 || status === 504) {
                const hasCachedUser = !!useAuthStore.getState().user;
                if (hasCachedUser) {
                    const permissions = await fetchPermissions();
                    if (isMounted.current) setPermissions(permissions);
                } else {
                    if (!(await refreshAndReload())) clearSession();
                }
                return;
            }

            clearSession();
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
            isChecking.current = false;
        }
    }, [loadSession, clearSession, refreshAndReload, setPermissions]);

    useEffect(() => {
        isMounted.current = true;
        checkSession();

        return () => {
            isMounted.current = false;
        };
    }, []); // ← пустой массив! checkSession не должен быть в зависимостях

    return {isLoading};
}
