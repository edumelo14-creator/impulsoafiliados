import { supabase } from './supabase';

const FUNCTION_SLUG = 'telegram-bot';

function getFunctionUrl(): string {
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${projectUrl}/functions/v1/${FUNCTION_SLUG}`;
}

function getHeaders(): Record<string, string> {
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${anonKey}`,
  };
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

export interface TelegramChat {
  id: number;
  type: 'group' | 'supergroup' | 'channel' | 'private';
  title?: string;
  username?: string;
  first_name?: string;
}

interface TelegramUpdate {
  message?: {
    chat: TelegramChat;
    text?: string;
  };
  my_chat_member?: {
    chat: TelegramChat;
  };
  channel_post?: {
    chat: TelegramChat;
  };
}

async function callFunction(action: string, body: Record<string, unknown>): Promise<any> {
  const url = `${getFunctionUrl()}?action=${action}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({ error: 'Resposta inválida' }));
  if (!resp.ok) {
    throw new Error(data.error || data.description || 'Erro na API do Telegram');
  }
  return data;
}

/** Valida o token e retorna informações do bot */
export async function getBotInfo(token: string): Promise<TelegramBotInfo> {
  const data = await callFunction('getMe', { token });
  if (!data.ok) throw new Error(data.description || 'Token inválido');
  return data.result as TelegramBotInfo;
}

/** Busca os chats (grupos/canais) onde o bot está */
export async function getBotChats(token: string): Promise<TelegramChat[]> {
  const data = await callFunction('getUpdates', { token });
  if (!data.ok) {
    const desc = data.description || '';
    if (desc.includes('409') || desc.includes('Conflict') || desc.includes('webhook')) {
      throw new Error(
        'Existe um webhook ativo para este bot. Delete o webhook no BotFather (@BotFather > /deletebot) ou use /setwebhook para remover.',
      );
    }
    throw new Error(desc || 'Erro ao buscar chats');
  }

  const updates = (data.result ?? []) as TelegramUpdate[];
  const chatsMap = new Map<number, TelegramChat>();

  for (const update of updates) {
    const chat =
      update.message?.chat ??
      update.my_chat_member?.chat ??
      update.channel_post?.chat ??
      update.chat_member?.chat;
    if (chat && (chat.type === 'group' || chat.type === 'supergroup' || chat.type === 'channel')) {
      chatsMap.set(chat.id, chat);
    }
  }

  return Array.from(chatsMap.values());
}

/** Envia uma foto com caption (texto) para um chat */
export async function sendPhoto(
  token: string,
  chatId: string,
  photoUrl: string,
  caption: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callFunction('sendPhoto', {
      token,
      params: { chat_id: chatId, photo: photoUrl, caption },
    });
    if (!data.ok) {
      return { ok: false, error: data.description || 'Erro ao enviar foto' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}

/** Envia apenas texto para um chat */
export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const data = await callFunction('sendMessage', {
      token,
      params: { chat_id: chatId, text },
    });
    if (!data.ok) {
      return { ok: false, error: data.description || 'Erro ao enviar mensagem' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' };
  }
}
