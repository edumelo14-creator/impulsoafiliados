import { useMemo, useState } from 'react';
import {
  Search,
  Link as LinkIcon,
  Plus,
  X,
  FileText,
  Trash2,
  Image as ImageIcon,
  Tag,
  Package,
  Store,
  TrendingUp,
  DollarSign,
  FileUp,
  Loader2,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Card, StatusBadge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLinks } from '@/hooks/useData';
import { supabase, fetchProductData } from '@/lib/supabase';
import { parseCsvContent } from '@/lib/csv';
import { categorizeTitle, CATEGORIES } from '@/lib/categorize';
import { formatBRL, formatDate, formatNumber } from '@/lib/format';
import type { AffiliateLink } from '@/lib/supabase';

const statusFilters = [
  { id: 'all', label: 'Todos' },
  { id: 'ready', label: 'Prontos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'sent', label: 'Enviados' },
] as const;

export function Links() {
  const { data: links, error, loading, refetch } = useLinks();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [imgProgress, setImgProgress] = useState<{ done: number; total: number; found: number } | null>(null);

  const linksWithoutImages = useMemo(
    () => (links ?? []).filter((l) => !l.image_url),
    [links],
  );

  const filtered = useMemo(() => {
    if (!links) return [];
    return links.filter((l) => {
      const matchesQuery =
        l.url.toLowerCase().includes(query.toLowerCase()) ||
        l.title.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || l.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [links, query, status]);

  async function handleLoadMissingImages() {
    if (loadingImages || linksWithoutImages.length === 0) return;
    setLoadingImages(true);
    setImgProgress({ done: 0, total: linksWithoutImages.length, found: 0 });

    let found = 0;
    let done = 0;
    const batchSize = 3;

    for (let i = 0; i < linksWithoutImages.length; i += batchSize) {
      const batch = linksWithoutImages.slice(i, i + batchSize);
      await Promise.all(batch.map(async (link) => {
        const productData = await fetchProductData(link.url);
        const updates: Record<string, string | number> = {};
        if (productData.image_url) {
          updates.image_url = productData.image_url;
          found++;
        }
        if (productData.price != null && productData.price > 0 && !link.price) {
          updates.price = productData.price;
        }
        if (Object.keys(updates).length > 0) {
          await supabase.from('affiliate_links').update(updates).eq('id', link.id);
        }
        done++;
        setImgProgress({ done, total: linksWithoutImages.length, found });
      }));
    }

    setLoadingImages(false);
    setTimeout(() => setImgProgress(null), 3000);
    refetch();
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-2xl border border-ink-200/70 bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-500">
          <span>{formatNumber(links?.length ?? 0)} links no total</span>
          {linksWithoutImages.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-600">
              <ImageIcon size={12} /> {linksWithoutImages.length} sem imagem
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {linksWithoutImages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMissingImages}
              disabled={loadingImages}
            >
              {loadingImages ? (
                <><Loader2 size={16} className="animate-spin" /> Carregando imagens...</>
              ) : (
                <><RefreshCw size={16} /> Carregar imagens ({linksWithoutImages.length})</>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <FileText size={16} /> Importar CSV
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Adicionar
          </Button>
          {(links?.length ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmClear(true)}
              disabled={clearing}
              className="!border-error-200 !text-error-600 hover:!bg-error-50"
            >
              {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Limpar tudo
            </Button>
          )}
        </div>
      </div>

      {/* Image loading progress */}
      {imgProgress && (
        <div className="rounded-2xl border border-primary-200 bg-primary-50 p-4 animate-fade-up">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold text-primary-700">
              <Loader2 size={16} className="animate-spin" />
              Buscando imagens e preços dos produtos...
            </span>
            <span className="font-mono text-primary-600">
              {imgProgress.done}/{imgProgress.total} · {imgProgress.found} encontradas
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${(imgProgress.done / imgProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título ou URL..."
              className={inputCls + ' pl-10'}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatus(s.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  status === s.id ? 'bg-primary-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState onImport={() => setShowImport(true)} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((link) => (
            <LinkCard key={link.id} link={link} onChanged={refetch} />
          ))}
        </div>
      )}

      {showImport && (
        <ImportTxtModal
          onClose={() => setShowImport(false)}
          onSaved={() => {
            setShowImport(false);
            refetch();
          }}
        />
      )}
      {showAdd && (
        <AddLinkModal
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            refetch();
          }}
        />
      )}
      {confirmClear && (
        <ConfirmClearModal
          count={links?.length ?? 0}
          clearing={clearing}
          onCancel={() => setConfirmClear(false)}
          onConfirm={async () => {
            setClearing(true);
            const { error } = await supabase.from('affiliate_links').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            setClearing(false);
            setConfirmClear(false);
            if (!error) refetch();
          }}
        />
      )}
    </div>
  );
}

function CategoryPicker({ link, onChanged }: { link: AffiliateLink; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState(link.category ?? '');

  async function save(newValue: string) {
    setSaving(true);
    const toSave = newValue || null;
    await supabase.from('affiliate_links').update({ category: toSave }).eq('id', link.id);
    setSaving(false);
    setEditing(false);
    onChanged();
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setValue(link.category ?? ''); setEditing(true); }}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary-600 transition-colors hover:text-primary-700"
        title="Clique para alterar a categoria"
      >
        {link.category ?? 'Sem categoria'}
        <ChevronDown size={12} className="text-ink-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <select
        autoFocus
        value={value}
        onChange={(e) => { setValue(e.target.value); save(e.target.value); }}
        onBlur={() => { if (!saving) setEditing(false); }}
        disabled={saving}
        className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        <option value="">Sem categoria</option>
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
        <option value="Outros">Outros</option>
      </select>
      {saving && <Loader2 size={12} className="animate-spin text-ink-400" />}
    </div>
  );
}

function ConfirmClearModal({
  count,
  clearing,
  onCancel,
  onConfirm,
}: {
  count: number;
  clearing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Remover todos os links" onClose={onCancel}>
      <div className="p-5">
        <div className="flex items-start gap-3 rounded-xl bg-error-50 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-error-500" size={20} />
          <div>
            <p className="text-sm font-semibold text-error-700">
              Você está prestes a remover {count} {count === 1 ? 'link' : 'links'}.
            </p>
            <p className="mt-1 text-xs text-error-600">
              Esta ação não pode ser desfeita. Use antes de importar uma nova remessa de links.
            </p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={clearing}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            disabled={clearing}
            className="!bg-error-600 hover:!bg-error-700 !text-white"
          >
            {clearing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            Sim, remover tudo
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function LinkCard({ link, onChanged }: { link: AffiliateLink; onChanged: () => void }) {
  async function remove() {
    await supabase.from('affiliate_links').delete().eq('id', link.id);
    onChanged();
  }

  return (
    <div className="group overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative aspect-video overflow-hidden bg-ink-100">
        {link.image_url ? (
          <img
            src={link.image_url}
            alt={link.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon size={32} className="text-ink-300" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={link.status} />
        </div>
        {link.price && (
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-sm font-bold text-primary-700 backdrop-blur">
            {formatBRL(link.price)}
          </div>
        )}
      </div>
      <div className="p-4">
        <CategoryPicker link={link} onChanged={onChanged} />
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900">
          {link.title || 'Sem título'}
        </h3>

        {(link.store_name || link.sales != null || link.commission != null) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            {link.store_name && (
              <span className="flex items-center gap-1 rounded-md bg-ink-100 px-2 py-0.5 font-medium text-ink-600">
                <Store size={11} /> {link.store_name}
              </span>
            )}
            {link.sales != null && (
              <span className="flex items-center gap-1 rounded-md bg-accent-50 px-2 py-0.5 font-medium text-accent-700">
                <TrendingUp size={11} /> {link.sales} vendas
              </span>
            )}
            {link.commission != null && (
              <span className="flex items-center gap-1 rounded-md bg-success-50 px-2 py-0.5 font-medium text-success-700">
                <DollarSign size={11} /> {formatBRL(link.commission)}
                {link.commission_rate && ` (${link.commission_rate})`}
              </span>
            )}
          </div>
        )}

        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block truncate text-xs text-ink-400 hover:text-primary-600"
        >
          {link.url}
        </a>
        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="text-xs text-ink-400">{formatDate(link.created_at)}</span>
          <button
            onClick={remove}
            className="flex items-center gap-1 text-xs font-medium text-ink-400 transition-colors hover:text-error-600"
          >
            <Trash2 size={14} /> Remover
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportTxtModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; replaced: number; imagesFound: number; pricesFixed: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [fetchingImages, setFetchingImages] = useState(false);

  const parsed = useMemo(() => (text.trim() ? parseCsvContent(text) : []), [text]);
  const isCsvFormat = parsed.length > 0 && parsed.some((r) => r.item_id || r.store_name);

  async function handleImport() {
    setImporting(true);
    setErr(null);

    // Replace duplicates: delete old rows with same title+store OR same URL
    const urls = parsed.map((r) => r.url);
    const titleStorePairs = parsed
      .filter((r) => r.title)
      .map((r) => ({ title: r.title, store: r.store_name ?? '' }));

    // Delete by URL match
    await supabase.from('affiliate_links').delete().in('url', urls);

    // Delete by title+store match (same product from same store, different affiliate link)
    for (const pair of titleStorePairs) {
      let query = supabase.from('affiliate_links').delete().eq('title', pair.title);
      if (pair.store) {
        query = query.eq('store_name', pair.store);
      } else {
        query = query.is('store_name', null);
      }
      await query;
    }

    const rows = parsed.map((r) => ({
      url: r.url,
      title: r.title || r.url,
      category: categorizeTitle(r.title || r.url) as string | null,
      image_url: null as string | null,
      price: r.price,
      status: 'ready' as const,
      item_id: r.item_id,
      store_name: r.store_name,
      commission_rate: r.commission_rate,
      commission: r.commission,
      sales: r.sales,
      product_url: r.product_url,
    }));

    const { data, error } = await supabase.from('affiliate_links').insert(rows).select();

    setImporting(false);
    if (error) {
      setErr(error.message);
      return;
    }

    const added = data?.length ?? 0;
    setResult({ added, replaced: parsed.length - added, imagesFound: 0 });

    // Buscar imagens e preços reais dos links importados em background
    if (added > 0 && data) {
      setFetchingImages(true);
      let imagesFound = 0;
      let pricesFixed = 0;
      const batchSize = 3;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        await Promise.all(batch.map(async (link) => {
          const productData = await fetchProductData(link.url);
          const updates: Record<string, string | number | null> = {};
          if (productData.image_url) {
            updates.image_url = productData.image_url;
            imagesFound++;
          }
          if (productData.price != null && productData.price > 0 && !link.price) {
            updates.price = productData.price;
            pricesFixed++;
          }
          if (Object.keys(updates).length > 0) {
            await supabase.from('affiliate_links').update(updates).eq('id', link.id);
          }
        }));
      }
      setFetchingImages(false);
      setResult({ added, replaced: parsed.length - added, imagesFound, pricesFixed });
      setTimeout(onSaved, 1200);
    } else if (added > 0) {
      setTimeout(onSaved, 1200);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setText(String(ev.target?.result ?? ''));
    };
    reader.readAsText(file);
  }

  return (
    <Modal title="Importar links" onClose={onClose}>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-500">
          Cole o conteúdo do CSV exportado do programa de afiliados Shopee, ou envie o arquivo.
        </p>
        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-600 transition-colors hover:bg-ink-50">
          <FileUp size={16} /> Enviar arquivo
          <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={9}
        placeholder={'Item Id,Item Name,Price,Sales,Nome da loja,Commission Rate,Commission,Product Link,Offer Link\n19897727514,Kit 2 Camisetas...,59,94,124,BlessGroup,3%,R$1,80,https://shopee.com.br/...,https://s.shopee.com.br/...'}
        className="mt-1 w-full rounded-xl border border-ink-200 bg-ink-50 p-3 font-mono text-xs text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 scrollbar-thin"
      />

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-ink-400">
          {parsed.length} {parsed.length === 1 ? 'link detectado' : 'links detectados'}
          {isCsvFormat && ' · formato CSV Shopee'}
        </span>
        {result && (
          <span className="flex items-center gap-1 font-semibold text-success-600">
            <CheckCircle2 size={14} />
            {result.added} adicionados{result.replaced > 0 ? ` · ${result.replaced} substituídos` : ''}
            {result.imagesFound > 0 && ` · ${result.imagesFound} imagens`}
            {result.pricesFixed > 0 && ` · ${result.pricesFixed} preços corrigidos`}
          </span>
        )}
        {fetchingImages && (
          <span className="flex items-center gap-1 text-primary-600">
            <Loader2 size={12} className="animate-spin" /> Buscando imagens...
          </span>
        )}
      </div>

      {/* Preview dos primeiros items parseados */}
      {parsed.length > 0 && !result && (
        <div className="mt-3 max-h-32 overflow-y-auto rounded-xl border border-ink-100 bg-ink-50 p-2 scrollbar-thin">
          {parsed.slice(0, 4).map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-1 text-xs">
              <Package size={12} className="shrink-0 text-ink-400" />
              <span className="truncate font-medium text-ink-700">{r.title || r.url}</span>
              {r.price != null && <span className="shrink-0 text-ink-400">{formatBRL(r.price)}</span>}
            </div>
          ))}
          {parsed.length > 4 && (
            <p className="py-1 text-xs text-ink-400">+ {parsed.length - 4} outros...</p>
          )}
        </div>
      )}

      <p className="mt-3 rounded-lg bg-ink-50 p-2.5 text-xs text-ink-500">
        Itens duplicados serão substituídos: se já existir um link com o mesmo título e loja, o antigo é removido e o novo importado no lugar.
      </p>

      {err && <p className="mt-2 text-sm text-error-600">{err}</p>}
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleImport} disabled={importing || parsed.length === 0}>
          {importing ? 'Importando...' : `Importar ${parsed.length > 0 ? `(${parsed.length})` : ''}`}
        </Button>
      </div>
    </Modal>
  );
}

function AddLinkModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (value.trim()) {
      setCategory(categorizeTitle(value));
    }
  }

  async function handleFetchData() {
    if (!url.trim()) return;
    setFetching(true);
    setErr(null);
    const data = await fetchProductData(url);
    if (data.image_url) setImageUrl(data.image_url);
    if (data.price != null && data.price > 0) setPrice(data.price.toFixed(2));
    setFetching(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);

    // Replace if duplicate URL exists
    await supabase.from('affiliate_links').delete().eq('url', url);

    const finalCategory = category || (title.trim() ? categorizeTitle(title) : null);

    const { error } = await supabase.from('affiliate_links').insert({
      url,
      title: title || url,
      category: finalCategory || null,
      image_url: imageUrl || null,
      price: price ? parseFloat(price) : null,
      status: 'ready',
    });
    setSaving(false);
    if (error) setErr(error.message);
    else onSaved();
  }

  return (
    <Modal title="Adicionar link" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="URL do link de afiliado *" icon={<LinkIcon size={14} />}>
          <div className="flex gap-2">
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputCls}
              placeholder="https://shope.ee/..."
            />
            <Button type="button" variant="outline" size="sm" onClick={handleFetchData} disabled={fetching || !url.trim()}>
              {fetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Buscar
            </Button>
          </div>
          <p className="mt-1 text-xs text-ink-400">Clique em Buscar para preencher imagem e preço automaticamente.</p>
        </Field>
        <Field label="Título do produto" icon={<Package size={14} />}>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={inputCls}
            placeholder="Ex: Fone Bluetooth JBL"
          />
          {title.trim() && category && (
            <p className="mt-1 text-xs text-ink-400">Categoria detectada: <span className="font-semibold text-primary-600">{category}</span></p>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria" icon={<Tag size={14} />}>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls}
              placeholder="Eletrônicos"
            />
          </Field>
          <Field label="Preço (R$)">
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
              placeholder="0,00"
            />
          </Field>
        </div>
        <Field label="URL da imagem" icon={<ImageIcon size={14} />}>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>
        {err && <p className="text-sm text-error-600">{err}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar link'}</Button>
        </div>
      </form>
    </Modal>
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink-900/40 p-4 pt-6 backdrop-blur-sm animate-scale-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[calc(100vh-3rem)] flex flex-col">
        <div className="flex items-center justify-between p-6 pb-4 shrink-0">
          <h2 className="text-lg font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-sm text-error-600">Erro ao carregar links: {message}</p>
    </div>
  );
}

function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <div className="py-16 text-center">
      <LinkIcon size={40} className="mx-auto text-ink-300" />
      <p className="mt-3 text-sm font-medium text-ink-600">Nenhum link encontrado</p>
      <p className="mt-1 text-xs text-ink-400">Importe sua lista em CSV (export do afiliado Shopee) ou adicione manualmente.</p>
      <div className="mt-4">
        <Button size="sm" onClick={onImport}>
          <FileText size={16} /> Importar CSV
        </Button>
      </div>
    </div>
  );
}
