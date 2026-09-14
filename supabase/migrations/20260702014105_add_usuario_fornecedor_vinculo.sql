-- Tabela de vínculo entre usuário e fornecedor
CREATE TABLE IF NOT EXISTS usuario_fornecedor (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES usuarios_app(id) ON DELETE CASCADE,
  codigo_fornecedor integer NOT NULL REFERENCES fornecedores(codigo) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (usuario_id)
);

ALTER TABLE usuario_fornecedor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_usuario_fornecedor" ON usuario_fornecedor FOR SELECT
  TO anon, authenticated USING (true);
CREATE POLICY "insert_usuario_fornecedor" ON usuario_fornecedor FOR INSERT
  TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_usuario_fornecedor" ON usuario_fornecedor FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_usuario_fornecedor" ON usuario_fornecedor FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_usuario_fornecedor_usuario ON usuario_fornecedor (usuario_id);
