import { useState, useEffect } from 'react';
import { X, Check, Loader2, AlertCircle, Bot, Clock, Shield, Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSettings } from '@/hooks/useData';
import { getBotInfo } from '@/lib/telegram';
import type { TelegramBotInfo } from '@/lib/telegram';

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, update } = useSettings();
  const [token, setToken] = useState('');
  const [storeName, setStoreName] = useState('');
  const [maxSends, setMaxSends] = useState(3);
  const [delay, setDelay] = useState(120);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; info?: TelegramBotInfo; error?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setToken(settings.telegram_bot_token ?? '');
      setStoreName(settings.store_name ?? '');
      setMaxSends(settings.max_sends_per_group_per_day);
      setDelay(settings.delay_seconds);
    }
  }, [settings]);

  async function handleTest() {
    if (!token.trim()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const info = await getBotInfo(token.trim());
      setTestResult({ ok: true, info });
    } catch (err) {
      setTestResult({ ok: false, error: err instanceof Error ? err.message : 'Erro ao testar' });
    }
    setTesting(false);
  }

  async function handleSave() {
    setSaving(true);
    await update({
      telegram_bot_token: token.trim() || null,
      store_name: storeName,
      max_sends_per_group_per_day: maxSends,
      delay_seconds: delay,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4 backdrop-blur-sm animate-scale-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900">Configurações</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100">
            <X size={20} />
          </button>
        </div>

        {/* Bot do Telegram */}
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Bot size={18} className="text-primary-600" /> Bot do Telegram
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Crie um bot com o @BotFather no Telegram e cole o token aqui. O bot envia mensagens automaticamente nos grupos e canais onde for adicionado.
          </p>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">Token do bot</span>
            <input
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setTestResult(null);
              }}
              className={inputCls + ' font-mono'}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
              type="password"
            />
          </label>

          <div className="mt-2 flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={!token.trim() || testing}>
              {testing ? <><Loader2 size={14} className="animate-spin" /> Testando...</> : 'Testar conexão'}
            </Button>
            {testResult?.ok && testResult.info && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-success-600">
                <Check size={14} /> Conectado como @{testResult.info.username}
              </span>
            )}
            {testResult && !testResult.ok && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-error-600">
                <AlertCircle size={14} /> {testResult.error}
              </span>
            )}
          </div>
        </div>

        {/* Nome da loja */}
        <div className="mt-5 border-t border-ink-100 pt-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Store size={18} className="text-primary-600" /> Loja
          </h3>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-semibold text-ink-600">Nome da loja/afiliado</span>
            <input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className={inputCls}
              placeholder="Minha Loja Afiliado"
            />
          </label>
        </div>

        {/* Limites anti-banimento */}
        <div className="mt-5 border-t border-ink-100 pt-5">
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <Shield size={18} className="text-success-600" /> Controles de envio
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-ink-600">
                <Clock size={12} /> Máx. por grupo/dia
              </span>
              <input
                type="number"
                min={1}
                max={20}
                value={maxSends}
                onChange={(e) => setMaxSends(parseInt(e.target.value, 10) || 3)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-ink-600">
                <Clock size={12} /> Intervalo (segundos)
              </span>
              <input
                type="number"
                min={30}
                step={30}
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value, 10) || 120)}
                className={inputCls}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            O bot respeita estes limites automaticamente. O Telegram tem seus próprios limites de rate (≈20 msg/min em grupos) — se excedido, ele aguarda e retoma.
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : saved ? <><Check size={16} /> Salvo!</> : 'Salvar configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20';
