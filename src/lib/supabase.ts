import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'impulso-auth',
  },
});

export type LinkStatus = 'ready' | 'pending' | 'sent';
export type GroupStatus = 'active' | 'paused';
export type SendStatus = 'sent' | 'failed' | 'skipped';

export interface AffiliateLink {
  id: string;
  url: string;
  title: string;
  category: string | null;
  image_url: string | null;
  price: number | null;
  status: LinkStatus;
  created_at: string;
  item_id: string | null;
  store_name: string | null;
  commission_rate: string | null;
  commission: number | null;
  sales: number | null;
  product_url: string | null;
}

export interface WhatsappGroup {
  id: string;
  name: string;
  url: string | null;
  category: string | null;
  status: GroupStatus;
  created_at: string;
  telegram_chat_id: string | null;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  send_image: boolean;
  created_at: string;
}

export interface SendLogEntry {
  id: string;
  link_id: string | null;
  group_id: string | null;
  template_id: string | null;
  message_text: string;
  status: SendStatus;
  sent_at: string;
}

export interface SendLogWithDetails extends SendLogEntry {
  link_title?: string | null;
  link_url?: string | null;
  group_name?: string | null;
}

export interface AppSettings {
  id: number;
  max_sends_per_group_per_day: number;
  delay_seconds: number;
  store_name: string;
  affiliate_tag: string | null;
  telegram_bot_token: string | null;
  vitrine_logo_url: string | null;
  vitrine_hero_url: string | null;
}

export interface ProductData {
  image_url: string | null;
  price: number | null;
}

export interface VitrineVisitante {
  visitor_id: string;
  first_visit_at: string;
  last_visit_at: string;
  visit_count: number;
  cidade: string | null;
  regiao: string | null;
  pais: string | null;
  user_agent: string | null;
}

export type VitrineEventoTipo = 'pageview' | 'click_ver_oferta' | 'click_mais_detalhes';

export interface VitrineEvento {
  id: number;
  visitor_id: string;
  tipo: VitrineEventoTipo;
  link_id: string | null;
  link_titulo: string | null;
  link_url: string | null;
  cidade: string | null;
  criado_em: string;
}

/** Busca imagem e preço de um produto via edge function (segue redirects e extrai og:image + preço) */
export async function fetchProductData(url: string): Promise<ProductData> {
  try {
    const functionUrl = `${supabaseUrl}/functions/v1/fetch-product-image`;
    const resp = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ url }),
    });
    const data = await resp.json().catch(() => null);
    if (resp.ok) {
      return {
        image_url: data?.image_url ?? null,
        price: data?.price != null ? Number(data.price) : null,
      };
    }
    return { image_url: null, price: null };
  } catch {
    return { image_url: null, price: null };
  }
}

/** Compat: busca apenas a imagem */
export async function fetchProductImage(url: string): Promise<string | null> {
  const data = await fetchProductData(url);
  return data.image_url;
}
