// app/api/users/permissions/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {fetchUserPermissions} from '@/lib/services/permission.service';
import {PermissionsData} from '@/types/auth';

export async function GET(request: NextRequest): Promise<NextResponse<PermissionsData>> {
    const session = await resolveSession(request);

    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<PermissionsData>;
    }

    const respond = sessionResponder(session);

    try {
        const list = await fetchUserPermissions(session.accessToken);
        return respond<PermissionsData>({success: true, data: list});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;

            // Сессию отверг auth-сервис — чистим cookies
            if (status === 401 || status === 403) {
                return sessionRevokedResponse<PermissionsData>({success: false, data: []}, status);
            }

            if (status >= 500) {
                return respond<PermissionsData>({success: false, data: []}, 500);
            }

            return respond<PermissionsData>({success: false, data: []}, status);
        }
        return respond<PermissionsData>({success: false, data: []}, 500);
    }
}
