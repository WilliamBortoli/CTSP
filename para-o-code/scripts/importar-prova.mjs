// Converte o caderno de uma prova Fundatec do CTSP (texto do pdftotext) + gabarito para o formato do banco.
// Uso: node para-o-code/scripts/importar-prova.mjs <prova.txt> <gabarito.txt> <ano> > saida.json
// Questões anuladas (sem letra no gabarito) ficam de fora.
import fs from 'fs';
const [arqProva, arqGab, ano] = process.argv.slice(2);
const SECAO = {'DIREITO CONSTITUCIONAL': 'cf', 'DIREITO PENAL': 'dp', 'DIREITO PROCESSUAL PENAL': 'pp', 'DIREITO PENAL MILITAR': 'pm', 'DIREITO PROCESSUAL MILITAR': 'ppm', 'DIREITO PROCESSUAL PENAL MILITAR': 'ppm', 'DIREITO ADMINISTRATIVO': 'da', 'LEGISLAÇÃO INSTITUCIONAL': 'li'};
const gab = Object.fromEntries([...fs.readFileSync(arqGab, 'utf8').matchAll(/\b(\d{2}) - ([A-E])\b/g)].map(m => [+m[1], m[2]]));

const linhas = fs.readFileSync(arqProva, 'utf8').split(/\r?\n/)
  .filter(l => !/^Execução: Fundatec|^\d+_BASE_|^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}|^\d+$/.test(l.trim()));
let mat = null, cur = null; const qs = [];
for (const l of linhas) {
  const t = l.trim();
  if (SECAO[t]) { mat = SECAO[t]; continue; }
  const m = t.match(/^QUESTÃO (\d{2}) - (.*)/);
  if (m) { cur = {n: +m[1], mat, txt: m[2]}; qs.push(cur); continue; }
  if (cur && t) cur.txt += ' ' + t;
}

const quebra = s => s.replace(/\s+(?=(?:I|II|III|IV|V|VI)\. |\( \) |Quais |A ordem correta|Assinale a alternativa que|Coluna \d (?:\d\.|\())/g, '\n')
  .replace(/\nColuna 1[^]*?(?=\nColuna 2)/, c => c.replace(/\s+(?=[1-9]\. )/g, '\n')).trim();
const saida = qs.map(q => {
  const partes = q.txt.replace(/\s+/g, ' ').split(/\s?\b([A-E])\) /);
  const enun = partes[0], alts = [];
  for (let i = 1; i < partes.length; i += 2) alts.push(partes[i + 1].trim());
  const letra = gab[q.n];
  if (!letra) return null;
  if (alts.length !== 5) throw new Error(`questão ${q.n}: ${alts.length} alternativas`);
  return {mat: q.mat, nivel: 3, enunciado: quebra(enun), alternativas: alts, correta: 'ABCDE'.indexOf(letra),
    explicacao: `Gabarito oficial da Fundatec: letra ${letra}.`, fundamento: `Prova CTSP ${ano} (Fundatec), questão ${q.n}`, origem: `prova-${ano}`};
}).filter(Boolean);
if (qs.length !== 60) throw new Error(`esperava 60 questões, achei ${qs.length}`);
console.log(JSON.stringify(saida, null, 1));
console.error(`${saida.length} questões (${60 - saida.length} sem gabarito)`);
