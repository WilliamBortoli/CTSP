// Captura as telas reais do portal (com a API falsa dos testes e nomes fictícios) para o vídeo de apresentação.
// Uso: node video/ctsp-apresenta/capturar.cjs http://localhost:8765/
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const OUT = path.join(__dirname, 'assets/img');
fs.mkdirSync(OUT, { recursive: true });
const MOCK = fs.readFileSync(path.join(__dirname, '../../testes/mock.js'), 'utf8');
// ranking de demonstração: nomes fictícios
const RANK = `window.CTSP_API.ranking = async () => [
  {guerra: 'Rocha', btl: '9º BPM', pontos: 214, questoes: 90, acertos: 62, eu: true},
  {guerra: 'Lima', btl: '11º BPM', pontos: 187, questoes: 80, acertos: 53},
  {guerra: 'Souza', btl: '1º BPChq', pontos: 160, questoes: 70, acertos: 45},
  {guerra: 'Prestes', btl: '20º BPM', pontos: 131, questoes: 60, acertos: 35},
  {guerra: 'Farias', btl: '4º BPM', pontos: 98, questoes: 50, acertos: 24}];`;

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 432, height: 860 }, deviceScaleFactor: 2.5 });
  await ctx.route('**/*', r => r.request().url().startsWith(URL) ? r.continue() : r.abort());
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  const shot = async (n, el) => { await p.waitForTimeout(250); await (el ? p.locator(el).first() : p).screenshot({ path: path.join(OUT, n + '.png') }); console.log(n); };
  const tab = async t => { await p.click('.tabbar [data-tab="' + t + '"]'); await p.waitForTimeout(200); };

  await p.goto(URL); await p.waitForSelector('#l-primeiro');
  await p.click('#l-primeiro');
  await p.fill('#a-codigo', 'rocam-teste'); await p.fill('#a-nome', 'Carlos Rocha'); await p.fill('#a-guerra', 'Rocha');
  await p.fill('#a-user', 'rocha'); await p.fill('#a-pass', 'segredo1'); await p.fill('#a-pass2', 'segredo1'); await p.click('#a-btn');
  await p.waitForSelector('#f-perfil');
  await p.click('#p-btl'); await p.fill('#p-btl', '9'); await p.waitForSelector('.combo .op'); await p.click('.combo .op >> nth=0');
  await p.fill('#p-incl', '2021-06-01'); await p.click('#p-btn'); await p.waitForSelector('#p-msg .ok');
  await p.addStyleTag({ content: '.toast{display:none!important}' });
  await p.evaluate(RANK);

  await tab('painel'); await p.waitForSelector('.greet h1'); await shot('painel');
  await p.locator('#rank-l .hrow').first().waitFor(); await shot('ranking', '#rank-l');

  // apostila: atalho e pegadinha do tópico de comportamento (RDBM)
  await tab('materias'); await p.fill('#busca', 'comportamento'); await p.waitForTimeout(200);
  await p.click('.hit >> nth=0'); await p.waitForSelector('.leitor-hd');
  const t = '#li-t19';
  await p.locator(t + ' .blk.atalho').scrollIntoViewIfNeeded(); await shot('atalho', t + ' .blk.atalho');
  await p.locator(t + ' .blk.pega').scrollIntoViewIfNeeded(); await shot('pegadinha', t + ' .blk.pega');
  await p.locator(t + ' table').first().scrollIntoViewIfNeeded(); await shot('tabela', t + ' table');

  // simulado: atalhos e uma questão corrigida
  await tab('simulado'); await p.waitForSelector('.atalhos'); await shot('simulado', '.pnl');
  await p.click('[data-praticar="rapido"]'); await p.waitForSelector('.opt');
  await p.click('.opt >> nth=0'); await p.waitForSelector('.fb'); await p.evaluate(() => scrollTo(0, 0)); await shot('questao');
  // erra mais algumas para o caderno de erros ter conteúdo
  for (let i = 0; i < 4; i++) { await p.click('#q-next'); await p.waitForSelector('.opt'); await p.click('.opt >> nth=1'); await p.waitForSelector('.fb'); }
  await p.click('#q-sair'); await p.waitForSelector('.score');
  await p.click('.tabbar [data-mais]'); await p.click('#mais [data-tab="erros"]'); await p.waitForTimeout(300); await shot('erros');
  await tab('plano'); await p.waitForSelector('.sem.agora'); await p.evaluate(() => scrollTo(0, 0)); await shot('plano');
  await b.close();
})().catch(e => { console.error('FALHOU', e.message); process.exit(1); });
