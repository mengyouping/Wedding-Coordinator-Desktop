import { describe, expect, it } from 'vitest';
import { buildCommandRequest } from './weddingApi';
import type { WeddingCommand } from '../../types/domain';

const profileCommand: WeddingCommand = {
  type: 'profile.replace',
  payload: {
    groomName: '示例新郎', brideName: '示例新娘', weddingDate: '2030-10-18',
    ceremonyTime: '18:18', banquetTime: '19:08', venueName: '测试酒店',
    venueAddress: '示例城市', coordinatorName: '总指挥', phone: ''
  }
};

describe('buildCommandRequest', () => {
  it('把资料命令映射到项目级资料接口', () => {
    const request = buildCommandRequest('p 1', 7, profileCommand);
    expect(request.path).toBe('/wedding/projects/p%201/profile');
    expect(request.init.method).toBe('PUT');
    expect(request.init.headers).toMatchObject({ 'If-Match': '7' });
  });

  it('把集合命令映射到对应集合接口', () => {
    const command: WeddingCommand = { type: 'collection.replace', key: 'guests', payload: [] };
    expect(buildCommandRequest('p1', 2, command).path).toBe('/wedding/projects/p1/guests');
  });
});
