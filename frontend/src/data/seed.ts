import seed from './json/wedding-data.json';
import type { WeddingDatabase } from '../types/domain';

export const initialWeddingDatabase = seed as unknown as WeddingDatabase;
