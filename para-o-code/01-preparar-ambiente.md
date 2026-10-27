# 1. Preparar o ambiente

1. Confirme as skills/plugins de `../INSTALAR.md` (`/plugin`, `/skills`).
2. Conecte o Supabase (conector MCP do Supabase ou CLI) e confira o projeto **CTSP** (ref `jxdrqqnjrfvktphcbvah`):
   tabelas `perfis`, `progresso`; funções `criar_admin_inicial`, `admin_criar_aluno`, `admin_redefinir_senha`, `admin_excluir_aluno`.
   Rode os avisos de segurança (advisors). Os avisos de "SECURITY DEFINER executável" são esperados: cada função confere quem chama.
3. Testes:
   ```bash
   npm i -D playwright && npx playwright install chromium
   cd docs && python -m http.server 8765   # deixe rodando
   node testes/teste.js http://localhost:8765/ prints   # deve terminar em "TUDO OK"
   ```
Pronto quando: os testes passam e o Supabase responde.
