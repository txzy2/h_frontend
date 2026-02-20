import {RegistrationDraftWithRelations} from '@/types/api/registration-draft.types';
import {DB} from '../db-client';
import {RegistrationDraftRepo} from '../repositories/registration-draft.repo';

export class OnboardingService {
    private draftRepo: RegistrationDraftRepo;

    public constructor(private readonly db: DB) {
        this.draftRepo = new RegistrationDraftRepo(db);
    }

    public async getOrCreateDraft(userId: string): Promise<RegistrationDraftWithRelations> {
        // Сначала проверяем есть ли завершённый
        const completed = await this.draftRepo.findCompletedByUser(userId);
        if (completed) return completed;

        // Потом ищем активный
        let draft = await this.draftRepo.findActiveByUser(userId);
        if (!draft) {
            draft = await this.draftRepo.create(userId);
        }

        return draft;
    }

    public async saveOrganization(
        draftId: string,
        data: {
            name: string;
            inn: string;
            kpp: string;
            director: string;
            phoneNumber: string;
            plan: string;
        }
    ) {
        await this.draftRepo.upsertOrganization(draftId, data);
        await this.draftRepo.updateStep(draftId, 2);
    }

    public async saveLocations(
        draftId: string,
        locations: {
            name: string;
            address: string;
            phone?: string;
            activePlaces: number;
        }[]
    ) {
        await this.draftRepo.replaceLocations(draftId, locations);
        await this.draftRepo.updateStep(draftId, 3);
    }

    public async markCompleted(draftId: string, orgId: number) {
        await this.draftRepo.updateStatus(draftId, 'COMPLETED', orgId);
    }

    public async markFailed(draftId: string) {
        await this.draftRepo.updateStatus(draftId, 'FAILED');
    }
}
