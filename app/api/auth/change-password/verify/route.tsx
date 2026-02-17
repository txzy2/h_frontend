// app/api/auth/change-password/verify/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';

const AUTH_API_URL = process.env.AUTH_API_URL;

export async function POST(request: NextRequest) {
    const accessToken = CookieService.getAccessToken(request);

    if (!accessToken) {
        return NextResponse.json({success: false, data: 'Not authenticated'}, {status: 401});
    }

    try {
        const body = await request.json();

        const {data} = await axios.post(`${AUTH_API_URL}/auth/change-password/verify`, body, {
            headers: {Authorization: `Bearer ${accessToken}`}
        });

        return NextResponse.json(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            return NextResponse.json(
                error.response?.data ?? {success: false, data: 'Verification failed'},
                {status: error.response?.status ?? 500}
            );
        }
        return NextResponse.json({success: false, data: 'Internal server error'}, {status: 500});
    }
}
