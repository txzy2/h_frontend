// types/dashboard/index.ts

export interface DashboardKpi {
    /** Выручка за сегодня, ₽ */
    revenueToday: number;
    /** Выручка за текущий месяц, ₽ */
    revenueMonth: number;
    /** Броней сегодня */
    bookingsToday: number;
    /** Гостей сегодня */
    guestsToday: number;
    /** Средний чек, ₽ */
    averageCheck: number;
    /** Загруженность точки, % */
    occupancy: number;
    /** Новых гостей за сегодня */
    newGuestsToday: number;
    /** Доля повторных визитов, % */
    returningRate: number;
    /** Изменение к прошлому периоду, % */
    revenueTrend: number;
    bookingsTrend: number;
    guestsTrend: number;
    averageCheckTrend: number;
    occupancyTrend: number;
    newGuestsTrend: number;
    /** Мини-графики для KPI-карточек (7 дней) */
    spark: {
        revenue: number[];
        bookings: number[];
        guests: number[];
        averageCheck: number[];
        occupancy: number[];
        newGuests: number[];
    };
}

export interface RevenuePoint {
    date: string;
    /** Подпись для оси, например «14 сен» */
    label: string;
    revenue: number;
    bookings: number;
}

/** Готовая серия выручки для переключателя периода */
export interface RevenuePeriod {
    /** 'today' | '14d' | '1m' | '2m' | '3m' */
    key: string;
    label: string;
    points: RevenuePoint[];
}

export interface HourLoadPoint {
    /** Например «18:00» */
    hour: string;
    bookings: number;
}

export interface LocationStat {
    id: number;
    name: string;
    address: string;
    /** Выручка за месяц, ₽ */
    revenue: number;
    bookings: number;
    guests: number;
    averageCheck: number;
    /** Загруженность, % */
    occupancy: number;
    /** Динамика к прошлому месяцу, % */
    trend: number;
}

export interface EmployeeStat {
    id: string;
    name: string;
    role: string;
    bookings: number;
    guests: number;
    /** Выручка, которую принёс сотрудник, ₽ */
    revenue: number;
    /** Средняя оценка гостей, 0–5 */
    rating: number;
}

export interface HeatmapData {
    /** Подписи дней, например «Пн» */
    days: string[];
    /** Подписи часов, например «18:00» */
    hours: string[];
    /** Загруженность 0–100: values[dayIndex][hourIndex] */
    values: number[][];
}

export interface DashboardSummary {
    generatedAt: string;
    /** true — данные демонстрационные (пока нет интеграции с основным API) */
    isMock: boolean;
    kpi: DashboardKpi;
    loadByHour: HourLoadPoint[];
    heatmap: HeatmapData;
    locations: LocationStat[];
    employees: EmployeeStat[];
}

export type RevenuePeriodResponse =
    | {success: true; data: RevenuePeriod}
    | {success: false; data: string};

// ============================================================
// Смена менеджера (операционная сводка)
// ============================================================

export type ShiftBookingStatus = 'Завершена' | 'За столом' | 'Ожидается' | 'Отменена';

export interface ShiftBooking {
    id: string;
    time: string;
    locationName: string;
    guestName: string;
    guests: number;
    table: string;
    status: ShiftBookingStatus;
    phone?: string;
    /** Бронь закреплена за текущим менеджером */
    isMine?: boolean;
}

export interface ShiftStaff {
    id: string;
    name: string;
    role: string;
    timeRange: string;
    status: 'На смене' | 'Заканчивает' | 'Скоро';
}

export interface ManagerShiftSummary {
    generatedAt: string;
    isMock: boolean;
    kpi: {
        bookingsToday: number;
        guestsToday: number;
        tablesBusy: number;
        tablesTotal: number;
        cancellations: number;
        expectedArrivals: number;
        /** Среднее время визита, минуты */
        averageVisitMinutes: number;
        occupancy: number;
    };
    /** Личные показатели менеджера за смену */
    personal: {
        bookings: number;
        guests: number;
        cancellations: number;
        averageVisitMinutes: number;
        /** Цель за смену, броней */
        goal: number;
    };
    bookings: ShiftBooking[];
    loadByHour: HourLoadPoint[];
    staff: ShiftStaff[];
}

export type ManagerShiftResponse =
    | {success: true; data: ManagerShiftSummary}
    | {success: false; data: string};

export type DashboardSummaryResponse =
    | {success: true; data: DashboardSummary}
    | {success: false; data: string};
