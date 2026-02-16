import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {UserData} from '@/types/auth/jwt.types';
import {UserPermissionsResult} from '@/types/auth';

export type AuthState = {
    user: UserData | null;
    setUser: (user: UserData) => void;
    clearUser: () => void;
    permissions: UserPermissionsResult[];
    setPermissions: (permissions: UserPermissionsResult[]) => void;
    clearPermissions: () => void;
};

// Здесь добавляем типизацию для set
export const useAuthStore = create<AuthState>()(
    persist<AuthState>(
        set => ({
            user: null,
            permissions: [],
            setUser: (user: UserData) => set({user}),
            clearUser: () => set({user: null}),
            setPermissions: (permissions: UserPermissionsResult[]) => set({permissions}),
            clearPermissions: () => set({permissions: []})
        }),
        {
            name: 'auth-storage'
        }
    )
);
