import type { BudgetParameter } from '../../../types/budgetWorkbook';

export const defaultBudgetParameters: BudgetParameter[] = [
  {"id":"param-budget-totalCap","key":"budget.totalCap","group":"预算总控","name":"总预算红线","value":100000,"mode":"manual","valueType":"number","unit":"元","description":"婚礼资金硬上限；预算总览自动提示是否超支","sortOrder":1},
  {"id":"param-guest-invitedCount","key":"guest.invitedCount","group":"宾客桌数","name":"预计到场宾客人数","value":280,"mode":"linked","valueType":"number","unit":"人","sourceKey":"guests.invitedCount","description":"自动取宾客名单人数；宾客为空时使用参数保底值","sortOrder":2},
  {"id":"param-guest-backupCount","key":"guest.backupCount","group":"宾客桌数","name":"备用人数","value":20,"mode":"manual","valueType":"number","unit":"人","description":"给临时确认、老人、儿童及父母新增宾客预留","sortOrder":3},
  {"id":"param-table-seatsPerTable","key":"table.seatsPerTable","group":"宾客桌数","name":"每桌人数","value":10,"mode":"manual","valueType":"number","unit":"人/桌","description":"按酒店桌型填写","sortOrder":4},
  {"id":"param-table-mainCount","key":"table.mainCount","group":"宾客桌数","name":"计划正桌数","value":30,"mode":"derived","valueType":"number","unit":"桌","formulaKey":"plannedMainTables","description":"向上取整（预计人数+备用人数）÷每桌人数","sortOrder":5},
  {"id":"param-table-backupCount","key":"table.backupCount","group":"宾客桌数","name":"备用桌数","value":2,"mode":"manual","valueType":"number","unit":"桌","description":"合同写清启用规则和未启用是否收费","sortOrder":6},
  {"id":"param-hotel-banquetUnitPrice","key":"hotel.banquetUnitPrice","group":"酒店餐饮","name":"婚宴单价/桌","value":500,"mode":"manual","valueType":"number","unit":"元/桌","description":"菜单单价；服务费和酒水单列","sortOrder":7},
  {"id":"param-hotel-alcoholPerTable","key":"hotel.alcoholPerTable","group":"酒店餐饮","name":"自带酒水预算/桌","value":300,"mode":"manual","valueType":"number","unit":"元/桌","description":"白酒、红酒、啤酒综合预算","sortOrder":8},
  {"id":"param-hotel-softDrinkPerTable","key":"hotel.softDrinkPerTable","group":"酒店餐饮","name":"软饮及水预算/桌","value":100,"mode":"manual","valueType":"number","unit":"元/桌","description":"饮料、矿泉水和茶饮","sortOrder":9},
  {"id":"param-hotel-serviceRate","key":"hotel.serviceRate","group":"酒店餐饮","name":"酒店服务费率","value":0.1,"mode":"manual","valueType":"number","unit":"%","description":"确认服务费是否已包含在单桌报价中","sortOrder":10},
  {"id":"param-hotel-accommodationNights","key":"hotel.accommodationNights","group":"酒店餐饮","name":"外地宾客住宿晚数","value":10,"mode":"manual","valueType":"number","unit":"晚","description":"按房间晚数估算","sortOrder":11},
  {"id":"param-hotel-roomRate","key":"hotel.roomRate","group":"酒店餐饮","name":"协议房价/晚","value":200,"mode":"manual","valueType":"number","unit":"元/晚","description":"优先申请婚礼协议价","sortOrder":12},
  {"id":"param-guest-giftUnitPrice","key":"guest.giftUnitPrice","group":"宾客物料","name":"伴手礼预算/人","value":10,"mode":"manual","valueType":"number","unit":"元/人","description":"默认按预计人数×105%备货","sortOrder":13},
  {"id":"param-guest-invitationUnitPrice","key":"guest.invitationUnitPrice","group":"宾客物料","name":"邀请函及RSVP预算/人","value":10,"mode":"manual","valueType":"number","unit":"元/人","description":"电子请帖、纸质请帖、寄送和回执","sortOrder":14},
  {"id":"param-risk-reserveRate","key":"risk.reserveRate","group":"风险","name":"风险预留比例","value":0.1,"mode":"manual","valueType":"number","unit":"%","description":"建议10%—15%，只用于突发","sortOrder":15},
  {"id":"param-optional-quickEdit","key":"optional.quickEdit","group":"可选项","name":"婚礼快剪是否纳入","value":true,"mode":"manual","valueType":"boolean","unit":"1/0","description":"开启时纳入预算","sortOrder":16},
  {"id":"param-optional-ring","key":"optional.ring","group":"可选项","name":"婚戒是否纳入本次预算","value":false,"mode":"manual","valueType":"boolean","unit":"1/0","description":"建议与婚宴现金流分账决策","sortOrder":17},
  {"id":"param-optional-preWeddingPhoto","key":"optional.preWeddingPhoto","group":"可选项","name":"婚纱照是否纳入本次预算","value":true,"mode":"manual","valueType":"boolean","unit":"1/0","description":"关闭后对应预算项目自动归零","sortOrder":18},
  {"id":"param-table-totalCount","key":"table.totalCount","group":"宾客桌数","name":"计划总桌数（含备用）","value":32,"mode":"derived","valueType":"number","unit":"桌","formulaKey":"plannedTotalTables","description":"计划正桌数+备用桌数","sortOrder":19},
  {"id":"param-guest-giftCount","key":"guest.giftCount","group":"宾客物料","name":"伴手礼备货数量","value":294,"mode":"derived","valueType":"number","unit":"份","formulaKey":"giftCount105","description":"预计宾客人数×105%向上取整","sortOrder":20},
  {"id":"param-wedding-days","key":"wedding.days","group":"预算总控","name":"执行天数","value":1,"mode":"manual","valueType":"number","unit":"天","description":"按天计费项目的通用参数","sortOrder":21}
];
