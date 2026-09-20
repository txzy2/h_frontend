export const ALLOWED_ROLES = ['Admin', 'SuperUser', 'Manager'] as const;

export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export function isAllowed(role: string): boolean {
    return ALLOWED_ROLES.includes(role as AllowedRole);
}
