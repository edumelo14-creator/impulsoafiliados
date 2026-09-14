import { useState, useEffect, useCallback } from 'react';
import { supabase, Fornecedor, Classificacao } from './lib/supabase';
import { Plus, Pencil, Trash2, ChevronLeft, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

type Props = { onBack: () => void };

export default function CadastroFornecedores({ onBack }: Props) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [classificacoes, setClassificacoes] = useState<Classificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editCodClassif, setEditCodClassif] = useState<number | null>(null);
  const [newNome, setNewNome] = useState('');
  const [newCodClassif, setNewCodClassif] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'codigo' | 'nome' | 'classificacao'>('codigo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const load = useCallback(async () => {
    setLoading(true);
    const [fRes, cRes] = await Promise.all([
      supabase.from('fornecedores').select('*').order('codigo'),
      supabase.from('classificacoes').select('*').order('codigo'),
    ]);
    setFornecedores((fRes.data as Fornecedor[]) || []);
    setClassificacoes((cRes.data as Classificacao[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setErro(msg); setTimeout(() => setErro(''), 5000); }
    else { setOk(msg); setTimeout(() => setOk(''), 3000); }
  };

  const nomeClassif = (cod: number | null | undefined) => {
    if (!cod) return '';
    return classificacoes.find(c => c.codigo === cod)?.nome || '';
  };

  const handleAdd = async () => {
    if (!newNome.trim()) { flash('Informe o nome do fornecedor.', true); return; }
    const { error } = await supabase
      .from('fornecedores')
      .insert({ nome: newNome.trim(), codigo_classificacao: newCodClassif || null });
    if (error) { flash('Erro: ' + error.message, true); return; }
    setNewNome(''); setNewCodClassif(null);
    flash('Fornecedor cadastrado!');
    load();
  };

  const handleUpdate = async (id: number) => {
    if (!editNome.trim()) { flash('Nome não pode ser vazio.', true); return; }
    const { error } = await supabase
      .from('fornecedores')
      .update({ nome: editNome.trim(), codigo_classificacao: editCodClassif || null })
      .eq('id', id);
    if (error) { flash('Erro: ' + error.message, true); return; }
    setEditId(null);
    flash('Fornecedor atualizado!');
    load();
  };

  const handleDelete = async (id: number) => {
    const forn = fornecedores.find(f => f.id === id);
    if (forn) {
      const { count } = await supabase
        .from('lancamentos')
        .select('id', { count: 'exact', head: true })
        .eq('codigo_fornecedor', forn.codigo);
      if (count && count > 0) {
        flash(`Não é possível excluir: ${count} lançamento(s) vinculado(s).`, true);
        return;
      }
    }
    const { error } = await supabase.from('fornecedores').delete().eq('id', id);
    if (error) { flash('Erro ao excluir: ' + error.message, true); return; }
    flash('Fornecedor excluído!');
    load();
  };

  const toggleSort = (k: 'codigo' | 'nome' | 'classificacao') => {
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(k);
      setSortDir('asc');
    }
  };

  const sorted = [...fornecedores].sort((a, b) => {
    const getVal = (f: Fornecedor, k: 'codigo' | 'nome' | 'classificacao') => {
      if (k === 'codigo') return String(f.codigo).padStart(3, '0');
      if (k === 'nome') return f.nome.toLowerCase();
      return nomeClassif(f.codigo_classificacao).toLowerCase();
    };
    const av = getVal(a, sortKey);
    const bv = getVal(b, sortKey);
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const filtered = sorted.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) ||
    nomeClassif(f.codigo_classificacao).toLowerCase().includes(search.toLowerCase())
  );

  const tdCls = 'px-3 py-1 text-sm border-b border-gray-100';
  const fieldH = 'h-8';

  const ClassifSelect = ({
    value, onChange,
  }: {
    value: number | null;
    onChange: (v: number | null) => void;
  }) => (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
      className={`w-full border border-gray-300 rounded-lg px-2 ${fieldH} text-sm outline-none focus:border-green-400`}
    >
      <option value="">Sem classificação</option>
      {classificacoes.map(c => (
        <option key={c.codigo} value={c.codigo}>
          {String(c.codigo).padStart(3, '0')} — {c.nome}
        </option>
      ))}
    </select>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-100" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center px-4 py-2 gap-3" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
          <ChevronLeft size={16} /> Menu
        </button>
        <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        <span className="text-white font-bold text-sm">Cadastro de Fornecedores</span>
      </div>

      {/* Fixed top section: alerts + add form + search */}
      <div className="flex-shrink-0 max-w-3xl w-full mx-auto px-4 pt-3">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{erro}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2 mb-3">{ok}</div>}

        <div className="bg-white rounded-xl shadow-sm p-3 mb-[5px]" style={{ paddingBottom: '11px' }}>
          <div className="flex gap-[5px] flex-wrap">
            <input
              className={`flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-500`}
              placeholder="Nome do fornecedor"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <div className="flex-1 min-w-[200px]">
              <ClassifSelect value={newCodClassif} onChange={setNewCodClassif} />
            </div>
            <button onClick={handleAdd} className={`bg-green-600 hover:bg-green-700 text-white px-4 ${fieldH} rounded-lg text-sm font-bold flex items-center gap-1 transition-colors`}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm px-3 flex items-center" style={{ height: '40px' }}>
          <input
            className={`w-full border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-400`}
            placeholder="Pesquisar por nome ou classificação..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto max-w-3xl w-full mx-auto px-4 pt-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th
                    className="bg-green-700 text-white text-xs px-3 py-1.5 text-center w-16 cursor-pointer select-none hover:bg-green-600 transition-colors"
                    onClick={() => toggleSort('codigo')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Cód.
                      {sortKey === 'codigo' && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="bg-green-700 text-white text-xs px-3 py-1.5 text-left cursor-pointer select-none hover:bg-green-600 transition-colors"
                    onClick={() => toggleSort('nome')}
                  >
                    <div className="flex items-center gap-1">
                      Nome
                      {sortKey === 'nome' && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th
                    className="bg-green-700 text-white text-xs px-3 py-1.5 text-left w-52 cursor-pointer select-none hover:bg-green-600 transition-colors"
                    onClick={() => toggleSort('classificacao')}
                  >
                    <div className="flex items-center gap-1">
                      Classificação
                      {sortKey === 'classificacao' && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                    </div>
                  </th>
                  <th className="bg-green-700 text-white text-xs px-3 py-1.5 text-center w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-sm">Nenhum fornecedor encontrado</td></tr>
                )}
                {filtered.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className={`${tdCls} text-center text-gray-500 font-mono`}>{String(f.codigo).padStart(4, '0')}</td>
                    <td className={tdCls}>
                      {editId === f.id ? (
                        <input
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 text-sm outline-none h-7"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(f.id); if (e.key === 'Escape') setEditId(null); }}
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{f.nome}</span>
                      )}
                    </td>
                    <td className={tdCls}>
                      {editId === f.id
                        ? <ClassifSelect value={editCodClassif} onChange={setEditCodClassif} />
                        : (
                          f.codigo_classificacao
                            ? <span className="text-green-700 font-medium text-xs">{String(f.codigo_classificacao).padStart(3,'0')} — {nomeClassif(f.codigo_classificacao)}</span>
                            : <span className="text-gray-400 italic text-xs">Sem classificação</span>
                        )
                      }
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {editId === f.id ? (
                          <>
                            <button onClick={() => handleUpdate(f.id)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white"><Check size={13} /></button>
                            <button onClick={() => setEditId(null)} className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditId(f.id);
                                setEditNome(f.nome);
                                setEditCodClassif(f.codigo_classificacao ?? null);
                              }}
                              className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white"
                            ><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(f.id)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
