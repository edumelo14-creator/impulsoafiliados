import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Link as LinkIcon,
  Users,
  MessageSquare,
  Send,
  Send as TelegramIcon,
  Sparkles,
  Settings,
} from 'lucide-react';

export type PageId = 'dashboard' | 'links' | 'groups' | 'messages' | 'send' | 'vitrine';

interface SidebarProps {
  current: PageId;
  onNavigate: (id: PageId) => void;
  counts: { links: number; groups: number };
  onOpenSettings: () => void;
}

const navItems: { id: PageId; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard size={20} /> },
  { id: 'links', label: 'Meus Links', icon: <LinkIcon size={20} /> },
  { id: 'groups', label: 'Grupos', icon: <Users size={20} /> },
  { id: 'messages', label: 'Mensagens', icon: <MessageSquare size={20} /> },
  { id: 'send', label: 'Envios', icon: <Send size={20} /> },
  { id: 'vitrine', label: 'Vitrine', icon: <Sparkles size={20} /> },
];

export function Sidebar({ current, onNavigate, counts }: SidebarProps) {
  const badges: Partial<Record<PageId, number>> = {
    links: counts.links,
    groups: counts.groups,
  };
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink-200/70 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-sm shadow-primary-600/30">
          <TelegramIcon size={20} />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-ink-900">Impulso</p>
          <p className="text-[11px] font-medium leading-tight text-primary-600">Afiliado Shopee</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const active = current === item.id;
          const badge = badges[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              }`}
            >
              <span className={active ? 'text-primary-600' : 'text-ink-400 group-hover:text-ink-600'}>
                {item.icon}
              </span>
              {item.label}
              {badge != null && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active ? 'bg-primary-100 text-primary-700' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      <div className="m-3 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 p-4 text-white">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles size={16} /> Uso seguro
        </p>
        <p className="mt-1 text-xs text-success-50">
          Envios manuais com intervalos respeitam as regras do WhatsApp. Nunca automatize o envio.
        </p>
      </div>
    </aside>
  );
}

interface TopbarProps {
  title: string;
  subtitle: string;
  onMenuClick: () => void;
  onOpenSettings: () => void;
  children?: ReactNode;
}

export function Topbar({ title, subtitle, onMenuClick, onOpenSettings, children }: TopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-200/70 bg-white/80 px-4 backdrop-blur-md lg:px-8">
      <button
        onClick={onMenuClick}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 lg:hidden"
      >
        <LayoutDashboard size={20} />
      </button>
      <div className="flex-1">
        <h1 className="text-lg font-bold text-ink-900">{title}</h1>
        <p className="hidden text-sm text-ink-500 sm:block">{subtitle}</p>
      </div>
      <button
        onClick={onOpenSettings}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
      >
        <Settings size={20} />
      </button>
      {children}
    </header>
  );
}

interface MobileNavProps {
  current: PageId;
  onNavigate: (id: PageId) => void;
}

export function MobileNav({ current, onNavigate }: MobileNavProps) {
  const mobileItems = navItems.filter((i) =>
    ['dashboard', 'links', 'groups', 'send'].includes(i.id),
  );
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-ink-200 bg-white lg:hidden">
      {mobileItems.map((item) => {
        const active = current === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              active ? 'text-primary-600' : 'text-ink-400'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
