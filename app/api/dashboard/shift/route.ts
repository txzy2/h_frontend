// app/api/dashboard/shift/route.ts
//
// Операционная сводка смены для дашборда менеджера.
// Данные берутся из основного API (h_main_backend).
// Доступ — по праву view.org.reservations (Manager / Admin / SuperUser).

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

export async function GET(request: NextRequest): Promise<NextResponse<ManagerShiftResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<ManagerShiftResponse>;
    }

    const respond = sessionResponder(session);

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
            {success: false, data: 'Недостаточно прав для просмотра броней'},
            403
        );
    }

    const refresh = request.nextUrl.searchParams.get('refresh');

    try {
        const {data} = await axios.get<{success: true; data: ManagerShiftSummary}>(
            `${MAIN_API_URL}/dashboard/shift`,
            {
                headers: {Authorization: `Bearer ${session.accessToken}`},
                params: refresh ? {refresh} : undefined
            }
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
                'Ошибка загрузки данных смены';

            return respond<ManagerShiftResponse>({success: false, data: message}, status);
        }

        return respond<ManagerShiftResponse>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
