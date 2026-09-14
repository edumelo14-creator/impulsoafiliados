-- Adiciona classificacao em fornecedores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='fornecedores' AND column_name='classificacao'
  ) THEN
    ALTER TABLE fornecedores ADD COLUMN classificacao text DEFAULT '';
  END IF;
END $$;

-- Tabela de controle de backups
CREATE TABLE IF NOT EXISTS backups_log (
  id          serial PRIMARY KEY,
  nome        text NOT NULL,
  tipo        text NOT NULL DEFAULT 'json',
  tamanho_kb  numeric(10,2),
  criado_por  text NOT NULL DEFAULT 'sistema',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE backups_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_backups" ON backups_log;
CREATE POLICY "anon_select_backups" ON backups_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_backups" ON backups_log;
CREATE POLICY "anon_insert_backups" ON backups_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_backups" ON backups_log;
CREATE POLICY "anon_delete_backups" ON backups_log FOR DELETE TO anon, authenticated USING (true);
