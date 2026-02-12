// app/api/auth/login/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {LoginRequest, LoginResponse, LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
    try {
        // 1. Парсим и валидируем запрос
        const body: LoginRequest = await request.json();

        const validationError = AuthService.validateLoginRequest(body);
        if (validationError) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: validationError},
                {status: 400}
            );
        }

        // 2. Аутентифицируем через внешний сервер
        const authResponse = await AuthService.authenticate(body);

        // 3. Валидируем ответ и получаем токены
        const tokens = AuthService.validateAuthResponse(authResponse);

        // 4. Извлекаем данные пользователя из токена
        const userData = AuthService.extractUserDataFromToken(tokens.accessToken);

        // 5. Формируем ответ для клиента
        const response = NextResponse.json<LoginSuccessResponse>({
            success: true,
            data: userData
        });

        // 6. Устанавливаем токены в cookies
        CookieService.setAuthTokens(response, tokens);

        return response;
    } catch (error) {
        console.error('Login error:', error);

        // Обработка кастомных ошибок аутентификации
        if (error instanceof AuthenticationError) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: error.message},
                {status: error.statusCode}
            );
        }

        // Обработка неожиданных ошибок
        return NextResponse.json<LoginErrorResponse>(
            {success: false, data: 'Internal server error'},
            {status: 500}
        );
    }
}
