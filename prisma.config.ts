import {defineConfig} from 'prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

console.log('DATABASE_URL:', process.env.DATABASE_URL);

export default defineConfig({
    datasource: {
        url: process.env.DATABASE_URL
    }
    // migrations: {
    //   seed: 'node --loader ts-node/esm prisma/seed.ts',
    // },
});
