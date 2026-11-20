// lib/org/branding.constants.ts
//
// Общие константы и хелперы для кастомизации интерфейса организации.
// Используются и на сервере (валидация), и на клиенте (UI).

export const ORG_THEMES = ['light', 'dark', 'system'] as const;
export type OrgTheme = (typeof ORG_THEMES)[number];

export const DEFAULT_ORG_THEME: OrgTheme = 'system';
export const DEFAULT_BRAND_COLOR = '#f59e0b';
export const MAX_LOGO_BYTES = 256 * 1024;
export const LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export const STATUS_COLOR_KEYS = ['expected', 'seated', 'completed', 'cancelled'] as const;
export type StatusColorKey = (typeof STATUS_COLOR_KEYS)[number];
export type StatusColors = Record<StatusColorKey, string>;

export const DEFAULT_STATUS_COLORS: StatusColors = {
    expected: '#f59e0b',
    seated: '#10b981',
    completed: '#94a3b8',
    cancelled: '#ef4444'
};

export const DEFAULT_CHART_COLORS = [
    '#f59e0b',
    '#0ea5e9',
    '#10b981',
    '#8b5cf6',
    '#f43f5e'
];

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

export interface ThemePreset {
    key: string;
    name: string;
    description: string;
    brandColor: string;
    headerColor: string | null;
    statusColors: StatusColors;
    chartColors: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
    {
        key: 'amber',
        name: 'Янтарь',
        description: 'Тёплый акцент и графитовая шапка',
        brandColor: '#f59e0b',
        headerColor: '#18181b',
        statusColors: {
            expected: '#f59e0b',
            seated: '#10b981',
            completed: '#94a3b8',
            cancelled: '#ef4444'
        },
        chartColors: ['#f59e0b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e']
    },
    {
        key: 'emerald',
        name: 'Изумруд',
        description: 'Спокойный зелёный и тёмная шапка',
        brandColor: '#10b981',
        headerColor: '#052e2b',
        statusColors: {
            expected: '#f59e0b',
            seated: '#22c55e',
            completed: '#94a3b8',
            cancelled: '#ef4444'
        },
        chartColors: ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e']
    },
    {
        key: 'sky',
        name: 'Небо',
        description: 'Холодный синий и графит',
        brandColor: '#0ea5e9',
        headerColor: '#0f172a',
        statusColors: {
            expected: '#f59e0b',
            seated: '#14b8a6',
            completed: '#94a3b8',
            cancelled: '#ef4444'
        },
        chartColors: ['#0ea5e9', '#6366f1', '#14b8a6', '#f59e0b', '#f43f5e']
    },
    {
        key: 'rose',
        name: 'Роза',
        description: 'Тёплый розовый и бордовая шапка',
        brandColor: '#f43f5e',
        headerColor: '#3f1723',
        statusColors: {
            expected: '#f59e0b',
            seated: '#10b981',
            completed: '#94a3b8',
            cancelled: '#e11d48'
        },
        chartColors: ['#f43f5e', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981']
    },
    {
        key: 'violet',
        name: 'Фиолет',
        description: 'Глубокий фиолетовый и индиго',
        brandColor: '#8b5cf6',
        headerColor: '#1e1b4b',
        statusColors: {
            expected: '#f59e0b',
            seated: '#10b981',
            completed: '#94a3b8',
            cancelled: '#ef4444'
        },
        chartColors: ['#8b5cf6', '#6366f1', '#0ea5e9', '#f59e0b', '#f43f5e']
    },
    {
        key: 'graphite',
        name: 'Графит',
        description: 'Нейтральный графит для строгого стиля',
        brandColor: '#64748b',
        headerColor: '#1f2937',
        statusColors: {
            expected: '#f59e0b',
            seated: '#10b981',
            completed: '#64748b',
            cancelled: '#ef4444'
        },
        chartColors: ['#64748b', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e']
    }
];

export function isValidHexColor(value: unknown): value is string {
    return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}

export function normalizeHexColor(value: string): string {
    return value.trim().toLowerCase();
}

export function isOrgTheme(value: unknown): value is OrgTheme {
    return typeof value === 'string' && (ORG_THEMES as readonly string[]).includes(value);
}

export function normalizeStatusColors(value: unknown): StatusColors {
    if (!value || typeof value !== 'object') return {...DEFAULT_STATUS_COLORS};

    const raw = value as Record<string, unknown>;
    const result = {...DEFAULT_STATUS_COLORS};

    for (const key of STATUS_COLOR_KEYS) {
        if (isValidHexColor(raw[key])) {
            result[key] = normalizeHexColor(raw[key]);
        }
    }

    return result;
}

export function normalizeChartColors(value: unknown): string[] {
    if (!Array.isArray(value)) return [...DEFAULT_CHART_COLORS];

    return DEFAULT_CHART_COLORS.map((fallback, index) => {
        const candidate = value[index];

        return isValidHexColor(candidate) ? normalizeHexColor(candidate) : fallback;
    });
}

/** Добавляет прозрачность к hex-цвету: withAlpha('#10b981', 0.15) */
export function withAlpha(hex: string, alpha: number): string {
    const color = isValidHexColor(hex) ? normalizeHexColor(hex) : DEFAULT_BRAND_COLOR;
    const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
        .toString(16)
        .padStart(2, '0');

    return `${color}${value}`;
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
