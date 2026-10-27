// Converte o banco do programa do Windows (app/banco/*.jsonl) para docs/dados/banco.json.
// Uso: node para-o-code/scripts/importar-programa.mjs <pasta app/banco> [saida.json]
// Junta com o banco atual sem duplicar enunciados; o que não converter vai para separadas.json.
import fs from 'node:fs';
import path from 'node:path';

const MATS = ['li', 'pm', 'ppm', 'cf', 'dp', 'pp', 'da'];
const [origem, saida = 'docs/dados/banco.json'] = process.argv.slice(2);
if (!origem) { console.error('uso: importar-programa.mjs <pasta app/banco> [saida.json]'); process.exit(1); }

const norm = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
const atual = JSON.parse(fs.readFileSync(saida, 'utf8'));
const vistos = new Set(atual.map(q => norm(q.enunciado)));
const novas = [], separadas = [];
let semNivel = 0, duplicadas = 0;

for (const arq of fs.readdirSync(origem).filter(f => f.endsWith('.jsonl')).sort()) {
  fs.readFileSync(path.join(origem, arq), 'utf8').split(/\r?\n/).forEach((linha, i) => {
    if (!linha.trim()) return;
    let q;
    try { q = JSON.parse(linha); } catch { separadas.push({ arq, linha: i + 1, motivo: 'JSON inválido', bruto: linha }); return; }
    const mat = String(q.topico || '').split('-')[0];
    const motivo = !MATS.includes(mat) ? `matéria desconhecida (${q.topico})`
      : !Array.isArray(q.alternativas) || q.alternativas.length !== 5 ? 'não tem 5 alternativas'
      : !Number.isInteger(q.correta) || q.correta < 0 || q.correta > 4 ? 'gabarito fora de 0–4'
      : !q.enunciado || q.enunciado.length < 10 ? 'enunciado curto demais (validador exige 10+)' : null;
    if (motivo) { separadas.push({ arq, linha: i + 1, motivo, ...q }); return; }
    if (vistos.has(norm(q.enunciado))) { duplicadas++; return; }
    vistos.add(norm(q.enunciado));
    let nivel = q.nivel;
    if (![1, 2, 3].includes(nivel)) { nivel = 2; semNivel++; }
    novas.push({ mat, nivel, enunciado: q.enunciado, alternativas: q.alternativas, correta: q.correta,
      explicacao: q.explicacao || '', fundamento: q.fundamento || '' });
  });
}

fs.writeFileSync(saida, JSON.stringify([...atual, ...novas], null, 0));
fs.writeFileSync(path.join(path.dirname(saida), '..', '..', 'para-o-code', 'separadas.json'), JSON.stringify(separadas, null, 2));
const porMat = {};
for (const q of [...atual, ...novas]) porMat[q.mat + ' n' + q.nivel] = (porMat[q.mat + ' n' + q.nivel] || 0) + 1;
console.log({ atuais: atual.length, novas: novas.length, duplicadas, separadas: separadas.length, semNivel });
console.log(porMat);
