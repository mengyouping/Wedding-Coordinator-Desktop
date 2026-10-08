import type { BudgetPaymentMilestone } from '../../../types/budgetWorkbook';

const rows = [
  ['cat-01','酒店','订金','签约日',0.3,11220,'确认厅名、日期、桌数、服务费、酒水条款','你'],
  ['cat-01','酒店','二期款','婚礼前30日',0.4,14960,'确认菜单、酒水、停车、住宿、进场时间','你'],
  ['cat-01','酒店','尾款','婚礼后当日/次日',0.3,11220,'按实际桌数、备用桌、酒水消耗核对结算','副总指挥'],
  ['cat-02','婚庆公司','订金','签约日',0.3,4680,'锁定主策、设计、档期、现场执行人员','你'],
  ['cat-02','婚庆公司','方案确认款','婚礼前60—90日',0.4,6240,'确认效果图、清单、花材、设备、进场方案','你+对象'],
  ['cat-02','婚庆公司','尾款','婚礼后',0.3,4680,'按现场实际交付及设备撤场确认','副总指挥'],
  ['cat-03','摄影摄像','订金','签约日',0.3,1350,'锁定主摄影、主摄像、机位、收音和交付周期','你'],
  ['cat-03','摄影摄像','尾款','婚礼后',0.7,3150,'确认素材、精修、成片、快剪交付标准','副总指挥'],
  ['cat-04','礼服/化妆','订金','预订日',0.5,3350,'试纱、试妆、改衣、跟妆时长确认','对象'],
  ['cat-04','礼服/化妆','尾款','取衣前/婚礼后',0.5,3350,'服装检查、备用鞋、配饰、妆造物料核对','新娘接口人'],
  ['cat-05','主持/DJ/视频','订金','签约日',0.5,1400,'确认主持词、音乐、视频、彩排安排','你'],
  ['cat-05','主持/DJ/视频','尾款','婚礼前/婚礼后',0.5,1400,'完成彩排、U盘与设备备份、交付确认','副总指挥'],
  ['cat-06','物料/伴手礼','全款','婚礼前14—21日',1,7940,'按最终宾客数量+5%备用量采购','物料负责人'],
  ['cat-07','车队/接驳','全款','婚礼前7—14日',1,3500,'确认车型、司机、路线、停车、老人接送','车辆负责人'],
  ['cat-08','婚戒/婚纱照','订金','签约日',0.5,3000,'只在确认纳入本次婚礼预算后执行','你+对象'],
  ['cat-08','婚戒/婚纱照','尾款','服务/取货前',0.5,3000,'确认交付范围、精修/材质/售后规则','你+对象']
] as const;

export const defaultBudgetPaymentMilestones: BudgetPaymentMilestone[] = rows.map(([categoryId,vendorName,title,recommendedTiming,ratio,plannedAmount,condition,ownerName],index)=>({
  id:`milestone-template-${String(index+1).padStart(2,'0')}`,categoryId,budgetItemId:'',vendorName,contractId:'',title,recommendedTiming,plannedDate:'',ratio,plannedAmount,triggerCondition:condition,acceptanceCriteria:condition,ownerName,collaboratorNames:[],status:'待支付',sortOrder:index+1
}));
