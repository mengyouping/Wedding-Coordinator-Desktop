import { appConfig } from '../../config/appConfig';
import { readAuthSession } from '../auth/authSession';
import { toEntityId, type EntityId } from '../../types/persistence';

/** 下载后端生成的宾客CSV，复用统一登录Bearer Token。 */
export async function downloadGuestCsv(projectId: EntityId): Promise<Blob> {
  const session = readAuthSession();
  const baseUrl = appConfig.apiBaseUrl.replace(/\/$/, '');
  const url = `${baseUrl}/wedding/projects/${encodeURIComponent(toEntityId(projectId, '婚礼项目ID'))}/guests/export`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'text/csv',
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {})
    },
    credentials: 'same-origin'
  });
  if (!response.ok) throw new Error(`宾客导出失败：HTTP ${response.status}`);
  return response.blob();
}
