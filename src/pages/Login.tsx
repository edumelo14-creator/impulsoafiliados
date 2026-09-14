import { useState, useEffect } from 'react';
import {
  Send,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  User as UserIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function Login() {
  const [username, setUsername] = useState('eduardoMelo');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'checking' | 'signin' | 'signup'>('checking');

  useEffect(() => {
    async function checkAccount() {
      const { data: profile } = await supabase
        .from('panel_users')
        .select('email')
        .eq('username', 'eduardoMelo')
        .maybeSingle();

      if (!profile) {
        setMode('signup');
        return;
      }

      // Try a probe login to detect if a password is already set
      const { error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: '__probe__',
      });
      const msg = error?.message ?? '';
      if (msg.includes('Invalid login credentials')) {
        setMode('signin');
      } else if (msg.includes('Email not confirmed')) {
        setMode('signin');
      } else {
        setMode('signup');
      }
    }
    checkAccount();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Informe o usuário.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (mode === 'signup' && password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('panel_users')
        .select('email')
        .eq('username', username.trim())
        .maybeSingle();

      if (!profile) {
        setError('Usuário não encontrado.');
        return;
      }

      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({
          email: profile.email,
          password,
        });
        if (err) {
          setError(err.message);
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password,
        });
        if (err) {
          setError('Usuário ou senha incorretos.');
        }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-100 via-ink-50 to-primary-50 p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
            <Send size={28} />
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900">Impulso Afiliado</h1>
          <p className="mt-1 text-sm text-ink-500">Acesso ao painel de gestão</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-card">
          {mode === 'checking' ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              {mode === 'signup' && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-warning-50 p-3">
                  <Sparkles size={16} className="mt-0.5 shrink-0 text-warning-600" />
              <p className="text-xs text-warning-700">
                  Primeiro acesso — defina sua senha agora. Ela será usada para entrar no painel daqui em diante.
                </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-600">Usuário</label>
                  <div className="relative">
                    <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="eduardoMelo"
                      autoFocus
                      className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-ink-900 placeholder:text-ink-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-600">Senha</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                    <input
                      type={show ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    >
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-ink-600">
                      Confirmar senha
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                      <input
                        type={show ? 'text' : 'password'}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-ink-200 bg-white py-2.5 pl-10 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-error-50 px-3 py-2 text-xs font-medium text-error-600">
                    <AlertCircle size={14} className="shrink-0" /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : mode === 'signup' ? (
                    <>
                      <CheckCircle2 size={16} /> Criar senha e entrar
                    </>
                  ) : (
                    <>
                      <Lock size={16} /> Entrar
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
