// app/api/users/permissions/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {CookieService} from '@/lib/auth/cookie.service';
import {PermissionsData, UserPermission} from '@/types/auth';

const AUTH_API_URL = process.env.AUTH_API_URL;

export async function GET(request: NextRequest): Promise<NextResponse<PermissionsData>> {
    const accessToken = CookieService.getAccessToken(request);

    if (!accessToken) {
        return NextResponse.json<PermissionsData>({success: false, data: []}, {status: 401});
    }

    try {
        const {data} = await axios.get<{
            success: boolean;
            data: UserPermission[] | {permissions: UserPermission[]};
        }>(`${AUTH_API_URL}/user/permissions`, {headers: {Authorization: `Bearer ${accessToken}`}});

        // Нормализуем — бэкенд может вернуть массив или объект с полем permissions
        const list = Array.isArray(data.data)
            ? data.data
            : ((data.data as {permissions: UserPermission[]}).permissions ?? []);

        return NextResponse.json<PermissionsData>({success: true, data: list});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            if (status === 401 || status === 403) {
                return NextResponse.json<PermissionsData>({success: false, data: []}, {status});
            }
        }
        return NextResponse.json<PermissionsData>({success: false, data: []}, {status: 500});
    }
}
