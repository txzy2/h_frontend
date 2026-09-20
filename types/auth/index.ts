// types/auth/index.ts
export * from './request.types';
export * from './response.types';
export * from './jwt.types';
// ============================================================
// Базовые типы ответов API
// ============================================================

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

// ============================================================
// Токены
// ============================================================

/** Токены в snake_case (приходят с бэкенда) */
export interface RawAuthTokens {
    access_token: string;
    refresh_token: string;
}

// ============================================================
// JWT Payload
// ============================================================

export interface JwtPayload {
    sub: string;
    email: string;
    login: string;
    name: string;
    role: string;
    active: string;
    sid: string;
    exp: number;
    iat: number;
}

// ============================================================
// Пользователь
// ============================================================

export interface UserData {
    userId: string;
    email: string;
    login: string;
    name: string;
    role: string;
    active: string;
}

// ============================================================
// Auth запросы / ответы
// ============================================================

export interface LoginRequest {
    login: string;
    password: string;
}

/** Ответ бэкенда на /auth/login */
export interface AuthServerResponse {
    success: boolean;
    data: {
        userId: string;
        tokens: RawAuthTokens;
    };
}

/** Ответ бэкенда на /auth/refresh (ApiResponse.ok<Tokens>) */
export interface RefreshServerResponse {
    success: boolean;
    data: RawAuthTokens;
}

// ============================================================
// Permissions
// ============================================================
export interface UserPermission {
    name: string;
    description: string | null; // null вместо undefined — совместимо с UserPermissionsResult
}

export type PermissionsData = ApiResponse<UserPermission[]>;

/**
 * @deprecated Используйте UserPermission
 * Оставлен для обратной совместимости со store до миграции
 */
export type UserPermissionsResult = UserPermission;

// ============================================================
// Типизированные ответы Next.js route handlers
// ============================================================

export type LoginSuccessResponse = {
    success: true;
    data: UserData;
    /** Unix time (секунды), когда истекает access-токен */
    expiresAt: number;
};
export type LoginErrorResponse = {
    success: false;
    data: string;
};
export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export type LogoutResponse = ApiResponse<string>;

/** GET /api/auth/me — текущая сессия */
export type SessionSuccessResponse = LoginSuccessResponse;
export type SessionErrorResponse = LoginErrorResponse;
export type SessionResponse = SessionSuccessResponse | SessionErrorResponse;

/** POST /api/auth/refresh */
export type RefreshSuccessResponse = {
    success: true;
    data: string;
    /** Unix time (секунды), когда истекает новый access-токен */
    expiresAt: number;
};
export type RefreshErrorResponse = {
    success: false;
    data: string;
};
export type RefreshResponse = RefreshSuccessResponse | RefreshErrorResponse;
