// app/api/floor-plan/route.ts
//
// Визуальный план зала: чтение и сохранение JSON-лейаута.
// Доступно только администраторам организации.

import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {FloorPlanApi, FloorPlanLayout, FloorPlanResponse} from '@/types/floor-plan';

const MAIN_API_URL = process.env.MAIN_API_URL;
const ALLOWED_ROLES = ['Admin', 'SuperUser'];

function upstreamError(error: unknown, fallback: string): {status: number; message: string} {
    if (axios.isAxiosError(error)) {
        return {
            status: error.response?.status ?? 502,
            message:
                error.response?.data?.message ??
                error.response?.data?.data ??
                error.response?.data?.error ??
                fallback
        };
    }

    return {status: 500, message: 'Internal server error'};
}

export async function GET(request: NextRequest): Promise<NextResponse<FloorPlanApi>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<FloorPlanApi>;
    }

    const respond = sessionResponder(session);

    if (!ALLOWED_ROLES.includes(session.payload.role)) {
        return respond<FloorPlanApi>(
            {success: false, data: 'Доступно только администраторам'},
            403
        );
    }

    const locationId = Number(request.nextUrl.searchParams.get('locationId'));
    if (!Number.isInteger(locationId) || locationId < 1) {
        return respond<FloorPlanApi>(
            {success: false, data: 'Не выбран зал или точка'},
            400
        );
    }

    try {
        const {data} = await axios.get<{success: true; data: FloorPlanResponse}>(
            `${MAIN_API_URL}/locations/${locationId}/floor-plan`,
            {headers: {Authorization: `Bearer ${session.accessToken}`}}
        );

        return respond<FloorPlanApi>({success: true, data: data.data});
    } catch (error) {
        const {status, message} = upstreamError(error, 'Не удалось загрузить план зала');

        if (status === 401) {
            return sessionRevokedResponse<FloorPlanApi>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }

        return respond<FloorPlanApi>({success: false, data: message}, status);
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse<FloorPlanApi>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<FloorPlanApi>;
    }

    const respond = sessionResponder(session);

    if (!ALLOWED_ROLES.includes(session.payload.role)) {
        return respond<FloorPlanApi>(
            {success: false, data: 'Доступно только администраторам'},
            403
        );
    }

    try {
        const body = (await request.json()) as {
            locationId?: number;
            layout?: FloorPlanLayout;
        };
        const locationId = Number(body.locationId);

        if (!Number.isInteger(locationId) || locationId < 1) {
            return respond<FloorPlanApi>(
                {success: false, data: 'Не выбран зал или точка'},
                400
            );
        }
        if (!body.layout || typeof body.layout !== 'object') {
            return respond<FloorPlanApi>(
                {success: false, data: 'Некорректный лейаут плана'},
                400
            );
        }

        const {data} = await axios.put<{success: true; data: FloorPlanResponse}>(
            `${MAIN_API_URL}/locations/${locationId}/floor-plan`,
            {layout: body.layout},
            {headers: {Authorization: `Bearer ${session.accessToken}`}}
        );

        return respond<FloorPlanApi>({success: true, data: data.data});
    } catch (error) {
        const {status, message} = upstreamError(error, 'Не удалось сохранить план зала');

        if (status === 401) {
            return sessionRevokedResponse<FloorPlanApi>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }

        return respond<FloorPlanApi>({success: false, data: message}, status);
    }
}
