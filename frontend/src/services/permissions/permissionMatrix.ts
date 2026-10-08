import type { CurrentUser, MemberRole, PermissionKey } from '../../types/domain';

const matrix: Record<MemberRole, ReadonlySet<PermissionKey>> = {
  所有者: new Set<PermissionKey>([
    'project.read', 'project.write', 'project.delete', 'member.manage', 'budget.write',
    'guest.write', 'seating.write', 'execution.write', 'privacy.export', 'audit.read'
  ]),
  总指挥: new Set<PermissionKey>([
    'project.read', 'project.write', 'budget.write', 'guest.write', 'seating.write',
    'execution.write', 'privacy.export', 'audit.read'
  ]),
  协作者: new Set<PermissionKey>([
    'project.read', 'guest.write', 'seating.write', 'execution.write', 'audit.read'
  ]),
  只读: new Set<PermissionKey>(['project.read', 'audit.read'])
};

export function canRole(role: MemberRole, permission: PermissionKey): boolean {
  return matrix[role].has(permission);
}

export function canUser(user: CurrentUser, permission: PermissionKey): boolean {
  return canRole(user.role, permission);
}

export function assertPermission(user: CurrentUser, permission: PermissionKey): void {
  if (!canUser(user, permission)) throw new Error(`PERMISSION_DENIED：${user.role} 无权执行 ${permission}`);
}

export function permissionLabel(permission: PermissionKey): string {
  const labels: Record<PermissionKey, string> = {
    'project.read': '查看项目',
    'project.write': '修改项目',
    'project.delete': '删除项目',
    'member.manage': '管理成员',
    'budget.write': '修改预算',
    'guest.write': '修改宾客',
    'seating.write': '修改排桌',
    'execution.write': '推进现场执行',
    'privacy.export': '导出隐私数据',
    'audit.read': '查看审计日志'
  };
  return labels[permission];
}
