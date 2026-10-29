// Vídeo de apresentação do portal (vertical, ~35 s): dor dos cursos maçantes → virada → telas reais → convite.
// Uso: node para-o-code/scripts/video-apresentacao.mjs   (VoiceStudio aberto; ffmpeg no PATH;
//      telas em video/ctsp-apresenta/assets/img via capturar.cjs; trilha em assets/audio/trilha.wav via gerar-trilha.py)
import fs from 'node:fs';
import path from 'node:path';
import { narrar, ff } from './voz.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const dir = path.join(RAIZ, 'video/ctsp-apresenta');
const A = path.join(dir, 'assets');

// tipo: dor (texto cinza grande), vira (texto dourado), tela (imagem do portal), conta (contador), fim
const cenas = [
  { tit: 'paginas', fala: 'Apostila de mil páginas.', tipo: 'dor', txt: '1.000<br>PÁGINAS' },
  { tit: 'slide', fala: 'Aula de três horas no slide.', tipo: 'dor', txt: '3 HORAS<br>DE SLIDE' },
  { tit: 'dicas', fala: 'E nenhuma dica de como a Fundatec cobra.', tipo: 'dor', txt: '0 DICAS', cor: 'red' },
  { tit: 'cai', fala: 'Material que nem te diz o que mais cai na prova.', tipo: 'dor', txt: 'O QUE CAI?<br>NINGUÉM DIZ.' },
  { tit: 'cansou', fala: 'Cansou?', tipo: 'dor', txt: 'CANSOU?', treme: true },
  { tit: 'virada', fala: 'E se estudar fosse direto ao ponto?', tipo: 'vira', txt: 'DIRETO<br>AO PONTO.' },
  { tit: 'atalho', fala: 'No Preparatório CTSP, cada tópico vem com o atalho pra memorizar,', tipo: 'tela', img: 'atalho.png', selo: 'ATALHO MENTAL' },
  { tit: 'pegadinha', fala: 'a pegadinha que a banca adora,', tipo: 'tela', img: 'pegadinha.png', selo: 'PEGADINHA DA BANCA' },
  { tit: 'questao', fala: 'e questão que corrige e explica na hora.', tipo: 'tela', img: 'questao.png', alta: true, selo: 'EXPLICA NA HORA' },
  { tit: 'erros', fala: 'O que tu errar vai pro caderno de erros e volta até tu acertar.', tipo: 'tela', img: 'erros.png', alta: true, selo: 'CADERNO DE ERROS' },
  { tit: 'plano', fala: 'E um plano semana a semana, do diagnóstico até o dia da prova.', tipo: 'tela', img: 'plano.png', alta: true, selo: 'PLANO SEMANAL' },
  { tit: 'banco', fala: 'São quase duas mil questões, com a prova de dois mil e vinte e seis comentada.', leg: 'São quase 2 mil questões, com a prova de 2026 comentada.', tipo: 'conta', n: 1948, selo: 'PROVA 2026 COMENTADA' },
  { tit: 'ranking', fala: 'Simulado de quatro horas, vídeo de revisão e ranking com a tua turma.', tipo: 'tela', img: 'ranking.png', selo: 'RANKING DA SEMANA', chips: ['SIMULADO 4H', 'VÍDEO DE REVISÃO'] },
  { tit: 'offline', fala: 'Funciona no celular, até sem internet.', tipo: 'tela', img: 'painel.png', alta: true, selo: 'FUNCIONA OFFLINE' },
  { tit: 'corte', fala: 'O corte de dois mil e vinte e seis foi cinquenta e dois de sessenta.', leg: 'O corte de 2026 foi 52 de 60.', tipo: 'conta', n: 52, de: '/60', rotulo: 'CORTE 2026', selo: 'META: ALAVANCAR A CARREIRA' },
  { tit: 'passa', fala: 'Quem treina do jeito certo passa dele.', tipo: 'vira', txt: 'TREINA CERTO.<br>PASSA.' },
  { tit: 'fim', fala: 'Chega de curso maçante. Conhece o portal e alavanca a tua carreira rumo ao segundo sargento.', tipo: 'fim' },
];
for (const c of cenas) if (c.img && !fs.existsSync(path.join(A, 'img', c.img))) throw new Error('falta a tela ' + c.img + ' (rode capturar.cjs)');

const total = await narrar(cenas, dir, { PAUSA: 0.45, VEL: 1.2, falar: s => s });
const dur = +Math.max(total + 1.5, 50).toFixed(2); // mínimo de 50 s pedido; a tela final segura o resto

// trilha cortada no tamanho do vídeo, com entrada e saída suaves
const trilha = path.join(A, 'audio/trilha.wav');
if (fs.existsSync(trilha)) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', trilha, '-t', String(dur),
  '-af', `afade=t=in:d=0.6,afade=t=out:st=${(dur - 1.5).toFixed(2)}:d=1.5`, '-b:a', '160k', path.join(A, 'audio/trilha.mp3')]);
// fontes, gsap, emblema e efeitos vêm do projeto do Reels
const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
for (const p of ['fonts', 'vendor', 'img/emblema.jpg', 'audio/sfx']) fs.cpSync(path.join(reels, p), path.join(A, p), { recursive: true });

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const corpo = c => {
  if (c.tipo === 'dor' || c.tipo === 'vira') return `<div class="big ${c.tipo}${c.cor ? ' ' + c.cor : ''}">${c.txt}</div>`;
  if (c.tipo === 'conta') return `<div class="conta"><b><i data-n="${c.n}">0</i>${c.de || ''}</b><span>${c.rotulo || 'QUESTÕES'}</span></div><div class="selo">${c.selo}</div>`;
  if (c.tipo === 'fim') return `<img class="emb" src="assets/img/emblema.jpg" alt=""><div class="marca">PREPARATÓRIO<br><em>CTSP</em></div><div class="cta">Peça o seu acesso</div><div class="url">williambortoli.github.io/CTSP</div>`;
  return `<div class="selo">${c.selo}</div><img class="tela${c.alta ? ' alta' : ''}" src="assets/img/${c.img}" alt="">` +
    (c.chips ? `<div class="chips">${c.chips.map(x => `<span>${x}</span>`).join('')}</div>` : '');
};
const sfx = (c, i) => {
  const s = c.tipo === 'dor' ? ['impact-bass-1', 1.2, 0.3] : c.tipo === 'fim' ? ['chime', 1.5, 0.25] : ['whoosh-short', 0.57, 0.18];
  return `      <audio id="s${i}" class="clip" src="assets/audio/sfx/${s[0]}.mp3" data-start="${Math.max(0, c.ini - 0.05).toFixed(2)}" data-duration="${s[1]}" data-track-index="3" data-volume="${s[2]}"></audio>`;
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
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b0a08; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; background: radial-gradient(circle at 50% 35%, #1d1810 0%, #0b0a08 70%); font-family: "Plus Jakarta Sans"; color: #f4efe4; }
      #grade { position: absolute; inset: 0; background-image: linear-gradient(rgba(222,178,82,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(222,178,82,.06) 1px, transparent 1px); background-size: 60px 60px; }
      .cena { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 48px; padding: 140px 90px 420px; }
      .big { font: 700 170px/0.95 "Chakra Petch"; text-align: center; letter-spacing: -2px; }
      .big.dor { color: #8d8576; } .big.red { color: #e5484d; } .big.vira { color: #deb252; text-shadow: 0 0 60px rgba(222,178,82,.45); }
      .selo { font: 700 44px "Chakra Petch"; letter-spacing: 4px; color: #0b0a08; background: #deb252; padding: 14px 32px; border-radius: 14px; }
      .tela { width: 900px; border-radius: 34px; border: 3px solid rgba(222,178,82,.45); box-shadow: 0 30px 90px rgba(0,0,0,.7), 0 0 60px rgba(222,178,82,.15); }
      .tela.alta { width: 580px; }
      .chips { display: flex; gap: 20px; } .chips span { font: 700 34px "Chakra Petch"; letter-spacing: 2px; padding: 12px 24px; border-radius: 12px; border: 2px solid #deb252; color: #deb252; }
      .conta { text-align: center; } .conta i { font-style: normal; } .conta b { display: block; font: 700 260px/1 "Chakra Petch"; color: #deb252; } .conta span { font: 700 70px "Chakra Petch"; letter-spacing: 8px; }
      .emb { width: 340px; border-radius: 60px; box-shadow: 0 0 120px rgba(222,178,82,.4); }
      .marca { font: 700 110px/1 "Chakra Petch"; text-align: center; } .marca em { font-style: normal; color: #deb252; }
      .cta { font: 700 56px "Chakra Petch"; color: #0b0a08; background: #deb252; padding: 22px 52px; border-radius: 22px; }
      .url { font: 700 38px "Plus Jakarta Sans"; color: #c9bfa9; }
      .leg { position: absolute; left: 70px; right: 70px; top: 1560px; text-align: center; font: 700 54px/1.2 "Plus Jakarta Sans"; }
      .leg span { background: rgba(11,10,8,.78); padding: 10px 22px; border-radius: 16px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1080" data-height="1920">
      <div id="grade"></div>
${cenas.map((c, i) => `      <div id="c${i}" class="clip cena" data-start="${c.ini}" data-duration="${(i === cenas.length - 1 ? dur - c.ini : c.dur).toFixed(2)}" data-track-index="1">${corpo(c)}<div class="leg"><span>${esc(c.leg || c.fala)}</span></div></div>`).join('\n')}
      <audio id="narracao" class="clip" src="assets/audio/narracao.mp3" data-start="0" data-duration="${total}" data-track-index="2" data-volume="1"></audio>
${fs.existsSync(trilha) ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${dur}" data-track-index="4" data-volume="0.16"></audio>\n` : ''}${cenas.map(sfx).join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const C = ${JSON.stringify(cenas.map(c => ({ ini: c.ini, dur: c.dur, tipo: c.tipo, treme: !!c.treme })))};
      C.forEach((c, i) => {
        const el = document.getElementById('c' + i), filhos = el.querySelectorAll(':scope > :not(.leg)');
        if (c.tipo === 'dor' || c.tipo === 'vira') tl.from(filhos, { scale: c.tipo === 'vira' ? 0.6 : 1.5, opacity: 0, duration: 0.28, ease: 'power3.out' }, c.ini);
        else tl.from(filhos, { y: 90, opacity: 0, duration: 0.4, stagger: 0.12, ease: 'back.out(1.6)' }, c.ini);
        if (c.treme) tl.to(filhos, { x: 18, duration: 0.05, repeat: 7, yoyo: true, ease: 'none' }, c.ini + 0.3);
        if (c.tipo === 'tela') tl.to(el.querySelector('.tela'), { scale: 1.06, duration: c.dur, ease: 'none' }, c.ini);
        if (c.tipo === 'fim') { tl.to(el.querySelector('.cta'), { scale: 1.07, duration: 0.5, repeat: 9, yoyo: true, ease: 'sine.inOut' }, c.ini + 1);
          tl.to(el.querySelector('.emb'), { rotation: 360, duration: 1.2, ease: 'power2.inOut' }, c.ini + 0.4); }
        const b = el.querySelector('[data-n]');
        if (b) { const o = { v: 0 }; tl.to(o, { v: +b.dataset.n, duration: 1.2, ease: 'power2.out', onUpdate: () => { b.textContent = Math.round(o.v).toLocaleString('pt-BR'); } }, c.ini + 0.2); }
        tl.from(el.querySelector('.leg'), { y: 30, opacity: 0, duration: 0.2 }, c.ini);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`\nprojeto: ${dir}\nduração: ${dur} s — agora: npx hyperframes check / render dentro da pasta`);
