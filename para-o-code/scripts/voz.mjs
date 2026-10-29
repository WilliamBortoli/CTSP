// Narração com o VoiceStudio: gera cada fala, confere pela transcrição (refaz até 3 vezes), acelera e junta tudo.
// Usado por video-revisao.mjs e video-apresentacao.mjs. Cada item precisa de { tit, fala }; recebe { ini, dur }.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const VS = process.env.VOICESTUDIO || 'http://localhost:3900';
export const ff = (bin, args) => execFileSync(bin, args, { encoding: 'utf8' }).trim();

export async function narrar(itens, dir, { PAUSA, VEL, falar }) {
const tmp = path.join(dir, '.falas');
fs.mkdirSync(tmp, { recursive: true });

// confere a fala: transcreve e mede quantas palavras do texto foram ditas, na ordem (números ignorados, a transcrição os escreve em algarismo)
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w && !/\d/.test(w) && !/^[ivxl]+$/.test(w)); // romanos também viram algarismo na transcrição
const nota = (esperado, ouvido) => {
  const a = norm(esperado), b = norm(ouvido);
  const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    L[i][j] = a[i - 1] === b[j - 1] ? L[i - 1][j - 1] + 1 : Math.max(L[i - 1][j], L[i][j - 1]);
  const fimOk = !a.length || b.slice(-3).includes(a.at(-1)); // fala não cortada no fim
  return { nota: a.length ? L[a.length][b.length] / a.length : 1, fimOk };
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
const transcreve = async wav => {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(wav)]), 'f.wav'); fd.append('model', 'whisper-1'); fd.append('language', 'pt');
  return (await (await vs('/v1/audio/transcriptions', { method: 'POST', body: fd })).json()).text || '';
};
const MIN = 0.9, duvidosas = [];

let t = 0;
const lista = [];
for (const [i, it] of itens.entries()) {
  const wav = path.join(tmp, createHash('sha1').update(falar(it.fala)).digest('hex').slice(0, 12) + '.wav');
  const ok = wav + '.ok';
  if (!fs.existsSync(ok)) {
    let melhor = null;
    for (let tent = 1; tent <= 3; tent++) {
      if (tent > 1 || !fs.existsSync(wav)) {
        const r = await vs('/v1/audio/speech', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'omnivoice', voice: 'default', language: 'pt', response_format: 'wav', input: falar(it.fala) }) });
        fs.writeFileSync(wav + '.tmp', Buffer.from(await r.arrayBuffer()));
      } else fs.copyFileSync(wav, wav + '.tmp');
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
  const d = +ff('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', pad]);
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
