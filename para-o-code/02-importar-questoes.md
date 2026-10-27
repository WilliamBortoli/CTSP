# 2. Importar as questões do programa do Windows

O programa (feito no Claude Code, executável Windows, provavelmente Electron) tem 2.000+ questões. Hoje o site usa 84 (`docs/dados/banco.json`).

## Passos
1. **Achar a fonte.** Pergunte à Maiane onde está a pasta do projeto do programa. Se só houver o `.exe`/instalador:
   Electron → `npx @electron/asar extract resources/app.asar saida/` e procure `.json`/`.js` com as questões.
   Não modifique o programa original; trabalhe numa cópia.
2. **Converter** para o formato do site (lista JSON):
   `{"mat":"pm","nivel":2,"enunciado":"…","alternativas":["A","B","C","D","E"],"correta":1,"explicacao":"…","fundamento":"CPM, art. 187"}`
   - `mat`: `li` Legislação Institucional, `pm` Penal Militar, `ppm` Processual Penal Militar, `cf` Constitucional, `dp` Direito Penal, `pp` Processual Penal, `da` Administrativo.
   - `correta`: índice 0–4. `nivel`: 1 revisão, 2 casos do serviço, 3 padrão Fundatec (se o programa não tiver nível, use 2 e avise).
   - Escreva o conversor como script em `para-o-code/scripts/` (reprodutível), não à mão.
3. **Validar**: `node para-o-code/scripts/validar-banco.mjs docs/dados/banco.json`.
   Corrija ou separe (não descarte calado) o que falhar; liste para a Maiane as questões com dúvida de gabarito.
4. **Juntar** com as 84 atuais sem duplicar (o validador acusa enunciados repetidos).
5. **Conferir conteúdo** por amostragem (20 por matéria): gabarito bate com a explicação e com a lei atual? Leis mudaram em 2025–2026 (ver `../PASSAGEM.md` e as apostilas); questão desatualizada → marcar, não "consertar" inventando.
6. Rodar os testes, commit, push. O progresso dos alunos não se perde (ids das questões são o hash do texto).

Pronto quando: validador sem erros, cada matéria com questões suficientes para a prova completa (li 12, pm/ppm/cf/dp/pp/da 8 cada, em vários níveis) e testes passando.
