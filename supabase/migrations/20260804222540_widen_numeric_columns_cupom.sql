/*
# Widen numeric columns on cupom_vendas and cupom_itens

1. Problem
- 500 records failed with "numeric field overflow" during import.
- Columns defined as numeric(14,2) and numeric(14,3) are too narrow
  for some values in the Interbase export (e.g. quantities or amounts
  with more than 3 decimal places, or values exceeding 14 total digits).

2. Changes
- cupom_vendas: widen all numeric(14,2) columns to numeric(18,4)
- cupom_itens: widen vr_venda and vr_total to numeric(18,4),
  quantidade to numeric(18,6) (quantities can have many decimals)
*/

ALTER TABLE cupom_vendas
  ALTER COLUMN vr_total_cupom TYPE numeric(18,4),
  ALTER COLUMN vr_pago TYPE numeric(18,4),
  ALTER COLUMN vr_recebido TYPE numeric(18,4),
  ALTER COLUMN vr_troco TYPE numeric(18,4),
  ALTER COLUMN vr_finalizadora TYPE numeric(18,4);

ALTER TABLE cupom_itens
  ALTER COLUMN vr_venda TYPE numeric(18,4),
  ALTER COLUMN vr_total TYPE numeric(18,4),
  ALTER COLUMN quantidade TYPE numeric(18,6);
