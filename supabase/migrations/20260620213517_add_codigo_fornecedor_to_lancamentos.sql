ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS codigo_fornecedor integer DEFAULT NULL;

-- Preenche os registros existentes com o código do fornecedor correspondente
UPDATE lancamentos l
SET codigo_fornecedor = f.codigo
FROM fornecedores f
WHERE l.fornecedor = f.nome
  AND l.codigo_fornecedor IS NULL;
