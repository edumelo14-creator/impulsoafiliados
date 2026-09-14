import { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft, Database, Upload, FileSpreadsheet, Loader2,
  CheckCircle, XCircle, Table2, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { supabase } from './lib/supabase';

type Props = { onBack: () => void; userName: string };

type ImportType = 'vendas' | 'itens';

type ImportStatus = 'idle' | 'parsing' | 'uploading' | 'done' | 'error';

type ImportResult = {
  total: number;
  inserted: number;
  errors: number;
  errorPreview?: string[];
};

type WorkerPreview = { num_cupom: unknown; [k: string]: unknown }[];

type WorkerMessage =
  | { type: 'preview'; preview: WorkerPreview; total: number }
  | { type: 'done'; total: number }
  | { type: 'batch'; batch: Record<string, unknown>[]; index: number }
  | { type: 'error'; message: string };

export default function ImportacaoPage({ onBack, userName }: Props) {
  const [importType, setImportType] = useState<ImportType>('vendas');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<WorkerPreview>([]);
  const [progress, setProgress] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const fileBufferRef = useRef<ArrayBuffer | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const batchQueueRef = useRef<Promise<void>>(Promise.resolve());
  const countersRef = useRef({ inserted: 0, errors: 0, errorList: [] as string[] });

  void userName;

  const tableName = importType === 'vendas' ? 'cupom_vendas' : 'cupom_itens';

  const cleanupWorker = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  };

  const handleFile = useCallback(async (file: File) => {
    setStatus('parsing');
    setResult(null);
    setPreview([]);
    setErrorMsg('');
    setFileName(file.name);
    setProgress(0);
    setProgressTotal(0);
    cleanupWorker();

    try {
      const buf = await file.arrayBuffer();
      fileBufferRef.current = buf;

      const worker = new Worker(new URL('./import-worker.ts', import.meta.url), { type: 'module' });
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        const msg = e.data;
        if (msg.type === 'preview') {
          setPreview(msg.preview);
          setProgressTotal(msg.total);
          setStatus('idle');
        } else if (msg.type === 'error') {
          setStatus('error');
          setErrorMsg(msg.message);
          cleanupWorker();
        }
      };

      worker.onerror = (e) => {
        setStatus('error');
        setErrorMsg(e.message || 'Erro ao processar arquivo.');
        cleanupWorker();
      };

      worker.postMessage({ buf, importType }, [buf]);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  }, [importType]);

  const doImport = async () => {
    if (!fileBufferRef.current) return;
    setStatus('uploading');
    setResult(null);
    setErrorMsg('');
    setProgress(0);

    countersRef.current = { inserted: 0, errors: 0, errorList: [] };

    const buf = fileBufferRef.current.slice(0);
    cleanupWorker();

    const worker = new Worker(new URL('./import-worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = async (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (msg.type === 'batch') {
        batchQueueRef.current = batchQueueRef.current.then(async () => {
          const batch = msg.batch;
          if (importType === 'vendas') {
            const { error } = await supabase
              .from('cupom_vendas')
              .upsert(batch, { onConflict: 'num_cupom,codigo_finalizadora' });
            if (error) {
              countersRef.current.errors += batch.length;
              if (countersRef.current.errorList.length < 5) countersRef.current.errorList.push(error.message);
            } else {
              countersRef.current.inserted += batch.length;
            }
          } else {
            const { error } = await supabase.from('cupom_itens').insert(batch);
            if (error) {
              countersRef.current.errors += batch.length;
              if (countersRef.current.errorList.length < 5) countersRef.current.errorList.push(error.message);
            } else {
              countersRef.current.inserted += batch.length;
            }
          }
          setProgress(prev => Math.min(prev + batch.length, progressTotal));
        });
      } else if (msg.type === 'done') {
        await batchQueueRef.current;
        const c = countersRef.current;
        setResult({ total: msg.total, inserted: c.inserted, errors: c.errors, errorPreview: c.errorList });
        setStatus('done');
        cleanupWorker();
      } else if (msg.type === 'error') {
        setStatus('error');
        setErrorMsg(msg.message);
        cleanupWorker();
      }
    };

    worker.onerror = (e) => {
      setStatus('error');
      setErrorMsg(e.message || 'Erro durante importação.');
      cleanupWorker();
    };

    worker.postMessage({ buf, importType }, [buf]);
  };

  const reset = () => {
    cleanupWorker();
    setStatus('idle');
    setResult(null);
    setPreview([]);
    setFileName('');
    setErrorMsg('');
    setProgress(0);
    setProgressTotal(0);
    fileBufferRef.current = null;
    if (fileRef.current) fileRef.current.value = '';
  };

  const switchType = (t: ImportType) => {
    setImportType(t);
    reset();
  };

  const previewCols = preview.length > 0
    ? Object.keys(preview[0]).filter(k => preview.some(r => r[k] != null)).slice(0, 8)
    : [];

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'Segoe UI', sans-serif" }}>
      <div className="flex items-center px-4 py-2 gap-3" style={{ background: 'linear-gradient(135deg, #1e5c1e, #2d7a2d)' }}>
        <button onClick={onBack} className="flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-sm px-3 py-1.5 rounded-md transition-colors">
          <ChevronLeft size={16} /> Menu
        </button>
        <img src="/image.png" alt="Hortifruti Avenida" className="h-8 w-auto" />
        <span className="text-white font-bold text-sm flex items-center gap-2">
          <Database size={18} /> Importação de Vendas
        </span>
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Table2 size={16} className="text-green-700" /> Tipo de Importação
            </h2>
          </div>
          <div className="p-4 flex gap-3">
            <button
              onClick={() => switchType('vendas')}
              className={`flex-1 border-2 rounded-lg p-4 text-left transition-all ${importType === 'vendas' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet size={18} className={importType === 'vendas' ? 'text-green-700' : 'text-gray-400'} />
                <span className={`font-bold text-sm ${importType === 'vendas' ? 'text-green-800' : 'text-gray-700'}`}>Dados da Venda</span>
              </div>
              <p className="text-xs text-gray-500">Cupom, cliente, operador, valores, finalizadora</p>
            </button>
            <button
              onClick={() => switchType('itens')}
              className={`flex-1 border-2 rounded-lg p-4 text-left transition-all ${importType === 'itens' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet size={18} className={importType === 'itens' ? 'text-green-700' : 'text-gray-400'} />
                <span className={`font-bold text-sm ${importType === 'itens' ? 'text-green-800' : 'text-gray-700'}`}>Itens da Venda</span>
              </div>
              <p className="text-xs text-gray-500">Produtos, quantidades, valores por item</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Upload size={16} className="text-green-700" /> Arquivo {importType === 'vendas' ? 'da Venda' : 'dos Itens'}
            </h2>
          </div>
          <div className="p-4 space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                file:text-sm file:font-semibold file:bg-green-50 file:text-green-700
                hover:file:bg-green-100 cursor-pointer"
            />

            {fileName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileSpreadsheet size={16} className="text-green-600" />
                <span className="font-medium">{fileName}</span>
              </div>
            )}

            {status === 'parsing' && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 size={16} className="animate-spin" /> Lendo arquivo... {progressTotal > 0 && `(${progressTotal} registros)`}
              </div>
            )}

            {status === 'error' && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  Importando... {progress} / {progressTotal} registros
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full bg-green-600 transition-all duration-300"
                    style={{ width: `${progressTotal > 0 ? (progress / progressTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}

            {status === 'done' && result && (
              <div className="space-y-3">
                <div className={`flex items-start gap-2 text-sm p-3 rounded-md border ${result.errors > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                  <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Importação concluída!</p>
                    <p className="text-xs mt-1">
                      {result.inserted} registro(s) importado(s) de {result.total} total.
                      {result.errors > 0 && ` ${result.errors} com erro.`}
                    </p>
                    {result.errorPreview && result.errorPreview.length > 0 && (
                      <ul className="text-xs mt-2 text-red-600 list-disc list-inside">
                        {result.errorPreview.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                </div>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm"
                >
                  <RefreshCw size={15} /> Importar outro arquivo
                </button>
              </div>
            )}

            {preview.length > 0 && status === 'idle' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Pré-visualização (5 primeiras linhas):</p>
                  <div className="overflow-x-auto border border-gray-200 rounded-md">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {previewCols.map(col => (
                            <th key={col} className="px-3 py-2 text-left font-bold text-gray-700 border-b border-gray-200 whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="hover:bg-green-50">
                            {previewCols.map(col => (
                              <td key={col} className="px-3 py-1.5 text-gray-700 border-b border-gray-50 whitespace-nowrap font-mono">
                                {row[col] == null ? '' : String(row[col]).slice(0, 40)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <button
                  onClick={doImport}
                  disabled={status !== 'idle'}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-md transition-colors text-sm"
                >
                  <Upload size={16} /> Confirmar Importação ({importType === 'vendas' ? 'Vendas' : 'Itens'})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
          <strong>Como funciona:</strong> Exporte os dados do seu Interbase (IBExpert, FlameRobin, etc.) para Excel ou CSV.
          Selecione o tipo (Vendas ou Itens), carregue o arquivo, confira a pré-visualização e clique em "Confirmar Importação".
          Os registros são salvos no banco e relacionados pelo campo <strong>num_cupom</strong>.
          {importType === 'vendas'
            ? ' Tabela destino: cupom_vendas (atualiza se o num_cupom já existir).'
            : ' Tabela destino: cupom_itens (adiciona novos registros).'}
        </div>
      </div>
    </div>
  );
}
