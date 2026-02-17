// lib/auth/jwt.service.ts
import jwt, {JsonWebTokenError, TokenExpiredError} from 'jsonwebtoken';
import {JwtPayload, UserData} from '@/types/auth';

/**
 * Ошибка конфигурации: неверный или отсутствующий JWT секрет
 * Не путать с истёкшим токеном — это ошибка 500, не 401
 */
export class JwtSecretError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JwtSecretError';
    }
}

export class JwtService {
    private static getSecret(): string {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret?.trim()) {
            throw new JwtSecretError('JWT_ACCESS_SECRET is not set or empty');
        }
        return secret;
    }

    /**
     * Декодирует JWT токен без проверки подписи.
     * Используется только для извлечения данных из уже верифицированного токена.
     */
    static decode(token: string): JwtPayload | null {
        try {
            return jwt.decode(token) as JwtPayload | null;
        } catch {
            return null;
        }
    }

    /**
     * Верифицирует JWT токен.
     *
     * @returns payload — если токен валиден
     * @returns null — если токен истёк (ожидаемая ситуация → 401)
     * @throws JwtSecretError — если секрет неверный или подпись повреждена (→ 500)
     */
    static verify(token: string): JwtPayload | null {
        const secret = this.getSecret();
        try {
            return jwt.verify(token, secret) as JwtPayload;
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return null;
            }
            if (error instanceof JsonWebTokenError) {
                throw new JwtSecretError(`JWT verification failed: ${error.message}`);
            }
            return null;
        }
    }

    /**
     * Извлекает данные пользователя из JWT payload
     */
    static extractUserData(payload: JwtPayload): UserData {
        return {
            userId: payload.sub,
            email: payload.email,
            login: payload.login,
            name: payload.name,
            role: payload.role,
            active: payload.active
        };
    }

    /**
     * Проверяет, истёк ли токен
     */
    static isExpired(payload: JwtPayload): boolean {
        return Math.floor(Date.now() / 1000) >= payload.exp;
    }
}
