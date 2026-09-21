// app/api/dashboard/revenue/route.ts
//
// Серия выручки за выбранный период для графика на главной.
// Доступ — по праву view.org.finance (SuperUser / Admin).
// Пока отдаём демонстрационные данные с небольшой задержкой,
// чтобы было видно прелоадер (убрать после интеграции с основным API).

import {NextRequest, NextResponse} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {getMockRevenuePeriod} from '@/lib/mock/dashboard.mock';
import {DEFAULT_REVENUE_PERIOD, isRevenuePeriodKey} from '@/lib/dashboard/periods';
import {RevenuePeriodResponse} from '@/types/dashboard';

/** Имитация задержки основного API (мс) */
const MOCK_DELAY_MS = 600;

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

    const period = getMockRevenuePeriod(periodParam);
    if (!period) {
        return respond<RevenuePeriodResponse>({success: false, data: 'Нет данных'}, 404);
    }

    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

    return respond<RevenuePeriodResponse>({success: true, data: period});
}
