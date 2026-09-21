// app/api/org/appearance/route.ts
//
// Кастомизация интерфейса организации: хранение в БД фронта.
// Организация берётся из основного API по access-токену пользователя,
// поэтому чужой orgId подставить нельзя.

import {NextRequest, NextResponse} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder,
    sessionRevokedResponse
} from '@/lib/auth/session.service';
import {db} from '@/lib/db-client';
import {AppearanceService} from '@/lib/services/appearance.service';
import {checkUserPermission} from '@/lib/services/permission.service';
import {PERMISSIONS} from '@/lib/auth/permissions.constants';
import {
    isValidHexColor,
    LOGO_MIME_TYPES,
    MAX_LOGO_BYTES,
    normalizeHexColor
} from '@/lib/org/branding.constants';
import {
    OrganizationAppearanceResponse,
    UpdateOrganizationAppearanceResponse
} from '@/types/org';

const MAIN_API_URL = process.env.MAIN_API_URL;
const appearanceService = new AppearanceService(db);

const ORG_MISSING_STATUSES = [401, 404, 409];

/** Возвращает организацию пользователя из основного API */
async function getOrg(accessToken: string): Promise<{id: number; name: string} | null> {
    try {
        const {data} = await axios.get(`${MAIN_API_URL}/orgs`, {
            headers: {Authorization: `Bearer ${accessToken}`}
        });
        const org = data?.data;
        if (typeof org?.id !== 'number') return null;
        return {id: org.id, name: typeof org.name === 'string' ? org.name : ''};
    } catch (error) {
        if (!axios.isAxiosError(error)) throw error;
        const status = error.response?.status ?? 0;
        if (ORG_MISSING_STATUSES.includes(status)) return null;
        throw error;
    }
}

type ParsedInput = {
    brandColor: string;
    headerColor: string | null;
    logo?: Buffer;
    logoMime?: string;
    removeLogo?: boolean;
};

function parseInput(body: unknown): {ok: true; value: ParsedInput} | {ok: false; error: string} {
    if (!body || typeof body !== 'object') {
        return {ok: false, error: 'Некорректные данные'};
    }

    const raw = body as Record<string, unknown>;

    if (!isValidHexColor(raw.brandColor)) {
        return {ok: false, error: 'Некорректный основной цвет'};
    }

    let headerColor: string | null = null;
    if (raw.headerColor !== null && raw.headerColor !== undefined) {
        if (!isValidHexColor(raw.headerColor)) {
            return {ok: false, error: 'Некорректный цвет шапки'};
        }
        headerColor = normalizeHexColor(raw.headerColor);
    }

    let logo: Buffer | undefined;
    let logoMime: string | undefined;

    if (typeof raw.logoDataUrl === 'string' && raw.logoDataUrl.length > 0) {
        const match = /^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/i.exec(raw.logoDataUrl);
        if (!match) {
            return {ok: false, error: 'Логотип должен быть изображением'};
        }

        const mime = match[1].toLowerCase();
        if (!(LOGO_MIME_TYPES as readonly string[]).includes(mime)) {
            return {ok: false, error: 'Допустимые форматы логотипа: PNG, JPEG, WebP'};
        }

        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.byteLength === 0) {
            return {ok: false, error: 'Пустой файл логотипа'};
        }
        if (buffer.byteLength > MAX_LOGO_BYTES) {
            return {ok: false, error: 'Логотип больше 256 КБ'};
        }

        logo = buffer;
        logoMime = mime;
    }

    return {
        ok: true,
        value: {
            brandColor: normalizeHexColor(raw.brandColor),
            headerColor,
            logo,
            logoMime,
            removeLogo: raw.removeLogo === true
        }
    };
}

export async function GET(
    request: NextRequest
): Promise<NextResponse<OrganizationAppearanceResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<OrganizationAppearanceResponse>;
    }

    const respond = sessionResponder(session);

    try {
        const org = await getOrg(session.accessToken);
        if (org === null) {
            return respond<OrganizationAppearanceResponse>({
                success: true,
                data: null,
                orgName: null
            });
        }

        const appearance = await appearanceService.get(org.id);
        return respond<OrganizationAppearanceResponse>({
            success: true,
            data: appearance,
            orgName: org.name || null
        });
    } catch (error) {
        console.error('org appearance GET error:', error);
        return respond<OrganizationAppearanceResponse>(
            {success: false, data: 'Сервис организаций недоступен'},
            503
        );
    }
}

export async function PUT(
    request: NextRequest
): Promise<NextResponse<UpdateOrganizationAppearanceResponse>> {
    const session = await resolveSession(request);
    if (!session.ok) {
        return sessionFailureResponse(session) as NextResponse<UpdateOrganizationAppearanceResponse>;
    }

    const respond = sessionResponder(session);

    // Проверяем права в auth-сервисе (h_backend), а не роль на клиенте.
    // Цвета — org.appearance.edit, логотип — отдельное право org.appearance.logo.
    const editPermission = await checkUserPermission(
        session.accessToken,
        PERMISSIONS.ORG_APPEARANCE_EDIT
    );

    if (!editPermission.allowed) {
        if (editPermission.reason === 'unauthorized') {
            return sessionRevokedResponse<UpdateOrganizationAppearanceResponse>(
                {success: false, data: 'Session expired or invalid'},
                401
            );
        }
        if (editPermission.reason === 'unavailable') {
            return respond<UpdateOrganizationAppearanceResponse>(
                {success: false, data: 'Не удалось проверить права доступа'},
                503
            );
        }
        return respond<UpdateOrganizationAppearanceResponse>(
            {success: false, data: 'Недостаточно прав для настройки оформления'},
            403
        );
    }

    try {
        const org = await getOrg(session.accessToken);
        if (org === null) {
            return respond<UpdateOrganizationAppearanceResponse>(
                {success: false, data: 'Организация не найдена'},
                409
            );
        }

        const body = await request.json();
        const parsed = parseInput(body);

        if (!parsed.ok) {
            return respond<UpdateOrganizationAppearanceResponse>(
                {success: false, data: parsed.error},
                400
            );
        }

        // Логотип — отдельное право
        const touchesLogo = Boolean(parsed.value.logo || parsed.value.removeLogo);
        if (touchesLogo) {
            const logoPermission = await checkUserPermission(
                session.accessToken,
                PERMISSIONS.ORG_APPEARANCE_LOGO
            );

            if (!logoPermission.allowed) {
                if (logoPermission.reason === 'unauthorized') {
                    return sessionRevokedResponse<UpdateOrganizationAppearanceResponse>(
                        {success: false, data: 'Session expired or invalid'},
                        401
                    );
                }
                if (logoPermission.reason === 'unavailable') {
                    return respond<UpdateOrganizationAppearanceResponse>(
                        {success: false, data: 'Не удалось проверить права доступа'},
                        503
                    );
                }
                return respond<UpdateOrganizationAppearanceResponse>(
                    {success: false, data: 'Логотип может изменить только администратор организации'},
                    403
                );
            }
        }

        const appearance = await appearanceService.upsert(
            org.id,
            session.payload.sub,
            parsed.value
        );

        return respond<UpdateOrganizationAppearanceResponse>({success: true, data: appearance});
    } catch (error) {
        console.error('org appearance PUT error:', error);
        return respond<UpdateOrganizationAppearanceResponse>(
            {success: false, data: 'Не удалось сохранить оформление'},
            503
        );
    }
}
