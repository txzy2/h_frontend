import {Prisma} from '@prisma/client';

export const registrationDraftInclude = Prisma.validator<Prisma.RegistrationDraftInclude>()({
    organization: true,
    locations: true
});

export type RegistrationDraftWithRelations = Prisma.RegistrationDraftGetPayload<{
    include: typeof registrationDraftInclude;
}>;
