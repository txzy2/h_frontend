// app/api/auth/login/route.ts
import {NextRequest, NextResponse} from 'next/server';
import {LoginRequest, LoginResponse, LoginSuccessResponse, LoginErrorResponse} from '@/types/auth';
import {AuthService, AuthenticationError} from '@/lib/auth/auth.service';
import {CookieService} from '@/lib/auth/cookie.service';
import {JwtService} from '@/lib/auth/jwt.service';

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse>> {
    try {
        const body: LoginRequest = await request.json();

        const validationError = AuthService.validateLoginRequest(body);
        if (validationError) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: validationError},
                {status: 400}
            );
        }

        // Аутентифицируем и получаем токены
        const tokens = await AuthService.authenticate(body);

        // Извлекаем данные пользователя из токена (без лишнего запроса к бэкенду)
        const userData = AuthService.extractUserDataFromToken(tokens.accessToken);
        const expiresAt = JwtService.getExpiresAt(tokens.accessToken);

        if (!expiresAt) {
            throw new AuthenticationError('Invalid token', 401);
        }

        const response = NextResponse.json<LoginSuccessResponse>({
            success: true,
            data: userData,
            expiresAt
        });

        CookieService.setAuthTokens(response, tokens);
        return response;
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: error.message},
                {status: error.statusCode}
            );
        }
        return NextResponse.json<LoginErrorResponse>(
            {success: false, data: 'Internal server error'},
            {status: 500}
        );
    }
}
