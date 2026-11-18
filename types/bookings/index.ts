// types/bookings/index.ts

import type {ShiftBooking} from '@/types/dashboard';

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed';

export type BookingActionType =
    | 'Created'
    | 'Started'
    | 'Extended'
    | 'Closed'
    | 'Cancelled';

export interface BookingActionDetails {
    id: number;
    type: BookingActionType;
    minutes: number | null;
    amount: number | null;
    comment: string | null;
    createdAt: string;
}

export interface BookingDetails {
    id: number;
    locationId: number;
    locationName: string;
    tableId: number | null;
    tableName: string | null;
    guestName: string | null;
    guestPhone: string | null;
    guestsCount: number;
    status: BookingStatus;
    scheduledAt: string;
    durationMinutes: number;
    expectedEndAt: string;
    seatedAt: string | null;
    completedAt: string | null;
    amount: number;
    rating: number | null;
    comment: string | null;
    userExtId: string;
    createdByName: string | null;
    isMine: boolean;
    createdAt: string;
    actions: BookingActionDetails[];
}

export type BookingDetailsResponse =
    | {success: true; data: BookingDetails}
    | {success: false; data: string};

export interface BookingBoardItem extends ShiftBooking {
    managerName: string;
}

export interface EmployeeBookingStat {
    id: string;
    name: string;
    role: string;
    bookings: number;
    guests: number;
    revenue: number;
    averageCheck: number;
    cancellations: number;
}

export interface BookingsBoard {
    generatedAt: string;
    date: string;
    summary: {
        bookings: number;
        guests: number;
        revenue: number;
        cancellations: number;
        expectedArrivals: number;
    };
    bookings: BookingBoardItem[];
    employees: EmployeeBookingStat[];
}

export type BookingsBoardResponse =
    | {success: true; data: BookingsBoard}
    | {success: false; data: string};
