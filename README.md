# Preparatório CTSP

Site de estudo para o CTSP 2027 (2º Sargento BM-RS), feito para o grupo da ROCAM.
Cada colega entra com usuário e senha próprios; perfil e progresso ficam salvos na nuvem (Supabase),
então dá para estudar no celular e continuar no computador.

**Endereço do site:** https://williambortoli.github.io/CTSP/

> Site de estudo independente, sem vínculo oficial com a Brigada Militar.

## O que tem no site

- **Painel:** saudação com nome de guerra, missão do dia, acerto geral, dias seguidos, rumo ao corte (52/60 em 2026).
- **Plano semanal:** 26 semanas, de 26/10/2026 até a prova, com os tópicos de cada semana.
- **Matérias:** as 7 apostilas (93 tópicos), busca por assunto, "Dominei", revisão em 1 minuto e mini-teste.
  Revisão espaçada automática: o painel avisa 1, 7 e 30 dias depois de dominar um tópico.
- **Simulado:** por matéria ou geral, 3 níveis, corrigir na hora ou no final, e prova completa
  (60 questões na proporção do edital, 4 horas, mínimo por matéria).
- **Caderno de erros:** toda questão errada fica guardada até ser acertada.
- **Alunos (só a administradora):** criar acesso com senha provisória, bloquear, redefinir senha,
  excluir, ver o desempenho de cada um e baixar uma cópia de segurança.

## Primeiro uso (uma vez só)

1. **Terminar o banco de dados.** Quase tudo já está instalado no projeto **CTSP** do Supabase.
   Falta rodar um arquivo: entre em [supabase.com](https://supabase.com/dashboard) → projeto **CTSP** →
   **SQL Editor** → **New query** → cole todo o conteúdo de
   [`docs/supabase/completar.sql`](docs/supabase/completar.sql) → **Run**.
   Deve aparecer "Success. No rows returned". Sem isso o site entra, mas não salva o progresso.
2. **Fechar o cadastro aberto (recomendado).** No Supabase: **Authentication** → **Sign In / Providers** →
   desligue **Allow new users to sign up** e salve. O site cria as contas por dentro, então nada para de funcionar.
3. **Criar a administradora.** Abra o site → **Primeiro acesso: configurar a administradora** →
   informe o **código de instalação** (foi passado em particular, não fica aqui) e crie o seu usuário.
   Depois disso esse botão some.

## Dar acesso a um colega

Aba **Alunos** → **Novo aluno** → preencha nome, nome de guerra e identidade funcional.
O site sugere o usuário (ex.: `sd.silva`) e gera uma senha provisória (ex.: `ctsp-4821`).
Mande o link do site, o usuário e a senha. No primeiro login ele cria a senha dele.
Esqueceu a senha? Use o botão da chave para gerar outra provisória.

## Onde ficam as coisas

| Pasta | O que é |
|---|---|
| `docs/` | o site (é o que o GitHub Pages publica) |
| `docs/dados/banco.json` | banco de questões |
| `docs/js/conteudo.js` | apostilas, plano semanal e links de lei seca |
| `docs/js/config.js` | endereço e chave **pública** do Supabase |
| `docs/supabase/` | estrutura do banco de dados (`schema.sql`) e a parte final (`completar.sql`) |
| `programa/` | o programa para Windows e os arquivos dele (fonte das questões) |

## Segurança e cópias

- A chave em `config.js` é a chave pública (*publishable*); ela pode ficar no site. Quem protege os dados
  são as regras do banco: cada aluno só vê e altera o próprio progresso, e só a administradora mexe em contas.
  **Nunca** coloque a chave `service_role`/`secret` em nenhum arquivo daqui.
- Todo o histórico de mudanças do site fica no GitHub: qualquer arquivo pode voltar a uma versão anterior.
- O progresso dos alunos fica no Supabase. Na aba **Alunos**, **Cópia de segurança** baixa um arquivo com
  perfis e progresso de todos; vale guardar um de vez em quando.
- No plano gratuito, o Supabase pausa o projeto depois de 7 dias sem nenhum acesso. Se acontecer,
  é só entrar no painel do Supabase e clicar em **Restore**; os dados continuam lá.

## Formato do banco de questões

`docs/dados/banco.json` é uma lista de questões neste formato:

```json
{
  "mat": "pm",
  "nivel": 2,
  "enunciado": "Texto da questão",
  "alternativas": ["A", "B", "C", "D", "E"],
  "correta": 1,
  "explicacao": "Por que a B está certa",
  "fundamento": "CPM, art. 187"
}
```

Matérias: `li` Legislação Institucional, `pm` Penal Militar, `ppm` Processual Penal Militar,
`cf` Constitucional, `dp` Direito Penal, `pp` Processual Penal, `da` Administrativo.
`correta` começa em 0 (0 = A, 1 = B…). Níveis: 1 revisão direta, 2 casos do serviço, 3 padrão Fundatec.
