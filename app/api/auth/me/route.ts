// app/api/auth/me/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {AuthService} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import {JwtService} from '@/lib/auth/jwt.service';

export async function GET(
    request: NextRequest
): Promise<NextResponse<LoginSuccessResponse | LoginErrorResponse>> {
    try {
        // 1. Читаем accessToken из cookies
        const accessToken = request.cookies.get('access_token')?.value;

        if (!accessToken) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: 'Not authenticated'},
                {status: 401}
            );
        }

        // 2. Проверяем токен (валидация + истечение срока)
        const isValid = JwtService.verify(accessToken);

        if (!isValid) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: 'Token expired'},
                {status: 401}
            );
        }

        // 3. Извлекаем данные пользователя
        const userData = AuthService.extractUserDataFromToken(accessToken);

        // 4. Возвращаем успешный ответ
        return NextResponse.json<LoginSuccessResponse>({success: true, data: userData});
    } catch (err) {
        console.error('Error in /me:', err);
        return NextResponse.json<LoginErrorResponse>(
            {success: false, data: 'Internal server error'},
            {status: 500}
        );
    }
}
