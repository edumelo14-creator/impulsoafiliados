import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bszwdzqlcosjumsnctdo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzendkenFsY29zanVtc25jdGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkzMTMyMjMsImV4cCI6MjEwNDg4OTIyM30.JpgJDKITdQPxVgkXbbRKLeMm4NXfXB2FHFyn0nr18po';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Lancamento = {
  id: number;
  data_lancamento: string;
  data_vencimento: string;
  tipo: 'Credito' | 'Debito';
  codigo_banco: number | null;
  codigo_fornecedor: number | null;
  valor: number;
  created_at?: string;
  updated_at?: string;
};

export type LancamentoForm = Omit<Lancamento, 'id' | 'created_at' | 'updated_at'>;

export type Banco = { id: number; codigo: number; nome: string };

export type Fornecedor = {
  id: number;
  codigo: number;
  nome: string;
  codigo_classificacao?: number | null;
};

export type Classificacao = { codigo: number; nome: string; ativo: boolean };

export type BackupLog = {
  id: number;
  nome: string;
  tipo: string;
  tamanho_kb: number;
  criado_por: string;
  created_at: string;
};

export type UsuarioApp = {
  id: number;
  nome: string;
  senha_hash: string;
  deve_trocar_senha: boolean;
  ativo: boolean;
};

export type Permissao = {
  id: number;
  usuario_id: number;
  menu: string;
  permitido: boolean;
};

export type UsuarioFornecedor = {
  id: number;
  usuario_id: number;
  codigo_fornecedor: number;
};

export type CupomVenda = {
  num_cupom: number;
  data_emissao: string | null;
  id_cliente: number | null;
  nome_cliente: string | null;
  id_operador: number | null;
  nome_usuario: string | null;
  status: string | null;
  hora: string | null;
  vr_total_cupom: number | null;
  vr_pago: number | null;
  vr_recebido: number | null;
  vr_troco: number | null;
  codigo_finalizadora: number | null;
  nome_finalizadora: string | null;
  vr_finalizadora: number | null;
  id_nfce_numero: number | null;
  id_nfce_serie: string | null;
  cp_serie: string | null;
  created_at?: string;
};

export type CupomItem = {
  id?: number;
  num_cupom: number;
  codigo: number | null;
  posicao: number | null;
  cod_interno: string | null;
  produto: string | null;
  unidade: string | null;
  vr_venda: number | null;
  quantidade: number | null;
  vr_total: number | null;
  cancelado: string | null;
  created_at?: string;
};

export const MENUS = ['lancamentos', 'gerencial', 'bancos', 'fornecedores', 'classificacoes', 'usuarios', 'manutencao', 'importacao'] as const;
export type MenuKey = typeof MENUS[number];
