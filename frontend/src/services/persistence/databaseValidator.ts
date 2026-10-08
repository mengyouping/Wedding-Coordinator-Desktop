import type { WeddingDatabase } from '../../types/domain';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertUniqueIds(name: string, rows: Array<{ id: string }>): void {
  const ids = new Set<string>();
  for (const row of rows) {
    assert(row.id.trim(), `${name} 存在空 id`);
    assert(!ids.has(row.id), `${name} 存在重复 id：${row.id}`);
    ids.add(row.id);
  }
}

function assertNoDependencyCycle(database: WeddingDatabase): void {
  const graph = new Map(database.tasks.map(task => [task.id, task.dependencyIds ?? []]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    assert(!visiting.has(id), `任务依赖形成循环：${id}`);
    visiting.add(id);
    for (const dependencyId of graph.get(id) ?? []) visit(dependencyId);
    visiting.delete(id);
    visited.add(id);
  };
  for (const id of graph.keys()) visit(id);
}

function validateBudgetWorkbook(database: WeddingDatabase): void {
  assert(database.budget.workbookVersion === 5, '预算工作簿必须升级到 v5');
  const categories = database.budget.categories ?? [];
  const parameters = database.budget.parameters ?? [];
  const milestones = database.budget.paymentMilestones ?? [];
  assertUniqueIds('预算分类', categories);
  assertUniqueIds('预算参数', parameters);
  assertUniqueIds('付款节点', milestones);

  const categoryIds = new Set(categories.map(item => item.id));
  const primaryIds = new Set(categories.filter(item => item.level === 1).map(item => item.id));
  const parameterKeys = new Set<string>();
  for (const category of categories) {
    assert(category.name.trim(), `预算分类 ${category.id} 名称不能为空`);
    assert(category.sortOrder >= 0, `预算分类 ${category.name} 排序无效`);
    if (category.level === 1) assert(!category.parentId, `一级分类 ${category.name} 不应存在父分类`);
    if (category.level === 2) assert(primaryIds.has(category.parentId), `二级分类 ${category.name} 引用了不存在的一级分类`);
  }
  for (const parameter of parameters) {
    assert(parameter.key.trim(), `预算参数 ${parameter.id} key 不能为空`);
    assert(!parameterKeys.has(parameter.key), `预算参数 key 重复：${parameter.key}`);
    parameterKeys.add(parameter.key);
    assert(['manual', 'derived', 'linked'].includes(parameter.mode), `预算参数 ${parameter.name} 来源类型无效`);
    if (parameter.mode === 'derived') assert(Boolean(parameter.formulaKey), `自动参数 ${parameter.name} 缺少公式规则`);
  }

  const budgetItemIds = new Set(database.budget.items.map(item => item.id));
  const contractIds = new Set(database.contracts.map(item => item.id));
  for (const item of database.budget.items) {
    assert(Boolean(item.categoryId && categoryIds.has(item.categoryId)), `预算项 ${item.name} 引用了不存在的一级分类`);
    assert(Boolean(item.secondaryCategoryId && categoryIds.has(item.secondaryCategoryId)), `预算项 ${item.name} 引用了不存在的二级分类`);
    if (item.inclusionParameterKey) assert(parameterKeys.has(item.inclusionParameterKey), `预算项 ${item.name} 的纳入参数不存在`);
    if (item.quantitySource === 'parameter') assert(Boolean(item.quantityParameterKey && parameterKeys.has(item.quantityParameterKey)), `预算项 ${item.name} 的数量参数不存在`);
    if (item.unitPriceSource === 'parameter') assert(Boolean(item.unitPriceParameterKey && parameterKeys.has(item.unitPriceParameterKey)), `预算项 ${item.name} 的单价参数不存在`);
    assert((item.sortOrder ?? 0) >= 0, `预算项 ${item.name} 排序无效`);
  }
  for (const milestone of milestones) {
    assert(categoryIds.has(milestone.categoryId), `付款节点 ${milestone.title} 引用了不存在的预算分类`);
    if (milestone.budgetItemId) assert(budgetItemIds.has(milestone.budgetItemId), `付款节点 ${milestone.title} 引用了不存在的预算项`);
    if (milestone.contractId) assert(contractIds.has(milestone.contractId), `付款节点 ${milestone.title} 引用了不存在的合同`);
    assert(milestone.ratio >= 0 && milestone.ratio <= 1, `付款节点 ${milestone.title} 比例必须在 0 到 1 之间`);
    assert(milestone.plannedAmount >= 0, `付款节点 ${milestone.title} 计划金额不能为负数`);
  }
  for (const task of database.tasks) {
    if (task.budgetCategoryId) assert(categoryIds.has(task.budgetCategoryId), `任务 ${task.title} 引用了不存在的预算分类`);
    if (task.budgetItemId) assert(budgetItemIds.has(task.budgetItemId), `任务 ${task.title} 引用了不存在的预算项`);
    if (task.contractId) assert(contractIds.has(task.contractId), `任务 ${task.title} 引用了不存在的合同`);
  }
}

export function validateDatabase(database: WeddingDatabase): WeddingDatabase {
  assert(database.schemaVersion === 4, '仅支持 Schema v4 根快照');
  assert(database.projectId.trim(), 'projectId 不能为空');
  assert(Number.isInteger(database.revision) && database.revision >= 1, 'revision 必须为正整数');
  assert(database.settings.projectName.trim(), '项目名称不能为空');
  assert(database.profile.groomName.trim() && database.profile.brideName.trim(), '新人姓名不能为空');
  assert(database.settings.autoLockMinutes >= 0, '自动锁定时间不能为负数');

  const collections: Array<[string, Array<{ id: string }>]> = [
    ['任务', database.tasks], ['宾客', database.guests], ['桌位', database.tables],
    ['排桌记录', database.seatAssignments], ['排桌方案', database.seatingPlans], ['供应商', database.vendors],
    ['流程节点', database.timeline], ['请帖', database.invitations], ['风险', database.risks],
    ['物料', database.materials], ['成员', database.members], ['附件', database.attachments],
    ['报价', database.quotes], ['合同', database.contracts], ['财务流水', database.transactions],
    ['作战事件', database.runbookEvents], ['签到记录', database.checkIns], ['现场异常', database.incidents],
    ['冲突记录', database.conflicts], ['待同步命令', database.outbox], ['审计日志', database.auditLogs]
  ];
  for (const [name, rows] of collections) assertUniqueIds(name, rows);
  validateBudgetWorkbook(database);

  const guestIds = new Set(database.guests.map(item => item.id));
  const tableIds = new Set(database.tables.map(item => item.id));
  const taskIds = new Set(database.tasks.map(item => item.id));
  const riskIds = new Set(database.risks.map(item => item.id));
  const vendorIds = new Set(database.vendors.map(item => item.id));
  const budgetItemIds = new Set(database.budget.items.map(item => item.id));
  const contractIds = new Set(database.contracts.map(item => item.id));
  const attachmentIds = new Set(database.attachments.map(item => item.id));
  const timelineIds = new Set(database.timeline.map(item => item.id));
  const assignmentGuestIds = new Set<string>();

  for (const assignment of database.seatAssignments) {
    assert(guestIds.has(assignment.guestId), `排桌记录 ${assignment.id} 引用了不存在的宾客`);
    assert(tableIds.has(assignment.tableId), `排桌记录 ${assignment.id} 引用了不存在的桌位`);
    assert(!assignmentGuestIds.has(assignment.guestId), `宾客 ${assignment.guestId} 存在重复排桌`);
    assignmentGuestIds.add(assignment.guestId);
  }

  for (const table of database.tables) {
    const occupied = database.seatAssignments.filter(item => item.tableId === table.id).reduce((total, item) => total + 1 + Math.max(0, item.companionCount), 0);
    assert(occupied <= table.capacity, `桌位 ${table.name} 已超出容量`);
    assert((table.rotation ?? 0) >= 0 && (table.rotation ?? 0) <= 360, `桌位 ${table.name} 旋转角度无效`);
  }

  for (const plan of database.seatingPlans) {
    const planGuestIds = new Set<string>();
    for (const assignment of plan.assignments) {
      assert(guestIds.has(assignment.guestId), `排桌方案 ${plan.name} 引用了不存在的宾客`);
      assert(tableIds.has(assignment.tableId), `排桌方案 ${plan.name} 引用了不存在的桌位`);
      assert(!planGuestIds.has(assignment.guestId), `排桌方案 ${plan.name} 中宾客重复`);
      planGuestIds.add(assignment.guestId);
    }
  }

  for (const invitation of database.invitations) {
    assert(guestIds.has(invitation.guestId), `请帖 ${invitation.id} 引用了不存在的宾客`);
    assert(Boolean(invitation.token?.trim()), `请帖 ${invitation.id} 缺少公开 Token`);
  }
  assert(new Set(database.invitations.map(item => item.token)).size === database.invitations.length, '请帖 Token 存在重复');

  for (const task of database.tasks) {
    for (const dependencyId of task.dependencyIds ?? []) {
      assert(taskIds.has(dependencyId), `任务 ${task.id} 引用了不存在的前置任务`);
      assert(dependencyId !== task.id, `任务 ${task.id} 不能依赖自身`);
    }
    for (const riskId of task.relatedRiskIds ?? []) assert(riskIds.has(riskId), `任务 ${task.id} 引用了不存在的风险`);
    assert(task.progress >= 0 && task.progress <= 100, `任务 ${task.id} 进度必须在 0 到 100 之间`);
  }
  assertNoDependencyCycle(database);

  for (const guest of database.guests) {
    for (const id of guest.mustSitWithGuestIds ?? []) assert(guestIds.has(id) && id !== guest.id, `宾客 ${guest.id} 的同桌约束无效`);
    for (const id of guest.avoidGuestIds ?? []) assert(guestIds.has(id) && id !== guest.id, `宾客 ${guest.id} 的避让约束无效`);
    for (const id of guest.preferredTableIds ?? []) assert(tableIds.has(id), `宾客 ${guest.id} 的桌位偏好无效`);
  }

  for (const risk of database.risks) {
    for (const taskId of risk.mitigationTaskIds ?? []) assert(taskIds.has(taskId), `风险 ${risk.id} 引用了不存在的缓解任务`);
    assert(risk.probability >= 1 && risk.probability <= 5, `风险 ${risk.id} 概率必须在 1 到 5 之间`);
    assert(risk.impact >= 1 && risk.impact <= 5, `风险 ${risk.id} 影响必须在 1 到 5 之间`);
  }

  for (const vendor of database.vendors) {
    const payments = vendor.payments ?? [];
    const paidBySchedule = payments.filter(item => item.status === '已支付').reduce((sum, item) => sum + item.amount, 0);
    assert(vendor.paidAmount <= vendor.contractAmount, `供应商 ${vendor.name} 已付款金额超过合同金额`);
    assert(paidBySchedule <= vendor.contractAmount, `供应商 ${vendor.name} 付款计划超过合同金额`);
  }

  for (const material of database.materials) {
    assert(material.checkedQuantity <= material.quantity, `物料 ${material.name} 验收数量超过计划数量`);
    assert((material.returnedQuantity ?? 0) <= material.quantity, `物料 ${material.name} 回收数量超过计划数量`);
  }

  for (const quote of database.quotes) {
    assert(vendorIds.has(quote.vendorId), `报价 ${quote.id} 引用了不存在的供应商`);
    assert(budgetItemIds.has(quote.budgetItemId), `报价 ${quote.id} 引用了不存在的预算项`);
    assert(quote.amount >= 0, `报价 ${quote.id} 金额无效`);
  }

  for (const contract of database.contracts) {
    assert(vendorIds.has(contract.vendorId), `合同 ${contract.id} 引用了不存在的供应商`);
    for (const id of contract.budgetItemIds) assert(budgetItemIds.has(id), `合同 ${contract.id} 引用了不存在的预算项`);
    for (const id of contract.attachmentIds) assert(attachmentIds.has(id), `合同 ${contract.id} 引用了不存在的附件`);
    assert(contract.amount >= 0, `合同 ${contract.id} 金额无效`);
  }

  for (const transaction of database.transactions) {
    if (transaction.contractId) assert(contractIds.has(transaction.contractId), `财务流水 ${transaction.id} 引用了不存在的合同`);
    if (transaction.vendorId) assert(vendorIds.has(transaction.vendorId), `财务流水 ${transaction.id} 引用了不存在的供应商`);
    if (transaction.budgetItemId) assert(budgetItemIds.has(transaction.budgetItemId), `财务流水 ${transaction.id} 引用了不存在的预算项`);
    assert(transaction.amount >= 0, `财务流水 ${transaction.id} 金额无效`);
  }

  for (const event of database.runbookEvents) assert(timelineIds.has(event.timelineItemId), `作战事件 ${event.id} 引用了不存在的流程节点`);
  for (const incident of database.incidents) if (incident.relatedRiskId) assert(riskIds.has(incident.relatedRiskId), `现场异常 ${incident.id} 引用了不存在的风险`);
  for (const attachment of database.attachments) {
    assert(attachment.size >= 0 && attachment.size <= 50 * 1024 * 1024, `附件 ${attachment.fileName} 超过 50MB 限制`);
    assert(Boolean(attachment.hash.trim()), `附件 ${attachment.fileName} 缺少哈希`);
  }
  return database;
}
