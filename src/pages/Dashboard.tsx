import {
  Link as LinkIcon,
  Users,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card, StatusBadge } from '@/components/ui/Card';
import { useLinks, useGroups, useSendLog, useSettings, useSendCountToday } from '@/hooks/useData';
import { formatNumber, timeAgo, formatDuration } from '@/lib/format';
import type { PageId } from '@/components/ui/Shell';

interface DashboardProps {
  onNavigate: (id: PageId) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { data: links } = useLinks();
  const { data: groups } = useGroups();
  const { data: logs } = useSendLog(8);
  const { settings } = useSettings();
  const { getCount } = useSendCountToday();

  const activeLinks = (links ?? []).filter((l) => l.status !== 'sent');
  const activeGroups = (groups ?? []).filter((g) => g.status === 'active');
  const sentToday = activeGroups.reduce((s, g) => s + getCount(g.id), 0);
  const totalSent = (logs ?? []).filter((l) => l.status === 'sent').length;
  const hasBot = !!settings?.telegram_bot_token;
  const connectedGroups = (groups ?? []).filter((g) => g.telegram_chat_id).length;

  return (
    <div className="space-y-6">
      {/* Aviso de configuração */}
      {!hasBot && (
        <div className="flex items-start gap-3 rounded-2xl bg-warning-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-warning-600" />
          <div>
            <p className="text-sm font-semibold text-warning-700">Configure seu bot do Telegram</p>
            <p className="mt-0.5 text-xs text-warning-600">
              Para ativar o envio automático, vá em Configurações e adicione o token do seu bot criado no @BotFather.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard
          label="Links ativos"
          value={formatNumber(activeLinks.length)}
          icon={<LinkIcon size={22} />}
          accent="primary"
          spark={(links ?? []).slice(0, 10).map((_, i) => i + 1)}
        />
        <StatCard
          label="Grupos ativos"
          value={formatNumber(activeGroups.length)}
          icon={<Users size={22} />}
          accent="accent"
        />
        <StatCard
          label="Envios hoje"
          value={formatNumber(sentToday)}
          icon={<Send size={22} />}
          accent="success"
        />
        <StatCard
          label="Total enviados"
          value={formatNumber(totalSent)}
          icon={<CheckCircle2 size={22} />}
          accent="warning"
        />
      </div>

      {/* Anti-banimento + quick start */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          title="Boas práticas de envio"
          subtitle="Como o bot mantém sua conta segura no Telegram"
        >
          <div className="space-y-3">
            <SafetyTip
              icon={<Clock size={18} />}
              title="Respeite o intervalo entre envios"
              desc={`O bot aguarda ${formatDuration(settings?.delay_seconds ?? 120)} entre cada envio para respeitar os limites do Telegram.`}
            />
            <SafetyTip
              icon={<ShieldCheck size={18} />}
              title="Máximo por grupo por dia"
              desc={`Limite configurado: ${settings?.max_sends_per_group_per_day ?? 3} envios por grupo a cada 24h. O bot para automaticamente ao atingir o limite.`}
            />
            <SafetyTip
              icon={<MessageSquareSafe />}
              title="Varie as mensagens"
              desc="Use templates diferentes e personalize o texto. Mensagens idênticas repetidas são desencorajadas."
            />
            <SafetyTip
              icon={<Users size={18} />}
              title="Priorize grupos relevantes"
              desc="Envie produtos de tecnologia apenas em grupos do tema. Relevância reduz saídas de membros."
            />
          </div>
        </Card>

        <Card title="Começar agora" subtitle="Atalhos rápidos">
          <div className="space-y-2">
            <QuickLink
              label="Importar links (CSV)"
              desc="Cole sua lista de links"
              icon={<LinkIcon size={18} />}
              onClick={() => onNavigate('links')}
            />
            <QuickLink
              label="Adicionar grupo"
              desc="Cadastre grupos do Telegram"
              icon={<Users size={18} />}
              onClick={() => onNavigate('groups')}
            />
            <QuickLink
              label="Ir para Envios"
              desc="Painel de controle principal"
              icon={<Send size={18} />}
              onClick={() => onNavigate('send')}
            />
            <QuickLink
              label="Configurar vitrine"
              desc="Sua página de ofertas pública"
              icon={<TrendingUp size={18} />}
              onClick={() => onNavigate('vitrine')}
            />
          </div>
        </Card>
      </div>

      {/* Status do bot + grupos com contagem hoje */}
      {hasBot && (
        <Card
          title="Status do bot"
          subtitle="Conexão com o Telegram"
        >
          <div className="flex items-center gap-3 rounded-xl bg-success-50 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-600">
              <Bot size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold text-success-700">Bot conectado</p>
              <p className="text-xs text-success-600">
                {connectedGroups} de {(groups ?? []).length} grupos vinculados ao Telegram
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card
        title="Status dos grupos hoje"
        subtitle="Envios feitos por grupo nas últimas 24h"
        action={
          <button
            onClick={() => onNavigate('send')}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            Ir para envios <ArrowRight size={14} />
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(groups ?? []).map((g) => {
            const count = getCount(g.id);
            const limit = settings?.max_sends_per_group_per_day ?? 3;
            const pct = Math.min((count / limit) * 100, 100);
            const reached = count >= limit;
            return (
              <div key={g.id} className="rounded-xl border border-ink-200/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink-900">{g.name}</span>
                  <StatusBadge status={g.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-ink-500">Enviados hoje</span>
                  <span className={`font-semibold ${reached ? 'text-error-600' : 'text-ink-700'}`}>
                    {count}/{limit}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className={`h-full rounded-full transition-all ${
                      reached ? 'bg-error-500' : pct >= 66 ? 'bg-warning-500' : 'bg-success-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Histórico recente */}
      <Card title="Envios recentes" subtitle="Últimas mensagens registradas">
        {logs && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    log.status === 'sent' ? 'bg-success-100 text-success-600' : 'bg-error-100 text-error-600'
                  }`}
                >
                  {log.status === 'sent' ? <CheckCircle2 size={16} /> : <Send size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {log.link_title ?? 'Link removido'}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {log.group_name ?? 'Grupo removido'} · {timeAgo(log.sent_at)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    log.status === 'sent' ? 'text-success-600' : 'text-error-600'
                  }`}
                >
                  {log.status === 'sent' ? 'Enviado' : 'Falhou'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">Nenhum envio registrado ainda.</p>
        )}
      </Card>
    </div>
  );
}

function SafetyTip({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-ink-50 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-100 text-success-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="mt-0.5 text-xs text-ink-500">{desc}</p>
      </div>
    </div>
  );
}

function QuickLink({
  label,
  desc,
  icon,
  onClick,
}: {
  label: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-ink-200/60 p-3 text-left transition-all hover:border-primary-200 hover:bg-primary-50/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-ink-900">{label}</p>
        <p className="text-xs text-ink-400">{desc}</p>
      </div>
      <ArrowRight size={16} className="text-ink-300 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function MessageSquareSafe() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="m9 9 2 2 4-4" />
    </svg>
  );
}
