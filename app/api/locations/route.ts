// app/api/locations/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

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
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const body: LocationBody = await request.json();

        const validationError = validateLocation(body);
        if (validationError) return errorResponse(validationError, 400);

        const headers = {headers: {Authorization: `Bearer ${accessToken}`}};

        // Точка добавляется только к организации текущего пользователя
        const {data: orgData} = await axios.get(`${MAIN_API_URL}/orgs`, headers);
        const orgId = orgData?.data?.id;
        if (!orgId) return errorResponse('Организация не найдена', 409);

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

        return NextResponse.json({success: true, data: 'Точка добавлена'});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка запроса к сервису';
            return errorResponse(message, status);
        }
        return errorResponse('Internal server error', 500);
    }
}

function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}
