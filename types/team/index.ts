// types/team/index.ts

export const TEAM_SORT_KEYS = [
    'name',
    'position',
    'bookings',
    'guests',
    'revenue',
    'averageCheck',
    'cancellations',
    'shift'
] as const;

export type TeamSortKey = (typeof TEAM_SORT_KEYS)[number];

export interface TeamRow {
    id: string;
    name: string;
    login: string;
    phone: string;
    position: string;
    bookings: number;
    guests: number;
    revenue: number;
    averageCheck: number;
    cancellations: number;
    isOnShift: boolean;
    shiftStartedAt: string | null;
    createdAt: string;
}

export interface TeamResponse {
    generatedAt: string;
    period: {from: string; to: string};
    summary: {
        employees: number;
        onShift: number;
        bookings: number;
        revenue: number;
    };
    items: TeamRow[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    sort: TeamSortKey;
    order: 'asc' | 'desc';
}

export type TeamResponseApi =
    | {success: true; data: TeamResponse}
    | {success: false; data: string};
