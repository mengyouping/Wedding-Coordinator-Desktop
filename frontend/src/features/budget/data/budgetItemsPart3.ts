import type { BudgetItem } from '../../../types/domain';

type ItemRow = readonly [string,string,string,string,string,boolean,string,number,'manual'|'parameter',string,number,'manual'|'parameter'|'quote',string,'multiply'|'hotelServiceFee'|'riskReserve',string,string,string,string,number];
const rows: ItemRow[] = [
  ["budget-template-33","仪式内容","cat-05","cat-05-05","仪式彩排及流程编排",true,"项",1,"manual","",100,"manual","","multiply","","婚礼前付款","婚礼前7日","至少彩排入场、誓言、戒指、退场和合影",33],
  ["budget-template-34","宾客接待","cat-06","cat-06-01","邀请函、RSVP、寄送",true,"人",280,"parameter","guest.invitedCount",10,"parameter","guest.invitationUnitPrice","multiply","","婚礼前30日结清","婚礼前60日","邀请名单分层，避免按理论人脉大量印制",34],
  ["budget-template-35","宾客接待","cat-06","cat-06-02","签到台、座位表、桌卡、菜单",true,"项",1,"manual","",100,"manual","","multiply","","婚礼前付款","婚礼前14日","座位表提前3日冻结，老人孕妇避开音响区",35],
  ["budget-template-36","宾客接待","cat-06","cat-06-03","婚礼伴手礼",true,"人",294,"parameter","guest.giftCount",10,"parameter","guest.giftUnitPrice","multiply","","婚礼前7日采购","婚礼前21日","实用优先，默认按预计人数×105%备货",36],
  ["budget-template-37","宾客接待","cat-06","cat-06-04","父母及长辈答谢礼",true,"份",5,"manual","",200,"manual","","multiply","","婚礼前7日采购","婚礼前21日","按双方父母及关键长辈名单锁定",37],
  ["budget-template-38","宾客接待","cat-06","cat-06-05","伴郎伴娘礼",true,"份",4,"manual","",200,"manual","","multiply","","婚礼前7日采购","婚礼前21日","人数需与最终伴郎伴娘名单一致",38],
  ["budget-template-39","宾客接待","cat-06","cat-06-06","儿童礼物/应急零食",true,"份",10,"manual","",30,"manual","","multiply","","婚礼前7日采购","婚礼前14日","儿童较多时可单列儿童桌",39],
  ["budget-template-40","交通住宿","cat-07","cat-07-01","主婚车及跟车",true,"项",1,"manual","",2000,"manual","","multiply","","婚礼前付款","婚礼前30日","明确时长、里程、花饰、司机和备用车",40],
  ["budget-template-41","交通住宿","cat-07","cat-07-02","老人/外地宾客接驳",true,"项",1,"manual","",500,"manual","","multiply","","婚礼前付款","婚礼前21日","优先照顾老人孕妇和外地宾客",41],
  ["budget-template-42","交通住宿","cat-07","cat-07-03","司机餐、停车券、临时打车",true,"项",1,"manual","",1000,"manual","","multiply","","婚礼后结清","婚礼前14日","提前准备电子打车备用金",42],
  ["budget-template-43","婚前可选","cat-08","cat-08-01","婚戒",false,"对",1,"manual","",20000,"manual","","multiply","optional.ring","购买时付款","婚礼前90日","单独决策，不让婚戒挤压婚宴现金流",43],
  ["budget-template-44","婚前可选","cat-08","cat-08-02","婚纱照",true,"套",1,"manual","",6000,"manual","","multiply","optional.preWeddingPhoto","签约50% / 选片后结清","婚礼前120日","选片加价、精修张数和外景交通是常见超支点",44],
  ["budget-template-45","婚前可选","cat-08","cat-08-03","领证跟拍/登记日物料",false,"项",1,"manual","",1500,"manual","","multiply","","服务后结清","婚礼前30日","可与婚礼摄影打包谈价",45],
  ["budget-template-46","风险预留","cat-09","cat-09-01","机动预留金",true,"项",1,"manual","",8444,"manual","","riskReserve","","非紧急不得动用","签约前","只用于临时加桌、设备、交通和突发物料",46]
];

export const defaultBudgetItemsPart3: BudgetItem[] = rows.map(([id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,paymentTerms,latestConfirm,riskTip,sortOrder])=>({
  id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantityMode:'fixed',quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,includeBuffer:false,actualAmount:0,status:category==='风险预留'?'confirmed':'planned',note:'',paymentTerms,latestConfirm,ownerMemberId:'',collaboratorMemberIds:[],acceptanceCriteria:'',riskTip,sortOrder
}));
