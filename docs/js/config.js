/* Endereço e chave pública do projeto CTSP no Supabase.
   A chave "publishable" (sb_publishable_...) é pública por natureza: o que protege os dados
   são as regras de acesso do banco (supabase/schema.sql).
   NUNCA coloque aqui a chave "service_role" ou "secret". */
window.CTSP_CONFIG = {
  supabaseUrl: 'https://jxdrqqnjrfvktphcbvah.supabase.co',
  supabaseChave: 'sb_publishable_D9Cdpa45amrus2q80tRPFg_607Gy71L',
  dominioLogin: 'aluno.ctsp.app' // precisa ser igual ao domínio usado em supabase/schema.sql
};
