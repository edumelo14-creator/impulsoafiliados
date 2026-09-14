/*
# Adicionar tabelas auxiliares e campo classificacao

1. Novas tabelas
   - `usuarios_app`: usuários do sistema (login customizado, não usa auth.users)
     - id (serial PK), nome, senha_hash, deve_trocar_senha, ativo, created_at
   - `classificacoes`: categorias dos lançamentos
     - codigo (serial PK), nome, ativo

2. Alterações
   - `bancos`: adiciona coluna `codigo` serial único (se não existir)
   - `fornecedores`: adiciona coluna `codigo` serial único (se não existir)
   - `lancamentos`: adiciona coluna `classificacao` text (se não existir)

3. Segurança
   - RLS habilitado em todas, acesso público (anon+authenticated) pois app usa auth customizado
*/

-- ── usuarios_app ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios_app (
  id            serial PRIMARY KEY,
  nome          text NOT NULL UNIQUE,
  senha_hash    text NOT NULL,
  deve_trocar_senha boolean NOT NULL DEFAULT false,
  ativo         boolean NOT NULL DEFAULT true,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE usuarios_app ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_usuarios" ON usuarios_app;
CREATE POLICY "anon_select_usuarios" ON usuarios_app FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_usuarios" ON usuarios_app;
CREATE POLICY "anon_insert_usuarios" ON usuarios_app FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_usuarios" ON usuarios_app;
CREATE POLICY "anon_update_usuarios" ON usuarios_app FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_usuarios" ON usuarios_app;
CREATE POLICY "anon_delete_usuarios" ON usuarios_app FOR DELETE TO anon, authenticated USING (true);

-- ── classificacoes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classificacoes (
  codigo   serial PRIMARY KEY,
  nome     text NOT NULL UNIQUE,
  ativo    boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE classificacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_classif" ON classificacoes;
CREATE POLICY "anon_select_classif" ON classificacoes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_classif" ON classificacoes;
CREATE POLICY "anon_insert_classif" ON classificacoes FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_classif" ON classificacoes;
CREATE POLICY "anon_update_classif" ON classificacoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_classif" ON classificacoes;
CREATE POLICY "anon_delete_classif" ON classificacoes FOR DELETE TO anon, authenticated USING (true);

-- ── bancos: adiciona codigo se não existir ───────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bancos' AND column_name='codigo') THEN
    ALTER TABLE bancos ADD COLUMN codigo serial UNIQUE;
  END IF;
END $$;

-- ── fornecedores: adiciona codigo se não existir ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fornecedores' AND column_name='codigo') THEN
    ALTER TABLE fornecedores ADD COLUMN codigo serial UNIQUE;
  END IF;
END $$;

-- ── lancamentos: adiciona classificacao se não existir ───────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='lancamentos' AND column_name='classificacao') THEN
    ALTER TABLE lancamentos ADD COLUMN classificacao text DEFAULT '';
  END IF;
END $$;
