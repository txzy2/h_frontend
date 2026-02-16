// lib/auth/jwt.service.ts
import jwt, {JsonWebTokenError, TokenExpiredError} from 'jsonwebtoken';
import {JwtPayload, UserData} from '@/types/auth';

/** Ошибка конфигурации: неверный или отсутствующий JWT секрет (не путать с "токен истёк") */
export class JwtSecretError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'JwtSecretError';
    }
}

export class JwtService {
    /**
     * Декодирует JWT токен без проверки подписи
     */
    static decode(token: string): JwtPayload | null {
        try {
            return jwt.decode(token) as JwtPayload;
        } catch (error) {
            console.error('JWT decode error:', error);
            return null;
        }
    }

    /**
     * Проверяет JWT токен с проверкой подписи.
     * - Истёкший токен → возвращает null (ожидаемая ситуация, 401).
     * - Неверный секрет / повреждённая подпись → бросает JwtSecretError (500), чтобы не вызывать цикл "401 → логин → внешний API → 401".
     */
    static verify(token: string): JwtPayload | null {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret?.trim()) {
            throw new JwtSecretError('JWT_ACCESS_SECRET is not set or empty');
        }
        try {
            return jwt.verify(token, secret) as JwtPayload;
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                return null;
            }
            if (error instanceof JsonWebTokenError) {
                // invalid signature, jwt malformed, etc. — обычно неверный секрет
                console.error('JWT verification error (check JWT_ACCESS_SECRET):', error.message);
                throw new JwtSecretError(`JWT verification failed: ${error.message}`);
            }
            console.error('JWT verification error:', error);
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
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
    }
}
