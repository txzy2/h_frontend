// app/api/auth/register/confirm/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {LoginErrorResponse} from '@/types/auth';

const AUTH_API_URL = process.env.AUTH_API_URL;

interface ConfirmBody {
    request_id: string;
    code: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: ConfirmBody = await request.json();

        if (!body.request_id?.trim() || !body.code?.trim()) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: 'request_id и code обязательны'},
                {status: 400}
            );
        }

        const {data} = await axios.post(`${AUTH_API_URL}/auth/register/verify`, {
            request_id: body.request_id,
            code: body.code
        });

        if (!data.success) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: data.data?.message ?? 'Ошибка подтверждения'},
                {status: 400}
            );
        }

        return NextResponse.json({
            success: true,
            data: {message: data.data.message}
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.message ??
                error.response?.data?.error ??
                'Ошибка подтверждения';
            return NextResponse.json<LoginErrorResponse>({success: false, data: message}, {status});
        }

        return NextResponse.json<LoginErrorResponse>(
            {success: false, data: 'Internal server error'},
            {status: 500}
        );
    }
}
