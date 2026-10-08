import type { Guest, Invitation, WeddingProfile } from '../../types/domain';
import { requestJson } from '../http/httpClient';

export interface PublicInvitationView {
  profile: WeddingProfile;
  guest: Pick<Guest, 'id' | 'name' | 'companions' | 'dietary' | 'rsvp'>;
  invitation: Pick<Invitation, 'id' | 'template' | 'salutation' | 'message' | 'status' | 'openedAt' | 'respondedAt'>;
}

export interface PublicRsvpRequest {
  attending: boolean;
  companions: number;
  dietary: string;
  note: string;
}

export function buildPublicInvitationPath(token: string): string {
  const value = token.trim();
  if (!value || value.length > 256) throw new Error('请帖Token无效');
  return `/public/invitations/${encodeURIComponent(value)}`;
}

export const publicInvitationApi = {
  get(token: string): Promise<PublicInvitationView> {
    return requestJson<PublicInvitationView>(buildPublicInvitationPath(token));
  },
  opened(token: string): Promise<PublicInvitationView> {
    return requestJson<PublicInvitationView>(`${buildPublicInvitationPath(token)}/opened`, { method: 'POST' });
  },
  rsvp(token: string, request: PublicRsvpRequest): Promise<PublicInvitationView> {
    return requestJson<PublicInvitationView>(`${buildPublicInvitationPath(token)}/rsvp`, {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(request)
    });
  }
};
