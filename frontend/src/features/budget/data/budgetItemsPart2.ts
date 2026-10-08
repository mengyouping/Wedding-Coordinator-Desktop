import type { BudgetItem } from '../../../types/domain';

type ItemRow = readonly [string,string,string,string,string,boolean,string,number,'manual'|'parameter',string,number,'manual'|'parameter'|'quote',string,'multiply'|'hotelServiceFee'|'riskReserve',string,string,string,string,number];
const rows: ItemRow[] = [
  ["budget-template-17","婚庆舞美","cat-02","cat-02-07","搭建运输、技术人员、撤场",true,"项",1,"manual","",4000,"manual","","multiply","","婚礼后结清","婚礼前30日","确认酒店允许进场时间及超时费用责任",17],
  ["budget-template-18","婚庆舞美","cat-02","cat-02-08","冷焰火/泡泡机/花瓣机",true,"项",1,"manual","",500,"manual","","multiply","","进场前付款","婚礼前30日","先确认酒店消防规则，不建议临时加项",18],
  ["budget-template-19","影像记录","cat-03","cat-03-01","婚礼摄影（全天）",true,"项",1,"manual","",1500,"manual","","multiply","","签约30% / 婚礼后70%","婚礼前120日","看完整交付并确认交付张数和期限",19],
  ["budget-template-20","影像记录","cat-03","cat-03-02","婚礼摄像（全天）",true,"项",1,"manual","",1500,"manual","","multiply","","签约30% / 婚礼后70%","婚礼前120日","确认双机位、收音、成片时长和素材交付",20],
  ["budget-template-21","影像记录","cat-03","cat-03-03","婚礼快剪",true,"项",1,"manual","",1000,"manual","","multiply","optional.quickEdit","婚礼前付款","婚礼前45日","看团队协同和现场剪辑能力，非刚需可砍",21],
  ["budget-template-22","影像记录","cat-03","cat-03-04","相册、相框、精修升级",true,"项",1,"manual","",500,"manual","","multiply","","婚礼后确认","婚礼后14日","避免前期低价后期精修加价",22],
  ["budget-template-23","礼服妆造","cat-04","cat-04-01","主婚纱/出门纱/敬酒服",true,"套",1,"manual","",3000,"manual","","multiply","","订金50% / 取衣前结清","婚礼前90日","确认改衣、头纱、裙撑、清洗和赔偿",23],
  ["budget-template-24","礼服妆造","cat-04","cat-04-01","婚纱配饰及内搭",true,"项",1,"manual","",800,"manual","","multiply","","取货前结清","婚礼前45日","准备安全裤、胸贴、平底鞋和备用内搭",24],
  ["budget-template-25","礼服妆造","cat-04","cat-04-02","新郎西装、衬衫、鞋、配饰",true,"套",1,"manual","",800,"manual","","multiply","","订金50% / 取衣前结清","婚礼前90日","准备备用白衬衫和备用袜子",25],
  ["budget-template-26","礼服妆造","cat-04","cat-04-03","新娘敬酒服/鞋/配饰",true,"项",1,"manual","",1000,"manual","","multiply","","取货前结清","婚礼前45日","兼顾行动便利和敬酒舒适度",26],
  ["budget-template-27","礼服妆造","cat-04","cat-04-02","新娘跟妆及新郎造型",true,"项",1,"manual","",800,"manual","","multiply","","订金50% / 婚礼后结清","婚礼前90日","必须试妆并确认跟妆结束时间",27],
  ["budget-template-28","礼服妆造","cat-04","cat-04-03","手捧花、父母胸花、伴郎伴娘胸花",true,"项",1,"manual","",300,"manual","","multiply","","婚礼前付款","婚礼前30日","数量、花材和送达时间写清",28],
  ["budget-template-29","仪式内容","cat-05","cat-05-01","主持人/证婚人",true,"项",1,"manual","",600,"manual","","multiply","","签约50% / 婚礼后结清","婚礼前90日","主持词提前过稿并明确风格边界",29],
  ["budget-template-30","仪式内容","cat-05","cat-05-02","誓言卡、仪式证书、戒指盒",true,"项",1,"manual","",100,"manual","","multiply","","婚礼前付款","婚礼前14日","戒指指定唯一保管人",30],
  ["budget-template-31","仪式内容","cat-05","cat-05-03","DJ/乐队/仪式音乐",true,"项",0,"manual","",5000,"manual","","multiply","","签约50% / 婚礼前结清","婚礼前60日","曲目清单、时长和设备要求写清",31],
  ["budget-template-32","仪式内容","cat-05","cat-05-04","九年故事视频制作",true,"项",1,"manual","",2000,"manual","","multiply","","交片确认后付款","婚礼前30日","控制在90秒至3分钟并双备份",32]
];

export const defaultBudgetItemsPart2: BudgetItem[] = rows.map(([id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,paymentTerms,latestConfirm,riskTip,sortOrder])=>({
  id,category,categoryId,secondaryCategoryId,name,included,unit,quantity,quantityMode:'fixed',quantitySource,quantityParameterKey,unitPrice,unitPriceSource,unitPriceParameterKey,calculationRule,inclusionParameterKey,includeBuffer:false,actualAmount:0,status:category==='风险预留'?'confirmed':'planned',note:'',paymentTerms,latestConfirm,ownerMemberId:'',collaboratorMemberIds:[],acceptanceCriteria:'',riskTip,sortOrder
}));
