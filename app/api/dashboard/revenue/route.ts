// app/api/dashboard/revenue/route.ts
//
// Серия выручки за выбранный период для графика на главной.
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
import {DEFAULT_REVENUE_PERIOD, isRevenuePeriodKey} from '@/lib/dashboard/periods';
import {RevenuePeriod, RevenuePeriodResponse} from '@/types/dashboard';

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function GET(request: NextRequest): Promise<NextResponse<RevenuePeriodResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<RevenuePeriodResponse>;
    }

    const respond = sessionResponder(session);

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_FINANCE
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return sessionRevokedResponse<RevenuePeriodResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (permission.reason === 'unavailable') {
            return respond<RevenuePeriodResponse>(
                {success: false, data: 'Не удалось проверить права доступа'},
                503
            );
        }
        return respond<RevenuePeriodResponse>(
            {success: false, data: 'Недостаточно прав для просмотра финансов'},
            403
        );
    }

    const periodParam = request.nextUrl.searchParams.get('period') ?? DEFAULT_REVENUE_PERIOD;

    if (!isRevenuePeriodKey(periodParam)) {
        return respond<RevenuePeriodResponse>({success: false, data: 'Неизвестный период'}, 400);
    }

    const refresh = request.nextUrl.searchParams.get('refresh');

    try {
        const {data} = await axios.get<{success: true; data: RevenuePeriod}>(
            `${MAIN_API_URL}/dashboard/revenue`,
            {
                params: {
                    period: periodParam,
                    ...(refresh ? {refresh} : {})
                },
                headers: {Authorization: `Bearer ${session.accessToken}`}
            }
        );

        return respond<RevenuePeriodResponse>({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse<RevenuePeriodResponse>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка загрузки выручки';

            return respond<RevenuePeriodResponse>({success: false, data: message}, status);
        }

        return respond<RevenuePeriodResponse>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
