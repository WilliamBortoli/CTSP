// Reel "3 crimes, 1 verbo" (vertical, ~1 min): concussão × corrupção passiva × corrupção ativa numa abordagem noturna.
// Cenário vetorial vivo (céu estrelado, lua, prédios, postes, viatura com giroflex, personagens com gestos),
// câmera com parallax, transições de fita rebobinando e glitch, carimbos com tinta, legenda palavra por palavra.
// Uso: node para-o-code/scripts/video-crimes.mjs   (VoiceStudio aberto; ffmpeg no PATH; trilha em assets/audio/trilha.wav)
// Elemento animado: data-w="palavra" (entra quando ela é falada) ou data-f="s" (s segundos antes do fim da cena),
// data-a = pop|slam|claq|marca|traco|tipo|conta|nota, data-d = atraso.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { narrarCorrido, ff } from './voz.mjs';

const RAIZ = path.resolve(import.meta.dirname, '../..');
const dir = path.join(RAIZ, 'video/ctsp-crimes');
const A = path.join(dir, 'assets');
const ETIQUETA = '3 CRIMES · 1 VERBO';
const VEL = 1;

// sorteio com semente: o cenário sai igual em todo render
const sorteio = s => () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const sem = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

// ---------- ilustrações ----------
const roda = (cx, cy, r) => `<g class="roda" data-c="${cx} ${cy}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#0a0d18"/><circle cx="${cx}" cy="${cy}" r="${r * 0.48}" fill="#8f9bb3"/>` +
  [0, 60, 120].map(a => `<rect x="${cx - 2}" y="${cy - r * 0.46}" width="4" height="${r * 0.92}" fill="#5d6782" transform="rotate(${a} ${cx} ${cy})"/>`).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.14}" fill="#3a4258"/></g>`;
const VIATURA = `<svg viewBox="0 0 420 200" width="420" height="200"><ellipse cx="210" cy="190" rx="205" ry="10" fill="#000" opacity=".5"/>
<rect class="gl-r" x="148" y="16" width="62" height="18" rx="7" fill="#ff3b4e"/><rect class="gl-b" x="210" y="16" width="62" height="18" rx="7" fill="#2f7bff"/><rect x="142" y="32" width="136" height="7" rx="3" fill="#cfd6e4"/>
<path d="M66 102 L118 42 H300 L362 102 Z" fill="#e9eef7" stroke="#070a16" stroke-width="5" stroke-linejoin="round"/>
<path d="M127 51 H204 V98 H84 Z" fill="#17254d"/><path d="M214 51 H295 L344 98 H214 Z" fill="#17254d"/><path d="M146 54 L166 54 L126 96 L106 96 Z" fill="#fff" opacity=".16"/><path d="M240 54 L256 54 L222 96 L214 96 L214 80 Z" fill="#fff" opacity=".12"/>
<rect x="16" y="96" width="392" height="72" rx="24" fill="#e9eef7" stroke="#070a16" stroke-width="5"/><rect x="20" y="126" width="384" height="20" fill="#1e3d8f"/>
<text data-layout-ignore data-layout-allow-occlusion x="212" y="120" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="22" fill="#1e3d8f">POLÍCIA</text><path d="M209 100 V164" stroke="#070a16" stroke-width="3" opacity=".45"/>
<rect x="390" y="106" width="16" height="14" rx="4" fill="#fff4c4"/><rect x="18" y="106" width="10" height="14" rx="3" fill="#ff4d5e"/>${roda(98, 166, 30)}${roda(324, 166, 30)}</svg>`;
const CARRO = `<svg viewBox="0 0 380 180" width="380" height="180"><ellipse cx="190" cy="172" rx="185" ry="9" fill="#000" opacity=".5"/>
<path d="M44 92 L100 38 H246 L300 92 Z" fill="#b92c3a" stroke="#070a16" stroke-width="5" stroke-linejoin="round"/><path d="M106 47 H170 V88 H64 Z" fill="#17254d"/><path d="M180 47 H240 L284 88 H180 Z" fill="#17254d"/>
<path d="M122 50 L138 50 L104 86 L88 86 Z" fill="#fff" opacity=".14"/><rect x="12" y="86" width="356" height="66" rx="24" fill="#d33a49" stroke="#070a16" stroke-width="5"/>
<path d="M176 92 V146" stroke="#070a16" stroke-width="3" opacity=".4"/><rect x="14" y="100" width="16" height="14" rx="4" fill="#fff6c9"/><rect x="352" y="100" width="12" height="14" rx="3" fill="#ff5a4e"/>${roda(92, 150, 28)}${roda(292, 150, 28)}</svg>`;
const POSTE = `<svg viewBox="0 0 200 540" width="200" height="540"><rect x="92" y="40" width="14" height="500" fill="#151a2e"/><path d="M99 46 Q99 12 140 12 H168" stroke="#151a2e" stroke-width="12" fill="none"/>
<path d="M150 6 H186 L180 24 H156 Z" fill="#232a44"/><ellipse cx="168" cy="25" rx="14" ry="5" fill="#ffe7a3"/><rect x="84" y="528" width="30" height="12" fill="#0d1120"/></svg>`;
const PM = `<svg viewBox="0 0 180 390" width="180" height="390"><ellipse cx="92" cy="383" rx="62" ry="8" fill="#000" opacity=".55"/><g class="corpo">
<rect x="60" y="250" width="28" height="124" rx="9" fill="#18213c"/><rect x="96" y="250" width="28" height="124" rx="9" fill="#18213c"/><ellipse cx="76" cy="376" rx="21" ry="9" fill="#070a16"/><ellipse cx="114" cy="376" rx="21" ry="9" fill="#070a16"/>
<rect x="56" y="148" width="22" height="100" rx="11" fill="#22335e"/><circle cx="67" cy="250" r="11" fill="#c98f65"/>
<path d="M50 152 Q50 128 74 125 H112 Q134 128 134 152 V258 H50 Z" fill="#2b3f70"/><path d="M92 128 V240" stroke="#20305a" stroke-width="3"/><rect x="104" y="148" width="18" height="13" rx="2" fill="#e0b94d"/>
<rect x="50" y="238" width="84" height="15" fill="#070a16"/><rect x="85" y="238" width="15" height="15" fill="#e0b94d"/><rect x="81" y="108" width="22" height="20" fill="#c98f65"/>
<circle cx="92" cy="84" r="34" fill="#c98f65"/><circle cx="62" cy="88" r="7" fill="#b37a52"/><ellipse class="olho" cx="108" cy="82" rx="4" ry="4.5" fill="#070a16"/><path d="M98 72 h14" stroke="#3b2418" stroke-width="3" stroke-linecap="round"/>
<path d="M122 86 q7 5 0 9" stroke="#a46c48" stroke-width="3" fill="none"/><path class="boca" d="M104 102 q8 3 14 -1" stroke="#6e3526" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M56 66 Q60 36 94 36 Q126 38 128 62 Z" fill="#1c2a52"/><rect x="56" y="58" width="74" height="11" fill="#070a16"/><path d="M110 68 Q142 68 148 77 L110 77 Z" fill="#070a16"/><circle cx="92" cy="50" r="6" fill="#e0b94d"/></g>
<g class="braco" data-c="113 146"><rect x="102" y="138" width="22" height="106" rx="11" fill="#2b3f70"/><circle cx="113" cy="250" r="12" fill="#c98f65"/></g></svg>`;
const MOT = `<svg viewBox="0 0 180 390" width="180" height="390"><ellipse cx="88" cy="383" rx="62" ry="8" fill="#000" opacity=".55"/><g class="corpo">
<rect x="58" y="246" width="28" height="128" rx="9" fill="#2f4f86"/><rect x="94" y="246" width="28" height="128" rx="9" fill="#2f4f86"/><ellipse cx="68" cy="376" rx="21" ry="9" fill="#e6e6ee"/><ellipse cx="108" cy="376" rx="21" ry="9" fill="#e6e6ee"/>
<rect x="104" y="150" width="20" height="94" rx="10" fill="#8d5a3b"/><rect x="100" y="140" width="28" height="34" rx="12" fill="#d9662f"/>
<path d="M48 152 Q48 128 72 125 H108 Q132 128 132 152 V252 H48 Z" fill="#e8743b"/><rect x="48" y="240" width="84" height="12" fill="#2a3f6b"/><rect x="78" y="108" width="22" height="20" fill="#8d5a3b"/>
<circle cx="88" cy="84" r="34" fill="#8d5a3b"/><path d="M54 80 Q52 44 88 44 Q122 46 122 78 Q112 60 90 60 Q70 62 54 80 Z" fill="#1b1310"/><circle cx="118" cy="88" r="7" fill="#7a4c31"/>
<ellipse class="olho" cx="72" cy="82" rx="4" ry="4.5" fill="#070a16"/><path d="M64 72 h13" stroke="#1b1310" stroke-width="3" stroke-linecap="round"/><path d="M58 86 q-7 5 0 9" stroke="#6e4329" stroke-width="3" fill="none"/>
<path class="boca" d="M62 102 q8 3 14 -1" stroke="#4a2418" stroke-width="3" fill="none" stroke-linecap="round"/></g>
<g class="braco" data-c="67 146"><rect x="56" y="150" width="22" height="94" rx="11" fill="#8d5a3b"/><rect x="52" y="138" width="30" height="34" rx="12" fill="#e8743b"/><circle cx="67" cy="250" r="12" fill="#8d5a3b"/>
<g class="nota-mao" opacity="0"><rect x="42" y="252" width="52" height="28" rx="4" fill="#3fae6b" stroke="#1f6b3e" stroke-width="3"/><circle cx="68" cy="266" r="7" fill="#1f6b3e"/></g></g></svg>`;
const NOTA = `<svg viewBox="0 0 120 64" width="150" height="80"><rect x="3" y="3" width="114" height="58" rx="8" fill="#43b36f" stroke="#1d6a3c" stroke-width="5"/><circle cx="60" cy="32" r="15" fill="#1d6a3c"/><text x="60" y="39" text-anchor="middle" font-family="Chakra Petch" font-weight="700" font-size="20" fill="#bff0cf">R$</text></svg>`;

const R = sorteio(7);
const ceu = (() => {
  let s = '';
  for (let i = 0; i < 110; i++) s += `<circle class="estrela" cx="${(R() * 1400).toFixed(0)}" cy="${(R() * 950).toFixed(0)}" r="${(0.8 + R() * 2.4).toFixed(1)}" fill="#fff" opacity="${(0.35 + R() * 0.65).toFixed(2)}"/>`;
  return `<svg width="1400" height="1000" viewBox="0 0 1400 1000">${s}</svg>`;
})();
const predios = (w, h, cor, janCor, semente) => {
  const r = sorteio(semente); let x = 0, s = '';
  while (x < w) {
    const bw = 70 + r() * 120, bh = h * (0.4 + r() * 0.6), topo = h - bh;
    s += `<rect x="${x.toFixed(0)}" y="${topo.toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${cor}"/>`;
    if (r() < 0.3) s += `<rect x="${(x + bw / 2 - 2).toFixed(0)}" y="${(topo - 40).toFixed(0)}" width="4" height="40" fill="${cor}"/><circle class="antena" cx="${(x + bw / 2).toFixed(0)}" cy="${(topo - 42).toFixed(0)}" r="4" fill="#ff4d5e"/>`;
    for (let yy = topo + 20; yy < h - 24; yy += 36) for (let xx = x + 14; xx < x + bw - 22; xx += 28)
      if (r() < 0.34) s += `<rect class="jan${r() < 0.18 ? ' pisca' : ''}" x="${xx.toFixed(0)}" y="${yy.toFixed(0)}" width="13" height="19" fill="${janCor}" opacity="${(0.45 + r() * 0.55).toFixed(2)}"/>`;
    x += bw + 4 + r() * 16;
  }
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${s}</svg>`;
};
// carimbo com respingos de tinta em volta
const carimbo = (txt, cor, w) => {
  const r = sorteio(txt.length * 31);
  const pingos = Array.from({ length: 14 }, () => { const a = r() * Math.PI * 2, d = 230 + r() * 140; return `<circle class="pingo" cx="${(400 + Math.cos(a) * d).toFixed(0)}" cy="${(160 + Math.sin(a) * d * 0.5).toFixed(0)}" r="${(5 + r() * 16).toFixed(0)}"/>`; }).join('');
  return `<div class="carimbo ${cor}" data-w="${w}" data-a="slam"><svg class="tinta" viewBox="0 0 800 320">${pingos}</svg><b>${txt}</b></div>`;
};
const notas = [[120, 520, -18], [820, 470, 14], [260, 760, 9], [700, 780, -12], [480, 300, 5]].map(([x, y, a], i) =>
  `<div class="nota" style="left:${x}px;top:${y}px" data-w="dinheiro" data-a="nota" data-d="${(i * 0.08).toFixed(2)}" data-r="${a}">${NOTA}</div>`).join('');

// ---------- roteiro aprovado ----------
const cenas = [
  { tit: 'gancho', cam: 'largo', fala: 'Mesma abordagem, mesmo dinheiro. Três crimes diferentes.',
    html: `<div class="titulo"><div data-w="mesma" data-a="pop">MESMA ABORDAGEM.</div><div data-w="dinheiro" data-a="pop">MESMO DINHEIRO.</div><div class="verm" data-w="tres" data-a="slam">3 CRIMES.</div></div>${notas}` },
  { tit: 'verbo', cam: 'centro', fala: 'O que muda é só o verbo.',
    html: `<div class="titulo peq" data-w="o" data-a="pop">O QUE MUDA É SÓ</div><div class="marcado" data-w="verbo" data-a="marca"><span class="mk"></span><b>O VERBO</b></div>` },
  { tit: 'cena1', cam: 'pm', fala: 'Cena um. O policial exige quinhentos reais, sob ameaça de apreender o carro.',
    gestos: [{ ator: 'pm', pose: 'exige', w: 'exige' }], balao: { ator: 'pm', txt: 'EXIGE <b>R$ 500</b>', w: 'exige' },
    html: `<div class="claq" data-w="cena" data-a="claq"><i></i>CENA 1</div><div class="etq verm" data-w="ameaca" data-a="pop">⚠ AMEAÇA: APREENDER O CARRO</div>` },
  { tit: 'concussao', cam: 'largo', pausa: 0.6, fala: 'Exigiu? Concussão. Código Penal Militar, artigo trezentos e cinco.',
    html: `${carimbo('CONCUSSÃO', 'verm', 'concussao')}<div class="ref" data-w="codigo" data-a="pop">CPM, art. 305 · <b>EXIGIR</b></div>` },
  { tit: 'cena2', cam: 'pm', trans: 'vhs', fala: 'Rebobina. Cena dois. Agora ele só pede duzentos para não lavrar a ocorrência.',
    gestos: [{ ator: 'pm', pose: 'pede', w: 'pede' }], balao: { ator: 'pm', txt: 'PEDE <b>R$ 200</b>', w: 'pede' },
    html: `<div class="claq" data-w="cena" data-a="claq"><i></i>CENA 2</div><div class="etq" data-w="lavrar" data-a="pop">PRA NÃO LAVRAR A OCORRÊNCIA</div>` },
  { tit: 'passiva', cam: 'largo', pausa: 0.6, fala: 'Pediu? Corrupção passiva. Artigo trezentos e oito.',
    html: `${carimbo('CORRUPÇÃO<br>PASSIVA', 'azul', 'corrupcao')}<div class="ref" data-w="artigo" data-a="pop">CPM, art. 308 · <b>PEDIR</b></div>` },
  { tit: 'solicitar', cam: 'largo', pausa: 0.4, fala: 'E desde dois mil e vinte e três, solicitar também está no artigo.',
    html: `<div class="cartao lei"><div class="topo" data-w="e" data-a="pop">LEI 14.688/2023 · CPM, ART. 308</div><div class="verbos"><span data-w="desde" data-a="pop">RECEBER</span><span data-w="desde" data-a="pop" data-d="0.15">ACEITAR PROMESSA</span><span class="novo" data-w="solicitar" data-a="slam">+ SOLICITAR</span></div></div>` },
  { tit: 'cena3', cam: 'mot', trans: 'vhs', fala: 'Rebobina. Cena três. Agora quem oferece o dinheiro é o motorista, para não ser autuado.',
    gestos: [{ ator: 'mot', pose: 'oferece', w: 'oferece' }], balao: { ator: 'mot', txt: 'OFERECE <b>R$</b>', w: 'oferece' },
    html: `<div class="claq" data-w="cena" data-a="claq"><i></i>CENA 3</div><div class="etq" data-w="autuado" data-a="pop">PRA NÃO SER AUTUADO</div>` },
  { tit: 'ativa', cam: 'mot', pausa: 0.6, fala: 'Ofereceu? Corrupção ativa. E quem responde é o particular.',
    html: `${carimbo('CORRUPÇÃO<br>ATIVA', 'verde', 'corrupcao')}<div class="etq amarela" data-w="quem" data-a="pop">QUEM RESPONDE: O PARTICULAR</div>` },
  { tit: 'prova', cam: 'largo', fala: 'E isso caiu na prova de dois mil e vinte e seis: a Fundatec pediu pra ligar cada crime à sua definição.',
    html: `<div class="cartao prova" data-w="caiu" data-a="pop"><div class="topo">FUNDATEC · PROVA CTSP 2026 · QUESTÃO 14</div><div class="liga">
<svg class="fios" viewBox="0 0 860 300"><path data-w="ligar" data-a="traco" d="M300 75 C430 75 430 225 560 225"/><path data-w="ligar" data-a="traco" data-d="0.3" d="M300 225 C430 225 430 75 560 75"/></svg>
<div class="col"><span>EXIGIR</span><span>SOLICITAR<br>OU RECEBER</span></div><div class="col dir"><span class="azul">CORRUPÇÃO<br>PASSIVA</span><span class="verm">CONCUSSÃO</span></div></div></div>` },
  { tit: 'resumo', cam: 'centro', pausa: 0.5, fala: 'Exigiu, concussão. Pediu, passiva. Ofereceu, ativa.',
    html: `<div class="cartao resumo">${[['EXIGIU', 'CONCUSSÃO', 'exigiu', 'verm'], ['PEDIU', 'CORRUPÇÃO PASSIVA', 'pediu', 'azul'], ['OFERECEU', 'CORRUPÇÃO ATIVA', 'ofereceu', 'verde']].map(([v, c, w, cor]) =>
      `<div class="lin" data-w="${w}" data-a="pop"><b>${v}</b><i>→</i><span class="${cor}">${c}</span></div>`).join('')}</div>` },
  { tit: 'pegadinha', cam: 'largo', trans: 'glitch', pausa: 0.5, fala: 'A pegadinha: exigir propina não é corrupção passiva. É concussão.',
    html: `${carimbo('PEGADINHA', 'verm', 'pegadinha')}<div class="cartao frase"><div data-w="exigir" data-a="pop">EXIGIR PROPINA</div><div class="nao" data-w="nao" data-a="pop">✕ NÃO É CORRUPÇÃO PASSIVA</div><div class="sim" data-w="concussao" data-a="slam">= CONCUSSÃO</div></div>` },
  { tit: 'teste', cam: 'pm', pausa: 3.2, fala: 'Teste rápido: na abordagem, o policial pede discretamente cem reais para liberar o veículo. Qual o crime?',
    gestos: [{ ator: 'pm', pose: 'pede', w: 'pede' }],
    html: `<div class="cartao teste"><div class="topo" data-w="teste" data-a="pop">⚡ TESTE RÁPIDO · COMENTA AÍ</div><div class="perg" data-w="na" data-a="tipo">Na abordagem, o policial pede discretamente R$ 100 para liberar o veículo.</div><div class="qual" data-w="qual" data-a="pop">QUAL O CRIME?</div></div>` +
      [3, 2, 1].map(n => `<div class="conta" data-f="${n}" data-a="conta">${n}</div>`).join('') },
  { tit: 'resposta', cam: 'largo', pausa: 0.4, fala: 'Resposta: corrupção passiva. Ele pediu.',
    html: `${carimbo('CORRUPÇÃO<br>PASSIVA', 'azul', 'corrupcao')}<div class="ref" data-w="pediu" data-a="pop">PEDIU = SOLICITAR · CPM, art. 308</div>` },
  { tit: 'fim', cam: 'largo', fala: 'Salva e manda pro parceiro de guarnição.',
    html: `<div class="marca" data-w="salva" data-a="pop"><img src="assets/img/emblema.jpg" alt=""><span>PREPARATÓRIO<br><em>CTSP</em></span></div><div class="resumo-fim" data-w="salva" data-a="pop" data-d="0.2"><span class="verm">EXIGIU</span> · <span class="azul">PEDIU</span> · <span class="verde">OFERECEU</span></div>
<div class="botoes"><span data-w="salva" data-a="pop" data-d="0.4">🔖 SALVA</span><span data-w="manda" data-a="pop">➤ MANDA PRO PARCEIRO</span></div>` },
];

// ---------- narração (guardada: refaz só se o texto mudar) ----------
fs.mkdirSync(path.join(A, 'audio/sfx'), { recursive: true });
const chave = createHash('sha1').update(JSON.stringify([VEL, cenas.map(c => c.fala)])).digest('hex').slice(0, 12);
const cache = path.join(dir, `.tempos-${chave}.json`);
let total;
if (fs.existsSync(cache)) { const j = JSON.parse(fs.readFileSync(cache, 'utf8')); total = j.total; j.cenas.forEach((t, i) => Object.assign(cenas[i], t)); }
else {
  total = await narrarCorrido(cenas, dir, { VEL, ref: { audio: path.join(RAIZ, 'video/ctsp-apresenta/voz-ref.wav'), texto: 'E um plano semana a semana, do diagnóstico até o dia da prova.' } });
  fs.writeFileSync(cache, JSON.stringify({ total, cenas: cenas.map(({ ini, dur, palavras }) => ({ ini, dur, palavras })) }));
}

// pausas de respiro depois das frases-chave: corta a narração no início da cena seguinte e insere silêncio
const cortes = cenas.map((c, i) => i < cenas.length - 1 && c.pausa ? [cenas[i + 1].ini, c.pausa] : null).filter(Boolean);
const filtro = [];
let ant = 0;
cortes.forEach(([t, p], k) => { filtro.push(`[0:a]atrim=${ant}:${t},asetpts=PTS-STARTPTS[s${k}]`, `aevalsrc=0:s=24000:d=${p}[z${k}]`); ant = t; });
filtro.push(`[0:a]atrim=${ant},asetpts=PTS-STARTPTS[s${cortes.length}]`);
const ordem = cortes.map((_, k) => `[s${k}][z${k}]`).join('') + `[s${cortes.length}]`;
ff('ffmpeg', ['-y', '-v', 'error', '-i', path.join(A, 'audio/narracao.mp3'), '-filter_complex', filtro.join(';') + `;${ordem}concat=n=${cortes.length * 2 + 1}:v=0:a=1[o]`,
  '-map', '[o]', '-ar', '24000', '-ac', '1', '-b:a', '160k', path.join(A, 'audio/narracao-p.mp3')]);
let soma = 0;
cenas.forEach(c => {
  c.ini = +(c.ini + soma).toFixed(2); c.palavras = c.palavras.map(p => ({ ...p, t: +(p.t + soma).toFixed(2) }));
  if (c.pausa && c !== cenas.at(-1)) { c.dur = +(c.dur + c.pausa).toFixed(2); soma += c.pausa; }
});
const fala = +(total + soma).toFixed(2);
const dur = +(fala + 2.5).toFixed(2); // a tela final fica 2,5 s a mais
cenas.at(-1).dur = +(dur - cenas.at(-1).ini).toFixed(2);
console.assert(Math.abs(cenas.at(-1).ini + cenas.at(-1).dur - dur) < 0.02, 'tempos: autoteste');

// trilha cortada no tamanho do vídeo
const trilha = path.join(A, 'audio/trilha.wav');
if (fs.existsSync(trilha)) ff('ffmpeg', ['-y', '-v', 'error', '-stream_loop', '-1', '-i', trilha, '-t', String(dur),
  '-af', `afade=t=in:d=1,afade=t=out:st=${(dur - 2).toFixed(2)}:d=2`, '-b:a', '160k', path.join(A, 'audio/trilha.mp3')]);
const reels = path.join(RAIZ, 'video/ctsp-reels/assets');
for (const p of ['fonts', 'vendor', 'img/emblema.jpg']) fs.cpSync(path.join(reels, p), path.join(A, p), { recursive: true });
const SFX = path.join(os.homedir(), '.claude/plugins/cache/hyperframes/hyperframes/0.8.209/skills/media-use/audio/assets/sfx');
const EFEITOS = ['pop', 'click', 'whoosh-short', 'whoosh-cinematic', 'impact-bass-1', 'impact-bass-2', 'riser', 'sparkle', 'typing', 'glitch-1', 'glitch-2', 'chime'];
for (const f of EFEITOS) fs.copyFileSync(path.join(SFX, f + '.mp3'), path.join(A, 'audio/sfx', f + '.mp3'));

// ---------- tempos absolutos e sons ----------
const sons = [];
const som = (f, t, d, vol, ms = 0) => sons.push(`      <audio id="s${sons.length}" class="clip" src="assets/audio/sfx/${f}.mp3" data-start="${Math.max(0, t).toFixed(2)}" data-duration="${d}"${ms ? ` data-media-start="${ms}"` : ""} data-track-index="3" data-volume="${vol}"></audio>`);
const tempo = (c, w) => { const k = c.palavras.findIndex(p => sem(p.w) === sem(w)); if (k < 0) throw new Error(`"${w}" não está na fala da cena ${c.tit}`); return c.palavras[k].t; };
const marcar = (c, html) => html.replace(/data-(w|f)="([^"]+)" data-a="(\w+)"(?: data-d="([\d.]+)")?/g, (_, tipo, v, a, d) => {
  const fim = c.ini + c.dur;
  const t = +(tipo === 'f' ? fim - +v : Math.min(tempo(c, v) + (+d || 0), fim - 0.7)).toFixed(2);
  if (a === 'pop') som('pop', t, 0.3, 0.3);
  if (a === 'claq') { som('click', t, 0.3, 0.55); som('whoosh-short', t - 0.1, 0.57, 0.2); }
  if (a === 'marca') som('sparkle', t, 1, 0.3);
  if (a === 'traco') som('whoosh-short', t, 0.57, 0.18);
  if (a === 'conta') som('click', t, 0.3, 0.6);
  if (a === 'slam') {
    const grande = /class="carimbo/.test(html.slice(Math.max(0, html.indexOf(`data-w="${v}"`) - 40), html.indexOf(`data-w="${v}"`)));
    if (grande) som('riser', t - 0.9, 0.9, 0.22, 3.6); // o riser.mp3 só sobe entre 2 e 5 s
    som(grande ? 'impact-bass-2' : 'impact-bass-1', t + 0.2, 1.2, grande ? 0.45 : 0.32);
  }
  return `data-t="${t}" data-a="${a}"`;
});
const POS = { pm: [330, 960], mot: [560, 960] }; // balão sobre a cabeça (coordenadas do mundo)
cenas.forEach(c => {
  c.html = marcar(c, c.html);
  if (c.balao) c.bhtml = marcar(c, `<div data-w="${c.balao.w}" data-a="pop">${c.balao.txt}</div>`);
  (c.gestos || []).forEach(g => { g.t = +tempo(c, g.w).toFixed(2); som('whoosh-short', g.t - 0.05, 0.57, 0.12); });
  if (c.trans === 'vhs') { som('glitch-2', c.ini, 0.8, 0.4); som('whoosh-cinematic', c.ini, 1, 0.25); }
  if (c.trans === 'glitch') som('glitch-1', c.ini, 0.6, 0.45);
  const tp = /data-t="([\d.]+)" data-a="tipo"/.exec(c.html); if (tp) som('typing', +tp[1], 3, 0.3);
});
cenas.forEach((c, i) => { if (i && c.cam !== cenas[i - 1].cam && !c.trans) som('whoosh-short', c.ini - 0.05, 0.57, 0.15); });
som('whoosh-cinematic', 0, 1.6, 0.3);                      // viatura chegando
som('chime', tempo(cenas.at(-1), 'salva'), 1.5, 0.3);

// legenda: grupos de até 3 palavras (quebra na pontuação); a palavra falada fica em destaque
const legenda = c => {
  const gs = [];
  c.palavras.forEach(p => { const g = gs.at(-1); if (!g || g.length >= 3 || /[.,?:!]$/.test(g.at(-1).w)) gs.push([p]); else g.push(p); });
  return `<div class="leg">${gs.map((g, k) => `<div class="g" data-t0="${g[0].t}" data-t1="${k < gs.length - 1 ? gs[k + 1][0].t : +(c.ini + c.dur).toFixed(2)}">${g.map(p =>
    `<span class="w" data-tw="${p.t}">${p.w.replace(/[.,?:!]$/, '').toUpperCase()}</span>`).join(' ')}</div>`).join('')}</div>`;
};

// câmera: foco num ponto do mundo (origem no centro do quadro), com o rosto um pouco acima do meio
const foco = (px, py, s) => ({ x: +(540 - 540 - (px - 540) * s).toFixed(1), y: +(1240 - 960 - (py - 960) * s).toFixed(1), s });
const CAM = { largo: { x: 0, y: 0, s: 1 }, centro: foco(560, 1180, 1.12), pm: foco(450, 1330, 1.3), mot: foco(650, 1330, 1.3) };

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
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #070a16; }
      #root { position: relative; width: 1080px; height: 1920px; overflow: hidden; font-family: "Plus Jakarta Sans"; font-weight: 700; color: #f2f5ff; background: #070a16; }
      #tremor, #mundo { position: absolute; inset: 0; }
      #ceu { position: absolute; left: -160px; top: 0; width: 1400px; height: 1300px; background: linear-gradient(180deg, #050816 0%, #0d1433 45%, #1d2452 78%, #3a2f5a 100%); }
      #estrelas { position: absolute; left: 0; top: 0; }
      #lua { position: absolute; left: 980px; top: 150px; width: 150px; height: 150px; border-radius: 50%; background: radial-gradient(circle at 38% 38%, #fffbe8 0%, #f1e6c2 55%, #d8cba3 100%); box-shadow: 0 0 80px 30px rgba(255,240,200,.25), 0 0 220px 90px rgba(150,170,255,.12); }
      #lua i { position: absolute; border-radius: 50%; background: rgba(170,155,120,.35); }
      .nuvem { position: absolute; height: 70px; border-radius: 999px; background: rgba(120,135,190,.16); filter: blur(10px); }
      #longe { position: absolute; left: -210px; top: 780px; opacity: .9; } #perto { position: absolute; left: -160px; top: 930px; }
      #rua { position: absolute; inset: 0; }
      #calcada { position: absolute; left: -300px; right: -300px; top: 1290px; height: 56px; background: linear-gradient(#2b3150, #1f2440); border-top: 4px solid #3b4268; }
      #asfalto { position: absolute; left: -300px; right: -300px; top: 1346px; bottom: -400px; background: linear-gradient(#171a2b, #0d0f1a); }
      #faixa { position: absolute; left: -300px; right: -300px; top: 1620px; height: 10px; background: repeating-linear-gradient(90deg, #c9b65a 0 90px, transparent 90px 170px); opacity: .55; }
      .poste { position: absolute; top: 800px; } .cone { position: absolute; width: 360px; height: 560px; background: linear-gradient(180deg, rgba(255,226,150,.38), rgba(255,226,150,0)); clip-path: polygon(46% 0, 54% 0, 100% 100%, 0 100%); mix-blend-mode: screen; }
      .poca { position: absolute; width: 380px; height: 70px; border-radius: 50%; background: radial-gradient(rgba(255,220,140,.28), transparent 70%); }
      #viatura { position: absolute; left: 20px; top: 1302px; } #carro { position: absolute; left: 700px; top: 1322px; }
      .farol { position: absolute; left: 330px; top: 1410px; width: 420px; height: 120px; background: linear-gradient(270deg, rgba(255,246,200,.5), rgba(255,246,200,0)); clip-path: polygon(100% 40%, 100% 60%, 0 100%, 0 0); mix-blend-mode: screen; }
      .brilho { position: absolute; width: 520px; height: 520px; border-radius: 50%; mix-blend-mode: screen; opacity: 0; }
      .brilho.r { left: -60px; top: 1050px; background: radial-gradient(rgba(255,59,78,.55), transparent 65%); } .brilho.b { left: 90px; top: 1050px; background: radial-gradient(rgba(47,123,255,.55), transparent 65%); }
      .ator { position: absolute; top: 1137px; } #pm { left: 360px; } #mot { left: 560px; }
      .balao { position: absolute; top: 920px; z-index: 2; } .balao.pm { left: 270px; } .balao.mot { left: 520px; }
      .balao > div { position: relative; font: 700 40px "Chakra Petch"; color: #070a16; background: #fff; padding: 16px 26px; border-radius: 26px; box-shadow: 0 14px 30px rgba(0,0,0,.5); white-space: nowrap; }
      .balao > div::after { content: ""; position: absolute; left: 70px; bottom: -22px; border: 14px solid transparent; border-top: 16px solid #fff; border-bottom: 0; }
      .balao b { color: #e0263b; } .balao.mot b { color: #1f9d55; }
      #tinta-sirene { position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0; background: radial-gradient(circle at 20% 70%, rgba(255,59,78,.35), transparent 60%); }
      #tinta-sirene2 { position: absolute; inset: 0; mix-blend-mode: screen; opacity: 0; background: radial-gradient(circle at 30% 70%, rgba(47,123,255,.35), transparent 60%); }
      #vinheta { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(3,5,14,.75) 100%); pointer-events: none; }
      #flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 8; pointer-events: none; }
      #prog { position: absolute; left: 0; top: 0; width: 1080px; height: 10px; background: linear-gradient(90deg, #ffcf5a, #ff7a45); z-index: 7; transform-origin: left center; }
      .logo { position: absolute; left: 50px; top: 56px; z-index: 6; display: flex; align-items: center; gap: 14px; background: rgba(12,17,40,.72); border: 2px solid rgba(255,255,255,.14); padding: 12px 22px 12px 12px; border-radius: 22px; }
      .logo img { width: 74px; height: 74px; border-radius: 16px; } .logo span { font: 700 30px/1 "Chakra Petch"; } .logo em, .marca em { font-style: normal; color: #ffcf5a; }
      .chip { position: absolute; right: 50px; top: 76px; z-index: 6; background: #ffcf5a; color: #0a0d18; font: 700 30px "Chakra Petch"; letter-spacing: 2px; padding: 12px 24px; border-radius: 999px; box-shadow: 0 0 30px rgba(255,207,90,.4); }
      .cena { position: absolute; inset: 0; z-index: 4; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 34px; padding: 250px 60px 0; }
      .verm { color: #ff4d5e; } .azul { color: #5b9bff; } .verde { color: #3ddc84; }
      .titulo { position: relative; z-index: 2; margin-top: 60px; text-align: center; font: 700 112px/1.02 "Chakra Petch"; letter-spacing: -1px; text-shadow: 0 6px 30px rgba(0,0,0,.7); }
      .titulo.peq { font-size: 80px; margin-top: 140px; }
      .marcado { position: relative; font: 700 170px/1 "Chakra Petch"; color: #0a0d18; padding: 6px 30px; }
      .marcado .mk { position: absolute; inset: 18px 0 8px; background: #ffcf5a; border-radius: 14px; transform-origin: left center; box-shadow: 0 0 60px rgba(255,207,90,.5); } .marcado b { position: relative; }
      .nota { position: absolute; z-index: 1; filter: drop-shadow(0 10px 18px rgba(0,0,0,.6)); }
      .claq { display: flex; align-items: center; gap: 18px; font: 700 64px "Chakra Petch"; letter-spacing: 6px; background: #f2f5ff; color: #0a0d18; padding: 10px 34px 10px 18px; border-radius: 16px; box-shadow: 0 16px 40px rgba(0,0,0,.6); }
      .claq i { width: 70px; height: 52px; border-radius: 8px; background: repeating-linear-gradient(135deg, #0a0d18 0 12px, #f2f5ff 12px 24px); }
      .etq { font-size: 42px; letter-spacing: 1px; background: rgba(12,17,40,.85); border: 2px solid rgba(255,255,255,.2); color: #fff; padding: 14px 28px; border-radius: 16px; box-shadow: 0 14px 34px rgba(0,0,0,.5); }
      .etq.verm { background: #e0263b; border-color: #ff6b7a; color: #fff; } .etq.amarela { background: #ffcf5a; color: #0a0d18; border-color: #ffe39a; }
      .carimbo { position: relative; margin-top: 40px; text-align: center; font: 700 132px/0.95 "Chakra Petch"; padding: 26px 50px; border: 14px solid currentColor; border-radius: 30px; background: rgba(8,11,26,.78); box-shadow: 0 0 80px currentColor, inset 0 0 40px rgba(255,255,255,.06); }
      .carimbo b { position: relative; } .tinta { position: absolute; left: 50%; top: 50%; width: 900px; height: 360px; margin: -180px 0 0 -450px; fill: currentColor; opacity: .85; pointer-events: none; }
      .ref { font-size: 46px; color: #c9d2ee; background: rgba(12,17,40,.8); padding: 12px 28px; border-radius: 14px; } .ref b { color: #ffcf5a; }
      .cartao { background: linear-gradient(160deg, rgba(30,38,80,.92), rgba(12,16,38,.92)); border: 2px solid rgba(255,255,255,.16); border-radius: 34px; padding: 34px 40px; box-shadow: 0 30px 70px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.25); }
      .topo { font: 700 30px "Chakra Petch"; letter-spacing: 3px; color: #ffcf5a; }
      .lei { width: 940px; margin-top: 60px; display: flex; flex-direction: column; gap: 28px; } .verbos { display: flex; flex-wrap: wrap; gap: 18px; }
      .verbos span { font: 700 48px "Chakra Petch"; padding: 14px 26px; border-radius: 16px; background: rgba(255,255,255,.08); border: 2px solid rgba(255,255,255,.18); }
      .verbos .novo { background: #ffcf5a; color: #0a0d18; border-color: #ffe39a; box-shadow: 0 0 40px rgba(255,207,90,.5); }
      .prova { width: 960px; margin-top: 40px; } .liga { position: relative; height: 300px; margin-top: 26px; display: flex; justify-content: space-between; }
      .fios { position: absolute; left: 0; top: 0; width: 860px; height: 300px; } .fios path { fill: none; stroke: #ffcf5a; stroke-width: 8; stroke-linecap: round; }
      .col { position: relative; display: flex; flex-direction: column; justify-content: space-around; width: 300px; } .col span { font: 700 40px/1.05 "Chakra Petch"; } .col.dir { text-align: right; width: 300px; }
      .resumo { width: 960px; margin-top: 60px; display: flex; flex-direction: column; gap: 26px; } .lin { display: flex; align-items: center; gap: 20px; font: 700 54px "Chakra Petch"; }
      .lin b { width: 300px; } .lin i { font-style: normal; color: #8b95b8; }
      .frase { width: 940px; display: flex; flex-direction: column; gap: 14px; text-align: center; font: 700 56px "Chakra Petch"; }
      .frase .nao { color: #ff4d5e; font-size: 46px; } .frase .sim { color: #0a0d18; background: #ffcf5a; border-radius: 16px; padding: 8px; font-size: 70px; }
      .teste { width: 960px; display: flex; flex-direction: column; gap: 24px; } .perg { font-size: 50px; line-height: 1.25; min-height: 190px; } .qual { font: 700 74px "Chakra Petch"; color: #ffcf5a; }
      .conta { position: absolute; left: 0; right: 0; top: 820px; text-align: center; font: 700 300px/1 "Chakra Petch"; color: #ffcf5a; text-shadow: 0 0 80px rgba(255,207,90,.7); }
      .marca { margin-top: 70px; display: flex; align-items: center; gap: 24px; } .marca img { width: 160px; border-radius: 36px; box-shadow: 0 0 90px rgba(255,207,90,.4); } .marca span { font: 700 72px/1 "Chakra Petch"; }
      .resumo-fim { font: 700 56px "Chakra Petch"; letter-spacing: 2px; } .botoes { display: flex; gap: 22px; }
      .botoes span { font-size: 42px; background: #f2f5ff; color: #0a0d18; padding: 20px 32px; border-radius: 999px; box-shadow: 0 0 40px rgba(255,255,255,.25); }
      .leg { position: absolute; left: 0; right: 0; top: 1610px; height: 150px; }
      .g { position: absolute; left: 50%; top: 0; transform: translateX(-50%); white-space: nowrap; opacity: 0; font-size: 64px; letter-spacing: 1px; color: #0a0d18; background: #f2f5ff; padding: 12px 24px; border-radius: 22px; box-shadow: 0 14px 40px rgba(0,0,0,.6); }
      .w { display: inline-block; padding: 2px 10px; border-radius: 12px; }
      #vhs { position: absolute; inset: 0; z-index: 9; opacity: 0; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(255,255,255,.07) 0 2px, transparent 2px 6px); }
      #vhs .txt { position: absolute; left: 60px; top: 230px; font: 700 64px "Chakra Petch"; color: #fff; text-shadow: 4px 0 #ff3b4e, -4px 0 #2f7bff; }
      #vhs .tc { position: absolute; right: 60px; top: 240px; font: 700 48px "Chakra Petch"; color: #fff; text-shadow: 3px 0 #ff3b4e, -3px 0 #2f7bff; }
      #vhs .faixa { position: absolute; left: 0; right: 0; top: 0; height: 140px; background: linear-gradient(rgba(255,255,255,0), rgba(255,255,255,.25), rgba(255,255,255,0)); }
      #glitch { position: absolute; inset: 0; z-index: 9; opacity: 0; pointer-events: none; }
      #glitch i { position: absolute; left: 0; right: 0; mix-blend-mode: screen; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${dur}" data-width="1080" data-height="1920">
      <div id="tremor"><div id="mundo">
        <div id="ceu"><div id="estrelas">${ceu}</div><div id="lua"><i style="left:40px;top:50px;width:26px;height:26px"></i><i style="left:86px;top:84px;width:18px;height:18px"></i><i style="left:62px;top:104px;width:12px;height:12px"></i></div>
          <div class="nuvem" style="left:120px;top:330px;width:420px"></div><div class="nuvem" style="left:760px;top:520px;width:360px"></div><div class="nuvem" style="left:300px;top:640px;width:300px"></div></div>
        <div id="longe">${predios(1500, 420, '#151c40', '#ffd27a', 11)}</div>
        <div id="perto">${predios(1400, 380, '#0b1030', '#ffc860', 23)}</div>
        <div id="rua">
          <div id="calcada"></div><div id="asfalto"></div><div id="faixa"></div>
          <div class="poca" style="left:30px;top:1310px"></div><div class="poca" style="left:700px;top:1310px"></div>
          <div class="cone" style="left:58px;top:830px"></div><div class="cone c2" style="left:728px;top:830px"></div>
          <div class="poste" style="left:60px">${POSTE}</div><div class="poste" style="left:730px">${POSTE}</div>
          <div class="brilho r"></div><div class="brilho b"></div>
          <div class="farol"></div><div id="carro">${CARRO}</div>
          <div id="viatura">${VIATURA}</div>
          <div id="pm" class="ator">${PM}</div><div id="mot" class="ator">${MOT}</div>
${cenas.map((c, i) => c.bhtml ? `          <div id="b${i}" class="clip balao ${c.balao.ator}" data-start="${c.ini}" data-duration="${c.dur}" data-track-index="5">${c.bhtml}</div>` : '').filter(Boolean).join('\n')}
        </div>
      </div></div>
      <div id="tinta-sirene"></div><div id="tinta-sirene2"></div><div id="vinheta"></div>
      <div id="prog"></div>
      <div class="logo"><img src="assets/img/emblema.jpg" alt=""><span>PREPARATÓRIO<br><em>CTSP</em></span></div>
      <div class="chip">${ETIQUETA}</div>
${cenas.map((c, i) => `      <div id="c${i}" class="clip cena" data-start="${c.ini}" data-duration="${c.dur}" data-track-index="1">${c.html}${legenda(c)}</div>`).join('\n')}
      <div id="vhs"><div class="faixa"></div><div class="txt">◀◀ REBOBINA</div><div class="tc">00:00:00</div></div>
      <div id="glitch"><i style="top:300px;height:60px;background:#ff3b4e"></i><i style="top:820px;height:30px;background:#2f7bff"></i><i style="top:1260px;height:80px;background:#3ddc84"></i></div>
      <div id="flash"></div>
      <audio id="narracao" class="clip" src="assets/audio/narracao-p.mp3" data-start="0" data-duration="${fala}" data-track-index="2" data-volume="1"></audio>
${fs.existsSync(trilha) ? `      <audio id="trilha" class="clip" src="assets/audio/trilha.mp3" data-start="0" data-duration="${dur}" data-track-index="4" data-volume="0.12"></audio>\n` : ''}${sons.join('\n')}
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      const DUR = ${dur}, C = ${JSON.stringify(cenas.map(c => ({ ini: c.ini, dur: c.dur, cam: c.cam, trans: c.trans || '', gestos: c.gestos || [] })))}, CAM = ${JSON.stringify(CAM)};
      const flash = document.getElementById('flash'), q = s => document.querySelectorAll(s);
      const vezes = d => Math.max(1, Math.floor(DUR / d));       // repetições finitas cobrindo o vídeo
      gsap.set('.carimbo', { rotation: -5 }); gsap.set('.etq', { rotation: -2 });

      // ---- mundo vivo ----
      tl.fromTo('#prog', { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: 'none' }, 0);
      q('.estrela').forEach((s, i) => { const d = 0.7 + (i * 37 % 15) / 10; tl.to(s, { opacity: 0.15, duration: d, yoyo: true, repeat: vezes(d), ease: 'sine.inOut' }, (i % 9) * 0.13); });
      tl.to('#lua', { y: -30, x: -40, duration: DUR, ease: 'none' }, 0);
      q('.nuvem').forEach((n, i) => tl.to(n, { x: i % 2 ? -160 : 180, duration: DUR, ease: 'none' }, 0));
      q('.jan.pisca').forEach((j, i) => { const p = 2 + (i * 13 % 7); tl.to(j, { opacity: 0.05, duration: 0.01, yoyo: true, repeat: vezes(p + 0.01), repeatDelay: p }, i * 7 % 11); });
      q('.antena').forEach((a, i) => tl.to(a, { opacity: 0.2, duration: 0.5, yoyo: true, repeat: vezes(0.5) }, i * 0.3));
      tl.to('.cone.c2', { opacity: 0.35, duration: 0.05, yoyo: true, repeat: 5 }, 9.2);   // poste falhando
      tl.to('.cone.c2', { opacity: 0.3, duration: 0.05, yoyo: true, repeat: 3 }, 31.5);
      // viatura chega e o giroflex pinta a rua
      tl.from('#viatura', { x: -760, duration: 1.4, ease: 'power3.out' }, 0);
      q('#viatura .roda').forEach(r => tl.from(r, { rotation: -900, svgOrigin: r.dataset.c, duration: 1.4, ease: 'power3.out' }, 0));
      tl.to('.gl-r', { opacity: 0.25, duration: 0.2, yoyo: true, repeat: vezes(0.2), ease: 'steps(1)' }, 0.4);
      tl.fromTo('.gl-b', { opacity: 0.25 }, { opacity: 1, duration: 0.2, yoyo: true, repeat: vezes(0.2), ease: 'steps(1)' }, 0.4);
      tl.to('.brilho.r, #tinta-sirene', { opacity: 1, duration: 0.2, yoyo: true, repeat: vezes(0.4) * 2, ease: 'steps(1)' }, 0.4);
      tl.fromTo('.brilho.b, #tinta-sirene2', { opacity: 1 }, { opacity: 0, duration: 0.2, yoyo: true, repeat: vezes(0.4) * 2, ease: 'steps(1)', immediateRender: false }, 0.4);
      // personagens respiram e piscam
      q('.ator .corpo').forEach((c, i) => tl.to(c, { scaleY: 1.012, transformOrigin: '50% 100%', duration: 1.3 + i * 0.2, yoyo: true, repeat: vezes(1.3 + i * 0.2), ease: 'sine.inOut' }, 0));
      q('.ator .olho').forEach((o, i) => { for (let t = 1.2 + i * 0.9; t < DUR; t += 3.1 + i * 0.6) tl.to(o, { scaleY: 0.1, transformOrigin: '50% 50%', duration: 0.07, yoyo: true, repeat: 1 }, t); });

      // ---- câmera, gestos e transições por cena ----
      const POSE = { pm: { neutro: 0, exige: -108, pede: -72 }, mot: { neutro: 0, oferece: 92 } };
      const braco = a => document.querySelector('#' + a + ' .braco');
      C.forEach((c, i) => {
        const cam = CAM[c.cam], fim = c.ini + c.dur, troca = !i || c.cam !== C[i - 1].cam || c.trans;
        if (troca) {
          tl.to('#mundo', { x: cam.x, y: cam.y, scale: cam.s, duration: i ? 0.7 : 0.01, ease: 'power3.inOut' }, c.ini);
          tl.to('#longe', { x: -cam.x * 0.55, duration: 0.7, ease: 'power3.inOut' }, c.ini);   // parallax: o fundo anda menos
          tl.to('#ceu', { x: -cam.x * 0.8, duration: 0.7, ease: 'power3.inOut' }, c.ini);
        }
        tl.to('#mundo', { scale: '+=0.03', duration: Math.max(0.3, c.dur - 0.75), ease: 'none' }, c.ini + 0.72); // avanço lento contínuo
        ['pm', 'mot'].forEach(a => { if (!c.gestos.some(g => g.ator === a)) tl.to(braco(a), { rotation: 0, svgOrigin: braco(a).dataset.c, duration: 0.3 }, c.ini); });
        tl.to('#mot .nota-mao', { opacity: 0, duration: 0.1 }, c.ini);
        c.gestos.forEach(g => {
          tl.to(braco(g.ator), { rotation: POSE[g.ator][g.pose], svgOrigin: braco(g.ator).dataset.c, duration: 0.35, ease: 'back.out(2)' }, g.t);
          if (g.pose === 'exige') tl.fromTo('#pm', { x: 0 }, { x: 10, duration: 0.05, yoyo: true, repeat: 5, immediateRender: false }, g.t + 0.1);
          if (g.pose === 'oferece') tl.to('#mot .nota-mao', { opacity: 1, duration: 0.15 }, g.t + 0.15);
        });
        if (c.trans === 'vhs') {   // fita rebobinando
          tl.set('#vhs', { opacity: 1 }, c.ini); tl.set('#vhs', { opacity: 0 }, c.ini + 0.85);
          tl.fromTo('#vhs .faixa', { y: -140 }, { y: 1920, duration: 0.42, repeat: 1, ease: 'none', immediateRender: false }, c.ini);
          const o = { v: 30 }, tc = document.querySelector('#vhs .tc');
          tl.to(o, { v: 0, duration: 0.85, ease: 'none', onUpdate: () => { tc.textContent = '00:00:' + String(Math.round(o.v)).padStart(2, '0'); } }, c.ini);
          tl.fromTo('#tremor', { x: 0, skewX: 0 }, { x: 28, skewX: 6, duration: 0.05, yoyo: true, repeat: 15, ease: 'steps(1)', immediateRender: false }, c.ini);
          tl.set('#tremor', { x: 0, skewX: 0 }, c.ini + 0.86);
        }
        if (c.trans === 'glitch') {
          tl.set('#glitch', { opacity: 1 }, c.ini); tl.set('#glitch', { opacity: 0 }, c.ini + 0.45);
          tl.fromTo('#glitch i', { x: -200 }, { x: 260, duration: 0.06, yoyo: true, repeat: 7, stagger: 0.02, ease: 'steps(1)', immediateRender: false }, c.ini);
          tl.fromTo('#tremor', { x: 0 }, { x: -24, duration: 0.04, yoyo: true, repeat: 9, ease: 'steps(1)', immediateRender: false }, c.ini);
        }
      });

      // ---- elementos das cenas ----
      q('[data-t]').forEach(e => {
        const t = +e.dataset.t, a = e.dataset.a, cena = e.closest('.cena');
        if (a === 'pop') tl.from(e, { scale: 0.5, y: 30, opacity: 0, duration: 0.35, ease: 'back.out(2.2)' }, t);
        else if (a === 'claq') { tl.from(e, { rotationX: -90, transformPerspective: 600, opacity: 0, duration: 0.4, ease: 'back.out(2)' }, t); tl.from(e.querySelector('i'), { rotation: -35, transformOrigin: '0 0', duration: 0.25 }, t + 0.2); }
        else if (a === 'marca') { tl.from(e.querySelector('.mk'), { scaleX: 0, duration: 0.45, ease: 'power2.out' }, t); tl.from(e.querySelector('b'), { opacity: 0, y: 20, duration: 0.3 }, t + 0.1); }
        else if (a === 'traco') { const L = e.getTotalLength(); tl.fromTo(e, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, t); }
        else if (a === 'nota') tl.fromTo(e, { y: 260, opacity: 0, rotation: 0 }, { y: -140, opacity: 1, rotation: +e.dataset.r * 2, duration: 2.4, ease: 'power1.out' }, t);
        else if (a === 'conta') { tl.fromTo(e, { scale: 2.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(2)', immediateRender: false }, t); tl.to(e, { opacity: 0, scale: 0.7, duration: 0.25 }, t + 0.7); gsap.set(e, { opacity: 0 }); }
        else if (a === 'tipo') {   // digita letra por letra
          const txt = e.textContent; e.textContent = ''; const o = { n: 0 };
          tl.to(o, { n: txt.length, duration: Math.min(3.2, txt.length * 0.042), ease: 'none', onUpdate: () => { e.textContent = txt.slice(0, Math.round(o.n)); } }, t);
        }
        else if (a === 'slam') {   // cai na tela como carimbo
          tl.from(e, { scale: 2.6, opacity: 0, duration: 0.22, ease: 'power4.in' }, t);
          tl.fromTo(flash, { opacity: 0.4 }, { opacity: 0, duration: 0.3, immediateRender: false }, t + 0.22);
          tl.fromTo('#tremor', { x: -16, y: 8 }, { x: 0, y: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, t + 0.22);
          if (cena) tl.fromTo(cena, { x: -14 }, { x: 0, duration: 0.45, ease: 'elastic.out(1.2, 0.3)', immediateRender: false }, t + 0.22);
          const pingos = e.querySelectorAll('.pingo');
          if (pingos.length) tl.from(pingos, { scale: 0, transformOrigin: '50% 50%', duration: 0.3, stagger: 0.012, ease: 'back.out(3)' }, t + 0.22);
        }
      });

      // ---- legenda: grupo aparece, palavra falada em amarelo com pulinho ----
      q('.g').forEach(g => {
        tl.set(g, { opacity: 1 }, +g.dataset.t0); tl.set(g, { opacity: 0 }, +g.dataset.t1 - 0.01);
        const ws = [...g.querySelectorAll('.w')];
        ws.forEach((w, k) => {
          tl.set(w, { backgroundColor: '#ffcf5a' }, +w.dataset.tw);
          tl.fromTo(w, { scale: 1.18 }, { scale: 1, duration: 0.2, ease: 'back.out(3)', immediateRender: false }, +w.dataset.tw);
          if (k < ws.length - 1) tl.set(w, { backgroundColor: 'rgba(255,207,90,0)' }, +ws[k + 1].dataset.tw);
        });
      });

      // ---- saída de cada cena e balão ----
      q('.cena, .balao').forEach(el => {
        const fim = +el.dataset.start + +el.dataset.duration;
        if (fim < DUR - 0.05) tl.to(el.querySelectorAll(':scope > *'), { opacity: 0, scale: 1.08, duration: 0.15, ease: 'power2.in' }, fim - 0.15);
      });
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(dir, 'index.html'), html);
console.log(`\nprojeto: ${dir}\nduração: ${dur} s (fala ${fala} s) — agora: npx hyperframes check / render dentro da pasta`);
