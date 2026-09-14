import { useState, useEffect } from 'react';
import { BarChart2, Building2, Users, Tag, UserCog, LogOut, Wrench, Lock, TrendingUp, Download } from 'lucide-react';
import { supabase, UsuarioApp } from './lib/supabase';

export type MenuItem = 'lancamentos' | 'bancos' | 'fornecedores' | 'classificacoes' | 'usuarios' | 'manutencao' | 'gerencial' | 'importacao';

type Props = {
  user: UsuarioApp;
  onNavigate: (page: MenuItem) => void;
  onLogout: () => void;
};

const items: { key: MenuItem; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'lancamentos', label: 'Lançamentos Financeiros', icon: <BarChart2 size={28} />, desc: 'Gerenciar entradas e saídas' },
  { key: 'gerencial', label: 'Gerencial', icon: <TrendingUp size={28} />, desc: 'Gráficos e análise de movimentos' },
  { key: 'bancos', label: 'Cadastro de Bancos', icon: <Building2 size={28} />, desc: 'Gerenciar contas bancárias' },
  { key: 'fornecedores', label: 'Cadastro de Fornecedores', icon: <Users size={28} />, desc: 'Gerenciar fornecedores e categorias' },
  { key: 'classificacoes', label: 'Classificações', icon: <Tag size={28} />, desc: 'Categorias de lançamentos' },
  { key: 'usuarios', label: 'Usuários do Sistema', icon: <UserCog size={28} />, desc: 'Gerenciar acessos' },
  { key: 'manutencao', label: 'Manutenção', icon: <Wrench size={28} />, desc: 'Backup, restauração e exportação' },
  { key: 'importacao', label: 'Importação Interbase', icon: <Download size={28} />, desc: 'Conectar e importar dados do Interbase' },
];

export default function MenuPage({ user, onNavigate, onLogout }: Props) {
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissoes = async () => {
      // Adm (id=0, usuário fake) tem todas as permissões
      if (user.id === 0 || user.nome === 'Adm') {
        const all: Record<string, boolean> = {};
        items.forEach(i => { all[i.key] = true; });
        setPermissoes(all);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('usuario_permissoes')
        .select('menu,permitido')
        .eq('usuario_id', user.id);
      const map: Record<string, boolean> = {};
      (data || []).forEach((p: { menu: string; permitido: boolean }) => { map[p.menu] = p.permitido; });
      // Default: se não tem registro, permite (compatibilidade)
      items.forEach(i => { if (!(i.key in map)) map[i.key] = true; });
      setPermissoes(map);
      setLoading(false);
    };
    loadPermissoes();
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 50%, #1a4a1a 100%)' }}>
      <div className="border-b border-white/10 px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.25)' }}>
        <div className="flex items-center gap-3">
          <img src="/image.png" alt="Hortifruti Avenida" className="h-10 w-auto" />
          <div>
            <h1 className="text-white font-bold text-base leading-tight">Sistema Financeiro</h1>
            <p className="text-green-300 text-xs">Bem-vindo, <span className="text-yellow-300 font-semibold">{user.nome}</span></p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-green-200 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg hover:bg-white/10"
        >
          <LogOut size={16} />
          Sair
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {loading ? (
          <p className="text-green-200 text-sm">Carregando...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full max-w-3xl">
            {items.map(item => {
              const permitido = permissoes[item.key] !== false;
              return (
                <button
                  key={item.key}
                  onClick={() => permitido && onNavigate(item.key)}
                  disabled={!permitido}
                  className={`rounded-2xl p-6 text-left transition-all group border ${
                    permitido
                      ? 'border-white/10 hover:border-yellow-400/60 hover:scale-[1.02] cursor-pointer'
                      : 'border-white/5 opacity-40 cursor-not-allowed'
                  }`}
                  style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(4px)' }}
                >
                  <div className={`${permitido ? 'text-yellow-300 group-hover:text-yellow-200' : 'text-gray-400'} mb-3 transition-colors flex items-center gap-2`}>
                    {item.icon}
                    {!permitido && <Lock size={16} className="text-gray-400" />}
                  </div>
                  <h2 className="text-white font-bold text-sm mb-1">{item.label}</h2>
                  <p className="text-green-300 text-xs">{item.desc}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
