// app/api/dashboard/summary/route.ts
//
// Финансовая сводка для главной (админский дашборд).
// Пока отдаём демонстрационные данные (lib/mock/dashboard.mock.ts).
// Доступ — по праву view.org.finance (SuperUser / Admin).

import {NextRequest, NextResponse} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {getMockDashboardSummary} from '@/lib/mock/dashboard.mock';
import {DashboardSummaryResponse} from '@/types/dashboard';

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

    return respond<DashboardSummaryResponse>({
        success: true,
        data: getMockDashboardSummary()
    });
}
