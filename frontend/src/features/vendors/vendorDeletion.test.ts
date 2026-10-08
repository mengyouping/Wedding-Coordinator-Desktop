import { describe, expect, it } from 'vitest';
import { vendorDeletionBlockers } from './vendorDeletion';

describe('供应商删除保护', () => {
  it('存在报价合同或资金流水时返回明确阻断原因', () => {
    const blockers = vendorDeletionBlockers({
      quotes: [{ id: 'q1', vendorId: 'vendor-1' }],
      contracts: [{ id: 'c1', vendorId: 'vendor-1' }],
      transactions: [
        { id: 't1', vendorId: 'vendor-1', contractId: '' },
        { id: 't2', vendorId: '', contractId: 'c1' }
      ]
    }, 'vendor-1');

    expect(blockers).toEqual(['1 条供应商报价', '1 份合同', '2 条资金流水']);
  });

  it('没有任何业务引用时允许删除', () => {
    expect(vendorDeletionBlockers({ quotes: [], contracts: [], transactions: [] }, 'vendor-1')).toEqual([]);
  });
});