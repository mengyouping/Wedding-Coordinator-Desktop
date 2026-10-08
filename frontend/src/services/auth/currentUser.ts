import type { AuthSession } from './authSession';
import type { CurrentUser, WeddingDatabase } from '../../types/domain';

function deviceId(): string {
  const key = 'wedding-os.device-id';
  if (typeof localStorage === 'undefined') return 'server-device';
  const current = localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

/**
 * 解析当前项目成员。
 *
 * API/统一登录模式必须匹配项目成员，未匹配时返回 null；只有显式传入
 * allowLocalOwner=true 的 JSON 单机模式，才允许在没有登录会话时使用本地所有者。
 */
export function resolveCurrentUser(
  database: WeddingDatabase,
  session: AuthSession | null,
  allowLocalOwner = false
): CurrentUser | null {
  const member = session
    ? database.members.find(item => item.active && (
        item.id === session.userId
        || item.email === session.userId
        || item.name === session.userName
      ))
    : allowLocalOwner
      ? database.members.find(item => item.role === '所有者' && item.active) ?? database.members.find(item => item.active)
      : undefined;

  if (!member) return null;
  return {
    id: session?.userId ?? member.id,
    name: session?.userName ?? member.name ?? database.profile.coordinatorName,
    email: member.email ?? '',
    role: member.role,
    deviceId: deviceId()
  };
}
