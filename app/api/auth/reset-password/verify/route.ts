// app/api/auth/reset-password/verify/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';

const AUTH_API_URL = process.env.AUTH_API_URL;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.request_id?.trim() || !body.code?.trim()) {
            return NextResponse.json(
                {success: false, data: 'request_id и code обязательны'},
                {status: 400}
            );
        }

        const {data} = await axios.post(`${AUTH_API_URL}/auth/reset-password/verify`, {
            request_id: body.request_id,
            code: body.code
        });

        return NextResponse.json(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                error.response?.data?.data ??
                'Ошибка подтверждения';
            return NextResponse.json({success: false, data: message}, {status});
        }
        return NextResponse.json({success: false, data: 'Internal server error'}, {status: 500});
    }
}
