/*
# Create cupom_vendas and cupom_itens tables

1. New Tables
- `cupom_vendas` — stores sale/cupom header data imported from Interbase
  - num_cupom (integer, primary key) — cupom number, used to relate to cupom_itens
  - data_emissao (date) — emission date
  - id_cliente (integer) — client ID
  - nome_cliente (text) — client name
  - id_operador (integer) — operator/cashier ID
  - nome_usuario (text) — operator name
  - status (text) — cupom status
  - hora (text) — time of sale
  - vr_total_cupom (numeric) — total cupom value
  - vr_pago (numeric) — amount paid
  - vr_recebido (numeric) — amount received
  - vr_troco (numeric) — change given
  - codigo_finalizadora (integer) — payment method code
  - nome_finalizadora (text) — payment method name
  - vr_finalizadora (numeric) — payment method value
  - id_nfce_numero (integer) — NFCe number
  - id_nfce_serie (text) — NFCe series
  - cp_serie (text) — cupom series
  - created_at (timestamptz) — import timestamp

- `cupom_itens` — stores sale item/product data imported from Interbase
  - id (serial, primary key)
  - num_cupom (integer) — cupom number, relates to cupom_vendas.num_cupom
  - codigo (integer) — item code
  - posicao (integer) — item position
  - cod_interno (text) — internal product code
  - produto (text) — product name
  - unidade (text) — unit of measure
  - vr_venda (numeric) — unit sale price
  - quantidade (numeric) — quantity sold
  - vr_total (numeric) — total item value
  - cancelado (text) — whether item was cancelled
  - created_at (timestamptz) — import timestamp

2. Indexes
- idx_cupom_itens_num_cupom on cupom_itens(num_cupom) for join performance
- idx_cupom_vendas_data_emissao on cupom_vendas(data_emissao) for date filtering

3. Security
- RLS enabled on both tables
- anon + authenticated CRUD (single-tenant app, no sign-in required for import)
*/

CREATE TABLE IF NOT EXISTS cupom_vendas (
  num_cupom integer PRIMARY KEY,
  data_emissao date,
  id_cliente integer,
  nome_cliente text,
  id_operador integer,
  nome_usuario text,
  status text,
  hora text,
  vr_total_cupom numeric(14,2),
  vr_pago numeric(14,2),
  vr_recebido numeric(14,2),
  vr_troco numeric(14,2),
  codigo_finalizadora integer,
  nome_finalizadora text,
  vr_finalizadora numeric(14,2),
  id_nfce_numero integer,
  id_nfce_serie text,
  cp_serie text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cupom_itens (
  id serial PRIMARY KEY,
  num_cupom integer NOT NULL,
  codigo integer,
  posicao integer,
  cod_interno text,
  produto text,
  unidade text,
  vr_venda numeric(14,2),
  quantidade numeric(14,3),
  vr_total numeric(14,2),
  cancelado text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cupom_itens_num_cupom ON cupom_itens(num_cupom);
CREATE INDEX IF NOT EXISTS idx_cupom_vendas_data_emissao ON cupom_vendas(data_emissao);

ALTER TABLE cupom_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupom_itens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_cupom_vendas" ON cupom_vendas;
CREATE POLICY "anon_select_cupom_vendas" ON cupom_vendas FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cupom_vendas" ON cupom_vendas;
CREATE POLICY "anon_insert_cupom_vendas" ON cupom_vendas FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cupom_vendas" ON cupom_vendas;
CREATE POLICY "anon_update_cupom_vendas" ON cupom_vendas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cupom_vendas" ON cupom_vendas;
CREATE POLICY "anon_delete_cupom_vendas" ON cupom_vendas FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_cupom_itens" ON cupom_itens;
CREATE POLICY "anon_select_cupom_itens" ON cupom_itens FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cupom_itens" ON cupom_itens;
CREATE POLICY "anon_insert_cupom_itens" ON cupom_itens FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cupom_itens" ON cupom_itens;
CREATE POLICY "anon_update_cupom_itens" ON cupom_itens FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cupom_itens" ON cupom_itens;
CREATE POLICY "anon_delete_cupom_itens" ON cupom_itens FOR DELETE
  TO anon, authenticated USING (true);
