import { describe, expect, it } from 'vitest';
import { buildPublicInvitationPath } from './publicInvitationApi';

describe('buildPublicInvitationPath', () => {
  it('对公开Token进行URL编码', () => {
    expect(buildPublicInvitationPath('token / 1')).toBe('/public/invitations/token%20%2F%201');
  });
});
