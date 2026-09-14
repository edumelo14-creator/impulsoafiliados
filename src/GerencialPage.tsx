import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase, Banco, Fornecedor, Classificacao } from './lib/supabase';
import { ChevronLeft, RefreshCw, ShoppingCart, TrendingUp, ChevronDown, X, Scale, Hash, ArrowUpRight, ArrowDownRight, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, Cell, LabelList,
} from 'recharts';

type Props = { onBack: () => void };

type LancRow = {
  id: number;
  data_lancamento: string;
  tipo: 'Credito' | 'Debito';
  codigo_banco: number | null;
  codigo_fornecedor: number | null;
  valor: number;
};

type CardKey = 'debito' | 'credito' | 'saldo' | 'total';

const CHART_COLORS = [
  '#10b981', '#0891b2', '#f59e0b', '#ef4444',
  '#3b82f6', '#84cc16', '#f97316', '#14b8a6',
  '#e11d48', '#0284c7',
];

const TOP_N = 8;

function todayISO() { return new Date().toISOString().split('T')[0]; }
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function formatMonthLabel(yyyymm: string) {
  const [y, m] = yyyymm.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(m) - 1]}/${y.slice(2)}`;
}
function formatDateLabel(iso: string) {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}
function formatBR(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fromISO(iso: string) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ─── MultiSelect ─────────────────────────────────────────────────────────────

function MultiSelect({
  label, options, selected, onChange, disabled = false,
}: {
  label: string;
  options: { value: number; label: string }[];
  selected: number[];
  onChange: (v: number[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const todosRef = useRef<HTMLInputElement>(null);

  const allSelected = options.length > 0 && selected.length === options.length;
  const someSelected = selected.length > 0 && selected.length < options.length;

  useEffect(() => {
    if (todosRef.current) todosRef.current.indeterminate = someSelected;
  }, [someSelected]);

  const toggle = (v: number) => {
    if (selected.includes(v)) onChange(selected.filter(x => x !== v));
    else onChange([...selected, v]);
  };

  const toggleAll = () => {
    if (allSelected) onChange([]);
    else onChange(options.map(o => o.value));
  };

  const displayLabel = selected.length === 0 || allSelected
    ? 'Todos'
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? '1 selecionado'
      : `${selected.length} selecionados`;

  return (
    <div className="relative">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">{label}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="w-full border border-gray-300 rounded-md px-2 text-xs h-7 bg-white flex items-center justify-between gap-1 outline-none focus:border-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate text-left">{displayLabel}</span>
        <ChevronDown size={12} className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 min-w-full w-max max-w-xs bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-52 overflow-y-auto">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">Nenhuma opção</p>
            ) : (
              <>
                <label className="flex items-center gap-2 px-3 py-1.5 hover:bg-green-50 cursor-pointer border-b border-gray-100">
                  <input
                    ref={todosRef}
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="accent-green-600"
                  />
                  <span className="text-xs font-semibold text-gray-700">Todos</span>
                </label>
                {options.map(o => (
                  <label key={o.value} className="flex items-center gap-2 px-3 py-1.5 hover:bg-green-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.value)}
                      onChange={() => toggle(o.value)}
                      className="accent-green-600"
                    />
                    <span className="text-xs text-gray-700 truncate">{o.label}</span>
                  </label>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-3 text-xs min-w-[160px]">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-gray-600 truncate max-w-[100px]">{p.name}</span>
          </span>
          <span className="font-semibold text-gray-800">R$ {formatBR(p.value)}</span>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="border-t border-gray-100 mt-1.5 pt-1.5 flex justify-between">
          <span className="font-bold text-gray-600">Total</span>
          <span className="font-bold text-gray-800">R$ {formatBR(total)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({
  cardKey,
  lancamentos,
  fornecedores,
  bancos,
  onClose,
}: {
  cardKey: CardKey | null;
  lancamentos: LancRow[];
  fornecedores: Fornecedor[];
  bancos: Banco[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');

  useEffect(() => { setSearch(''); }, [cardKey]);

  const nomeForCod = (cod: number | null) => {
    if (!cod) return '—';
    return fornecedores.find(f => f.codigo === cod)?.nome ?? `#${cod}`;
  };
  const bancoPorCod = (cod: number | null) => {
    if (!cod) return '—';
    return bancos.find(b => b.codigo === cod)?.nome ?? `#${cod}`;
  };

  const filtered = useMemo(() => {
    let rows = lancamentos;
    if (cardKey === 'debito') rows = lancamentos.filter(l => l.tipo === 'Debito');
    else if (cardKey === 'credito') rows = lancamentos.filter(l => l.tipo === 'Credito');
    // 'saldo' and 'total' show all records

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(l =>
        nomeForCod(l.codigo_fornecedor).toLowerCase().includes(q) ||
        bancoPorCod(l.codigo_banco).toLowerCase().includes(q) ||
        fromISO(l.data_lancamento).includes(q) ||
        formatBR(Math.abs(l.valor)).includes(q)
      );
    }
    return rows;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey, lancamentos, search, fornecedores, bancos]);

  const totalCredito = filtered.filter(l => l.tipo === 'Credito').reduce((s, l) => s + Math.abs(l.valor), 0);
  const totalDebito = filtered.filter(l => l.tipo === 'Debito').reduce((s, l) => s + Math.abs(l.valor), 0);

  const titles: Record<CardKey, string> = {
    debito: 'Detalhamento — Compras (Débito)',
    credito: 'Detalhamento — Vendas (Crédito)',
    saldo: 'Detalhamento — Saldo do Período',
    total: 'Detalhamento — Todos os Registros',
  };

  if (!cardKey) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-4xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
          <div>
            <p className="text-white font-bold text-sm">{titles[cardKey]}</p>
            <p className="text-white/60 text-xs mt-0.5">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Summary strip */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-200 flex-shrink-0 flex-wrap">
          {(cardKey === 'credito' || cardKey === 'saldo' || cardKey === 'total') && totalCredito > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowUpRight size={14} className="text-green-600" />
              <span className="text-xs text-gray-500 font-medium">Crédito:</span>
              <span className="text-xs font-bold text-green-700">R$ {formatBR(totalCredito)}</span>
            </div>
          )}
          {(cardKey === 'debito' || cardKey === 'saldo' || cardKey === 'total') && totalDebito > 0 && (
            <div className="flex items-center gap-1.5">
              <ArrowDownRight size={14} className="text-red-500" />
              <span className="text-xs text-gray-500 font-medium">Débito:</span>
              <span className="text-xs font-bold text-red-600">R$ {formatBR(totalDebito)}</span>
            </div>
          )}
          {(cardKey === 'saldo' || cardKey === 'total') && (
            <div className="flex items-center gap-1.5 ml-auto">
              <Scale size={13} className="text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Saldo:</span>
              <span className={`text-xs font-bold ${totalCredito - totalDebito >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                R$ {formatBR(totalCredito - totalDebito)}
              </span>
            </div>
          )}
          <div className="ml-auto sm:ml-0">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="border border-gray-300 rounded-md px-2.5 py-1 text-xs outline-none focus:border-green-400 w-44"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
              <Hash size={28} className="opacity-30" />
              <p className="text-sm">Nenhum registro encontrado</p>
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 sticky top-0 z-10">
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">#</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Data</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 border-b border-gray-200">Fornecedor</th>
                  <th className="px-4 py-2.5 text-left font-semibold text-gray-600 border-b border-gray-200">Banco</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-gray-600 whitespace-nowrap border-b border-gray-200">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, idx) => {
                  const isCredito = l.tipo === 'Credito';
                  return (
                    <tr key={l.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-4 py-2 text-gray-400 font-mono">{String(l.id).padStart(5, '0')}</td>
                      <td className="px-4 py-2 text-gray-700 whitespace-nowrap">{fromISO(l.data_lancamento)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isCredito ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {isCredito ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                          {isCredito ? 'Créd.' : 'Déb.'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-800 font-medium max-w-[180px] truncate">
                        {nomeForCod(l.codigo_fornecedor)}
                        {l.codigo_fornecedor && (
                          <span className="ml-1 text-gray-400 font-mono text-[10px]">#{String(l.codigo_fornecedor).padStart(4, '0')}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-gray-600 max-w-[140px] truncate">{bancoPorCod(l.codigo_banco)}</td>
                      <td className={`px-4 py-2 text-right font-bold whitespace-nowrap ${isCredito ? 'text-green-700' : 'text-red-600'}`}>
                        {isCredito ? '+' : '-'} R$ {formatBR(Math.abs(l.valor))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-gray-400">{filtered.length} de {lancamentos.length} registros exibidos</span>
          <button onClick={onClose} className="text-xs font-semibold text-gray-500 hover:text-gray-700 transition-colors px-3 py-1.5 rounded-md hover:bg-gray-200">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GerencialPage({ onBack }: Props) {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [lancamentos, setLancamentos] = useState<LancRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCard, setActiveCard] = useState<CardKey | null>(null);

  const [codFornecedores, setCodFornecedores] = useState<number[]>([]);
  const [codClassificacoes, setCodClassificacoes] = useState<number[]>([]);
  const [codBancos, setCodBancos] = useState<number[]>([]);
  const [dataInicio, setDataInicio] = useState(firstOfMonth());
  const [dataFim, setDataFim] = useState(todayISO());
  const [tipo, setTipo] = useState('');

  const loadMaster = useCallback(async () => {
    const [bRes, fRes, cRes] = await Promise.all([
      supabase.from('bancos').select('*').order('nome'),
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('classificacoes').select('*').order('nome'),
    ]);
    setBancos((bRes.data as Banco[]) || []);
    setFornecedores((fRes.data as Fornecedor[]) || []);
    setClassificacoes((cRes.data as Classificacao[]) || []);
  }, []);

  const loadLancamentos = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('lancamentos')
      .select('id,data_lancamento,tipo,codigo_banco,codigo_fornecedor,valor')
      .gte('data_lancamento', dataInicio)
      .lte('data_lancamento', dataFim)
      .order('data_lancamento');

    if (tipo) q = q.eq('tipo', tipo);
    if (codBancos.length) q = q.in('codigo_banco', codBancos);

    let fornCods = codFornecedores.length ? codFornecedores : null;
    if (codClassificacoes.length) {
      const byClassif = fornecedores
        .filter(f => f.codigo_classificacao != null && codClassificacoes.includes(f.codigo_classificacao!))
        .map(f => f.codigo);
      fornCods = fornCods ? fornCods.filter(c => byClassif.includes(c)) : byClassif;
    }
    if (fornCods && fornCods.length) q = q.in('codigo_fornecedor', fornCods);

    const { data } = await q;
    setLancamentos((data as LancRow[]) || []);
    setLoading(false);
  }, [dataInicio, dataFim, tipo, codBancos, codFornecedores, codClassificacoes, fornecedores]);

  useEffect(() => { loadMaster(); }, [loadMaster]);
  useEffect(() => {
    if (fornecedores.length >= 0) loadLancamentos();
  }, [loadLancamentos, fornecedores]);

  const nomeForCod = useCallback((cod: number | null) => {
    if (!cod) return 'Sem Fornecedor';
    return fornecedores.find(f => f.codigo === cod)?.nome ?? `#${cod}`;
  }, [fornecedores]);

  // ─── Chart 1: Compras por Fornecedor (horizontal bars) ──────────────────n
  const chart1Data = useMemo(() => {
    const debitos = lancamentos.filter(l => l.tipo === 'Debito');
    const totals: Record<string, number> = {};
    for (const l of debitos) {
      const nome = nomeForCod(l.codigo_fornecedor);
      totals[nome] = (totals[nome] || 0) + Math.abs(l.valor);
    }
    return Object.entries(totals)
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 15);
  }, [lancamentos, nomeForCod]);

  // ─── Transferencia exclusion ────────────────────────────────────────────n
  const codTransferencia = useMemo(() => {
    return classificacoes
      .filter(c => c.nome.toLowerCase() === 'transferencia')
      .map(c => c.codigo);
  }, [classificacoes]);

  const fornTransfCods = useMemo(() => {
    return fornecedores
      .filter(f => f.codigo_classificacao != null && codTransferencia.includes(f.codigo_classificacao!))
      .map(f => f.codigo);
  }, [fornecedores, codTransferencia]);

  // ─── Chart: Recebimentos (Crédito) mês a mês com % ────────────────────────n
  const recebimentosData = useMemo(() => {
    const creditos = lancamentos.filter(l =>
      l.tipo === 'Credito' && !fornTransfCods.includes(l.codigo_fornecedor ?? -1)
    );
    const byMonth: Record<string, number> = {};
    for (const l of creditos) {
      const mk = l.data_lancamento.slice(0, 7);
      byMonth[mk] = (byMonth[mk] || 0) + Math.abs(l.valor);
    }
    const total = Object.values(byMonth).reduce((s, v) => s + v, 0);
    return Object.keys(byMonth).sort().map(mk => ({
      month: formatMonthLabel(mk),
      valor: byMonth[mk],
      pct: total > 0 ? (byMonth[mk] / total) * 100 : 0,
    }));
  }, [lancamentos, fornTransfCods]);

  // ─── Chart: Pagamentos (Débito) mês a mês com % ───────────────────────────n
  const pagamentosData = useMemo(() => {
    const debitos = lancamentos.filter(l =>
      l.tipo === 'Debito' && !fornTransfCods.includes(l.codigo_fornecedor ?? -1)
    );
    const byMonth: Record<string, number> = {};
    for (const l of debitos) {
      const mk = l.data_lancamento.slice(0, 7);
      byMonth[mk] = (byMonth[mk] || 0) + Math.abs(l.valor);
    }
    const total = Object.values(byMonth).reduce((s, v) => s + v, 0);
    return Object.keys(byMonth).sort().map(mk => ({
      month: formatMonthLabel(mk),
      valor: byMonth[mk],
      pct: total > 0 ? (byMonth[mk] / total) * 100 : 0,
    }));
  }, [lancamentos, fornTransfCods]);

  // ─── Chart 2: Movimento Vendas Diário ─────────────────────────────────────

  const { chart2Data, chart2Keys } = useMemo(() => {
    const creditos = lancamentos.filter(l => l.tipo === 'Credito');

    const totals: Record<string, number> = {};
    for (const l of creditos) {
      const nome = nomeForCod(l.codigo_fornecedor);
      totals[nome] = (totals[nome] || 0) + Math.abs(l.valor);
    }
    const topForn = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([n]) => n);

    const byDate: Record<string, Record<string, number>> = {};
    for (const l of creditos) {
      const dk = l.data_lancamento;
      if (!byDate[dk]) byDate[dk] = {};
      const nome = nomeForCod(l.codigo_fornecedor);
      const key = topForn.includes(nome) ? nome : 'Outros';
      byDate[dk][key] = (byDate[dk][key] || 0) + Math.abs(l.valor);
    }

    const allKeys = new Set<string>();
    Object.values(byDate).forEach(d => Object.keys(d).forEach(k => allKeys.add(k)));
    const keys = [...topForn.filter(k => allKeys.has(k)), ...(allKeys.has('Outros') ? ['Outros'] : [])];

    const data = Object.keys(byDate).sort().map(dk => ({
      date: formatDateLabel(dk),
      ...byDate[dk],
    }));

    return { chart2Data: data, chart2Keys: keys };
  }, [lancamentos, nomeForCod]);

  // ─── Summary cards ─────────────────────────────────────────────────────────

  const totalDebito = useMemo(() =>
    lancamentos.filter(l => l.tipo === 'Debito').reduce((s, l) => s + Math.abs(l.valor), 0),
    [lancamentos]);
  const totalCredito = useMemo(() =>
    lancamentos.filter(l => l.tipo === 'Credito').reduce((s, l) => s + Math.abs(l.valor), 0),
    [lancamentos]);

  const countDebito = lancamentos.filter(l => l.tipo === 'Debito').length;
  const countCredito = lancamentos.filter(l => l.tipo === 'Credito').length;
  const fornCount = new Set(lancamentos.map(l => l.codigo_fornecedor).filter(Boolean)).size;

  // ─── Options ───────────────────────────────────────────────────────────────

  const fornOptions = fornecedores.map(f => ({
    value: f.codigo,
    label: `${String(f.codigo).padStart(4, '0')} — ${f.nome}`,
  }));
  const classifOptions = classificacoes.map(c => ({
    value: c.codigo,
    label: c.nome,
  }));
  const bancoOptions = bancos.map(b => ({
    value: b.codigo,
    label: b.nome,
  }));

  const handleClear = () => {
    setCodFornecedores([]);
    setCodClassificacoes([]);
    setCodBancos([]);
    setDataInicio(firstOfMonth());
    setDataFim(todayISO());
    setTipo('');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div className="flex-shrink-0 flex items-center px-4 py-2 gap-3" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
          <ChevronLeft size={16} /> Menu
        </button>
        <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        <span className="text-white font-bold text-sm">Gerencial</span>
        {loading && <RefreshCw size={14} className="text-white/60 animate-spin ml-auto" />}
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
          <MultiSelect label="Fornecedor" options={fornOptions} selected={codFornecedores} onChange={setCodFornecedores} />
          <MultiSelect label="Classificação" options={classifOptions} selected={codClassificacoes} onChange={setCodClassificacoes} />
          <MultiSelect label="Banco" options={bancoOptions} selected={codBancos} onChange={setCodBancos} />

          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Tipo</p>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 text-xs h-7 outline-none focus:border-green-400"
            >
              <option value="">Todos</option>
              <option value="Credito">Crédito</option>
              <option value="Debito">Débito</option>
            </select>
          </div>

          <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-0.5">Período</p>
            <div className="flex gap-1">
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-1 text-xs h-7 outline-none focus:border-green-400 min-w-0"
              />
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-1 text-xs h-7 outline-none focus:border-green-400 min-w-0"
              />
            </div>
          </div>

          <button
            onClick={handleClear}
            className="h-7 px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-md transition-colors border border-gray-300"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 space-y-4">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              title="Total Compras (Déb.)"
              value={`R$ ${formatBR(totalDebito)}`}
              sub={`${countDebito} lançamento${countDebito !== 1 ? 's' : ''}`}
              color="red"
              icon={<ShoppingCart size={18} />}
              onClick={() => setActiveCard('debito')}
            />
            <SummaryCard
              title="Total Vendas (Créd.)"
              value={`R$ ${formatBR(totalCredito)}`}
              sub={`${countCredito} lançamento${countCredito !== 1 ? 's' : ''}`}
              color="green"
              icon={<TrendingUp size={18} />}
              onClick={() => setActiveCard('credito')}
            />
            <SummaryCard
              title="Saldo do Período"
              value={`R$ ${formatBR(totalCredito - totalDebito)}`}
              sub="Crédito − Débito"
              color={totalCredito >= totalDebito ? 'green' : 'red'}
              icon={<Scale size={18} />}
              onClick={() => setActiveCard('saldo')}
            />
            <SummaryCard
              title="Total de Registros"
              value={lancamentos.length.toString()}
              sub={`${fornCount} fornecedor${fornCount !== 1 ? 'es' : ''}`}
              color="blue"
              icon={<Hash size={18} />}
              onClick={() => setActiveCard('total')}
            />
          </div>

          {/* Chart: Recebimentos & Pagamentos Mensais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recebimentos */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ArrowRightCircle size={16} className="text-green-600" />
                  Recebimentos por Mês (Crédito)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Percentual de cada mês sobre o total do período (exclui Transferência)</p>
              </div>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400 animate-pulse">Carregando...</div>
              ) : recebimentosData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">Nenhum recebimento no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(250, recebimentosData.length * 44)}>
                  <BarChart data={recebimentosData} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="month" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Recebimentos" radius={[0, 6, 6, 0]}>
                      {recebimentosData.map((_, i) => (
                        <Cell key={i} fill="#10b981" />
                      ))}
                      <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Pagamentos */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <ArrowLeftCircle size={16} className="text-red-500" />
                  Pagamentos por Mês (Débito)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Percentual de cada mês sobre o total do período (exclui Transferência)</p>
              </div>
              {loading ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400 animate-pulse">Carregando...</div>
              ) : pagamentosData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-sm text-gray-400">Nenhum pagamento no período</div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(250, pagamentosData.length * 44)}>
                  <BarChart data={pagamentosData} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="month" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Pagamentos" radius={[0, 6, 6, 0]}>
                      {pagamentosData.map((_, i) => (
                        <Cell key={i} fill="#ef4444" />
                      ))}
                      <LabelList dataKey="pct" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fontSize: 11, fontWeight: 600, fill: '#374151' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 1: Compras por Fornecedor (horizontal bars) */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <ShoppingCart size={16} className="text-red-500" />
                Compras por Fornecedor (Débito)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Total de débito por fornecedor no período</p>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400 animate-pulse">Carregando...</div>
            ) : chart1Data.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">Nenhum dado de débito no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(300, chart1Data.length * 36)}>
                <BarChart data={chart1Data} layout="vertical" margin={{ top: 4, right: 60, left: 8, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nome" tick={{ fontSize: 10 }} width={140} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" name="Débito" radius={[0, 6, 6, 0]}>
                    {chart1Data.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart 2: Movimento Vendas Diário */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-600" />
                Movimento de Vendas Diário (Crédito)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">Valores de crédito por fornecedor agrupados por dia</p>
            </div>
            {loading ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400 animate-pulse">Carregando...</div>
            ) : chart2Data.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-gray-400">Nenhum dado de crédito no período</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chart2Data} margin={{ top: 4, right: 20, left: 10, bottom: 4 }}>
                  <defs>
                    {chart2Keys.map((key, i) => (
                      <linearGradient key={key} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.05} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={55} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  {chart2Keys.map((key, i) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="b"
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={`url(#grad-${i})`}
                      strokeWidth={2}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        cardKey={activeCard}
        lancamentos={lancamentos}
        fornecedores={fornecedores}
        bancos={bancos}
        onClose={() => setActiveCard(null)}
      />
    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  title, value, sub, color, icon, onClick,
}: {
  title: string; value: string; sub: string;
  color: 'green' | 'red' | 'blue';
  icon: React.ReactNode;
  onClick: () => void;
}) {
  const colors = {
    green: 'bg-green-50 border-green-100 text-green-700 hover:bg-green-100 hover:border-green-200',
    red: 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100 hover:border-red-200',
    blue: 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100 hover:border-blue-200',
  };
  const iconColors = {
    green: 'text-green-600',
    red: 'text-red-500',
    blue: 'text-blue-500',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-all duration-150 cursor-pointer group active:scale-95 ${colors[color]}`}
    >
      <div className={`mb-1.5 flex items-center justify-between ${iconColors[color]}`}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-60 transition-opacity">Ver detalhes</span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{title}</p>
      <p className="text-base font-bold mt-0.5 leading-tight">{value}</p>
      <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>
    </button>
  );
}
