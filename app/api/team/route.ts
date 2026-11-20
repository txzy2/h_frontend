// app/api/team/route.ts
//
// Команда организации для админа: список сотрудников и статистика.
// Проксирует запрос в основной API (h_main_backend).

import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {TeamResponse, TeamResponseApi} from '@/types/team';

const MAIN_API_URL = process.env.MAIN_API_URL;
const ALLOWED_ROLES = ['Admin', 'SuperUser'];

export async function GET(request: NextRequest): Promise<NextResponse<TeamResponseApi>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<TeamResponseApi>;
    }

    const respond = sessionResponder(session);

    if (!ALLOWED_ROLES.includes(session.payload.role)) {
        return respond<TeamResponseApi>(
            {success: false, data: 'Доступно только администраторам'},
            403
        );
    }

    try {
        const params: Record<string, string> = {};
        for (const [key, value] of request.nextUrl.searchParams.entries()) {
            params[key] = value;
        }

        const {data} = await axios.get<{success: true; data: TeamResponse}>(
            `${MAIN_API_URL}/dashboard/team`,
            {
                params,
                headers: {Authorization: `Bearer ${session.accessToken}`}
            }
        );

        return respond<TeamResponseApi>({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse<TeamResponseApi>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Не удалось загрузить команду';

            return respond<TeamResponseApi>({success: false, data: message}, status);
        }

        return respond<TeamResponseApi>(
            {success: false, data: 'Internal server error'},
            500
        );
    }
}
