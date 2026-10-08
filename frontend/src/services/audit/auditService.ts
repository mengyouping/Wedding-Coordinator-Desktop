import { readAuthSession } from '../auth/authSession';
import { resolveCurrentUser } from '../auth/currentUser';
import type { AuditLog, WeddingCommand, WeddingDatabase } from '../../types/domain';

function commandLabel(command: WeddingCommand): string {
  if (command.type === 'collection.replace') return `REPLACE_${command.key.toUpperCase()}`;
  return command.type.toUpperCase().replace('.', '_');
}

export function createAuditEntry(database: WeddingDatabase, command: WeddingCommand, requestId = crypto.randomUUID()): AuditLog {
  const user = resolveCurrentUser(database, readAuthSession());
  return {
    id: crypto.randomUUID(),
    action: commandLabel(command),
    entityType: command.type === 'collection.replace' ? command.key : command.type.split('.')[0] ?? 'project',
    entityId: database.projectId,
    operatorId: user.id,
    operatorName: user.name,
    operatorRole: user.role,
    deviceId: user.deviceId,
    requestId,
    createdAt: new Date().toISOString(),
    detail: `基于 revision ${database.revision} 提交 ${commandLabel(command)}`
  };
}

export function appendAudit(database: WeddingDatabase, entry: AuditLog): WeddingDatabase {
  return { ...database, auditLogs: [...database.auditLogs, entry].slice(-500) };
}
