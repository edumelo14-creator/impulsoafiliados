/*
# Fix cupom_vendas primary key for multiple finalizadoras

1. Problem
- The original cupom_vendas table has num_cupom as PRIMARY KEY.
- The user's SQL query joins cupomabertura with cupomFinalizadora, producing
  multiple rows per num_cupom (one per payment method/financedora).
- Upsert with ON CONFLICT (num_cupom) fails: "ON CONFLICT DO UPDATE command
  cannot affect row a second time" when the batch has duplicate num_cupom values.

2. Changes
- Drop the PRIMARY KEY constraint on num_cupom.
- Add an auto-increment id column as the new PRIMARY KEY.
- Add a UNIQUE constraint on (num_cupom, codigo_finalizadora) so upsert
  can use ON CONFLICT (num_cupom, codigo_finalizadora) — each row is now
  one (cupom, finalizadora) pair, which matches the exported data.
- The num_cupom column remains for joining with cupom_itens.

3. Security
- No RLS changes — existing policies still apply.
*/

-- Add id column as new primary key
ALTER TABLE cupom_vendas ADD COLUMN IF NOT EXISTS id serial;

-- Drop old PK on num_cupom
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'cupom_vendas' AND constraint_type = 'PRIMARY KEY' AND constraint_name = 'cupom_vendas_pkey'
  ) THEN
    ALTER TABLE cupom_vendas DROP CONSTRAINT cupom_vendas_pkey;
  END IF;
END $$;

-- Set id as new PK
ALTER TABLE cupom_vendas ADD CONSTRAINT cupom_vendas_pkey PRIMARY KEY (id);

-- Add unique constraint for upsert on (num_cupom, codigo_finalizadora)
DROP INDEX IF EXISTS cupom_vendas_num_cupom_codigo_finalizadora_key;
CREATE UNIQUE INDEX IF NOT EXISTS cupom_vendas_num_cupom_codigo_finalizadora_key
  ON cupom_vendas (num_cupom, COALESCE(codigo_finalizadora, -1));
