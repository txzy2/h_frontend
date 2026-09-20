// app/api/auth/change-password/verify/route.ts
import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';

const AUTH_API_URL = process.env.AUTH_API_URL;

export async function POST(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        const body = await request.json();

        const {data} = await axios.post(`${AUTH_API_URL}/auth/change-password/verify`, body, {
            headers: {Authorization: `Bearer ${session.accessToken}`}
        });

        return respond(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;

            // access-токен был свежим, но auth-сервис его отверг — сессия недействительна
            if (status === 401 || status === 403) {
                return sessionRevokedResponse(
                    error.response?.data ?? {success: false, data: 'Unauthorized'},
                    status
                );
            }

            return respond(
                error.response?.data ?? {success: false, data: 'Verification failed'},
                status
            );
        }
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
