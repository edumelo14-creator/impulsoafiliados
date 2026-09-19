import { supabase } from '@/lib/supabase';

const VISITOR_KEY = 'impulso-visitor-id';
const GEO_CACHE_KEY = 'impulso-geo-cache';

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** ID do visitante, gerado uma vez e guardado no navegador dele (é assim que sabemos se ele voltou). */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}

interface GeoInfo {
  city: string | null;
  region: string | null;
  country: string | null;
}

const EMPTY_GEO: GeoInfo = { city: null, region: null, country: null };

/** Cidade aproximada do visitante, via IP (serviço público, sem custo, sem chave). */
async function getGeoInfo(): Promise<GeoInfo> {
  try {
    const cached = sessionStorage.getItem(GEO_CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignora cache indisponível */
  }
  try {
    const resp = await fetch('https://ipapi.co/json/');
    if (!resp.ok) throw new Error('geo lookup failed');
    const data = await resp.json();
    const geo: GeoInfo = {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country_name ?? null,
    };
    try {
      sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(geo));
    } catch {
      /* ignora cache indisponível */
    }
    return geo;
  } catch {
    return EMPTY_GEO;
  }
}

let visitRegistered = false;

/** Registra a visita atual (1x por carregamento da página) — soma +1 se a pessoa já tinha vindo antes. */
export async function registerVisit(): Promise<void> {
  if (visitRegistered) return;
  visitRegistered = true;
  try {
    const visitorId = getVisitorId();
    const geo = await getGeoInfo();
    await supabase.rpc('registrar_visita_vitrine', {
      p_visitor_id: visitorId,
      p_cidade: geo.city,
      p_regiao: geo.region,
      p_pais: geo.country,
      p_user_agent: navigator.userAgent,
    });
  } catch {
    /* rastreamento nunca deve quebrar a vitrine para o visitante */
  }
}

/** Registra que o visitante clicou para comprar um produto. */
export async function logLinkClick(link: { id: string; title: string; url: string }): Promise<void> {
  try {
    const visitorId = getVisitorId();
    await supabase.from('vitrine_eventos').insert({
      visitor_id: visitorId,
      tipo: 'click',
      link_id: link.id,
      link_titulo: link.title,
      link_url: link.url,
    });
  } catch {
    /* rastreamento nunca deve quebrar a vitrine para o visitante */
  }
}
