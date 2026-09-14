import { useState, useEffect, useCallback } from 'react';
import { supabase, Banco } from './lib/supabase';
import { Plus, Pencil, Trash2, ChevronLeft, Check, X, ArrowUp, ArrowDown } from 'lucide-react';

type Props = { onBack: () => void };

export default function CadastroBancos({ onBack }: Props) {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
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
    const { data } = await supabase.from('bancos').select('*').order('codigo');
    setBancos((data as Banco[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setErro(msg); setTimeout(() => setErro(''), 4000); }
    else { setOk(msg); setTimeout(() => setOk(''), 3000); }
  };

  const handleAdd = async () => {
    if (!newNome.trim()) { flash('Informe o nome do banco.', true); return; }
    const { error } = await supabase.from('bancos').insert({ nome: newNome.trim() });
    if (error) { flash('Erro: ' + error.message, true); return; }
    setNewNome('');
    flash('Banco cadastrado!');
    load();
  };

  const handleUpdate = async (id: number) => {
    if (!editNome.trim()) { flash('Nome não pode ser vazio.', true); return; }
    const { error } = await supabase.from('bancos').update({ nome: editNome.trim() }).eq('id', id);
    if (error) { flash('Erro: ' + error.message, true); return; }
    setEditId(null);
    flash('Banco atualizado!');
    load();
  };

  const handleDelete = async (id: number) => {
    const banco = bancos.find(b => b.id === id);
    if (banco) {
      const { count } = await supabase.from('lancamentos').select('id', { count: 'exact', head: true }).eq('banco', banco.nome);
      if (count && count > 0) { flash(`Não é possível excluir: ${count} lançamento(s) vinculado(s) a este banco.`, true); return; }
    }
    const { error } = await supabase.from('bancos').delete().eq('id', id);
    if (error) { flash('Erro: ' + error.message, true); return; }
    flash('Banco excluído!');
    load();
  };

  const sorted = [...bancos].sort((a, b) => {
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
        <span className="text-white font-bold text-sm">Cadastro de Bancos</span>
      </div>

      {/* Fixed top section: alerts + add form */}
      <div className="flex-shrink-0 max-w-2xl w-full mx-auto px-4 pt-3" style={{ paddingBottom: '0px' }}>
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{erro}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2 mb-3">{ok}</div>}

        <div className="bg-white rounded-xl shadow-sm p-3" style={{ paddingBottom: '11px' }}>
          <div className="flex gap-[5px]">
            <input
              className={`flex-1 border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-500`}
              placeholder="Nome do banco"
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
                {bancos.length === 0 && (
                  <tr><td colSpan={3} className="text-center py-6 text-gray-400 text-sm">Nenhum banco cadastrado</td></tr>
                )}
                {sorted.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className={`${tdCls} text-gray-500 font-mono`}>{String(b.codigo).padStart(3, '0')}</td>
                    <td className={tdCls}>
                      {editId === b.id ? (
                        <input
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1 text-sm outline-none"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdate(b.id); if (e.key === 'Escape') setEditId(null); }}
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{b.nome}</span>
                      )}
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {editId === b.id ? (
                          <>
                            <button onClick={() => handleUpdate(b.id)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white"><Check size={13} /></button>
                            <button onClick={() => setEditId(null)} className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(b.id); setEditNome(b.nome); }} className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white"><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(b.id)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white"><Trash2 size={13} /></button>
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
