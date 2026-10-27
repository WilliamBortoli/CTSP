# Para o Claude Code: continue daqui

Siga os arquivos em ordem. Cada um diz o que fazer, como conferir e quando parar para perguntar.

| # | Arquivo | Objetivo |
|---|---|---|
| 1 | 01-preparar-ambiente.md | Skills, Supabase conectado, testes rodando |
| 2 | 02-importar-questoes.md | Trazer as 2.000+ questões do programa do Windows |
| 3 | 03-integrar-material.md | Juntar apostilas/exercícios do programa com o site |
| 4 | 04-video-narracao.md | Narração, legenda e trilha no Reels |
| 5 | 05-revisao-e-lancamento.md | Checagem final antes de divulgar |

Regras fixas:
- Responder sempre em português.
- **Não inventar** questão, lei, artigo ou número. Só migrar o que já existe e conferir.
- Nunca colocar chave `service_role` / `secret` do Supabase no site (só a publicável, já em `docs/js/config.js`).
- Rodar os testes (`testes/teste.js`) depois de qualquer mudança no site.
- Commits pequenos, um por etapa; `git push` ao fim de cada etapa (o site atualiza sozinho pelo GitHub Pages).
- Contexto completo: `../PASSAGEM.md`. Instalação: `../INSTALAR.md`.
