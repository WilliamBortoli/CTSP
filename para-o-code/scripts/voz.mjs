// Narração com o VoiceStudio, conferida pela transcrição (refaz até 3 vezes).
// narrar: uma fala por item, juntadas com pausa (vídeos de revisão).
// narrarCorrido: o texto inteiro numa chamada só (mesma voz, sem emendas); cada item recebe o início pelo tempo das palavras.
// Cada item precisa de { tit, fala }; recebe { ini, dur }.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const VS = process.env.VOICESTUDIO || 'http://localhost:3900';
export const ff = (bin, args) => execFileSync(bin, args, { encoding: 'utf8' }).trim();
const duracao = f => +ff('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]);

// palavras comparáveis: números ignorados (a transcrição os escreve em algarismo), romanos também
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !/\d/.test(w) && !/^[ivxl]+$/.test(w));
// alinha duas listas de palavras (maior subsequência comum); devolve os pares [i, j] casados
const alinha = (a, b) => {
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    L[i][j] = a[i - 1] === b[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
  const pares = [];
  for (let i = a.length, j = b.length; i && j;) {
    if (a[i - 1] === b[j - 1]) { pares.unshift([i - 1, j - 1]); i--; j--; } else if (L[i - 1][j] >= L[i][j - 1]) i--; else j--;
  }
  return pares;
};
const nota = (esperado, ouvido) => {
  const a = norm(esperado), b = norm(ouvido);
  const fimOk = !a.length || b.slice(-3).includes(a.at(-1)); // fala não cortada no fim
  return { nota: a.length ? alinha(a, b).length / a.length : 1, fimOk };
};
console.assert(nota('Férias. 30 dias, até 3 períodos.', 'ferias 30 dias ate 3 periodos').nota === 1, 'nota: autoteste');

// o VoiceStudio às vezes congela e não responde mais: reinicia o app e tenta de novo
const reiniciaVS = async () => {
  console.log('  VoiceStudio sem resposta: reiniciando o app…');
  execFileSync('powershell', ['-NoProfile', '-Command', `$e='C:\\Program Files\\VoiceStudio\\VoiceStudio.exe';
    Get-Process VoiceStudio -ErrorAction SilentlyContinue | Stop-Process -Force;
    Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.Name -ne 'powershell.exe' -and $_.CommandLine -like '*Roaming*VoiceStudio*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue };
    Start-Sleep 3; Start-Process $e`]);
  for (let k = 0; k < 120; k++) { // espera até 10 min o modelo carregar, com um pedido por vez
    await new Promise(r => setTimeout(r, 5000));
    try { const r = await fetch(VS + '/v1/audio/speech', { method: 'POST', signal: AbortSignal.timeout(280000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'omnivoice', input: 'teste', language: 'pt', response_format: 'wav' }) }); if (r.ok) return; } catch {}
  }
  throw new Error('VoiceStudio não voltou após reiniciar');
};
const vs = async (rota, init) => {
  for (let k = 0; ; k++) {
    try {
      const r = await fetch(VS + rota, { ...init, signal: AbortSignal.timeout(280000) }); // o fetch do Node desiste em 300 s de qualquer jeito
      if (r.ok) return r;
      if (r.status < 500) throw new Error(`VoiceStudio ${r.status}: ${await r.text()}`);
    } catch (e) { if (k >= 2 || /VoiceStudio 4/.test(e.message)) throw e; }
    await reiniciaVS();
  }
};
const fala = async (texto, wav) => {
  const r = await vs('/v1/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'omnivoice', voice: 'default', language: 'pt', response_format: 'wav', input: texto }) });
  fs.writeFileSync(wav, Buffer.from(await r.arrayBuffer()));
};
const transcreve = async (wav, palavras) => {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(wav)]), 'f.wav'); fd.append('model', 'whisper-1'); fd.append('language', 'pt');
  if (palavras) { fd.append('response_format', 'verbose_json'); fd.append('timestamp_granularities[]', 'word'); }
  const j = await (await vs('/v1/audio/transcriptions', { method: 'POST', body: fd })).json();
  return palavras ? j : j.text || '';
};
const MIN = 0.9;

export async function narrar(itens, dir, { PAUSA, VEL, falar }) {
  const tmp = path.join(dir, '.falas');
  fs.mkdirSync(tmp, { recursive: true });
  const duvidosas = [], lista = [];
  let t = 0;
  for (const [i, it] of itens.entries()) {
    const wav = path.join(tmp, createHash('sha1').update(falar(it.fala)).digest('hex').slice(0, 12) + '.wav');
    const ok = wav + '.ok';
    if (!fs.existsSync(ok)) {
      let melhor = null;
      for (let tent = 1; tent <= 3; tent++) {
        if (tent > 1 || !fs.existsSync(wav)) await fala(falar(it.fala), wav + '.tmp');
        else fs.copyFileSync(wav, wav + '.tmp');
        const ouvido = await transcreve(wav + '.tmp');
        const n = nota(falar(it.fala), ouvido);
        if (!melhor || n.nota + n.fimOk > melhor.nota + melhor.fimOk) { melhor = { ...n, ouvido }; fs.copyFileSync(wav + '.tmp', wav); }
        if (n.nota >= MIN && n.fimOk) break;
        console.log(`  refazendo "${it.tit}" (nota ${n.nota.toFixed(2)}${n.fimOk ? '' : ', cortada'}): ${ouvido}`);
      }
      fs.rmSync(wav + '.tmp', { force: true });
      if (melhor.nota >= MIN && melhor.fimOk) fs.writeFileSync(ok, melhor.ouvido);
      else duvidosas.push(`${it.tit} → ouvido: "${melhor.ouvido}"`);
    }
    const pad = path.join(tmp, `p${i}.wav`);
    ff('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-af', `apad=pad_dur=${PAUSA},atempo=${VEL}`, '-ar', '24000', '-ac', '1', pad]);
    const d = duracao(pad);
    if (!(d > PAUSA / VEL)) throw new Error('fala vazia no item ' + i);
    Object.assign(it, { ini: +t.toFixed(2), dur: +d.toFixed(2) });
    t += d;
    lista.push(`file '${pad.replace(/\\/g, '/')}'`);
    console.log(`${i + 1}/${itens.length} ${it.tit} (${d.toFixed(1)} s)`);
  }
  const total = +t.toFixed(2);
  if (duvidosas.length) console.log(`\nATENÇÃO: ${duvidosas.length} fala(s) ainda duvidosa(s) após 3 tentativas — ouça antes de publicar:\n- ${duvidosas.join('\n- ')}`);
  fs.mkdirSync(path.join(dir, 'assets/audio'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'lista.txt'), lista.join('\n'));
  ff('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'lista.txt'), '-b:a', '128k', path.join(dir, 'assets/audio/narracao.mp3')]);
  return total;
}

// clona a voz da referência (mesma voz em todas as partes)
const falaRef = async (texto, wav, ref) => {
  const fd = new FormData();
  fd.append('text', texto); fd.append('language', 'pt');
  fd.append('ref_audio', new Blob([fs.readFileSync(ref.audio)]), 'ref.wav'); fd.append('ref_text', ref.texto);
  fs.writeFileSync(wav, Buffer.from(await (await vs('/generate', { method: 'POST', body: fd })).arrayBuffer()));
};

// texto longo trava o VoiceStudio: gera em blocos de ~180 caracteres, todos com a voz de `ref`, e funde as emendas
export async function narrarCorrido(itens, dir, { VEL, ref }) {
  const tmp = path.join(dir, '.falas');
  fs.mkdirSync(tmp, { recursive: true });
  const blocos = [];
  for (const it of itens) { const b = blocos.at(-1); if (b && (b + ' ' + it.fala).length <= 180) blocos[blocos.length - 1] = b + ' ' + it.fala; else blocos.push(it.fala); }
  const wavs = [];
  for (const [k, texto] of blocos.entries()) {
    const wav = path.join(tmp, 'bloco-' + createHash('sha1').update(texto + ref.audio).digest('hex').slice(0, 12) + '.wav');
    wavs.push(wav);
    if (fs.existsSync(wav + '.ok')) continue;
    let melhor = null;
    for (let tent = 1; tent <= 3; tent++) {
      await falaRef(texto, wav + '.tmp', ref);
      const ouvido = await transcreve(wav + '.tmp'), n = nota(texto, ouvido);
      console.log(`  bloco ${k + 1}/${blocos.length}, tentativa ${tent}: nota ${n.nota.toFixed(2)}${n.fimOk ? '' : ', cortada'} — ${ouvido}`);
      if (!melhor || n.nota + n.fimOk > melhor.nota + melhor.fimOk) { melhor = n; fs.copyFileSync(wav + '.tmp', wav); }
      if (n.nota >= MIN && n.fimOk) break;
    }
    fs.rmSync(wav + '.tmp', { force: true });
    if (melhor.nota >= MIN && melhor.fimOk) fs.writeFileSync(wav + '.ok', ''); else console.log(`ATENÇÃO: bloco ${k + 1} ainda duvidoso — ouça antes de publicar`);
  }
  // junta com fusão curta de 0,12 s; uma pausa curta entre blocos para respirar
  const wav = path.join(tmp, 'corrido.wav');
  const ent = wavs.flatMap(w => ['-i', w]);
  const filtro = wavs.length === 1 ? '[0:a]apad=pad_dur=0.2[o]'
    : wavs.map((_, i) => `[${i}:a]apad=pad_dur=0.25[a${i}]`).join(';') + ';' +
      wavs.slice(1).reduce((s, _, i) => s + `;[${i ? 'x' + i : 'a0'}][a${i + 1}]acrossfade=d=0.12:c1=tri:c2=tri[${i === wavs.length - 2 ? 'o' : 'x' + (i + 1)}]`, '').slice(1);
  ff('ffmpeg', ['-y', '-v', 'error', ...ent, '-filter_complex', filtro, '-map', '[o]', '-ar', '24000', '-ac', '1', wav]);
  fs.mkdirSync(path.join(dir, 'assets/audio'), { recursive: true });
  const saida = path.join(dir, 'assets/audio/narracao.mp3');
  if (typeof VEL === 'function') VEL = VEL(duracao(wav)); // velocidade escolhida pela duração bruta
  ff('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-af', `atempo=${VEL}`, '-b:a', '160k', saida]);
  const total = +duracao(saida).toFixed(2);

  // tempo de cada palavra na narração final; o item começa na sua primeira palavra reconhecida
  const j = await transcreve(saida, true);
  const ouv = (j.words || []).flatMap(w => norm(w.word).map(p => ({ p, t: w.start })));
  if (!ouv.length) throw new Error('transcrição sem tempos por palavra');
  const esp = itens.flatMap((it, k) => it.fala.split(/\s+/).flatMap((w, wi) => norm(w).map(p => ({ p, k, wi }))));
  const tempoDe = {}, tPal = {};
  for (const [i, jj] of alinha(esp.map(x => x.p), ouv.map(x => x.p))) {
    const e = esp[i];
    if (!(e.k in tempoDe)) tempoDe[e.k] = ouv[jj].t;
    if (!((e.k + ':' + e.wi) in tPal)) tPal[e.k + ':' + e.wi] = ouv[jj].t;
  }
  let antes = 0;
  itens.forEach((it, k) => { it.ini = +Math.max(antes, k ? (tempoDe[k] ?? antes) - 0.1 : 0).toFixed(2); antes = it.ini; });
  itens.forEach((it, k) => { it.dur = +((k < itens.length - 1 ? itens[k + 1].ini : total) - it.ini).toFixed(2); });
  // tempo de cada palavra escrita (legenda palavra por palavra); a não reconhecida herda o tempo da anterior
  itens.forEach((it, k) => {
    const ws = it.fala.split(/\s+/), fim = it.ini + it.dur - 0.05, ts = ws.map((_, wi) => tPal[k + ':' + wi]);
    // palavra sem par na transcrição (ex.: "trezentos e cinco" ouvido como "305") ganha tempo interpolado
    for (let i = 0; i < ws.length; i++) if (ts[i] == null) {
      let j = i; while (j < ws.length && ts[j] == null) j++;
      const a = i ? ts[i - 1] : it.ini, b = j < ws.length ? ts[j] : fim, off = i ? 1 : 0;
      for (let m = i; m < j; m++) ts[m] = a + (b - a) * (m - i + off) / (j - i + off);
      i = j - 1;
    }
    let t = it.ini; it.palavras = ws.map((w, wi) => ({ w, t: +(t = Math.min(fim, Math.max(t, ts[wi]))).toFixed(2) }));
  });
  const sem = itens.filter((_, k) => k && !(k in tempoDe)).map(it => it.tit);
  if (sem.length) console.log('ATENÇÃO: início estimado (palavra não reconhecida) em: ' + sem.join(', '));
  itens.forEach((it, k) => console.log(`${k + 1}/${itens.length} ${it.tit} ${it.ini}s (${it.dur.toFixed(1)} s)`));
  return total;
}
