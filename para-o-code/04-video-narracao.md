# 4. Vídeo do Reels com narração

Projeto: `video/ctsp-reels` (HyperFrames 0.8.209, 1080x1920, 15 s). Use a skill `/hyperframes` e `/media-use`.

1. Narração: a Maiane gera o áudio (VoiceStudio ou outra IA) com o roteiro de `../PASSAGEM.md`, ou grava a própria voz. Salve em `video/ctsp-reels/assets/audio/narracao.mp3`.
2. Ajuste o tempo das cenas à fala (`index.html`, `data-start`/`data-duration`), coloque legenda (`references/captions.md`) e trilha + efeitos baixos (`/media-use`: música e os 19 efeitos inclusos).
3. Depois da etapa 2, pode trocar textos para citar o número real de questões.
4. `npx hyperframes check`, `snapshot --review`, `render`. Entregue o MP4.
