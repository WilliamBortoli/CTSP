// Captura telas reais do site (com a API de teste) para o vídeo. Uso: node captura.js
const {chromium} = require('playwright');
const fs = require('fs');
const BASE = 'http://localhost:8766/';
const OUT = __dirname + '/captura/';
const MOCK = fs.readFileSync('/tmp/claude-0/-home-claude/097f5aa1-890e-5239-9e05-8963a7a88881/scratchpad/site/teste/mock.js', 'utf8');
const BANCO = JSON.parse(fs.readFileSync('/home/claude/ctsp/docs/dados/banco.json', 'utf8'));
const RONDA = BANCO.filter(q => /^A ronda é considerada/.test(q.enunciado));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 3, isMobile: true, hasTouch: true});
  await ctx.route('**/*', async r => {
    const u = r.request().url();
    if (!u.startsWith(BASE)) return r.abort();
    if (u.includes('dados/banco.json') && ctx.__soRonda) return r.fulfill({contentType: 'application/json', body: JSON.stringify(RONDA)});
    return r.continue();
  });
  await ctx.addInitScript(MOCK);
  const p = await ctx.newPage();
  const limpa = () => p.addStyleTag({content: '#toast,.tabbar,.mtop{display:none!important} *{transition:none!important;animation:none!important;caret-color:transparent!important}'});
  const shot = async (nome, opts) => { await p.waitForTimeout(250); await p.screenshot(Object.assign({path: OUT + nome + '.png'}, opts || {})); console.log('ok', nome); };

  await p.goto(BASE); await p.waitForSelector('#v-entrar:not([hidden])'); await limpa();
  await p.waitForTimeout(400);
  await (await p.$('#f-login')).screenshot({path: OUT + '01-entrar.png'}); console.log('ok 01');

  // administradora de demonstração (só nesta captura)
  await p.click('#l-primeiro');
  await p.fill('#a-codigo', 'ROCAM-TESTE'); await p.fill('#a-nome', 'João da Silva'); await p.fill('#a-guerra', 'Silva');
  await p.fill('#a-user', 'sd.silva'); await p.fill('#a-pass', 'segredo1'); await p.fill('#a-pass2', 'segredo1');
  await p.click('#a-btn'); await p.waitForSelector('#f-perfil'); await limpa();
  await p.click('#p-btl'); await p.fill('#p-btl', '1'); await p.click('.combo .op >> nth=0');
  await p.click('#p-crbm'); await p.fill('#p-crbm', 'capi'); await p.click('.combo .op >> nth=0');
  await p.click('#p-btn'); await p.waitForSelector('#p-msg .ok');

  await p.evaluate(() => document.querySelector('.tabbar [data-tab="painel"]').click()); await p.waitForSelector('.greet h1');
  await (await p.$('.greet')).screenshot({path: OUT + '02-painel.png'}); await (await p.$('.mis')).screenshot({path: OUT + '02-missao.png'}); console.log('ok 02');

  await p.evaluate(() => document.querySelector('.tabbar [data-tab="plano"]').click()); await p.waitForSelector('.sem.agora');
  await (await p.$('.sem.agora')).screenshot({path: OUT + '03-plano.png'}); console.log('ok 03');

  await p.evaluate(() => document.querySelector('.tabbar [data-tab="materias"]').click()); await p.click('[data-mat="pm"]'); await p.waitForSelector('.leitor-hd');
  const t11 = await p.$('#pm-t11'); await t11.screenshot({path: OUT + '04-apostila.png'}); console.log('ok 04-apostila');

  // questão real com estado antes e depois do toque
  ctx.__soRonda = true;
  await p.reload(); await p.waitForSelector('#v-app:not([hidden])'); await limpa();
  await p.evaluate(() => document.querySelector('.tabbar [data-tab="simulado"]').click()); await p.waitForSelector('#s-go');
  await p.selectOption('#s-qtd', '5'); await p.click('#s-go'); await p.waitForSelector('.opt');
  await p.evaluate(() => scrollTo(0, 0));
  await (await p.$('#main .pnl')).screenshot({path: OUT + '05-questao-a.png'}); console.log('ok 05a');
  const certa = await p.$$eval('.opt', os => os.findIndex(o => /Vigilância/.test(o.textContent)));
  await p.click('.opt >> nth=' + certa); await p.waitForSelector('.fb.okk');
  await p.evaluate(() => scrollTo(0, 0));
  await (await p.$('#main .pnl')).screenshot({path: OUT + '05-questao-b.png'}); console.log('ok 05b');
  ctx.__soRonda = false;

  // prova completa com o banco inteiro
  await p.reload(); await p.waitForSelector('#v-app:not([hidden])'); await limpa();
  await p.evaluate(() => document.querySelector('.tabbar [data-tab="simulado"]').click()); await p.selectOption('#s-mat', 'prova'); await p.waitForTimeout(150);
  await p.click('#s-go'); await p.waitForSelector('.cartao');
  for (let i = 0; i < 6; i++) { await p.click('.opt >> nth=' + (i % 3)); await p.click('#q-next'); }
  await p.evaluate(() => scrollTo(0, 0));
  const pn = await p.$('#main .pnl'); const bb = await pn.boundingBox(); const en = await (await p.$('.enun')).boundingBox(); await p.screenshot({path: OUT + '06-prova-topo.png', clip: {x: bb.x, y: bb.y, width: bb.width, height: en.y + en.height - bb.y + 18}}); await (await p.$('.cartao')).screenshot({path: OUT + '06-prova-cartao.png'}); console.log('ok 06');
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
