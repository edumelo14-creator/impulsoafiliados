/*
# Impulso Afiliado — Adaptação para Telegram

Adiciona suporte ao bot do Telegram para envio automático em grupos e canais.

## 1. Coluna nova em whatsapp_groups
- `telegram_chat_id` (text, nullable) — ID do chat no Telegram (grupo/canal/supergrupo).
  Quando preenchido, o envio é feito automaticamente pelo bot nesse chat.

## 2. Coluna nova em app_settings
- `telegram_bot_token` (text, nullable) — token do bot do Telegram (do @BotFather).
  É armazenado aqui (não em secrets de Edge Function) para simplicidade do fluxo.
  O acesso é protegido por RLS (anon CRUD neste app single-tenant sem login).
*/

ALTER TABLE whatsapp_groups
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

ALTER TABLE app_settings
  ADD COLUMN IF NOT EXISTS telegram_bot_token text;
