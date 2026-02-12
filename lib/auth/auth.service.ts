import axios, {AxiosError} from 'axios';
import {LoginRequest, AuthServerResponse, UserData, AuthTokens} from '@/types/auth';
import {JwtService} from './jwt.service';

export class AuthService {
    private static readonly AUTH_API_URL = process.env.AUTH_API_URL;

    /**
     * Валидация данных для входа
     */
    static validateLoginRequest(data: LoginRequest): string | null {
        if (!data.login || !data.password) {
            return 'Login and password required';
        }
        return null;
    }

    /**
     * Аутентификация через внешний сервер
     */
    static async authenticate(credentials: LoginRequest): Promise<AuthServerResponse> {
        try {
            const response = await axios.post<AuthServerResponse>(
                `${this.AUTH_API_URL}/auth/login`,
                credentials
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new AuthenticationError(
                    error.response?.data?.error || 'Authentication failed',
                    error.response?.status || 500
                );
            }
            throw error;
        }
    }

    /**
     * Извлекает данные пользователя из токена
     */
    static extractUserDataFromToken(accessToken: string): UserData {
        const payload = JwtService.decode(accessToken);

        if (!payload) {
            throw new AuthenticationError('Invalid token', 401);
        }

        return JwtService.extractUserData(payload);
    }

    /**
     * Проверяет успешность ответа от auth сервера
     */
    static validateAuthResponse(response: AuthServerResponse): AuthTokens {
        if (!response.success) {
            throw new AuthenticationError('Authentication failed', 401);
        }

        return response.data.tokens;
    }
}

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
