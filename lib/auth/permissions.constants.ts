// lib/auth/permissions.constants.ts
//
// Имена прав из auth-сервиса (h_backend). Общие для клиента и сервера.

export const PERMISSIONS = {
    /** Изменение оформления организации: цвета, логотип, тема по умолчанию */
    ORG_APPEARANCE_EDIT: 'org.appearance.edit'
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Проверка права по списку прав пользователя (для UI).
 * Безопасность обеспечивается серверной проверкой, это только отображение.
 */
export function hasPermission(
    permissions: {name: string}[] | null | undefined,
    permission: PermissionName
): boolean {
    return Boolean(permissions?.some(item => item.name === permission));
}
