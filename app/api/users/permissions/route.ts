import {PermissionsData, UserPermissionsResult} from '@/types/auth';
import axios from 'axios';

import {NextRequest, NextResponse} from 'next/server';

const AUTH_API_URL = process.env.AUTH_API_URL;

export async function GET(request: NextRequest): Promise<NextResponse<PermissionsData>> {
    try {
        console.log('try request api ' + `${AUTH_API_URL}/user/permissions`);
        console.log(request.cookies.get('access_token')?.value);
        const {data} = await axios.get<PermissionsData>(`${AUTH_API_URL}/user/permissions`, {
            headers: {
                Authorization: `Bearer ${request.cookies.get('access_token')?.value}`
            }
        });
        console.log('data permissions: ', data);
        return NextResponse.json<PermissionsData>({
            success: true,
            data: data.data
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json<PermissionsData>({success: false, data: []});
    }
}
