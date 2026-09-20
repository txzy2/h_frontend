// lib/org/branding.constants.ts
//
// Общие константы и хелперы для кастомизации интерфейса организации.
// Используются и на сервере (валидация), и на клиенте (UI).

export const ORG_THEMES = ['light', 'dark', 'system'] as const;
export type OrgTheme = (typeof ORG_THEMES)[number];

export const DEFAULT_BRAND_COLOR = '#f59e0b';
export const MAX_LOGO_BYTES = 256 * 1024;
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const BRAND_PRESETS: {name: string; value: string}[] = [
    {name: 'Янтарь', value: '#f59e0b'},
    {name: 'Оранж', value: '#f97316'},
    {name: 'Роза', value: '#f43f5e'},
    {name: 'Фиолет', value: '#8b5cf6'},
    {name: 'Небо', value: '#0ea5e9'},
    {name: 'Изумруд', value: '#10b981'},
    {name: 'Графит', value: '#64748b'}
];

export const HEADER_PRESETS: {name: string; value: string | null}[] = [
    {name: 'По умолчанию', value: null},
    {name: 'Тёмный', value: '#18181b'},
    {name: 'Графитовый', value: '#1f2937'},
    {name: 'Индиго', value: '#1e1b4b'},
    {name: 'Изумрудный', value: '#052e2b'},
    {name: 'Бордовый', value: '#3f1723'},
    {name: 'Светлый', value: '#ffffff'}
];

export function isValidHexColor(value: unknown): value is string {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizeHexColor(value: string): string {
    return value.trim().toLowerCase();
}

/** Относительная яркость по WCAG */
function relativeLuminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const linear = (channel: number) =>
        channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

    return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** Подбирает чёрный или белый текст под цвет фона */
export function contrastColor(hex: string): '#000000' | '#ffffff' {
    if (!isValidHexColor(hex)) return '#ffffff';
    return relativeLuminance(hex) > 0.35 ? '#000000' : '#ffffff';
}
