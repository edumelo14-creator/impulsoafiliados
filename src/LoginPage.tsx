import { useState } from 'react';
import { supabase, UsuarioApp } from './lib/supabase';
import { Lock, User, Eye, EyeOff, KeyRound } from 'lucide-react';

const SENHA_MESTRE = 'Manager@Master2025';

async function hashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

type Props = {
  onLogin: (user: UsuarioApp) => void;
};

type Step = 'login' | 'change_password' | 'esqueceu' | 'reset';

export default function LoginPage({ onLogin }: Props) {
  const [step, setStep] = useState<Step>('login');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [senhaMestre, setSenhaMestre] = useState('');
  const [userParaReset, setUserParaReset] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [currentUser, setCurrentUser] = useState<UsuarioApp | null>(null);

  const handleLogin = async () => {
    setErro('');
    if (!usuario.trim() || !senha.trim()) { setErro('Informe usuário e senha.'); return; }
    setLoading(true);
    try {
      const { data: allUsers } = await supabase.from('usuarios_app').select('id').eq('ativo', true);
      const temUsuarios = allUsers && allUsers.length > 0;

      if (!temUsuarios) {
        if (usuario === 'Adm' && senha === 'Manager') {
          const fakeUser: UsuarioApp = { id: 0, nome: 'Adm', senha_hash: '', deve_trocar_senha: false, ativo: true };
          onLogin(fakeUser);
          return;
        }
        setErro('Nenhum usuário cadastrado. Use Adm / Manager.');
        return;
      }

      const hash = await hashSenha(senha);
      const { data: user, error } = await supabase
        .from('usuarios_app')
        .select('*')
        .eq('nome', usuario.trim())
        .eq('ativo', true)
        .maybeSingle();

      if (error || !user) { setErro('Usuário ou senha inválidos.'); return; }

      if (user.deve_trocar_senha) {
        if (user.senha_hash !== hash) { setErro('Senha inválida.'); return; }
        setCurrentUser(user);
        setStep('change_password');
        setSenha('');
        return;
      }

      if (user.senha_hash !== hash) { setErro('Usuário ou senha inválidos.'); return; }
      onLogin(user);
    } catch {
      setErro('Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePwd = async () => {
    setErro('');
    if (!novaSenha || novaSenha.length < 6) { setErro('A nova senha deve ter ao menos 6 caracteres.'); return; }
    if (novaSenha !== confirmaSenha) { setErro('As senhas não coincidem.'); return; }
    if (!currentUser) return;
    setLoading(true);
    try {
      const hash = await hashSenha(novaSenha);
      await supabase.from('usuarios_app').update({ senha_hash: hash, deve_trocar_senha: false }).eq('id', currentUser.id);
      onLogin({ ...currentUser, deve_trocar_senha: false });
    } catch {
      setErro('Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleEsqueceu = async () => {
    setErro('');
    if (senhaMestre !== SENHA_MESTRE) { setErro('Senha mestre incorreta.'); return; }
    setStep('reset');
    setUserParaReset('');
    setNovaSenha('');
    setConfirmaSenha('');
  };

  const handleReset = async () => {
    setErro('');
    if (!userParaReset.trim()) { setErro('Informe o usuário.'); return; }
    if (!novaSenha || novaSenha.length < 6) { setErro('Nova senha deve ter ao menos 6 caracteres.'); return; }
    if (novaSenha !== confirmaSenha) { setErro('As senhas não coincidem.'); return; }
    setLoading(true);
    try {
      const hash = await hashSenha(novaSenha);
      const { data: user } = await supabase.from('usuarios_app').select('id').eq('nome', userParaReset.trim()).maybeSingle();
      if (!user) { setErro('Usuário não encontrado.'); return; }
      await supabase.from('usuarios_app').update({ senha_hash: hash, deve_trocar_senha: false }).eq('id', user.id);
      setStep('login');
      setErro('');
      setSenhaMestre('');
    } catch {
      setErro('Erro ao redefinir senha.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-gray-50';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         <!--style={{ background: 'linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 50%, #1a4a1a 100%)' }}-->
         style={{ background: 'linear-gradient(135deg, #1a2f5c 0%, #2d4a8a 50%, #1a2f5c 100%)' }}
>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header with logo */}
        <div className="px-6 py-6 text-center" style={{ background: 'linear-gradient(135deg, #1e5c1e 0%, #2d7a2d 100%)' }}>
          <div className="flex items-center justify-center mb-3">
            <img src="/image.png" alt="Hortifruti Avenida" className="h-20 w-auto drop-shadow-lg" />
          </div>
          <p className="text-green-200 text-xs mt-1 font-medium tracking-wide">
            {step === 'login' && 'Sistema Financeiro — Acesso'}
            {step === 'change_password' && 'Troca de senha obrigatória'}
            {step === 'esqueceu' && 'Recuperação de senha'}
            {step === 'reset' && 'Redefinir senha'}
          </p>
        </div>

        <div className="px-6 py-6 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
              {erro}
            </div>
          )}

          {step === 'login' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Usuário</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className={`${inputCls} pl-9`}
                    value={usuario}
                    onChange={e => setUsuario(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Nome de usuário"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Senha</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showSenha ? 'text' : 'password'}
                    className={`${inputCls} pl-9 pr-9`}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleLogin()}
                    placeholder="Senha"
                  />
                  <button type="button" onClick={() => setShowSenha(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm"
                style={{ background: 'linear-gradient(135deg, #2d7a2d, #1e5c1e)' }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              <button onClick={() => { setStep('esqueceu'); setErro(''); setSenhaMestre(''); }} className="w-full text-xs text-green-700 hover:underline text-center">
                Esqueceu a senha?
              </button>
            </>
          )}

          {step === 'change_password' && (
            <>
              <p className="text-xs text-gray-600">Você precisa definir uma nova senha antes de continuar.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nova Senha</label>
                <input type="password" className={inputCls} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar Senha</label>
                <input type="password" className={inputCls} value={confirmaSenha} onChange={e => setConfirmaSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangePwd()} placeholder="Repita a nova senha" />
              </div>
              <button onClick={handleChangePwd} disabled={loading} className="w-full text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm" style={{ background: 'linear-gradient(135deg, #2d7a2d, #1e5c1e)' }}>
                {loading ? 'Salvando...' : 'Salvar Senha'}
              </button>
            </>
          )}

          {step === 'esqueceu' && (
            <>
              <p className="text-xs text-gray-600">Informe a senha mestre para continuar.</p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Senha Mestre</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" className={`${inputCls} pl-9`} value={senhaMestre} onChange={e => setSenhaMestre(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEsqueceu()} placeholder="Senha mestre" />
                </div>
              </div>
              <button onClick={handleEsqueceu} className="w-full text-white font-bold py-2.5 rounded-lg transition-colors text-sm" style={{ background: 'linear-gradient(135deg, #2d7a2d, #1e5c1e)' }}>
                Confirmar
              </button>
              <button onClick={() => { setStep('login'); setErro(''); }} className="w-full text-xs text-gray-500 hover:underline text-center">
                Voltar ao login
              </button>
            </>
          )}

          {step === 'reset' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Usuário</label>
                <input className={inputCls} value={userParaReset} onChange={e => setUserParaReset(e.target.value)} placeholder="Nome do usuário" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nova Senha</label>
                <input type="password" className={inputCls} value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Confirmar Senha</label>
                <input type="password" className={inputCls} value={confirmaSenha} onChange={e => setConfirmaSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReset()} placeholder="Repita a nova senha" />
              </div>
              <button onClick={handleReset} disabled={loading} className="w-full text-white font-bold py-2.5 rounded-lg transition-colors disabled:opacity-60 text-sm" style={{ background: 'linear-gradient(135deg, #2d7a2d, #1e5c1e)' }}>
                {loading ? 'Redefinindo...' : 'Redefinir Senha'}
              </button>
              <button onClick={() => { setStep('login'); setErro(''); }} className="w-full text-xs text-gray-500 hover:underline text-center">
                Voltar ao login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
