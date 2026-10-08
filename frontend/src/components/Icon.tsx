import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'dashboard' | 'projects' | 'budget' | 'finance' | 'tasks' | 'guests' | 'seating'
  | 'vendors' | 'timeline' | 'warroom' | 'invite' | 'attachments' | 'conflicts'
  | 'risk' | 'materials' | 'sparkles' | 'search' | 'plus' | 'copy' | 'download'
  | 'upload' | 'bell' | 'menu' | 'arrow' | 'check' | 'edit' | 'trash' | 'save'
  | 'calendar' | 'settings' | 'database' | 'warning' | 'close' | 'lock';

const paths: Record<IconName, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  projects: <><path d="M3 7h7l2 2h9v11H3Z"/><path d="M5 4h6l2 3"/></>,
  budget: <><path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16M15 4v16"/></>,
  finance: <><circle cx="12" cy="12" r="9"/><path d="M8 9h8M8 15h8M12 6v12"/></>,
  tasks: <><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.4 1.4L7 4.8M3 12l1.4 1.4L7 10.8M3 18l1.4 1.4L7 16.8"/></>,
  guests: <><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M16 4a4 4 0 0 1 0 8M18 14a6 6 0 0 1 4 6"/></>,
  seating: <><circle cx="12" cy="12" r="5"/><circle cx="12" cy="2.5" r="1.5"/><circle cx="12" cy="21.5" r="1.5"/><circle cx="2.5" cy="12" r="1.5"/><circle cx="21.5" cy="12" r="1.5"/></>,
  vendors: <><path d="M3 9h18l-2-5H5L3 9Z"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,
  timeline: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  warroom: <><path d="m12 3 8 4v5c0 5-3.4 8.4-8 9-4.6-.6-8-4-8-9V7Z"/><path d="M8 12h8M12 8v8"/></>,
  invite: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  attachments: <path d="m8 12 5.5-5.5a3 3 0 0 1 4.2 4.2L10 18.4a5 5 0 0 1-7.1-7.1l8-8"/>,
  conflicts: <><path d="M4 7h11M4 17h11"/><path d="m12 4 3 3-3 3M12 14l3 3-3 3"/><path d="M20 5v14"/></>,
  risk: <><path d="m12 3 9 16H3L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
  materials: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></>,
  sparkles: <><path d="m12 3 1.1 3.4 3.4 1.1-3.4 1.1L12 12l-1.1-3.4-3.4-1.1 3.4-1.1L12 3Z"/><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4"/><path d="M5 19h14"/></>,
  upload: <><path d="M12 21V9m0 0 4 4m-4-4-4 4"/><path d="M5 5h14"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  edit: <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></>,
  trash: <><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/></>,
  save: <><path d="M5 3h12l2 2v16H5Z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  warning: <><path d="m12 3 9 16H3L12 3Z"/><path d="M12 9v4M12 17h.01"/></>,
  close: <path d="M6 6l12 12M18 6 6 18"/>,
  lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
