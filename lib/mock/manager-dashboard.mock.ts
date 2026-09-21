// lib/mock/manager-dashboard.mock.ts
//
// Демонстрационные данные для дашборда менеджера (операционная смена).
// Позже заменяются реальными данными из основного API.

import {HOUR_LOAD} from './dashboard.mock';
import {ManagerShiftSummary, ShiftBooking, ShiftStaff} from '@/types/dashboard';

/** Сколько столов в зале менеджера (совпадает с kpi.tablesTotal) */
const TABLES_TOTAL = 18;

/**
 * Нумерация столиков поочерёдно по мере бронирования:
 * 1, 2, 3… Когда все столы заняты — нумерация идёт по второму кругу.
 */
function assignTables(bookings: Omit<ShiftBooking, 'table'>[]): ShiftBooking[] {
    return bookings.map((booking, index) => ({
        ...booking,
        table: `Стол ${(index % TABLES_TOTAL) + 1}`
    }));
}

const RAW_BOOKINGS: Omit<ShiftBooking, 'table'>[] = [
    {
        id: 'b-01',
        isMine: true,
        time: '12:00',
        locationName: 'Красноармейская',
        guestName: 'Сергей Петров',
        guests: 2,
        status: 'Завершена'
    },
    {
        id: 'b-02',
        time: '13:30',
        locationName: 'Пушкинская',
        guestName: 'Ольга Смирнова',
        guests: 4,
        status: 'Завершена'
    },
    {
        id: 'b-03',
        time: '15:00',
        locationName: 'Садовая',
        guestName: 'Иван Морозов',
        guests: 6,
        status: 'Завершена'
    },
    {
        id: 'b-04',
        isMine: true,
        time: '16:30',
        locationName: 'Красноармейская',
        guestName: 'Анна Волкова',
        guests: 3,
        status: 'Отменена'
    },
    {
        id: 'b-05',
        time: '18:00',
        locationName: 'Пушкинская',
        guestName: 'Дмитрий Кузнецов',
        guests: 5,
        status: 'За столом',
        phone: '+7 918 100-20-30'
    },
    {
        id: 'b-06',
        isMine: true,
        time: '18:30',
        locationName: 'Красноармейская',
        guestName: 'Елена Соколова',
        guests: 2,
        status: 'За столом'
    },
    {
        id: 'b-07',
        isMine: true,
        time: '19:30',
        locationName: 'Садовая',
        guestName: 'Максим Орлов',
        guests: 4,
        status: 'Ожидается',
        phone: '+7 918 555-11-22'
    },
    {
        id: 'b-08',
        isMine: true,
        time: '20:00',
        locationName: 'Красноармейская',
        guestName: 'Наталья Крылова',
        guests: 6,
        status: 'Ожидается'
    },
    {
        id: 'b-09',
        time: '21:00',
        locationName: 'Пушкинская',
        guestName: 'Артём Лебедев',
        guests: 3,
        status: 'Ожидается'
    },
    {
        id: 'b-10',
        isMine: true,
        time: '22:30',
        locationName: 'Красноармейская',
        guestName: 'Юлия Никитина',
        guests: 8,
        status: 'Ожидается'
    }
];

const STAFF: ShiftStaff[] = [
    {
        id: 's-1',
        name: 'Артём Волков',
        role: 'Управляющий',
        timeRange: '10:00 – 22:00',
        status: 'На смене'
    },
    {
        id: 's-2',
        name: 'Мария Соколова',
        role: 'Кальянный мастер',
        timeRange: '14:00 – 02:00',
        status: 'На смене'
    },
    {
        id: 's-3',
        name: 'Дмитрий Орлов',
        role: 'Кальянный мастер',
        timeRange: '16:00 – 02:00',
        status: 'Скоро'
    },
    {
        id: 's-4',
        name: 'Алина Кузнецова',
        role: 'Официант',
        timeRange: '12:00 – 00:00',
        status: 'На смене'
    },
    {
        id: 's-5',
        name: 'Игорь Лебедев',
        role: 'Бармен',
        timeRange: '18:00 – 02:00',
        status: 'Скоро'
    },
    {
        id: 's-6',
        name: 'Светлана Егорова',
        role: 'Официант',
        timeRange: '10:00 – 16:00',
        status: 'Заканчивает'
    }
];


export function getMockManagerShift(): ManagerShiftSummary {
    return {
        generatedAt: new Date().toISOString(),
        isMock: true,
        kpi: {
            bookingsToday: 57,
            guestsToday: 168,
            tablesBusy: 12,
            tablesTotal: 18,
            cancellations: 3,
            expectedArrivals: 4,
            averageVisitMinutes: 105,
            occupancy: 73
        },
        bookings: assignTables(RAW_BOOKINGS),
        personal: {
            bookings: 6,
            guests: 25,
            cancellations: 1,
            averageVisitMinutes: 100,
            goal: 8
        },
        loadByHour: HOUR_LOAD,
        staff: STAFF
    };
}
