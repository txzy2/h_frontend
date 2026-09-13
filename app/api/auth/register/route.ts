// app/api/auth/register/route.ts
import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {LoginErrorResponse} from '@/types/auth';

const AUTH_API_URL = process.env.AUTH_API_URL;

interface RegisterRequest {
    name: string;
    login: string;
    email: string;
    password: string;
    confirm_password: string;
}

interface AuthRegisterResponse {
    success: boolean;
    data: {
        message: string;
        request_id: string;
        TTL: number;
    };
}

function validateRegisterRequest(data: RegisterRequest): string | null {
    if (!data.name?.trim()) return 'Введите имя';
    if (!data.login?.trim()) return 'Введите логин';
    if (!data.email?.trim()) return 'Введите email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return 'Некорректный email';
    if (!data.password?.trim()) return 'Введите пароль';
    if (data.password.length < 8) return 'Минимум 8 символов';
    if (!/(?=.*\d)/.test(data.password)) return 'Пароль должен содержать цифру';
    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(data.password))
        return 'Пароль должен содержать спецсимвол';
    if (data.password !== data.confirm_password) return 'Пароли не совпадают';
    return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body: RegisterRequest = await request.json();

        const validationError = validateRegisterRequest(body);
        if (validationError) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: validationError},
                {status: 400}
            );
        }

        // Запрос к внешнему auth-сервису
        const {data} = await axios.post<AuthRegisterResponse>(
            `${AUTH_API_URL}/auth/register`,
            {
                name: body.name,
                login: body.login,
                email: body.email,
                password: body.password,
                confirm_password: body.confirm_password,
                role: 'Admin'
            }
        );

        if (!data.success) {
            return NextResponse.json<LoginErrorResponse>(
                {success: false, data: 'Ошибка регистрации'},
                {status: 400}
            );
        }

        // Регистрация всегда требует подтверждения email
        // Возвращаем request_id и TTL на фронтенд
        return NextResponse.json({
            success: true,
            data: {
                request_id: data.data.request_id,
                ttl: data.data.TTL
            }
        });
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.message ??
                error.response?.data?.error ??
                'Ошибка регистрации';
            return NextResponse.json<LoginErrorResponse>({success: false, data: message}, {status});
        }

        return NextResponse.json<LoginErrorResponse>(
            {success: false, data: 'Internal server error'},
            {status: 500}
        );
    }
}
