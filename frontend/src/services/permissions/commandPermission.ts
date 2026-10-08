import type { CollectionKey, PermissionKey, WeddingCommand, WeddingDatabase } from '../../types/domain';
import { inferDatabaseMutationPermissions } from './databaseMutationPermission';

export function collectionPermission(key: CollectionKey): PermissionKey {
  if (key === 'guests') return 'guest.write';
  if (key === 'tables' || key === 'seatAssignments' || key === 'seatingPlans') return 'seating.write';
  if (key === 'members') return 'member.manage';
  if (key === 'vendors' || key === 'quotes' || key === 'contracts' || key === 'transactions') return 'budget.write';
  return 'execution.write';
}

export function requiredPermissionsForCommand(
  current: WeddingDatabase,
  command: WeddingCommand
): PermissionKey[] {
  if (command.type === 'profile.replace' || command.type === 'settings.replace') return ['project.write'];
  if (command.type === 'budget.replace') return ['budget.write'];
  if (command.type === 'collection.replace') return [collectionPermission(command.key)];
  return inferDatabaseMutationPermissions(current, command.payload);
}