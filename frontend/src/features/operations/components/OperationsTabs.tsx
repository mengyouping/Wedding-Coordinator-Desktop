import { Icon, type IconName } from '../../../components/Icon';
import type { OperationsCenterId } from '../model';

const tabs: Array<{ id: OperationsCenterId; label: string; description: string; icon: IconName }> = [
  { id: 'banquet', label: '宴会餐饮', description: '菜单与酒水', icon: 'budget' },
  { id: 'venue', label: '场地部署', description: '区域与动线', icon: 'seating' },
  { id: 'staffing', label: '岗位分工', description: '责任与班次', icon: 'tasks' },
  { id: 'hospitality', label: '宾客接待', description: '接驳住宿礼品', icon: 'guests' },
  { id: 'ceremony', label: '仪式内容', description: '节目与技术Cue', icon: 'timeline' },
  { id: 'vendors', label: '供应商交付', description: '进场验收退场', icon: 'vendors' },
  { id: 'logistics', label: '物流物料', description: '装箱交接回收', icon: 'materials' },
  { id: 'command', label: '现场作战', description: '状态与预案', icon: 'warroom' }
];

export function OperationsTabs({ active, onChange }: { active: OperationsCenterId; onChange(value: OperationsCenterId): void }) {
  return <nav className="panel operations-tabs" aria-label="婚礼全案八中心">{tabs.map(tab => <button key={tab.id} className={active === tab.id ? 'is-active' : ''} onClick={() => onChange(tab.id)}><span><Icon name={tab.icon} /></span><strong>{tab.label}</strong><small>{tab.description}</small></button>)}</nav>;
}
