import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, BackupLog } from './lib/supabase';
import * as XLSX from 'xlsx';
import {
  ChevronLeft, Download, Upload, Database, Trash2, FileSpreadsheet,
  RefreshCw, CheckCircle, AlertTriangle, Clock,
} from 'lucide-react';

type Props = { onBack: () => void; userName: string };

type TableName = 'lancamentos' | 'bancos' | 'fornecedores' | 'classificacoes';
const ALL_TABLES: TableName[] = ['lancamentos', 'bancos', 'fornecedores', 'classificacoes'];
const TABLE_PK: Record<TableName, string> = {
  lancamentos: 'id',
  bancos: 'id',
  fornecedores: 'id',
  classificacoes: 'codigo',
};
// Colunas GENERATED ALWAYS AS IDENTITY — não podem ser inseridas manualmente
const GENERATED_COLS: Partial<Record<TableName, string[]>> = {
  lancamentos: ['id'],
  bancos: ['id'],
  fornecedores: ['id'],
};
function isDateSerial(v: unknown, key: string): boolean {
  return typeof v === 'number' && (key.startsWith('data_') || key.includes('date'));
}

function isDateString(v: unknown): boolean {
  if (typeof v !== 'string') return false;
  return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(v) ||
         /^\d{4}[\/\-]\d{2}[\/\-]\d{2}/.test(v);
}

function toISODate(v: unknown): string {
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number') {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  if (typeof v === 'string') {
    // DD/MM/YYYY or DD-MM-YYYY
    const dmY = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmY) return `${dmY[3]}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`;
    // YYYY-MM-DD or YYYY/MM/DD
    const Ymd = v.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
    if (Ymd) return `${Ymd[1]}-${Ymd[2]}-${Ymd[3]}`;
    return v;
  }
  return String(v);
}

function normalizeDates(row: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...row };
  for (const key of Object.keys(copy)) {
    const v = copy[key];
    if (v instanceof Date) {
      copy[key] = v.toISOString().split('T')[0];
    } else if (isDateSerial(v, key)) {
      copy[key] = toISODate(v);
    } else if (isDateString(v)) {
      copy[key] = toISODate(v);
    }
  }
  return copy;
}

function stripGenerated(table: TableName, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const cols = GENERATED_COLS[table];
  if (!cols || cols.length === 0) return rows;
  return rows.map((r) => {
    const copy = { ...r };
    cols.forEach((c) => delete copy[c]);
    return copy;
  });
}

type BackupData = {
  version: number;
  created_at: string;
  tables: Record<string, unknown[]>;
};

type AlertMsg = { msg: string; type: 'sucesso' | 'erro' | 'info' };

function Alert({ msg, type, onClose }: AlertMsg & { onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 6000); return () => clearTimeout(t); }, [msg, onClose]);
  const bg = type === 'sucesso' ? 'bg-green-600' : type === 'erro' ? 'bg-red-500' : 'bg-green-500';
  return (
    <div className={`fixed top-5 right-5 z-[9999] px-5 py-3 rounded-lg text-white font-medium shadow-xl text-sm ${bg}`}>
      {msg}
    </div>
  );
}

export default function ManutencaoPage({ onBack, userName }: Props) {
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [alert, setAlert] = useState<AlertMsg | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const pendingRestoreFile = useRef<File | null>(null);

  const showAlert = (msg: string, type: AlertMsg['type']) => setAlert({ msg, type });

  const loadBackups = useCallback(async () => {
    const { data } = await supabase.from('backups_log').select('*').order('created_at', { ascending: false });
    setBackups((data as BackupLog[]) || []);
  }, []);

  useEffect(() => { loadBackups(); }, [loadBackups]);

  // ─── Gerar BKP JSON ────────────────────────────────────────────────────────
  const gerarBackup = async () => {
    setLoading(true);
    setProgress('Coletando dados...');
    try {
      const tables: Record<string, unknown[]> = {};
      for (const t of ALL_TABLES) {
        setProgress(`Exportando ${t}...`);
        const { data, error } = await supabase.from(t).select('*').order(TABLE_PK[t] as never);
        if (error) throw new Error(`Erro em ${t}: ${error.message}`);
        tables[t] = data || [];
      }

      const backup: BackupData = {
        version: 2,
        created_at: new Date().toISOString(),
        tables,
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const nome = `financeiro-bkp-${ts}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = nome;
      a.click();
      URL.revokeObjectURL(url);

      const kb = parseFloat((blob.size / 1024).toFixed(2));
      await supabase.from('backups_log').insert({ nome, tipo: 'json', tamanho_kb: kb, criado_por: userName });
      await loadBackups();
      showAlert('Backup gerado e baixado com sucesso!', 'sucesso');
    } catch (e) {
      showAlert('Erro ao gerar backup: ' + (e instanceof Error ? e.message : String(e)), 'erro');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // ─── Restaurar BKP JSON ────────────────────────────────────────────────────
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingRestoreFile.current = file;
    setConfirmRestore(file.name);
    e.target.value = '';
  };

  const executarRestore = async (file: File) => {
    setLoading(true);
    setProgress('Lendo arquivo...');
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);
      if (!backup.tables || !backup.version) throw new Error('Arquivo inválido ou corrompido.');

      for (const t of ALL_TABLES) {
        if (!backup.tables[t]) continue;
        setProgress(`Restaurando ${t}...`);
        const pk = TABLE_PK[t];
        await supabase.from(t).delete().neq(pk, 0);
        const rows = stripGenerated(t, (backup.tables[t] as Record<string, unknown>[]).map(normalizeDates));
        if (rows.length > 0) {
          const chunkSize = 500;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const { error } = await supabase.from(t).insert(rows.slice(i, i + chunkSize) as never);
            if (error) throw new Error(`Erro restaurando ${t}: ${error.message}`);
          }
        }
      }

      showAlert('Restauração concluída com sucesso!', 'sucesso');
      await loadBackups();
    } catch (e) {
      showAlert('Erro na restauração: ' + (e instanceof Error ? e.message : String(e)), 'erro');
    } finally {
      setLoading(false);
      setProgress('');
      setConfirmRestore(null);
    }
  };

  // ─── Exportar Excel ────────────────────────────────────────────────────────
  const exportarExcel = async () => {
    setLoading(true);
    setProgress('Gerando Excel...');
    try {
      const wb = XLSX.utils.book_new();

      for (const t of ALL_TABLES) {
        setProgress(`Exportando ${t}...`);
        const { data, error } = await supabase.from(t).select('*').order(TABLE_PK[t] as never);
        if (error) throw new Error(`Erro em ${t}: ${error.message}`);
        const ws = XLSX.utils.json_to_sheet(data || []);
        XLSX.utils.book_append_sheet(wb, ws, t);
      }

      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const nome = `financeiro-${ts}.xlsx`;
      XLSX.writeFile(wb, nome);

      const { data: lancData } = await supabase.from('lancamentos').select('id', { count: 'exact', head: true });
      const kb = 50; // estimativa
      await supabase.from('backups_log').insert({ nome, tipo: 'xlsx', tamanho_kb: kb, criado_por: userName });
      await loadBackups();
      showAlert('Excel exportado com sucesso!', 'sucesso');
      void lancData;
    } catch (e) {
      showAlert('Erro ao exportar: ' + (e instanceof Error ? e.message : String(e)), 'erro');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // ─── Importar Excel ────────────────────────────────────────────────────────
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading(true);
    setProgress('Lendo Excel...');
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

      let importados = 0;
      for (const t of ALL_TABLES) {
        const ws = wb.Sheets[t];
        if (!ws) continue;
        setProgress(`Importando ${t}...`);
        const rawRows = (XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]).map(normalizeDates);
        if (rawRows.length === 0) continue;
        const pk = TABLE_PK[t];
        await supabase.from(t).delete().neq(pk, 0);
        const rows = stripGenerated(t, rawRows);
        const chunkSize = 500;
        for (let i = 0; i < rows.length; i += chunkSize) {
          const { error } = await supabase.from(t).insert(rows.slice(i, i + chunkSize) as never);
          if (error) throw new Error(`Erro importando ${t}: ${error.message}`);
        }
        importados += rows.length;
      }

      showAlert(`Importação concluída! ${importados} registros importados.`, 'sucesso');
    } catch (e) {
      showAlert('Erro na importação: ' + (e instanceof Error ? e.message : String(e)), 'erro');
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  // ─── Excluir log de backup ─────────────────────────────────────────────────
  const excluirLog = async (id: number) => {
    await supabase.from('backups_log').delete().eq('id', id);
    loadBackups();
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      {/* Header */}
      <div className="flex items-center px-4 py-2 gap-3" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
          <ChevronLeft size={16} /> Menu
        </button>
        <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        <span className="text-white font-bold text-sm flex items-center gap-2">
          <Database size={18} /> Manutenção do Sistema
        </span>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">

        {/* Progress */}
        {loading && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3 text-green-700 text-sm font-medium">
            <RefreshCw size={16} className="animate-spin flex-shrink-0" />
            {progress || 'Processando...'}
          </div>
        )}

        {/* Ações principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* BKP JSON */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
              <Database size={18} className="text-slate-500" /> Backup JSON
            </div>
            <p className="text-xs text-gray-500">Exporta todos os dados (lançamentos, bancos, fornecedores, classificações) em formato JSON. Ideal para backup completo e restauração posterior.</p>
            <button
              onClick={gerarBackup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              <Download size={15} /> Gerar e Baixar Backup
            </button>
          </div>

          {/* Restaurar JSON */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2 text-orange-700 font-bold text-sm">
              <Upload size={18} className="text-orange-500" /> Restaurar Backup JSON
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-red-600 font-semibold">Atenção:</span> sobrescreve todos os dados atuais com os do arquivo. Faça um backup antes de restaurar.
            </p>
            <input ref={fileRef} type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              <Upload size={15} /> Selecionar Arquivo JSON
            </button>
          </div>

          {/* Export Excel */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              <FileSpreadsheet size={18} className="text-green-600" /> Exportar para Excel
            </div>
            <p className="text-xs text-gray-500">Gera um arquivo .xlsx com abas separadas para cada tabela. Útil para análises e compartilhamento.</p>
            <button
              onClick={exportarExcel}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              <FileSpreadsheet size={15} /> Exportar Excel
            </button>
          </div>

          {/* Importar Excel */}
          <div className="bg-white rounded-xl shadow-sm p-5 space-y-3 border border-gray-100">
            <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
              <Upload size={18} className="text-green-600" /> Importar do Excel
            </div>
            <p className="text-xs text-gray-500">
              <span className="text-red-600 font-semibold">Atenção:</span> importa dados de um .xlsx exportado por este sistema. Substitui os dados existentes.
            </p>
            <input ref={excelRef} type="file" accept=".xlsx,.xls" onChange={handleExcelImport} className="hidden" />
            <button
              onClick={() => excelRef.current?.click()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg transition-colors text-sm"
            >
              <Upload size={15} /> Selecionar Excel para Importar
            </button>
          </div>
        </div>

        {/* Histórico de backups */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-green-700 px-4 py-2.5 flex items-center gap-2">
            <Clock size={15} className="text-slate-300" />
            <span className="text-white font-bold text-sm">Histórico de Backups</span>
            <span className="ml-auto text-slate-400 text-xs">{backups.length} registro(s)</span>
          </div>
          {backups.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">Nenhum backup registrado</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-left font-semibold border-b">Arquivo</th>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-center font-semibold border-b w-16">Tipo</th>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-right font-semibold border-b w-20">Tamanho</th>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-left font-semibold border-b">Data</th>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-left font-semibold border-b">Por</th>
                  <th className="bg-gray-50 text-gray-600 text-xs px-4 py-2 text-center font-semibold border-b w-16">Ação</th>
                </tr>
              </thead>
              <tbody>
                {backups.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 border-b border-gray-50">
                    <td className="px-4 py-2 text-xs text-gray-700 font-medium truncate max-w-[220px]">
                      <span className="flex items-center gap-1">
                        {b.tipo === 'xlsx'
                          ? <FileSpreadsheet size={13} className="text-green-600 flex-shrink-0" />
                          : <Database size={13} className="text-slate-500 flex-shrink-0" />}
                        {b.nome}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-center">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-xs ${b.tipo === 'xlsx' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                        {b.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-right text-gray-500">{b.tamanho_kb} KB</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{fmtDate(b.created_at)}</td>
                    <td className="px-4 py-2 text-xs text-gray-600">{b.criado_por}</td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => excluirLog(b.id)} className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors" title="Remover do histórico">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de confirmação de restore */}
      {confirmRestore && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center gap-3 bg-orange-600 px-5 py-4">
              <AlertTriangle size={22} className="text-white" />
              <span className="text-white font-bold">Confirmar Restauração</span>
            </div>
            <div className="px-5 py-5 space-y-4">
              <p className="text-gray-700 text-sm">Você está prestes a restaurar o banco de dados com o arquivo:</p>
              <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono text-gray-700 break-all">{confirmRestore}</div>
              <p className="text-red-600 text-xs font-semibold flex items-center gap-1">
                <AlertTriangle size={13} /> Todos os dados atuais serão substituídos. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmRestore(null)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg hover:bg-gray-50 text-sm">Cancelar</button>
                <button
                  onClick={async () => {
                    if (!pendingRestoreFile.current) return;
                    await executarRestore(pendingRestoreFile.current);
                    pendingRestoreFile.current = null;
                  }}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle size={15} /> Restaurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
