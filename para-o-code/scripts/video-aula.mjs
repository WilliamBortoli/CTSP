// Gera as videoaulas de uma matéria a partir da apostila (docs/js/conteudo.js), no visual da revisão.
// Uso: node para-o-code/scripts/video-aula.mjs <mat> [parte]   ex.: cf   (VoiceStudio aberto; ffmpeg e ffprobe no PATH)
// A matéria é dividida em partes de ~10 min (tópicos inteiros); sem [parte], gera todas.
// Saída: video/aula-<mat>-<parte>/ (projeto HyperFrames)
// A fala só lê o texto da apostila (com conectivos como "Cuidado" e "Resposta"); as questões vêm do banco.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { narrarCorrido, ff } from './voz.mjs';

const [mat, soParte] = process.argv.slice(2);
const RAIZ = path.resolve(import.meta.dirname, '../..');
const VEL = 1.15;
const REF = { audio: path.join(RAIZ, 'video/ctsp-apresenta/voz-ref.wav'), texto: 'E um plano semana a semana, do diagnóstico até o dia da prova.' }; // mesma voz dos Reels
const ALVO = 600; // segundos por parte
const PAL_S = 2.7; // palavras por segundo depois do VEL, para estimar o tamanho das partes

const w = {}; new Function('window', fs.readFileSync(path.join(RAIZ, 'docs/js/conteudo.js'), 'utf8'))(w);
const M = w.CONTEUDO.mats.find(m => m.id === mat);
if (!M) { console.error('matéria não achada:', mat); process.exit(1); }
const BANCO = JSON.parse(fs.readFileSync(path.join(RAIZ, 'docs/dados/banco.json'), 'utf8'));

// elementos de primeiro nível de um trecho de html: { tag, cls, html, dentro }
const VAZIAS = /^(br|img|hr|input)$/;
const kids = h => {
  const out = []; let d = 0, ini = 0, abre;
  for (const m of h.matchAll(/<(\/?)([a-z0-9]+)\b[^>]*>/g)) {
    if (VAZIAS.test(m[2])) continue;
    if (!m[1]) { if (!d++) { ini = m.index; abre = m; } }
    else if (!--d) out.push({ tag: abre[2], cls: (abre[0].match(/class="([^"]+)"/) || [, ''])[1], html: h.slice(ini, m.index + m[0].length), dentro: h.slice(ini + abre[0].length, m.index) });
  }
  return out;
};
console.assert(kids('<div class="a"><div>x</div></div><p>y</p>').map(k => k.cls + k.tag).join() === 'adiv,p', 'kids: autoteste');
const limpa = h => h.replace(/<(\/?)(strong|em)>/g, '<$1b>').replace(/<s>/g, '<s>').replace(/<(?!\/?(b|s)>)[^>]+>/g, '').replace(/\s+/g, ' ').trim(); // só negrito e riscado ficam
const texto = h => h.replace(/<\/(?:strong|em|b)>(?=\p{L})/gu, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').replace(/\s([.,;:!?])/g, '$1').trim();
const todos = (h, re) => [...h.matchAll(re)].map(m => m[1]);
const romano = r => [...r].reduce((t, c, i) => { const v = { I: 1, V: 5, X: 10, L: 50, C: 100 }, a = v[c], b = v[r[i + 1]] || 0; return t + (a < b ? -a : a); }, 0);
console.assert(romano('LXXIX') === 79 && romano('XLI') === 41, 'romano: autoteste');
const ponto = s => /[.!?:]$/.test(s) ? s : s + '.';
const ORD = ['Primeiro', 'Segundo', 'Terceiro', 'Quarto', 'Quinto', 'Sexto', 'Sétimo', 'Oitavo'];
// só ajusta a leitura em voz alta; a tela mostra o texto da apostila
const falar = s => texto(s).replace(/\b[Aa]rts\.\s*/g, 'artigos ').replace(/\b[Aa]rt\.\s*/g, 'artigo ').replace(/§§?\s*/g, 'parágrafo ').replace(/\s*\([^)]*\)/g, '')
  .replace(/\b1\/3\b/g, 'um terço').replace(/\b2\/3\b/g, 'dois terços').replace(/\s*[×→]\s*/g, ', ').replace(/[–]/g, ' a ').replace(/≤\s*/g, 'até ')
  .replace(/\bCOFIFOMOB\b/g, 'Co, Fi, Fo, Mo, Ob').replace(/de Autoexecutoriedade/g, 'de Auto executoriedade') // a voz erra essas duas palavras
  .replace(/=/g, ' equivale a ').replace(/CE\/RS/g, 'Constituição Estadual').replace(/(\d\.\d{3})\/\d{2,4}/g, '$1')
  // romano só depois de "inciso" ou "artigo 5º," (senão "CI" de Cidadania vira 101)
  .replace(/(incisos?\s+|artigos?\s+\d+º?,\s+|º:\s+)([IVXLC]+)\b(\s+a\s+([IVXLC]+)\b)?/g, (_, a, r1, e, r2) => a + romano(r1) + (e ? ' a ' + romano(r2) : ''))
  .replace(/\b(?:[B-DF-HJ-NP-TV-Z]{2,5}|IPM|CPI|NI)\b/g, x => x.split('').join(' ')).replace(/;/g, ',').replace(/\.\.+/g, '.').replace(/["“”]/g, '').replace(/\s+/g, ' ');

// peças: cada uma é uma fala e um pedaço da tela que entra quando a fala começa
const pecasDoBloco = (k, lbl) => {
  const P = [];
  const d = k.dentro;
  for (const e of kids(d)) {
    if (e.cls === 'lbl') continue;
    if (e.cls === 'big-rule') P.push({ kind: 'big', html: limpa(e.dentro), fala: texto(e.dentro) });
    else if (e.cls === 'quote') P.push({ kind: 'quote', html: limpa(e.dentro), fala: texto(e.dentro) });
    else if (e.tag === 'p') P.push({ kind: 'p', html: limpa(e.dentro), fala: texto(e.dentro) });
    else if (e.tag === 'ul') for (const li of todos(e.dentro, /<li>([\s\S]*?)<\/li>/g)) P.push({ kind: 'li', html: limpa(li), fala: texto(li) });
    else if (e.cls === 'acro') {
      const acro = [...e.dentro.matchAll(/<span class="t">\s*<b>([^<]*)<\/b>\s*<span>([^<]*)<\/span>/g)].map(m => [m[1], m[2]]);
      const letras = acro.every(([l]) => /^[A-ZÁ-Ú]$/.test(l));
      P.push({ kind: 'acro', acro, sigla: letras ? acro.map(a => a[0]).join('') : '', segs: acro.map(([l, p]) => (letras ? `${l}, de ${p}` : `${l}: ${p}`) + '.') });
    } else if (e.cls === 'swap') {
      const [mau, bom] = todos(e.dentro, /<span class="w (?:bad|good)">([\s\S]*?)<\/span>/g);
      P.push({ kind: 'swap', mau: limpa(mau), bom: limpa(bom), segs: [`Cuidado com: ${ponto(texto(mau))}`, `Errado. ${ponto(texto(bom))}`], skip: 1 });
    } else if (/^(tl|day)$/.test(e.cls)) P.push(grafico(e, d));
    else if (/^(tw|matriz|flow|duo|portas|passos)$/.test(e.cls)) P.push(...pecasSoltas(e, d));
    else if (/^(tl-axis|day-axis|keyrow)$/.test(e.cls)) continue; // vão junto do gráfico
    else throw new Error(`peça "${e.tag}.${e.cls}" sem cena (${lbl})`);
  }
  // a sigla é soletrada na fala ("CTRA" vira "C, T, R, A")
  const sig = P.find(p => p.sigla)?.sigla;
  if (sig) for (const p of P) if (p.fala) p.fala = p.fala.replace(new RegExp(`\\b${sig}\\b`, 'g'), sig.split('').join(', '));
  return P;
};
// gráfico de barras da apostila (linha do tempo ou janela do dia): a fala lê a descrição acessível
const grafico = (e, h) => {
  const eixo = kids(h).find(x => /axis/.test(x.cls)), chave = kids(h).find(x => x.cls === 'keyrow');
  return { kind: 'graf', html: e.html.replace(/ role="img"| aria-label="[^"]*"/g, '') + (eixo ? eixo.html : '') + (chave ? chave.html : ''), fala: e.html.match(/aria-label="([^"]*)"/)[1] };
};
const tabela = (cab, linhas) => ({ kind: 'tab', cab, linhas,
  segs: linhas.map(r => [texto(r[0]), r.slice(1).map((c, j) => [cab[j + 1], texto(c)]).filter(([, c]) => c && c !== '—').map(([h, c]) => cab.length > 2 ? `${h}, ${c}` : c).join('. ')].filter(Boolean).join(': ') + '.') }); // com 2 colunas o nome da coluna não é lido
const pecasSoltas = (k, irmaos) => {
  if (k.cls === 'duo') return kids(k.dentro).map(col => {
    const cab = texto(col.dentro.match(/<b>([\s\S]*?)<\/b>/)[1]), lis = todos(col.dentro, /<li>([\s\S]*?)<\/li>/g);
    const itens = lis.length ? lis : todos(col.dentro, /<p>([\s\S]*?)<\/p>/g); // coluna de texto corrido
    return { kind: 'col', cab, itens: itens.map(limpa), segs: [`${cab}:`, ...itens.map((x, i) => lis.length ? texto(x) + (i < itens.length - 1 ? ',' : '.') : ponto(texto(x)))], skip: 1 };
  });
  if (k.cls === 'portas') return kids(k.dentro).map(p => {
    const [L, al, tx] = todos(p.dentro, /<span[^>]*>([\s\S]*?)<\/span>/g);
    return { kind: 'porta', L, al, html: limpa(tx), fala: ponto(texto(tx)) };
  });
  if (k.cls === 'passos') return todos(k.dentro, /<li>([\s\S]*?)<\/li>/g).map((li, i) => ({ kind: 'passo', n: i + 1, html: limpa(li), fala: `${ORD[i]}: ${ponto(texto(li))}` }));
  if (k.cls === 'flow') return kids(k.dentro).filter(x => x.cls !== 'arrow').map((x, i) => {
    const [b, s] = [x.dentro.match(/<b>([\s\S]*?)<\/b>/)[1], x.dentro.match(/<span>([\s\S]*?)<\/span>/)[1]];
    return { kind: 'flow', primeiro: !i, cab: texto(b), html: limpa(s), fala: `${texto(b)}: ${ponto(texto(s))}` };
  });
  if (k.cls === 'tw') {
    const cab = todos(k.dentro, /<th[^>]*>([\s\S]*?)<\/th>/g).map(texto);
    const linhas = todos(k.dentro, /<tr>([\s\S]*?)<\/tr>/g).map(r => todos(r, /<td[^>]*>([\s\S]*?)<\/td>/g)).filter(r => r.length);
    return [tabela(cab, linhas.map(r => r.map(limpa)))];
  }
  if (k.cls === 'matriz') {
    const cel = kids(k.dentro), cab = cel.filter(c => /\bh\b/.test(c.cls)).map(c => texto(c.dentro)), corpo = cel.filter(c => !/\bh\b/.test(c.cls));
    const linhas = []; for (let i = 0; i < corpo.length; i += cab.length) linhas.push(corpo.slice(i, i + cab.length).map(c => limpa(c.dentro)));
    return [tabela(cab, linhas)];
  }
  if (k.cls === 'tl') return [grafico(k, irmaos)];
  if (k.cls === 'tl-axis') return [];
  if (k.tag === 'p') return [{ kind: 'p', html: limpa(k.dentro), fala: texto(k.dentro) }];
  throw new Error(`bloco "${k.tag}.${k.cls}" sem cena`);
};

// altura aproximada de cada peça na tela (px), para quebrar cenas compridas em páginas
const linhas = (s, fs, larg = 900) => Math.ceil((texto(s).length * fs * 0.5) / larg) * fs * 1.32;
const ALT = {
  p: p => linhas(p.html, 52), li: p => linhas(p.html, 52, 856), big: () => 200, quote: p => linhas(p.html, 76) * 0.9, acro: () => 260,
  swap: p => linhas(p.mau, 46, 780) + linhas(p.bom, 46, 780) + 130, col: p => 140 + p.itens.reduce((s, x) => s + linhas(x, 44, 800), 0),
  porta: p => Math.max(130, linhas(p.html, 42, 700) + 60), passo: p => Math.max(110, linhas(p.html, 50, 760) + 30),
  flow: p => 110 + linhas(p.html, 46, 820), tab: p => 110 + p.linhas.reduce((s, r) => s + Math.max(...r.map(c => linhas(c, 38, 900 / r.length))) + 30, 0), graf: () => 420,
};
const ALTURA_MAX = 1180;
// tabela mais alta que a página continua em outra cena, repetindo o cabeçalho; a narração não muda
const cabeNaPagina = t => 160 + ALT.tab(t) + 36 <= ALTURA_MAX;
const divideTabela = p => {
  if (p.kind !== 'tab' || cabeNaPagina(p)) return [p];
  const pedacos = []; let atual = [];
  for (const l of p.linhas) {
    if (atual.length && !cabeNaPagina(tabela(p.cab, [...atual, l]))) { pedacos.push(tabela(p.cab, atual)); atual = []; }
    atual.push(l);
  }
  pedacos.push(tabela(p.cab, atual));
  if (p.lbl) pedacos[0].lbl = p.lbl;
  return pedacos;
};
{ const d = divideTabela(tabela(['a', 'b'], Array(40).fill(['x'.repeat(50), 'y'.repeat(50)]))); if (d.length < 2 || d.flatMap(t => t.linhas).length !== 40 || !d.every(cabeNaPagina)) throw new Error('divideTabela: autoteste falhou'); }

// tópico → cenas
const ICO = { target: 'target', list: 'list-checks', bolt: 'zap', alert: 'triangle-alert', shield: 'shield' };
const cenasDoTopico = T => {
  const tit = T.html.match(/<\/small>([\s\S]*?)<\/h2>/)[1];
  const cenas = [{ tipo: 'topico', tit, partes: [{ kind: 'nada', fala: `Tópico ${+T.n}. ${texto(tit)}.` }] }];
  const corpo = T.html.slice(T.html.indexOf('</header>') + 9, T.html.lastIndexOf('</section>'));
  let ultimo = { lbl: texto(tit), ico: 'target' };
  for (const k of kids(corpo)) {
    const blk = k.cls.match(/^blk (\w+)$/);
    let pecas, lbl, ico;
    if (blk) {
      const l = k.dentro.match(/<p class="lbl" data-ico="(\w+)">([\s\S]*?)<\/p>/);
      [ico, lbl] = [ICO[l[1]] || 'bookmark', texto(l[2])];
      pecas = pecasDoBloco(k, lbl);
      if (pecas[0]) pecas[0].lbl = lbl; // o rótulo é lido antes da primeira peça
      ultimo = { lbl, ico };
    } else { pecas = pecasSoltas(k, corpo); ({ lbl, ico } = ultimo); }
    if (!pecas.length) continue;
    // quebra em páginas pela altura
    let pag = [], h = 160;
    const fecha = () => { if (pag.length) cenas.push({ tipo: 'bloco', lbl, ico, partes: pag }); pag = []; h = 160; };
    for (const p of pecas.flatMap(divideTabela)) { const a = ALT[p.kind](p) + 36; if (pag.length && h + a > ALTURA_MAX) fecha(); pag.push(p); h += a; }
    fecha();
  }
  // questão do banco: mesma lei do tópico (herdada do anterior quando a referência só traz artigos) e artigo no intervalo
  const L = leis(T.ref).length ? leis(T.ref) : leiAnterior;
  leiAnterior = L;
  const A = arts(T.ref);
  const q = BANCO.filter(x => x.mat === M.id && !usadas.has(x) && !/\n/.test(x.enunciado) && x.alternativas.every(a => a.length < 140) && x.enunciado.length < 320)
    .filter(x => leis(x.fundamento).some(l => L.includes(l)))
    .sort((x, y) => x.nivel - y.nivel)
    .find(x => !A.length || todos(x.fundamento, /\b(\d+)/g).some(n => A.some(([i, f]) => +n >= i && +n <= f)));
  if (q) {
    usadas.add(q);
    const L = 'ABCDE';
    cenas.push({ tipo: 'questao', q, partes: [
      { kind: 'enun', segs: [`Hora da questão. ${texto(q.enunciado)}`, ...q.alternativas.map((a, i) => `${L[i]}: ${ponto(texto(a))}`)], skip: 1 },
      { kind: 'expl', fala: texto(q.explicacao), lbl: `Resposta: letra ${L[q.correta]}` },
    ] });
  } else console.log(`  sem questão do banco para o tópico ${T.n} (${T.ref})`);
  return cenas;
};
const usadas = new Set();
const PADRAO = { pm: ['CPM'], ppm: ['CPPM'], cf: ['CF'], pp: ['CPP'], dp: ['CP'], da: ['CF'] };
let leiAnterior = PADRAO[M.id] || [];
const leis = s => (s.match(/\b\d{1,2}\.\d{3}\b|\b(?:CPPM|CPM|CPP|CP|CF|CTB|ECA)\b|CE\/RS/g) || []).map(l => l === "CE/RS" ? "CE" : l === "ECA" ? "8.069" : l);
// "arts. 2º a 8º", "arts. 11 e 15", "arts. 55 e seguintes" → [[2, 8]], [[11, 11], [15, 15]], [[55, 85]]
const arts = s => { const m = s.match(/arts?\.\s*(.*)/); if (!m) return [];
  return [...m[1].matchAll(/(\d+)º?(?:-[A-Z])?(?:\s+a\s+(\d+)|\s+e\s+seguintes)?/g)].map(x => [+x[1], x[2] ? +x[2] : /seguintes/.test(x[0]) ? +x[1] + 30 : +x[1]]); };
console.assert(JSON.stringify(arts('LC 10.990 · arts. 2º a 8º')) === '[[2,8]]' && JSON.stringify(arts('arts. 55 e seguintes')) === '[[55,85]]', 'arts: autoteste');

// partes de ~10 min com tópicos inteiros, equilibradas pela quantidade de palavras
const pesos = M.tops.map(T => texto(T.html).split(' ').length + 120); // +120: questão
const nPartes = Math.max(1, Math.ceil(pesos.reduce((a, b) => a + b) / PAL_S / (ALVO * 1.3)));
const partes = Array.from({ length: nPartes }, () => []);
{ const alvo = pesos.reduce((a, b) => a + b) / nPartes; let acc = 0;
  M.tops.forEach((T, i) => { const k = Math.min(nPartes - 1, Math.floor((acc + pesos[i] / 2) / alvo)); partes[k].push(T); acc += pesos[i]; }); }
console.log(`${M.nome}: ${M.tops.length} tópicos em ${nPartes} parte(s): ${partes.map(p => p.length).join(' + ')}`);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const ic = n => fs.readFileSync(path.join(RAIZ, 'node_modules/lucide-static/icons', n + '.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/class="[^"]*"/, 'class="ic"');
const palavras = h => h.replace(/([^\s<>]+)(?![^<]*>)/g, '<span class="w">$1</span>'); // revela palavra a palavra junto da fala
const at = p => `data-t="${p.ini}" data-d="${p.dur}"`;
// tempo de cada palavra da fala (narrarCorrido); trechos (segs) e palavras da tela entram no tempo em que são lidos
const tPal = (p, i) => p.palavras[Math.min(p.palavras.length - 1, i)].t;
const segT = p => { let i = 0; return p.segs.map(s => { const t = tPal(p, i); i += s.split(/\s+/).length; return t; }); };
const marca = (p, h) => {
  const n = (h.match(/class="w[ "]/g) || []).length, fim = p.palavras.length - p.pre; let k = 0;
  const ts = p.segs ? segT(p).slice(p.skip || 0) : Array.from({ length: n }, (_, i) => tPal(p, p.pre + Math.floor(i * fim / n)));
  return h.replace(/class="w([ "])/g, m => `data-ts="${ts[k++] ?? p.ini}" ${m}`);
};
const peca = p => marca(p, pecaHtml(p));
const pecaHtml = p => {
  const a = at(p);
  switch (p.kind) {
    case 'p': return `<p class="par fala" ${a}>${palavras(p.html)}</p>`;
    case 'li': return `<div class="li fala" ${a}>${palavras(p.html)}</div>`;
    case 'big': return `<p class="big fala" ${a}>${p.html}</p>`;
    case 'quote': return `<p class="quote fala" ${a}>${palavras(p.html)}</p>`;
    case 'acro': return `<div class="acro fala" ${a}>${p.acro.map(([l, n]) => `<div class="w"><b>${l}</b><span>${n}</span></div>`).join('')}</div>`;
    case 'swap': return `<div class="swap fala" ${a}><div class="mau">${ic('circle-x')}<span class="risca">${p.mau}</span></div><div class="bom w">${ic('circle-check')}<span>${p.bom}</span></div></div>`;
    case 'col': return `<div class="col fala" ${a}><b>${esc(p.cab)}</b><ul>${p.itens.map(x => `<li class="w">${x}</li>`).join('')}</ul></div>`;
    case 'porta': return `<div class="porta fala" ${a}><b class="L">${p.L}</b><div><span class="al">${p.al}</span><span>${p.html}</span></div></div>`;
    case 'passo': return `<div class="passo fala" ${a}><b>${p.n}</b><span>${palavras(p.html)}</span></div>`;
    case 'flow': return `${p.primeiro ? '' : `<div class="seta fala" ${a}>${ic('arrow-down')}</div>`}<div class="flow fala" ${a}><b>${esc(p.cab)}</b><span>${palavras(p.html)}</span></div>`;
    case 'tab': return `<div class="tab fala" ${a} style="--n:${p.cab.length}"><div class="tr th">${p.cab.map(c => `<span>${esc(c)}</span>`).join('')}</div>${p.linhas.map(r => `<div class="tr w">${r.map(c => `<span>${c}</span>`).join('')}</div>`).join('')}</div>`;
    case 'graf': return `<div class="graf fala" ${a}>${p.html}</div>`;
  }
};
const cab = c => `<div class="lbl${c.lbl.length > 26 ? ' longo' : ''}">${ic(c.ico)}<span>${esc(c.lbl)}</span></div>`;

const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
const SFX = path.join(os.homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.209/skills/media-use/audio/assets/sfx');
const BASE = path.join(RAIZ, 'video/trilha-base.wav');

for (const [pi, tops] of partes.entries()) {
  const np = pi + 1;
  if (soParte && +soParte !== np) { tops.forEach(cenasDoTopico); continue; } // mantém a escolha das questões igual
  const parte = nPartes > 1 ? ` · Parte ${np} de ${nPartes}` : '';
  const cenas = [{ tipo: 'capa', tops, partes: [{ kind: 'nada', fala: `Aula de ${M.nome}${nPartes > 1 ? `, parte ${np} de ${nPartes}` : ''}. Nesta aula: ${tops.map(T => texto(T.html.match(/data-nav="([^"]*)"/)[1]).replace(/^RDBM: /, '')).join(', ')}.` }] }, // a voz para de falar depois de "R D B M:" na lista
    ...(process.env.PREVIA ? cenasDoTopico(tops[0]) : tops.flatMap(cenasDoTopico)), // PREVIA=1: só a capa e o primeiro tópico, para ver o estilo
    ...(process.env.PREVIA ? [] : [{ tipo: 'fim', partes: [{ kind: 'nada', fala: 'Agora é com você. Faça as questões desta matéria no portal.' }] }])];
  const itens = cenas.flatMap((c, ci) => c.partes.map((p, k) => Object.assign(p, { tit: `${c.tipo} ${ci}.${k + 1}` })));
  // fala final já no jeito de ler: rótulo + texto; pre = palavras do rótulo (a tela não mostra)
  for (const p of itens) {
    const lb = p.lbl ? falar(p.lbl + '.') + ' ' : '';
    if (p.segs) { p.segs = p.segs.map(falar); p.segs[0] = lb + p.segs[0]; p.fala = p.segs.join(' '); } else p.fala = lb + falar(p.fala);
    p.pre = lb ? lb.trim().split(/\s+/).length : 0;
  }
  const dir = path.join(RAIZ, 'video', `aula-${mat}-${np}`);
  if (process.env.SECO) { console.log(itens.map(p => `[${p.tit}] ${p.fala}`).join('\n')); continue; } // só confere o roteiro
  const total = await narrarCorrido(itens, dir, { VEL, ref: REF });
  for (const c of cenas) Object.assign(c, { ini: c.partes[0].ini, fim: +(c.partes.at(-1).ini + c.partes.at(-1).dur).toFixed(2) });

  // trilha, fontes, gsap, emblema e sons: os mesmos da revisão
  const temTrilha = fs.existsSync(BASE);
  // shortcut: repete o mesmo trecho em loop, pode haver emenda audível; trocar por trilha mais longa se incomodar
  if (temTrilha) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', BASE, '-t', String(total),
    '-af', `afade=t=in:d=1.5,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5`, '-b:a', '96k', path.join(dir, 'assets/audio/trilha.mp3')]);
  for (const p of ['fonts', 'vendor', 'img/emblema.jpg']) fs.cpSync(path.join(reels, p), path.join(dir, 'assets', p), { recursive: true });
  fs.mkdirSync(path.join(dir, 'assets/audio/sfx'), { recursive: true });
  for (const f of ['click-soft.mp3', 'whoosh-short.mp3']) fs.copyFileSync(path.join(SFX, f), path.join(dir, 'assets/audio/sfx', f));

  const corpoCena = c => {
    if (c.tipo === 'capa') return `<img class="emb" src="assets/img/emblema.jpg" alt="" />
        <div class="kick">Videoaula${esc(parte)}</div><div class="tit">${esc(M.nome)}</div>
        <ol class="sum">${c.tops.map(T => `<li><b>${T.n}</b><span>${T.html.match(/data-nav="([^"]*)"/)[1]}</span></li>`).join('')}</ol>`;
    if (c.tipo === 'fim') return `<img class="emb" src="assets/img/emblema.jpg" alt="" />
        <div class="tit">Agora é com você</div><div class="ref">Faça as questões desta matéria no portal</div>`;
    if (c.tipo === 'topico') { const T = tops.find(T => T.html.includes(c.tit)); return `<div class="num">${T.n}</div><div class="kick">Tópico</div><div class="tit">${c.tit}</div><div class="linha"></div><div class="ref">${esc(T.ref)}</div>`; }
    if (c.tipo === 'questao') return `${cab({ ico: 'circle-help', lbl: 'Hora da questão' })}<div class="enun fala" ${at(c.partes[0])}>${esc(c.q.enunciado)}</div>
        <ol class="alts fala" data-t="${segT(c.partes[0])[1]}" data-d="0">${c.q.alternativas.map((a, i) => `<li data-ts="${segT(c.partes[0])[i + 1]}" class="${i === c.q.correta ? 'certa' : ''}"><b>${'ABCDE'[i]}</b><span>${esc(a)}</span></li>`).join('')}</ol>
        ${marca(c.partes[1], `<p class="expl fala" ${at(c.partes[1])}>${palavras(esc(c.q.explicacao))}</p>`)}`;
    return cab(c) + c.partes.map(peca).join('');
  };
  const html = cenas.map((c, i) => `      <div id="cena${i}" class="clip cena ${c.tipo}" data-start="${c.ini}" data-duration="${(Math.min(total, c.fim + 0.35) - c.ini).toFixed(2)}" data-track-index="1">
        ${corpoCena(c)}
      </div>`).join('\n');
  const sons = [
    ...cenas.map((c, i) => `      <audio id="passa${i}" class="clip" src="assets/audio/sfx/whoosh-short.mp3" data-start="${Math.max(0.05, c.ini - 0.15).toFixed(2)}" data-duration="0.5" data-track-index="3" data-volume="0.18"></audio>`),
    ...itens.filter(p => p.kind !== 'nada' && p.kind !== 'enun').map((p, i) => `      <audio id="clique${i}" class="clip" src="assets/audio/sfx/click-soft.mp3" data-start="${p.ini}" data-duration="0.36" data-track-index="4" data-volume="0.25"></audio>`),
  ].join('\n');
  const sumario = cenas.filter(c => c.tipo === 'topico').map(c => c.ini);

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
      #topo { position: absolute; left: 90px; top: 150px; width: 900px; display: flex; justify-content: space-between; font: 600 32px "Plus Jakarta Sans"; letter-spacing: 0.1em; text-transform: uppercase; color: #deb252; }
      #topo span + span { color: #a89c84; }
      #barra { position: absolute; left: 90px; top: 210px; width: 900px; height: 8px; border-radius: 4px; background: rgba(222,190,120,0.15); }
      #barra i { display: block; height: 100%; width: 100%; border-radius: 4px; background: #deb252; transform-origin: 0 50%; }
      #barra u { position: absolute; top: -4px; width: 4px; height: 16px; border-radius: 2px; background: #0b0a08; }
      .cena { position: absolute; left: 90px; top: 290px; width: 900px; height: 1420px; display: flex; flex-direction: column; justify-content: center; gap: 36px;
        font: 600 52px/1.32 "Plus Jakarta Sans"; color: #f4efe4; }
      .cena b { font-weight: 600; color: #f4d78c; }
      .cena s { text-decoration-color: #f07a6e; color: #cfc5b2; }
      .ic { width: 60px; height: 60px; color: #f4d78c; flex: none; }
      .lbl { display: flex; align-items: center; gap: 24px; font: 700 58px/1.05 "Chakra Petch"; text-transform: uppercase; color: #f4d78c; margin-bottom: 8px; }
      .lbl.longo { font-size: 44px; }
      .lbl .ic { width: 96px; height: 96px; padding: 20px; border-radius: 28px; background: rgba(222,178,82,0.08); box-shadow: 0 0 0 2px rgba(222,178,82,0.35), 0 0 50px rgba(222,178,82,0.16); }
      .capa, .fim, .topico { text-align: center; align-items: center; }
      .emb { width: 240px; height: 240px; border-radius: 40px; box-shadow: 0 0 0 2px rgba(222,190,120,0.35); }
      .kick { font-size: 38px; letter-spacing: 0.14em; text-transform: uppercase; color: #deb252; }
      .tit { font: 700 86px/1.05 "Chakra Petch"; text-transform: uppercase; color: #f4d78c; }
      .ref { font-size: 38px; color: #cfc5b2; }
      .num { font: 700 260px/0.9 "Chakra Petch"; color: transparent; -webkit-text-stroke: 3px #deb252; }
      .sum { list-style: none; text-align: left; width: 100%; display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
      .sum li { display: flex; gap: 24px; font-size: 38px; color: #cfc5b2; padding: 14px 26px; border-radius: 18px; background: rgba(255,255,255,0.03); }
      .sum li b { font-family: "Chakra Petch"; font-weight: 700; }
      .li { padding-left: 46px; position: relative; }
      .li::before { content: ""; position: absolute; left: 0; top: 24px; width: 18px; height: 18px; border-radius: 50%; background: #deb252; }
      .big { font: 700 84px/1.1 "Chakra Petch"; text-align: center; text-transform: uppercase; }
      .col { padding: 36px 44px; border-radius: 28px; background: rgba(255,255,255,0.04); box-shadow: 0 0 0 2px rgba(222,190,120,0.25); }
      .col > b { display: block; font: 700 56px/1 "Chakra Petch"; text-transform: uppercase; margin-bottom: 20px; }
      .col + .col > b { color: #a8b4c4; }
      .col ul { list-style: none; } .col li { font-size: 44px; padding: 5px 0; }
      .col li::before { content: "· "; color: #deb252; }
      .acro { display: flex; flex-wrap: wrap; gap: 18px; }
      .acro > div { flex: 1 1 270px; text-align: center; padding: 28px 8px; border-radius: 28px; background: rgba(222,178,82,0.08); box-shadow: 0 0 0 2px rgba(222,178,82,0.4); }
      .acro b { display: block; font: 700 110px/1.05 "Chakra Petch"; }
      .acro span { font-size: 34px; line-height: 1.2; color: #cfc5b2; }
      .quote { font: 700 70px/1.15 "Chakra Petch"; text-align: center; color: #f4d78c; }
      .swap { display: flex; flex-direction: column; gap: 18px; }
      .mau, .bom { display: flex; gap: 24px; align-items: center; padding: 28px 36px; border-radius: 24px; font-size: 46px; line-height: 1.25; }
      .mau { background: rgba(220,80,70,0.1); box-shadow: 0 0 0 2px rgba(230,90,80,0.55); color: #f2c9c4; }
      .mau span { text-decoration: line-through; text-decoration-thickness: 4px; text-decoration-color: rgba(240,110,100,0); }
      .mau .ic { color: #f07a6e; } .bom .ic { color: #6ee7a0; }
      .bom { background: rgba(70,180,110,0.12); box-shadow: 0 0 0 2px rgba(90,200,130,0.55); color: #e6f6ea; }
      .porta { display: flex; gap: 28px; align-items: center; font-size: 40px; line-height: 1.25; }
      .porta .L { flex: none; width: 96px; height: 96px; display: grid; place-items: center; border-radius: 24px; font: 700 60px "Chakra Petch"; background: rgba(222,178,82,0.1); box-shadow: 0 0 0 2px rgba(222,178,82,0.45); }
      .porta .al { display: block; font: 700 34px "Chakra Petch"; color: #deb252; letter-spacing: 0.06em; }
      .passo { display: flex; gap: 28px; align-items: center; font-size: 48px; }
      .passo > b { flex: none; width: 84px; height: 84px; display: grid; place-items: center; border-radius: 50%; font: 700 48px "Chakra Petch"; color: #0b0a08; background: #deb252; }
      .flow { padding: 34px 40px; border-radius: 26px; background: rgba(255,255,255,0.04); box-shadow: 0 0 0 2px rgba(222,190,120,0.3); font-size: 46px; }
      .flow > b { display: block; font: 700 52px/1.1 "Chakra Petch"; text-transform: uppercase; margin-bottom: 12px; }
      .seta { display: grid; place-items: center; margin: -18px 0; } .seta .ic { width: 70px; height: 70px; }
      .tab { display: flex; flex-direction: column; gap: 10px; font-size: calc(46px - 4px * var(--n)); line-height: 1.25; }
      .tab .tr { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 16px; padding: 18px 24px; border-radius: 18px; background: rgba(255,255,255,0.04); }
      .tab .th { background: none; font: 700 32px "Chakra Petch"; text-transform: uppercase; color: #deb252; letter-spacing: 0.06em; }
      .tab .tr span:first-child { color: #f4d78c; }
      .graf { position: relative; font-size: 34px; }
      .graf .tl-row { display: flex; align-items: center; gap: 20px; margin-bottom: 26px; }
      .graf .who { width: 220px; flex: none; color: #f4d78c; }
      .graf .tl-track, .graf .day { position: relative; flex: 1; height: 90px; border-radius: 16px; background: rgba(255,255,255,0.05); }
      .graf .day { margin-bottom: 20px; }
      .graf .tl-bar, .graf .win, .graf .blk4 { position: absolute; top: 0; bottom: 0; display: grid; place-items: center; border-radius: 16px; font-size: 32px; color: #0b0a08; }
      .graf .solto, .graf .preso { background: #deb252; }
      .graf .pror { color: #f4efe4; background: repeating-linear-gradient(45deg, rgba(222,178,82,0.35) 0 12px, transparent 12px 24px); box-shadow: inset 0 0 0 2px rgba(222,178,82,0.6); }
      .graf .win { background: rgba(222,178,82,0.25); box-shadow: inset 0 0 0 2px #deb252; } .graf .blk4 { background: #6ee7a0; }
      .graf .tl-axis, .graf .day-axis { position: relative; height: 44px; margin-left: 240px; color: #a89c84; font-size: 28px; }
      .graf .day-axis { margin-left: 0; }
      .graf .tl-axis span, .graf .day-axis span { white-space: nowrap; position: absolute; transform: translateX(-50%); }
      .graf .keyrow { display: flex; flex-direction: column; gap: 10px; margin-top: 24px; font-size: 32px; color: #cfc5b2; }
      .graf .keyrow i { display: inline-block; width: 36px; height: 24px; border-radius: 6px; margin-right: 16px; vertical-align: middle; }
      .questao { gap: 26px; font-size: 42px; line-height: 1.3; }
      .enun { padding: 32px 38px; border-radius: 26px; background: rgba(255,255,255,0.04); box-shadow: 0 0 0 2px rgba(222,190,120,0.2); }
      .alts { list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 38px; }
      .alts li { display: flex; gap: 22px; padding: 14px 24px; border-radius: 18px; background: rgba(255,255,255,0.03); }
      .alts li b { font-family: "Chakra Petch"; font-weight: 700; }
      .alts .marca { position: absolute; inset: 0; border-radius: 18px; background: rgba(70,180,110,0.16); box-shadow: 0 0 0 2px rgba(90,200,130,0.65); }
      .alts li { position: relative; } .alts li > * { position: relative; }
      .expl { font-size: 38px; color: #cfc5b2; }
      .linha { width: 240px; height: 6px; border-radius: 3px; background: #deb252; }
      #luz { position: absolute; left: -300px; top: 900px; width: 1100px; height: 1100px; border-radius: 50%; background: radial-gradient(closest-side, rgba(222,178,82,0.08), transparent); }
      #aviso { position: absolute; left: 0; top: 1770px; width: 1080px; text-align: center; font: 600 28px "Plus Jakarta Sans"; color: #6f6656; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1080" data-height="1920">
      <div id="luz"></div>
      <div id="topo"><span>Videoaula · ${esc(M.curto || M.nome)}</span><span>${nPartes > 1 ? `Parte ${np}/${nPartes}` : ''}</span></div>
      <div id="barra"><i id="barra-i"></i>${sumario.map(t => `<u style="left:${(t / total * 100).toFixed(2)}%"></u>`).join('')}</div>
${html}
      <div id="aviso">Preparatório CTSP · sem vínculo oficial com a Brigada Militar</div>
      <audio id="narracao" class="clip" src="assets/audio/narracao.mp3" data-start="0" data-duration="${total}" data-track-index="2" data-volume="1"></audio>
${sons}
${temTrilha ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${total}" data-track-index="5" data-volume="0.07"></audio>` : ''}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#luz", { x: 0, y: 0 }, { x: 520, y: -640, duration: 14, ease: "sine.inOut", yoyo: true, repeat: Math.floor(${total} / 14) }, 0);
      tl.fromTo("#barra-i", { scaleX: 0 }, { scaleX: 1, duration: ${total}, ease: "none" }, 0);
      document.querySelectorAll(".cena").forEach((c) => {
        const ini = +c.dataset.start, fim = ini + +c.dataset.duration;
        const fixos = [...c.children].filter((e) => !e.classList.contains("fala") && !e.classList.contains("alts") && !e.classList.contains("sum"));
        tl.fromTo(fixos, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out", stagger: 0.08 }, ini);
        const num = c.querySelector(".num");
        if (num) tl.fromTo(num, { scale: 0.7 }, { scale: 1, duration: 0.6, ease: "back.out(1.8)" }, ini);
        const sum = c.querySelector(".sum");
        if (sum) tl.fromTo(sum.children, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.3, ease: "power3.out", stagger: Math.min(0.5, (fim - ini - 1.5) / sum.children.length) }, ini + 1);
        // cada peça entra quando a fala dela começa; palavras, linhas e itens entram no tempo em que são lidos
        c.querySelectorAll(".fala").forEach((f) => tl.fromTo(f, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, +f.dataset.t));
        c.querySelectorAll("[data-ts]").forEach((w) => tl.fromTo(w, { opacity: 0.14 }, { opacity: 1, duration: 0.2, ease: "power1.out" }, +w.dataset.ts));
        c.querySelectorAll(".acro > div, .tab .tr.w, .col li, .alts li").forEach((w) => tl.fromTo(w, { y: 16, scale: 0.97 }, { y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, +w.dataset.ts));
        c.querySelectorAll(".lbl .ic").forEach((i) => tl.fromTo(i, { scale: 0.5, rotate: -14 }, { scale: 1, rotate: 0, duration: 0.55, ease: "back.out(2.2)" }, ini));
        c.querySelectorAll(".linha").forEach((l) => tl.fromTo(l, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power3.inOut" }, ini + 0.3));
        // pegadinha: o errado é riscado e balança quando a fala chega no "Errado"
        c.querySelectorAll(".swap").forEach((s) => {
          const t = +s.querySelector(".bom").dataset.ts, m = s.querySelector(".mau");
          tl.to(m.querySelector(".risca"), { textDecorationColor: "rgba(240,110,100,0.95)", duration: 0.3 }, t - 0.15);
          tl.fromTo(m, { x: 0 }, { keyframes: [{ x: -10 }, { x: 10 }, { x: -6 }, { x: 0 }], duration: 0.35 }, t - 0.15);
          tl.to(m, { opacity: 0.6, duration: 0.3 }, t + 0.2);
          tl.fromTo(s.querySelector(".bom"), { x: 40 }, { x: 0, duration: 0.4, ease: "power3.out" }, t);
        });
        const alts = c.querySelector(".alts");
        if (alts) {
          const r = +c.querySelector(".expl").dataset.t, certa = alts.querySelector(".certa");
          certa.insertAdjacentHTML("afterbegin", '<i class="marca"></i>');
          tl.fromTo(certa.querySelector(".marca"), { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" }, r);
          tl.to([...alts.children].filter((li) => li !== certa), { opacity: 0.3, duration: 0.3 }, r);
        }
        // leve aproximação durante a cena e saída cruzada com a próxima (a cena dura 0,35 s além da fala)
        tl.fromTo(c, { scale: 1 }, { scale: 1.015, duration: fim - ini, ease: "none" }, ini);
        if (fim < ${total} - 0.1) tl.to(c.children, { opacity: 0, y: -24, duration: 0.33, ease: "power2.in" }, fim - 0.35);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`);
  console.log(`\nprojeto: ${dir}\nduração: ${(total / 60).toFixed(1)} min — agora: npx hyperframes check / render dentro da pasta`);
}
