// app/api/org/logo/route.ts
//
// Отдаёт логотип организации текущего пользователя.
// Используется в <img src="/api/org/logo?v=...">.

import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {attachSession, resolveSession} from '@/lib/auth/session.service';
import {db} from '@/lib/db-client';
import {AppearanceService} from '@/lib/services/appearance.service';

const MAIN_API_URL = process.env.MAIN_API_URL;
const appearanceService = new AppearanceService(db);
const ORG_MISSING_STATUSES = [401, 404, 409];

async function getOrgId(accessToken: string): Promise<number | null> {
    try {
        const {data} = await axios.get(`${MAIN_API_URL}/orgs`, {
            headers: {Authorization: `Bearer ${accessToken}`}
        });
        return typeof data?.data?.id === 'number' ? data.data.id : null;
    } catch (error) {
        if (!axios.isAxiosError(error)) throw error;
        const status = error.response?.status ?? 0;
        if (ORG_MISSING_STATUSES.includes(status)) return null;
        throw error;
    }
}

export async function GET(request: NextRequest): Promise<Response> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return NextResponse.json({success: false, data: 'Not authenticated'}, {status: 401});
    }

    try {
        const orgId = await getOrgId(session.accessToken);
        if (orgId === null) {
            return attachSession(
                NextResponse.json({success: false, data: 'No organization'}, {status: 404}),
                session
            );
        }

        const logo = await appearanceService.getLogo(orgId);
        if (!logo) {
            return attachSession(
                NextResponse.json({success: false, data: 'No logo'}, {status: 404}),
                session
            );
        }

        const etag = `"logo-${logo.version}"`;

        if (request.headers.get('if-none-match') === etag) {
            return attachSession(
                new NextResponse(null, {status: 304, headers: {ETag: etag}}),
                session
            );
        }

        return attachSession(
            new NextResponse(new Uint8Array(logo.data), {
                status: 200,
                headers: {
                    'Content-Type': logo.mime,
                    'Content-Length': String(logo.data.byteLength),
                    'Cache-Control': 'private, max-age=300',
                    ETag: etag
                }
            }),
            session
        );
    } catch (error) {
        console.error('org logo error:', error);
        return attachSession(
            NextResponse.json({success: false, data: 'Logo unavailable'}, {status: 503}),
            session
        );
    }
}
