// lib/services/appearance.service.ts
import {DEFAULT_BRAND_COLOR} from '@/lib/org/branding.constants';
import {DB} from '../db-client';

export interface AppearanceData {
    orgId: number;
    brandColor: string;
    headerColor: string | null;
    hasLogo: boolean;
    logoVersion: string | null;
}

export interface AppearanceUpsertInput {
    brandColor: string;
    headerColor: string | null;
    /** Готовые байты логотипа (если загружен новый) */
    logo?: Buffer;
    /** MIME-тип нового логотипа */
    logoMime?: string;
    /** Убрать текущий логотип */
    removeLogo?: boolean;
}

export interface AppearanceLogo {
    data: Buffer;
    mime: string;
    version: number;
}

type AppearanceRow = {
    orgId: number;
    brandColor: string;
    headerColor: string | null;
    logoMime: string | null;
    updatedAt: Date;
};

export class AppearanceService {
    public constructor(private readonly db: DB) {}

    public async get(orgId: number): Promise<AppearanceData | null> {
        const row = await this.db.organizationAppearance.findUnique({where: {orgId}});
        return row ? this.toData(row) : null;
    }

    public async getLogo(orgId: number): Promise<AppearanceLogo | null> {
        const row = await this.db.organizationAppearance.findUnique({
            where: {orgId},
            select: {logo: true, logoMime: true, updatedAt: true}
        });

        if (!row?.logo || !row.logoMime) return null;

        return {
            data: row.logo,
            mime: row.logoMime,
            version: row.updatedAt.getTime()
        };
    }

    public async upsert(
        orgId: number,
        updatedBy: string,
        input: AppearanceUpsertInput
    ): Promise<AppearanceData> {
        const logo = input.removeLogo ? null : (input.logo ?? undefined);
        const logoMime = input.removeLogo ? null : (input.logoMime ?? undefined);

        const row = await this.db.organizationAppearance.upsert({
            where: {orgId},
            create: {
                orgId,
                brandColor: input.brandColor,
                headerColor: input.headerColor,
                updatedBy,
                logo: logo ?? null,
                logoMime: logoMime ?? null
            },
            update: {
                brandColor: input.brandColor,
                headerColor: input.headerColor,
                updatedBy,
                ...(logo !== undefined ? {logo} : {}),
                ...(logoMime !== undefined ? {logoMime} : {})
            }
        });

        return this.toData(row);
    }

    private toData(row: AppearanceRow): AppearanceData {
        return {
            orgId: row.orgId,
            brandColor: row.brandColor || DEFAULT_BRAND_COLOR,
            headerColor: row.headerColor,
            hasLogo: Boolean(row.logoMime),
            logoVersion: row.updatedAt.getTime().toString()
        };
    }
}
