// app/api/locations/route.ts
import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';

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
    if (!/^\d{10,11}$/.test(body.phone)) return 'Телефон должен содержать 10 или 11 цифр';
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
                        phone: body.phone.trim(),
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
