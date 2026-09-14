-- 1. Adicionar codigo_banco em lancamentos
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS codigo_banco integer;

-- 2. Popular codigo_banco a partir do nome texto existente
UPDATE lancamentos l
SET codigo_banco = b.codigo
FROM bancos b
WHERE l.banco = b.nome;

-- 3. Adicionar codigo_classificacao em fornecedores
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS codigo_classificacao integer;

-- 4. Popular codigo_classificacao a partir do nome texto existente
UPDATE fornecedores f
SET codigo_classificacao = c.codigo
FROM classificacoes c
WHERE f.classificacao = c.nome;

-- 5. Remover colunas texto de lancamentos
ALTER TABLE lancamentos DROP COLUMN IF EXISTS fornecedor;
ALTER TABLE lancamentos DROP COLUMN IF EXISTS banco;
ALTER TABLE lancamentos DROP COLUMN IF EXISTS classificacao;

-- 6. Remover coluna texto de fornecedores
ALTER TABLE fornecedores DROP COLUMN IF EXISTS classificacao;

-- 7. Remover coluna id legada de fornecedores (codigo é a PK real)
-- Manter id em lancamentos pois é sua PK
-- Manter id em bancos pois é sua PK
