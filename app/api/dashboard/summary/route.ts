// app/api/dashboard/summary/route.ts
//
// Финансовая сводка для главной (админский дашборд).
// Данные берутся из основного API (h_main_backend).
// Доступ — по праву view.org.finance (SuperUser / Admin).

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
import {DashboardSummary, DashboardSummaryResponse} from '@/types/dashboard';

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function GET(
    request: NextRequest
): Promise<NextResponse<DashboardSummaryResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<DashboardSummaryResponse>;
    }

    const respond = sessionResponder(session);

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_FINANCE
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return sessionRevokedResponse<DashboardSummaryResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (permission.reason === 'unavailable') {
            return respond<DashboardSummaryResponse>(
                {success: false, data: 'Не удалось проверить права доступа'},
                503
            );
        }
        return respond<DashboardSummaryResponse>(
            {success: false, data: 'Недостаточно прав для просмотра финансов'},
            403
        );
    }

    const refresh = request.nextUrl.searchParams.get('refresh');

    try {
        const {data} = await axios.get<{success: true; data: DashboardSummary}>(
            `${MAIN_API_URL}/dashboard/summary`,
            {
                headers: {Authorization: `Bearer ${session.accessToken}`},
                params: refresh ? {refresh} : undefined
            }
        );

        return respond<DashboardSummaryResponse>({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse<DashboardSummaryResponse>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка загрузки дашборда';

            return respond<DashboardSummaryResponse>({success: false, data: message}, status);
        }

        return respond<DashboardSummaryResponse>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
