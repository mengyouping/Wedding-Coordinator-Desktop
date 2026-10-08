import type { PermissionKey, WeddingDatabase } from '../../types/domain';

const same = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);

/**
 * 根据跨集合原子更新实际改变的领域推断所需权限。
 * 多领域更新必须同时具备全部权限，不能再统一误用 project.write。
 */
export function inferDatabaseMutationPermissions(
  current: WeddingDatabase,
  next: WeddingDatabase
): PermissionKey[] {
  const permissions = new Set<PermissionKey>();

  if (!same(current.settings, next.settings) || !same(current.profile, next.profile)) permissions.add('project.write');
  if (!same(current.members, next.members)) permissions.add('member.manage');

  if (
    !same(current.budget, next.budget)
    || !same(current.vendors, next.vendors)
    || !same(current.quotes, next.quotes)
    || !same(current.contracts, next.contracts)
    || !same(current.transactions, next.transactions)
  ) permissions.add('budget.write');

  if (!same(current.guests, next.guests)) permissions.add('guest.write');
  if (
    !same(current.tables, next.tables)
    || !same(current.seatAssignments, next.seatAssignments)
    || !same(current.seatingPlans, next.seatingPlans)
  ) permissions.add('seating.write');

  if (
    !same(current.tasks, next.tasks)
    || !same(current.timeline, next.timeline)
    || !same(current.invitations, next.invitations)
    || !same(current.risks, next.risks)
    || !same(current.materials, next.materials)
    || !same(current.attachments, next.attachments)
    || !same(current.runbookEvents, next.runbookEvents)
    || !same(current.checkIns, next.checkIns)
    || !same(current.incidents, next.incidents)
  ) permissions.add('execution.write');

  // 未识别的业务更新默认按项目写权限处理；审计和同步状态不能由页面直接修改。
  if (!same(current.auditLogs, next.auditLogs) || !same(current.outbox, next.outbox) || !same(current.conflicts, next.conflicts)) {
    permissions.add('project.write');
  }
  if (!permissions.size) permissions.add('project.write');

  const order: PermissionKey[] = [
    'project.write', 'member.manage', 'budget.write', 'guest.write', 'seating.write', 'execution.write'
  ];
  return order.filter(permission => permissions.has(permission));
}
