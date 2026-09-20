// types/org/index.ts
import type {ApiResponse} from '@/types/auth';
import type {OrgTheme} from '@/lib/org/branding.constants';

export interface Organization {
    id: number;
    name: string;
    inn: string;
    kpp: string;
    director: string;
    status: 'Active' | 'Inactive' | string;
    uniqueHash: string;
    updatedBy: string | null;
    createdAt: string;
    updatedAt: string;
    locations: OrganizationLocation[];
}

export interface OrganizationLocation {
    id: number;
    name: string;
    address: string;
    phone: string | null;
    activePlaces: number;
    status: string;
}

export type OrganizationResponse = ApiResponse<Organization>;

// ============================================================
// Кастомизация интерфейса организации
// ============================================================

export type {OrgTheme};

export interface OrganizationAppearance {
    orgId: number;
    brandColor: string;
    headerColor: string | null;
    hasLogo: boolean;
    logoVersion: string | null;
}

export interface UpdateOrganizationAppearanceInput {
    brandColor: string;
    headerColor: string | null;
    /** data:image/png;base64,... — новый логотип */
    logoDataUrl?: string;
    removeLogo?: boolean;
}

export type OrganizationAppearanceResponse =
    | {success: true; data: OrganizationAppearance | null; orgName: string | null}
    | {success: false; data: string};
export type UpdateOrganizationAppearanceResponse =
    | {success: true; data: OrganizationAppearance}
    | {success: false; data: string};
