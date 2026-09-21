import { useState } from 'react';
import { MessageSquare, Plus, X, Star, Trash2, Copy, Check, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTemplates } from '@/hooks/useData';
import { supabase } from '@/lib/supabase';
import type { MessageTemplate } from '@/lib/supabase';

export function Messages() {
  const { data: templates, error, loading, refetch } = useTemplates();
  const [showAdd, setShowAdd] = useState(false);

  if (loading) return <LoadingGrid />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-500">
          {templates?.length ?? 0} templates de mensagem
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Novo template
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {(templates ?? []).map((t) => (
          <TemplateCard key={t.id} template={t} onChanged={refetch} />
        ))}
      </div>

      {(templates ?? []).length === 0 && (
        <EmptyState onAdd={() => setShowAdd(true)} />
      )}

      {showAdd && (
        <AddTemplateModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function TemplateCard({ template: t, onChanged }: { template: MessageTemplate; onChanged: () => void }) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(t.name);
  const [draftContent, setDraftContent] = useState(t.content);
  const [draftSendImage, setDraftSendImage] = useState(t.send_image);
  const [saving, setSaving] = useState(false);
  const previewUrl = 'https://shope.ee/SEU_LINK_AQUI';
  const previewText = t.content
    .replace(/\{link\}/g, previewUrl)
    .replace(/\{nomeProduto\}/g, 'Nome do produto');
  const draftPreviewText = draftContent
    .replace(/\{link\}/g, previewUrl)
    .replace(/\{nomeProduto\}/g, 'Nome do produto');

  async function setDefault() {
    await supabase.from('message_templates').update({ is_default: false }).neq('id', t.id);
    await supabase.from('message_templates').update({ is_default: true }).eq('id', t.id);
    onChanged();
  }

  async function remove() {
    await supabase.from('message_templates').delete().eq('id', t.id);
    onChanged();
  }

  function copyPreview() {
    navigator.clipboard.writeText(previewText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function startEdit() {
    setDraftName(t.name);
    setDraftContent(t.content);
    setDraftSendImage(t.send_image);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveEdit() {
    setSaving(true);
    const { error } = await supabase
      .from('message_templates')
      .update({ name: draftName, content: draftContent, send_image: draftSendImage })
      .eq('id', t.id);
    setSaving(false);
    if (error) {
      window.alert(`Erro ao salvar template: ${error.message}`);
      return;
    }
    setEditing(false);
    onChanged();
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-primary-600" />
          {editing ? (
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              className="rounded-lg border border-ink-200 px-2 py-1 text-sm font-semibold text-ink-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          ) : (
            <h3 className="text-sm font-semibold text-ink-900">{t.name}</h3>
          )}
          {t.is_default && (
            <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-600">
              <Star size={11} className="fill-primary-500 text-primary-500" /> Padrão
            </span>
          )}
          {!editing && !t.send_image && (
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-500">
              Sem imagem
            </span>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <button
              onClick={startEdit}
              className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
              title="Editar mensagem"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={copyPreview}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-ink-100"
              title="Copiar mensagem"
            >
              {copied ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
            </button>
            {!t.is_default && (
              <button
                onClick={setDefault}
                className="rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition-colors hover:bg-primary-50 hover:text-primary-600"
                title="Definir como padrão"
              >
                <Star size={14} />
              </button>
            )}
            <button
              onClick={remove}
              className="rounded-lg px-2 py-1 text-ink-400 transition-colors hover:bg-error-50 hover:text-error-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3 p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">
              Mensagem <span className="text-ink-400">(use {'{link}'} e {'{nomeProduto}'})</span>
            </span>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 font-mono text-sm text-ink-900 scrollbar-thin focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={draftSendImage}
              onChange={(e) => setDraftSendImage(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500/30"
            />
            Enviar imagem do produto junto com a mensagem
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">Preview</span>
            <div className="rounded-xl bg-[#e5ddd5] p-3">
              <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{draftPreviewText}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>Cancelar</Button>
            <Button size="sm" onClick={saveEdit} disabled={saving || !draftName.trim() || !draftContent.trim()}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Preview estilo WhatsApp */}
          <div className="bg-[#e5ddd5] p-4">
            <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3 shadow-sm">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{previewText}</p>
              <div className="mt-1.5 flex items-center justify-end gap-1">
                <span className="text-[10px] text-ink-400">12:00</span>
                <svg width="14" height="14" viewBox="0 0 16 11" fill="none">
                  <path d="M11.07 1.65 15 5.5l-3.93 3.85M15 5.5H1" stroke="#53bdeb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 text-xs text-ink-400">
            Use <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-primary-600">{'{link}'}</code> e{' '}
            <code className="rounded bg-ink-100 px-1 py-0.5 font-mono text-primary-600">{'{nomeProduto}'}</code> onde o link e o nome do produto devem aparecer
          </div>
        </>
      )}
    </div>
  );
}

function AddTemplateModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [sendImage, setSendImage] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const previewText = content
    .replace(/\{link\}/g, 'https://shope.ee/SEU_LINK')
    .replace(/\{nomeProduto\}/g, 'Nome do produto');
  const hasPlaceholder = content.includes('{link}');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { error } = await supabase.from('message_templates').insert({
      name,
      content,
      is_default: false,
      send_image: sendImage,
    });
    setSaving(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-scale-in">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Novo template de mensagem</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">Nome do template *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              placeholder="Ex: Promoção Black Friday"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">
              Mensagem * <span className="text-ink-400">(use {'{link}'} para o link e {'{nomeProduto}'} para o nome do produto)</span>
            </span>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={inputCls + ' font-mono scrollbar-thin'}
              placeholder={'🔥 OFERTA IMPERDÍVEL!\n\n{link}\n\nCorre que é por tempo limitado!'}
            />
          </label>
          {!hasPlaceholder && content.length > 0 && (
            <p className="text-xs text-warning-600">
              Dica: adicione {'{link}'} onde o link do produto deve aparecer na mensagem.
            </p>
          )}

          <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
            <input
              type="checkbox"
              checked={sendImage}
              onChange={(e) => setSendImage(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300 text-primary-600 focus:ring-primary-500/30"
            />
            Enviar imagem do produto junto com a mensagem
          </label>

          {previewText && (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-ink-600">Preview</span>
              <div className="rounded-xl bg-[#e5ddd5] p-3">
                <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-[#dcf8c6] p-3">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-800">{previewText}</p>
                </div>
              </div>
            </div>
          )}

          {err && <p className="text-sm text-error-600">{err}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar template'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20';

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-64 animate-pulse rounded-2xl border border-ink-200/70 bg-white" />
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-error-600">Erro ao carregar templates: {message}</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center">
      <MessageSquare size={40} className="mx-auto text-ink-300" />
      <p className="mt-3 text-sm font-medium text-ink-600">Nenhum template criado</p>
      <p className="mt-1 text-xs text-ink-400">Crie modelos de mensagem com o placeholder {'{link}'}.</p>
      <div className="mt-4">
        <Button size="sm" onClick={onAdd}>
          <Plus size={16} /> Criar template
        </Button>
      </div>
    </div>
  );
}
