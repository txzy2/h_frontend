// lib/services/permission.service.ts
//
// Серверные проверки прав через auth-сервис (h_backend).
// Используются в BFF-роутах: UI можно подделать, сервер — нет.

import axios from 'axios';
import {UserPermission} from '@/types/auth';
import {PermissionName} from '@/lib/auth/permissions.constants';

const AUTH_API_URL = process.env.AUTH_API_URL;

interface PermissionsResponse {
    success: boolean;
    data:
        | {permissions?: UserPermission[]}
        | UserPermission[]
        | null;
}

/** Права пользователя из auth-сервиса */
export async function fetchUserPermissions(accessToken: string): Promise<UserPermission[]> {
    const {data} = await axios.get<PermissionsResponse>(`${AUTH_API_URL}/user/permissions`, {
        headers: {Authorization: `Bearer ${accessToken}`}
    });

    const payload = data?.data;
    const list = Array.isArray(payload) ? payload : (payload?.permissions ?? []);

    return list.map(permission => ({
        name: permission.name,
        description: permission.description ?? null
    }));
}

/** Есть ли у пользователя конкретное право */
export async function userHasPermission(
    accessToken: string,
    permission: PermissionName
): Promise<boolean> {
    const permissions = await fetchUserPermissions(accessToken);
    return permissions.some(item => item.name === permission);
}
