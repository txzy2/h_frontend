// app/api/plans/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';

const MAIN_API_URL = process.env.MAIN_API_URL;

export async function GET(request: NextRequest) {
    try {
        const {data} = await axios.get(`${MAIN_API_URL}/plans`);
        return NextResponse.json({success: true, data: data.data});
    } catch {
        return NextResponse.json({success: false, data: 'Ошибка загрузки планов'}, {status: 500});
    }
}
