import {
  createContext,
  useContext,
  useState,
  useRef,
  useMemo,
  useEffect,
  type ReactNode,
} from 'react';
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
import type {
  AffiliateLink,
  WhatsappGroup,
  MessageTemplate,
  SendLogWithDetails,
} from '@/lib/supabase';

export interface LogEntry {
  id: string;
  time: string;
  level: 'info' | 'success' | 'error' | 'warn' | 'debug';
  message: string;
}

interface QueueItem {
  link: AffiliateLink;
  group: WhatsappGroup;
}

interface SendQueueContextValue {
  links: AffiliateLink[] | null;
  groups: WhatsappGroup[] | null;
  templates: MessageTemplate[] | null;
  refetchTemplates: () => void;
  logs: SendLogWithDetails[] | null;
  refetchLogs: () => void;
  token: string | null;
  delay: number;
  maxPerGroup: number;
  templateId: string;
  setTemplateId: (id: string) => void;
  currentTemplate: MessageTemplate | undefined;
  queue: QueueItem[];
  idx: number;
  autoMode: boolean;
  countdown: number;
  currentLabel: string;
  logEntries: LogEntry[];
  clearLogEntries: () => void;
  getCount: (groupId: string) => number;
  buildMessage: (link: AffiliateLink, template: MessageTemplate | undefined) => string;
  handleStart: () => void;
  handleStop: () => void;
  handleReset: () => void;
  handleTestSend: () => void;
}

const SendQueueContext = createContext<SendQueueContextValue | null>(null);

/**
 * Mantém o estado da fila de envios (fila, progresso, log, contador) vivo
 * enquanto o app estiver aberto — independente de qual página está sendo
 * exibida. É montado uma única vez lá no topo do App (fora da troca de
 * páginas), então trocar de página não desmonta este provider e o envio
 * automático continua rodando em segundo plano. Só para de fato quando a
 * aba é recarregada ou fechada (estado de React não sobrevive a isso).
 */
export function SendQueueProvider({ children }: { children: ReactNode }) {
  const { data: links } = useLinks();
  const { data: groups } = useGroups();
  const { data: templates, refetch: refetchTemplates } = useTemplates();
  const { data: logs, refetch: refetchLogs } = useSendLog(10);
  const { settings } = useSettings();
  const { getCount, refresh: refreshCounts } = useSendCountToday();

  const [templateId, setTemplateId] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [currentLabel, setCurrentLabel] = useState('');
  const [idx, setIdx] = useState(0);

  const runningRef = useRef(false);
  const idxRef = useRef(0);

  const token = settings?.telegram_bot_token ?? null;
  const delay = settings?.delay_seconds ?? 120;
  const maxPerGroup = settings?.max_sends_per_group_per_day ?? 3;

  // processQueue roda como um loop assíncrono de longa duração — o closure
  // dele fica "preso" nos valores de quando foi criado (quando o usuário
  // clicou em "Iniciar envios"). Se as configurações ainda não tinham
  // carregado do banco nesse momento (ex.: clicou logo que a página abriu),
  // token/delay/maxPerGroup ficavam travados nos valores padrão pro resto
  // da execução inteira — causando pulos incorretos mesmo com o limite
  // configurado bem mais alto. Esses refs sempre guardam o valor mais
  // recente, e o loop lê .current a cada iteração em vez do valor antigo.
  const tokenRef = useRef(token);
  const delayRef = useRef(delay);
  const maxPerGroupRef = useRef(maxPerGroup);
  const currentTemplateRef = useRef<MessageTemplate | undefined>(undefined);
  const getCountRef = useRef(getCount);
  const queueRef = useRef<QueueItem[]>([]);

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);
  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);
  useEffect(() => {
    maxPerGroupRef.current = maxPerGroup;
  }, [maxPerGroup]);
  useEffect(() => {
    getCountRef.current = getCount;
  }, [getCount]);

  // Atualiza log/contadores periodicamente quando não está enviando
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
    const items: QueueItem[] = [];
    for (const link of activeLinks) {
      for (const group of sendableGroups) {
        items.push({ link, group });
      }
    }
    return items;
  }, [links, groups]);

  const currentTemplate =
    (templates ?? []).find((t) => t.id === templateId) ??
    (templates ?? []).find((t) => t.is_default) ??
    (templates ?? [])[0];

  useEffect(() => {
    currentTemplateRef.current = currentTemplate;
  }, [currentTemplate]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  function addLog(level: LogEntry['level'], message: string) {
    const id = Math.random().toString(36).slice(2);
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogEntries((prev) => [{ id, time, level, message }, ...prev].slice(0, 80));
  }

  function buildMessage(link: AffiliateLink, template: MessageTemplate | undefined): string {
    if (!template) return link.url;
    return template.content
      .replace(/\{link\}/g, link.url)
      .replace(/\{nomeProduto\}/g, link.title || '');
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
    // Lê sempre o valor mais recente (nunca o congelado no momento do clique).
    const activeToken = tokenRef.current;
    const activeTemplate = currentTemplateRef.current;

    if (!activeToken || !activeTemplate) {
      addLog('error', 'Token do bot ou template não disponível. Abortando.');
      return;
    }

    const q = queueRef.current;
    addLog('info', `Iniciando fila de ${q.length} envios.`);
    addLog('debug', `Delay entre envios: ${delayRef.current}s | Limite por grupo/dia: ${maxPerGroupRef.current}`);
    addLog('debug', `Token: ${activeToken.slice(0, 10)}...${activeToken.slice(-4)}`);

    for (let i = idxRef.current; i < queueRef.current.length; i++) {
      if (!runningRef.current) {
        addLog('warn', 'Envio interrompido pelo usuário.');
        return;
      }

      const token = tokenRef.current;
      const template = currentTemplateRef.current;
      if (!token || !template) {
        addLog('error', 'Token do bot ou template não disponível. Abortando.');
        return;
      }

      const { link, group } = queueRef.current[i];
      idxRef.current = i;
      setIdx(i);
      const label = `${link.title || link.url} → ${group.name}`;
      setCurrentLabel(label);

      // Check daily limit — sempre com o valor mais atual do contador e do limite
      const countToday = getCountRef.current(group.id);
      const maxPerGroup = maxPerGroupRef.current;
      if (countToday >= maxPerGroup) {
        addLog('warn', `[${i + 1}/${queueRef.current.length}] PULADO: ${group.name} no limite (${countToday}/${maxPerGroup})`);
        await logSend(link.id, group.id, template.id, '', 'skipped');
        continue;
      }

      const messageText = buildMessage(link, template);
      addLog('info', `[${i + 1}/${queueRef.current.length}] Enviando: ${label}`);
      addLog('debug', `Chat ID: ${group.telegram_chat_id} | Tem imagem: ${link.image_url ? 'sim' : 'não'}`);

      let sentOk = false;

      if (link.image_url) {
        addLog('debug', `Tentando sendPhoto com imagem...`);
        const result = await sendPhoto(token, group.telegram_chat_id!, link.image_url, messageText);
        if (result.ok) {
          sentOk = true;
          addLog('success', `  -> Foto enviada com sucesso.`);
        } else {
          addLog('warn', `  -> sendPhoto falhou: ${result.error}. Tentando texto...`);
          const textResult = await sendMessage(token, group.telegram_chat_id!, messageText);
          if (textResult.ok) {
            sentOk = true;
            addLog('success', `  -> Texto enviado com sucesso (fallback).`);
          } else {
            addLog('error', `  -> Texto também falhou: ${textResult.error}`);
            await logSend(link.id, group.id, template.id, messageText, 'failed');
          }
        }
      } else {
        addLog('debug', `Sem imagem — enviando sendMessage...`);
        const textResult = await sendMessage(token, group.telegram_chat_id!, messageText);
        if (textResult.ok) {
          sentOk = true;
          addLog('success', `  -> Mensagem de texto enviada com sucesso.`);
        } else {
          addLog('error', `  -> Falhou: ${textResult.error}`);
          await logSend(link.id, group.id, template.id, messageText, 'failed');
        }
      }

      if (sentOk) {
        await logSend(link.id, group.id, template.id, messageText, 'sent');
        await refreshCounts();
      }

      // Wait between sends — usa o delay atual, não o de quando o loop começou
      if (i + 1 < queueRef.current.length && runningRef.current) {
        const currentDelay = delayRef.current;
        addLog('info', `Aguardando ${currentDelay}s antes do próximo envio...`);
        await sleepWithCountdown(currentDelay);
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
    setIdx(0);
    setLogEntries([]);
    setCurrentLabel('');
    setCountdown(0);
  }

  function clearLogEntries() {
    setLogEntries([]);
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

  const value: SendQueueContextValue = {
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
  };

  return <SendQueueContext.Provider value={value}>{children}</SendQueueContext.Provider>;
}

export function useSendQueue() {
  const ctx = useContext(SendQueueContext);
  if (!ctx) throw new Error('useSendQueue precisa estar dentro de <SendQueueProvider>.');
  return ctx;
}
