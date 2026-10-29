// Gera o vídeo de revisão de uma matéria a partir do campo `rev` de docs/js/conteudo.js.
// Uso: node para-o-code/scripts/video-revisao.mjs <mat>   (VoiceStudio aberto; ffmpeg e ffprobe no PATH)
// Saída: video/revisao-<mat>/ (projeto HyperFrames) e docs/videos/revisao-<mat>.mp4
import fs from 'node:fs';
import path from 'node:path';
import { narrar, ff } from './voz.mjs';
import os from 'node:os';

const mat = process.argv[2];
const RAIZ = path.resolve(import.meta.dirname, '../..');
const PAUSA = 0.45;
const VEL = 1.38; // velocidade da narração (atempo mantém o tom da voz)

const w = {}; new Function('window', fs.readFileSync(path.join(RAIZ, 'docs/js/conteudo.js'), 'utf8'))(w);
const M = w.CONTEUDO.mats.find(m => m.id === mat);
if (!M || !M.rev?.length) { console.error('matéria sem revisão:', mat); process.exit(1); }

// ícone pelo tema do ponto (primeira palavra-chave que casar)
const ICONES = [[/ativa/i, 'shield-check'], [/posto|gradua/i, 'medal'], [/aluno/i, 'graduation-cap'], [/antiguidade/i, 'list-ordered'],
  [/partid/i, 'vote'], [/recurso/i, 'scale'], [/férias/i, 'calendar-days'], [/licença|paternidade/i, 'baby'],
  [/ausente|desaparecido|extraviado/i, 'user-search'], [/comportamento/i, 'thumbs-up'], [/desertor/i, 'user-x'],
  [/omisso/i, 'book-open'], [/civil/i, 'briefcase'], [/arquivamento/i, 'archive'], [/cancelamento/i, 'eraser'],
  [/tempo do crime|tempo e lugar/i, 'clock'], [/lugar|fronteira/i, 'map-pin'], [/júri|doloso contra a vida/i, 'landmark'], [/tentativa/i, 'target'],
  [/ordem/i, 'megaphone'], [/sursis|livramento/i, 'unlock'], [/revolta/i, 'flame'], [/deserção/i, 'door-open'], [/furto/i, 'car'],
  [/ipm|inquérito|encarregado/i, 'search'], [/escrivão/i, 'pen-line'], [/inquirição/i, 'mic'], [/preso|prisão|preventiva/i, 'lock'],
  [/nota de culpa|custódia/i, 'file-text'], [/menagem/i, 'house'], [/denúncia/i, 'file-pen'], [/fundamentos|órgãos da segurança/i, 'landmark'],
  [/casa/i, 'house'], [/imprescrit/i, 'infinity'], [/anistia|3t/i, 'ban'], [/trânsito|volante/i, 'car'], [/hc/i, 'scale'],
  [/polícia militar|poder de polícia/i, 'shield'], [/erro de/i, 'circle-alert'], [/emoção/i, 'heart'], [/infanticídio/i, 'baby'],
  [/feminicídio/i, 'heart-crack'], [/calúnia/i, 'message-square-warning'], [/importunação|estupro|agressor/i, 'shield-alert'],
  [/concussão|improbidade/i, 'hand-coins'], [/tráfico/i, 'pill'], [/abuso/i, 'triangle-alert'], [/menor potencial/i, 'gauge'],
  [/arma/i, 'crosshair'], [/cão|gato/i, 'paw-print'], [/injúria racial/i, 'users'], [/contravenção/i, 'ban'], [/prova|confissão/i, 'search'],
  [/silêncio/i, 'volume-x'], [/flagrante/i, 'siren'], [/fiança/i, 'banknote'], [/princípios/i, 'list-checks'], [/órgão/i, 'building'],
  [/revogação/i, 'rotate-ccw'], [/responsabilidade/i, 'scale'], [/lai/i, 'file-search'], [/indelegável/i, 'lock'],
  [/puni|pena|crime/i, 'gavel'], [/prazo|dias|horas/i, 'clock']];
const icone = tit => {
  const nomeIc = tit === 'check' ? 'circle-check' : (ICONES.find(([re]) => re.test(tit)) || [, 'bookmark'])[1];
  return fs.readFileSync(path.join(RAIZ, 'node_modules/lucide-static/icons', nomeIc + '.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/class="[^"]*"/, 'class="ic"');
};
// caso real do banco (questão existente) depois do ponto indicado: { 'título do ponto': 'início do enunciado' }
const CASOS = {
  li: { 'Filiação partidária': 'Um soldado da ativa recebe convite', 'Férias': 'O comando quer adiar as férias', 'Ausente, desaparecido, extraviado': 'Um soldado está desaparecido há 35 dias' },
  pm: { 'Deserção': 'Um soldado ficou exatamente 8 dias', 'Ordem manifestamente criminosa': 'O superior manda o soldado sumir', 'Furto de uso': 'Um soldado pega a viatura sem autorização' },
  ppm: { 'Inquirição': 'Uma inquirição começou às 14h', 'Denúncia': 'Com o acusado preso, o MP recebeu' },
  cf: { 'Entrar em casa sem consentimento': 'Durante uma enchente', 'Legislar sobre trânsito': 'Uma lei municipal cria crime de trânsito', 'HC e punição disciplinar': 'O defensor quer, por habeas corpus' },
  dp: { 'Feminicídio e vicaricídio': 'No contexto de violência doméstica, o agressor mata o filho', 'Embriaguez ao volante': 'O etilômetro marca 0,35', 'Maus-tratos a cão ou gato': 'Denúncia de cachorro acorrentado' },
  pp: { 'Prova derivada da ilícita': 'Uma prova veio de busca ilegal', 'Silêncio': 'O juiz escreve na sentença que o silêncio' },
  da: { 'Responsabilidade do Estado': 'A vítima de um dano causado por um policial', 'LAI: sigilo': 'Um cidadão pede os dados médicos' },
}[mat] || {};
const BANCO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs/dados/banco.json'), 'utf8'));
const caso = (tit) => {
  const ini = CASOS[tit]; if (!ini) return [];
  const q = BANCO.find(x => x.mat === mat && x.enunciado.startsWith(ini));
  if (!q) throw new Error('caso não achado no banco: ' + ini);
  const resp = q.alternativas[q.correta];
  return [{ caso: true, tit: q.enunciado, txt: resp, fala: `Na prática. ${q.enunciado} Resposta: ${resp}.` }];
};

const nome = M.nome;
const itens = [
  { tit: nome, txt: 'Revisão em ' + M.rev.length + ' pontos', fala: `Revisão de ${nome}. ${M.rev.length} pontos que mais caem.`, capa: true },
  ...M.rev.flatMap(([tit, txt], k) => [{ tit, txt, num: k + 1, fala: `${tit}. ${txt}.` }, ...caso(tit)]),
  { tit: 'Agora é com você', txt: 'Faça o mini-teste da matéria no portal', fala: 'Agora faça o mini-teste da matéria no portal.', capa: true },
];
// só ajusta a leitura em voz alta; o texto na tela fica igual ao da apostila
const falar = s => s.replace(/\bart\./g, 'artigo').replace(/\s*\([^)]*\)/g, '').replace(/\b1\/3\b/g, 'um terço').replace(/\b2\/3\b/g, 'dois terços').replace(/×/g, ' e ').replace(/;/g, ',').replace(/\.\.+/g, '.');

const dir = path.join(RAIZ, 'video', 'revisao-' + mat);
const total = await narrar(itens, dir, { PAUSA, VEL, falar });

// trilha de fundo (gerar-trilha.py) repetida até o fim, com entrada e saída suaves
const BASE = path.join(RAIZ, 'video/trilha-base.wav');
const temTrilha = fs.existsSync(BASE);
// shortcut: repete o mesmo trecho em loop, pode haver emenda audível; trocar por trilha mais longa se incomodar
if (temTrilha) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', BASE, '-t', String(total),
  '-af', `afade=t=in:d=1.5,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5`, '-b:a', '128k', path.join(dir, 'assets/audio/trilha.mp3')]);

// fontes, gsap e emblema vêm do projeto do Reels
const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
for (const p of ['fonts', 'vendor', 'img/emblema.jpg']) fs.cpSync(path.join(reels, p), path.join(dir, 'assets', p), { recursive: true });
// clique e digitação inclusos no HyperFrames (media-use)
const SFX = path.join(os.homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.209/skills/media-use/audio/assets/sfx');
fs.mkdirSync(path.join(dir, 'assets/audio/sfx'), { recursive: true });
for (const f of ['click-soft.mp3', 'typing.mp3']) fs.copyFileSync(path.join(SFX, f), path.join(dir, 'assets/audio/sfx', f));

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const n = M.rev.length;
const destaca = s => esc(s).replace(/\d+(?:\/\d+)?(?:\s(?:dias|anos|horas|períodos))?/g, '<b>$&</b>');
// cada palavra num span para o efeito de digitação (fora das tags)
const palavras = h => h.replace(/([^\s<>]+)(?![^<]*>)/g, '<span class="w">$1</span>');
const DIG = 0.05; // segundos por palavra
const digita = it => Math.min(1.5, (it.caso ? it.tit : it.txt).split(/\s+/).length * DIG + 0.1);
const sons = itens.map((it, i) => `      <audio id="clique${i}" class="clip" src="assets/audio/sfx/click-soft.mp3" data-start="${Math.max(0.05, it.ini)}" data-duration="0.36" data-track-index="3" data-volume="0.35"></audio>
      <audio id="digita${i}" class="clip" src="assets/audio/sfx/typing.mp3" data-start="${(it.ini + 0.3).toFixed(2)}" data-duration="${digita(it).toFixed(2)}" data-track-index="4" data-volume="0.16"></audio>`).join('\n');
const cartoes = itens.map((it, i) => it.caso
  ? `      <div id="c${i}" class="clip card caso" data-start="${it.ini}" data-duration="${it.dur}" data-track-index="1">
        <div class="cont">Na prática</div>
        <div class="enun">${palavras(esc(it.tit))}</div>
        <div class="resp">${icone('check')}<span>${destaca(it.txt)}</span></div>
      </div>`
  : `      <div id="c${i}" class="clip card${it.capa ? ' capa' : ''}" data-start="${it.ini}" data-duration="${it.dur}" data-track-index="1">
        ${it.capa ? '<img class="emb" src="assets/img/emblema.jpg" alt="" />' : `<div class="icw">${icone(it.tit)}</div><div class="cont">${it.num} de ${n}</div>`}
        <div class="tit">${esc(it.tit)}</div>
        <div class="txt">${palavras(destaca(it.txt))}</div>
      </div>`).join('\n');

fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="pt-BR" data-resolution="portrait">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Chakra Petch"; src: url("assets/fonts/chakra-700.woff2") format("woff2"); font-weight: 700; }
      @font-face { font-family: "Plus Jakarta Sans"; src: url("assets/fonts/jakarta-600.woff2") format("woff2"); font-weight: 600; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #0b0a08; }
      #root { position: absolute; inset: 0; background-color: #0b0a08;
        background-image: radial-gradient(900px 620px at 88% -6%, rgba(222,178,82,0.11), transparent 62%),
          linear-gradient(rgba(222,190,120,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(222,190,120,0.035) 1px, transparent 1px);
        background-size: auto, 40px 40px, 40px 40px; }
      #topo { position: absolute; left: 90px; top: 150px; font: 600 38px "Plus Jakarta Sans"; letter-spacing: 0.12em; text-transform: uppercase; color: #deb252; }
      #barra { position: absolute; left: 90px; top: 220px; width: 900px; height: 8px; border-radius: 4px; background: rgba(222,190,120,0.15); }
      #barra i { display: block; height: 100%; width: 100%; border-radius: 4px; background: #deb252; transform-origin: 0 50%; }
      .card { position: absolute; left: 90px; top: 640px; width: 900px; }
      .card .cont { font: 600 40px "Plus Jakarta Sans"; color: #a89c84; margin-bottom: 36px; }
      .card .tit { font: 700 92px/1.02 "Chakra Petch"; text-transform: uppercase; color: #f4d78c; margin-bottom: 48px; }
      .card .txt { font: 600 62px/1.3 "Plus Jakarta Sans"; color: #f4efe4; }
      .card .txt b { font-weight: 600; color: #f4d78c; }
      .icw { width: 200px; height: 200px; margin-bottom: 50px; border-radius: 40px; display: grid; place-items: center;
        background: rgba(222,178,82,0.08); box-shadow: 0 0 0 2px rgba(222,178,82,0.35), 0 0 60px rgba(222,178,82,0.18); }
      .ic { width: 120px; height: 120px; color: #f4d78c; }
      .caso { top: 520px; }
      .caso .cont { color: #deb252; letter-spacing: 0.12em; text-transform: uppercase; }
      .caso .enun { font: 600 56px/1.35 "Plus Jakarta Sans"; color: #f4efe4; padding: 44px; border-radius: 28px; background: rgba(255,255,255,0.04); box-shadow: 0 0 0 2px rgba(222,190,120,0.2); margin-bottom: 40px; }
      .caso .resp { display: flex; gap: 24px; align-items: center; padding: 30px 40px; border-radius: 24px; background: rgba(70,180,110,0.12); box-shadow: 0 0 0 2px rgba(90,200,130,0.55); font: 600 54px/1.25 "Plus Jakarta Sans"; color: #e6f6ea; }
      .caso .resp .ic { flex: none; width: 76px; height: 76px; color: #6ee7a0; }
      .capa { top: 560px; text-align: center; }
      .capa .emb { display: block; width: 300px; height: 300px; margin: 0 auto 70px; border-radius: 44px; box-shadow: 0 0 0 2px rgba(222,190,120,0.35); }
      .capa .txt { color: #cfc5b2; }
      #aviso { position: absolute; left: 0; top: 1760px; width: 1080px; text-align: center; font: 600 30px "Plus Jakarta Sans"; color: #6f6656; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
      <div id="topo">Revisão · ${esc(M.curto || nome)}</div>
      <div id="barra"><i id="barra-i"></i></div>
${cartoes}
      <div id="aviso">Preparatório CTSP · sem vínculo oficial com a Brigada Militar</div>
      <audio id="narracao" class="clip" src="assets/audio/narracao.mp3" data-start="0" data-duration="${total}" data-track-index="2" data-volume="1"></audio>
${sons}
${temTrilha ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${total}" data-track-index="5" data-volume="0.1"></audio>` : ''}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#barra-i", { scaleX: 0 }, { scaleX: 1, duration: ${total}, ease: "none" }, 0);
      document.querySelectorAll(".card").forEach((c) => {
        const ini = +c.dataset.start, fim = ini + +c.dataset.duration;
        tl.fromTo([...c.children].filter((e) => !e.classList.contains("resp")), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out", stagger: 0.08 }, ini);
        tl.fromTo(c.querySelectorAll(".txt .w, .enun .w"), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: ${DIG} }, ini + 0.3);
        const ic = c.querySelector(".icw");
        if (ic) tl.fromTo(ic, { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 0.5, ease: "back.out(2)" }, ini);
        // no caso, a resposta só aparece quando a narração chega nela (~65% da fala)
        const r = c.querySelector(".resp");
        if (r) tl.fromTo(r, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, ini + (fim - ini) * 0.65);
        tl.to(c.children, { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" }, fim - 0.22);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);
console.log(`\nprojeto: ${dir}\nduração: ${total} s — agora: npx hyperframes check / render dentro da pasta`);
