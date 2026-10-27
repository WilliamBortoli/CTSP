-- =====================================================================
-- Preparatório CTSP · banco de dados no Supabase
-- Como usar: no painel do Supabase, abra "SQL Editor", clique em
-- "New query", cole TODO este arquivo e clique em "Run".
-- Pode rodar de novo sem problema: ele não apaga dados existentes.
--
-- As contas são criadas aqui dentro (já confirmadas), sem e-mail de verdade:
-- o usuário "joao" entra como joao@aluno.ctsp.app. Esse domínio precisa ser
-- o mesmo de "dominioLogin" no arquivo js/config.js.
--
-- Depois de rodar este arquivo, defina o código de instalação (só a
-- administradora sabe; é pedido uma única vez, no primeiro acesso):
--   insert into privado.config (chave, valor)
--   values ('codigo_instalacao', extensions.crypt('SEU-CODIGO', extensions.gen_salt('bf')))
--   on conflict (chave) do update set valor = excluded.valor;
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- Esquema privado: o site não enxerga nada daqui.
create schema if not exists privado;

create table if not exists privado.config (
  chave text primary key,
  valor text not null
);

-- ---------- perfis: um por aluno (e pela administradora) ----------
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text not null unique check (usuario ~ '^[a-z0-9._-]{3,30}$'),
  nome text not null default '',
  guerra text not null default '',
  idf text unique,
  btl text not null default '',
  crbm text not null default '',
  incl date,
  foto text,
  papel text not null default 'aluno' check (papel in ('aluno', 'admin')),
  ativo boolean not null default true,
  senha_provisoria boolean not null default true,
  criado_em timestamptz not null default now(),
  ultimo_acesso timestamptz
);

-- ---------- progresso: um registro por aluno, com tudo em JSON ----------
create table if not exists public.progresso (
  user_id uuid primary key references public.perfis (id) on delete cascade,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;
alter table public.progresso enable row level security;

-- ---------- funções auxiliares ----------
create or replace function public.eh_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'admin' and ativo);
$$;

create or replace function public.eh_ativo()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and ativo);
$$;

-- Diz se já existe administradora (a tela de entrada usa isso no primeiro acesso).
create or replace function public.existe_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where papel = 'admin');
$$;

-- Cria a conta de login, já confirmada (uso interno; o site não alcança).
create or replace function privado.criar_login(p_usuario text, p_senha text)
returns uuid language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_id uuid := gen_random_uuid();
  v_email text := lower(p_usuario) || '@aluno.ctsp.app';
begin
  if lower(coalesce(p_usuario, '')) !~ '^[a-z0-9._-]{3,30}$' then raise exception 'usuario_invalido'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'senha_curta'; end if;
  if exists (select 1 from public.perfis where usuario = lower(p_usuario))
     or exists (select 1 from auth.users where email = v_email) then
    raise exception 'usuario_existe';
  end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
    extensions.crypt(p_senha, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text, 'email',
    jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false), now(), now(), now());
  return v_id;
end;
$$;

-- Primeiro acesso: cria a administradora, só com o código de instalação
-- e só se ainda não houver nenhuma.
create or replace function public.criar_admin_inicial(p_codigo text, p_usuario text, p_senha text, p_nome text, p_guerra text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare
  v_hash text;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(424242);
  if exists (select 1 from public.perfis where papel = 'admin') then return false; end if;
  select valor into v_hash from privado.config where chave = 'codigo_instalacao';
  if v_hash is null or extensions.crypt(coalesce(p_codigo, ''), v_hash) <> v_hash then
    raise exception 'codigo_invalido';
  end if;
  v_id := privado.criar_login(p_usuario, p_senha);
  insert into public.perfis (id, usuario, nome, guerra, papel, ativo, senha_provisoria)
  values (v_id, lower(p_usuario), coalesce(trim(p_nome), ''), coalesce(trim(p_guerra), ''), 'admin', true, false);
  insert into public.progresso (user_id) values (v_id);
  return true;
end;
$$;

-- A administradora cria o acesso de um colega (com senha provisória).
create or replace function public.admin_criar_aluno(p_usuario text, p_senha text, p_nome text, p_guerra text,
  p_idf text default null, p_btl text default '', p_crbm text default '')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare v_id uuid;
begin
  if not public.eh_admin() then raise exception 'apenas a administradora'; end if;
  if nullif(trim(p_idf), '') is not null and exists (select 1 from public.perfis where idf = trim(p_idf)) then
    raise exception 'idf_existe';
  end if;
  v_id := privado.criar_login(p_usuario, p_senha);
  insert into public.perfis (id, usuario, nome, guerra, idf, btl, crbm, papel, ativo, senha_provisoria)
  values (v_id, lower(p_usuario), coalesce(trim(p_nome), ''), coalesce(trim(p_guerra), ''), nullif(trim(p_idf), ''),
    coalesce(p_btl, ''), coalesce(p_crbm, ''), 'aluno', true, true);
  insert into public.progresso (user_id) values (v_id);
  return v_id;
end;
$$;

-- A administradora redefine a senha de um aluno (senha provisória).
create or replace function public.admin_redefinir_senha(p_alvo uuid, p_senha text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
begin
  if not public.eh_admin() then raise exception 'apenas a administradora'; end if;
  if length(coalesce(p_senha, '')) < 6 then raise exception 'senha_curta'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_senha, extensions.gen_salt('bf')), updated_at = now()
  where id = p_alvo;
  update public.perfis set senha_provisoria = true where id = p_alvo;
end;
$$;

-- A administradora exclui um aluno (apaga a conta e o progresso).
create or replace function public.admin_excluir_aluno(p_alvo uuid)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.eh_admin() then raise exception 'apenas a administradora'; end if;
  if p_alvo = auth.uid() then raise exception 'não é possível excluir a própria conta'; end if;
  delete from auth.users where id = p_alvo;
end;
$$;

-- O aluno não pode mudar o próprio papel, situação, usuário ou identidade funcional.
create or replace function public.proteger_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.eh_admin() then return new; end if;
  if new.papel is distinct from old.papel or new.ativo is distinct from old.ativo
     or new.usuario is distinct from old.usuario or new.idf is distinct from old.idf
     or new.criado_em is distinct from old.criado_em then
    raise exception 'campo reservado à administradora';
  end if;
  if new.senha_provisoria and not old.senha_provisoria then
    raise exception 'campo reservado à administradora';
  end if;
  return new;
end;
$$;
create or replace trigger trg_proteger_perfil before update on public.perfis
for each row execute function public.proteger_perfil();

-- ---------- regras de acesso (RLS) ----------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_ler') then
    create policy perfis_ler on public.perfis for select to authenticated
      using (id = (select auth.uid()) or public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_criar') then
    create policy perfis_criar on public.perfis for insert to authenticated
      with check (public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_editar') then
    create policy perfis_editar on public.perfis for update to authenticated
      using (id = (select auth.uid()) or public.eh_admin())
      with check (id = (select auth.uid()) or public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_apagar') then
    create policy perfis_apagar on public.perfis for delete to authenticated
      using (public.eh_admin() and id <> (select auth.uid()));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'progresso_ler') then
    create policy progresso_ler on public.progresso for select to authenticated
      using (user_id = (select auth.uid()) or public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'progresso_criar') then
    create policy progresso_criar on public.progresso for insert to authenticated
      with check ((user_id = (select auth.uid()) and public.eh_ativo()) or public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'progresso_editar') then
    create policy progresso_editar on public.progresso for update to authenticated
      using (user_id = (select auth.uid()) and public.eh_ativo())
      with check (user_id = (select auth.uid()) and public.eh_ativo());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'progresso_apagar') then
    create policy progresso_apagar on public.progresso for delete to authenticated
      using (public.eh_admin());
  end if;
end $$;

-- ---------- permissões ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.perfis, public.progresso to authenticated;
grant execute on function public.criar_admin_inicial(text, text, text, text, text) to anon, authenticated;
grant execute on function public.existe_admin() to anon, authenticated;
grant execute on function public.eh_admin(), public.eh_ativo() to authenticated;
grant execute on function public.admin_criar_aluno(text, text, text, text, text, text, text),
  public.admin_redefinir_senha(uuid, text), public.admin_excluir_aluno(uuid) to authenticated;
revoke execute on function public.admin_criar_aluno(text, text, text, text, text, text, text),
  public.admin_redefinir_senha(uuid, text), public.admin_excluir_aluno(uuid),
  public.eh_admin(), public.eh_ativo() from public, anon;
