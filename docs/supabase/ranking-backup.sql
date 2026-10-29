-- Ranking semanal e cópia de segurança diária (já aplicado no projeto CTSP em 29/10/2026).
-- Para recriar: SQL Editor do Supabase → cole este arquivo → Run.

-- Ranking da semana (segunda a domingo, horário de Brasília): pontos = questões feitas + 2 x acertos.
-- Só alunos ativos enxergam, e só nome de guerra, BPM e pontos dos colegas.
create or replace function public.ranking_semanal()
returns table (guerra text, btl text, pontos int, questoes int, acertos int, eu boolean)
language sql stable security definer set search_path = public as $$
  with ini as (select (date_trunc('week', (now() at time zone 'America/Sao_Paulo')))::date as d),
  s as (
    select p.id, p.guerra, p.btl,
           coalesce(sum((x->>'tot')::int), 0)::int as q,
           coalesce(sum((x->>'ok')::int), 0)::int as a
    from public.perfis p
    left join public.progresso g on g.user_id = p.id
    left join lateral jsonb_array_elements(coalesce(g.dados->'sims', '[]'::jsonb)) x on (x->>'d') >= (select d::text from ini)
    where p.ativo
    group by p.id, p.guerra, p.btl
  )
  select s.guerra, s.btl, (s.q + 2 * s.a)::int, s.q, s.a, s.id = auth.uid()
  from s where public.eh_ativo()
  order by 3 desc, s.guerra
  limit 50;
$$;
revoke all on function public.ranking_semanal() from public, anon;
grant execute on function public.ranking_semanal() to authenticated;

-- Cópia de segurança diária do progresso e dos perfis, guardada 35 dias no esquema privado.
create table if not exists privado.backup (
  dia date not null,
  user_id uuid not null,
  perfil jsonb not null,
  dados jsonb,
  primary key (dia, user_id)
);

-- Chamada pela tarefa agendada .github/workflows/manter-ativo.yml (com a chave pública): faz no máximo
-- uma cópia por dia e, de quebra, mantém o projeto gratuito ativo (ele pausa após 7 dias sem uso).
create or replace function public.manter_ativo()
returns int language plpgsql security definer set search_path = public, privado as $$
declare v_dia date := (now() at time zone 'America/Sao_Paulo')::date; n int;
begin
  insert into privado.backup (dia, user_id, perfil, dados)
  select v_dia, p.id, to_jsonb(p), g.dados from public.perfis p left join public.progresso g on g.user_id = p.id
  on conflict do nothing;
  get diagnostics n = row_count;
  delete from privado.backup where dia < v_dia - 35;
  return n;
end $$;
revoke all on function public.manter_ativo() from public;
grant execute on function public.manter_ativo() to anon, authenticated;

-- Restaurar o progresso de um aluno a partir de uma cópia (rode no SQL Editor, trocando o dia e o usuário):
-- update public.progresso g set dados = b.dados, atualizado_em = now()
--   from privado.backup b join public.perfis p on p.id = b.user_id
--   where b.user_id = g.user_id and b.dia = '2026-11-01' and p.usuario = 'sd.silva';
