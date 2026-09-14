
-- Bancos
CREATE TABLE IF NOT EXISTS bancos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Fornecedores
CREATE TABLE IF NOT EXISTS fornecedores (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Lançamentos Financeiros
CREATE TABLE IF NOT EXISTS lancamentos (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  data_lancamento date NOT NULL,
  data_vencimento date NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('Credito', 'Debito')),
  banco text NOT NULL,
  fornecedor text NOT NULL,
  valor numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_vencimento ON lancamentos(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamentos_banco ON lancamentos(banco);
CREATE INDEX IF NOT EXISTS idx_lancamentos_fornecedor ON lancamentos(fornecedor);
CREATE INDEX IF NOT EXISTS idx_lancamentos_tipo ON lancamentos(tipo);

-- RLS
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- Bancos: public read/write (sem auth por ora)
CREATE POLICY "public_select_bancos" ON bancos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_bancos" ON bancos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_bancos" ON bancos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_bancos" ON bancos FOR DELETE TO anon, authenticated USING (true);

-- Fornecedores: public read/write
CREATE POLICY "public_select_fornecedores" ON fornecedores FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_fornecedores" ON fornecedores FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_fornecedores" ON fornecedores FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_fornecedores" ON fornecedores FOR DELETE TO anon, authenticated USING (true);

-- Lançamentos: public read/write
CREATE POLICY "public_select_lancamentos" ON lancamentos FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_insert_lancamentos" ON lancamentos FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public_update_lancamentos" ON lancamentos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_delete_lancamentos" ON lancamentos FOR DELETE TO anon, authenticated USING (true);

-- Seed bancos
INSERT INTO bancos (nome) VALUES
  ('Banco do Brasil'),
  ('Caixa Econômica'),
  ('Itaú'),
  ('Bradesco'),
  ('Nubank'),
  ('Inter'),
  ('Santander'),
  ('Sicoob'),
  ('Sicredi'),
  ('XP Investimentos')
ON CONFLICT (nome) DO NOTHING;
