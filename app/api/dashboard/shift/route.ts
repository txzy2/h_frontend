// app/api/dashboard/shift/route.ts
//
// Операционная сводка смены для дашборда менеджера.
// Доступ — по праву view.org.reservations (Manager / Admin / SuperUser).
// Пока отдаём демонстрационные данные (lib/mock/manager-dashboard.mock.ts).

import {NextRequest, NextResponse} from 'next/server';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {getMockManagerShift} from '@/lib/mock/manager-dashboard.mock';
import {ManagerShiftResponse} from '@/types/dashboard';

/** Имитация задержки основного API (мс) */
const MOCK_DELAY_MS = 500;

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

    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));

    return respond<ManagerShiftResponse>({success: true, data: getMockManagerShift()});
}
