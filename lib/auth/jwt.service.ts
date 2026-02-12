// lib/auth/jwt.service.ts
import jwt from 'jsonwebtoken';
import {JwtPayload, UserData} from '@/types/auth';

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
     * Проверяет JWT токен с проверкой подписи
     */
    static verify(token: string, secret: string): JwtPayload | null {
        try {
            return jwt.verify(token, secret) as JwtPayload;
        } catch (error) {
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
            role: payload.role
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
