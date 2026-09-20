import {
    registrationDraftInclude,
    RegistrationDraftWithRelations
} from '@/types/api/registration-draft.types';
import {DB} from '../db-client';
import {DraftStatus} from '@prisma/client';

export class RegistrationDraftRepo {
    constructor(private readonly db: DB) {}

    public async findActiveByUser(userId: string): Promise<RegistrationDraftWithRelations | null> {
        return this.db.registrationDraft.findFirst({
            where: {extUserId: userId, status: 'IN_PROGRESS'},
            include: registrationDraftInclude
        });
    }

    public async create(userId: string): Promise<RegistrationDraftWithRelations> {
        return this.db.registrationDraft.create({
            data: {extUserId: userId, status: 'IN_PROGRESS', currentStep: 1},
            include: registrationDraftInclude
        });
    }

    public async upsertOrganization(
        draftId: string,
        data: {
            name: string;
            inn: string;
            kpp: string;
            director: string;
            phoneNumber: string;
            plan: string;
        }
    ): Promise<void> {
        await this.db.draftOrganization.upsert({
            where: {draftId},
            create: {draftId, ...data},
            update: {...data}
        });
    }

    public async replaceLocations(
        draftId: string,
        locations: {
            name: string;
            address: string;
            phone?: string;
            activePlaces: number;
        }[]
    ): Promise<void> {
        await this.db.draftLocation.deleteMany({where: {draftId}});
        await this.db.draftLocation.createMany({
            data: locations.map(l => ({draftId, ...l}))
        });
    }

    public async updateStep(draftId: string, step: number): Promise<void> {
        await this.db.registrationDraft.update({
            where: {id: draftId},
            data: {currentStep: step}
        });
    }

    public async updateStatus(draftId: string, status: DraftStatus, orgId?: number): Promise<void> {
        await this.db.registrationDraft.update({
            where: {id: draftId},
            data: {status, ...(orgId !== undefined ? {orgId} : {})}
        });
    }

    public async findById(draftId: string): Promise<RegistrationDraftWithRelations | null> {
        return this.db.registrationDraft.findUnique({
            where: {id: draftId},
            include: registrationDraftInclude
        });
    }

    public async findCompletedByUser(
        userId: string
    ): Promise<RegistrationDraftWithRelations | null> {
        return this.db.registrationDraft.findFirst({
            where: {extUserId: userId, status: 'COMPLETED'},
            include: registrationDraftInclude
        });
    }
}
