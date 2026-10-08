import type {
  BanquetMenuPlan, BeveragePlan, CeremonyProgram, EmergencyPlan, HospitalityService, LogisticsRecord,
  StaffPosition, TemplatePackMeta, VendorDelivery, VenueDeployment, WeddingOperationsDraft, WeddingTemplateId
} from './model';

export const weddingTemplatePacks: TemplatePackMeta[] = [
  { id: 'western-hotel', name: '西式酒店婚礼完整版', shortName: '西式酒店', description: '酒店宴会厅、舞台仪式、圆桌晚宴与完整供应商协同。', scenes: ['酒店宴会厅', '西式仪式', '桌餐酒水', '大型执行团队'], accent: '香槟金' },
  { id: 'chinese-banquet', name: '中式婚宴完整版', shortName: '中式婚宴', description: '接亲、敬茶、迎宾、开席、敬酒和传统礼俗执行。', scenes: ['接亲敬茶', '中式婚宴', '礼金签到', '多轮敬酒'], accent: '朱砂红' },
  { id: 'outdoor-lawn', name: '户外草坪婚礼', shortName: '户外草坪', description: '草坪仪式、户外餐饮、天气备份、电力与临时设施。', scenes: ['草坪仪式', '户外用电', '天气预案', '帐篷与接驳'], accent: '草木绿' },
  { id: 'church', name: '教堂仪式婚礼', shortName: '教堂仪式', description: '教堂礼仪、排练、赞美诗、摄影限制与宴会转场。', scenes: ['教堂礼仪', '牧师与诗班', '固定座席', '宴会转场'], accent: '月光银' },
  { id: 'destination', name: '目的地婚礼', shortName: '目的地', description: '多日行程、航班酒店、当地供应商和跨城市宾客服务。', scenes: ['多日行程', '航班酒店', '当地车队', '跨境物料'], accent: '海岛蓝' }
];

const status = '待确认' as const;

const commonStaff = (): StaffPosition[] => [
  { id: 'staff-command', team: '总控组', position: '总指挥', scope: '统一决策、跨组协调、异常升级与最终放行', owner: '总指挥', backup: '副总指挥', contact: '', shiftStart: '07:00', shiftEnd: '22:30', meetingPoint: '宴会厅总控台', reportTo: '新人', checklist: '确认总流程\n确认关键联系人\n主持现场例会\n关闭重大异常', status },
  { id: 'staff-deputy', team: '总控组', position: '副总指挥', scope: '跟踪各组状态、替补总指挥、维护作战看板', owner: '', backup: '', contact: '', shiftStart: '07:00', shiftEnd: '22:30', meetingPoint: '宴会厅总控台', reportTo: '总指挥', checklist: '收集状态\n每30分钟更新看板\n记录变更', status },
  { id: 'staff-hotel', team: '接口组', position: '酒店接口人', scope: '宴会、后厨、桌椅、服务员、用电和停车协调', owner: '', backup: '', contact: '', shiftStart: '09:00', shiftEnd: '22:00', meetingPoint: '酒店宴会销售办公室', reportTo: '总指挥', checklist: '核对厅房\n核对菜单酒水\n确认服务员班组', status },
  { id: 'staff-wedding', team: '接口组', position: '婚庆接口人', scope: '舞美搭建、主持、灯光、音响、花艺和撤场协调', owner: '', backup: '', contact: '', shiftStart: '08:00', shiftEnd: '23:00', meetingPoint: '舞台左侧', reportTo: '总指挥', checklist: '核对搭建\n核对技术清单\n确认撤场', status },
  { id: 'staff-groom', team: '新人接口', position: '新郎接口人', scope: '管理新郎、伴郎、戒指、证件、服装和进场时间', owner: '', backup: '', contact: '', shiftStart: '06:30', shiftEnd: '21:30', meetingPoint: '新郎房', reportTo: '副总指挥', checklist: '证件\n戒指\n胸花\n发言稿\n备用衬衫', status },
  { id: 'staff-bride', team: '新人接口', position: '新娘接口人', scope: '管理新娘、伴娘、妆造、婚纱、捧花和补妆', owner: '', backup: '', contact: '', shiftStart: '05:30', shiftEnd: '21:30', meetingPoint: '新娘房', reportTo: '副总指挥', checklist: '婚纱\n头纱\n捧花\n鞋\n补妆包\n备用丝袜', status },
  { id: 'staff-signin', team: '宾客组', position: '签到组长', scope: '签到、席位查询、礼金登记、伴手礼和特殊宾客引导', owner: '', backup: '', contact: '', shiftStart: '15:30', shiftEnd: '19:30', meetingPoint: '签到台', reportTo: '副总指挥', checklist: '签到册\n席位图\n礼金码\n备用笔\n伴手礼', status },
  { id: 'staff-gift', team: '宾客组', position: '礼金组', scope: '现金与电子礼金登记、双人复核、封存和交接', owner: '', backup: '', contact: '', shiftStart: '15:30', shiftEnd: '20:30', meetingPoint: '礼金台', reportTo: '签到组长', checklist: '双人复核\n编号\n封袋\n交接签字', status },
  { id: 'staff-beverage', team: '宴会组', position: '酒水组长', scope: '入库、摆台、补酒、开瓶、空瓶、退酒和结算核对', owner: '', backup: '', contact: '', shiftStart: '14:00', shiftEnd: '22:30', meetingPoint: '酒水仓', reportTo: '酒店接口人', checklist: '清点入库\n桌面配额\n开瓶登记\n剩余回收', status },
  { id: 'staff-material', team: '物流组', position: '物料组长', scope: '装箱、装车、卸货、存放、发放、回收和归还', owner: '', backup: '', contact: '', shiftStart: '08:00', shiftEnd: '23:00', meetingPoint: '装卸区', reportTo: '副总指挥', checklist: '箱码核对\n车辆清单\n交接签字\n回收差异', status },
  { id: 'staff-vehicle', team: '交通组', position: '车辆组长', scope: '新人车、父母车、接驳车、供应商车辆和停车调度', owner: '', backup: '', contact: '', shiftStart: '06:30', shiftEnd: '22:30', meetingPoint: '酒店车道', reportTo: '副总指挥', checklist: '司机通讯录\n车辆编号\n路线\n停车证\n备用车', status },
  { id: 'staff-emergency', team: '应急组', position: '应急负责人', scope: '医疗、天气、停电、设备、消防和人员突发处置', owner: '', backup: '', contact: '', shiftStart: '08:00', shiftEnd: '23:00', meetingPoint: '总控台', reportTo: '总指挥', checklist: '急救包\n医院路线\n备用电源\n灭火器位置\n紧急联系人', status }
];

const commonEmergencies = (): EmergencyPlan[] => [
  { id: 'risk-weather', scenario: '恶劣天气', trigger: '暴雨、大风、高温或雷电预警', level: '高', commander: '总指挥', contacts: '酒店值班经理、婚庆负责人、车队负责人', responseSteps: '启动室内或雨备场地\n通知供应商切换布置\n更新宾客到场指引\n安排防滑与雨具', backupResource: '雨备厅、雨伞、防滑垫、备用接驳车', linkedArea: '迎宾区、仪式区、停车区', status },
  { id: 'risk-power', scenario: '停电或电力不足', trigger: '主电源中断、频繁跳闸或负载告警', level: '高', commander: '婚庆接口人', contacts: '酒店工程部、灯光师、音响师', responseSteps: '停止非关键设备\n切换应急电源\n保留话筒和基础照明\n确认恢复后分批上电', backupResource: 'UPS、移动电源、备用发电机、应急灯', linkedArea: '舞台、音控台、签到台', status },
  { id: 'risk-device', scenario: '音视频设备故障', trigger: '话筒无声、LED黑屏、音乐无法播放', level: '高', commander: '技术总控', contacts: '音响师、灯光师、视频师、主持人', responseSteps: '主持人口播过渡\n切换备用话筒和电脑\n跳过非关键视频\n故障恢复后回归主流程', backupResource: '有线话筒、备用电脑、U盘、离线音乐', linkedArea: '舞台、音控台', status },
  { id: 'risk-late', scenario: '关键人员迟到', trigger: '主持、摄影、化妆、证婚人或新人超过计划15分钟未到', level: '中', commander: '副总指挥', contacts: '岗位负责人、备份人、司机', responseSteps: '立即联系定位\n启用备份岗位\n调整并行流程\n向总指挥报告影响', backupResource: '岗位备份人、备用车辆、可调整暖场内容', linkedArea: '全场', status },
  { id: 'risk-traffic', scenario: '交通拥堵', trigger: '主路线拥堵超过30分钟或车辆故障', level: '中', commander: '车辆组长', contacts: '所有司机、酒店礼宾、接驳负责人', responseSteps: '切换备用路线\n安排宾客分批出发\n调用备用车\n同步延误名单', backupResource: '备用路线、网约车预算、备用商务车', linkedArea: '酒店车道、停车区', status },
  { id: 'risk-guest', scenario: '宾客身体不适', trigger: '晕厥、过敏、醉酒、跌倒或突发疾病', level: '高', commander: '应急负责人', contacts: '120、酒店医务、家属联系人', responseSteps: '移至安全区域\n判断是否呼叫急救\n保留通道\n记录处置过程\n安排家属陪同', backupResource: '急救包、轮椅、备用房、医院路线', linkedArea: '宴会厅、迎宾区', status },
  { id: 'risk-food', scenario: '食品安全或严重过敏', trigger: '多人不适、明确过敏反应或菜品异常', level: '高', commander: '酒店接口人', contacts: '宴会经理、后厨负责人、应急负责人', responseSteps: '停止相关菜品\n留样并封存\n启动医疗处置\n登记桌号与人员\n按酒店流程上报', backupResource: '菜品留样、过敏宾客清单、备用餐食', linkedArea: '后厨、宴会厅', status },
  { id: 'risk-lost', scenario: '关键物料遗失', trigger: '戒指、证件、礼金、U盘或重要礼服找不到', level: '高', commander: '物料组长', contacts: '保管人、交接人、场地区域负责人', responseSteps: '冻结最后交接点\n按箱码和交接记录追溯\n启用备用物品\n完成事件记录', backupResource: '备用戒指盒、证件复印件、双备份U盘、备用礼服配件', linkedArea: '新人房、总控台、礼金台', status }
];

const baseMenus = (): BanquetMenuPlan[] => [
  { id: 'menu-main', name: '婚宴正桌菜单A', mealType: '晚宴', tableType: '正桌', tableCount: 30, pricePerTable: 4888, trialDate: '', hotelContact: '', dishes: '迎宾八味碟、花胶炖鸡汤、金蒜蒸龙虾、清蒸东星斑、黑椒牛肋骨、招牌烧鹅、时蔬双拼、海鲜炒饭、幸福甜品、时令果盘', allergenNotes: '海鲜、坚果、乳制品需单独标注', serviceNotes: '18:38统一开席；热菜按桌区分批上菜', status },
  { id: 'menu-backup', name: '备用桌菜单', mealType: '晚宴', tableType: '备用桌', tableCount: 2, pricePerTable: 4888, trialDate: '', hotelContact: '', dishes: '与正桌一致，按实际开桌计费', allergenNotes: '跟随正桌规则', serviceNotes: '18:20由总指挥确认是否开桌', status },
  { id: 'menu-child', name: '儿童餐', mealType: '晚宴', tableType: '儿童餐', tableCount: 12, pricePerTable: 88, trialDate: '', hotelContact: '', dishes: '意面、鸡翅、蒸蛋、蔬菜、果汁、水果', allergenNotes: '不放辣；坚果单独包装', serviceNotes: '儿童到场后由服务员按名单发放', status },
  { id: 'menu-vegetarian', name: '素食及特殊餐', mealType: '晚宴', tableType: '特殊餐', tableCount: 6, pricePerTable: 168, trialDate: '', hotelContact: '', dishes: '菌菇汤、素烧双菇、时蔬、豆腐、素炒饭、水果', allergenNotes: '与普通后厨工具分开，按宾客姓名贴签', serviceNotes: '由宾客组与服务员一对一核对', status },
  { id: 'menu-staff', name: '工作人员餐', mealType: '工作餐', tableType: '盒饭', tableCount: 35, pricePerTable: 35, trialDate: '', hotelContact: '', dishes: '两荤一素、米饭、饮用水', allergenNotes: '摄影与主持需预留不辣餐', serviceNotes: '11:30午餐；16:30晚餐；分批领取', status }
];

const baseBeverages = (): BeveragePlan[] => [
  { id: 'bev-baijiu', category: '白酒', brand: '待定品牌', product: '婚宴白酒', spec: '500ml/瓶', unit: '瓶', plannedQty: 72, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '主桌每桌2瓶，其他桌每桌1瓶，酒水组统一开瓶', supplier: '', owner: '酒水组长', status },
  { id: 'bev-redwine', category: '红酒', brand: '待定酒庄', product: '干红葡萄酒', spec: '750ml/瓶', unit: '瓶', plannedQty: 64, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '每桌2瓶，开席前30分钟醒酒', supplier: '', owner: '酒水组长', status },
  { id: 'bev-beer', category: '啤酒', brand: '青岛/百威待定', product: '瓶装啤酒', spec: '330ml×24瓶/箱', unit: '箱', plannedQty: 12, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '按桌区补充，不提前全部拆箱', supplier: '', owner: '酒水组长', status },
  { id: 'bev-champagne', category: '香槟', brand: '待定品牌', product: '仪式香槟', spec: '750ml/瓶', unit: '瓶', plannedQty: 6, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '仪式2瓶，主桌4瓶；另备无酒精替代', supplier: '', owner: '婚庆接口人', status },
  { id: 'bev-cola', category: '软饮', brand: '可口可乐/雪碧', product: '碳酸饮料', spec: '1.25L/瓶', unit: '瓶', plannedQty: 80, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '每桌各1瓶，按消耗补充', supplier: '', owner: '酒水组长', status },
  { id: 'bev-juice', category: '软饮', brand: '汇源/味全待定', product: '果汁', spec: '1L/瓶', unit: '瓶', plannedQty: 40, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '儿童和不饮酒宾客优先', supplier: '', owner: '酒水组长', status },
  { id: 'bev-water', category: '饮用水', brand: '农夫山泉/怡宝', product: '矿泉水', spec: '550ml×24瓶/箱', unit: '箱', plannedQty: 18, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '新人房、供应商、后台和宾客区分开配额', supplier: '', owner: '物料组长', status },
  { id: 'bev-tea', category: '茶饮', brand: '酒店茶水', product: '迎宾茶与餐后茶', spec: '壶', unit: '壶', plannedQty: 40, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '迎宾区提前供应，开席后每桌续壶', supplier: '酒店', owner: '酒店接口人', status }
];

const baseDeployments = (): VenueDeployment[] => [
  { id: 'zone-stage', name: '主舞台', category: '舞台', floor: '宴会层', zone: '宴会厅正前方', x: 30, y: 4, width: 40, height: 16, rotation: 0, power: '三相电/80kW', fireAccess: false, owner: '婚庆接口人', status, note: 'LED、灯光架、音响、香槟塔和蛋糕台均需确认承重' },
  { id: 'zone-aisle', name: '主通道', category: '动线', floor: '宴会层', zone: '舞台至厅门', x: 45, y: 20, width: 10, height: 55, rotation: 0, power: '无', fireAccess: true, owner: '婚庆接口人', status, note: '净宽不小于1.8米，禁止堆物' },
  { id: 'zone-tables', name: '宾客桌区', category: '宴会', floor: '宴会层', zone: '宴会厅中央', x: 12, y: 24, width: 76, height: 48, rotation: 0, power: '桌面灯低压', fireAccess: false, owner: '酒店接口人', status, note: '按排桌方案分区，预留服务通道' },
  { id: 'zone-signin', name: '签到台', category: '宾客服务', floor: '宴会层', zone: '厅外前厅', x: 6, y: 78, width: 22, height: 12, rotation: 0, power: '220V/2位', fireAccess: false, owner: '签到组长', status, note: '签到、席位查询、伴手礼和礼金分台处理' },
  { id: 'zone-gift', name: '礼金台', category: '宾客服务', floor: '宴会层', zone: '签到台内侧', x: 30, y: 78, width: 14, height: 12, rotation: 0, power: '220V/1位', fireAccess: false, owner: '礼金组', status, note: '双人复核，远离公共通道，设置可锁抽屉' },
  { id: 'zone-dessert', name: '甜品台', category: '餐饮', floor: '宴会层', zone: '前厅右侧', x: 72, y: 78, width: 20, height: 12, rotation: 0, power: '220V/3位', fireAccess: false, owner: '甜品供应商', status, note: '冷藏设备提前确认功率' },
  { id: 'zone-control', name: '音控台', category: '技术', floor: '宴会层', zone: '宴会厅后方', x: 76, y: 4, width: 18, height: 12, rotation: 0, power: '独立回路/20kW', fireAccess: false, owner: '技术总控', status, note: '保留到舞台直视视线和有线网络' },
  { id: 'zone-camera', name: '主摄影机位', category: '影像', floor: '宴会层', zone: '主通道后方', x: 58, y: 58, width: 10, height: 8, rotation: 0, power: '220V/1位', fireAccess: false, owner: '摄影负责人', status, note: '禁止服务员和宾客长期遮挡' },
  { id: 'zone-beverage', name: '酒水仓', category: '后勤', floor: '宴会层', zone: '后场服务间', x: 2, y: 2, width: 18, height: 14, rotation: 0, power: '照明', fireAccess: false, owner: '酒水组长', status, note: '入库、开瓶、空瓶和退回分区' },
  { id: 'zone-loading', name: '装卸区', category: '物流', floor: '地面层', zone: '酒店后门', x: 2, y: 92, width: 24, height: 6, rotation: 0, power: '无', fireAccess: true, owner: '物料组长', status, note: '供应商车辆分时到达，不得占用消防车道' },
  { id: 'zone-exit', name: '消防出口', category: '安全', floor: '宴会层', zone: '宴会厅侧门', x: 94, y: 42, width: 5, height: 14, rotation: 0, power: '应急照明', fireAccess: true, owner: '酒店接口人', status, note: '全程保持畅通' },
  { id: 'zone-parking', name: '宾客停车区', category: '交通', floor: '地下层', zone: 'B2停车场', x: 32, y: 92, width: 62, height: 6, rotation: 0, power: '充电位按酒店配置', fireAccess: true, owner: '车辆组长', status, note: '预留父母车、新人车和无障碍车位' }
];

const baseHospitality = (): HospitalityService[] => [
  { id: 'host-airport', serviceType: '接驳', guestGroup: '外地亲友', headcount: 28, arrivalAt: '14:00', departureAt: '15:30', vehicle: '33座大巴1辆', driver: '', hotel: '婚礼酒店', roomCount: 0, giftCount: 28, owner: '车辆组长', status, note: '机场/高铁站两条路线按航班和车次分组' },
  { id: 'host-hotel', serviceType: '住宿', guestGroup: '外地亲友', headcount: 36, arrivalAt: '前一日14:00', departureAt: '次日12:00', vehicle: '', driver: '', hotel: '婚礼酒店', roomCount: 20, giftCount: 36, owner: '宾客接待负责人', status, note: '双床房、家庭房和长辈安静房分开统计' },
  { id: 'host-elder', serviceType: '长辈接待', guestGroup: '双方长辈', headcount: 18, arrivalAt: '16:30', departureAt: '21:30', vehicle: '商务车2辆', driver: '', hotel: '', roomCount: 2, giftCount: 18, owner: '长辈接口人', status, note: '靠近电梯和洗手间；安排休息房与轮椅' },
  { id: 'host-child', serviceType: '儿童服务', guestGroup: '亲子家庭', headcount: 16, arrivalAt: '17:00', departureAt: '21:00', vehicle: '', driver: '', hotel: '', roomCount: 0, giftCount: 16, owner: '宾客组', status, note: '儿童椅、儿童餐、绘画包和防走失贴' },
  { id: 'host-accessible', serviceType: '无障碍', guestGroup: '行动不便宾客', headcount: 4, arrivalAt: '16:30', departureAt: '21:30', vehicle: '无障碍车辆待确认', driver: '', hotel: '', roomCount: 1, giftCount: 4, owner: '宾客组', status, note: '无障碍车位、电梯、桌位和洗手间路线确认' },
  { id: 'host-signin', serviceType: '签到引导', guestGroup: '全部宾客', headcount: 280, arrivalAt: '16:30', departureAt: '18:30', vehicle: '', driver: '', hotel: '', roomCount: 0, giftCount: 280, owner: '签到组长', status, note: '按男方、女方、共同好友和公司同事分四条队列' },
  { id: 'host-gift', serviceType: '伴手礼', guestGroup: '确认出席宾客', headcount: 280, arrivalAt: '20:30', departureAt: '22:00', vehicle: '', driver: '', hotel: '', roomCount: 0, giftCount: 294, owner: '伴手礼负责人', status, note: '按邀请户发放；儿童礼单独标记' },
  { id: 'host-departure', serviceType: '离场接驳', guestGroup: '外地与长辈宾客', headcount: 52, arrivalAt: '21:00', departureAt: '22:30', vehicle: '大巴1辆+商务车2辆', driver: '', hotel: '婚礼酒店/高铁站', roomCount: 0, giftCount: 0, owner: '车辆组长', status, note: '按酒店、车站和自驾三组引导' }
];

const baseCeremony = (): CeremonyProgram[] => [
  { id: 'cer-welcome', time: '16:30', type: '迎宾', title: '新人迎宾与合影', durationMinutes: 70, location: '迎宾区', performer: '新人、伴郎伴娘', hostScript: '摄影引导分组拍照，避免宾客长时间排队', music: '轻爵士迎宾歌单', media: '迎宾电子相册', cue: '摄影负责人通知最后一组后收尾', owner: '宾客组长', backup: '副总指挥', rehearsalStatus: '无需彩排', status },
  { id: 'cer-warmup', time: '17:40', type: '暖场', title: '暖场视频与入席提示', durationMinutes: 15, location: '宴会厅', performer: '主持人', hostScript: '提醒宾客入席、手机静音并介绍仪式即将开始', music: '暖场音乐', media: '成长视频', cue: '总指挥确认新人、父母、戒指均到位', owner: '主持人', backup: '婚庆接口人', rehearsalStatus: '待联排', status },
  { id: 'cer-opening', time: '18:08', type: '开场', title: '主持人开场', durationMinutes: 5, location: '主舞台', performer: '主持人', hostScript: '欢迎宾客并引出新郎入场', music: '开场氛围音乐', media: '开场主视觉', cue: '灯光全暗后追光落主持人', owner: '主持人', backup: '婚庆接口人', rehearsalStatus: '待彩排', status },
  { id: 'cer-groom', time: '18:13', type: '入场', title: '新郎入场', durationMinutes: 4, location: '主通道', performer: '新郎', hostScript: '新郎从厅门入场至舞台中央', music: '新郎入场音乐', media: '新郎名字动画', cue: '厅门打开、追光跟随', owner: '新郎接口人', backup: '伴郎', rehearsalStatus: '待彩排', status },
  { id: 'cer-bride', time: '18:17', type: '入场', title: '新娘与父亲入场', durationMinutes: 7, location: '主通道', performer: '新娘、父亲', hostScript: '交接仪式后新人共同上台', music: '新娘入场音乐', media: '花瓣动画', cue: '花门开启、干冰与追光同步', owner: '新娘接口人', backup: '伴娘', rehearsalStatus: '待彩排', status },
  { id: 'cer-vows', time: '18:24', type: '誓言', title: '新人誓言', durationMinutes: 8, location: '主舞台', performer: '新人', hostScript: '主持人引导双方依次宣读誓言', music: '低音量钢琴铺底', media: '誓言背景', cue: '递上誓言卡，话筒切换', owner: '主持人', backup: '伴郎伴娘', rehearsalStatus: '待彩排', status },
  { id: 'cer-rings', time: '18:32', type: '戒指', title: '交换戒指', durationMinutes: 5, location: '主舞台', performer: '新人、戒童', hostScript: '戒童送上戒指，新人交换并拥抱', music: '戒指环节音乐', media: '戒指特写画面', cue: '戒童从侧台出发，摄影切近景', owner: '新郎接口人', backup: '伴郎', rehearsalStatus: '待彩排', status },
  { id: 'cer-parents', time: '18:37', type: '致辞', title: '父母代表致辞', durationMinutes: 8, location: '主舞台', performer: '双方父母代表', hostScript: '每位控制在4分钟内', music: '上台音乐', media: '家庭合影背景', cue: '礼仪递话筒和纸巾', owner: '父母接口人', backup: '主持人', rehearsalStatus: '稿件待确认', status },
  { id: 'cer-toast', time: '18:45', type: '仪式', title: '香槟塔与全场举杯', durationMinutes: 8, location: '主舞台', performer: '新人', hostScript: '新人倒香槟后邀请全场共同举杯', music: '庆祝音乐', media: '金色粒子动画', cue: '酒店服务员将酒杯送到位', owner: '婚庆接口人', backup: '酒店接口人', rehearsalStatus: '待彩排', status },
  { id: 'cer-dinner', time: '18:53', type: '开席', title: '宣布开席', durationMinutes: 5, location: '宴会厅', performer: '主持人', hostScript: '介绍用餐与后续互动安排', music: '开席音乐', media: '菜单与祝福画面', cue: '酒店接口人确认首道热菜已到出餐口', owner: '酒店接口人', backup: '总指挥', rehearsalStatus: '流程确认', status },
  { id: 'cer-toast-round', time: '19:20', type: '敬酒', title: '新人分区敬酒', durationMinutes: 50, location: '宾客桌区', performer: '新人、伴郎伴娘', hostScript: '按主桌、长辈、亲友、同事顺序推进', music: '宴会背景音乐', media: '', cue: '酒水组提前准备敬酒杯与补酒', owner: '副总指挥', backup: '酒水组长', rehearsalStatus: '路线待确认', status },
  { id: 'cer-farewell', time: '21:10', type: '送客', title: '送客与伴手礼发放', durationMinutes: 50, location: '厅门与前厅', performer: '新人、宾客组', hostScript: '提醒宾客领取伴手礼和停车券', music: '温馨送客歌单', media: '感谢画面', cue: '伴手礼组、车辆组同时到位', owner: '宾客组长', backup: '副总指挥', rehearsalStatus: '流程确认', status }
];

const baseVendors = (): VendorDelivery[] => [
  { id: 'vendor-hotel', vendor: '婚礼酒店', category: '酒店', deliverable: '宴会厅、桌椅、菜单、服务员、后厨、停车和客房', arrivalAt: '09:00', entryGate: '酒店内部', vehicle: '', staffCount: 28, powerNeed: '酒店工程统一管理', acceptance: '厅房清洁、桌椅数量、布草、菜单、服务班组和停车位确认', owner: '酒店接口人', exitAt: '23:00', status },
  { id: 'vendor-planner', vendor: '婚庆策划', category: '婚庆', deliverable: '策划、舞美、花艺、灯光、音响、主持与执行团队', arrivalAt: '08:00', entryGate: '酒店后门', vehicle: '货车2辆', staffCount: 18, powerNeed: '约80kW', acceptance: '按效果图、设备清单、花材清单和时间表逐项验收', owner: '婚庆接口人', exitAt: '23:30', status },
  { id: 'vendor-photo', vendor: '摄影团队', category: '影像', deliverable: '双机摄影、即时快修、全量照片与精修册', arrivalAt: '06:30', entryGate: '正门', vehicle: '轿车1辆', staffCount: 3, powerNeed: '充电位2个', acceptance: '机位、存储卡、备机、交付周期和备份方式确认', owner: '摄影负责人', exitAt: '22:00', status },
  { id: 'vendor-video', vendor: '摄像团队', category: '影像', deliverable: '双机摄像、摇臂或稳定器、快剪和成片', arrivalAt: '06:30', entryGate: '正门', vehicle: '商务车1辆', staffCount: 4, powerNeed: '充电位3个', acceptance: '分辨率、收音、快剪时长、素材备份和版权音乐确认', owner: '摄像负责人', exitAt: '22:30', status },
  { id: 'vendor-makeup', vendor: '妆造团队', category: '妆造', deliverable: '新娘跟妆、妈妈妆、伴娘妆和补妆', arrivalAt: '05:30', entryGate: '客房电梯', vehicle: '轿车1辆', staffCount: 3, powerNeed: '220V/3位', acceptance: '妆面、发型、饰品、换装次数和补妆节点确认', owner: '新娘接口人', exitAt: '21:30', status },
  { id: 'vendor-host', vendor: '主持人', category: '主持', deliverable: '主持词、流程控场、彩排与突发过渡', arrivalAt: '14:00', entryGate: '正门', vehicle: '', staffCount: 1, powerNeed: '无', acceptance: '新人姓名读音、家庭称谓、禁忌、主持词和音乐点位确认', owner: '婚庆接口人', exitAt: '20:30', status },
  { id: 'vendor-dessert', vendor: '甜品供应商', category: '餐饮', deliverable: '甜品台、婚礼蛋糕、冷藏设备和摆台', arrivalAt: '14:30', entryGate: '酒店后门', vehicle: '冷链车1辆', staffCount: 3, powerNeed: '220V/3位', acceptance: '数量、温度、造型、过敏源、刀具和撤台时间确认', owner: '酒店接口人', exitAt: '21:30', status },
  { id: 'vendor-gift', vendor: '伴手礼供应商', category: '礼品', deliverable: '伴手礼294份、儿童礼16份和备用包装', arrivalAt: '前一日16:00', entryGate: '酒店后门', vehicle: '货车1辆', staffCount: 2, powerNeed: '无', acceptance: '数量、保质期、包装、姓名贴和破损率确认', owner: '伴手礼负责人', exitAt: '交付后离场', status }
];

const baseLogistics = (): LogisticsRecord[] => [
  { id: 'log-ring', name: '婚戒与戒指盒', category: '仪式关键物品', quantity: 1, unit: '套', boxCode: 'KEY-01', vehicle: '新郎车', loadOrder: 1, storage: '总指挥随身包', handoverTo: '新郎接口人', returnRequired: true, returnedQty: 0, status },
  { id: 'log-doc', name: '新人证件与酒店资料', category: '证件文件', quantity: 1, unit: '袋', boxCode: 'KEY-02', vehicle: '新郎车', loadOrder: 2, storage: '总指挥随身包', handoverTo: '总指挥', returnRequired: true, returnedQty: 0, status },
  { id: 'log-dress', name: '婚纱礼服与配件', category: '服装', quantity: 5, unit: '套', boxCode: 'DRESS-01', vehicle: '新娘车', loadOrder: 1, storage: '新娘房衣架区', handoverTo: '新娘接口人', returnRequired: true, returnedQty: 0, status },
  { id: 'log-signin', name: '签到与礼金用品', category: '宾客服务', quantity: 1, unit: '箱', boxCode: 'GUEST-01', vehicle: '物料车A', loadOrder: 3, storage: '签到台后方', handoverTo: '签到组长', returnRequired: true, returnedQty: 0, status },
  { id: 'log-gifts', name: '伴手礼', category: '礼品', quantity: 294, unit: '份', boxCode: 'GIFT-01~15', vehicle: '物料车A', loadOrder: 6, storage: '前厅储物间', handoverTo: '伴手礼负责人', returnRequired: false, returnedQty: 0, status },
  { id: 'log-beverage', name: '自备酒水', category: '酒水', quantity: 18, unit: '箱', boxCode: 'BEV-01~18', vehicle: '酒水车', loadOrder: 5, storage: '酒水仓', handoverTo: '酒水组长', returnRequired: true, returnedQty: 0, status },
  { id: 'log-media', name: '视频与音乐双备份', category: '媒体', quantity: 3, unit: '份', boxCode: 'MEDIA-01', vehicle: '总指挥车', loadOrder: 1, storage: '音控台+云盘+总指挥U盘', handoverTo: '技术总控', returnRequired: true, returnedQty: 0, status },
  { id: 'log-emergency', name: '应急箱', category: '应急', quantity: 2, unit: '箱', boxCode: 'SAFE-01/02', vehicle: '物料车A', loadOrder: 2, storage: '总控台与新娘房', handoverTo: '应急负责人', returnRequired: true, returnedQty: 0, status },
  { id: 'log-decor', name: '自备装饰与照片', category: '装饰', quantity: 4, unit: '箱', boxCode: 'DECO-01~04', vehicle: '物料车B', loadOrder: 4, storage: '婚庆后场', handoverTo: '婚庆接口人', returnRequired: true, returnedQty: 0, status },
  { id: 'log-redpacket', name: '红包与备用现金', category: '财务', quantity: 1, unit: '包', boxCode: 'KEY-03', vehicle: '总指挥车', loadOrder: 1, storage: '总指挥随身包', handoverTo: '总指挥', returnRequired: true, returnedQty: 0, status }
];

function westernHotel(): WeddingOperationsDraft {
  return {
    version: 1, templateId: 'western-hotel', templateName: '西式酒店婚礼完整版', updatedAt: new Date().toISOString(),
    menus: baseMenus(), beverages: baseBeverages(), deployments: baseDeployments(), staffPositions: commonStaff(),
    hospitalityServices: baseHospitality(), ceremonyPrograms: baseCeremony(), vendorDeliveries: baseVendors(),
    logisticsRecords: baseLogistics(), emergencyPlans: commonEmergencies()
  };
}

function chineseBanquet(): WeddingOperationsDraft {
  const draft = westernHotel();
  draft.templateId = 'chinese-banquet'; draft.templateName = '中式婚宴完整版';
  draft.menus[0] = { ...draft.menus[0]!, name: '中式婚宴正桌', dishes: '鸿运乳猪拼盘、花胶炖鸡汤、金蒜蒸龙虾、清蒸东星斑、鲍鱼扣鹅掌、脆皮烧鹅、八宝扒鸭、时蔬双拼、幸福炒饭、百年好合糖水、时令果盘', serviceNotes: '按吉时鸣礼开席，敬酒开始前完成主菜上桌' };
  draft.beverages[0] = { ...draft.beverages[0]!, brand: '茅台/五粮液/国窖待定', product: '中式宴席白酒', plannedQty: 96 };
  draft.ceremonyPrograms = [
    { ...baseCeremony()[0]!, id: 'cn-door', time: '08:08', type: '接亲', title: '接亲与迎亲游戏', location: '新娘家', music: '喜庆接亲歌单', media: '', cue: '伴郎团到达后按游戏清单执行', owner: '伴娘团长', backup: '新娘接口人' },
    { ...baseCeremony()[0]!, id: 'cn-tea', time: '10:18', type: '敬茶', title: '双方父母敬茶改口', location: '新房或酒店套房', music: '古风轻音乐', media: '家庭照片', cue: '茶具、跪垫、红包和称谓表到位', owner: '父母接口人', backup: '总指挥' },
    ...baseCeremony().slice(0, 2).map((item, index) => ({ ...item, id: `cn-${item.id}`, time: index === 0 ? '16:30' : '17:40' })),
    { ...baseCeremony()[2]!, id: 'cn-opening', title: '中式开场与新人登台', media: '囍字主视觉', music: '中式开场音乐' },
    { ...baseCeremony()[7]!, id: 'cn-parent', title: '父母致辞与家训祝福' },
    { ...baseCeremony()[8]!, id: 'cn-toast', title: '合卺礼与全场举杯', music: '中式庆典音乐' },
    { ...baseCeremony()[10]!, id: 'cn-rounds', title: '新人多轮敬酒', durationMinutes: 70 },
    { ...baseCeremony()[11]!, id: 'cn-farewell', title: '送客与回礼发放' }
  ];
  draft.deployments.push({ id: 'zone-tea', name: '敬茶区', category: '礼俗', floor: '套房层', zone: '新房客厅', x: 4, y: 62, width: 22, height: 12, rotation: 0, power: '无', fireAccess: false, owner: '父母接口人', status, note: '跪垫、茶具、红包和称谓表按顺序摆放' });
  draft.staffPositions.push({ id: 'staff-custom', team: '礼俗组', position: '礼俗流程负责人', scope: '接亲、敬茶、改口、红包、礼炮和敬酒顺序', owner: '', backup: '', contact: '', shiftStart: '06:00', shiftEnd: '21:30', meetingPoint: '新娘家', reportTo: '总指挥', checklist: '礼炮\n茶具\n跪垫\n红包\n称谓表\n敬酒顺序', status });
  return draft;
}

function outdoorLawn(): WeddingOperationsDraft {
  const draft = westernHotel();
  draft.templateId = 'outdoor-lawn'; draft.templateName = '户外草坪婚礼';
  draft.menus = draft.menus.map(item => ({ ...item, mealType: item.id === 'menu-staff' ? '工作餐' : '户外晚宴', serviceNotes: `${item.serviceNotes}；注意保温、防尘、防虫和雨备转场` }));
  draft.deployments = [
    { id: 'lawn-ceremony', name: '草坪仪式区', category: '仪式', floor: '户外', zone: '主草坪', x: 24, y: 6, width: 52, height: 30, rotation: 0, power: '临时配电/30kW', fireAccess: true, owner: '婚庆接口人', status, note: '确认草坪承重、排水、风力和日照方向' },
    { id: 'lawn-aisle', name: '草坪通道', category: '动线', floor: '户外', zone: '主草坪', x: 44, y: 36, width: 12, height: 38, rotation: 0, power: '低压地灯', fireAccess: true, owner: '婚庆接口人', status, note: '地面找平并设置防滑垫' },
    { id: 'lawn-seating', name: '仪式座椅区', category: '宾客', floor: '户外', zone: '主草坪', x: 12, y: 38, width: 76, height: 32, rotation: 0, power: '无', fireAccess: false, owner: '宾客组长', status, note: '预留长辈、儿童和无障碍区域' },
    { id: 'lawn-tent', name: '雨备帐篷', category: '天气', floor: '户外', zone: '草坪侧区', x: 3, y: 6, width: 18, height: 28, rotation: 0, power: '临时配电/20kW', fireAccess: true, owner: '婚庆接口人', status, note: '抗风等级、配重、排水槽和消防距离确认' },
    { id: 'lawn-generator', name: '备用发电机', category: '电力', floor: '户外', zone: '后勤区', x: 78, y: 5, width: 18, height: 14, rotation: 0, power: '柴油发电机', fireAccess: true, owner: '技术总控', status, note: '远离宾客，设置隔音与防雨，准备燃料' },
    { id: 'lawn-catering', name: '户外餐饮区', category: '餐饮', floor: '户外', zone: '宴会草坪', x: 8, y: 76, width: 62, height: 20, rotation: 0, power: '临时配电/40kW', fireAccess: true, owner: '餐饮负责人', status, note: '冷链、热食保温、洗手和垃圾处理明确' },
    { id: 'lawn-restroom', name: '临时洗手间', category: '设施', floor: '户外', zone: '停车区侧', x: 74, y: 78, width: 20, height: 14, rotation: 0, power: '照明与水泵', fireAccess: true, owner: '场地方', status, note: '照明、清洁、无障碍和指示牌' }
  ];
  draft.ceremonyPrograms = baseCeremony().filter(item => !['cer-dinner', 'cer-toast-round'].includes(item.id)).map(item => ({ ...item, location: item.location === '主舞台' ? '草坪仪式区' : item.location, rehearsalStatus: '户外联排待确认' }));
  draft.emergencyPlans[0] = { ...draft.emergencyPlans[0]!, trigger: '降雨概率≥40%、阵风≥6级、雷电或高温橙色预警', responseSteps: 'T-6小时决定是否切换雨备\n固定帐篷与装置\n铺设防滑通道\n通知宾客着装与交通变化', backupResource: '室内雨备厅、帐篷、配重、防滑垫、雨伞、风速仪' };
  draft.vendorDeliveries.push({ id: 'vendor-tent', vendor: '帐篷与临建设施供应商', category: '场地', deliverable: '雨备帐篷、配重、地板、照明和排水', arrivalAt: '前一日10:00', entryGate: '草坪后勤口', vehicle: '货车2辆', staffCount: 8, powerNeed: '20kW', acceptance: '抗风、配重、排水、防火、照明和撤场恢复确认', owner: '场地负责人', exitAt: '次日12:00', status });
  return draft;
}

function church(): WeddingOperationsDraft {
  const draft = westernHotel();
  draft.templateId = 'church'; draft.templateName = '教堂仪式婚礼';
  draft.deployments = [
    { id: 'church-altar', name: '圣坛仪式区', category: '仪式', floor: '教堂', zone: '圣坛前', x: 34, y: 4, width: 32, height: 18, rotation: 0, power: '教堂固定电源', fireAccess: false, owner: '教堂协调人', status, note: '装饰不得遮挡宗教标识，不得使用明火与大量花瓣' },
    { id: 'church-aisle', name: '中央通道', category: '动线', floor: '教堂', zone: '入口至圣坛', x: 44, y: 22, width: 12, height: 58, rotation: 0, power: '无', fireAccess: true, owner: '教堂协调人', status, note: '不得铺设影响安全的厚重地毯' },
    { id: 'church-pews', name: '宾客座席', category: '宾客', floor: '教堂', zone: '礼拜堂', x: 10, y: 25, width: 80, height: 46, rotation: 0, power: '无', fireAccess: false, owner: '宾客组长', status, note: '按家属、亲友、诗班和无障碍分区' },
    { id: 'church-choir', name: '诗班区', category: '音乐', floor: '教堂', zone: '圣坛侧方', x: 68, y: 6, width: 22, height: 16, rotation: 0, power: '固定音响', fireAccess: false, owner: '音乐负责人', status, note: '提前确认谱架、座椅和扩声限制' },
    { id: 'church-photo', name: '摄影限制区', category: '影像', floor: '教堂', zone: '礼拜堂后方与侧廊', x: 8, y: 78, width: 84, height: 12, rotation: 0, power: '无', fireAccess: true, owner: '摄影负责人', status, note: '禁止越过指定线、禁止闪光灯和无人机' },
    { id: 'church-transfer', name: '宴会转场集合点', category: '交通', floor: '教堂外', zone: '教堂前广场', x: 20, y: 92, width: 60, height: 6, rotation: 0, power: '无', fireAccess: true, owner: '车辆组长', status, note: '按大巴编号和宾客名单分组上车' }
  ];
  draft.ceremonyPrograms = [
    { ...baseCeremony()[1]!, id: 'church-prelude', time: '14:30', type: '序乐', title: '宾客入座与序乐', location: '教堂礼拜堂', performer: '管风琴/弦乐', hostScript: '引导宾客安静入座，提醒摄影限制', music: '序乐曲目单', media: '', cue: '教堂协调人确认座席完成', owner: '教堂协调人', backup: '宾客组长', rehearsalStatus: '待教堂彩排' },
    { ...baseCeremony()[2]!, id: 'church-processional', time: '15:00', type: '入堂', title: '婚礼队伍入堂', location: '中央通道', performer: '牧师、伴郎伴娘、新人', music: '入堂赞美诗', media: '', cue: '钟声结束后依次入堂', owner: '教堂协调人', backup: '副总指挥', rehearsalStatus: '待教堂彩排' },
    { ...baseCeremony()[5]!, id: 'church-reading', time: '15:12', type: '礼仪', title: '经文宣读与讲道', location: '圣坛', performer: '牧师、读经人', hostScript: '按教堂礼仪执行', music: '', media: '', cue: '读经人提前在侧席等候', owner: '牧师', backup: '教堂协调人', rehearsalStatus: '文稿待确认' },
    { ...baseCeremony()[5]!, id: 'church-vows', time: '15:28', type: '誓约', title: '婚姻誓约', location: '圣坛', performer: '新人、牧师', music: '低音量铺底或无音乐', media: '', cue: '新人面向彼此，话筒到位', owner: '牧师', backup: '教堂协调人', rehearsalStatus: '待教堂彩排' },
    { ...baseCeremony()[6]!, id: 'church-rings', time: '15:38', type: '戒指', title: '交换戒指与祝福', location: '圣坛', performer: '新人、牧师', music: '戒指环节赞美诗', media: '', cue: '伴郎递戒指', owner: '新郎接口人', backup: '伴郎', rehearsalStatus: '待教堂彩排' },
    { ...baseCeremony()[8]!, id: 'church-sign', time: '15:48', type: '签署', title: '签署婚礼证书', location: '圣坛侧桌', performer: '新人、证婚人', music: '签署音乐', media: '', cue: '证书、笔和见证人到位', owner: '教堂协调人', backup: '总指挥', rehearsalStatus: '文件待确认' },
    { ...baseCeremony()[11]!, id: 'church-exit', time: '16:00', type: '退堂', title: '新人退堂与教堂外合影', location: '中央通道与教堂前广场', performer: '新人、婚礼队伍', music: '退堂赞美诗', media: '', cue: '宾客在教堂外按组等待合影', owner: '摄影负责人', backup: '宾客组长', rehearsalStatus: '路线待确认' }
  ];
  draft.staffPositions.push({ id: 'staff-church', team: '教堂组', position: '教堂协调人', scope: '对接牧师、场地规定、礼仪次序、座席、彩排和摄影限制', owner: '', backup: '', contact: '', shiftStart: '12:00', shiftEnd: '17:00', meetingPoint: '教堂办公室', reportTo: '总指挥', checklist: '礼仪单\n彩排\n证书\n座席\n摄影限制\n转场', status });
  draft.hospitalityServices.push({ id: 'church-transfer', serviceType: '仪式转场', guestGroup: '教堂宾客', headcount: 160, arrivalAt: '16:20', departureAt: '17:10', vehicle: '大巴4辆', driver: '', hotel: '晚宴酒店', roomCount: 0, giftCount: 0, owner: '车辆组长', status, note: '按座席区和大巴编号分批离场' });
  return draft;
}

function destination(): WeddingOperationsDraft {
  const draft = outdoorLawn();
  draft.templateId = 'destination'; draft.templateName = '目的地婚礼';
  draft.hospitalityServices = [
    { id: 'dest-flight', serviceType: '航班管理', guestGroup: '全部外地宾客', headcount: 80, arrivalAt: '婚礼前2日', departureAt: '婚礼后1日', vehicle: '机场接驳大巴', driver: '', hotel: '度假酒店', roomCount: 0, giftCount: 80, owner: '旅行统筹', status, note: '收集航班号、证件姓名、行李件数和延误联系人' },
    { id: 'dest-hotel', serviceType: '住宿', guestGroup: '全部宾客', headcount: 80, arrivalAt: '婚礼前2日15:00', departureAt: '婚礼后1日12:00', vehicle: '', driver: '', hotel: '度假酒店', roomCount: 45, giftCount: 80, owner: '住宿负责人', status, note: '房型、同住人、早餐、押金、儿童床和无障碍房确认' },
    { id: 'dest-welcome', serviceType: '欢迎晚宴', guestGroup: '已到达宾客', headcount: 70, arrivalAt: '婚礼前1日18:00', departureAt: '婚礼前1日21:00', vehicle: '酒店摆渡车', driver: '', hotel: '海边餐厅', roomCount: 0, giftCount: 70, owner: '宾客组长', status, note: '简短欢迎词、当地餐饮、次日流程说明' },
    { id: 'dest-tour', serviceType: '宾客活动', guestGroup: '自愿参加宾客', headcount: 45, arrivalAt: '婚礼前1日09:00', departureAt: '婚礼前1日15:00', vehicle: '旅游大巴1辆', driver: '', hotel: '', roomCount: 0, giftCount: 0, owner: '旅行统筹', status, note: '景点预约、保险、饮水、防晒和返程时间' },
    { id: 'dest-ceremony', serviceType: '婚礼日接驳', guestGroup: '全部宾客', headcount: 80, arrivalAt: '15:30', departureAt: '22:00', vehicle: '摆渡车循环', driver: '', hotel: '仪式场地', roomCount: 0, giftCount: 80, owner: '车辆组长', status, note: '每15分钟一班，长辈和儿童优先' },
    { id: 'dest-departure', serviceType: '返程送机', guestGroup: '返程宾客', headcount: 80, arrivalAt: '婚礼后1日05:00', departureAt: '婚礼后1日18:00', vehicle: '按航班分组', driver: '', hotel: '机场', roomCount: 0, giftCount: 0, owner: '旅行统筹', status, note: '提前3小时出发，单独跟踪早班机和超大行李' }
  ];
  draft.staffPositions.push({ id: 'staff-travel', team: '旅行组', position: '旅行统筹', scope: '航班、证件、酒店、接驳、活动、保险和当地紧急协助', owner: '', backup: '', contact: '', shiftStart: '全天', shiftEnd: '全天', meetingPoint: '酒店前台', reportTo: '总指挥', checklist: '航班表\n房态表\n接驳表\n保险\n证件复印件\n当地医院', status });
  draft.vendorDeliveries.push({ id: 'vendor-local', vendor: '当地婚礼执行团队', category: '当地执行', deliverable: '场地、布置、设备、许可、翻译与当地供应商统筹', arrivalAt: '婚礼前2日', entryGate: '当地场地后勤口', vehicle: '当地货车', staffCount: 15, powerNeed: '按当地标准', acceptance: '合同、许可、保险、天气方案、设备清单和撤场恢复确认', owner: '旅行统筹', exitAt: '婚礼后1日', status });
  draft.logisticsRecords = draft.logisticsRecords.map(item => ({ ...item, vehicle: item.category === '媒体' || item.category === '仪式关键物品' ? '随身行李' : '跨城物流', storage: `度假酒店-${item.storage}` }));
  draft.emergencyPlans.push({ id: 'risk-travel', scenario: '航班取消或证件问题', trigger: '航班取消、严重延误、证件遗失或姓名不符', level: '高', commander: '旅行统筹', contacts: '航空公司、旅行社、保险公司、当地警方/领事协助', responseSteps: '确认受影响名单\n改签或安排替代交通\n处理住宿延长\n启动保险理赔\n证件遗失按当地流程报案', backupResource: '改签预算、备用酒店、证件复印件、旅行保险', linkedArea: '机场、酒店、行程', status });
  return draft;
}

const factories: Record<WeddingTemplateId, () => WeddingOperationsDraft> = {
  'western-hotel': westernHotel,
  'chinese-banquet': chineseBanquet,
  'outdoor-lawn': outdoorLawn,
  church,
  destination
};

export function createOperationsDraft(templateId: WeddingTemplateId): WeddingOperationsDraft {
  const factory = factories[templateId] ?? factories['western-hotel'];
  return structuredClone(factory());
}

export function templateMeta(templateId: WeddingTemplateId): TemplatePackMeta {
  return weddingTemplatePacks.find(item => item.id === templateId) ?? weddingTemplatePacks[0]!;
}
