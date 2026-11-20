// app/api/locations/route.ts
import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';
import {isValidPhone, normalizePhone} from '@/lib/phone';

const MAIN_API_URL = process.env.MAIN_API_URL;

interface LocationBody {
    name: string;
    address: string;
    phone: string;
    activePlaces: number;
}

function validateLocation(body: LocationBody): string | null {
    if (!body.name?.trim()) return 'Введите название точки';
    if (!body.address?.trim()) return 'Введите адрес точки';
    if (!body.phone?.trim()) return 'Введите телефон точки';
    if (!isValidPhone(body.phone)) return 'Введите телефон полностью';
    if (!body.activePlaces || Number(body.activePlaces) < 1) return 'Укажите количество мест';
    if (Number(body.activePlaces) > 50) return 'Максимум 50 активных мест';
    return null;
}

export async function POST(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    try {
        const body: LocationBody = await request.json();

        const validationError = validateLocation(body);
        if (validationError) return respond({success: false, data: validationError}, 400);

        const headers = {headers: {Authorization: `Bearer ${session.accessToken}`}};

        // Точка добавляется только к организации текущего пользователя
        const {data: orgData} = await axios.get(`${MAIN_API_URL}/orgs`, headers);
        const orgId = orgData?.data?.id;
        if (!orgId) return respond({success: false, data: 'Организация не найдена'}, 409);

        await axios.post(
            `${MAIN_API_URL}/locations/add`,
            {
                org_id: orgId,
                locations: [
                    {
                        name: body.name.trim(),
                        address: body.address.trim(),
                        phone: normalizePhone(body.phone),
                        active_places: Number(body.activePlaces)
                    }
                ]
            },
            headers
        );

        return respond({success: true, data: 'Точка добавлена'});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка запроса к сервису';
            return respond({success: false, data: message}, status);
        }
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}

interface UpdateLocationBody extends LocationBody {
    id?: number;
    status?: string;
}

export async function PATCH(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);

    if (!['Admin', 'SuperUser'].includes(session.payload.role)) {
        return respond({success: false, data: 'Недостаточно прав для редактирования точки'}, 403);
    }

    try {
        const body: UpdateLocationBody = await request.json();
        const locationId = Number(body.id);

        if (!Number.isInteger(locationId) || locationId < 1) {
            return respond({success: false, data: 'Неверный идентификатор точки'}, 400);
        }

        const validationError = validateLocation(body);
        if (validationError) return respond({success: false, data: validationError}, 400);

        const allowedStatuses = ['Active', 'Inactive', 'Pending', 'Closed'];
        if (body.status !== undefined && !allowedStatuses.includes(body.status)) {
            return respond({success: false, data: 'Неверный статус точки'}, 400);
        }

        const headers = {headers: {Authorization: `Bearer ${session.accessToken}`}};
        const {data: orgData} = await axios.get(`${MAIN_API_URL}/orgs`, headers);
        const locations = orgData?.data?.locations ?? [];

        if (!locations.some((location: {id: number}) => location.id === locationId)) {
            return respond({success: false, data: 'Точка не найдена'}, 404);
        }

        const {data} = await axios.patch(
            `${MAIN_API_URL}/locations/${locationId}`,
            {
                name: body.name.trim(),
                address: body.address.trim(),
                phone: normalizePhone(body.phone),
                active_places: Number(body.activePlaces),
                ...(body.status ? {status: body.status} : {})
            },
            headers
        );

        return respond({success: true, data: data.data});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Не удалось обновить точку';
            return respond({success: false, data: message}, status);
        }
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
