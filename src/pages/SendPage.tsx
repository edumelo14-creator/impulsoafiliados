import { useState, useMemo, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  useLinks,
  useGroups,
  useTemplates,
  useSettings,
  useSendCountToday,
  useSendLog,
  logSend,
} from '@/hooks/useData';
import { sendPhoto, sendMessage } from '@/lib/telegram';
import { formatDuration, timeAgo, formatBRL } from '@/lib/format';
import type { AffiliateLink, WhatsappGroup, MessageTemplate } from '@/lib/supabase';

interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'success' | 'error' | 'warn' | 'debug';
  message: string;
}

export function SendPage() {
  const { data: links } = useLinks();
  const { data: groups } = useGroups();
  const { data: templates } = useTemplates();
  const { data: logs, refetch: refetchLogs } = useSendLog(10);
  const { settings } = useSettings();
  const { getCount, refresh: refreshCounts } = useSendCountToday();

  const [templateId, setTemplateId] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentLabel, setCurrentLabel] = useState('');

  const runningRef = useRef(false);
  const idxRef = useRef(0);

  const token = settings?.telegram_bot_token ?? null;
  const delay = settings?.delay_seconds ?? 120;
  const maxPerGroup = settings?.max_sends_per_group_per_day ?? 3;

  // Auto-refresh when idle
  useEffect(() => {
    if (autoMode) return;
    const interval = setInterval(() => {
      refetchLogs();
      refreshCounts();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoMode, refetchLogs, refreshCounts]);

  useEffect(() => {
    if (templates && templates.length > 0 && !templateId) {
      const def = templates.find((t) => t.is_default) ?? templates[0];
      setTemplateId(def.id);
    }
  }, [templates, templateId]);

  const queue = useMemo(() => {
    const activeLinks = (links ?? []).filter((l) => l.status !== 'sent');
    const sendableGroups = (groups ?? []).filter(
      (g) => g.status === 'active' && g.telegram_chat_id,
    );
    const items: { link: AffiliateLink; group: WhatsappGroup }[] = [];
    for (const link of activeLinks) {
      for (const group of sendableGroups) {
        items.push({ link, group });
      }
    }
    return items;
  }, [links, groups]);

  const currentTemplate = (templates ?? []).find((t) => t.id === templateId) ??
    (templates ?? []).find((t) => t.is_default) ??
    (templates ?? [])[0];

  function addLog(level: LogEntry['level'], message: string) {
    const id = Math.random().toString(36).slice(2);
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogEntries((prev) => [{ id, time, level, message }, ...prev].slice(0, 80));
  }

  function buildMessage(link: AffiliateLink, template: MessageTemplate | undefined): string {
    if (!template) return link.url;
    return template.content.replace(/\{link\}/g, link.url);
  }

  function sleepWithCountdown(seconds: number): Promise<void> {
    return new Promise((resolve) => {
      let remaining = seconds;
      setCountdown(remaining);
      const interval = setInterval(() => {
        if (!runningRef.current) {
          clearInterval(interval);
          setCountdown(0);
          resolve();
          return;
        }
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setCountdown(0);
          resolve();
        }
      }, 1000);
    });
  }

  async function processQueue() {
    if (!token || !currentTemplate) {
      addLog('error', 'Token do bot ou template não disponível. Abortando.');
      return;
    }

    addLog('info', `Iniciando fila de ${queue.length} envios.`);
    addLog('debug', `Delay entre envios: ${delay}s | Limite por grupo/dia: ${maxPerGroup}`);
    addLog('debug', `Token: ${token.slice(0, 10)}...${token.slice(-4)}`);

    for (let i = idxRef.current; i < queue.length; i++) {
      if (!runningRef.current) {
        addLog('warn', 'Envio interrompido pelo usuário.');
        return;
      }

      const { link, group } = queue[i];
      idxRef.current = i;
      const label = `${link.title || link.url} → ${group.name}`;
      setCurrentLabel(label);

      // Check daily limit
      const countToday = getCount(group.id);
      if (countToday >= maxPerGroup) {
        addLog('warn', `[${i + 1}/${queue.length}] PULADO: ${group.name} no limite (${countToday}/${maxPerGroup})`);
        await logSend(link.id, group.id, currentTemplate.id, '', 'skipped');
        continue;
      }

      const messageText = buildMessage(link, currentTemplate);
      addLog('info', `[${i + 1}/${queue.length}] Enviando: ${label}`);
      addLog('debug', `Chat ID: ${group.telegram_chat_id} | Tem imagem: ${link.image_url ? 'sim' : 'não'}`);

      let sentOk = false;
      let sentVia = '';

      if (link.image_url) {
        addLog('debug', `Tentando sendPhoto com imagem...`);
        const result = await sendPhoto(token, group.telegram_chat_id!, link.image_url, messageText);
        if (result.ok) {
          sentOk = true;
          sentVia = 'foto';
          addLog('success', `  -> Foto enviada com sucesso.`);
        } else {
          addLog('warn', `  -> sendPhoto falhou: ${result.error}. Tentando texto...`);
          const textResult = await sendMessage(token, group.telegram_chat_id!, messageText);
          if (textResult.ok) {
            sentOk = true;
            sentVia = 'texto (foto falhou)';
            addLog('success', `  -> Texto enviado com sucesso (fallback).`);
          } else {
            addLog('error', `  -> Texto também falhou: ${textResult.error}`);
            await logSend(link.id, group.id, currentTemplate.id, messageText, 'failed');
          }
        }
      } else {
        addLog('debug', `Sem imagem — enviando sendMessage...`);
        const textResult = await sendMessage(token, group.telegram_chat_id!, messageText);
        if (textResult.ok) {
          sentOk = true;
          sentVia = 'texto';
          addLog('success', `  -> Mensagem de texto enviada com sucesso.`);
        } else {
          addLog('error', `  -> Falhou: ${textResult.error}`);
          await logSend(link.id, group.id, currentTemplate.id, messageText, 'failed');
        }
      }

      if (sentOk) {
        await logSend(link.id, group.id, currentTemplate.id, messageText, 'sent');
        refreshCounts();
      }

      // Wait between sends
      if (i + 1 < queue.length && runningRef.current) {
        addLog('info', `Aguardando ${delay}s antes do próximo envio...`);
        await sleepWithCountdown(delay);
      }
    }

    if (runningRef.current) {
      addLog('success', 'Fila concluída! Todos os envios processados.');
    }
    runningRef.current = false;
    setAutoMode(false);
    setCurrentLabel('');
    refetchLogs();
    refreshCounts();
  }

  function handleStart() {
    if (!token) {
      addLog('error', 'Sem token do bot. Configure o bot nas Configurações.');
      return;
    }
    if (queue.length === 0) {
      addLog('error', 'Fila vazia. Verifique links e grupos.');
      return;
    }
    runningRef.current = true;
    setAutoMode(true);
    setLogEntries([]);
    addLog('info', '=== Iniciando envios ===');
    processQueue();
  }

  function handleStop() {
    runningRef.current = false;
    setAutoMode(false);
    setCountdown(0);
    addLog('warn', 'Parada solicitada. O envio atual será interrompido.');
  }

  function handleReset() {
    idxRef.current = 0;
    setLogEntries([]);
    setCurrentLabel('');
    setCountdown(0);
  }

  async function handleTestSend() {
    if (!token || !groups || groups.length === 0) {
      addLog('error', 'Sem token ou sem grupos para testar.');
      return;
    }
    const group = groups.find((g) => g.telegram_chat_id);
    if (!group) {
      addLog('error', 'Nenhum grupo com Chat ID configurado.');
      return;
    }
    addLog('info', `Teste: enviando mensagem de teste para ${group.name}...`);
    const result = await sendMessage(token, group.telegram_chat_id!, 'Teste de conexão do bot');
    if (result.ok) {
      addLog('success', `Teste OK! Mensagem enviada para ${group.name}.`);
    } else {
      addLog('error', `Teste FALHOU: ${result.error}`);
    }
  }

  const current = queue[idxRef.current];

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
  const progressPct = autoMode && queue.length > 0 ? ((idxRef.current + 1) / queue.length) * 100 : 0;

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

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-600">Progresso</span>
            <span className="text-ink-400">
              {autoMode ? `${idxRef.current + 1}/${queue.length}` : `${queue.length} na fila`}
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
          <StatusBox label="Na fila" value={queue.length - idxRef.current - (autoMode ? 1 : 0)} color="primary" icon={<Zap size={16} />} />
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
      <Card title="Template de mensagem" subtitle="Escolha qual modelo usar nos envios">
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          disabled={autoMode}
          className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-ink-50"
        >
          {(templates ?? []).map((t: MessageTemplate) => (
            <option key={t.id} value={t.id}>
              {t.name}{t.is_default ? ' (padrão)' : ''}
            </option>
          ))}
        </select>
        {current && currentTemplate && (
          <div className="mt-3 rounded-xl bg-[#e5ddd5] p-4">
            <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
                {buildMessage(current.link, currentTemplate)}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Current item + Target group */}
      {current && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card title="Produto atual" subtitle={`Item ${idxRef.current + 1} de ${queue.length}`}>
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
              onClick={() => setLogEntries([])}
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
            onClick={() => { refetchLogs(); refreshCounts(); }}
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
