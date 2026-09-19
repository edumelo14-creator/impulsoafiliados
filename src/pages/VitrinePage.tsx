import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Tag,
  Image as ImageIcon,
  ShoppingBag,
  Share2,
  Check,
  Heart,
  Sparkles,
  TrendingUp,
  X,
  Store,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Flame,
  Package,
  LayoutGrid,
} from 'lucide-react';
import { useLinks, useSettings } from '@/hooks/useData';
import { formatBRL } from '@/lib/format';
import { registerVisit, logLinkClick } from '@/lib/tracking';
import type { AffiliateLink } from '@/lib/supabase';

export function VitrinePage() {
  const { data: links, loading } = useLinks();
  const { settings } = useSettings();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Todas');
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<AffiliateLink | null>(null);
  const [catBarExpanded, setCatBarExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    document.title = `${settings?.store_name ?? 'Vitrine'} | Ofertas`;
  }, [settings?.store_name]);

  useEffect(() => {
    registerVisit();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    (links ?? []).forEach((l) => l.category && cats.add(l.category));
    return ['Todas', ...Array.from(cats).sort()];
  }, [links]);

  const filtered = useMemo(() => {
    if (!links) return [];
    return links.filter((l) => {
      const matchesQuery = l.title.toLowerCase().includes(query.toLowerCase());
      const matchesCat = category === 'Todas' || l.category === category;
      return matchesQuery && matchesCat;
    });
  }, [links, query, category]);

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateScrollIndicators() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    updateScrollIndicators();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollIndicators);
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [categories, catBarExpanded]);

  function scrollCats(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -240 : 240, behavior: 'smooth' });
  }

  function selectCat(cat: string) {
    setCategory(cat);
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
  }

  const storeName = settings?.store_name ?? 'Minha Loja';
  const defaultLogo = '/images/vitrine/logo-ab.png';
  const logoUrl = settings?.vitrine_logo_url ?? defaultLogo;
  const heroUrl = settings?.vitrine_hero_url;
  const defaultHero = '/images/vitrine/629997121_122105482725241898_8716204251637680679_n.png';
  const heroSrc = heroUrl ?? defaultHero;
  const productCount = links?.length ?? 0;
  const categoryCount = categories.length - 1;

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Hero Section — altura igual à do banner, conteúdo em uma linha só */}
      <header className="relative aspect-[1024/412] w-full overflow-hidden shadow-lg">
        {/* Background image — preenche o cabeçalho inteiro, sem sobra */}
        <img
          src={heroSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 h-full w-full bg-gradient-to-br from-primary-500 via-primary-700 to-accent-700" />

        {/* Sombra apenas na base, pra legibilidade do nome/cards sem escurecer o banner todo */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink-900/85 to-transparent" />

        {/* Compartilhar — canto superior direito */}
        <div className="absolute right-3 top-3 z-10 sm:right-5 sm:top-4">
          <button
            onClick={copyShareLink}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-500/80 to-accent-600/80 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md transition-all hover:from-accent-400 hover:to-accent-500 hover:shadow-lg hover:shadow-accent-500/30 sm:px-4 sm:py-2 sm:text-xs"
          >
            {copied ? <><Check size={14} /> Link copiado!</> : <><Share2 size={14} /> Compartilhar</>}
          </button>
        </div>

        {/* Ícone + nome + cards — tudo em uma única linha, alinhados à base */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2 overflow-x-auto px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-4">
          {logoUrl ? (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-xl ring-2 ring-white/40 sm:h-14 sm:w-14 sm:rounded-2xl sm:ring-4">
              <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/25 to-white/10 shadow-xl ring-2 ring-white/40 backdrop-blur-md sm:h-14 sm:w-14 sm:rounded-2xl sm:ring-4">
              <ShoppingBag size={18} className="text-white sm:hidden" />
              <ShoppingBag size={24} className="hidden text-white sm:block" />
            </div>
          )}

          <h1 className="flex-shrink-0 whitespace-nowrap text-base font-extrabold tracking-tight text-white drop-shadow-2xl sm:text-2xl">
            {storeName}
          </h1>

          {productCount > 0 ? (
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-primary-500/90 to-primary-600/90 px-2 py-1 backdrop-blur-md shadow-lg sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5">
                <Flame size={12} className="text-white sm:hidden" />
                <Flame size={14} className="hidden text-white sm:block" />
                <span className="whitespace-nowrap text-[10px] font-bold text-white sm:text-xs">{productCount} produtos</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-accent-500/90 to-accent-600/90 px-2 py-1 backdrop-blur-md shadow-lg sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5">
                <LayoutGrid size={12} className="text-white sm:hidden" />
                <LayoutGrid size={14} className="hidden text-white sm:block" />
                <span className="whitespace-nowrap text-[10px] font-bold text-white sm:text-xs">{categoryCount} categorias</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-success-500/90 to-success-600/90 px-2 py-1 backdrop-blur-md shadow-lg sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-1.5">
                <Package size={12} className="text-white sm:hidden" />
                <Package size={14} className="hidden text-white sm:block" />
                <span className="whitespace-nowrap text-[10px] font-bold text-white sm:text-xs">Ofertas ativas</span>
              </div>
            </div>
          ) : (
            <p className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-white/90 sm:text-sm">
              <Sparkles size={14} className="text-warning-300" />
              Em breve, novidades por aqui
            </p>
          )}
        </div>
      </header>

      {/* Search + Categories — sticky, full-width, collapsible */}
      <div className="sticky top-0 z-20 border-b border-ink-200/60 bg-ink-50/95 backdrop-blur-md">
        {/* Search row */}
        <div className="px-4 pt-3 sm:px-6">
          <div className="relative mx-auto max-w-2xl">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Category bar — uniform width, horizontal scroll, collapsible */}
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            {/* Collapse toggle */}
            <button
              onClick={() => setCatBarExpanded((v) => !v)}
              className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-2 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-200"
              aria-label={catBarExpanded ? 'Esconder categorias' : 'Mostrar categorias'}
            >
              {catBarExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span className="hidden sm:inline">{catBarExpanded ? 'Esconder' : 'Categorias'}</span>
            </button>

            {/* Left scroll arrow */}
            {catBarExpanded && canScrollLeft && (
              <button
                onClick={() => scrollCats('left')}
                className="flex-shrink-0 rounded-lg bg-ink-100 p-2 text-ink-500 transition-colors hover:bg-ink-200"
                aria-label="Rolar para esquerda"
              >
                <ChevronDown size={16} className="rotate-90" />
              </button>
            )}

            {/* Category buttons — scrollable */}
            {catBarExpanded && (
              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={scrollRef}
                  className="flex gap-2 overflow-x-auto scrollbar-none pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => selectCat(cat)}
                      className={`flex-shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 text-center ${
                        category === cat
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-600/25'
                          : 'bg-white text-ink-600 border border-ink-200 shadow-sm hover:border-primary-300 hover:text-primary-700'
                      }`}
                      style={{ width: '130px' }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {/* Fade indicators */}
                {canScrollRight && (
                  <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-12 bg-gradient-to-l from-ink-50/95 to-transparent" />
                )}
                {canScrollLeft && (
                  <div className="pointer-events-none absolute left-0 top-0 bottom-1 w-12 bg-gradient-to-r from-ink-50/95 to-transparent" />
                )}
              </div>
            )}

            {/* When collapsed — show active category */}
            {!catBarExpanded && (
              <div className="flex flex-1 items-center gap-2">
                <span className="rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-primary-600/25">
                  {category}
                </span>
                <span className="text-xs text-ink-400">
                  Toque em Categorias para ver todas
                </span>
              </div>
            )}

            {/* Right scroll arrow */}
            {catBarExpanded && canScrollRight && (
              <button
                onClick={() => scrollCats('right')}
                className="flex-shrink-0 rounded-lg bg-ink-100 p-2 text-ink-500 transition-colors hover:bg-ink-200"
                aria-label="Rolar para direita"
              >
                <ChevronDown size={16} className="-rotate-90" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid — full-width, more columns */}
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-ink-200/60 bg-white">
                <div className="aspect-square bg-ink-100" />
                <div className="space-y-2 p-3">
                  <div className="h-3 w-16 rounded bg-ink-100" />
                  <div className="h-3 w-full rounded bg-ink-100" />
                  <div className="h-3 w-2/3 rounded bg-ink-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink-100">
              <ImageIcon size={28} className="text-ink-300" />
            </div>
            <p className="mt-4 text-base font-semibold text-ink-700">Nenhum produto encontrado</p>
            <p className="mt-1 text-sm text-ink-400">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 text-sm text-ink-500">
              <TrendingUp size={16} className="text-primary-500" />
              <span className="font-semibold">{filtered.length}</span>
              <span>{filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</span>
              {category !== 'Todas' && (
                <span className="text-ink-400">em <span className="font-semibold text-primary-600">{category}</span></span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((link, idx) => (
                <div
                  key={link.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200/60 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover animate-fade-up"
                  style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                >
                  {/* Image — click opens modal */}
                  <button
                    onClick={() => setSelected(link)}
                    className="relative block aspect-square w-full overflow-hidden bg-ink-100"
                  >
                    {link.image_url ? (
                      <img
                        src={link.image_url}
                        alt={link.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon size={32} className="text-ink-300" />
                      </div>
                    )}
                    {link.price && (
                      <div className="absolute right-2 top-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg shadow-primary-600/30">
                        {formatBRL(link.price)}
                      </div>
                    )}
                    {/* Like button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleLike(link.id);
                      }}
                      className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white"
                      aria-label="Favoritar"
                    >
                      <Heart
                        size={16}
                        className={`transition-colors ${
                          liked.has(link.id) ? 'fill-primary-600 text-primary-600' : 'text-ink-400'
                        }`}
                      />
                    </button>
                  </button>

                  {/* Info */}
                  <div className="flex flex-1 flex-col p-3">
                    {link.category && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-primary-600">
                        <Tag size={9} /> {link.category}
                      </span>
                    )}
                    <p className="mt-1 line-clamp-2 flex-1 text-xs font-medium leading-relaxed text-ink-900">
                      {link.title || 'Sem título'}
                    </p>
                    <button
                      onClick={() => setSelected(link)}
                      className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-primary-50 py-2 text-xs font-bold text-primary-700 transition-colors group-hover:bg-primary-600 group-hover:text-white"
                    >
                      Ver oferta <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer — full-width */}
      <footer className="border-t border-ink-200 bg-white">
        <div className="px-4 py-8 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={storeName} className="h-8 w-8 rounded-lg object-cover" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-600">
                  <ShoppingBag size={16} className="text-white" />
                </div>
              )}
              <span className="text-sm font-bold text-ink-900">{storeName}</span>
            </div>
            <p className="text-xs text-ink-400">
              Vitrine de ofertas · Os preços podem mudar a qualquer momento
            </p>
          </div>
        </div>
      </footer>

      {/* Offer Modal */}
      {selected && (
        <OfferModal link={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function OfferModal({ link, onClose }: { link: AffiliateLink; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-scale-in p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary-600">
            <Tag size={11} /> {link.category ?? 'Oferta'}
          </span>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Product image */}
        <div className="relative aspect-square w-full overflow-hidden bg-ink-50">
          {link.image_url ? (
            <img
              src={link.image_url}
              alt={link.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon size={48} className="text-ink-300" />
            </div>
          )}
          {link.price && (
            <div className="absolute left-3 top-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-primary-600/30">
              a partir de {formatBRL(link.price)}
            </div>
          )}
        </div>

        {/* Product info + actions */}
        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold leading-snug text-ink-900">
              {link.title || 'Sem título'}
            </h2>
            {link.store_name && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                <Store size={14} /> {link.store_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logLinkClick({ id: link.id, title: link.title, url: link.url })}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/25 transition-all hover:from-primary-600 hover:to-primary-700 hover:shadow-primary-600/40"
            >
              <ShoppingBag size={18} /> Comprar
            </a>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 px-5 py-3.5 text-sm font-bold text-ink-600 transition-colors hover:bg-ink-50"
            >
              Fechar
            </button>
          </div>

          <p className="text-center text-xs text-ink-400">
            Você será levado à loja em uma nova aba
          </p>
        </div>
      </div>
    </div>
  );
}
