import { describe, expect, it } from 'vitest';
import { createOperationsDraft, weddingTemplatePacks } from './templatePacks';

const ids = ['western-hotel', 'chinese-banquet', 'outdoor-lawn', 'church', 'destination'] as const;

describe('婚礼全案前端模板', () => {
  it('提供五套通用核心加场景模板', () => {
    expect(weddingTemplatePacks.map(item => item.id)).toEqual(ids);
  });

  it.each(ids)('%s 模板包含八中心完整默认数据', templateId => {
    const draft = createOperationsDraft(templateId);
    expect(draft.version).toBe(1);
    expect(draft.templateId).toBe(templateId);
    expect(draft.menus.length).toBeGreaterThan(0);
    expect(draft.beverages.length).toBeGreaterThan(0);
    expect(draft.deployments.length).toBeGreaterThan(0);
    expect(draft.staffPositions.length).toBeGreaterThan(0);
    expect(draft.hospitalityServices.length).toBeGreaterThan(0);
    expect(draft.ceremonyPrograms.length).toBeGreaterThan(0);
    expect(draft.vendorDeliveries.length).toBeGreaterThan(0);
    expect(draft.logisticsRecords.length).toBeGreaterThan(0);
    expect(draft.emergencyPlans.length).toBeGreaterThan(0);
  });

  it('每次创建模板均返回独立深拷贝', () => {
    const first = createOperationsDraft('western-hotel');
    const second = createOperationsDraft('western-hotel');
    first.menus[0]!.name = '已修改菜单';
    first.staffPositions[0]!.owner = '已修改负责人';
    expect(second.menus[0]!.name).not.toBe('已修改菜单');
    expect(second.staffPositions[0]!.owner).not.toBe('已修改负责人');
  });

  it('不同模板具备明显场景差异', () => {
    expect(createOperationsDraft('chinese-banquet').ceremonyPrograms.some(item => item.title.includes('敬茶'))).toBe(true);
    expect(createOperationsDraft('outdoor-lawn').deployments.some(item => item.name.includes('发电机'))).toBe(true);
    expect(createOperationsDraft('church').ceremonyPrograms.some(item => item.title.includes('经文'))).toBe(true);
    expect(createOperationsDraft('destination').hospitalityServices.some(item => item.serviceType.includes('航班'))).toBe(true);
  });
});
