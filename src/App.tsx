import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Lancamento, LancamentoForm, Banco, Fornecedor, Classificacao, UsuarioApp } from './lib/supabase';
import {
  X, Plus, BarChart2, ChevronDown, ChevronLeft, Pencil, Trash2,
  AlertTriangle, EyeOff, Eye, ChevronUp, SlidersHorizontal, Lock, Check,
} from 'lucide-react';
import LoginPage from './LoginPage';
import MenuPage, { MenuItem } from './MenuPage';
import CadastroBancos from './CadastroBancos';
import CadastroFornecedores from './CadastroFornecedores';
import CadastroClassificacoes from './CadastroClassificacoes';
import CadastroUsuarios from './CadastroUsuarios';
import ManutencaoPage from './ManutencaoPage';
import GerencialPage from './GerencialPage';
import ImportacaoPage from './ImportacaoPage';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBR(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseValor(v: string): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

function fromInputDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Alert ──────────────────────────────────────────────────────────────────

type AlertType = 'sucesso' | 'erro' | 'info';

function Alert({ msg, type, onClose }: { msg: string; type: AlertType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [msg, onClose]);

  const colors: Record<AlertType, string> = {
    sucesso: 'bg-green-600',
    erro: 'bg-red-500',
    info: 'bg-green-500',
  };

  return (
    <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-lg text-white font-medium shadow-xl text-sm ${colors[type]}`}>
      {msg}
    </div>
  );
}

// ─── Confirm Delete Modal ────────────────────────────────────────────────────

function ConfirmDeleteModal({
  open, lancamento, nomeFornecedor, nomeBanco, onConfirm, onCancel,
}: {
  open: boolean;
  lancamento: Lancamento | null;
  nomeFornecedor: string;
  nomeBanco: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || !lancamento) return null;
  const isDebito = lancamento.tipo === 'Debito';
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center gap-3 bg-red-600 px-5 py-4">
          <AlertTriangle size={22} className="text-white flex-shrink-0" />
          <span className="text-white font-bold text-sm">Confirmar Exclusão</span>
        </div>
        <div className="px-5 py-5 space-y-4">
          <p className="text-gray-700 text-sm">Tem certeza que deseja excluir este lançamento?</p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Fornecedor</span>
              <span className="font-semibold text-gray-800">{nomeFornecedor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Tipo</span>
              <span className={`font-semibold ${isDebito ? 'text-red-600' : 'text-green-600'}`}>
                {lancamento.tipo === 'Credito' ? 'Crédito' : 'Débito'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Valor</span>
              <span className={`font-bold text-sm ${isDebito ? 'text-red-600' : 'text-green-600'}`}>
                R$ {formatBR(Math.abs(lancamento.valor))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Data</span>
              <span className="font-semibold text-gray-800">{fromInputDate(lancamento.data_lancamento)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 font-medium">Banco</span>
              <span className="font-semibold text-gray-800">{nomeBanco}</span>
            </div>
          </div>
          <p className="text-xs text-red-500 font-medium">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 pt-1">
            <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
            <button onClick={onConfirm} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg transition-colors text-sm">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Multi-select combo ──────────────────────────────────────────────────────

function MultiCombo({
  items, selected, onChange, placeholder, disabled,
}: {
  items: { value: number; label: string }[];
  selected: number[];
  onChange: (v: number[]) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = items.filter((i) => i.label.toLowerCase().includes(search.toLowerCase()));
  const toggle = (val: number) => {
    if (disabled) return;
    if (selected.includes(val)) onChange(selected.filter((s) => s !== val));
    else onChange([...selected, val]);
  };
  const label = selected.length === 0 ? placeholder : `${selected.length} selecionado(s)`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full flex items-center justify-between border rounded-md px-2 text-xs transition-colors h-7 ${disabled ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed' : 'border-gray-300 bg-white text-gray-700 hover:border-green-400'}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown size={12} className={`ml-1 flex-shrink-0 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
      </button>
      {open && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-56 overflow-auto">
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="sticky top-0 w-full border-b border-gray-200 px-3 py-2 text-xs outline-none bg-white"
            onClick={(e) => e.stopPropagation()}
          />
          {filtered.map((item) => (
            <label key={item.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
              <input type="checkbox" checked={selected.includes(item.value)} onChange={() => toggle(item.value)} className="flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </label>
          ))}
          {filtered.length === 0 && <p className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</p>}
        </div>
      )}
    </div>
  );
}

// ─── Modal wrapper ───────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children, width = 700 }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; width?: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[999] p-2 pt-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ width: '100%', maxWidth: width }}>
        <div className="flex items-center justify-between px-4" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)', paddingTop: '7px', paddingBottom: '7px' }}>
          <span className="font-bold text-sm">{title}</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Lançamento Form ─────────────────────────────────────────────────────────

const emptyForm = (): LancamentoForm => ({
  data_lancamento: todayISO(),
  data_vencimento: todayISO(),
  tipo: 'Credito',
  codigo_banco: null,
  codigo_fornecedor: null,
  valor: 0,
});

function LancamentoModal({
  open, onClose, editData, bancos, fornecedores, onSaved, showAlert, onFornecedorAdded,
}: {
  open: boolean;
  onClose: () => void;
  editData: Lancamento | null;
  bancos: Banco[];
  fornecedores: Fornecedor[];
  onSaved: () => void;
  showAlert: (msg: string, type: AlertType) => void;
  onFornecedorAdded: () => void;
}) {
  const [form, setForm] = useState<LancamentoForm & { valorDisplay: string; fornInput: string }>(() => ({
    ...emptyForm(), valorDisplay: '', fornInput: '',
  }));
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Fornecedor[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [sugIndex, setSugIndex] = useState(-1);
  const [addingForn, setAddingForn] = useState(false);


  const fieldRefs = useRef<(HTMLElement | null)[]>([]);
  const focusField = (idx: number) => {
    const el = fieldRefs.current[idx];
    if (el) (el as HTMLInputElement | HTMLSelectElement | HTMLButtonElement).focus();
  };
  const handleEnter = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') { e.preventDefault(); focusField(idx + 1); }
  };

  useEffect(() => {
    if (!open) return;
    if (editData) {
      const absVal = Math.abs(editData.valor);
      const forn = fornecedores.find(f => f.codigo === editData.codigo_fornecedor);
      setForm({
        data_lancamento: editData.data_lancamento,
        data_vencimento: editData.data_vencimento,
        tipo: editData.tipo,
        codigo_banco: editData.codigo_banco,
        codigo_fornecedor: editData.codigo_fornecedor,
        valor: absVal,
        valorDisplay: formatBR(absVal),
        fornInput: forn ? forn.nome : (editData.codigo_fornecedor ? `#${editData.codigo_fornecedor}` : ''),
      });
    } else {
      setForm({ ...emptyForm(), valorDisplay: '', fornInput: '' });
    }
    setSuggestions([]); setShowSug(false);
  }, [open, editData, fornecedores]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleValorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) { setForm((f) => ({ ...f, valorDisplay: '', valor: 0 })); return; }
    const num = parseInt(digits, 10) / 100;
    setForm((f) => ({ ...f, valorDisplay: formatBR(num), valor: num }));
  };

  const handleFornInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, fornInput: val, codigo_fornecedor: null }));
    setSugIndex(-1);
    if (val.length > 0) {
      const filtered = fornecedores.filter((f) =>
        f.nome.toLowerCase().includes(val.toLowerCase()) ||
        String(f.codigo).startsWith(val)
      ).slice(0, 10);
      setSuggestions(filtered);
      setShowSug(filtered.length > 0);
    } else {
      setShowSug(false);
    }
  };

  const selectFornecedor = (f: Fornecedor) => {
    setForm((prev) => ({ ...prev, fornInput: f.nome, codigo_fornecedor: f.codigo }));
    setShowSug(false);
    setSugIndex(-1);
  };

  const handleFornKeyDown = (e: React.KeyboardEvent) => {
    if (showSug && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSugIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSugIndex(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' && sugIndex >= 0) {
        e.preventDefault();
        selectFornecedor(suggestions[sugIndex]);
        setTimeout(() => focusField(6), 50);
        return;
      }
    }
    handleEnter(e, 5);
  };

  const handleAddFornecedor = async () => {
    const nome = form.fornInput.trim();
    if (!nome) return;
    setAddingForn(true);
    const { data, error } = await supabase.from('fornecedores').insert({ nome }).select('codigo, id, nome').single();
    setAddingForn(false);
    if (error) { showAlert('Erro ao cadastrar: ' + error.message, 'erro'); return; }
    setForm((f) => ({ ...f, codigo_fornecedor: data.codigo }));
    showAlert('Fornecedor cadastrado!', 'sucesso');
    onFornecedorAdded();
    setShowSug(false);
  };

  const fornNotFound = form.fornInput.trim().length > 0 && form.codigo_fornecedor === null;

  const validate = (): string | null => {
    if (!form.data_lancamento) return 'Informe a data de lançamento';
    if (!form.data_vencimento) return 'Informe a data de vencimento';
    if (!form.tipo) return 'Selecione Crédito ou Débito';
    if (!form.codigo_banco) return 'Selecione o banco';
    if (!form.codigo_fornecedor) return 'Selecione um fornecedor válido';
    if (!form.valor || form.valor <= 0) return 'Informe um valor válido';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { showAlert(err, 'erro'); return; }
    setSaving(true);
    try {
      const payload: Omit<LancamentoForm, never> = {
        data_lancamento: form.data_lancamento,
        data_vencimento: form.data_vencimento,
        tipo: form.tipo,
        codigo_banco: form.codigo_banco,
        codigo_fornecedor: form.codigo_fornecedor,
        valor: form.tipo === 'Debito' ? -Math.abs(form.valor) : Math.abs(form.valor),
      };

      if (editData) {
        const { error } = await supabase.from('lancamentos').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editData.id);
        if (error) throw error;
        showAlert('Lançamento atualizado!', 'sucesso');
        onSaved();
        onClose();
      } else {
        const { error } = await supabase.from('lancamentos').insert(payload);
        if (error) throw error;
        showAlert('Lançamento salvo!', 'sucesso');
        onSaved();
        setForm((f) => ({
          ...f,
          codigo_fornecedor: null,
          valor: 0,
          valorDisplay: '',
          fornInput: '',
        }));
        setSuggestions([]); setShowSug(false);
        setTimeout(() => focusField(4), 50);
      }
    } catch (e: unknown) {
      showAlert('Erro ao salvar: ' + (e instanceof Error ? e.message : String(e)), 'erro');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-0.5';

  return (
    <>
    <Modal open={open} onClose={onClose} title={editData ? `Edição — #${String(editData.id).padStart(5, '0')}` : 'Novo Lançamento'} width={680}>
      <div className="space-y-3">
        {/* Row 1: datas + tipo + banco + valor */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div>
            <label className={labelCls}>Data Lançamento</label>
            <input ref={el => { fieldRefs.current[0] = el; }} type="date" value={form.data_lancamento} onChange={(e) => set('data_lancamento', e.target.value)} onKeyDown={(e) => handleEnter(e, 0)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Data Vencimento</label>
            <input ref={el => { fieldRefs.current[1] = el; }} type="date" value={form.data_vencimento} onChange={(e) => set('data_vencimento', e.target.value)} onKeyDown={(e) => handleEnter(e, 1)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select ref={el => { fieldRefs.current[2] = el; }} value={form.tipo} onChange={(e) => set('tipo', e.target.value as 'Credito' | 'Debito')} onKeyDown={(e) => handleEnter(e, 2)} className={inputCls}>
              <option value="">Selecione</option>
              <option value="Credito">Crédito</option>
              <option value="Debito">Débito</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Banco</label>
            <select
              ref={el => { fieldRefs.current[3] = el; }}
              value={form.codigo_banco ?? ''}
              onChange={(e) => set('codigo_banco', e.target.value ? Number(e.target.value) : null)}
              onKeyDown={(e) => handleEnter(e, 3)}
              className={inputCls}
            >
              <option value="">Selecione</option>
              {bancos.map((b) => (
                <option key={b.codigo} value={b.codigo}>{String(b.codigo).padStart(3, '0')} — {b.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Valor (R$)</label>
            <input ref={el => { fieldRefs.current[4] = el; }} type="text" value={form.valorDisplay} onChange={handleValorInput} onKeyDown={(e) => handleEnter(e, 4)} placeholder="0,00" className={`${inputCls} text-right font-semibold`} />
          </div>
        </div>

        {/* Fornecedor */}
        <div>
          <label className={labelCls}>Fornecedor</label>
          <div className="flex gap-1">
            <div className="flex-1">
              <input
                ref={el => { fieldRefs.current[5] = el; }}
                type="text"
                value={form.fornInput}
                onChange={handleFornInput}
                onBlur={() => setTimeout(() => setShowSug(false), 150)}
                onFocus={() => { if (form.fornInput && suggestions.length > 0) setShowSug(true); }}
                onKeyDown={handleFornKeyDown}
                placeholder="Digite para pesquisar..."
                className={inputCls}
                autoComplete="off"
              />
              {form.codigo_fornecedor && (
                <span className="ml-2 text-xs text-green-600 font-bold font-mono">
                  #{String(form.codigo_fornecedor).padStart(4, '0')}
                </span>
              )}
              {showSug && (
                <div className="bg-white border border-gray-200 rounded-md shadow-sm mt-1">
                  {suggestions.map((s, i) => (
                    <button key={s.codigo} type="button" onMouseDown={() => selectFornecedor(s)}
                      className={`w-full text-left px-3 py-2 text-sm border-b border-gray-50 last:border-0 flex items-center gap-2 transition-colors ${i === sugIndex ? 'bg-green-100' : 'hover:bg-green-50'}`}>
                      <span className="text-gray-400 text-xs font-mono w-10 flex-shrink-0">{String(s.codigo).padStart(4, '0')}</span>
                      <span className="flex-1">{s.nome}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {fornNotFound && (
              <button type="button" onClick={handleAddFornecedor} disabled={addingForn}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 rounded-md transition-colors" title="Cadastrar fornecedor">
                {addingForn ? '...' : <Plus size={14} />}
              </button>
            )}
          </div>
          {fornNotFound && (
            <p className="text-xs text-amber-600 mt-1">Fornecedor não encontrado. Clique em <strong>+</strong> para cadastrar.</p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button ref={el => { fieldRefs.current[6] = el; }} onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold px-8 py-2 rounded-lg transition-colors">
            {saving ? 'Salvando...' : editData ? 'Atualizar' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
    </>
  );
}

// ─── Conferência Modal ────────────────────────────────────────────────────────

function ConfereModal({ open, onClose, saldoAtual }: { open: boolean; onClose: () => void; saldoAtual: number }) {
  const [values, setValues] = useState<string[]>(Array(10).fill('0,00'));

  useEffect(() => { if (open) setValues(Array(10).fill('0,00')); }, [open]);

  const handleInput = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    const num = digits ? parseInt(digits, 10) / 100 : 0;
    const newVals = [...values];
    newVals[index] = digits ? formatBR(num) : '';
    setValues(newVals);
  };

  const soma = values.reduce((acc, v) => acc + parseValor(v), 0);
  const dif = soma - saldoAtual;

  return (
    <Modal open={open} onClose={onClose} title="Conferência de Caixa" width={400}>
      <div className="flex flex-col" style={{ gap: '5px' }}>
        <div className="flex justify-between items-center border-b border-gray-100" style={{ paddingBottom: '5px' }}>
          <span className="text-sm font-semibold text-gray-600">Saldo Inicial</span>
          <span className={`font-bold text-sm ${saldoAtual < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatBR(saldoAtual)}</span>
        </div>
        <div className="flex flex-col" style={{ gap: '2px' }} id="confere-inputs">
          {values.map((v, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-8 text-center text-xs font-bold text-gray-500 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <input
                type="text" value={v}
                onFocus={(e) => { if (e.target.value === '0,00') e.target.value = ''; }}
                onBlur={(e) => { if (!e.target.value) { const n = [...values]; n[i] = '0,00'; setValues(n); } }}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const inputs = document.querySelectorAll<HTMLInputElement>('#confere-inputs input');
                    inputs[i + 1]?.focus();
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 text-right text-sm font-semibold outline-none focus:border-green-400 focus:ring-1 focus:ring-green-100"
                style={{ height: '30px' }}
              />
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3 flex flex-col" style={{ gap: '2px' }}>
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-gray-600">Soma</span>
            <span className={soma < 0 ? 'text-red-500' : 'text-green-600'}>{formatBR(soma)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span className="text-gray-700">Diferença</span>
            <span className={dif !== 0 ? 'text-red-600' : 'text-green-600'}>{formatBR(dif)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Lancamentos Main Screen ─────────────────────────────────────────────────

type Filters = {
  dataLancInicio: string;
  dataLancFim: string;
  dataVencInicio: string;
  dataVencFim: string;
  tipo: string;
  codBancos: number[];
  codFornecedores: number[];
  codClassificacoes: number[];
};

function defaultFilters(): Filters {
  const today = new Date();
  return {
    dataLancInicio: addDays(today, -3),
    dataLancFim: addDays(today, 5),
    dataVencInicio: '',
    dataVencFim: '',
    tipo: '',
    codBancos: [],
    codFornecedores: [],
    codClassificacoes: [],
  };
}

type LancProps = { user: UsuarioApp; onBack: () => void };

export function LancamentosScreen({ user, onBack }: LancProps) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [loading, setLoading] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(0);
  const [hideTotals, setHideTotals] = useState(false);
  const [sortCol, setSortCol] = useState<keyof Lancamento | 'fornecedor' | 'classificacao' | 'banco' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [vincFornecedor, setVincFornecedor] = useState<number | null>(null);
  const loadRequestRef = useRef(0);

  // Carrega vínculo de fornecedor do usuário (Adm id=0 nunca tem vínculo)
  useEffect(() => {
    if (user.id === 0 || user.nome === 'Adm') { setVincFornecedor(null); return; }
    supabase
      .from('usuario_fornecedor')
      .select('codigo_fornecedor')
      .eq('usuario_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const cod = data ? (data as { codigo_fornecedor: number }).codigo_fornecedor : null;
        setVincFornecedor(cod);
        if (cod !== null) {
          setFilters(f => ({ ...f, codFornecedores: [cod] }));
          setSortCol('fornecedor');
          setSortDir('asc');
        }
      });
  }, [user]);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<Lancamento | null>(null);
  const [confereOpen, setConfereOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lancamento | null>(null);

  const [alert, setAlert] = useState<{ msg: string; type: AlertType } | null>(null);
  const showAlert = useCallback((msg: string, type: AlertType) => setAlert({ msg, type }), []);

  // lookup helpers
  const nomeForCodForn = useCallback((cod: number | null) => {
    if (!cod) return '—';
    const f = fornecedores.find(x => x.codigo === cod);
    return f ? f.nome : `#${cod}`;
  }, [fornecedores]);

  const nomeForCodBanco = useCallback((cod: number | null) => {
    if (!cod) return '—';
    const b = bancos.find(x => x.codigo === cod);
    return b ? b.nome : `#${cod}`;
  }, [bancos]);

  const nomeClassifForCodForn = useCallback((codForn: number | null) => {
    if (!codForn) return '';
    const f = fornecedores.find(x => x.codigo === codForn);
    if (!f?.codigo_classificacao) return '';
    const c = classificacoes.find(x => x.codigo === f.codigo_classificacao);
    return c ? c.nome : '';
  }, [fornecedores, classificacoes]);

  const loadCombos = useCallback(async () => {
    const [bRes, fRes, cRes] = await Promise.all([
      supabase.from('bancos').select('*').order('codigo'),
      supabase.from('fornecedores').select('*').order('codigo'),
      supabase.from('classificacoes').select('*').order('codigo'),
    ]);
    if (bRes.data) setBancos(bRes.data as Banco[]);
    if (fRes.data) setFornecedores(fRes.data as Fornecedor[]);
    if (cRes.data) setClassificacoes(cRes.data as Classificacao[]);
  }, []);

  useEffect(() => { loadCombos(); }, [loadCombos]);

  const loadLancamentos = useCallback(async () => {
    const requestId = ++loadRequestRef.current;
    setLoading(true);
    try {
      // Se usuário vinculado a fornecedor, força o filtro para esse fornecedor
      let fornCodFilter = vincFornecedor !== null ? [vincFornecedor] : filters.codFornecedores;
      if (vincFornecedor === null && filters.codClassificacoes.length > 0) {
        const fornByClassif = fornecedores
          .filter(f => f.codigo_classificacao && filters.codClassificacoes.includes(f.codigo_classificacao))
          .map(f => f.codigo);
        fornCodFilter = fornCodFilter.length > 0
          ? fornCodFilter.filter(c => fornByClassif.includes(c))
          : fornByClassif;
      }

      let query = supabase
        .from('lancamentos')
        .select('*')
        .order('data_lancamento', { ascending: true })
        .order('tipo', { ascending: true });

      // Se filtro de vencimento preenchido, usa apenas o período de vencimento (ignora lançamento)
      // Se nao, usa o período de lançamento
      const hasVencFilter = !!(filters.dataVencInicio || filters.dataVencFim);
      if (hasVencFilter) {
        if (filters.dataVencInicio) query = query.gte('data_vencimento', filters.dataVencInicio);
        if (filters.dataVencFim) query = query.lte('data_vencimento', filters.dataVencFim);
      } else {
        if (filters.dataLancInicio) query = query.gte('data_lancamento', filters.dataLancInicio);
        if (filters.dataLancFim) query = query.lte('data_lancamento', filters.dataLancFim);
      }
      if (filters.tipo) query = query.eq('tipo', filters.tipo);
      if (filters.codBancos.length > 0) query = query.in('codigo_banco', filters.codBancos);
      if (fornCodFilter.length > 0) query = query.in('codigo_fornecedor', fornCodFilter);

      const { data, error } = await query;
      if (error) throw error;
      if (requestId !== loadRequestRef.current) return;
      setLancamentos((data as Lancamento[]) || []);

      const applyClassif = (q: ReturnType<typeof supabase.from>) => {
        if (fornCodFilter.length > 0) q = q.in('codigo_fornecedor', fornCodFilter);
        return q;
      };

      // Saldo inicial: calcula APENAS a base relevante (lancamento OU vencimento), nunca ambas
      if (hasVencFilter) {
        // Filtro de vencimento ativo: saldo = soma de tudo com vencimento < dataVencInicio
        const vencCutoff = filters.dataVencInicio;
        if (vencCutoff) {
          let prevVencQuery = supabase.from('lancamentos').select('valor, tipo');
          prevVencQuery = prevVencQuery.lt('data_vencimento', vencCutoff);
          if (filters.tipo) prevVencQuery = prevVencQuery.eq('tipo', filters.tipo);
          if (filters.codBancos.length > 0) prevVencQuery = prevVencQuery.in('codigo_banco', filters.codBancos);
          prevVencQuery = applyClassif(prevVencQuery);
          const { data: prevVencData } = await prevVencQuery;
          if (requestId !== loadRequestRef.current) return;
          const saldoVenc = (prevVencData || []).reduce((acc: number, r: { valor: number; tipo: string }) => {
            const valor = Math.abs(Number(r.valor));
            return r.tipo === 'Credito' ? acc + valor : acc - valor;
          }, 0);
          setSaldoInicial(saldoVenc);
        } else {
          setSaldoInicial(0);
        }
      } else {
        // Sem filtro de vencimento: saldo = soma de tudo com data_lancamento < dataLancInicio
        let prevLancQuery = supabase.from('lancamentos').select('valor, tipo');
        if (filters.dataLancInicio) prevLancQuery = prevLancQuery.lt('data_lancamento', filters.dataLancInicio);
        else prevLancQuery = prevLancQuery.lt('data_lancamento', '1900-01-01');
        if (filters.tipo) prevLancQuery = prevLancQuery.eq('tipo', filters.tipo);
        if (filters.codBancos.length > 0) prevLancQuery = prevLancQuery.in('codigo_banco', filters.codBancos);
        prevLancQuery = applyClassif(prevLancQuery);
        const { data: prevLancData } = await prevLancQuery;
        if (requestId !== loadRequestRef.current) return;
        const saldoLanc = (prevLancData || []).reduce((acc: number, r: { valor: number; tipo: string }) => {
          const valor = Math.abs(Number(r.valor));
          return r.tipo === 'Credito' ? acc + valor : acc - valor;
        }, 0);
        setSaldoInicial(saldoLanc);
      }
    } catch (e) {
      if (requestId === loadRequestRef.current) {
        showAlert('Erro ao carregar dados', 'erro');
        console.error(e);
      }
    } finally {
      if (requestId === loadRequestRef.current) setLoading(false);
    }
  }, [filters, showAlert, fornecedores, vincFornecedor]);

  useEffect(() => { loadLancamentos(); }, [loadLancamentos]);

  const confirmarExclusao = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('lancamentos').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) { showAlert('Erro ao excluir: ' + error.message, 'erro'); }
    else { showAlert('Registro excluído!', 'sucesso'); loadLancamentos(); }
  };

  const setFilter = (key: keyof Filters, value: unknown) => setFilters((f) => ({ ...f, [key]: value }));

  const hasVencFilter = !!(filters.dataVencInicio || filters.dataVencFim);
  const dateField: 'data_lancamento' | 'data_vencimento' = hasVencFilter ? 'data_vencimento' : 'data_lancamento';

  const handleSortCol = (col: keyof Lancamento | 'fornecedor' | 'classificacao' | 'banco') => {
    if (vincFornecedor !== null) return; // ordenação travada por fornecedor
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = [...lancamentos].sort((a, b) => {
    if (sortCol) {
      let va: string, vb: string;
      if (sortCol === 'fornecedor') { va = nomeForCodForn(a.codigo_fornecedor).toLowerCase(); vb = nomeForCodForn(b.codigo_fornecedor).toLowerCase(); }
      else if (sortCol === 'classificacao') { va = nomeClassifForCodForn(a.codigo_fornecedor).toLowerCase(); vb = nomeClassifForCodForn(b.codigo_fornecedor).toLowerCase(); }
      else if (sortCol === 'banco') { va = nomeForCodBanco(a.codigo_banco).toLowerCase(); vb = nomeForCodBanco(b.codigo_banco).toLowerCase(); }
      else { va = String(a[sortCol] ?? '').toLowerCase(); vb = String(b[sortCol] ?? '').toLowerCase(); }
      const cmp = va.localeCompare(vb, 'pt-BR', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const da = new Date(a[dateField]);
    const db = new Date(b[dateField]);
    if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
    const order: Record<string, number> = { Credito: 1, Debito: 2 };
    return (order[a.tipo] || 9) - (order[b.tipo] || 9);
  });

  // ─── Build table rows ─────────────────────────────────────────────────────

  const getGroupKey = (l: Lancamento): string => {
    if (!sortCol) return l[dateField];
    if (sortCol === 'fornecedor') return nomeForCodForn(l.codigo_fornecedor) || '—';
    if (sortCol === 'classificacao') return nomeClassifForCodForn(l.codigo_fornecedor) || '—';
    if (sortCol === 'banco') return nomeForCodBanco(l.codigo_banco) || '—';
    return String(l[sortCol] ?? '');
  };

  type Row =
    | { kind: 'data'; lanc: Lancamento; saldo: number }
    | { kind: 'groupHeader'; groupKey: string }
    | { kind: 'subtotal'; groupKey: string; credito: number; debito: number };

  const rows: Row[] = [];
  let runSaldo = saldoInicial;
  let prevKey = '';
  let groupCred = 0;
  let groupDeb = 0;

  for (let i = 0; i < sorted.length; i++) {
    const lanc = sorted[i];
    const key = getGroupKey(lanc);
    if (prevKey && key !== prevKey) {
      rows.push({ kind: 'groupHeader', groupKey: prevKey });
      if (!hideTotals) {
        rows.push({ kind: 'subtotal', groupKey: prevKey, credito: groupCred, debito: groupDeb });
      }
      groupCred = 0; groupDeb = 0;
    }
    const valor = Math.abs(Number(lanc.valor));
    if (lanc.tipo === 'Credito') runSaldo += valor;
    else runSaldo -= valor;
    rows.push({ kind: 'data', lanc, saldo: runSaldo });
    if (lanc.tipo === 'Credito') groupCred += valor;
    else groupDeb += valor;
    prevKey = key;
    if (i === sorted.length - 1) {
      rows.push({ kind: 'groupHeader', groupKey: key });
      if (!hideTotals) {
        rows.push({ kind: 'subtotal', groupKey: key, credito: groupCred, debito: groupDeb });
      }
    }
  }

  let totalCred = 0;
  let totalDeb = 0;
  sorted.forEach((l) => { if (l.tipo === 'Credito') totalCred += Math.abs(Number(l.valor)); else totalDeb += Math.abs(Number(l.valor)); });
  const saldoPeriodo = totalCred - totalDeb;

  // IDs dos 3 últimos lançamentos do fornecedor vinculado (quando vinculado)
  const editableIds = new Set<number>();
  if (vincFornecedor !== null) {
    const fornLancs = lancamentos
      .filter(l => l.codigo_fornecedor === vincFornecedor)
      .sort((a, b) => b.id - a.id)
      .slice(0, 3);
    fornLancs.forEach(l => editableIds.add(l.id));
  }

  const thCls = 'bg-green-700 text-white text-center px-2 py-1.5 text-xs font-semibold whitespace-nowrap sticky top-0 z-10 select-none';

  const SortTh = ({ col, label, align = 'center' }: { col: keyof Lancamento | 'fornecedor' | 'classificacao' | 'banco'; label: string; align?: string }) => {
    const locked = vincFornecedor !== null && col === 'fornecedor';
    return (
      <th
        className={`${thCls} ${locked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-green-600'} transition-colors`}
        style={{ textAlign: align as React.CSSProperties['textAlign'] }}
        onClick={() => handleSortCol(col)}
      >
        <span className="inline-flex items-center gap-1 justify-center">
          {label}
          {locked ? <Lock size={10} className="text-yellow-200" /> :
            sortCol === col
              ? (sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />)
              : <span className="opacity-30"><ChevronUp size={11} /></span>}
        </span>
      </th>
    );
  };

  const tdCls = 'px-2 py-1 text-xs whitespace-nowrap border-b border-gray-100';

  const bancoItems = bancos.map(b => ({ value: b.codigo, label: `${String(b.codigo).padStart(3,'0')} — ${b.nome}` }));
  const fornItems = fornecedores.map(f => ({ value: f.codigo, label: `${String(f.codigo).padStart(4,'0')} — ${f.nome}` }));
  const classifItems = classificacoes.map(c => ({ value: c.codigo, label: `${String(c.codigo).padStart(3,'0')} — ${c.nome}` }));

  return (
    <div className="h-screen bg-gray-100 flex flex-col" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {alert && <Alert msg={alert.msg} type={alert.type} onClose={() => setAlert(null)} />}

      <div className="flex items-center justify-between px-4 py-1.5" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1 rounded-md transition-colors">
            <ChevronLeft size={16} /> Menu
          </button>
          <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        </div>
        <span className="text-white font-bold text-sm hidden sm:block">Lançamentos Financeiros</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
            title={sidebarOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">{sidebarOpen ? 'Filtros' : 'Filtros'}</span>
          </button>
          <button
            onClick={() => setHideTotals(v => !v)}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
          >
            {hideTotals ? <Eye size={14} /> : <EyeOff size={14} />}
            <span className="hidden sm:inline">{hideTotals ? 'Totais' : 'Totais'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            flex-shrink-0 bg-white border-r border-gray-200 flex flex-col p-3 overflow-y-auto transition-all duration-200
            fixed sm:relative inset-y-0 left-0 z-30 sm:z-auto
            ${sidebarOpen ? 'w-56 translate-x-0' : 'w-0 sm:w-0 -translate-x-full sm:-translate-x-0 overflow-hidden'}
          `}
          style={{ gap: '2px', top: 0 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Filtros</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="sm:hidden p-1 rounded hover:bg-gray-100 text-gray-500"
            >
              <X size={14} />
            </button>
          </div>

          <button onClick={() => { setEditData(null); setModalOpen(true); }} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg transition-colors text-sm mb-1">
            <Plus size={16} /> Novo
          </button>
          <button onClick={() => setConfereOpen(true)} className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2 rounded-lg transition-colors text-sm mb-1">
            <BarChart2 size={16} /> Conferência
          </button>

          <div className="pt-1 space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Data Lançamento</p>
            <input type="date" value={filters.dataLancInicio} onChange={(e) => setFilter('dataLancInicio', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 text-xs outline-none focus:border-green-400 h-7" />
            <input type="date" value={filters.dataLancFim} onChange={(e) => setFilter('dataLancFim', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 text-xs outline-none focus:border-green-400 h-7" />
          </div>

          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Data Vencimento</p>
            <input type="date" value={filters.dataVencInicio} onChange={(e) => setFilter('dataVencInicio', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 text-xs outline-none focus:border-green-400 h-7" />
            <input type="date" value={filters.dataVencFim} onChange={(e) => setFilter('dataVencFim', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 text-xs outline-none focus:border-green-400 h-7" />
          </div>

          <button onClick={() => setFilters(f => ({ ...defaultFilters(), codFornecedores: vincFornecedor !== null ? [vincFornecedor] : [] }))} className="w-full bg-red-500 hover:bg-red-600 text-white text-xs rounded-md transition-colors font-semibold h-7 mt-1">
            Limpar Filtros
          </button>

          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Tipo</p>
            <select value={filters.tipo} onChange={(e) => setFilter('tipo', e.target.value)} className="w-full border border-gray-300 rounded-md px-2 text-xs outline-none focus:border-green-400 h-7">
              <option value="">Todos</option>
              <option value="Credito">Crédito</option>
              <option value="Debito">Débito</option>
            </select>
          </div>

          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Banco</p>
            <MultiCombo items={bancoItems} selected={filters.codBancos} onChange={(v) => setFilter('codBancos', v)} placeholder="Todos" />
          </div>

          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
              Fornecedores
              {vincFornecedor !== null && <Lock size={10} className="text-gray-400" title="Filtro travado por vínculo de usuário" />}
            </p>
            <MultiCombo items={fornItems} selected={filters.codFornecedores} onChange={(v) => setFilter('codFornecedores', v)} placeholder="Todos" disabled={vincFornecedor !== null} />
          </div>

          <div className="space-y-0.5">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Classificação</p>
            <MultiCombo items={classifItems} selected={filters.codClassificacoes} onChange={(v) => setFilter('codClassificacoes', v)} placeholder="Todas" />
          </div>
        </aside>

        {/* Table */}
        <main className="flex-1 overflow-auto pt-0 px-3 pb-3 bg-gray-50">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <div className="text-green-700 text-sm font-medium animate-pulse">Carregando...</div>
            </div>
          )}
          {!loading && (
            <div className="bg-white shadow-sm rounded-b-lg">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                  <SortTh col="data_lancamento" label="Data" />
                  <SortTh col="data_vencimento" label="Vencimento" />
                  <SortTh col="tipo" label="Tipo" />
                  <SortTh col="fornecedor" label="Fornecedor" align="left" />
                  <SortTh col="classificacao" label="Classificação" align="left" />
                  <SortTh col="valor" label="Valor" align="right" />
                  <SortTh col="banco" label="Banco" align="left" />
                  <th className={thCls}>Saldo</th>
                  <th className={thCls}>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50">
                  <td colSpan={6} className={`${tdCls} font-bold text-green-700`}>Saldo Inicial</td>
                  <td className={`${tdCls} text-right font-bold ${saldoInicial < 0 ? 'text-red-600' : 'text-green-700'}`}>{formatBR(saldoInicial)}</td>
                  <td colSpan={2} />
                </tr>

                {sorted.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-400 text-sm">Nenhum lançamento no período</td></tr>
                )}

                {rows.map((row, idx) => {
                  if (row.kind === 'groupHeader') {
                    const label = sortCol === 'fornecedor' ? 'Fornecedor'
                                : sortCol === 'classificacao' ? 'Classificação'
                                : sortCol === 'banco' ? 'Banco'
                                : sortCol === 'data_lancamento' ? 'Lançamento'
                                : sortCol === 'data_vencimento' ? 'Vencimento'
                                : sortCol === 'tipo' ? 'Tipo'
                                : sortCol === 'valor' ? 'Valor'
                                : 'Data';
                    const isDateKey = sortCol === 'data_lancamento' || sortCol === 'data_vencimento' || !sortCol;
                    const displayKey = isDateKey && /^\d{4}-\d{2}-\d{2}/.test(row.groupKey) ? fromInputDate(row.groupKey) : row.groupKey;
                    return (
                      <tr key={`sg-${idx}`} className="bg-gray-100 font-bold text-gray-700">
                        <td colSpan={9} className={`${tdCls} text-left`}>
                          {label}: <span className="font-semibold">{displayKey}</span>
                        </td>
                      </tr>
                    );
                  }
                  if (row.kind === 'subtotal') {
                    if (row.credito === 0 && row.debito === 0) return null;
                    return (
                      <>
                        {row.credito !== 0 && (
                          <tr key={`sc-${idx}`} className="bg-green-50 font-semibold">
                            <td colSpan={3} />
                            <td className={`${tdCls} text-center text-green-700`}>Crédito</td>
                            <td />
                            <td className={`${tdCls} text-right text-green-700`}>{formatBR(row.credito)}</td>
                            <td colSpan={3} />
                          </tr>
                        )}
                        {row.debito !== 0 && (
                          <tr key={`sd-${idx}`} className="bg-red-50 font-semibold border-b-2 border-gray-300">
                            <td colSpan={3} />
                            <td className={`${tdCls} text-center text-red-600`}>Débito</td>
                            <td />
                            <td className={`${tdCls} text-right text-red-600`}>{formatBR(row.debito)}</td>
                            <td colSpan={3} />
                          </tr>
                        )}
                      </>
                    );
                  }

                  const { lanc, saldo } = row;
                  const neg = lanc.valor < 0;
                  const v = Math.abs(lanc.valor);
                  const nomeForn = nomeForCodForn(lanc.codigo_fornecedor);
                  const nomeBanco = nomeForCodBanco(lanc.codigo_banco);
                  const classifForn = nomeClassifForCodForn(lanc.codigo_fornecedor);
                  const canEdit = vincFornecedor === null || editableIds.has(lanc.id);

                  return (
                    <tr key={lanc.id} className={`hover:bg-green-50 transition-colors ${neg ? 'text-red-600' : ''}`}>
                      <td className={tdCls}>{fromInputDate(lanc.data_lancamento)}</td>
                      <td className={tdCls}>{fromInputDate(lanc.data_vencimento)}</td>
                      <td className={`${tdCls} text-center`}>{lanc.tipo === 'Credito' ? 'Créd.' : 'Déb.'}</td>
                      <td className={tdCls}>
                        <span className="font-medium">{nomeForn}</span>
                        {lanc.codigo_fornecedor && (
                          <span className="ml-1 text-gray-400 font-mono text-[10px]">#{String(lanc.codigo_fornecedor).padStart(4,'0')}</span>
                        )}
                      </td>
                      <td className={`${tdCls} text-gray-500 italic`}>{classifForn}</td>
                      <td className={`${tdCls} text-right font-semibold`}>{formatBR(v)}</td>
                      <td className={tdCls}>{nomeBanco}</td>
                      <td className={`${tdCls} text-right font-bold ${saldo < 0 ? 'text-red-600' : 'text-gray-800'}`}>{formatBR(saldo)}</td>
                      <td className={`${tdCls} text-center`}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => canEdit && (setEditData(lanc), setModalOpen(true))}
                            disabled={!canEdit}
                            className={`p-1 rounded transition-colors ${canEdit ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            title={canEdit ? 'Editar' : 'Bloqueado: somente os 3 últimos lançamentos'}
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => canEdit && setDeleteTarget(lanc)}
                            disabled={!canEdit}
                            className={`p-1 rounded transition-colors ${canEdit ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                            title={canEdit ? 'Excluir' : 'Bloqueado: somente os 3 últimos lançamentos'}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </main>
      </div>

      {/* Footer totals bar */}
      <div className="flex items-center justify-between gap-4 px-4 py-1.5 pr-[5cm] border-t border-gray-300 bg-white shadow-md">
        {/* Quick actions shown when sidebar is hidden */}
        <div className={`flex items-center gap-2 transition-all ${sidebarOpen ? 'opacity-0 pointer-events-none w-0 overflow-hidden' : 'opacity-100'}`}>
          <button
            onClick={() => { setEditData(null); setModalOpen(true); }}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={13} /> Novo
          </button>
          <button
            onClick={() => setConfereOpen(true)}
            className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 py-1.5 rounded-md transition-colors"
          >
            <BarChart2 size={13} /> Conferência
          </button>
        </div>
        <div className="flex items-center gap-6 ml-auto">
          {totalCred !== 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Crédito:</span>
              <span className="text-xs font-bold text-green-700">{formatBR(totalCred)}</span>
            </div>
          )}
          {totalDeb !== 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Débito:</span>
              <span className="text-xs font-bold text-red-600">{formatBR(totalDeb)}</span>
            </div>
          )}
          {saldoPeriodo !== 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Saldo:</span>
              <span className={`text-xs font-bold ${saldoPeriodo < 0 ? 'text-red-700' : 'text-green-700'}`}>{formatBR(saldoPeriodo)}</span>
            </div>
          )}
        </div>
      </div>

      <LancamentoModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        editData={editData}
        bancos={bancos}
        fornecedores={fornecedores}
        onSaved={loadLancamentos}
        showAlert={showAlert}
        onFornecedorAdded={loadCombos}
      />

      <ConfereModal
        open={confereOpen}
        onClose={() => setConfereOpen(false)}
        saldoAtual={saldoInicial}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        lancamento={deleteTarget}
        nomeFornecedor={deleteTarget ? nomeForCodForn(deleteTarget.codigo_fornecedor) : ''}
        nomeBanco={deleteTarget ? nomeForCodBanco(deleteTarget.codigo_banco) : ''}
        onConfirm={confirmarExclusao}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────

type Page = 'login' | 'menu' | MenuItem;

export default function App() {
  const [page, setPage] = useState<Page>('login');
  const [user, setUser] = useState<UsuarioApp | null>(null);

  const handleLogin = (u: UsuarioApp) => { setUser(u); setPage('menu'); };
  const handleLogout = () => { setUser(null); setPage('login'); };
  const handleNavigate = (p: MenuItem) => setPage(p);
  const handleBack = () => setPage('menu');

  if (page === 'login') return <LoginPage onLogin={handleLogin} />;
  if (!user) return <LoginPage onLogin={handleLogin} />;
  if (page === 'menu') return <MenuPage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
  if (page === 'bancos') return <CadastroBancos onBack={handleBack} />;
  if (page === 'fornecedores') return <CadastroFornecedores onBack={handleBack} />;
  if (page === 'classificacoes') return <CadastroClassificacoes onBack={handleBack} />;
  if (page === 'usuarios') return <CadastroUsuarios onBack={handleBack} currentUser={user} />;
  if (page === 'lancamentos') return <LancamentosScreen user={user} onBack={handleBack} />;
  if (page === 'manutencao') return <ManutencaoPage onBack={handleBack} userName={user.nome} />;
  if (page === 'gerencial') return <GerencialPage onBack={handleBack} />;
  if (page === 'importacao') return <ImportacaoPage onBack={handleBack} userName={user.nome} />;
  return null;
}
