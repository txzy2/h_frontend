// app/api/bookings/board/route.ts
//
// Брони на сегодня + статистика по сотрудникам для админа.
// Проксирует запрос в основной API (h_main_backend).

import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {BookingsBoard, BookingsBoardResponse} from '@/types/bookings';

const MAIN_API_URL = process.env.MAIN_API_URL;
const ALLOWED_ROLES = ['Manager', 'Admin', 'SuperUser'];

export async function GET(request: NextRequest): Promise<NextResponse<BookingsBoardResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<BookingsBoardResponse>;
    }

    const respond = sessionResponder(session);

    if (!ALLOWED_ROLES.includes(session.payload.role)) {
        return respond<BookingsBoardResponse>(
            {success: false, data: 'Недостаточно прав'},
            403
        );
    }

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_RESERVATIONS
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return sessionRevokedResponse<BookingsBoardResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (permission.reason === 'unavailable') {
            return respond<BookingsBoardResponse>(
                {success: false, data: 'Не удалось проверить права доступа'},
                503
            );
        }
        return respond<BookingsBoardResponse>(
            {success: false, data: 'Недостаточно прав для просмотра броней'},
            403
        );
    }

    try {
        const {data} = await axios.get<{success: true; data: BookingsBoard}>(
            `${MAIN_API_URL}/dashboard/bookings`,
            {headers: {Authorization: `Bearer ${session.accessToken}`}}
        );

        return respond<BookingsBoardResponse>({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse<BookingsBoardResponse>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Не удалось загрузить брони';

            return respond<BookingsBoardResponse>({success: false, data: message}, status);
        }

        return respond<BookingsBoardResponse>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
