import type { BudgetItem } from '../../../types/domain';

type ItemRow = readonly [string,string,string,string,string,boolean,string,number,'manual'|'parameter',string,number,'manual'|'parameter'|'quote',string,'multiply'|'hotelServiceFee'|'riskReserve',string,string,string,string,number];
const rows: ItemRow[] = [
  ["budget-template-01","酒店餐饮","cat-01","cat-01-01","婚宴正桌",true,"桌",30,"parameter","table.mainCount",500,"parameter","hotel.banquetUnitPrice","multiply","","签约30% / 婚礼前30日40% / 婚礼后结清","婚礼前180日","优先谈菜单、服务费、酒水和停车，不只谈单桌价",1],
  ["budget-template-02","酒店餐饮","cat-01","cat-01-01","备用桌",true,"桌",2,"parameter","table.backupCount",500,"parameter","hotel.banquetUnitPrice","multiply","","按实际启用结算","婚礼前7日","合同写清未启用是否免收、临时启用截止时间",2],
  ["budget-template-03","酒店餐饮","cat-01","cat-01-01","服务费",true,"项",1,"manual","",1600,"manual","","hotelServiceFee","","随酒店账单结清","签约前","确认是否只按餐费收取",3],
  ["budget-template-04","酒店餐饮","cat-01","cat-01-02","自带酒水",true,"桌",32,"parameter","table.totalCount",300,"parameter","hotel.alcoholPerTable","multiply","","婚礼前7日采购","婚礼前14日","按红白啤和饮料拆分并保留机动库存",4],
  ["budget-template-05","酒店餐饮","cat-01","cat-01-02","软饮、矿泉水、茶饮",true,"桌",32,"parameter","table.totalCount",100,"parameter","hotel.softDrinkPerTable","multiply","","婚礼前7日采购","婚礼前14日","确认酒店是否限制外带或收服务费",5],
  ["budget-template-06","酒店餐饮","cat-01","cat-01-02","开瓶费/酒水服务费",true,"项",1,"manual","",3000,"manual","","multiply","","婚礼后结清","签约前","力争免除或封顶并写入合同",6],
  ["budget-template-07","酒店餐饮","cat-01","cat-01-03","婚房升级/化妆间",true,"项",1,"manual","",0,"manual","","multiply","","签约确认","签约前","争取赠送婚房、延迟退房、早餐和化妆间",7],
  ["budget-template-08","酒店餐饮","cat-01","cat-01-04","外地宾客住宿",true,"晚",10,"parameter","hotel.accommodationNights",200,"parameter","hotel.roomRate","multiply","","入住后结清","婚礼前30日","优先拿婚礼协议价并确认取消规则",8],
  ["budget-template-09","酒店餐饮","cat-01","cat-01-03","停车、超时、杂项",true,"项",1,"manual","",2000,"manual","","multiply","","婚礼后结清","签约前","写清停车券数量和进撤场超时收费",9],
  ["budget-template-10","婚庆舞美","cat-02","cat-02-01","整体策划及项目统筹",true,"项",1,"manual","",2000,"manual","","multiply","","签约30% / 方案确认40% / 婚礼后30%","婚礼前150日","确认现场总控和一日多单安排",10],
  ["budget-template-11","婚庆舞美","cat-02","cat-02-02","主视觉设计与平面物料",true,"项",1,"manual","",600,"manual","","multiply","","方案确认后付款","婚礼前120日","主视觉覆盖邀请函、迎宾、桌卡和舞台",11],
  ["budget-template-12","婚庆舞美","cat-02","cat-02-03","仪式区及晚宴主背景",true,"项",1,"manual","",2000,"manual","","multiply","","进场前付款","婚礼前90日","核对厅高、柱位、LED尺寸和效果图",12],
  ["budget-template-13","婚庆舞美","cat-02","cat-02-04","鲜花花艺（主花、桌花、通道）",true,"项",1,"manual","",1000,"manual","","multiply","","进场前付款","婚礼前30日","写清真花比例、花材等级和回收归属",13],
  ["budget-template-14","婚庆舞美","cat-02","cat-02-05","灯光、LED、音响、麦克风",true,"项",1,"manual","",4000,"manual","","multiply","","进场前付款","婚礼前30日","实测无线麦并完成视频声音彩排",14],
  ["budget-template-15","婚庆舞美","cat-02","cat-02-06","签到区、合影区、迎宾区",true,"项",1,"manual","",500,"manual","","multiply","","进场前付款","婚礼前45日","兼顾动线、拍照和宾客等待体验",15],
  ["budget-template-16","婚庆舞美","cat-02","cat-02-03","仪式道具、路引、座椅装饰",true,"项",1,"manual","",1000,"manual","","multiply","","进场前付款","婚礼前45日","确认椅背花、地毯、签字桌和誓言卡",16]
];

export const defaultBudgetItemsPart1: BudgetItem[] = rows.map(([id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,paymentTerms,latestConfirm,riskTip,sortOrder])=>({
  id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantityMode:'fixed',quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,includeBuffer:false,actualAmount:0,status:category==='风险预留'?'confirmed':'planned',note:'',paymentTerms,latestConfirm,ownerMemberId:'',collaboratorMemberIds:[],acceptanceCriteria:'',riskTip,sortOrder
}));
