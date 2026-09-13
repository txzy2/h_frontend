// app/api/orgs/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

const MAIN_API_URL = process.env.MAIN_API_URL;

function errorResponse(message: string, status: number) {
    return NextResponse.json({success: false, data: message}, {status});
}

export async function GET(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);
    if (!accessToken) return errorResponse('Not authenticated', 401);

    const payload = JwtService.verify(accessToken);
    if (!payload) return errorResponse('Token expired', 401);

    try {
        const {data} = await axios.get(`${MAIN_API_URL}/orgs`, {
            headers: {Authorization: `Bearer ${accessToken}`}
        });
        return NextResponse.json({success: true, data: data.data});
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
                return NextResponse.json({success: false, data: null, message}, {status: 409});
            }

            return errorResponse(message, status);
        }
        return errorResponse('Internal server error', 500);
    }
}
