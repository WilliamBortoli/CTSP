-- =====================================================================
-- Preparatório CTSP · última parte da instalação do banco
-- O resto já foi instalado. Falta só esta parte, que libera:
-- salvar o progresso, editar o perfil, redefinir senha e excluir aluno.
--
-- Como rodar: supabase.com → projeto CTSP → SQL Editor → New query →
-- cole TODO este arquivo → Run. Deve aparecer "Success. No rows returned".
-- Pode rodar de novo sem problema.
-- =====================================================================

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

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_editar') then
    create policy perfis_editar on public.perfis for update to authenticated
      using (id = (select auth.uid()) or public.eh_admin())
      with check (id = (select auth.uid()) or public.eh_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and policyname = 'perfis_apagar') then
    create policy perfis_apagar on public.perfis for delete to authenticated
      using (public.eh_admin() and id <> (select auth.uid()));
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

grant update, delete on public.perfis, public.progresso to authenticated;
grant execute on function public.admin_redefinir_senha(uuid, text), public.admin_excluir_aluno(uuid) to authenticated;

-- Quem não entrou no site não precisa chamar estas funções (a criação da administradora continua liberada).
revoke execute on function public.admin_criar_aluno(text, text, text, text, text, text, text),
  public.admin_redefinir_senha(uuid, text), public.admin_excluir_aluno(uuid),
  public.eh_admin(), public.eh_ativo() from public, anon;
