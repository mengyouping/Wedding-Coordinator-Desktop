import './domain';

declare module './domain' {
  interface ConflictRecord {
    outboxId?: string;
  }
}