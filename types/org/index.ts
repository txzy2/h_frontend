// types/org/index.ts
import type {ApiResponse} from '@/types/auth';

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
