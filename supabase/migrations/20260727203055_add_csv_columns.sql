/*
# Impulso Afiliado — Adicionar colunas do CSV de afiliado Shopee

Adapta a tabela affiliate_links para receber os dados do export CSV
do programa de afiliados Shopee, que contém: Item Id, Item Name, Price,
Sales, Nome da loja, Commission Rate, Commission, Product Link, Offer Link.

## 1. Tabela modificada: affiliate_links
Novas colunas adicionadas (todas nullable, não afetam dados existentes):
- `item_id` (text, nullable) — ID do produto na Shopee
- `store_name` (text, nullable) — nome da loja vendedora
- `commission_rate` (text, nullable) — taxa de comissão (ex: "3%")
- `commission` (numeric 10,2, nullable) — valor da comissão em R$
- `sales` (int, nullable) — número de vendas do produto
- `product_url` (text, nullable) — link completo do produto (Product Link)

A coluna `url` existente passa a guardar o Offer Link (link curto de afiliado)
quando importado via CSV. O Product Link completo fica em `product_url`.

## 2. Segurança
- Sem mudanças nas políticas RLS — as colunas novas são cobertas pelas
  políticas existentes (anon CRUD liberado).
- Sem operações destrutivas — apenas ADD COLUMN.
*/

ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS item_id text,
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS commission_rate text,
  ADD COLUMN IF NOT EXISTS commission numeric(10,2),
  ADD COLUMN IF NOT EXISTS sales int,
  ADD COLUMN IF NOT EXISTS product_url text;
