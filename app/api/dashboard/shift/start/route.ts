// app/api/dashboard/shift/start/route.ts
//
// Начало фактической смены менеджера.
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
import {ManagerShiftResponse, ManagerShiftSummary} from '@/types/dashboard';

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function POST(request: NextRequest): Promise<NextResponse<ManagerShiftResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<ManagerShiftResponse>;
    }

    const respond = sessionResponder(session);

    if (session.payload.role !== 'Manager') {
        return respond<ManagerShiftResponse>(
            {success: false, data: 'Доступно только менеджеру'},
            403
        );
    }

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_RESERVATIONS
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return sessionRevokedResponse<ManagerShiftResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (permission.reason === 'unavailable') {
            return respond<ManagerShiftResponse>(
                {success: false, data: 'Не удалось проверить права доступа'},
                503
            );
        }
        return respond<ManagerShiftResponse>(
            {success: false, data: 'Недостаточно прав'},
            403
        );
    }

    try {
        const {data} = await axios.post<{success: true; data: ManagerShiftSummary}>(
            `${MAIN_API_URL}/dashboard/shift/start`,
            {},
            {headers: {Authorization: `Bearer ${session.accessToken}`}}
        );

        return respond<ManagerShiftResponse>({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse<ManagerShiftResponse>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Не удалось начать смену';

            return respond<ManagerShiftResponse>({success: false, data: message}, status);
        }

        return respond<ManagerShiftResponse>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
