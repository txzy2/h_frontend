// lib/mock/dashboard.mock.ts
//
// Демонстрационные данные для главной страницы.
// Позже заменяются реальными данными из основного API (MAIN_API_URL).

import {
    DashboardSummary,
    EmployeeStat,
    HeatmapData,
    HourLoadPoint,
    LocationStat,
    RevenuePeriod,
    RevenuePoint
} from '@/types/dashboard';
import {REVENUE_PERIOD_OPTIONS, RevenuePeriodKey} from '@/lib/dashboard/periods';

/** Базовый паттерн выручки, тысячи ₽ */
const REVENUE_PATTERN = [82, 96, 74, 108, 121, 143, 156, 118, 92, 101, 134, 162, 187, 149];

/** Базовый паттерн броней */
const BOOKINGS_PATTERN = [31, 38, 27, 42, 47, 55, 61, 44, 35, 39, 51, 63, 72, 57];

/** Сколько дней истории отдаём в серии «3 мес» */
const MAX_DAYS = 90;

export const HOUR_LOAD: HourLoadPoint[] = [
    {hour: '12:00', bookings: 4},
    {hour: '13:00', bookings: 6},
    {hour: '14:00', bookings: 8},
    {hour: '15:00', bookings: 7},
    {hour: '16:00', bookings: 9},
    {hour: '17:00', bookings: 14},
    {hour: '18:00', bookings: 21},
    {hour: '19:00', bookings: 29},
    {hour: '20:00', bookings: 36},
    {hour: '21:00', bookings: 41},
    {hour: '22:00', bookings: 34},
    {hour: '23:00', bookings: 25},
    {hour: '00:00', bookings: 16},
    {hour: '01:00', bookings: 8}
];

const LOCATIONS: LocationStat[] = [
    {
        id: 1,
        name: 'Красноармейская',
        address: 'ул. Красноармейская, 45',
        revenue: 1_240_000,
        bookings: 512,
        guests: 1450,
        averageCheck: 2420,
        occupancy: 84,
        trend: 12.4
    },
    {
        id: 2,
        name: 'Пушкинская',
        address: 'ул. Пушкина, 12',
        revenue: 986_000,
        bookings: 402,
        guests: 1140,
        averageCheck: 2450,
        occupancy: 72,
        trend: 6.8
    },
    {
        id: 3,
        name: 'Садовая',
        address: 'ул. Садовая, 108',
        revenue: 714_000,
        bookings: 298,
        guests: 860,
        averageCheck: 2390,
        occupancy: 61,
        trend: -3.2
    }
];

const EMPLOYEES: EmployeeStat[] = [
    {
        id: 'e-1',
        name: 'Алина Кузнецова',
        role: 'Официант',
        bookings: 187,
        guests: 512,
        revenue: 356_000,
        rating: 4.9
    },
    {
        id: 'e-2',
        name: 'Мария Соколова',
        role: 'Кальянный мастер',
        bookings: 142,
        guests: 396,
        revenue: 342_000,
        rating: 4.8
    },
    {
        id: 'e-3',
        name: 'Дмитрий Орлов',
        role: 'Кальянный мастер',
        bookings: 128,
        guests: 351,
        revenue: 298_000,
        rating: 4.7
    },
    {
        id: 'e-4',
        name: 'Игорь Лебедев',
        role: 'Бармен',
        bookings: 154,
        guests: 421,
        revenue: 268_000,
        rating: 4.6
    },
    {
        id: 'e-5',
        name: 'Артём Волков',
        role: 'Управляющий',
        bookings: 96,
        guests: 268,
        revenue: 218_000,
        rating: 4.9
    }
];

/** Дневная серия за N дней (старые → новые), с лёгким ростом к сегодня */
function buildDailyPoints(days: number): RevenuePoint[] {
    const today = new Date();
    const points: RevenuePoint[] = [];

    for (let index = 0; index < days; index++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (days - 1 - index));

        const patternIndex = index % REVENUE_PATTERN.length;
        const growth = 1 + index * 0.0015;

        points.push({
            date: date.toISOString(),
            label: date.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}),
            revenue: Math.round(REVENUE_PATTERN[patternIndex] * 1000 * growth),
            bookings: Math.round(BOOKINGS_PATTERN[patternIndex] * growth)
        });
    }

    return points;
}

/** Сегодня — выручка по часам */
function buildTodayPoints(): RevenuePoint[] {
    return HOUR_LOAD.map(point => ({
        date: point.hour,
        label: point.hour,
        revenue: point.bookings * 2600,
        bookings: point.bookings
    }));
}

function buildRevenuePeriodPoints(): Record<RevenuePeriodKey, RevenuePoint[]> {
    const daily = buildDailyPoints(MAX_DAYS);

    return {
        today: buildTodayPoints(),
        '14d': daily.slice(-14),
        '1m': daily.slice(-30),
        '2m': daily.slice(-60),
        '3m': daily
    };
}

/** Серия выручки за конкретный период (используется /api/dashboard/revenue) */
export function getMockRevenuePeriod(periodKey: string): RevenuePeriod | null {
    const option = REVENUE_PERIOD_OPTIONS.find(item => item.key === periodKey);
    if (!option) return null;

    return {
        key: option.key,
        label: option.label,
        points: buildRevenuePeriodPoints()[option.key]
    };
}

/** Профиль загрузки: день недели × час (0–100) */
const HEATMAP_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_PROFILE = [30, 34, 32, 40, 62, 88, 70];
const HOUR_PROFILE = [8, 12, 18, 16, 22, 36, 54, 72, 90, 100, 82, 60, 38, 18];

function buildHeatmap(): HeatmapData {
    const hours = HOUR_LOAD.map(point => point.hour);

    const values = HEATMAP_DAYS.map((_, dayIndex) =>
        HOUR_PROFILE.map(hourWeight =>
            Math.min(100, Math.round((DAY_PROFILE[dayIndex] * hourWeight) / 100))
        )
    );

    return {days: HEATMAP_DAYS, hours, values};
}

export function getMockDashboardSummary(): DashboardSummary {
    return {
        generatedAt: new Date().toISOString(),
        isMock: true,
        kpi: {
            revenueToday: 149_000,
            revenueMonth: 2_940_000,
            bookingsToday: 57,
            guestsToday: 168,
            averageCheck: 2650,
            occupancy: 73,
            newGuestsToday: 34,
            returningRate: 62,
            revenueTrend: 8.2,
            bookingsTrend: 5.1,
            guestsTrend: 3.4,
            averageCheckTrend: 2.1,
            occupancyTrend: 4.6,
            newGuestsTrend: 6.3,
            spark: {
                revenue: [121, 143, 156, 118, 92, 101, 149],
                bookings: [47, 55, 61, 44, 35, 39, 57],
                guests: [138, 162, 178, 129, 104, 115, 168],
                averageCheck: [2570, 2600, 2555, 2680, 2620, 2590, 2650],
                occupancy: [68, 74, 79, 66, 55, 58, 73],
                newGuests: [28, 34, 41, 26, 19, 22, 34]
            }
        },
        loadByHour: HOUR_LOAD,
        heatmap: buildHeatmap(),
        locations: LOCATIONS,
        employees: EMPLOYEES
    };
}
