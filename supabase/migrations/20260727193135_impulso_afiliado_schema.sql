/*
# Impulso Afiliado — Schema do gerenciador de links de afiliado Shopee

App single-tenant (sem login) para organizar divulgação manual de links
de afiliado em grupos de WhatsApp. O envio é sempre manual — a ferramenta
apenas organiza, formata mensagens, gera previews e controla o histórico
de envios para evitar repetição excessiva (boa prática anti-banimento).

## 1. Novas tabelas

### affiliate_links
Links de afiliado importados pelo usuário.
- `id` (uuid, PK)
- `url` (text, único) — o link completo de afiliado
- `title` (text) — título/nome do produto (preenchido manualmente ou extraído)
- `category` (text, nullable) — categoria para organizar
- `image_url` (text, nullable) — URL da imagem de preview
- `price` (numeric, nullable) — preço se disponível
- `status` (text) — ready | pending | sent
- `created_at` (timestamptz)

### whatsapp_groups
Grupos de WhatsApp onde o usuário divulga.
- `id` (uuid, PK)
- `name` (text) — nome do grupo
- `url` (text, nullable) — link de convite do grupo (opcional)
- `category` (text, nullable) — categoria do grupo (ex: promoções, tech)
- `status` (text) — active | paused
- `created_at` (timestamptz)

### message_templates
Modelos de mensagem com placeholder {link}.
- `id` (uuid, PK)
- `name` (text) — nome do template
- `content` (text) — texto da mensagem, usa {link} como placeholder
- `is_default` (boolean) — se é o template padrão
- `created_at` (timestamptz)

### send_log
Registro de cada envio feito (manualmente) para controle e anti-repetição.
- `id` (uuid, PK)
- `link_id` (uuid, FK -> affiliate_links, ON DELETE SET NULL)
- `group_id` (uuid, FK -> whatsapp_groups, ON DELETE SET NULL)
- `template_id` (uuid, FK -> message_templates, ON DELETE SET NULL)
- `message_text` (text) — texto gerado enviado
- `status` (text) — sent | failed | skipped
- `sent_at` (timestamptz) — momento do envio

### app_settings
Configurações gerais do app (linha única).
- `id` (int, PK, sempre 1)
- `max_sends_per_group_per_day` (int) — limite por grupo/dia (padrão 3)
- `delay_seconds` (int) — intervalo recomendado entre envios (padrão 120)
- `store_name` (text) — nome da loja/afiliado
- `affiliate_tag` (text, nullable) — tag de afiliado padrão

## 2. Segurança (RLS)
- RLS habilitado em todas as tabelas.
- 4 políticas por tabela (SELECT/INSERT/UPDATE/DELETE) com `TO anon, authenticated`
  pois o app é single-tenant sem login — dados intencionalmente compartilhados.
- `USING (true)` / `WITH CHECK (true)` aceitáveis aqui por esse motivo.

## 3. Índices
- `affiliate_links(status)`, `affiliate_links(category)`
- `whatsapp_groups(status)`
- `send_log(link_id)`, `send_log(group_id)`, `send_log(sent_at)`
*/

CREATE TABLE IF NOT EXISTS affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  category text,
  image_url text,
  price numeric(10,2),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text,
  category text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES affiliate_links(id) ON DELETE SET NULL,
  group_id uuid REFERENCES whatsapp_groups(id) ON DELETE SET NULL,
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  message_text text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent',
  sent_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id int PRIMARY KEY DEFAULT 1,
  max_sends_per_group_per_day int NOT NULL DEFAULT 3,
  delay_seconds int NOT NULL DEFAULT 120,
  store_name text NOT NULL DEFAULT 'Minha Loja Afiliado',
  affiliate_tag text
);

-- Garante só uma linha de settings
INSERT INTO app_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Índices
CREATE INDEX IF NOT EXISTS idx_links_status ON affiliate_links(status);
CREATE INDEX IF NOT EXISTS idx_links_category ON affiliate_links(category);
CREATE INDEX IF NOT EXISTS idx_groups_status ON whatsapp_groups(status);
CREATE INDEX IF NOT EXISTS idx_log_link_id ON send_log(link_id);
CREATE INDEX IF NOT EXISTS idx_log_group_id ON send_log(group_id);
CREATE INDEX IF NOT EXISTS idx_log_sent_at ON send_log(sent_at);

-- ===== RLS =====
ALTER TABLE affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- affiliate_links
DROP POLICY IF EXISTS "anon_select_links" ON affiliate_links;
CREATE POLICY "anon_select_links" ON affiliate_links FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_links" ON affiliate_links;
CREATE POLICY "anon_insert_links" ON affiliate_links FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_links" ON affiliate_links;
CREATE POLICY "anon_update_links" ON affiliate_links FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_links" ON affiliate_links;
CREATE POLICY "anon_delete_links" ON affiliate_links FOR DELETE TO anon, authenticated USING (true);

-- whatsapp_groups
DROP POLICY IF EXISTS "anon_select_groups" ON whatsapp_groups;
CREATE POLICY "anon_select_groups" ON whatsapp_groups FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_groups" ON whatsapp_groups;
CREATE POLICY "anon_insert_groups" ON whatsapp_groups FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_groups" ON whatsapp_groups;
CREATE POLICY "anon_update_groups" ON whatsapp_groups FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_groups" ON whatsapp_groups;
CREATE POLICY "anon_delete_groups" ON whatsapp_groups FOR DELETE TO anon, authenticated USING (true);

-- message_templates
DROP POLICY IF EXISTS "anon_select_templates" ON message_templates;
CREATE POLICY "anon_select_templates" ON message_templates FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_templates" ON message_templates;
CREATE POLICY "anon_insert_templates" ON message_templates FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_templates" ON message_templates;
CREATE POLICY "anon_update_templates" ON message_templates FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_templates" ON message_templates;
CREATE POLICY "anon_delete_templates" ON message_templates FOR DELETE TO anon, authenticated USING (true);

-- send_log
DROP POLICY IF EXISTS "anon_select_log" ON send_log;
CREATE POLICY "anon_select_log" ON send_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_log" ON send_log;
CREATE POLICY "anon_insert_log" ON send_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_log" ON send_log;
CREATE POLICY "anon_update_log" ON send_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_log" ON send_log;
CREATE POLICY "anon_delete_log" ON send_log FOR DELETE TO anon, authenticated USING (true);

-- app_settings
DROP POLICY IF EXISTS "anon_select_settings" ON app_settings;
CREATE POLICY "anon_select_settings" ON app_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON app_settings;
CREATE POLICY "anon_insert_settings" ON app_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON app_settings;
CREATE POLICY "anon_update_settings" ON app_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON app_settings;
CREATE POLICY "anon_delete_settings" ON app_settings FOR DELETE TO anon, authenticated USING (true);
