// app/api/bookings/[id]/route.ts
//
// Детали брони и действия менеджера: продление, закрытие, отмена.
// Доступно только роли Manager.

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
import {BookingDetails, BookingDetailsResponse} from '@/types/bookings';

const MAIN_API_URL = process.env.MAIN_API_URL;

type ActionType = 'start' | 'extend' | 'close' | 'cancel';

interface ActionBody {
    action?: ActionType;
    minutes?: number;
    amount?: number | string;
    comment?: string;
    reason?: string;
}

async function authorize(request: NextRequest, allowedRoles: string[]) {
    const session = await resolveSession(request);
    if (!session.ok) {
        return {
            error: sessionFailureResponse(session) as NextResponse<BookingDetailsResponse>
        };
    }

    const respond = sessionResponder(session);

    if (!allowedRoles.includes(session.payload.role)) {
        return {
            error: respond<BookingDetailsResponse>(
                {success: false, data: 'Недостаточно прав'},
                403
            )
        };
    }

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_RESERVATIONS
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return {
                error: sessionRevokedResponse<BookingDetailsResponse>(
                    {success: false, data: 'Session expired or invalid'},
                    401
                )
            };
        }
        if (permission.reason === 'unavailable') {
            return {
                error: respond<BookingDetailsResponse>(
                    {success: false, data: 'Не удалось проверить права доступа'},
                    503
                )
            };
        }
        return {
            error: respond<BookingDetailsResponse>(
                {success: false, data: 'Недостаточно прав'},
                403
            )
        };
    }

    return {session, respond};
}

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

export async function GET(
    request: NextRequest,
    context: {params: Promise<{id: string}>}
): Promise<NextResponse<BookingDetailsResponse>> {
    const auth = await authorize(request, ['Manager', 'Admin', 'SuperUser']);
    if ('error' in auth) return auth.error as NextResponse<BookingDetailsResponse>;

    const {params} = context;
    const {id} = await params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId < 1) {
        return auth.respond<BookingDetailsResponse>(
            {success: false, data: 'Неверный идентификатор брони'},
            400
        );
    }

    try {
        const {data} = await axios.get<{success: true; data: BookingDetails}>(
            `${MAIN_API_URL}/bookings/${bookingId}`,
            {headers: {Authorization: `Bearer ${auth.session.accessToken}`}}
        );

        return auth.respond<BookingDetailsResponse>({success: true, data: data.data});
    } catch (error) {
        const {status, message} = upstreamError(error, 'Не удалось загрузить бронь');

        if (status === 401) {
            return sessionRevokedResponse<BookingDetailsResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }

        return auth.respond<BookingDetailsResponse>({success: false, data: message}, status);
    }
}

export async function PATCH(
    request: NextRequest,
    context: {params: Promise<{id: string}>}
): Promise<NextResponse<BookingDetailsResponse>> {
    const auth = await authorize(request, ['Manager']);
    if ('error' in auth) return auth.error as NextResponse<BookingDetailsResponse>;

    const {params} = context;
    const {id} = await params;
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId < 1) {
        return auth.respond<BookingDetailsResponse>(
            {success: false, data: 'Неверный идентификатор брони'},
            400
        );
    }

    try {
        const body: ActionBody = await request.json();
        let endpoint: string;
        let payload: Record<string, unknown>;

        if (body.action === 'start') {
            endpoint = 'start';
            payload = {};
        } else if (body.action === 'extend') {
            const minutes = Number(body.minutes);

            if (!Number.isInteger(minutes) || minutes < 15 || minutes > 240) {
                return auth.respond<BookingDetailsResponse>(
                    {success: false, data: 'Продлить можно на 15–240 минут'},
                    400
                );
            }

            endpoint = 'extend';
            payload = {
                minutes,
                ...(body.comment?.trim() ? {comment: body.comment.trim()} : {})
            };
        } else if (body.action === 'close') {
            const amount =
                body.amount === undefined || body.amount === ''
                    ? undefined
                    : Number(body.amount);

            if (
                amount !== undefined &&
                (!Number.isInteger(amount) || amount < 0 || amount > 1_000_000)
            ) {
                return auth.respond<BookingDetailsResponse>(
                    {success: false, data: 'Сумма чека должна быть от 0 до 1 000 000 ₽'},
                    400
                );
            }

            endpoint = 'close';
            payload = {
                ...(amount !== undefined ? {amount} : {}),
                ...(body.comment?.trim() ? {comment: body.comment.trim()} : {})
            };
        } else if (body.action === 'cancel') {
            const reason = body.reason?.trim() ?? '';

            if (reason.length < 3 || reason.length > 500) {
                return auth.respond<BookingDetailsResponse>(
                    {success: false, data: 'Укажите причину отмены (3–500 символов)'},
                    400
                );
            }

            endpoint = 'cancel';
            payload = {reason};
        } else {
            return auth.respond<BookingDetailsResponse>(
                {success: false, data: 'Неизвестное действие'},
                400
            );
        }

        const {data} = await axios.patch<{success: true; data: BookingDetails}>(
            `${MAIN_API_URL}/bookings/${bookingId}/${endpoint}`,
            payload,
            {headers: {Authorization: `Bearer ${auth.session.accessToken}`}}
        );

        return auth.respond<BookingDetailsResponse>({success: true, data: data.data});
    } catch (error) {
        const {status, message} = upstreamError(error, 'Не удалось выполнить действие');

        if (status === 401) {
            return sessionRevokedResponse<BookingDetailsResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }

        return auth.respond<BookingDetailsResponse>({success: false, data: message}, status);
    }
}
