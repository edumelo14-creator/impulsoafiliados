import { useState, useEffect } from 'react';
import { Sidebar, Topbar, MobileNav } from '@/components/ui/Shell';
import type { PageId } from '@/components/ui/Shell';
import { SettingsModal } from '@/components/SettingsModal';
import { Dashboard } from '@/pages/Dashboard';
import { Links } from '@/pages/Links';
import { Groups } from '@/pages/Groups';
import { Messages } from '@/pages/Messages';
import { SendPage } from '@/pages/SendPage';
import { Vitrine } from '@/pages/Vitrine';
import { VitrinePage } from '@/pages/VitrinePage';
import { Login } from '@/pages/Login';
import { useLinks, useGroups } from '@/hooks/useData';
import { useAuth } from '@/hooks/useAuth';
import { LogOut } from 'lucide-react';

const pageInfo: Record<PageId, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Painel',
    subtitle: 'Visão geral do seu trabalho de afiliado',
  },
  links: {
    title: 'Meus Links',
    subtitle: 'Importe e organize seus links de afiliado',
  },
  groups: {
    title: 'Grupos',
    subtitle: 'Gerencie os grupos e canais do Telegram',
  },
  messages: {
    title: 'Mensagens',
    subtitle: 'Crie templates de mensagem com preview',
  },
  send: {
    title: 'Envios',
    subtitle: 'Bot envia automaticamente nos grupos do Telegram',
  },
  vitrine: {
    title: 'Vitrine',
    subtitle: 'Sua página pública de ofertas para compartilhar',
  },
};

function App() {
  const [page, setPage] = useState<PageId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [route, setRoute] = useState<'vitrine' | 'manutencao'>('vitrine');
  const { data: links } = useLinks();
  const { data: groups } = useGroups();
  const { user, loading: authLoading, signOut } = useAuth();

  useEffect(() => {
    function checkHash() {
      const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
      if (hash === 'manutencao' || hash === 'maintenance' || hash === 'admin') {
        setRoute('manutencao');
      } else {
        setRoute('vitrine');
      }
    }
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  function navigate(id: PageId) {
    if (id === 'vitrine') {
      window.location.hash = '';
      return;
    }
    if (route === 'manutencao' && window.location.hash) {
      window.location.hash = 'manutencao';
    }
    setPage(id);
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }

  const counts = {
    links: links?.length ?? 0,
    groups: groups?.length ?? 0,
  };

  // Vitrine is the default public page
  if (route === 'vitrine') {
    return <VitrinePage />;
  }

  // Admin area — requires login
  if (!authLoading && !user) {
    return <Login />;
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-100">
      <Sidebar
        current={page}
        onNavigate={navigate}
        counts={counts}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 animate-fade-up">
            <Sidebar
              current={page}
              onNavigate={navigate}
              counts={counts}
              onOpenSettings={() => { setSettingsOpen(true); setMobileOpen(false); }}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <Topbar
          title={pageInfo[page].title}
          subtitle={pageInfo[page].subtitle}
          onMenuClick={() => setMobileOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        >
          <button
            onClick={() => signOut()}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-error-50 hover:text-error-600 transition-colors"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </Topbar>
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div key={page} className="animate-fade-up">
            {page === 'dashboard' && <Dashboard onNavigate={navigate} />}
            {page === 'links' && <Links />}
            {page === 'groups' && <Groups />}
            {page === 'messages' && <Messages />}
            {page === 'send' && <SendPage />}
            {page === 'vitrine' && <Vitrine />}
          </div>
        </main>
      </div>

      <MobileNav current={page} onNavigate={navigate} />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default App;
