// app/api/onboarding/submit/route.ts
import {NextRequest} from 'next/server';
import axios from 'axios';
import {
    resolveSession,
    sessionFailureResponse,
    sessionResponder
} from '@/lib/auth/session.service';

import {db} from '@/lib/db-client';
import {OnboardingService} from '@/lib/services/onboarding.service';

const onboardingService = new OnboardingService(db);
const MAIN_API_URL = process.env.MAIN_API_URL;

// Статусы, при которых считаем, что организации у пользователя ещё нет:
// 401 — пользователь не создан в основном API
// 404/409 — организация не найдена или неактивна
const ORG_MISSING_STATUSES = [401, 404, 409];

function authHeaders(accessToken: string) {
    return {headers: {Authorization: `Bearer ${accessToken}`}};
}

/**
 * Возвращает id организации пользователя из основного API
 * или null, если организации ещё нет.
 */
async function getExistingOrgId(accessToken: string): Promise<number | null> {
    try {
        const {data} = await axios.get(`${MAIN_API_URL}/orgs`, authHeaders(accessToken));
        return data?.data?.id ?? null;
    } catch (error) {
        if (!axios.isAxiosError(error)) throw error;

        if (ORG_MISSING_STATUSES.includes(error.response?.status ?? 0)) return null;

        // 400 (ORG_STATUS_IS_PENDING) и прочие ошибки пробрасываем наверх
        throw error;
    }
}

export async function POST(request: NextRequest) {
    const session = await resolveSession(request);
    if (!session.ok) return sessionFailureResponse(session);

    const respond = sessionResponder(session);
    const accessToken = session.accessToken;

    try {
        await request.json();
        const draft = await onboardingService.getOrCreateDraft(session.payload.sub);

        // Проверяем полноту черновика
        if (!draft.organization)
            return respond({success: false, data: 'Данные организации не заполнены'}, 400);
        if (!draft.locations.length)
            return respond({success: false, data: 'Добавьте хотя бы одну точку'}, 400);
        if (draft.currentStep < 3)
            return respond({success: false, data: 'Не все шаги завершены'}, 400);

        const organization = draft.organization;
        const headers = authHeaders(accessToken);

        // 1. Проверяем, есть ли у пользователя уже созданная организация
        let orgId = await getExistingOrgId(accessToken);
        let justRegistered = false;

        // 2. Если организации нет — регистрируем её
        if (orgId === null) {
            try {
                const {data} = await axios.post(
                    `${MAIN_API_URL}/orgs/register`,
                    {
                        name: organization.name,
                        inn: organization.inn,
                        kpp: organization.kpp,
                        director: organization.director,
                        phone_number: organization.phoneNumber,
                        plan: organization.plan
                    },
                    headers
                );

                if (!data.success) {
                    return respond({success: false, data: data.message ?? 'Ошибка создания организации'}, 400);
                }

                orgId = data.data.id;
                justRegistered = true;
            } catch (error) {
                // Организация уже существует — получаем её id и просто добавляем точки
                if (axios.isAxiosError(error) && error.response?.status === 409) {
                    orgId = await getExistingOrgId(accessToken);
                    if (orgId === null) {
                        return respond(
                            {
                                success: false,
                                data: 'Организация с такими реквизитами уже зарегистрирована другой учётной записью'
                            },
                            409
                        );
                    }
                } else {
                    throw error;
                }
            }
        }

        if (orgId === null) {
            return respond({success: false, data: 'Не удалось определить организацию'}, 500);
        }

        // 3. Добавляем точки из черновика в организацию (в основном API)
        try {
            await axios.post(
                `${MAIN_API_URL}/locations/add`,
                {
                    org_id: orgId,
                    locations: draft.locations.map(loc => ({
                        name: loc.name,
                        address: loc.address,
                        phone: loc.phone || organization.phoneNumber,
                        active_places: loc.activePlaces
                    }))
                },
                headers
            );
        } catch (error) {
            // Только что созданная организация ещё на проверке — точки добавим позже
            if (justRegistered && axios.isAxiosError(error) && error.response?.status === 409) {
                return respond(
                    {
                        success: false,
                        data: 'Организация создана и ожидает проверки. Точки можно добавить после её активации'
                    },
                    409
                );
            }
            throw error;
        }

        await onboardingService.markCompleted(draft.id, orgId);

        return respond({success: true, data: 'Организация и точки сохранены'});
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status ?? 500;
            const message =
                error.response?.data?.error ??
                error.response?.data?.message ??
                'Ошибка запроса к сервису';
            return respond({success: false, data: message}, status);
        }
        return respond({success: false, data: 'Internal server error'}, 500);
    }
}
