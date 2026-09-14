import { useState, useEffect, useCallback } from 'react';
import { supabase, Classificacao } from './lib/supabase';
import { Plus, Pencil, Trash2, ChevronLeft, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

type Props = { onBack: () => void };

export default function CadastroClassificacoes({ onBack }: Props) {
  const [items, setItems] = useState<Classificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [editCodigo, setEditCodigo] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [newNome, setNewNome] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [sortKey, setSortKey] = useState<'codigo' | 'nome'>('codigo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (k: 'codigo' | 'nome') => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('classificacoes').select('*').order('codigo');
    setItems((data as Classificacao[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setErro(msg); setTimeout(() => setErro(''), 5000); }
    else { setOk(msg); setTimeout(() => setOk(''), 3000); }
  };

  const handleAdd = async () => {
    if (!newNome.trim()) { flash('Informe o nome da classificação.', true); return; }
    const { error } = await supabase.from('classificacoes').insert({ nome: newNome.trim() });
    if (error) { flash('Erro: ' + error.message, true); return; }
    setNewNome('');
    flash('Classificação cadastrada!');
    load();
  };

  const handleUpdate = async (codigo: number) => {
    if (!editNome.trim()) { flash('Nome não pode ser vazio.', true); return; }
    const { error } = await supabase.from('classificacoes').update({ nome: editNome.trim() }).eq('codigo', codigo);
    if (error) { flash('Erro: ' + error.message, true); return; }
    setEditCodigo(null);
    flash('Classificação atualizada!');
    load();
  };

  const handleDelete = async (codigo: number) => {
    const item = items.find(i => i.codigo === codigo);
    if (item) {
      const { count } = await supabase
        .from('lancamentos')
        .select('id', { count: 'exact', head: true })
        .eq('classificacao', item.nome);
      if (count && count > 0) {
        flash(`Não é possível excluir: ${count} lançamento(s) vinculado(s) a esta classificação.`, true);
        return;
      }
    }
    const { error } = await supabase.from('classificacoes').delete().eq('codigo', codigo);
    if (error) { flash('Erro: ' + error.message, true); return; }
    flash('Classificação excluída!');
    load();
  };

  const sorted = [...items].sort((a, b) => {
    const av = sortKey === 'codigo' ? String(a.codigo).padStart(3,'0') : a.nome.toLowerCase();
    const bv = sortKey === 'codigo' ? String(b.codigo).padStart(3,'0') : b.nome.toLowerCase();
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const tdCls = 'px-4 py-1 text-sm border-b border-gray-100';
  const fieldH = 'h-8';

  return (
    <div className="h-screen flex flex-col bg-gray-100" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Fixed header */}
      <div className="flex-shrink-0 flex items-center px-4 py-2 gap-3" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
          <ChevronLeft size={16} /> Menu
        </button>
        <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        <span className="text-white font-bold text-sm">Cadastro de Classificações</span>
      </div>

      {/* Fixed top section: alerts + add form */}
      <div className="flex-shrink-0 max-w-2xl w-full mx-auto px-4 pt-3">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{erro}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2 mb-3">{ok}</div>}

        <div className="bg-white rounded-xl shadow-sm p-3" style={{ paddingBottom: '11px' }}>
          <div className="flex gap-[5px]">
            <input
              className={`flex-1 border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-500`}
              placeholder="Nome da classificação"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className={`bg-green-600 hover:bg-green-700 text-white px-4 ${fieldH} rounded-lg text-sm font-bold flex items-center gap-1 transition-colors`}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto max-w-2xl w-full mx-auto p-4 pt-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-left w-20 cursor-pointer select-none hover:bg-green-600 transition-colors" onClick={() => toggleSort('codigo')}>
                    <div className="flex items-center gap-1">Código {sortKey === 'codigo' && (sortDir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-left cursor-pointer select-none hover:bg-green-600 transition-colors" onClick={() => toggleSort('nome')}>
                    <div className="flex items-center gap-1">Nome {sortKey === 'nome' && (sortDir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400 text-sm">Nenhuma classificação cadastrada</td></tr>
                )}
                {sorted.map(item => (
                  <tr key={item.codigo} className="hover:bg-gray-50">
                    <td className={`${tdCls} text-gray-500 font-mono`}>{String(item.codigo).padStart(3, '0')}</td>
                    <td className={tdCls}>
                      {editCodigo === item.codigo ? (
                        <input
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1 text-sm outline-none"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(item.codigo); if (e.key === 'Escape') setEditCodigo(null); }}
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{item.nome}</span>
                      )}
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {editCodigo === item.codigo ? (
                          <>
                            <button onClick={() => handleUpdate(item.codigo)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white"><Check size={13} /></button>
                            <button onClick={() => setEditCodigo(null)} className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditCodigo(item.codigo); setEditNome(item.nome); }} className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(item.codigo)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"><Trash2 size={13} /></button>
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
