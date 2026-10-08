import type { WeddingTask } from '../../../types/domain';

const rows = [
  ['立项','T-9～6个月','确定日期、城市、预算红线、婚礼风格','双方家庭确认，预算红线写入参数设置','你',['对象','双方父母'],'不先锁范围，后续所有报价会反复返工','P0'],
  ['场地','T-8～6个月','考察酒店并签合同','厅名、桌数、酒水、服务费、进场、违约和改期写入合同','你',['对象','父母'],'酒店口头承诺不算，必须写入合同','P0'],
  ['供应商','T-6～4个月','锁定婚庆、影像、主持、妆造、礼服','合同、付款节点、交付范围、现场负责人完整','你',['对象'],'确认是否一日多单、临时换人和备用设备','P1'],
  ['宾客','T-4～2个月','建立宾客名单与 A/B/C 分层','宾客表有姓名、人数、住宿、特殊餐、座位信息','双方父母接口人',['你'],'新增宾客不入表，不调整酒店桌数','P1'],
  ['内容','T-3～2个月','形成仪式流程、九年故事视频、誓言、音乐','完整 run of show、视频双备份、主持词过稿','你',['对象','主持人'],'视频不超过3分钟，避免流程拖延','P1'],
  ['物料','T-30日','确认请柬、桌卡、伴手礼、胸花、戒指盒','清单、数量、备货比例、到货日期明确','物料负责人',['新娘接口人'],'伴手礼按预计人数×105%备货','P1'],
  ['酒店对单','T-14日','确认菜单、酒水、停车、住宿、进场时间','酒店书面确认单及桌数变更节点','副总指挥',['你'],'服务费和备用桌规则需再次核对','P1'],
  ['彩排','T-7日','完成入场、誓言、戒指、退场、合影彩排','所有人知道站位、音乐点、麦克风和退场路线','你',['婚庆','主持','影像'],'必须实测音响、视频、麦克风','P1'],
  ['婚礼当天','当天','现场统筹、供应商验收、宾客接待、礼金管理','总控群响应；副总指挥持流程表和应急包','副总指挥',['全部接口人'],'新郎新娘不处理突发事项','P0'],
  ['结算','T+1～14日','核对酒店、婚庆、影像尾款与交付','付款凭证、合同、收据、交付验收归档','你',['财务/物料负责人'],'未验收的服务不要提前全额结清','P1']
] as const;

export const defaultBudgetChecklistTasks: WeddingTask[] = rows.map(([category,stageCode,title,acceptanceCriteria,owner,collaborators,description,priority],index)=>({
  id:`budget-task-template-${String(index+1).padStart(2,'0')}`,title,description,owner,collaborators:[...collaborators],phase:'待启动',priority,dueDate:'',category,progress:0,dependencyIds:[],checklist:[],reminderAt:'',relatedRiskIds:[],budgetCategoryId:'',budgetItemId:'',acceptanceCriteria,stageCode,sortOrder:index+1,source:'budget'
}));
