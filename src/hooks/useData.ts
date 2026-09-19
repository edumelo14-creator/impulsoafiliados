import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  AffiliateLink,
  WhatsappGroup,
  MessageTemplate,
  SendLogEntry,
  SendLogWithDetails,
  AppSettings,
  VitrineVisitante,
  VitrineEvento,
} from '@/lib/supabase';

export function useSupabaseQuery<T>(
  fetcher: () => Promise<{ data: T | null; error: { message: string } | null }>,
  deps: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    setLoading(true);
    fetcher()
      .then(({ data: d, error: e }) => {
        if (e) setError(e.message);
        else {
          setData(d);
          setError(null);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, error, loading, refetch };
}

export function useLinks() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('affiliate_links')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    const links: AffiliateLink[] = (data ?? []).map((l) => ({
      ...l,
      price: l.price ? Number(l.price) : null,
      commission: l.commission ? Number(l.commission) : null,
    }));
    return { data: links, error: null };
  }, []);
}

export function useGroups() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('whatsapp_groups')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data as WhatsappGroup[], error: null };
  }, []);
}

export function useTemplates() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data as MessageTemplate[], error: null };
  }, []);
}

export function useSendLog(limit = 50) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('send_log')
      .select('*, link_title:affiliate_links(title), link_url:affiliate_links(url), group_name:whatsapp_groups(name)')
      .order('sent_at', { ascending: false })
      .limit(limit);
    if (error) return { data: null, error };
    const logs: SendLogWithDetails[] = (data ?? []).map((s) => ({
      id: s.id,
      link_id: s.link_id,
      group_id: s.group_id,
      template_id: s.template_id,
      message_text: s.message_text,
      status: s.status,
      sent_at: s.sent_at,
      link_title: (s.link_title as unknown as { title: string } | null)?.title ?? null,
      link_url: (s.link_url as unknown as { url: string } | null)?.url ?? null,
      group_name: (s.group_name as unknown as { name: string } | null)?.name ?? null,
    }));
    return { data: logs, error: null };
  }, [limit]);
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          setSettings(data as AppSettings);
        }
        setLoading(false);
      });
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    const { data, error } = await supabase
      .from('app_settings')
      .update(patch)
      .eq('id', 1)
      .select()
      .maybeSingle();
    if (!error && data) setSettings(data as AppSettings);
    return { error };
  }, []);

  return { settings, loading, update };
}

export function useSendCountToday(groupId?: string) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    supabase
      .from('send_log')
      .select('group_id, status')
      .gte('sent_at', todayStart.toISOString())
      .eq('status', 'sent')
      .then(({ data }) => {
        const map: Record<string, number> = {};
        for (const row of data ?? []) {
          const gid = row.group_id as string;
          if (gid) map[gid] = (map[gid] ?? 0) + 1;
        }
        setCounts(map);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getCount = (gid: string) => counts[gid] ?? 0;
  return { counts, getCount, refresh, loading };
}

export async function logSend(
  linkId: string | null,
  groupId: string | null,
  templateId: string | null,
  messageText: string,
  status: 'sent' | 'failed' | 'skipped' = 'sent',
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('send_log').insert({
    link_id: linkId,
    group_id: groupId,
    template_id: templateId,
    message_text: messageText,
    status,
  });
  return { error: error?.message ?? null };
}

export function useVisitantes() {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('vitrine_visitantes')
      .select('*')
      .order('last_visit_at', { ascending: false });
    if (error) return { data: null, error };
    return { data: data as VitrineVisitante[], error: null };
  }, []);
}

export function useEventosVitrine(limit = 300) {
  return useSupabaseQuery(async () => {
    const { data, error } = await supabase
      .from('vitrine_eventos')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit);
    if (error) return { data: null, error };
    return { data: data as VitrineEvento[], error: null };
  }, [limit]);
}

export type {
  AffiliateLink,
  WhatsappGroup,
  MessageTemplate,
  SendLogEntry,
  SendLogWithDetails,
  AppSettings,
  VitrineVisitante,
  VitrineEvento,
};
