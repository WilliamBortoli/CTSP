# Fórmula do vídeo viral (qualquer tema)

Receita do vídeo de apresentação do CTSP, separada do CTSP: serve para zeladoria, condomínio,
assunto do momento, produto, serviço, campanha. Parte 1 é a história (o que dizer);
Parte 2 é o prompt pronto para colar numa conversa nova (como montar).

---

## Parte 1 — A fórmula da história (5 atos)

| Ato | Duração | O que é | Tipo de cena |
|---|---|---|---|
| 1. Dor | ~20% | 3 a 5 frases curtas com o incômodo do público, cada uma com um número ou imagem forte | Frase de impacto digitada |
| 2. Gatilho | 1 frase | A pergunta que todo mundo pensa ("Cansou?", "Já passou por isso?") | Impacto com tremor/glitch |
| 3. Virada | 1 frase | A promessa em poucas palavras ("Direto ao ponto.", "Resolvido em 1 clique.") | Impacto na cor de destaque |
| 4. Prova | ~45% | 5 a 8 provas concretas: telas, fotos, números, antes/depois. Uma ideia por cena, com selo curto | Tela com clique + contador |
| 5. Urgência + convite | ~20% | Frase de urgência ("A carreira não espera.") e o convite com a ação clara | Impacto + tela final |

**Regras de escrita**
- Frase falada: até ~12 palavras. Na tela: até 3 palavras por linha, 2 linhas no máximo.
- Fale com o público na língua dele ("tu"/"você", gírias da área).
- Números por extenso na fala ("dois mil e vinte e seis"); na tela, em algarismos ("2026").
- Nada que não seja verdade ou que você não possa mostrar. Dados de pessoas sempre fictícios.
- Último ato: uma ação só (pedir acesso, chamar no WhatsApp, seguir o perfil, ir ao endereço).

**Exemplos de adaptação**
- *Zeladoria de condomínio:* Dor: "Lixo acumulado.", "Portão quebrado há semanas.", "Ninguém responde o síndico." → Gatilho: "Cansou?" → Virada: "Condomínio em dia." → Prova: checklist, antes/depois, cronograma, relatório no celular → Urgência: "Teu prédio merece cuidado." → Convite: "Peça um orçamento".
- *Assunto do momento:* Dor: o que confunde as pessoas sobre o tema → Gatilho: "Ficou perdido?" → Virada: "Em 50 segundos, tu entende." → Prova: 5 fatos com número e fonte → Urgência: por que importa agora → Convite: "Segue para a parte 2".

---

## Parte 2 — Prompt para colar numa conversa nova

```
Quero um vídeo vertical (1080x1920), com no mínimo [DURAÇÃO, ex.: 50] segundos, sobre [TEMA],
para [PÚBLICO-ALVO]. Objetivo no fim: [AÇÃO, ex.: pedir orçamento pelo WhatsApp].
Material que tenho: [telas / fotos / site / números / nada — então use só texto e ícones].
Cores/identidade: [cor de destaque, logo, nome]. Responda sempre em português.

Use as skills hyperframes (montagem e render), voicestudio (narração local) e media-use (efeitos).

1) ROTEIRO — fórmula em 5 atos, uma cena por frase curta:
   Dor (3 a 5 frases de impacto) → Gatilho (pergunta curta) → Virada (promessa) →
   Prova (5 a 8 cenas concretas, cada uma com selo curto no topo) → Urgência + convite (tela final
   com logo, meta, botão de chamada pulsando e endereço/contato).
   Frase falada até ~12 palavras; na tela até 3 palavras por linha. Números por extenso na fala.
   Me mostre o roteiro (fala + o que aparece em cada cena) e ESPERE eu aprovar antes de montar.

2) NARRAÇÃO — uma voz só, sem cortes (VoiceStudio em http://localhost:3900):
   - Gere em blocos de até ~180 caracteres, todos clonando a MESMA voz de referência
     (POST /generate, multipart: text, language=pt, ref_audio, ref_text). Para a referência, gere
     uma frase curta com /v1/audio/speech e use esse áudio e o texto dele em todos os blocos.
     Texto longo numa chamada só trava o VoiceStudio.
   - Confira cada bloco pela transcrição (/v1/audio/transcriptions, whisper-1): compare palavra a
     palavra ignorando números; refaça até 3 vezes se faltar palavra ou cortar o fim.
   - Junte os blocos com ffmpeg: pausa de 0,25 s + acrossfade de 0,12 s.
   - Velocidade: atempo entre 1.0 e 1.3, calculado para a fala caber na duração pedida.
   - Transcreva o áudio final com timestamp por palavra (response_format=verbose_json,
     timestamp_granularities[]=word) e alinhe com o roteiro: cada cena começa na 1ª palavra da sua frase.
   - Se o VoiceStudio não responder em ~4 min, reinicie o app e tente de novo.

3) VISUAL — HyperFrames, sem legenda no rodapé, um gerador em Node que escreve o index.html:
   - Fundo escuro com grade sutil, uma fonte display forte e UMA cor de destaque.
   - Frase de impacto: letra por letra com som de digitação; ao terminar, "bate" na tela
     (escala 1.18→1, tremidinha elástica, flash branco de 0,3 s, grave de impacto).
     O "gatilho" ganha glitch; a "virada" ganha brilho na cor de destaque.
     Tamanho da letra calculado para a linha mais longa caber com margem.
   - Tela/foto de prova: dentro de uma "janela" com barra de título; um cursor entra pelo canto,
     clica no centro (anel de clique + som de clique) e o conteúdo surge dentro do painel; zoom lento.
   - Número grande: contador subindo até o valor, batida com flash no fim, selo embaixo.
   - Tela final: logo cai com quique, textos sobem um a um, botão de chamada pulsando, chime.
   - Saída de toda cena: zoom rápido + fade nos últimos 0,15 s.
   - Tudo numa timeline GSAP pausada e determinística (sem timers, sem random).

4) SOM:
   - Trilha local com MusicGen (facebook/musicgen-small), prompt do tipo "energetic cinematic trap beat,
     punchy drums, deep 808, rising synth, motivational, no vocals, 140 bpm" (ajuste ao tema),
     volume ~0.14, fade de entrada e saída, cortada no tamanho do vídeo.
   - Efeitos: digitação nas frases, clique nas telas, whoosh ao abrir telas, grave nas batidas,
     chime no final (sons da skill media-use).

5) TELAS REAIS (se houver site/app): capture com Playwright em tamanho de celular
   (deviceScaleFactor 2.5), escondendo avisos e pop-ups, com nomes e dados FICTÍCIOS.

6) PROCESSO E ENTREGA:
   roteiro aprovado → narração → gerador → `npx hyperframes check` sem erros →
   `npx hyperframes snapshot` com um quadro por cena e revisão (texto cortado, sobreposição,
   cena parada demais) → render → me mande o MP4 e diga o que não foi conferido
   (ex.: áudio não ouvido). Guarde o gerador para eu trocar só o roteiro depois.
   Não publique nem poste nada sem eu pedir.
```

---

## Para refazer rápido depois

- **Novo tema:** cole o prompt da Parte 2 com os colchetes preenchidos.
- **Mesmo tema, outro texto:** peça para editar só a lista de cenas do gerador e rodar de novo;
  os blocos de voz já aprovados ficam guardados e não são refeitos.
- **Modelo pronto:** o gerador original está em `para-o-code/scripts/video-apresentacao.mjs`
  e a narração em `para-o-code/scripts/voz.mjs` (repositório WilliamBortoli/CTSP).
