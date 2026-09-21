import { useMemo, useState } from 'react';
import {
  Users,
  Eye,
  RotateCcw,
  MousePointerClick,
  MapPin,
  X,
  ShoppingBag,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { useVisitantes, useEventosVitrine } from '@/hooks/useData';
import { formatNumber, formatDateTime, timeAgo } from '@/lib/format';
import type { VitrineVisitante } from '@/lib/supabase';

function cidadeLabel(v: { cidade: string | null; regiao: string | null; pais: string | null }): string {
  if (v.cidade && v.regiao) return `${v.cidade} - ${v.regiao}`;
  if (v.cidade) return v.cidade;
  if (v.pais) return v.pais;
  return 'Cidade não identificada';
}

export function Visitas() {
  const { data: visitantes, loading: loadingVisitantes } = useVisitantes();
  const { data: eventos, loading: loadingEventos } = useEventosVitrine(300);
  const [selected, setSelected] = useState<VitrineVisitante | null>(null);

  const loading = loadingVisitantes || loadingEventos;

  const stats = useMemo(() => {
    const totalVisitantes = visitantes?.length ?? 0;
    const totalVisitas = (visitantes ?? []).reduce((s, v) => s + v.visit_count, 0);
    const retornaram = (visitantes ?? []).filter((v) => v.visit_count > 1).length;
    const cliquesVerOferta = (eventos ?? []).filter((e) => e.tipo === 'click_ver_oferta').length;
    const cliquesMaisDetalhes = (eventos ?? []).filter((e) => e.tipo === 'click_mais_detalhes').length;
    const totalCliques = cliquesVerOferta + cliquesMaisDetalhes;
    return { totalVisitantes, totalVisitas, retornaram, totalCliques, cliquesVerOferta, cliquesMaisDetalhes };
  }, [visitantes, eventos]);

  const porCidade = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of visitantes ?? []) {
      const label = cidadeLabel(v);
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [visitantes]);

  const maxCidade = porCidade[0]?.[1] ?? 1;

  const cliquesRecentes = useMemo(() => {
    return (eventos ?? [])
      .filter((e) => e.tipo === 'click_ver_oferta' || e.tipo === 'click_mais_detalhes')
      .slice(0, 12);
  }, [eventos]);

  const eventosDoSelecionado = useMemo(() => {
    if (!selected) return [];
    return (eventos ?? []).filter((e) => e.visitor_id === selected.visitor_id);
  }, [eventos, selected]);

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          label="Visitantes únicos"
          value={formatNumber(stats.totalVisitantes)}
          icon={<Users size={22} />}
          accent="primary"
        />
        <StatCard
          label="Visitas totais"
          value={formatNumber(stats.totalVisitas)}
          icon={<Eye size={22} />}
          accent="accent"
        />
        <StatCard
          label="Voltaram a visitar"
          value={formatNumber(stats.retornaram)}
          icon={<RotateCcw size={22} />}
          accent="success"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard
          label={'Cliques em "Ver oferta"'}
          value={formatNumber(stats.cliquesVerOferta)}
          icon={<Eye size={22} />}
          accent="warning"
        />
        <StatCard
          label={'Cliques em "Mais detalhes"'}
          value={formatNumber(stats.cliquesMaisDetalhes)}
          icon={<ShoppingBag size={22} />}
          accent="warning"
        />
        <StatCard
          label="Cliques em ofertas (total)"
          value={formatNumber(stats.totalCliques)}
          icon={<MousePointerClick size={22} />}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cidades */}
        <Card
          className="lg:col-span-1"
          title="De onde vêm"
          subtitle="Visitantes únicos por cidade"
        >
          {porCidade.length > 0 ? (
            <div className="space-y-3">
              {porCidade.map(([cidade, count]) => (
                <div key={cidade}>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 truncate font-medium text-ink-700">
                      <MapPin size={12} className="shrink-0 text-ink-400" /> {cidade}
                    </span>
                    <span className="shrink-0 font-semibold text-ink-500">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600"
                      style={{ width: `${Math.max((count / maxCidade) * 100, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ink-400">
              {loading ? 'Carregando...' : 'Nenhuma visita registrada ainda.'}
            </p>
          )}
        </Card>

        {/* Visitantes */}
        <Card
          className="lg:col-span-2"
          title="Visitantes"
          subtitle="Toque em um visitante para ver o que ele clicou"
        >
          {visitantes && visitantes.length > 0 ? (
            <div className="space-y-2">
              {visitantes.slice(0, 30).map((v) => (
                <button
                  key={v.visitor_id}
                  onClick={() => setSelected(v)}
                  className="flex w-full items-center gap-3 rounded-xl bg-ink-50 px-4 py-3 text-left transition-colors hover:bg-ink-100"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <Users size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">{cidadeLabel(v)}</p>
                    <p className="truncate text-xs text-ink-400">
                      Última visita {timeAgo(v.last_visit_at)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      v.visit_count > 1
                        ? 'bg-success-50 text-success-700'
                        : 'bg-ink-100 text-ink-500'
                    }`}
                  >
                    {v.visit_count > 1 ? `Voltou ${v.visit_count}x` : 'Novo'}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-ink-400">
              {loading ? 'Carregando...' : 'Nenhum visitante registrado ainda.'}
            </p>
          )}
        </Card>
      </div>

      {/* Cliques recentes */}
      <Card title="Cliques recentes em ofertas" subtitle="Últimos produtos que os visitantes abriram para comprar">
        {cliquesRecentes.length > 0 ? (
          <div className="space-y-2">
            {cliquesRecentes.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-xl bg-ink-50 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning-100 text-warning-600">
                  <MousePointerClick size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">
                    {e.link_titulo ?? 'Produto removido'}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {e.tipo === 'click_ver_oferta' ? 'Ver oferta' : 'Mais detalhes'} ·{' '}
                    {e.cidade ?? 'Cidade não identificada'} · {timeAgo(e.criado_em)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-ink-400">
            {loading ? 'Carregando...' : 'Nenhum clique registrado ainda.'}
          </p>
        )}
      </Card>

      {/* Detalhe do visitante */}
      {selected && (
        <VisitanteModal
          visitante={selected}
          eventos={eventosDoSelecionado}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function VisitanteModal({
  visitante,
  eventos,
  onClose,
}: {
  visitante: VitrineVisitante;
  eventos: import('@/lib/supabase').VitrineEvento[];
  onClose: () => void;
}) {
  const cliques = eventos.filter((e) => e.tipo === 'click_ver_oferta' || e.tipo === 'click_mais_detalhes');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-sm animate-scale-in p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-ink-900">
              <MapPin size={14} className="text-primary-500" /> {cidadeLabel(visitante)}
            </p>
            <p className="mt-0.5 text-xs text-ink-400">
              Primeira visita {formatDateTime(visitante.first_visit_at)} · Última{' '}
              {timeAgo(visitante.last_visit_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          <div className="mb-4 flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                visitante.visit_count > 1
                  ? 'bg-success-50 text-success-700'
                  : 'bg-ink-100 text-ink-500'
              }`}
            >
              {visitante.visit_count > 1
                ? `Voltou ${visitante.visit_count} vezes`
                : 'Visitante novo'}
            </span>
            <span className="rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700">
              {cliques.length} {cliques.length === 1 ? 'clique' : 'cliques'} em ofertas
            </span>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            Links que clicou
          </p>
          {cliques.length > 0 ? (
            <div className="space-y-2">
              {cliques.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                    <ShoppingBag size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {e.link_titulo ?? 'Produto removido'}
                    </p>
                    <p className="truncate text-xs text-ink-400">
                      {e.tipo === 'click_ver_oferta' ? 'Ver oferta' : 'Mais detalhes'} ·{' '}
                      {timeAgo(e.criado_em)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-ink-400">
              Ainda não clicou em nenhuma oferta.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
