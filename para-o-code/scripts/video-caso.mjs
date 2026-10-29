// Reel "caso da semana" (vertical, ~50 s), no formato dos vídeos de jurisprudência: gancho → conflito → o caso
// em itens → gabarito em carimbo → "repare na ordem" → pegadinha → salva e manda pro parceiro.
// Sem 3D: fundo claro, ilustrações em SVG, cartões e legenda palavra por palavra.
// Uso: node para-o-code/scripts/video-caso.mjs   (VoiceStudio aberto; ffmpeg no PATH; trilha em assets/audio/trilha.wav)
// Cada elemento animado marca data-w="n" (entra na n-ésima palavra da fala da cena), data-a (pop|slide|slam|risca) e data-d (atraso).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { narrarCorrido, ff } from './voz.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const dir = path.join(RAIZ, 'video/ctsp-caso');
const A = path.join(dir, 'assets');
const ETIQUETA = 'FURTO DE USO · A VIATURA';

const CARRO = (cls = '') => `<svg class="carro ${cls}" viewBox="0 0 320 150"><rect x="104" y="14" width="70" height="14" rx="5" fill="#e5484d"/><rect x="140" y="14" width="34" height="14" rx="5" fill="#2563eb"/>
<path d="M60 70 L95 30 H200 L250 70 Z" fill="#f4f6fa" stroke="#0f1d3a" stroke-width="6" stroke-linejoin="round"/><path d="M105 38 H150 V68 H80 Z M160 38 H196 L232 68 H160 Z" fill="#9cc3ff"/>
<rect x="20" y="66" width="282" height="52" rx="18" fill="#f4f6fa" stroke="#0f1d3a" stroke-width="6"/><rect x="24" y="86" width="274" height="14" fill="#2563eb"/>
<circle cx="80" cy="120" r="24" fill="#0f1d3a"/><circle cx="80" cy="120" r="10" fill="#c9d3e3"/><circle cx="244" cy="120" r="24" fill="#0f1d3a"/><circle cx="244" cy="120" r="10" fill="#c9d3e3"/></svg>`;
const CHAVE = `<svg class="chave" viewBox="0 0 200 90"><circle cx="45" cy="45" r="32" fill="none" stroke="#e8a317" stroke-width="16"/><path d="M77 45 H185 M150 45 V72 M172 45 V66" stroke="#e8a317" stroke-width="16" stroke-linecap="round"/></svg>`;
const CASA = `<svg class="casa" viewBox="0 0 200 180"><path d="M20 85 L100 15 L180 85" fill="none" stroke="#0f1d3a" stroke-width="10" stroke-linejoin="round" stroke-linecap="round"/><path d="M40 78 V165 H160 V78 L100 28 Z" fill="#ffd9a8" stroke="#0f1d3a" stroke-width="8" stroke-linejoin="round"/><rect x="85" y="110" width="34" height="55" fill="#7a4a2b"/><rect x="55" y="95" width="22" height="22" fill="#9cc3ff"/><rect x="128" y="95" width="22" height="22" fill="#9cc3ff"/></svg>`;
const RELOGIO = `<svg class="relogio" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#fff" stroke="#0f1d3a" stroke-width="7"/><path d="M50 50 V28" stroke="#0f1d3a" stroke-width="6" stroke-linecap="round"/><path class="ponteiro" d="M50 50 V16" stroke="#e5484d" stroke-width="4" stroke-linecap="round"/><circle cx="50" cy="50" r="5" fill="#0f1d3a"/></svg>`;

const ITENS = ['Fim do turno: pega a chave <b>sem autorização</b>', 'Vai até em casa e fica <b>algumas horas</b>', 'Volta e devolve <b>nas mesmas condições</b>'];
// cartão "O CASO": itens anteriores já marcados; o da cena entra na palavra 0
const caso = n => `<div class="cartao caso"><div class="topo">📍 O CASO · PROVA CTSP 2026</div>${ITENS.slice(0, n + 1).map((t, i) =>
  `<div class="item${i < n ? ' feito' : ''}"${i === n ? ' data-w="0" data-a="pop"' : ''}><i>${i < n ? '✓' : i + 1}</i><span>${t}</span></div>`).join('')}</div>`;

const cenas = [
  { tit: 'gancho', fala: 'Pegou a viatura, foi em casa e devolveu. Isso é crime?',
    html: `<div class="titulo"><div data-w="0" data-a="pop">PEGOU A VIATURA</div><div data-w="6" data-a="pop">E DEVOLVEU.</div><div class="verm" data-w="9" data-a="slam">É CRIME?</div></div><div data-w="2" data-a="slide">${CARRO()}</div>` },
  { tit: 'conflito', fala: 'No Código Penal comum, não. No Código Penal Militar, sim.',
    html: `<div class="duo"><div class="cartao lei" data-w="0" data-a="pop"><small>CÓDIGO PENAL</small><b>CP</b><em class="nao" data-w="4" data-a="slam">✕ NÃO É CRIME</em></div>
<div class="cartao lei" data-w="5" data-a="pop"><small>CÓDIGO PENAL MILITAR</small><b>CPM</b><em class="sim" data-w="9" data-a="slam">✓ É CRIME</em><small>art. 241</small></div></div>` },
  { tit: 'prova', fala: 'O caso caiu na prova de dois mil e vinte e seis.',
    html: `<div class="cartao folha" data-w="0" data-a="pop"><small>FUNDATEC</small><b>PROVA CTSP<br>2026</b><div class="q">QUESTÃO 32</div></div><div class="selo" data-w="4" data-a="slam">CAIU NA PROVA</div>` },
  { tit: 'chave', fala: 'Fim do turno. Ele pega a chave da viatura sem autorização.',
    html: `${caso(0)}<div class="palco"><div data-w="6" data-a="pop">${CHAVE}</div><div class="etq verm" data-w="9" data-a="pop">SEM AUTORIZAÇÃO</div></div>` },
  { tit: 'casa', fala: 'Vai até em casa e fica lá algumas horas.',
    html: `${caso(1)}<div class="palco"><div data-w="3" data-a="pop">${CASA}</div><div data-w="7" data-a="pop">${RELOGIO}</div><div class="etq" data-w="7" data-a="pop" data-d="0.15">ALGUMAS HORAS</div></div>` },
  { tit: 'devolve', fala: 'Depois volta e devolve a viatura nas mesmas condições.',
    html: `${caso(2)}<div class="palco"><div data-w="1" data-a="slide" data-x="1200">${CARRO()}</div><div class="etq verde" data-w="7" data-a="pop">MESMAS CONDIÇÕES</div></div>` },
  { tit: 'alternativas', fala: 'Furto simples? Qualificado? Roubo? Não.',
    html: `<div class="cartao opcoes"><div class="topo">QUAL É O CRIME?</div>${[['FURTO SIMPLES', 0], ['FURTO QUALIFICADO', 2], ['ROUBO SIMPLES', 3]].map(([t, w], i) =>
      `<div class="op" data-w="${w}" data-a="pop">${t}<s data-w="4" data-a="risca" data-d="${(i * 0.15).toFixed(2)}"></s></div>`).join('')}</div>` },
  { tit: 'gabarito', fala: 'A banca deu furto de uso.',
    html: `<div class="etq" data-w="0" data-a="pop">GABARITO DA FUNDATEC</div><div class="carimbo azul" data-w="3" data-a="slam">FURTO<br>DE USO</div><div class="lei-ref" data-w="5" data-a="pop">CPM, art. 241</div>` },
  { tit: 'ordem', fala: 'Repare na ordem: pegou para usar, usou, devolveu igual.',
    html: `<div class="etq amarela" data-w="0" data-a="pop">⚠ REPARE NA ORDEM</div><div class="fluxo">${[['PEGOU PARA USAR', 3], ['USOU', 6], ['DEVOLVEU IGUAL', 7]].map(([t, w], i) =>
      `<div class="passo" data-w="${w}" data-a="pop"><i>${i + 1}</i>${t}</div>`).join('<div class="seta">↓</div>')}</div><div class="resultado" data-w="8" data-a="slam" data-d="0.35">= FURTO DE USO</div>` },
  { tit: 'motorizado', fala: 'E se for veículo motorizado, a pena aumenta.',
    html: `<div data-w="3" data-a="pop">${CARRO('grande')}</div><div class="etq" data-w="3" data-a="pop" data-d="0.15">VEÍCULO MOTORIZADO</div><div class="carimbo verm" data-w="7" data-a="slam">PENA<br>AUMENTA ↑</div>` },
  { tit: 'pegadinha', fala: 'A pegadinha: no CP comum isso nem é crime. No CPM, é.',
    html: `<div class="carimbo verm" data-w="1" data-a="slam">PEGADINHA</div><div class="cartao linhas"><div class="lin" data-w="2" data-a="pop"><b>CP comum</b><span class="nao">não é crime</span></div><div class="lin" data-w="9" data-a="pop"><b>CPM</b><span class="sim">é crime</span></div></div>` },
  { tit: 'fim', fala: 'Devolveu igual? Furto de uso. Salva e manda pro parceiro.',
    html: `<div class="marca" data-w="0" data-a="pop"><img src="assets/img/emblema.jpg" alt=""><span>PREPARATÓRIO<br><em>CTSP</em></span></div><div class="resumo" data-w="0" data-a="pop">DEVOLVEU IGUAL?</div><div class="resumo azul" data-w="2" data-a="slam">FURTO DE USO.</div>
<div class="botoes"><span data-w="5" data-a="pop">🔖 SALVA</span><span data-w="7" data-a="pop">➤ MANDA PRO PARCEIRO</span></div>` },
];

const total = await narrarCorrido(cenas, dir, { VEL: 1,
  ref: { audio: path.join(RAIZ, 'video/ctsp-apresenta/voz-ref.wav'), texto: 'E um plano semana a semana, do diagnóstico até o dia da prova.' } });
const dur = +(total + 2).toFixed(2); // a tela final fica 2 s a mais
cenas.at(-1).dur = +(dur - cenas.at(-1).ini).toFixed(2);

// trilha cortada no tamanho do vídeo, com entrada e saída suaves
const trilha = path.join(A, 'audio/trilha.wav');
if (fs.existsSync(trilha)) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', trilha, '-t', String(dur),
  '-af', `afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.5).toFixed(2)}:d=1.5`, '-b:a', '160k', path.join(A, 'audio/trilha.mp3')]);
// fontes, gsap e emblema do Reels; efeitos da skill media-use
fs.mkdirSync(path.join(A, 'audio/sfx'), { recursive: true });
const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
for (const p of ['fonts', 'vendor', 'img/emblema.jpg']) fs.cpSync(path.join(reels, p), path.join(A, p), { recursive: true });
const SFX = path.join(os.homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.209/skills/media-use/audio/assets/sfx');
for (const f of ['click-soft', 'pop', 'whoosh-short', 'impact-bass-1', 'chime', 'click']) fs.copyFileSync(path.join(SFX, f + '.mp3'), path.join(A, 'audio/sfx', f + '.mp3'));

// cada data-w vira um tempo absoluto (data-t) e um som
const SOM = { pop: ['pop', 0.35, 0.3], slide: ['whoosh-short', 0.25, 0.57], slam: ['impact-bass-1', 0.4, 1.2], risca: ['click', 0.35, 0.3] };
const sons = [];
cenas.forEach((c, i) => {
  c.html = c.html.replace(/data-w="(\d+)" data-a="(\w+)"(?: data-d="([\d.]+)")?/g, (_, w, a, d) => {
    const p = c.palavras[Math.min(+w, c.palavras.length - 1)];
    const t = +Math.min(p.t + (+d || 0), c.ini + c.dur - 0.7).toFixed(2); // a animação termina antes do corte
    const [f, vol, dd] = SOM[a];
    sons.push(`      <audio id="s${sons.length}" class="clip" src="assets/audio/sfx/${f}.mp3" data-start="${t}" data-duration="${dd}" data-track-index="3" data-volume="${vol}"></audio>`);
    return `data-t="${t}" data-a="${a}"`;
  });
});
sons.push(`      <audio id="fim" class="clip" src="assets/audio/sfx/chime.mp3" data-start="${cenas.at(-1).palavras[5].t}" data-duration="1.5" data-track-index="3" data-volume="0.3"></audio>`);

// legenda: grupos de até 3 palavras (quebra na pontuação); a palavra falada fica em destaque
const legenda = c => {
  const gs = [];
  c.palavras.forEach(p => { const g = gs.at(-1); if (!g || g.length >= 3 || /[.,?:!]$/.test(g.at(-1).w)) gs.push([p]); else g.push(p); });
  return `<div class="leg">${gs.map((g, k) => `<div class="g" data-t0="${g[0].t}" data-t1="${k < gs.length - 1 ? gs[k + 1][0].t : +(c.ini + c.dur).toFixed(2)}">${g.map(p =>
    `<span class="w" data-t="${p.t}">${p.w.replace(/[.,?:!]$/, '').toUpperCase()}</span>`).join(' ')}</div>`).join('')}</div>`;
};

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
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #e9eef5; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Plus Jakarta Sans"; font-weight: 700; color: #0f1d3a;
        background: linear-gradient(180deg, #cfe2f7 0%, #eef3f9 58%, #e7dccb 58%, #efe6d8 100%); }
      #calcada { position: absolute; left: 0; right: 0; top: 1114px; height: 14px; background: #d6c7ae; }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 8; pointer-events: none; }
      .logo { position: absolute; left: 50px; top: 56px; z-index: 6; display: flex; align-items: center; gap: 14px; background: #fff; padding: 12px 22px 12px 12px; border-radius: 22px; box-shadow: 0 8px 24px rgba(15,29,58,.15); }
      .logo img { width: 74px; height: 74px; border-radius: 16px; } .logo span { font: 700 30px/1 "Chakra Petch"; } .logo em { font-style: normal; color: #2563eb; }
      .chip { position: absolute; right: 50px; top: 76px; z-index: 6; background: #0f1d3a; color: #fff; font-size: 28px; letter-spacing: 1px; padding: 14px 24px; border-radius: 999px; }
      .cena { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 40px; padding: 210px 70px 470px; }
      .titulo { text-align: center; font-size: 104px; line-height: 1.02; letter-spacing: -2px; text-shadow: 0 4px 0 #fff; }
      .verm { color: #e5484d; } .azul { color: #2563eb; } .verde { color: #1f9d55; }
      .carro { width: 640px; } .carro.grande { width: 820px; }
      .cartao { background: #fff; border-radius: 34px; box-shadow: 0 20px 50px rgba(15,29,58,.18); padding: 40px 44px; }
      .duo { display: flex; gap: 34px; } .lei { width: 440px; display: flex; flex-direction: column; align-items: center; gap: 18px; text-align: center; }
      .lei small { font-size: 28px; letter-spacing: 2px; color: #5b6b86; } .lei b { font: 700 150px/1 "Chakra Petch"; }
      .lei em { font-style: normal; font-size: 40px; padding: 12px 22px; border-radius: 14px; color: #fff; } .nao { background: #e5484d; color: #fff; } .sim { background: #1f9d55; color: #fff; }
      .folha { width: 640px; text-align: center; display: flex; flex-direction: column; gap: 22px; border-top: 18px solid #2563eb; }
      .folha small { font-size: 32px; letter-spacing: 6px; color: #5b6b86; } .folha b { font: 700 110px/1 "Chakra Petch"; } .folha .q { font-size: 62px; color: #2563eb; }
      .selo, .etq { font-size: 44px; letter-spacing: 2px; background: #0f1d3a; color: #fff; padding: 16px 30px; border-radius: 16px; box-shadow: 0 10px 26px rgba(15,29,58,.25); }
      .selo { background: #e5484d; font-size: 60px; }
      .etq.verm { background: #e5484d; color: #fff; } .etq.verde { background: #1f9d55; color: #fff; } .etq.amarela { background: #ffcf33; color: #0f1d3a; }
      .caso { width: 940px; display: flex; flex-direction: column; gap: 20px; padding: 30px 36px; }
      .topo { font-size: 28px; letter-spacing: 2px; color: #5b6b86; }
      .item { display: flex; align-items: center; gap: 20px; font-size: 40px; line-height: 1.2; }
      .item i { flex: none; width: 58px; height: 58px; border-radius: 50%; background: #2563eb; color: #fff; font-style: normal; display: grid; place-items: center; font-size: 32px; }
      .item.feito { color: #66738a; } .item.feito i { background: #1f9d55; } .item b { color: #2563eb; } .item.feito b { color: inherit; }
      .palco { display: flex; align-items: center; justify-content: center; gap: 40px; flex-wrap: wrap; }
      .chave { width: 330px; } .casa { width: 300px; } .relogio { width: 190px; }
      .opcoes { width: 820px; display: flex; flex-direction: column; gap: 26px; }
      .op { position: relative; font-size: 62px; padding: 18px 26px; border-radius: 18px; background: #f1f4f9; }
      .op s { position: absolute; left: 14px; right: 14px; top: 50%; height: 12px; margin-top: -6px; background: #e5484d; border-radius: 6px; }
      .carimbo { font: 700 150px/0.95 "Chakra Petch"; text-align: center; padding: 26px 50px; border: 14px solid currentColor; border-radius: 30px; background: rgba(255,255,255,.85); }
      .lei-ref { font-size: 48px; color: #5b6b86; }
      .fluxo { display: flex; flex-direction: column; align-items: center; gap: 6px; }
      .passo { display: flex; align-items: center; gap: 22px; font-size: 58px; background: #fff; padding: 22px 40px; border-radius: 24px; box-shadow: 0 12px 30px rgba(15,29,58,.15); }
      .passo i { font-style: normal; width: 70px; height: 70px; border-radius: 50%; background: #2563eb; color: #fff; display: grid; place-items: center; font-size: 40px; }
      .seta { font-size: 56px; color: #5b6b86; line-height: 1; }
      .resultado { font: 700 84px "Chakra Petch"; color: #fff; background: #2563eb; padding: 16px 40px; border-radius: 22px; }
      .linhas { width: 880px; display: flex; flex-direction: column; gap: 26px; }
      .lin { display: flex; justify-content: space-between; align-items: center; font-size: 58px; } .lin span { padding: 10px 24px; border-radius: 16px; font-size: 48px; }
      .marca { display: flex; align-items: center; gap: 24px; } .marca img { width: 150px; border-radius: 34px; box-shadow: 0 14px 40px rgba(15,29,58,.25); }
      .marca span { font: 700 64px/1 "Chakra Petch"; } .marca em { font-style: normal; color: #2563eb; }
      .resumo { font-size: 100px; letter-spacing: -2px; text-align: center; line-height: 1; }
      .botoes { display: flex; gap: 22px; } .botoes span { font-size: 40px; background: #fff; padding: 20px 32px; border-radius: 999px; box-shadow: 0 10px 26px rgba(15,29,58,.2); }
      .leg { position: absolute; left: 0; right: 0; top: 1520px; height: 150px; }
      .g { position: absolute; left: 50%; top: 0; transform: translateX(-50%); white-space: nowrap; opacity: 0; font-size: 66px; letter-spacing: 1px; background: #fff; padding: 14px 26px; border-radius: 22px; box-shadow: 0 12px 30px rgba(15,29,58,.2); }
      .w { padding: 2px 10px; border-radius: 12px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1080" data-height="1920">
      <div id="calcada"></div>
      <div class="logo"><img src="assets/img/emblema.jpg" alt=""><span>PREPARATÓRIO<br><em>CTSP</em></span></div>
      <div class="chip">📍 ${ETIQUETA}</div>
${cenas.map((c, i) => `      <div id="c${i}" class="clip cena" data-start="${c.ini}" data-duration="${c.dur}" data-track-index="1">${c.html}${legenda(c)}</div>`).join('\n')}
      <div id="flash"></div>
      <audio id="narracao" class="clip" src="assets/audio/narracao.mp3" data-start="0" data-duration="${total}" data-track-index="2" data-volume="1"></audio>
${fs.existsSync(trilha) ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${dur}" data-track-index="4" data-volume="0.12"></audio>\n` : ''}${sons.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const flash = document.getElementById('flash');
      gsap.set('.selo, .carimbo', { rotation: -5 }); // inclinado; no CSS brigaria com o GSAP
      document.querySelectorAll('.cena').forEach((el, i, todas) => {
        const ini = +el.dataset.start, fim = ini + +el.dataset.duration;
        el.querySelectorAll('[data-t]:not(.w)').forEach(e => {
          const t = +e.dataset.t, a = e.dataset.a;
          if (a === 'pop') tl.from(e, { scale: 0.6, opacity: 0, duration: 0.3, ease: 'back.out(2)' }, t);
          else if (a === 'slide') tl.from(e, { x: -(+e.dataset.x || 1200), duration: 0.5, ease: 'power3.out' }, t);
          else if (a === 'risca') tl.from(e, { scaleX: 0, transformOrigin: 'left center', duration: 0.22, ease: 'power2.out' }, t);
          else if (a === 'slam') {   // cai na tela como carimbo
            tl.from(e, { scale: 2.4, opacity: 0, duration: 0.25, ease: 'power4.in' }, t);
            tl.fromTo(flash, { opacity: 0.35 }, { opacity: 0, duration: 0.3, immediateRender: false }, t + 0.25);
            tl.fromTo(el, { x: -12 }, { x: 0, duration: 0.3, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, t + 0.25);
          }
        });
        el.querySelectorAll('.ponteiro').forEach(p => tl.to(p, { rotation: 720, svgOrigin: '50 50', duration: fim - ini, ease: 'none' }, ini));
        el.querySelectorAll('.chave').forEach(k => tl.to(k, { rotation: 12, duration: 0.4, yoyo: true, repeat: Math.floor((fim - ini) / 0.4), ease: 'sine.inOut' }, ini));
        // legenda: grupo aparece e some; palavra falada em azul
        el.querySelectorAll('.g').forEach(g => {
          tl.set(g, { opacity: 1 }, +g.dataset.t0); tl.set(g, { opacity: 0 }, +g.dataset.t1 - 0.01);
          const ws = [...g.querySelectorAll('.w')];
          ws.forEach((w, k) => {
            tl.set(w, { backgroundColor: '#2563eb', color: '#ffffff' }, +w.dataset.t);
            if (k < ws.length - 1) tl.set(w, { backgroundColor: 'rgba(37,99,235,0)', color: '#0f1d3a' }, +ws[k + 1].dataset.t);
          });
        });
        if (i < todas.length - 1) tl.to(el.querySelectorAll(':scope > *'), { opacity: 0, scale: 1.08, duration: 0.15, ease: 'power2.in' }, fim - 0.15);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`\nprojeto: ${dir}\nduração: ${dur} s — agora: npx hyperframes check / render dentro da pasta`);
