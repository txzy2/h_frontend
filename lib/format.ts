// lib/format.ts

/** 149000 → «149 000 ₽» */
export function formatMoney(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(value);
}

/** 1490000 → «1,5 млн ₽» */
export function formatMoneyCompact(value: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        notation: 'compact',
        maximumFractionDigits: 1
    }).format(value);
}

/** 1450 → «1 450» */
export function formatNumber(value: number): string {
    return new Intl.NumberFormat('ru-RU').format(value);
}

/** 12.4 → «+12,4%» */
export function formatTrend(value: number): string {
    const formatted = new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 1,
        signDisplay: 'always'
    }).format(value);

    return `${formatted}%`;
}

/** 105 → «1 ч 45 мин» */
export function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    if (!hours) return `${rest} мин`;
    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

/** 2026-09-21T… → «21 сентября, 14:32» */
export function formatDateTime(value: string): string {
    return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}
