import { useState } from 'react';
import {
  Send,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageCircle,
  Bot,
  Play,
  Square,
  Loader2,
  Zap,
  Store,
  Timer,
  Terminal,
  XCircle,
  Wifi,
  Pencil,
} from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSendQueue } from '@/contexts/SendQueueContext';
import { supabase } from '@/lib/supabase';
import { formatDuration, timeAgo, formatBRL } from '@/lib/format';
import type { MessageTemplate } from '@/lib/supabase';

export function SendPage() {
  const {
    links,
    groups,
    templates,
    refetchTemplates,
    logs,
    refetchLogs,
    token,
    delay,
    maxPerGroup,
    templateId,
    setTemplateId,
    currentTemplate,
    queue,
    idx,
    autoMode,
    countdown,
    currentLabel,
    logEntries,
    clearLogEntries,
    getCount,
    buildMessage,
    handleStart,
    handleStop,
    handleReset,
    handleTestSend,
  } = useSendQueue();

  const [editingTemplate, setEditingTemplate] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  function startEditTemplate() {
    if (!currentTemplate) return;
    setDraftContent(currentTemplate.content);
    setEditingTemplate(true);
  }

  function cancelEditTemplate() {
    setEditingTemplate(false);
    setDraftContent('');
  }

  async function saveTemplate() {
    if (!currentTemplate) return;
    setSavingTemplate(true);
    const { error } = await supabase
      .from('message_templates')
      .update({ content: draftContent })
      .eq('id', currentTemplate.id);
    setSavingTemplate(false);
    if (error) {
      window.alert(`Erro ao salvar template: ${error.message}`);
      return;
    }
    setEditingTemplate(false);
    refetchTemplates();
  }

  const current = queue[idx];

  if (!links || !groups || !templates) {
    return <LoadingState />;
  }

  if (!token) {
    return (
      <EmptyState
        icon={<Bot size={40} />}
        title="Bot do Telegram não configurado"
        desc="Vá em Configurações e adicione o token do seu bot criado no @BotFather para ativar o envio automático."
      />
    );
  }

  if (queue.length === 0) {
    return (
      <EmptyState
        icon={<Send size={40} />}
        title="Nada para enviar ainda"
        desc="Você precisa de links ativos e grupos com Chat ID do Telegram vinculado."
      />
    );
  }

  const sentCount = logEntries.filter((l) => l.level === 'success').length;
  const errorCount = logEntries.filter((l) => l.level === 'error').length;
  const warnCount = logEntries.filter((l) => l.level === 'warn').length;
  const progressPct = autoMode && queue.length > 0 ? ((idx + 1) / queue.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Painel de controle */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Envio automático</h2>
            <p className="mt-0.5 text-sm text-ink-500">
              {queue.length} envios na fila · {formatDuration(delay)} entre cada
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTestSend} disabled={autoMode}>
              <Wifi size={16} /> Testar bot
            </Button>
            {!autoMode ? (
              <Button variant="success" onClick={handleStart} disabled={queue.length === 0}>
                <Play size={18} /> Iniciar envios
              </Button>
            ) : (
              <Button variant="danger" onClick={handleStop}>
                <Square size={18} /> Parar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleReset} disabled={autoMode}>
              <RefreshCw size={16} /> Reiniciar
            </Button>
          </div>
        </div>

        {autoMode && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success-600">
            <Loader2 size={13} className="animate-spin" /> Rodando em segundo plano — continua mesmo se você trocar de página.
          </p>
        )}

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-600">Progresso</span>
            <span className="text-ink-400">
              {autoMode ? `${idx + 1}/${queue.length}` : `${queue.length} na fila`}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                autoMode ? 'bg-success-500' : 'bg-primary-500'
              }`}
              style={{ width: `${autoMode ? progressPct : 0}%` }}
            />
          </div>
        </div>

        {/* Counters */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatusBox label="Sucesso" value={sentCount} color="success" icon={<CheckCircle2 size={16} />} />
          <StatusBox label="Erros" value={errorCount} color="error" icon={<AlertTriangle size={16} />} />
          <StatusBox label="Avisos" value={warnCount} color="warning" icon={<Clock size={16} />} />
          <StatusBox label="Na fila" value={queue.length - idx - (autoMode ? 1 : 0)} color="primary" icon={<Zap size={16} />} />
        </div>

        {/* Countdown timer */}
        {countdown > 0 && (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-primary-50 p-4 animate-fade-up">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="rgb(255 218 201)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24" fill="none" stroke="rgb(238 77 45)" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(countdown / delay) * 150.8} 150.8`}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <Timer size={20} className="text-primary-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-primary-700">
                Próximo envio em {formatDuration(countdown)}
              </p>
              <p className="text-xs text-primary-500">{currentLabel}</p>
            </div>
            <span className="font-mono text-3xl font-bold tabular-nums text-primary-700">{countdown}s</span>
          </div>
        )}

        {/* Current status when not counting down */}
        {autoMode && countdown === 0 && currentLabel && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary-50 p-3 animate-fade-up">
            <Loader2 size={16} className="animate-spin text-primary-600" />
            <span className="text-sm font-medium text-primary-700">{currentLabel}</span>
          </div>
        )}
      </Card>

      {/* Template selector + Preview */}
      <Card
        title="Template de mensagem"
        subtitle="Escolha qual modelo usar nos envios"
        action={
          currentTemplate && !editingTemplate ? (
            <button
              onClick={startEditTemplate}
              disabled={autoMode}
              className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
            >
              <Pencil size={14} /> Editar mensagem
            </button>
          ) : null
        }
      >
        <select
          value={templateId}
          onChange={(e) => {
            setTemplateId(e.target.value);
            setEditingTemplate(false);
          }}
          disabled={autoMode || editingTemplate}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-ink-50"
        >
          {(templates ?? []).map((t: MessageTemplate) => (
            <option key={t.id} value={t.id}>
              {t.name}{t.is_default ? ' (padrão)' : ''}
            </option>
          ))}
        </select>

        {editingTemplate ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 font-mono text-sm text-ink-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <p className="text-xs text-ink-400">
              Use <code className="rounded bg-ink-100 px-1 py-0.5 font-mono">{'{link}'}</code> para o link do produto e{' '}
              <code className="rounded bg-ink-100 px-1 py-0.5 font-mono">{'{nomeProduto}'}</code> para o nome do produto.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={cancelEditTemplate} disabled={savingTemplate}>
                Cancelar
              </Button>
              <Button size="sm" onClick={saveTemplate} disabled={savingTemplate || !draftContent.trim()}>
                {savingTemplate ? 'Salvando...' : 'Salvar template'}
              </Button>
            </div>
          </div>
        ) : (
          current && currentTemplate && (
            <div className="mt-3 rounded-xl bg-[#e5ddd5] p-4">
              <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
                  {buildMessage(current.link, currentTemplate)}
                </p>
              </div>
            </div>
          )
        )}
      </Card>

      {/* Current item + Target group */}
      {current && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card title="Produto atual" subtitle={`Item ${idx + 1} de ${queue.length}`}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-ink-100">
                {current.link.image_url ? (
                  <img src={current.link.image_url} alt={current.link.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center">
                    <ImageIcon size={32} className="text-ink-300" />
                    <span className="mt-2 text-xs text-ink-400">Sem imagem — texto apenas</span>
                  </div>
                )}
              </div>
              <div className="mt-3">
                {current.link.category && (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-600">
                    {current.link.category}
                  </span>
                )}
                <h3 className="mt-1 text-sm font-semibold text-ink-900">
                  {current.link.title || 'Sem título'}
                </h3>
                {current.link.price && (
                  <p className="mt-1 text-lg font-bold text-primary-700">{formatBRL(current.link.price)}</p>
                )}
                {current.link.store_name && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-ink-400">
                    <Store size={12} /> {current.link.store_name}
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card title="Grupo de destino" subtitle="Canal/grupo do Telegram">
              <div className="flex items-center gap-3 rounded-xl bg-ink-50 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <MessageCircle size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-ink-900">{current.group.name}</h3>
                  <p className="flex items-center gap-1 text-xs text-ink-400">
                    <Bot size={11} /> Chat ID: {current.group.telegram_chat_id}
                  </p>
                </div>
                <StatusBadge status={current.group.status} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-500">Envios hoje neste grupo</span>
                  <span className="font-semibold text-ink-700">
                    {getCount(current.group.id)}/{maxPerGroup}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-success-500 transition-all"
                    style={{ width: `${Math.min((getCount(current.group.id) / maxPerGroup) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-lg bg-warning-50 p-3">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-warning-600" />
                <p className="text-xs text-warning-700">
                  O bot aguarda <strong>{formatDuration(delay)}</strong> entre cada envio e respeita o limite de{' '}
                  <strong>{maxPerGroup} por grupo/dia</strong>.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Diagnostic log */}
      <Card
        title="Log de envio"
        subtitle="Acompanhe cada passo em tempo real"
        action={
          logEntries.length > 0 && !autoMode ? (
            <button
              onClick={clearLogEntries}
              className="flex items-center gap-1 text-xs font-semibold text-ink-400 hover:text-ink-600"
            >
              <XCircle size={14} /> Limpar
            </button>
          ) : null
        }
      >
        {logEntries.length === 0 ? (
          <div className="py-8 text-center">
            <Terminal size={32} className="mx-auto text-ink-300" />
            <p className="mt-2 text-sm text-ink-400">
              Clique em "Iniciar envios" para começar. O log mostrará cada passo detalhadamente.
            </p>
          </div>
        ) : (
          <div className="max-h-96 space-y-1 overflow-y-auto rounded-xl bg-ink-900 p-4 font-mono text-xs scrollbar-thin">
            {logEntries.map((entry) => (
              <div key={entry.id} className="flex gap-2 leading-relaxed">
                <span className="shrink-0 text-ink-500">{entry.time}</span>
                <span
                  className={`shrink-0 font-bold ${
                    entry.level === 'success'
                      ? 'text-success-400'
                      : entry.level === 'error'
                        ? 'text-error-400'
                        : entry.level === 'warn'
                          ? 'text-warning-400'
                          : entry.level === 'debug'
                            ? 'text-accent-400'
                            : 'text-ink-300'
                  }`}
                >
                  {entry.level === 'success' ? 'OK' : entry.level === 'error' ? 'ERR' : entry.level === 'warn' ? 'WARN' : entry.level === 'debug' ? 'DBG' : 'INFO'}
                </span>
                <span className="text-ink-200">{entry.message}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* History */}
      <Card
        title="Histórico de envios"
        subtitle="Atualiza automaticamente · Últimos 10"
        action={
          <button
            onClick={() => { refetchLogs(); }}
            className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        }
      >
        {logs && logs.length > 0 ? (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    log.status === 'sent' ? 'bg-success-100 text-success-600' : 'bg-ink-200 text-ink-500'
                  }`}
                >
                  {log.status === 'sent' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
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
                    log.status === 'sent' ? 'text-success-600' : 'text-ink-400'
                  }`}
                >
                  {log.status === 'sent' ? 'Enviado' : log.status === 'skipped' ? 'Pulado' : 'Falhou'}
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

function StatusBox({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number;
  color: 'success' | 'error' | 'warning' | 'primary';
  icon: React.ReactNode;
}) {
  const colors = {
    success: 'bg-success-50 text-success-700',
    error: 'bg-error-50 text-error-600',
    warning: 'bg-warning-50 text-warning-600',
    primary: 'bg-primary-50 text-primary-600',
  };
  return (
    <div className={`rounded-xl p-3 ${colors[color]}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="h-48 animate-pulse rounded-2xl border border-ink-200/70 bg-white" />
      <div className="h-64 animate-pulse rounded-2xl border border-ink-200/70 bg-white" />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-100 text-ink-400">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-600">{title}</p>
      <p className="mt-1 text-xs text-ink-400">{desc}</p>
    </div>
  );
}
