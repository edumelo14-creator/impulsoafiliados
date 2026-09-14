import * as XLSX from 'xlsx';

export type ImportType = 'vendas' | 'itens';

export type WorkerRequest = { buf: ArrayBuffer; importType: ImportType };
export type WorkerPreview = { num_cupom: unknown; [k: string]: unknown }[];
export type WorkerResponse =
  | { type: 'preview'; preview: WorkerPreview; total: number }
  | { type: 'done'; total: number }
  | { type: 'batch'; batch: Record<string, unknown>[]; index: number }
  | { type: 'error'; message: string };

const VENDAS_COLUMNS = [
  'num_cupom', 'data_emissao', 'id_cliente', 'nome_cliente',
  'id_operador', 'nome_usuario', 'status', 'hora',
  'vr_total_cupom', 'vr_pago', 'vr_recebido', 'vr_troco',
  'codigo_finalizadora', 'nome_finalizadora', 'vr_finalizadora',
  'id_nfce_numero', 'id_nfce_serie', 'cp_serie',
];

const ITENS_COLUMNS = [
  'num_cupom', 'codigo', 'posicao', 'cod_interno',
  'produto', 'unidade', 'vr_venda', 'quantidade',
  'vr_total', 'cancelado',
];

const VENDAS_ALIASES: Record<string, string> = {
  NUM_CUPOM: 'num_cupom', num_cupom: 'num_cupom', NUMCUPOM: 'num_cupom',
  DATA_EMISSAO: 'data_emissao', data_emissao: 'data_emissao', DataEmissao: 'data_emissao',
  ID_CLIENTE: 'id_cliente', id_cliente: 'id_cliente', IDCLIENTE: 'id_cliente',
  NOME: 'nome_cliente', nome_cliente: 'nome_cliente', NOME_CLIENTE: 'nome_cliente', NomeCliente: 'nome_cliente',
  ID_OPERADOR: 'id_operador', id_operador: 'id_operador', IDOPERADOR: 'id_operador',
  USUARIO: 'nome_usuario', nome_usuario: 'nome_usuario', NOME_USUARIO: 'nome_usuario',
  STATUS: 'status', status: 'status',
  HORA: 'hora', hora: 'hora',
  VR_TOTAL_CUPOM: 'vr_total_cupom', vr_total_cupom: 'vr_total_cupom', VRTOTALCUPOM: 'vr_total_cupom',
  VR_PAGO: 'vr_pago', vr_pago: 'vr_pago', VRPAGO: 'vr_pago',
  VR_RECEBIDO: 'vr_recebido', vr_recebido: 'vr_recebido', VRRECEBIDO: 'vr_recebido',
  VR_TROCO: 'vr_troco', vr_troco: 'vr_troco', VRTROCO: 'vr_troco',
  CODIGO: 'codigo_finalizadora', codigo: 'codigo_finalizadora',
  NOME_FINALIZADORA: 'nome_finalizadora', nome_finalizadora: 'nome_finalizadora', NomeFinalizadora: 'nome_finalizadora',
  VR_FINALIZADORA: 'vr_finalizadora', vr_finalizadora: 'vr_finalizadora', VRFINALIZADORA: 'vr_finalizadora',
  ID_NFCE_NUMERO: 'id_nfce_numero', id_nfce_numero: 'id_nfce_numero', IDNFCENUMERO: 'id_nfce_numero',
  ID_NFCE_SERIE: 'id_nfce_serie', id_nfce_serie: 'id_nfce_serie', IDNFCESERIE: 'id_nfce_serie',
  SERIE: 'cp_serie', cp_serie: 'cp_serie', CP_SERIE: 'cp_serie',
};

const ITENS_ALIASES: Record<string, string> = {
  ICP_NUMCUPOM: 'num_cupom', num_cupom: 'num_cupom', NUM_CUPOM: 'num_cupom', NUMCUPOM: 'num_cupom',
  ICP_CODIGO: 'codigo', codigo: 'codigo', ICP_POSICAO: 'posicao', posicao: 'posicao',
  ICP_CODPRODUTO: 'cod_interno', cod_interno: 'cod_interno', COD_INTERNO: 'cod_interno', CODINTERNO: 'cod_interno',
  ICP_NOMEPRODUTO: 'produto', produto: 'produto', ICP_UNIDADEPRODUTO: 'unidade', unidade: 'unidade', UNIDADE: 'unidade',
  ICP_VALORUNITPRODUTO: 'vr_venda', vr_venda: 'vr_venda', VR_VENDA: 'vr_venda',
  ICP_QUANTVENDIDA: 'quantidade', quantidade: 'quantidade', QUANTIDADE: 'quantidade',
  ICP_VALORTOTALPRODUTO: 'vr_total', vr_total: 'vr_total', VR_TOTAL: 'vr_total',
  ICP_PRODUTOCANCELADO: 'cancelado', cancelado: 'cancelado', CANCELADO: 'cancelado',
};

function normalizeRow(row: Record<string, unknown>, aliases: Record<string, string>, columns: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(row)) {
    const mapped = aliases[key] || aliases[key.toUpperCase()] || aliases[key.toLowerCase()] || key.toLowerCase();
    if (columns.includes(mapped)) out[mapped] = val;
  }
  return out;
}

function parseDate(val: unknown): string | null {
  if (val == null || val === '') return null;
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  const s = String(val).trim();
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

function parseNumber(val: unknown): number | null {
  if (val == null || val === '') return null;
  if (typeof val === 'number') return val;
  const s = String(val).replace(/[R$\s.]/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseString(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).trim();
  return s === '' ? null : s;
}

function parseInteger(val: unknown): number | null {
  if (val == null || val === '') return null;
  if (typeof val === 'number') return Math.trunc(val);
  const s = String(val).replace(/[^\d-]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function transformVenda(row: Record<string, unknown>) {
  return {
    num_cupom: parseInteger(row.num_cupom) ?? 0,
    data_emissao: parseDate(row.data_emissao),
    id_cliente: parseInteger(row.id_cliente),
    nome_cliente: parseString(row.nome_cliente),
    id_operador: parseInteger(row.id_operador),
    nome_usuario: parseString(row.nome_usuario),
    status: parseString(row.status),
    hora: parseString(row.hora),
    vr_total_cupom: parseNumber(row.vr_total_cupom),
    vr_pago: parseNumber(row.vr_pago),
    vr_recebido: parseNumber(row.vr_recebido),
    vr_troco: parseNumber(row.vr_troco),
    codigo_finalizadora: parseInteger(row.codigo_finalizadora),
    nome_finalizadora: parseString(row.nome_finalizadora),
    vr_finalizadora: parseNumber(row.vr_finalizadora),
    id_nfce_numero: parseInteger(row.id_nfce_numero),
    id_nfce_serie: parseString(row.id_nfce_serie),
    cp_serie: parseString(row.cp_serie),
  };
}

function transformItem(row: Record<string, unknown>) {
  return {
    num_cupom: parseInteger(row.num_cupom) ?? 0,
    codigo: parseInteger(row.codigo),
    posicao: parseInteger(row.posicao),
    cod_interno: parseString(row.cod_interno),
    produto: parseString(row.produto),
    unidade: parseString(row.unidade),
    vr_venda: parseNumber(row.vr_venda),
    quantidade: parseNumber(row.quantidade),
    vr_total: parseNumber(row.vr_total),
    cancelado: parseString(row.cancelado),
  };
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  try {
    const { buf, importType } = e.data;
    const wb = XLSX.read(buf, { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

    if (rawRows.length === 0) {
      const resp: WorkerResponse = { type: 'error', message: 'O arquivo está vazio.' };
      self.postMessage(resp);
      return;
    }

    const columns = importType === 'vendas' ? VENDAS_COLUMNS : ITENS_COLUMNS;
    const aliases = importType === 'vendas' ? VENDAS_ALIASES : ITENS_ALIASES;
    const transform = importType === 'vendas' ? transformVenda : transformItem;

    const normalized = rawRows.map(r => normalizeRow(r, aliases, columns));
    const hasKey = normalized.some(r => r[columns[0]] != null);
    if (!hasKey) {
      const resp: WorkerResponse = {
        type: 'error',
        message: `Coluna "${columns[0]}" não encontrada. Verifique o arquivo.`,
      };
      self.postMessage(resp);
      return;
    }

    const preview: WorkerPreview = normalized.slice(0, 5) as WorkerPreview;
    const previewResp: WorkerResponse = { type: 'preview', preview, total: rawRows.length };
    self.postMessage(previewResp);

    const BATCH = 500;
    const total = normalized.length;
    for (let i = 0; i < total; i += BATCH) {
      const batch = normalized.slice(i, i + BATCH).map(transform);
      const resp: WorkerResponse = { type: 'batch', batch, index: i };
      self.postMessage(resp);
    }

    const doneResp: WorkerResponse = { type: 'done', total };
    self.postMessage(doneResp);
  } catch (err) {
    const resp: WorkerResponse = { type: 'error', message: err instanceof Error ? err.message : String(err) };
    self.postMessage(resp);
  }
};
