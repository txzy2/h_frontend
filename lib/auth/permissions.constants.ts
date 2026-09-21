// lib/auth/permissions.constants.ts
//
// Имена прав из auth-сервиса (h_backend). Общие для клиента и сервера.

export const PERMISSIONS = {
    /** Изменение оформления организации: цвета интерфейса */
    ORG_APPEARANCE_EDIT: 'org.appearance.edit',
    /** Изменение логотипа организации */
    ORG_APPEARANCE_LOGO: 'org.appearance.logo',
    /** Просмотр финансовых показателей: выручка, средний чек */
    VIEW_ORG_FINANCE: 'view.org.finance',
    /** Просмотр броней организации (операционная работа) */
    VIEW_ORG_RESERVATIONS: 'view.org.reservations'
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
