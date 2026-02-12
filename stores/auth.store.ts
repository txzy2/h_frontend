import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {UserData} from '@/types/auth/jwt.types';

export type AuthState = {
    user: UserData | null;
    setUser: (user: UserData) => void;
    clearUser: () => void;
};

// Здесь добавляем типизацию для set
export const useAuthStore = create<AuthState>()(
    persist<AuthState>(
        set => ({
            user: null,
            setUser: (user: UserData) => set({user}),
            clearUser: () => set({user: null})
        }),
        {
            name: 'auth-storage'
        }
    )
);
