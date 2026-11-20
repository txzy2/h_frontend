// lib/org/status.ts
//
// Хелперы для цветов статусов. Сами цвета задаются CSS-переменными
// --status-* в BrandingProvider и могут быть изменены организацией.

export type BookingStatusKey = 'expected' | 'seated' | 'completed' | 'cancelled';

export function statusColorVar(key: BookingStatusKey): string {
    return `var(--status-${key})`;
}

export function statusBadgeStyle(key: BookingStatusKey) {
    const color = statusColorVar(key);

    return {
        color,
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`
    };
}

export function statusButtonStyle(key: BookingStatusKey) {
    const color = statusColorVar(key);

    return {
        color,
        backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${color} 30%, transparent)`
    };
}

export function statusBarStyle(key: BookingStatusKey) {
    return {backgroundColor: statusColorVar(key)};
}

export function bookingStatusKeyFromLabel(label: string): BookingStatusKey {
    if (label === 'Завершена') return 'completed';
    if (label === 'Отменена') return 'cancelled';
    if (label === 'За столом') return 'seated';

    return 'expected';
}

export function bookingStatusKey(
    status: string,
    seatedAt?: string | null,
    completedAt?: string | null
): BookingStatusKey {
    if (status === 'Completed') return 'completed';
    if (status === 'Cancelled') return 'cancelled';
    if (seatedAt && !completedAt) return 'seated';

    return 'expected';
}
