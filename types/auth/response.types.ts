// types/auth/response.types.ts
import {UserData} from './jwt.types';

// Внешний auth сервер
export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type AuthServerResponseData = {
    userId: string;
    tokens: AuthTokens;
};

export type AuthServerResponse = {
    success: boolean;
    data: AuthServerResponseData;
};

// Ответы Next.js API
export type LoginSuccessResponse = {
    success: true;
    data: UserData;
};

export type LoginErrorResponse = {
    success: false;
    data: string;
};

export type LoginResponse = LoginSuccessResponse | LoginErrorResponse;

export type UserPermissionsResult = {
    name: string;
    description: string | null;
};

export type PermissionsData = {
    success: boolean;
    data: UserPermissionsResult[];
};
