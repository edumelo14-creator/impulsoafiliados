import { useMemo, useState } from 'react';
import {
  Search,
  Users,
  Plus,
  X,
  Trash2,
  MessageCircle,
  Tag,
  Pause,
  Play,
  Bot,
  Loader2,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useGroups, useSendCountToday, useSettings } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { getBotChats } from '@/lib/telegram';
import type { TelegramChat } from '@/lib/telegram';
import type { WhatsappGroup, GroupStatus } from '@/lib/supabase';

export function Groups() {
  const { data: groups, error, loading, refetch } = useGroups();
  const { getCount } = useSendCountToday();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const filtered = useMemo(() => {
    if (!groups) return [];
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        (g.category ?? '').toLowerCase().includes(query.toLowerCase()),
    );
  }, [groups, query]);

  if (loading) return <LoadingGrid />;
  if (error) return <ErrorState message={error} />;

  const activeCount = (groups ?? []).filter((g) => g.status === 'active').length;
  const hasToken = !!settings?.telegram_bot_token;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-500">
          {(groups ?? []).length} grupos · {activeCount} ativos
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Adicionar grupo
        </Button>
      </div>

      {!hasToken && (
        <div className="flex items-start gap-3 rounded-xl bg-warning-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-warning-600" />
          <div>
            <p className="text-sm font-semibold text-warning-700">Bot do Telegram não configurado</p>
            <p className="mt-0.5 text-xs text-warning-600">
              Configure o token do seu bot em Configurações para descobrir grupos automaticamente e enviar mensagens.
            </p>
          </div>
        </div>
      )}

      <Card>
        <div className="relative max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar grupo..."
            className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState onAdd={() => setShowAdd(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              sentToday={getCount(g.id)}
              limit={settings?.max_sends_per_group_per_day ?? 3}
              hasBot={hasToken}
              onChanged={refetch}
            />
          ))}
        </div>
      )}

      {showAdd && (
        <AddGroupModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            refetch();
          }}
          token={settings?.telegram_bot_token ?? null}
        />
      )}
    </div>
  );
}

function GroupCard({
  group: g,
  sentToday,
  limit,
  hasBot,
  onChanged,
}: {
  group: WhatsappGroup;
  sentToday: number;
  limit: number;
  hasBot: boolean;
  onChanged: () => void;
}) {
  const reached = sentToday >= limit;
  const pct = Math.min((sentToday / limit) * 100, 100);

  async function toggle() {
    const next: GroupStatus = g.status === 'active' ? 'paused' : 'active';
    await supabase.from('whatsapp_groups').update({ status: next }).eq('id', g.id);
    onChanged();
  }

  async function remove() {
    await supabase.from('whatsapp_groups').delete().eq('id', g.id);
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5 shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
            <MessageCircle size={22} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink-900">{g.name}</h3>
            {g.category && (
              <span className="text-xs text-ink-400">{g.category}</span>
            )}
          </div>
        </div>
        <StatusBadge status={g.status} />
      </div>

      {/* Telegram chat ID status */}
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-ink-50 px-3 py-2">
        <Bot size={15} className={g.telegram_chat_id ? 'text-success-600' : 'text-ink-400'} />
        <span className="text-xs font-medium">
          {g.telegram_chat_id ? (
            <span className="text-success-700">Conectado · ID: {g.telegram_chat_id}</span>
          ) : (
            <span className="text-ink-500">Sem chat do Telegram vinculado</span>
          )}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-500">Envios hoje</span>
          <span className={`font-semibold ${reached ? 'text-error-600' : 'text-ink-700'}`}>
            {sentToday}/{limit}
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
        {reached && (
          <p className="mt-2 text-xs font-medium text-error-600">
            Limite diário atingido — aguarde amanhã
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-3">
        <button
          onClick={toggle}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            g.status === 'active'
              ? 'bg-warning-50 text-warning-700 hover:bg-warning-100'
              : 'bg-success-50 text-success-700 hover:bg-success-100'
          }`}
        >
          {g.status === 'active' ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Ativar</>}
        </button>
        <button
          onClick={remove}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-400 transition-colors hover:bg-error-50 hover:text-error-600"
        >
          <Trash2 size={14} /> Remover
        </button>
      </div>
    </div>
  );
}

function AddGroupModal({
  onClose,
  onSaved,
  token,
}: {
  onClose: () => void;
  onSaved: () => void;
  token: string | null;
}) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [chatId, setChatId] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [discovered, setDiscovered] = useState<TelegramChat[]>([]);
  const [discoveryErr, setDiscoveryErr] = useState<string | null>(null);

  async function handleDiscover() {
    if (!token) {
      setDiscoveryErr('Configure o token do bot primeiro em Configurações.');
      return;
    }
    setDiscovering(true);
    setDiscoveryErr(null);
    try {
      const chats = await getBotChats(token);
      setDiscovered(chats);
      if (chats.length === 0) {
        setDiscoveryErr('Nenhum grupo encontrado. Adicione o bot a um grupo e envie qualquer mensagem lá primeiro.');
      }
    } catch (e) {
      setDiscoveryErr(e instanceof Error ? e.message : 'Erro ao descobrir grupos');
    }
    setDiscovering(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from('whatsapp_groups').insert({
      name,
      url: url || null,
      category: category || null,
      status: 'active',
      telegram_chat_id: chatId || null,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-scale-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Adicionar grupo</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <Field label="Nome do grupo *" icon={<Users size={14} />}>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Ex: Promoções Brasil"
            />
          </Field>
          <Field label="Link de convite (opcional)" icon={<MessageCircle size={14} />}>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputCls}
              placeholder="https://t.me/..."
            />
          </Field>
          <Field label="Categoria" icon={<Tag size={14} />}>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              placeholder="Promoções, Tecnologia..."
            />
          </Field>

          {/* Telegram chat discovery */}
          <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                <Bot size={14} /> Chat ID do Telegram
              </span>
              <button
                type="button"
                onClick={handleDiscover}
                disabled={discovering || !token}
                className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-50"
              >
                {discovering ? <><Loader2 size={12} className="animate-spin" /> Buscando...</> : <><RefreshCw size={12} /> Descobrir</>}
              </button>
            </div>

            {discovered.length > 0 && (
              <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                {discovered.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => setChatId(String(chat.id))}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                      chatId === String(chat.id)
                        ? 'bg-primary-100 ring-1 ring-primary-300'
                        : 'bg-white hover:bg-ink-100'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-ink-900">{chat.title ?? 'Sem nome'}</span>
                      <span className="ml-1.5 text-ink-400">({chat.type})</span>
                    </span>
                    <span className="shrink-0 font-mono text-ink-500">{chat.id}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className={inputCls + ' mt-2 font-mono'}
              placeholder="-1001234567890"
            />
            {discoveryErr && (
              <p className="mt-1.5 text-xs text-error-600">{discoveryErr}</p>
            )}
            {chatId && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-success-600">
                <Check size={12} /> Chat ID definido — o bot enviará mensagens aqui
              </p>
            )}
          </div>

          {err && <p className="text-sm text-error-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar grupo'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl border border-ink-200/70 bg-white" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-error-600">Erro ao carregar grupos: {message}</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <Users size={40} className="mx-auto text-ink-300" />
      <p className="mt-3 text-sm font-medium text-ink-600">Nenhum grupo cadastrado</p>
      <p className="mt-1 text-xs text-ink-400">Adicione os grupos e canais do Telegram onde você divulga.</p>
      <div className="mt-4">
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} /> Adicionar grupo
        </Button>
      </div>
    </div>
  );
}
