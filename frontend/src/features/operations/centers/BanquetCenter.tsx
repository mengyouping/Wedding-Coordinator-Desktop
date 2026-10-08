import { Icon } from '../../../components/Icon';
import { currency } from '../../../lib/format';
import { EditableOperationsTable, type OperationsColumn } from '../components/EditableOperationsTable';
import { OperationsSummary } from '../components/OperationsSummary';
import { operationsStatuses } from '../components/StatusSelect';
import type { BanquetMenuPlan, BeveragePlan } from '../model';
import { operationId } from '../model';

const menuColumns: Array<OperationsColumn<BanquetMenuPlan>> = [
  { key: 'name', label: '菜单版本', width: 180 },
  { key: 'mealType', label: '餐别', width: 100 },
  { key: 'tableType', label: '桌餐类型', width: 110 },
  { key: 'tableCount', label: '桌/份数', type: 'number', width: 90 },
  { key: 'pricePerTable', label: '单价', type: 'number', width: 110 },
  { key: 'trialDate', label: '试菜日期', type: 'date', width: 130 },
  { key: 'hotelContact', label: '酒店接口人', width: 120 },
  { key: 'dishes', label: '菜品清单', type: 'textarea', width: 320 },
  { key: 'allergenNotes', label: '忌口/过敏源', type: 'textarea', width: 220 },
  { key: 'serviceNotes', label: '上菜与服务规则', type: 'textarea', width: 240 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

const beverageColumns: Array<OperationsColumn<BeveragePlan>> = [
  { key: 'category', label: '类别', width: 90 },
  { key: 'brand', label: '品牌', width: 130 },
  { key: 'product', label: '产品', width: 150 },
  { key: 'spec', label: '规格', width: 120 },
  { key: 'unit', label: '单位', width: 70 },
  { key: 'plannedQty', label: '计划', type: 'number', width: 80 },
  { key: 'stockQty', label: '已入库', type: 'number', width: 90 },
  { key: 'openedQty', label: '已开瓶/箱', type: 'number', width: 100 },
  { key: 'returnedQty', label: '已退回', type: 'number', width: 90 },
  { key: 'serviceRule', label: '摆台/补充/开瓶规则', type: 'textarea', width: 260 },
  { key: 'supplier', label: '供应商', width: 140 },
  { key: 'owner', label: '负责人', width: 110 },
  { key: 'status', label: '状态', type: 'select', options: operationsStatuses, width: 110 }
];

export function BanquetCenter({ menus, beverages, onMenusChange, onBeveragesChange }: {
  menus: BanquetMenuPlan[];
  beverages: BeveragePlan[];
  onMenusChange(rows: BanquetMenuPlan[]): void;
  onBeveragesChange(rows: BeveragePlan[]): void;
}) {
  const totalDining = menus.reduce((sum, item) => sum + item.tableCount * item.pricePerTable, 0);
  const plannedBeverage = beverages.reduce((sum, item) => sum + item.plannedQty, 0);
  const stock = beverages.reduce((sum, item) => sum + item.stockQty, 0);
  const shortage = beverages.reduce((sum, item) => sum + Math.max(0, item.plannedQty - item.stockQty), 0);
  const remaining = beverages.reduce((sum, item) => sum + Math.max(0, item.stockQty - item.openedQty - item.returnedQty), 0);
  const patchMenu = (id: string, patch: Partial<BanquetMenuPlan>) => onMenusChange(menus.map(item => item.id === id ? { ...item, ...patch } : item));
  const patchBeverage = (id: string, patch: Partial<BeveragePlan>) => onBeveragesChange(beverages.map(item => item.id === id ? { ...item, ...patch } : item));

  return <div className="operations-center">
    <OperationsSummary metrics={[
      { label: '菜单版本', value: menus.length, detail: `${menus.reduce((sum, item) => sum + item.tableCount, 0)} 桌/份`, icon: <Icon name="budget" /> },
      { label: '桌餐计划金额', value: currency.format(totalDining), detail: '仅用于前端全案测算，不写入预算事实源', icon: <Icon name="finance" /> },
      { label: '酒水计划', value: plannedBeverage, detail: `已入库 ${stock}`, tone: shortage ? 'warning' : 'success', icon: <Icon name="materials" /> },
      { label: '酒水缺口', value: shortage, detail: `现场未开封余量 ${remaining}`, tone: shortage ? 'danger' : 'success', icon: <Icon name="warning" /> }
    ]} />

    <section className="panel operations-section"><header><div><span className="eyebrow">BANQUET MENU</span><h2>酒席菜单与桌餐版本</h2><p>把正桌、备用桌、儿童餐、素食餐和工作人员餐分开管理，试菜结果与服务要求落到具体版本。</p></div></header><EditableOperationsTable
      rows={menus}
      columns={menuColumns}
      onPatch={patchMenu}
      onAdd={() => onMenusChange([...menus, { id: operationId('menu'), name: '新增菜单版本', mealType: '晚宴', tableType: '正桌', tableCount: 1, pricePerTable: 0, trialDate: '', hotelContact: '', dishes: '', allergenNotes: '', serviceNotes: '', status: '待确认' }])}
      onDuplicate={row => onMenusChange([...menus, { ...structuredClone(row), id: operationId('menu'), name: `${row.name}副本` }])}
      onRemove={id => window.confirm('确认删除该菜单版本吗？') && onMenusChange(menus.filter(item => item.id !== id))}
    /></section>

    <section className="panel operations-section"><header><div><span className="eyebrow">BEVERAGE CONTROL</span><h2>酒水品牌、库存与开瓶回收</h2><p>计划、入库、开瓶和退回分别记录，避免只按采购数量判断现场余量。</p></div></header><EditableOperationsTable
      rows={beverages}
      columns={beverageColumns}
      onPatch={patchBeverage}
      onAdd={() => onBeveragesChange([...beverages, { id: operationId('bev'), category: '其他', brand: '', product: '新增酒水', spec: '', unit: '瓶', plannedQty: 0, stockQty: 0, openedQty: 0, returnedQty: 0, serviceRule: '', supplier: '', owner: '酒水组长', status: '待确认' }])}
      onDuplicate={row => onBeveragesChange([...beverages, { ...structuredClone(row), id: operationId('bev'), product: `${row.product}副本` }])}
      onRemove={id => window.confirm('确认删除该酒水计划吗？') && onBeveragesChange(beverages.filter(item => item.id !== id))}
    /></section>
  </div>;
}
