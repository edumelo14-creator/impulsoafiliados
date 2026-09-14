-- Tabela de permissões por usuário e menu
CREATE TABLE IF NOT EXISTS usuario_permissoes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  menu text NOT NULL,
  permitido boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (usuario_id, menu)
);

ALTER TABLE usuario_permissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_permissoes" ON usuario_permissoes FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_permissoes" ON usuario_permissoes FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_permissoes" ON usuario_permissoes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_permissoes" ON usuario_permissoes FOR DELETE
  TO anon, authenticated USING (true);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_usuario_permissoes_usuario ON usuario_permissoes (usuario_id);

-- Função que garante permissões completas para o usuário "Adm"
CREATE OR REPLACE FUNCTION garantir_permissoes_adm()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  adm_id integer;
  menus text[] := ARRAY['lancamentos','bancos','fornecedores','classificacoes','usuarios','manutencao'];
  m text;
BEGIN
  SELECT id INTO adm_id FROM usuarios_app WHERE nome = 'Adm' LIMIT 1;
  IF adm_id IS NULL THEN
    RETURN;
  END IF;

  FOREACH m IN ARRAY menus LOOP
    INSERT INTO usuario_permissoes (usuario_id, menu, permitido)
    VALUES (adm_id, m, true)
    ON CONFLICT (usuario_id, menu) DO UPDATE SET permitido = true;
  END LOOP;

  -- Garante que o Adm esteja sempre ativo
  UPDATE usuarios_app SET ativo = true WHERE id = adm_id;
END;
$$;

-- Trigger: após insert/update em usuarios_app, se for Adm, garante permissões
CREATE OR REPLACE FUNCTION trg_adm_permissoes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.nome = 'Adm' THEN
    PERFORM garantir_permissoes_adm();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_usuarios_app_adm ON usuarios_app;
CREATE TRIGGER trg_usuarios_app_adm
  AFTER INSERT OR UPDATE ON usuarios_app
  FOR EACH ROW EXECUTE FUNCTION trg_adm_permissoes();

-- Garante permissões para todos os usuários existentes (todos os menus)
INSERT INTO usuario_permissoes (usuario_id, menu, permitido)
SELECT u.id, m.menu, true
FROM usuarios_app u
CROSS JOIN (VALUES
  ('lancamentos'), ('bancos'), ('fornecedores'),
  ('classificacoes'), ('usuarios'), ('manutencao')
) AS m(menu)
ON CONFLICT (usuario_id, menu) DO UPDATE SET permitido = true;

-- Executa para garantir permissões do Adm (caso exista)
SELECT garantir_permissoes_adm();
