// Valida o banco de questões. Uso: node para-o-code/scripts/validar-banco.mjs docs/dados/banco.json
import fs from 'fs';
const MATS = {li: 12, pm: 8, ppm: 8, cf: 8, dp: 8, pp: 8, da: 8};
const arq = process.argv[2] || 'docs/dados/banco.json';
const qs = JSON.parse(fs.readFileSync(arq, 'utf8'));
const erros = [], vistos = new Map(), por = {};
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
qs.forEach((q, i) => {
  const e = m => erros.push(`#${i} ${m}: ${String(q.enunciado || '').slice(0, 60)}`);
  if (!MATS[q.mat]) e('matéria inválida ' + q.mat);
  if (![1, 2, 3].includes(+q.nivel)) e('nível inválido');
  if (!q.enunciado || q.enunciado.length < 10) e('enunciado vazio');
  if (!Array.isArray(q.alternativas) || q.alternativas.length < 4 || q.alternativas.length > 5) e('precisa de 4 ou 5 alternativas');
  else if (new Set(q.alternativas.map(norm)).size !== q.alternativas.length) e('alternativas repetidas');
  if (!Number.isInteger(q.correta) || q.correta < 0 || q.correta >= (q.alternativas || []).length) e('correta fora do intervalo');
  if (!q.explicacao) e('sem explicação');
  const k = norm(q.enunciado) + '|' + (q.alternativas || []).map(norm).sort().join('|');
  if (vistos.has(k)) e('duplicada da #' + vistos.get(k)); else vistos.set(k, i);
  por[q.mat] = por[q.mat] || {1: 0, 2: 0, 3: 0}; por[q.mat][q.nivel] = (por[q.mat][q.nivel] || 0) + 1;
});
console.log(`${qs.length} questões`);
for (const [m, min] of Object.entries(MATS)) {
  const c = por[m] || {1: 0, 2: 0, 3: 0}, t = c[1] + c[2] + c[3];
  console.log(`${m}: ${t} (N1 ${c[1]}, N2 ${c[2]}, N3 ${c[3]})${t < min ? '  <- menos que o mínimo da prova (' + min + ')' : ''}`);
}
if (erros.length) { console.log(`\n${erros.length} problema(s):`); erros.slice(0, 200).forEach(x => console.log(' ' + x)); process.exit(1); }
console.log('\nOK, sem problemas.');
