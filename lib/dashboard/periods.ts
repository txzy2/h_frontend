// lib/dashboard/periods.ts
//
// Варианты периода для графика выручки (общие для клиента и мока API).

export const REVENUE_PERIOD_OPTIONS = [
    {key: 'today', label: 'Сегодня'},
    {key: '14d', label: '14 дней'},
    {key: '1m', label: '1 мес'},
    {key: '2m', label: '2 мес'},
    {key: '3m', label: '3 мес'}
] as const;

export type RevenuePeriodKey = (typeof REVENUE_PERIOD_OPTIONS)[number]['key'];

export const DEFAULT_REVENUE_PERIOD: RevenuePeriodKey = '14d';

export function isRevenuePeriodKey(value: unknown): value is RevenuePeriodKey {
    return REVENUE_PERIOD_OPTIONS.some(option => option.key === value);
}
