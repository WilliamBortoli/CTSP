// Vídeo de apresentação do portal (vertical, ~50 s): dor dos cursos maçantes → virada → telas reais → convite.
// Uso: node para-o-code/scripts/video-apresentacao.mjs   (VoiceStudio aberto; ffmpeg no PATH;
//      telas em video/ctsp-apresenta/assets/img via capturar.cjs; trilha em assets/audio/trilha.wav via gerar-trilha.py)
// Narração corrida (uma voz, uma chamada); as cenas começam na primeira palavra de cada fala.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { narrarCorrido, ff } from './voz.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const dir = path.join(RAIZ, 'video/ctsp-apresenta');
const A = path.join(dir, 'assets');
const ALVO = 50; // duração mínima pedida (s)

// impacto: frase digitada que bate na tela; tela: janela do portal com clique; conta: contador; fim: convite
const cenas = [
  { tit: 'paginas', fala: 'Apostila de mil páginas.', tipo: 'impacto', txt: '1.000<br>PÁGINAS' },
  { tit: 'slide', fala: 'Aula de três horas no slide.', tipo: 'impacto', txt: '3 HORAS<br>DE SLIDE' },
  { tit: 'dicas', fala: 'E nenhuma dica de como a Fundatec cobra.', tipo: 'impacto', txt: '0 DICAS', cor: 'red' },
  { tit: 'cai', fala: 'Material que nem te diz o que mais cai na prova.', tipo: 'impacto', txt: 'O QUE CAI?<br>NINGUÉM DIZ.' },
  { tit: 'cansou', fala: 'Cansou?', tipo: 'impacto', txt: 'CANSOU?', glitch: true },
  { tit: 'virada', fala: 'E se estudar fosse direto ao ponto?', tipo: 'impacto', txt: 'DIRETO<br>AO PONTO.', cor: 'gold' },
  { tit: 'atalho', fala: 'No Preparatório CTSP, cada tópico vem com o atalho pra memorizar,', tipo: 'tela', img: 'atalho.png', selo: 'ATALHO MENTAL' },
  { tit: 'pegadinha', fala: 'a pegadinha que a banca adora,', tipo: 'tela', img: 'pegadinha.png', selo: 'PEGADINHA DA BANCA' },
  { tit: 'questao', fala: 'e questão que corrige e explica na hora.', tipo: 'tela', img: 'questao.png', alta: true, selo: 'EXPLICA NA HORA' },
  { tit: 'erros', fala: 'O que tu errar vai pro caderno de erros e volta até tu acertar.', tipo: 'tela', img: 'erros.png', alta: true, selo: 'CADERNO DE ERROS' },
  { tit: 'plano', fala: 'E um plano semana a semana, do diagnóstico até o dia da prova.', tipo: 'tela', img: 'plano.png', alta: true, selo: 'PLANO SEMANAL' },
  { tit: 'banco', fala: 'São quase duas mil questões, com a prova de dois mil e vinte e seis comentada.', tipo: 'conta', n: 1948, selo: 'PROVA 2026 COMENTADA' },
  { tit: 'revisao', fala: 'Cada matéria tem revisão em vídeo, rapidinha.', tipo: 'tela', img: 'revisao.png', alta: true, selo: 'REVISÃO EM VÍDEO' },
  { tit: 'ranking', fala: 'Simulado de quatro horas e ranking semanal com a tua turma.', tipo: 'tela', img: 'ranking.png', selo: 'RANKING DA SEMANA', chips: ['SIMULADO 4H'] },
  { tit: 'offline', fala: 'Funciona no celular, até sem internet.', tipo: 'impacto', txt: 'FUNCIONA<br>OFFLINE.', cor: 'gold' },
  { tit: 'carreira', fala: 'A tua carreira não pode esperar.', tipo: 'impacto', txt: 'A CARREIRA<br>NÃO ESPERA.' },
  { tit: 'fim', fala: 'Chega de curso maçante. Conhece o portal e alavanca a tua carreira rumo ao segundo sargento.', tipo: 'fim' },
];
for (const c of cenas) if (c.img && !fs.existsSync(path.join(A, 'img', c.img))) throw new Error('falta a tela ' + c.img + ' (rode capturar.cjs)');

// velocidade para a narração caber em ~ALVO s (nunca mais lenta que o normal nem acima de 1.3x)
const total = await narrarCorrido(cenas, dir, { VEL: bruto => +Math.min(1.3, Math.max(1, bruto / (ALVO - 1.5))).toFixed(3),
  ref: { audio: path.join(dir, 'voz-ref.wav'), texto: 'E um plano semana a semana, do diagnóstico até o dia da prova.' } });
const dur = +Math.max(total + 1.5, ALVO).toFixed(2);
cenas.at(-1).dur = +(dur - cenas.at(-1).ini).toFixed(2);

// trilha cortada no tamanho do vídeo, com entrada e saída suaves
const trilha = path.join(A, 'audio/trilha.wav');
if (fs.existsSync(trilha)) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', trilha, '-t', String(dur),
  '-af', `afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.5).toFixed(2)}:d=1.5`, '-b:a', '160k', path.join(A, 'audio/trilha.mp3')]);
// fontes, gsap, emblema e efeitos do Reels; clique e digitação do HyperFrames (media-use)
const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
for (const p of ['fonts', 'vendor', 'img/emblema.jpg', 'audio/sfx']) fs.cpSync(path.join(reels, p), path.join(A, p), { recursive: true });
const SFX = path.join(os.homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.209/skills/media-use/audio/assets/sfx');
for (const f of ['click-soft.mp3', 'typing.mp3']) fs.copyFileSync(path.join(SFX, f), path.join(A, 'audio/sfx', f));

// tempos de cada animação (os mesmos usados no HTML e nos sons)
const letras = h => h.replace(/<br>/g, '').length;
cenas.forEach(c => {
  if (c.tipo === 'impacto') { c.passo = +Math.min(0.045, (c.dur * 0.45) / letras(c.txt)).toFixed(4); c.digita = +(c.passo * letras(c.txt)).toFixed(2); }
  if (c.tipo === 'tela') c.clique = +Math.min(0.75, c.dur * 0.3).toFixed(2);
});

// cada letra num span para a digitação (o <br> fica)
const digitavel = h => h.split('<br>').map(l => [...l].map(ch => `<span class="ch">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')).join('<br>');
const corpo = c => {
  // linha mais longa cabe em ~880 px (cada letra da Chakra Petch tem ~0,62 da altura)
  if (c.tipo === 'impacto') return `<div class="big ${c.cor || ''}${c.glitch ? ' glitch' : ''}" style="font-size:${Math.min(170, Math.floor(880 / (0.62 * Math.max(...c.txt.split('<br>').map(l => l.length)))))}px">${digitavel(c.txt)}</div>`;
  if (c.tipo === 'conta') return `<div class="conta"><b data-n="${c.n}">0</b><span>QUESTÕES</span></div><div class="selo">${c.selo}</div>`;
  if (c.tipo === 'fim') return `<img class="emb" src="assets/img/emblema.jpg" alt=""><div class="marca">PREPARATÓRIO<br><em>CTSP</em></div><div class="meta">META: ALAVANCAR A CARREIRA</div><div class="cta">Peça o seu acesso</div><div class="url">williambortoli.github.io/CTSP</div>`;
  return `<div class="selo">${c.selo}</div><div class="janela${c.alta ? ' alta' : ''}"><div class="barra"><i></i><i></i><i></i><span>PREPARATÓRIO CTSP</span></div><div class="miolo"><img class="tela" src="assets/img/${c.img}" alt=""></div></div>` +
    (c.chips ? `<div class="chips">${c.chips.map(x => `<span>${x}</span>`).join('')}</div>` : '') +
    `<svg class="cursor" viewBox="0 0 24 24"><path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b0a08" stroke-width="1.5" stroke-linejoin="round"/></svg><div class="onda"></div>`;
};
const audio = (id, f, ini, d, vol) => `      <audio id="${id}" class="clip" src="assets/audio/sfx/${f}.mp3" data-start="${Math.max(0, ini).toFixed(2)}" data-duration="${d}" data-track-index="3" data-volume="${vol}"></audio>`;
const sons = cenas.flatMap((c, i) => {
  if (c.tipo === 'impacto') return [audio('dg' + i, 'typing', c.ini, Math.max(0.2, c.digita).toFixed(2), 0.35), audio('im' + i, 'impact-bass-1', c.ini + c.digita, 1.2, c.cor === 'gold' ? 0.35 : 0.25)];
  if (c.tipo === 'tela') return [audio('wh' + i, 'whoosh-short', c.ini - 0.05, 0.57, 0.15), audio('ck' + i, 'click-soft', c.ini + c.clique, 0.4, 0.6)];
  if (c.tipo === 'conta') return [audio('ck' + i, 'click-soft', c.ini + 0.1, 0.4, 0.6), audio('im' + i, 'impact-bass-1', c.ini + 1.4, 1.2, 0.25)];
  return [audio('fim', 'chime', c.ini + 0.3, 1.5, 0.25)];
});

const html = `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Chakra Petch"; src: url("assets/fonts/chakra-700.woff2") format("woff2"); font-weight: 700; }
      @font-face { font-family: "Plus Jakarta Sans"; src: url("assets/fonts/jakarta-700.woff2") format("woff2"); font-weight: 700; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b0a08; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: radial-gradient(circle at 50% 40%, #1d1810 0%, #0b0a08 70%); font-family: "Plus Jakarta Sans"; color: #f4efe4; }
      #grade { position: absolute; inset: 0; background-image: linear-gradient(rgba(222,178,82,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(222,178,82,.06) 1px, transparent 1px); background-size: 60px 60px; }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 5; pointer-events: none; }
      .cena { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 46px; padding: 150px 90px; }
      .big { font: 700 170px/0.95 "Chakra Petch"; text-align: center; letter-spacing: -2px; color: #f4efe4; }
      .big.red { color: #e5484d; text-shadow: 0 0 50px rgba(229,72,77,.4); } .big.gold { color: #deb252; text-shadow: 0 0 60px rgba(222,178,82,.5); }
      .big.glitch { color: #8d8576; }
      .selo { font: 700 46px "Chakra Petch"; letter-spacing: 4px; color: #0b0a08; background: #deb252; padding: 14px 32px; border-radius: 14px; }
      .janela { width: 940px; border-radius: 30px; overflow: hidden; border: 3px solid rgba(222,178,82,.55); background: #121010; box-shadow: 0 30px 90px rgba(0,0,0,.7), 0 0 70px rgba(222,178,82,.18); }
      .janela.alta { width: 640px; }
      .barra { display: flex; align-items: center; gap: 12px; padding: 18px 24px; background: #1b1814; border-bottom: 2px solid rgba(222,178,82,.25); }
      .barra i { width: 16px; height: 16px; border-radius: 50%; background: #deb252; opacity: .6; }
      .barra span { margin-left: 10px; font: 700 26px "Chakra Petch"; letter-spacing: 3px; color: #c9bfa9; }
      .miolo { padding: 18px; } .tela { display: block; width: 100%; border-radius: 16px; }
      .janela.alta .tela { max-height: 1000px; object-fit: cover; object-position: top; }
      .chips { display: flex; gap: 20px; } .chips span { font: 700 36px "Chakra Petch"; letter-spacing: 2px; padding: 12px 26px; border-radius: 12px; border: 2px solid #deb252; color: #deb252; }
      .cursor { position: absolute; left: 0; top: 0; width: 90px; height: 90px; filter: drop-shadow(0 6px 10px rgba(0,0,0,.6)); }
      .onda { position: absolute; left: 0; top: 0; width: 140px; height: 140px; margin: -70px 0 0 -70px; border-radius: 50%; border: 6px solid #deb252; opacity: 0; }
      .conta { text-align: center; } .conta b { display: block; font: 700 280px/1 "Chakra Petch"; color: #deb252; text-shadow: 0 0 70px rgba(222,178,82,.4); } .conta span { font: 700 74px "Chakra Petch"; letter-spacing: 10px; }
      .emb { width: 330px; border-radius: 60px; box-shadow: 0 0 120px rgba(222,178,82,.45); }
      .marca { font: 700 112px/1 "Chakra Petch"; text-align: center; } .marca em { font-style: normal; color: #deb252; }
      .meta { font: 700 40px "Chakra Petch"; letter-spacing: 4px; color: #deb252; border: 2px solid #deb252; padding: 10px 26px; border-radius: 12px; }
      .cta { font: 700 58px "Chakra Petch"; color: #0b0a08; background: #deb252; padding: 22px 54px; border-radius: 22px; box-shadow: 0 0 60px rgba(222,178,82,.45); }
      .url { font: 700 38px "Plus Jakarta Sans"; color: #c9bfa9; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1080" data-height="1920">
      <div id="grade"></div>
${cenas.map((c, i) => `      <div id="c${i}" class="clip cena" data-start="${c.ini}" data-duration="${c.dur}" data-track-index="1">${corpo(c)}</div>`).join('\n')}
      <div id="flash"></div>
      <audio id="narracao" class="clip" src="assets/audio/narracao.mp3" data-start="0" data-duration="${total}" data-track-index="2" data-volume="1"></audio>
${fs.existsSync(trilha) ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${dur}" data-track-index="4" data-volume="0.14"></audio>\n` : ''}${sons.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const C = ${JSON.stringify(cenas.map(c => ({ ini: c.ini, dur: c.dur, tipo: c.tipo, cor: c.cor || '', glitch: !!c.glitch, passo: c.passo, digita: c.digita, clique: c.clique })))};
      const flash = document.getElementById('flash');
      C.forEach((c, i) => {
        const el = document.getElementById('c' + i), fim = c.ini + c.dur;
        if (c.tipo === 'impacto') {
          const big = el.querySelector('.big');
          tl.from(el.querySelectorAll('.ch'), { opacity: 0, duration: 0.01, stagger: c.passo }, c.ini);       // digita
          const bate = c.ini + c.digita;
          tl.fromTo(big, { scale: 1.18 }, { scale: 1, duration: 0.35, ease: 'expo.out', immediateRender: false }, bate); // bate na tela
          tl.fromTo(big, { x: -14 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, bate);
          tl.fromTo(flash, { opacity: c.cor === 'gold' ? 0.55 : 0.3 }, { opacity: 0, duration: 0.3, immediateRender: false }, bate);
          if (c.glitch) tl.to(big, { x: 24, skewX: 12, duration: 0.04, repeat: 9, yoyo: true, ease: 'none' }, bate + 0.1);
          if (c.cor === 'gold') tl.to(big, { scale: 1.06, duration: Math.max(0.3, fim - bate - 0.5), ease: 'sine.inOut' }, bate + 0.35);
        } else if (c.tipo === 'tela') {
          const jan = el.querySelector('.janela'), cur = el.querySelector('.cursor'), onda = el.querySelector('.onda'), mio = el.querySelector('.tela');
          tl.from(el.querySelector('.selo'), { y: -60, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, c.ini);
          tl.from(jan, { scale: 0.7, opacity: 0, duration: 0.3, ease: 'back.out(1.5)' }, c.ini);
          // o cursor entra pelo canto, clica no centro do painel e o conteúdo surge
          tl.fromTo(mio, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.8)' }, c.ini + c.clique);
          tl.fromTo(cur, { x: 900, y: 1700 }, { x: 560, y: 960, duration: Math.max(0.2, c.clique - 0.08), ease: 'power2.inOut' }, c.ini);
          tl.to(cur, { scale: 0.8, duration: 0.07, yoyo: true, repeat: 1 }, c.ini + c.clique - 0.04);
          tl.fromTo(onda, { x: 575, y: 975, scale: 0.2, opacity: 1 }, { scale: 1.6, opacity: 0, duration: 0.45, ease: 'power2.out', immediateRender: false }, c.ini + c.clique);
          tl.to(cur, { x: 1100, y: 1900, duration: 0.4, ease: 'power2.in' }, c.ini + c.clique + 0.35);
          tl.to(jan, { scale: 1.04, duration: Math.max(0.3, fim - c.ini - c.clique - 0.2), ease: 'none' }, c.ini + c.clique + 0.2);
          const ch = el.querySelector('.chips'); if (ch) tl.from(ch, { y: 40, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, c.ini + c.clique + 0.3);
        } else if (c.tipo === 'conta') {
          const b = el.querySelector('[data-n]'), o = { v: 0 }, ct = el.querySelector('.conta');
          tl.from(ct, { scale: 0.6, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, c.ini);
          tl.to(o, { v: +b.dataset.n, duration: 1.3, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('pt-BR'); } }, c.ini + 0.1);
          tl.fromTo(ct, { scale: 1.12 }, { scale: 1, duration: 0.35, ease: 'expo.out', immediateRender: false }, c.ini + 1.4);
          tl.fromTo(flash, { opacity: 0.3 }, { opacity: 0, duration: 0.3, immediateRender: false }, c.ini + 1.4);
          tl.from(el.querySelector('.selo'), { scale: 0, duration: 0.35, ease: 'back.out(2.5)' }, c.ini + 1.5);
        } else {
          tl.from(el.querySelector('.emb'), { y: -500, rotation: -25, duration: 0.6, ease: 'bounce.out' }, c.ini);
          tl.from(el.querySelectorAll('.marca, .meta, .cta, .url'), { y: 80, opacity: 0, duration: 0.4, stagger: 0.18, ease: 'back.out(1.8)' }, c.ini + 0.4);
          tl.to(el.querySelector('.cta'), { scale: 1.08, duration: 0.45, repeat: Math.max(1, Math.floor((c.dur - 1.5) / 0.45)), yoyo: true, ease: 'sine.inOut' }, c.ini + 1.3);
        }
        // corte rápido: a cena sai com zoom e some nos últimos 0,15 s
        if (i < C.length - 1) tl.to(el.querySelectorAll(':scope > *'), { opacity: 0, scale: 1.12, duration: 0.15, ease: 'power2.in' }, fim - 0.15);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`\nprojeto: ${dir}\nduração: ${dur} s — agora: npx hyperframes check / render dentro da pasta`);
