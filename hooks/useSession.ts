// hooks/useSession.ts
import {useAuthStore} from '@/stores/auth.store';
import {LoginSuccessResponse, UserPermission} from '@/types/auth';
import {useCallback, useEffect, useRef, useState} from 'react';

async function silentFetch<T>(url: string, init?: RequestInit): Promise<T | null> {
    try {
        const res = await fetch(url, {...init, credentials: 'same-origin'});
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function fetchMe(): Promise<LoginSuccessResponse | null> {
    return silentFetch<LoginSuccessResponse>('/api/auth/me');
}

async function fetchPermissions(): Promise<UserPermission[]> {
    const data = await silentFetch<{success: boolean; data: UserPermission[]}>('/api/users/permissions');
    if (!data?.success || !Array.isArray(data.data)) return [];
    return data.data.map(p => ({name: p.name, description: p.description ?? null}));
}

async function tryRefresh(): Promise<boolean> {
    const data = await silentFetch<{success: boolean}>('/api/auth/refresh', {method: 'POST'});
    return data?.success === true;
}

export function useSession() {
    const {setUser, clearUser, setPermissions, clearPermissions} = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
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
            if (isMounted.current) setPermissions(permissions);
        },
        [setUser, setPermissions]
    );

    const checkSession = useCallback(async () => {
        if (isChecking.current) return;
        isChecking.current = true;
        setIsLoading(true);

        try {
            const cachedUser = useAuthStore.getState().user;

            if (!cachedUser) {
                const refreshed = await tryRefresh();
                if (!refreshed) return;
            }

            const me = await fetchMe();
            if (!isMounted.current) return;

            if (me?.success) {
                await loadSession(me.data);
            } else {
                clearSession();
            }
        } catch {
            if (isMounted.current) clearSession();
        } finally {
            if (isMounted.current) setIsLoading(false);
            isChecking.current = false;
        }
    }, [loadSession, clearSession]);

    useEffect(() => {
        isMounted.current = true;
        checkSession();
        return () => {
            isMounted.current = false;
        };
    }, []);

    return {isLoading};
}
