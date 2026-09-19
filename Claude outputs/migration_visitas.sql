-- Rastreamento de visitas da Vitrine (ImpulsoAfiliados)
-- Rode este script inteiro no Supabase: SQL Editor > New query > colar > Run

-- Visitante único (identificado por um ID gerado no navegador dele)
create table if not exists public.vitrine_visitantes (
  visitor_id uuid primary key,
  first_visit_at timestamptz not null default now(),
  last_visit_at timestamptz not null default now(),
  visit_count integer not null default 1,
  cidade text,
  regiao text,
  pais text,
  user_agent text
);

-- Eventos: cada visita (pageview) e cada clique em oferta
create table if not exists public.vitrine_eventos (
  id bigint generated always as identity primary key,
  visitor_id uuid not null references public.vitrine_visitantes(visitor_id) on delete cascade,
  tipo text not null check (tipo in ('pageview', 'click')),
  link_id uuid,
  link_titulo text,
  link_url text,
  cidade text,
  criado_em timestamptz not null default now()
);

create index if not exists idx_vitrine_eventos_visitor on public.vitrine_eventos(visitor_id);
create index if not exists idx_vitrine_eventos_criado_em on public.vitrine_eventos(criado_em desc);
create index if not exists idx_vitrine_eventos_tipo on public.vitrine_eventos(tipo);

alter table public.vitrine_visitantes enable row level security;
alter table public.vitrine_eventos enable row level security;

-- Qualquer visitante da vitrine pode registrar/atualizar a própria visita
drop policy if exists "anon insere visitante" on public.vitrine_visitantes;
create policy "anon insere visitante" on public.vitrine_visitantes
  for insert to anon with check (true);

drop policy if exists "anon atualiza visitante" on public.vitrine_visitantes;
create policy "anon atualiza visitante" on public.vitrine_visitantes
  for update to anon using (true) with check (true);

-- Qualquer visitante pode registrar eventos (pageview/clique)
drop policy if exists "anon insere evento" on public.vitrine_eventos;
create policy "anon insere evento" on public.vitrine_eventos
  for insert to anon with check (true);

-- Só o painel administrativo (logado) pode LER os dados de visitas
drop policy if exists "logado le visitantes" on public.vitrine_visitantes;
create policy "logado le visitantes" on public.vitrine_visitantes
  for select to authenticated using (true);

drop policy if exists "logado le eventos" on public.vitrine_eventos;
create policy "logado le eventos" on public.vitrine_eventos
  for select to authenticated using (true);

-- Função que registra a visita (soma +1 se a pessoa já veio antes) e o pageview, em um só passo
create or replace function public.registrar_visita_vitrine(
  p_visitor_id uuid,
  p_cidade text default null,
  p_regiao text default null,
  p_pais text default null,
  p_user_agent text default null
) returns void
language plpgsql
security invoker
as $$
begin
  insert into public.vitrine_visitantes (visitor_id, cidade, regiao, pais, user_agent)
  values (p_visitor_id, p_cidade, p_regiao, p_pais, p_user_agent)
  on conflict (visitor_id) do update
    set visit_count = public.vitrine_visitantes.visit_count + 1,
        last_visit_at = now(),
        cidade = coalesce(excluded.cidade, public.vitrine_visitantes.cidade),
        regiao = coalesce(excluded.regiao, public.vitrine_visitantes.regiao),
        pais = coalesce(excluded.pais, public.vitrine_visitantes.pais),
        user_agent = coalesce(excluded.user_agent, public.vitrine_visitantes.user_agent);

  insert into public.vitrine_eventos (visitor_id, tipo, cidade)
  values (p_visitor_id, 'pageview', p_cidade);
end;
$$;

grant execute on function public.registrar_visita_vitrine(uuid, text, text, text, text) to anon;
