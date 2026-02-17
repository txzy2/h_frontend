// lib/auth/auth.service.ts
import axios from 'axios';
import {
    LoginRequest,
    AuthServerResponse,
    RefreshServerResponse,
    AuthTokens,
    RawAuthTokens,
    UserData
} from '@/types/auth';
import {JwtService} from './jwt.service';

const AUTH_API_URL = process.env.AUTH_API_URL;

/**
 * Кастомная ошибка аутентификации
 */
export class AuthenticationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number
    ) {
        super(message);
        this.name = 'AuthenticationError';
    }
}

/**
 * Нормализует токены из snake_case (бэкенд) в camelCase (фронтенд)
 */
function normalizeTokens(raw: RawAuthTokens): AuthTokens {
    return {
        accessToken: raw.access_token,
        refreshToken: raw.refresh_token
    };
}

/**
 * Обрабатывает ошибки axios и пробрасывает AuthenticationError
 */
function handleAxiosError(error: unknown, fallbackMessage: string): never {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 500;
        const message =
            error.response?.data?.error ?? error.response?.data?.message ?? fallbackMessage;

        throw new AuthenticationError(message, status);
    }
    throw error;
}

export class AuthService {
    /**
     * Валидация данных для входа
     */
    static validateLoginRequest(data: LoginRequest): string | null {
        if (!data.login?.trim() || !data.password?.trim()) {
            return 'Login and password required';
        }
        return null;
    }

    /**
     * Аутентификация через внешний сервер
     */
    static async authenticate(credentials: LoginRequest): Promise<AuthTokens> {
        try {
            const {data} = await axios.post<AuthServerResponse>(
                `${AUTH_API_URL}/auth/login`,
                credentials
            );

            if (!data.success) {
                throw new AuthenticationError('Authentication failed', 401);
            }

            return normalizeTokens(data.data.tokens);
        } catch (error) {
            handleAxiosError(error, 'Authentication failed');
        }
    }

    /**
     * Обновление токенов
     */
    static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
        try {
            const {data} = await axios.post<RefreshServerResponse>(`${AUTH_API_URL}/auth/refresh`, {
                refresh_token: refreshToken
            });

            if (!data.success) {
                throw new AuthenticationError('Refresh failed', 401);
            }

            return normalizeTokens(data.data.tokens);
        } catch (error) {
            handleAxiosError(error, 'Refresh failed');
        }
    }

    /**
     * Выход из системы
     */
    static async logout(accessToken: string): Promise<void> {
        try {
            await axios.delete(`${AUTH_API_URL}/auth/logout`, {
                headers: {Authorization: `Bearer ${accessToken}`}
            });
        } catch (error) {
            handleAxiosError(error, 'Logout failed');
        }
    }

    /**
     * Получение данных текущего пользователя с бэкенда
     */
    static async getMe(accessToken: string): Promise<UserData> {
        const {data} = await axios.get<{success: boolean; data: Record<string, unknown>}>(
            `${AUTH_API_URL}/user/me`,
            {headers: {Authorization: `Bearer ${accessToken}`}}
        );

        if (!data.success) {
            throw new AuthenticationError('Session not found', 401);
        }

        const raw = data.data;

        // Бэкенд может вернуть sub вместо userId
        return {
            userId: (raw.userId ?? raw.sub) as string,
            email: raw.email as string,
            login: raw.login as string,
            name: raw.name as string,
            role: raw.role as string,
            active: raw.active as string
        };
    }

    /**
     * Получение данных пользователя из токена (без запроса к бэкенду)
     */
    static extractUserDataFromToken(accessToken: string): UserData {
        const payload = JwtService.decode(accessToken);
        if (!payload) {
            throw new AuthenticationError('Invalid token', 401);
        }
        return JwtService.extractUserData(payload);
    }
}
