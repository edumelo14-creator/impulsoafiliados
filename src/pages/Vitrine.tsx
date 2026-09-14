import { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  Store,
  Share2,
  Check,
  Image as ImageIcon,
  Upload,
  Loader2,
  X,
  Send,
  Bot,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLinks, useSettings, useGroups, useSendCountToday } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import { formatNumber, formatDuration } from '@/lib/format';
import { sendMessage } from '@/lib/telegram';
import type { WhatsappGroup } from '@/lib/supabase';

export function Vitrine() {
  const { data: links } = useLinks();
  const { settings, update } = useSettings();
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'hero' | null>(null);
  const [showPublish, setShowPublish] = useState(false);

  const showcaseUrl = typeof window !== 'undefined' ? `${window.location.origin}/#vitrine` : '';
  const storeName = settings?.store_name ?? 'Minha Loja Afiliado';
  const logoUrl = settings?.vitrine_logo_url;
  const heroUrl = settings?.vitrine_hero_url;

  function copyShareLink() {
    navigator.clipboard.writeText(showcaseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function openVitrine() {
    window.open(showcaseUrl, '_blank');
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'hero') {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(type);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png';
      const fileName = `${type}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('vitrine')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('vitrine').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      if (type === 'logo') {
        await update({ vitrine_logo_url: publicUrl });
      } else {
        await update({ vitrine_hero_url: publicUrl });
      }
    } catch (err) {
      alert(`Erro ao enviar imagem: ${err instanceof Error ? err.message : 'tente novamente'}`);
    }
    setUploading(null);
  }

  async function removeImage(type: 'logo' | 'hero') {
    if (type === 'logo') {
      await update({ vitrine_logo_url: null });
    } else {
      await update({ vitrine_hero_url: null });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white sm:p-8">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -right-6 h-40 w-40 rounded-full bg-white/5" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Store size={22} />
            </div>
            <div>
              <p className="text-xs font-medium text-primary-100">Sua vitrine pública</p>
              <h2 className="text-xl font-bold">{storeName}</h2>
            </div>
          </div>
          <p className="mt-3 max-w-lg text-sm text-primary-50">
            Uma página independente e bonita com todos os seus produtos. Compartilhe o link no seu perfil, bio ou grupos.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
              <span className="truncate text-xs font-medium text-white/90">{showcaseUrl}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyShareLink}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                {copied ? <><Check size={16} /> Copiado!</> : <><Share2 size={16} /> Copiar link</>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openVitrine}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <ExternalLink size={16} /> Abrir vitrine
              </Button>
              <Button
                size="sm"
                onClick={() => setShowPublish(true)}
                className="bg-white text-primary-700 hover:bg-white/90"
              >
                <Send size={16} /> Publicar vitrine
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Configuração de imagens */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Logo */}
        <Card>
          <h3 className="mb-1 text-sm font-bold text-ink-900">Logotipo da loja</h3>
          <p className="mb-4 text-xs text-ink-500">
            Aparece no topo da vitrine e no rodapé. Recomendado: imagem quadrada, até 2MB.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-ink-300" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50">
                {uploading === 'logo' ? (
                  <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                ) : (
                  <><Upload size={16} /> Enviar logo</>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => handleUpload(e, 'logo')}
                  disabled={uploading !== null}
                />
              </label>
              {logoUrl && (
                <button
                  onClick={() => removeImage('logo')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-error-600 hover:text-error-700"
                >
                  <X size={14} /> Remover
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Hero / Banner */}
        <Card>
          <h3 className="mb-1 text-sm font-bold text-ink-900">Imagem de capa (banner)</h3>
          <p className="mb-4 text-xs text-ink-500">
            Aparece no fundo do topo da vitrine. Recomendado: imagem larga (1600x400px), até 2MB.
          </p>
          <div className="space-y-3">
            <div className="relative h-24 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
              {heroUrl ? (
                <>
                  <img src={heroUrl} alt="Capa" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage('hero')}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/60 text-white backdrop-blur-sm transition-colors hover:bg-ink-900/80"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ImageIcon size={24} className="text-ink-300" />
                </div>
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50">
              {uploading === 'hero' ? (
                <><Loader2 size={16} className="animate-spin" /> Enviando...</>
              ) : (
                <><Upload size={16} /> Enviar capa</>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleUpload(e, 'hero')}
                disabled={uploading !== null}
              />
            </label>
          </div>
        </Card>
      </div>

      {/* Pré-visualização */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-primary-600" />
          <h3 className="text-sm font-semibold text-ink-700">Pré-visualização da vitrine</h3>
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-500">
            {formatNumber(links?.length ?? 0)} produtos
          </span>
          <Button variant="ghost" size="sm" onClick={openVitrine} className="ml-auto">
            Ver página completa <ExternalLink size={14} />
          </Button>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white p-4">
          {links && links.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {links.slice(0, 12).map((link) => (
                <div key={link.id} className="overflow-hidden rounded-xl border border-ink-200/60 bg-ink-50">
                  <div className="aspect-square overflow-hidden bg-ink-100">
                    {link.image_url ? (
                      <img src={link.image_url} alt={link.title} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon size={20} className="text-ink-300" />
                      </div>
                    )}
                  </div>
                  <p className="line-clamp-1 px-2 py-1.5 text-[10px] font-medium text-ink-700">
                    {link.title || 'Sem título'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <ImageIcon size={32} className="mx-auto text-ink-300" />
              <p className="mt-2 text-sm text-ink-400">Nenhum produto para exibir ainda.</p>
            </div>
          )}
        </div>
      </div>
      {showPublish && (
        <PublishVitrineModal
          storeName={settings?.store_name ?? 'Minha Loja'}
          vitrineUrl={showcaseUrl}
          token={settings?.telegram_bot_token ?? null}
          delay={settings?.delay_seconds ?? 120}
          maxPerGroup={settings?.max_sends_per_group_per_day ?? 3}
          onClose={() => setShowPublish(false)}
        />
      )}
    </div>
  );
}

type PublishState = 'idle' | 'sending' | 'done';

interface PublishResult {
  groupId: string;
  groupName: string;
  ok: boolean;
  error?: string;
}

function PublishVitrineModal({
  storeName,
  vitrineUrl,
  token,
  delay,
  maxPerGroup,
  onClose,
}: {
  storeName: string;
  vitrineUrl: string;
  token: string | null;
  delay: number;
  maxPerGroup: number;
  onClose: () => void;
}) {
  const { data: groups } = useGroups();
  const { getCount } = useSendCountToday();
  const [message, setMessage] = useState(
    `🛍️ *${storeName}*\n\nConfira todas as nossas ofertas em um só lugar!\n${vitrineUrl}`,
  );
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [state, setState] = useState<PublishState>('idle');
  const [results, setResults] = useState<PublishResult[]>([]);
  const [currentGroup, setCurrentGroup] = useState<string>('');

  const sendableGroups = (groups ?? []).filter(
    (g) => g.status === 'active' && g.telegram_chat_id,
  );

  function toggleGroup(id: string) {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedGroups(new Set(sendableGroups.map((g) => g.id)));
  }

  function selectNone() {
    setSelectedGroups(new Set());
  }

  const groupsToSend = sendableGroups.filter((g) => selectedGroups.has(g.id));
  const groupsOverLimit = groupsToSend.filter((g) => getCount(g.id) >= maxPerGroup);
  const groupsEligible = groupsToSend.filter((g) => getCount(g.id) < maxPerGroup);

  async function handleSend() {
    if (!token || groupsEligible.length === 0) return;
    setState('sending');
    setResults([]);

    for (const group of groupsEligible) {
      setCurrentGroup(group.name);
      const result = await sendMessage(token, group.telegram_chat_id!, message);
      setResults((prev) => [
        ...prev,
        {
          groupId: group.id,
          groupName: group.name,
          ok: result.ok,
          error: result.error,
        },
      ]);
      if (groupsEligible.indexOf(group) < groupsEligible.length - 1) {
        await new Promise((r) => setTimeout(r, delay * 1000));
      }
    }

    setCurrentGroup('');
    setState('done');
  }

  const successCount = results.filter((r) => r.ok).length;
  const failCount = results.filter((r) => !r.ok).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-scale-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Publicar vitrine</h2>
          <button
            onClick={onClose}
            disabled={state === 'sending'}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {!token && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-warning-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Bot não configurado</p>
              <p className="mt-0.5 text-xs text-warning-600">
                Configure o token do bot em Configurações para enviar mensagens.
              </p>
            </div>
          </div>
        )}

        {token && sendableGroups.length === 0 && (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-warning-50 p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-semibold text-warning-700">Nenhum grupo conectado</p>
              <p className="mt-0.5 text-xs text-warning-600">
                Adicione grupos com Chat ID do Telegram vinculado na aba Grupos.
              </p>
            </div>
          </div>
        )}

        {token && sendableGroups.length > 0 && (
          <>
            {/* Message preview */}
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-semibold text-ink-600">
                Mensagem que será enviada
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={state !== 'idle'}
                rows={4}
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-ink-50"
              />
              <div className="mt-2 rounded-xl bg-[#e5ddd5] p-3">
                <div className="ml-auto max-w-[90%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">
                    {message}
                  </p>
                </div>
              </div>
            </div>

            {/* Group selection */}
            {state === 'idle' && (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-600">
                    Grupos ({selectedGroups.size} selecionados)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAll}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                    >
                      Selecionar todos
                    </button>
                    <button
                      onClick={selectNone}
                      className="text-xs font-semibold text-ink-400 hover:text-ink-600"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto scrollbar-thin">
                  {sendableGroups.map((g) => {
                    const count = getCount(g.id);
                    const overLimit = count >= maxPerGroup;
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGroup(g.id)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                          selectedGroups.has(g.id)
                            ? 'bg-primary-100 ring-1 ring-primary-300'
                            : 'bg-ink-50 hover:bg-ink-100'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <MessageCircle size={14} className="shrink-0 text-ink-400" />
                          <span className="truncate font-medium text-ink-900">{g.name}</span>
                        </span>
                        <span className={`shrink-0 text-xs ${overLimit ? 'text-error-600' : 'text-ink-400'}`}>
                          {count}/{maxPerGroup}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {groupsOverLimit.length > 0 && (
                  <p className="mt-2 text-xs text-warning-600">
                    {groupsOverLimit.length} grupo(s) já atingiram o limite diário e serão pulados.
                  </p>
                )}
              </div>
            )}

            {/* Sending progress */}
            {state === 'sending' && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-primary-50 p-3">
                  <Loader2 size={16} className="animate-spin text-primary-600" />
                  <span className="text-sm font-medium text-primary-700">
                    Enviando para: {currentGroup}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-ink-500">
                  <span>{results.length}/{groupsEligible.length} enviados</span>
                  <span>Aguardando {formatDuration(delay)} entre cada</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{ width: `${(results.length / groupsEligible.length) * 100}%` }}
                  />
                </div>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                      r.ok ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-600'
                    }`}
                  >
                    {r.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span className="truncate">{r.groupName}</span>
                    {!r.ok && r.error && <span className="ml-auto truncate">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Done state */}
            {state === 'done' && (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-success-50 p-4 text-center">
                  <CheckCircle2 size={32} className="mx-auto text-success-600" />
                  <p className="mt-2 text-sm font-bold text-success-700">
                    {successCount} envio(s) com sucesso!
                  </p>
                  {failCount > 0 && (
                    <p className="mt-1 text-xs text-error-600">{failCount} falha(s)</p>
                  )}
                </div>
                {results.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                      r.ok ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-600'
                    }`}
                  >
                    {r.ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span className="truncate">{r.groupName}</span>
                    {!r.ok && r.error && <span className="ml-auto truncate">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            {state === 'idle' && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs text-ink-400">
                  {groupsEligible.length} grupo(s) receberão a mensagem
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={onClose}>Cancelar</Button>
                  <Button
                    onClick={handleSend}
                    disabled={groupsEligible.length === 0}
                  >
                    <Send size={16} /> Enviar para {groupsEligible.length} grupo(s)
                  </Button>
                </div>
              </div>
            )}

            {state === 'done' && (
              <div className="mt-5 flex justify-end">
                <Button onClick={onClose}>Concluir</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
