// app/api/bookings/route.ts
//
// Создание брони. Доступно только роли Manager.
// Проксирует запрос в основной API (h_main_backend).

import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {isValidPhone, normalizePhone} from '@/lib/phone';

const MAIN_API_URL = process.env.MAIN_API_URL;

interface CreateBookingBody {
    locationId?: number;
    tableId?: number;
    guestName?: string;
    guestPhone?: string;
    guestsCount?: number;
    scheduledAt?: string;
    comment?: string;
}

function validateBooking(body: CreateBookingBody): string | null {
    if (!body.locationId || Number(body.locationId) < 1) {
        return 'Выберите точку';
    }
    if (!body.guestName?.trim()) {
        return 'Введите имя гостя';
    }
    if (!body.guestPhone?.trim() || !isValidPhone(body.guestPhone)) {
        return 'Введите телефон полностью';
    }
    if (
        !body.guestsCount ||
        !Number.isInteger(Number(body.guestsCount)) ||
        Number(body.guestsCount) < 1 ||
        Number(body.guestsCount) > 20
    ) {
        return 'Количество гостей должно быть от 1 до 20';
    }
    if (!body.scheduledAt) {
        return 'Укажите дату и время';
    }
    if (body.comment && body.comment.length > 255) {
        return 'Комментарий не должен быть длиннее 255 символов';
    }

    const scheduledAt = new Date(body.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
        return 'Неверная дата и время';
    }
    if (scheduledAt.getTime() < Date.now() - 5 * 60 * 1000) {
        return 'Нельзя создать бронь в прошлом';
    }

    return null;
}

export async function POST(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    if (session.payload.role !== 'Manager') {
        return respond({success: false, data: 'Создавать брони может только менеджер'}, 403);
    }

    const permission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.VIEW_ORG_RESERVATIONS
    );

    if (!permission.allowed) {
        if (permission.reason === 'unauthorized') {
            return sessionRevokedResponse(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (permission.reason === 'unavailable') {
            return respond({success: false, data: 'Не удалось проверить права доступа'}, 503);
        }
        return respond({success: false, data: 'Недостаточно прав для создания брони'}, 403);
    }

    try {
        const body: CreateBookingBody = await request.json();
        const validationError = validateBooking(body);

        if (validationError) {
            return respond({success: false, data: validationError}, 400);
        }

        const headers = {headers: {Authorization: `Bearer ${session.accessToken}`}};

        // Организация берётся из текущего пользователя, а не из тела запроса.
        const {data: orgData} = await axios.get(`${MAIN_API_URL}/orgs`, headers);
        const orgId = orgData?.data?.id;

        if (!orgId) {
            return respond({success: false, data: 'Организация не найдена'}, 409);
        }

        const {data} = await axios.post(
            `${MAIN_API_URL}/bookings/create`,
            {
                orgId,
                locationId: Number(body.locationId),
                ...(body.tableId ? {tableId: Number(body.tableId)} : {}),
                guestName: body.guestName!.trim(),
                guestPhone: normalizePhone(body.guestPhone!),
                guestsCount: Number(body.guestsCount),
                scheduledAt: new Date(body.scheduledAt!).toISOString(),
                ...(body.comment?.trim() ? {comment: body.comment.trim()} : {})
            },
            headers
        );

        return respond({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 502;

            if (status === 401) {
                return sessionRevokedResponse(
                    {success: false, data: 'Session expired or invalid'},
                    401
                );
            }

            const message =
                error.response?.data?.message ??
                error.response?.data?.error ??
                error.response?.data?.data ??
                'Не удалось создать бронь';

            return respond({success: false, data: message}, status);
        }

        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
