// app/api/orgs/route.ts
import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function GET(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        const {data} = await axios.get(`${MAIN_API_URL}/orgs`, {
            headers: {Authorization: `Bearer ${session.accessToken}`}
        });
        return respond({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка загрузки организации';

            // 409 — организация не найдена / не активна (ожидаемое состояние)
            if (status === 409) {
                return respond({success: false, data: null, message}, 409);
            }

            return respond({success: false, data: message}, status);
        }
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
