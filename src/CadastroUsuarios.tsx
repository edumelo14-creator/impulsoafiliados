import { useState, useEffect, useCallback } from 'react';
import { supabase, UsuarioApp, Fornecedor } from './lib/supabase';
import { Plus, Pencil, Trash2, ChevronLeft, Check, X, RotateCcw, ArrowUp, ArrowDown, Shield, Link2 } from 'lucide-react';

const MENUS_LIST = [
  { key: 'lancamentos', label: 'Lançamentos Financeiros' },
  { key: 'gerencial', label: 'Gerencial' },
  { key: 'bancos', label: 'Cadastro de Bancos' },
  { key: 'fornecedores', label: 'Cadastro de Fornecedores' },
  { key: 'classificacoes', label: 'Classificações' },
  { key: 'usuarios', label: 'Usuários do Sistema' },
  { key: 'manutencao', label: 'Manutenção' },
];

async function hashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

type Props = { onBack: () => void; currentUser: UsuarioApp };

export default function CadastroUsuarios({ onBack, currentUser }: Props) {
  const [users, setUsers] = useState<UsuarioApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [newNome, setNewNome] = useState('');
  const [newSenha, setNewSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');
  const [sortKey, setSortKey] = useState<'nome' | 'ativo'>('nome');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [permUser, setPermUser] = useState<UsuarioApp | null>(null);
  const [permMap, setPermMap] = useState<Record<string, boolean>>({});
  const [permLoading, setPermLoading] = useState(false);
  const [vincUser, setVincUser] = useState<UsuarioApp | null>(null);
  const [vincFornecedores, setVincFornecedores] = useState<Fornecedor[]>([]);
  const [vincSelected, setVincSelected] = useState<number | null>(null);
  const [vincLoading, setVincLoading] = useState(false);

  const toggleSort = (k: 'nome' | 'ativo') => {
    if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(k); setSortDir('asc'); }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('usuarios_app').select('id,nome,deve_trocar_senha,ativo,created_at').order('id');
    setUsers((data as UsuarioApp[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setErro(msg); setTimeout(() => setErro(''), 4000); }
    else { setOk(msg); setTimeout(() => setOk(''), 3000); }
  };

  const handleAdd = async () => {
    if (!newNome.trim()) { flash('Informe o nome do usuário.', true); return; }
    if (!newSenha || newSenha.length < 6) { flash('Senha deve ter ao menos 6 caracteres.', true); return; }
    const hash = await hashSenha(newSenha);
    const { error } = await supabase.from('usuarios_app').insert({ nome: newNome.trim(), senha_hash: hash, deve_trocar_senha: true });
    if (error) { flash('Erro: ' + error.message, true); return; }
    setNewNome(''); setNewSenha('');
    flash('Usuário cadastrado! Ele deverá trocar a senha no 1º acesso.');
    load();
  };

  const handleUpdateNome = async (id: number) => {
    if (!editNome.trim()) { flash('Nome não pode ser vazio.', true); return; }
    const { error } = await supabase.from('usuarios_app').update({ nome: editNome.trim() }).eq('id', id);
    if (error) { flash('Erro: ' + error.message, true); return; }
    setEditId(null);
    flash('Usuário atualizado!');
    load();
  };

  const handleResetSenha = async (id: number) => {
    // força troca de senha no próximo login
    const tempHash = await hashSenha('Trocar@123');
    await supabase.from('usuarios_app').update({ senha_hash: tempHash, deve_trocar_senha: true }).eq('id', id);
    flash('Senha resetada. Senha temporária: Trocar@123 (deve trocar no 1º acesso)');
    load();
  };

  const handleToggleAtivo = async (u: UsuarioApp) => {
    if (u.id === currentUser.id) { flash('Você não pode desativar sua própria conta.', true); return; }
    await supabase.from('usuarios_app').update({ ativo: !u.ativo }).eq('id', u.id);
    load();
  };

  const handleDelete = async (id: number) => {
    if (id === currentUser.id) { flash('Você não pode excluir sua própria conta.', true); return; }
    const { error } = await supabase.from('usuarios_app').delete().eq('id', id);
    if (error) { flash('Erro: ' + error.message, true); return; }
    flash('Usuário excluído!');
    load();
  };

  const openPermissoes = async (u: UsuarioApp) => {
    setPermUser(u);
    setPermLoading(true);
    if (u.nome === 'Adm') {
      const all: Record<string, boolean> = {};
      MENUS_LIST.forEach(m => { all[m.key] = true; });
      setPermMap(all);
      setPermLoading(false);
      return;
    }
    const { data } = await supabase.from('usuario_permissoes').select('menu,permitido').eq('usuario_id', u.id);
    const map: Record<string, boolean> = {};
    (data || []).forEach((p: { menu: string; permitido: boolean }) => { map[p.menu] = p.permitido; });
    MENUS_LIST.forEach(m => { if (!(m.key in map)) map[m.key] = true; });
    setPermMap(map);
    setPermLoading(false);
  };

  const togglePermissao = (menu: string) => {
    if (permUser?.nome === 'Adm') return; // Adm sempre tem tudo
    setPermMap(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  const salvarPermissoes = async () => {
    if (!permUser || permUser.nome === 'Adm') { setPermUser(null); return; }
    setPermLoading(true);
    // Upsert all menus
    const rows = MENUS_LIST.map(m => ({
      usuario_id: permUser.id,
      menu: m.key,
      permitido: permMap[m.key] !== false,
    }));
    for (const r of rows) {
      await supabase
        .from('usuario_permissoes')
        .upsert(r, { onConflict: 'usuario_id,menu' });
    }
    setPermLoading(false);
    setPermUser(null);
    flash('Permissões atualizadas!');
  };

  const openVinculo = async (u: UsuarioApp) => {
    setVincUser(u);
    setVincLoading(true);
    const [fRes, vRes] = await Promise.all([
      supabase.from('fornecedores').select('*').order('nome'),
      supabase.from('usuario_fornecedor').select('codigo_fornecedor').eq('usuario_id', u.id).maybeSingle(),
    ]);
    setVincFornecedores((fRes.data as Fornecedor[]) || []);
    setVincSelected(vRes.data ? (vRes.data as { codigo_fornecedor: number }).codigo_fornecedor : null);
    setVincLoading(false);
  };

  const salvarVinculo = async () => {
    if (!vincUser) return;
    setVincLoading(true);
    if (vincSelected === null) {
      await supabase.from('usuario_fornecedor').delete().eq('usuario_id', vincUser.id);
    } else {
      await supabase
        .from('usuario_fornecedor')
        .upsert({ usuario_id: vincUser.id, codigo_fornecedor: vincSelected }, { onConflict: 'usuario_id' });
    }
    setVincLoading(false);
    setVincUser(null);
    flash('Vínculo atualizado!');
  };

  const sorted = [...users].sort((a, b) => {
    let av: string | number, bv: string | number;
    if (sortKey === 'nome') { av = a.nome.toLowerCase(); bv = b.nome.toLowerCase(); }
    else { av = a.ativo ? 1 : 0; bv = b.ativo ? 1 : 0; }
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
        <span className="text-white font-bold text-sm">Usuários do Sistema</span>
      </div>

      {/* Fixed top section: alerts + add form */}
      <div className="flex-shrink-0 max-w-3xl w-full mx-auto px-4 pt-3">
        {erro && <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{erro}</div>}
        {ok && <div className="bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg px-3 py-2 mb-3">{ok}</div>}

        <div className="bg-white rounded-xl shadow-sm p-3" style={{ paddingBottom: '11px' }}>
          <div className="flex gap-[5px] flex-wrap">
            <input
              className={`flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-500`}
              placeholder="Nome do usuário"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
            />
            <input
              type="password"
              className={`flex-1 min-w-[140px] border border-gray-300 rounded-lg px-3 ${fieldH} text-sm outline-none focus:border-green-500`}
              placeholder="Senha inicial (mín. 6 caracteres)"
              value={newSenha}
              onChange={e => setNewSenha(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button onClick={handleAdd} className={`bg-green-600 hover:bg-green-700 text-white px-4 ${fieldH} rounded-lg text-sm font-bold flex items-center gap-1 transition-colors`}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable table area */}
      <div className="flex-1 overflow-auto max-w-3xl w-full mx-auto p-4 pt-3">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Carregando...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-left cursor-pointer select-none hover:bg-green-600 transition-colors" onClick={() => toggleSort('nome')}>
                    <div className="flex items-center gap-1">Usuário {sortKey === 'nome' && (sortDir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-center w-24 cursor-pointer select-none hover:bg-green-600 transition-colors" onClick={() => toggleSort('ativo')}>
                    <div className="flex items-center justify-center gap-1">Status {sortKey === 'ativo' && (sortDir === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>)}</div>
                  </th>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-center w-32">Ações</th>
                  <th className="bg-green-700 text-white text-xs px-4 py-1.5 text-center w-28">Permissões / Vínculo</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-gray-400 text-sm">Nenhum usuário cadastrado</td></tr>
                )}
                {sorted.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                    <td className={tdCls}>
                      {editId === u.id ? (
                        <input
                          autoFocus
                          className="w-full border border-green-400 rounded px-2 py-1 text-sm outline-none"
                          value={editNome}
                          onChange={e => setEditNome(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleUpdateNome(u.id); if (e.key === 'Escape') setEditId(null); }}
                        />
                      ) : (
                        <div>
                          <span className="font-semibold text-gray-800">{u.nome}</span>
                          {u.deve_trocar_senha && <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">Troca obrigatória</span>}
                          {u.id === currentUser.id && <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Você</span>}
                        </div>
                      )}
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <button onClick={() => handleToggleAtivo(u)} className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${u.ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        {editId === u.id ? (
                          <>
                            <button onClick={() => handleUpdateNome(u.id)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white"><Check size={13} /></button>
                            <button onClick={() => setEditId(null)} className="p-1 rounded bg-gray-400 hover:bg-gray-500 text-white"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditId(u.id); setEditNome(u.nome); }} className="p-1 rounded bg-yellow-400 hover:bg-yellow-500 text-white" title="Editar nome"><Pencil size={13} /></button>
                            <button onClick={() => handleResetSenha(u.id)} className="p-1 rounded bg-green-500 hover:bg-green-600 text-white" title="Resetar senha"><RotateCcw size={13} /></button>
                            <button onClick={() => handleDelete(u.id)} className="p-1 rounded bg-red-500 hover:bg-red-600 text-white" title="Excluir"><Trash2 size={13} /></button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openPermissoes(u)}
                          className="p-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
                          title="Gerenciar permissões"
                        >
                          <Shield size={13} />
                        </button>
                        <button
                          onClick={() => openVinculo(u)}
                          className="p-1 rounded bg-purple-500 hover:bg-purple-600 text-white"
                          title="Vincular fornecedor"
                        >
                          <Link2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Permissões */}
      {permUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPermUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-white" />
                <span className="text-white font-bold text-sm">Permissões — {permUser.nome}</span>
              </div>
              <button onClick={() => setPermUser(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-4">
              {permLoading ? (
                <p className="text-center text-sm text-gray-400 py-6">Carregando...</p>
              ) : (
                <>
                  {permUser.nome === 'Adm' && (
                    <div className="mb-3 text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2">
                      O usuário <strong>Adm</strong> possui todas as permissões sempre ativas e não podem ser alteradas.
                    </div>
                  )}
                  <div className="space-y-2">
                    {MENUS_LIST.map(m => (
                      <label key={m.key} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${permUser.nome === 'Adm' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:bg-green-50 cursor-pointer'}`}>
                        <span className="text-sm text-gray-700">{m.label}</span>
                        <button
                          type="button"
                          disabled={permUser.nome === 'Adm'}
                          onClick={() => togglePermissao(m.key)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${permMap[m.key] !== false ? 'bg-green-600' : 'bg-gray-300'} ${permUser.nome === 'Adm' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${permMap[m.key] !== false ? 'translate-x-4' : 'translate-x-1'}`} />
                        </button>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setPermUser(null)} className="px-4 py-1.5 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-700">Cancelar</button>
                    <button
                      onClick={salvarPermissoes}
                      disabled={permUser.nome === 'Adm'}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold text-white ${permUser.nome === 'Adm' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vínculo de Fornecedor */}
      {vincUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setVincUser(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
              <div className="flex items-center gap-2">
                <Link2 size={18} className="text-white" />
                <span className="text-white font-bold text-sm">Vínculo de Fornecedor — {vincUser.nome}</span>
              </div>
              <button onClick={() => setVincUser(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
            </div>
            <div className="p-4">
              {vincLoading ? (
                <p className="text-center text-sm text-gray-400 py-6">Carregando...</p>
              ) : (
                <>
                  <p className="text-xs text-gray-600 mb-3">
                    Selecione um fornecedor para vincular ao usuário. Quando vinculado, o usuário só verá lançamentos deste fornecedor, com o filtro travado e a ordenação fixa por fornecedor.
                  </p>
                  <div className="mb-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-white border-gray-200 hover:bg-red-50 cursor-pointer">
                      <input
                        type="radio"
                        name="vinculo"
                        checked={vincSelected === null}
                        onChange={() => setVincSelected(null)}
                        className="flex-shrink-0"
                      />
                      <span className="text-sm text-gray-700">Sem vínculo (todos os fornecedores)</span>
                    </label>
                  </div>
                  <div className="max-h-56 overflow-auto border border-gray-200 rounded-lg">
                    {vincFornecedores.map(f => (
                      <label key={f.codigo} className="flex items-center gap-2 px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-50 last:border-0">
                        <input
                          type="radio"
                          name="vinculo"
                          checked={vincSelected === f.codigo}
                          onChange={() => setVincSelected(f.codigo)}
                          className="flex-shrink-0"
                        />
                        <span className="truncate">{String(f.codigo).padStart(4, '0')} — {f.nome}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button onClick={() => setVincUser(null)} className="px-4 py-1.5 rounded-lg text-sm bg-gray-200 hover:bg-gray-300 text-gray-700">Cancelar</button>
                    <button
                      onClick={salvarVinculo}
                      className="px-4 py-1.5 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700"
                    >
                      Salvar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
