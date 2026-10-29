# Prompt: vídeo vertical no formato "apresentação CTSP"

Copie o bloco abaixo numa conversa nova do Claude Code. Troque só o que está entre colchetes.

---

```
Quero um vídeo vertical (1080x1920) de [DURAÇÃO MÍNIMA, ex.: 50] segundos para [PÚBLICO-ALVO]
sobre [ASSUNTO/PRODUTO]. Objetivo: [O QUE A PESSOA DEVE SENTIR/FAZER NO FIM, ex.: pedir acesso].
Responda sempre em português.

Use as skills hyperframes (montagem e render), voicestudio (narração local) e media-use (efeitos).
Se existir o repositório https://github.com/WilliamBortoli/CTSP, use como modelo:
para-o-code/scripts/video-apresentacao.mjs (gerador do vídeo) e para-o-code/scripts/voz.mjs (narração).
Copie e adapte; não recrie do zero.

FORMATO (é o que funcionou):
1. Roteiro em 3 atos, uma cena por frase curta:
   - Dor (4 a 5 frases): o problema do público, frases de impacto curtas.
   - Virada (1 frase): a promessa, em dourado/cor de destaque.
   - Prova (6 a 8 cenas): telas reais do produto, cada uma com um selo curto no topo.
   - Fecho: frase de urgência + tela final com logo, meta, botão de chamada pulsando e endereço.
   Antes de montar, me mostre o roteiro (falas + o que aparece em cada cena) e espere eu aprovar.
2. Narração com UMA voz só, sem cortes:
   - Gere no VoiceStudio em blocos de até ~180 caracteres, todos clonando a MESMA voz de referência
     (POST /generate com ref_audio + ref_text). Texto longo numa chamada só trava o VoiceStudio.
   - Confira cada bloco pela transcrição (whisper); refaça até 3 vezes se faltar palavra.
   - Junte os blocos com acrossfade curto (~0,12 s) e uma pausa de ~0,25 s para respirar.
   - Escreva números por extenso na fala ("dois mil e vinte e seis"), senão a voz erra.
   - Ajuste a velocidade (atempo entre 1.0 e 1.3) para a narração caber na duração pedida.
   - Sincronize cada cena com a 1ª palavra da sua frase usando a transcrição com
     timestamp por palavra (response_format=verbose_json, timestamp_granularities[]=word).
3. Visual (sem legenda no rodapé):
   - Fundo escuro com grade sutil, fonte display forte (ex.: Chakra Petch) e uma cor de destaque.
   - Frases de impacto: aparecem letra por letra com som de digitação e, ao terminar, "batem" na
     tela (escala 1.18→1, tremidinha, flash branco rápido, grave de impacto). Uma delas com glitch.
     Tamanho da letra ajustado para a linha mais longa caber com margem.
   - Telas do produto: dentro de uma "janela" do app; um cursor entra pelo canto, clica no centro
     (anel de clique + som de clique) e o conteúdo surge dentro do painel; zoom lento depois.
   - Contadores para números grandes (sobe até o valor e bate com flash).
   - Saída de cada cena: zoom rápido + fade nos últimos 0,15 s.
4. Som: trilha enérgica gerada localmente com MusicGen (facebook/musicgen-small, ~140 bpm, sem voz)
   em volume baixo (~0.14), com fade de entrada e saída; whoosh nas telas, clique, digitação,
   grave nas frases de impacto e um chime no final.
5. Telas reais: capture com Playwright no tamanho de celular (deviceScaleFactor 2.5), escondendo
   avisos/toasts. Use nomes e dados FICTÍCIOS, nunca dados reais de pessoas.

PROCESSO:
- Roteiro aprovado → narração → montar → `npx hyperframes check` (sem erros) →
  `npx hyperframes snapshot` de um quadro por cena e revisar (texto cortado, sobreposição) →
  render → me mandar o MP4 e dizer o que não foi conferido (ex.: áudio não ouvido).
- O VoiceStudio às vezes congela: se não responder em ~4 min, reinicie o app e tente de novo.
- Não publique nem poste nada sem eu pedir.
```

---

## Dicas rápidas

- **Mudar só o texto:** edite a lista `cenas` em `video-apresentacao.mjs` e rode de novo; os blocos de voz já aprovados ficam guardados em `.falas` e não são refeitos.
- **Trocar a voz:** troque o arquivo de referência (`voz-ref.wav`) e o texto exato que ele fala.
- **Trilha:** `python para-o-code/scripts/gerar-trilha.py saida.wav 36 "descrição da música"`.
