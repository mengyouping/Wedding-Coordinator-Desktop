import { describe, expect, it } from 'vitest';
import { initialWeddingDatabase } from '../../data/seed';
import { requiredPermissionsForCommand } from './commandPermission';

describe('requiredPermissionsForCommand', () => {
  it('宾客集合命令需要宾客写权限', () => {
    expect(requiredPermissionsForCommand(initialWeddingDatabase, {
      type: 'collection.replace',
      key: 'guests',
      payload: initialWeddingDatabase.guests
    })).toEqual(['guest.write']);
  });

  it('供应商集合命令归属预算权限', () => {
    expect(requiredPermissionsForCommand(initialWeddingDatabase, {
      type: 'collection.replace',
      key: 'vendors',
      payload: initialWeddingDatabase.vendors
    })).toEqual(['budget.write']);
  });

  it('跨宾客与排桌的快照命令需要两个领域权限', () => {
    const next = structuredClone(initialWeddingDatabase);
    next.guests = next.guests.slice(1);
    next.seatAssignments = next.seatAssignments.slice(1);
    expect(requiredPermissionsForCommand(initialWeddingDatabase, {
      type: 'snapshot.replace',
      payload: next
    })).toEqual(['guest.write', 'seating.write']);
  });
});