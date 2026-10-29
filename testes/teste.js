// Teste de ponta a ponta do site com a API falsa. Uso: node teste.js <url> <pasta-de-prints>
const {chromium} = require('playwright');
const fs = require('fs');
const path = require('path');
const URL = process.argv[2] || 'http://localhost:8765/';
const OUT = process.argv[3] || 'prints';
fs.mkdirSync(OUT, {recursive: true});
const MOCK = fs.readFileSync(path.join(__dirname, 'mock.js'), 'utf8');
const falhas = [];
const ok = (c, m) => { if (!c) { falhas.push(m); console.log('FALHOU:', m); } else console.log('ok:', m); };

(async () => {
  const b = await chromium.launch();
  for (const [nome, vp] of [['desk', {width: 1280, height: 860}], ['cel', {width: 400, height: 860}]]) {
    const ctx = await b.newContext({viewport: vp, deviceScaleFactor: 1});
    await ctx.route('**/*', r => r.request().url().startsWith(URL) ? r.continue() : r.abort());
    await ctx.addInitScript(MOCK);
    const p = await ctx.newPage();
    const erros = [];
    p.on('pageerror', e => erros.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) erros.push('console: ' + m.text()); });
    const shot = async n => { await p.waitForTimeout(150); await p.screenshot({path: `${OUT}/${nome}-${n}.png`, fullPage: false}); };
    const vis = async s => p.locator(s).first().isVisible();

    await p.goto(URL); await p.waitForSelector('#v-entrar:not([hidden])');
    await p.waitForTimeout(200);
    ok(await vis('#l-primeiro'), nome + ': botão primeiro acesso aparece sem admin');
    await shot('01-entrar');
    await p.click('#l-primeiro');
    await p.fill('#a-codigo', 'errado'); await p.fill('#a-nome', 'Maiane Sabino'); await p.fill('#a-guerra', 'Sabino'); await p.fill('#a-user', 'maiane'); await p.fill('#a-pass', 'segredo1'); await p.fill('#a-pass2', 'segredo1');
    await p.click('#a-btn'); await p.waitForSelector('#p1-msg .err');
    ok(/Código de instalação incorreto/.test(await p.textContent('#p1-msg')), nome + ': código errado recusado');
    await p.fill('#a-codigo', 'rocam-teste'); await p.click('#a-btn');
    await p.waitForSelector('#v-app:not([hidden]) #f-perfil');
    ok(true, nome + ': admin criada e foi para o perfil');
    await p.click('#p-btl'); await p.fill('#p-btl', '11'); await p.waitForSelector('.combo .op'); await p.click('.combo .op >> nth=0');
    await p.click('#p-crbm'); await p.fill('#p-crbm', 'capi'); await p.click('.combo .op >> nth=0');
    await p.fill('#p-incl', '2022-03-01');
    await shot('02-perfil');
    await p.click('#p-btn'); await p.waitForSelector('#p-msg .ok');
    ok(/11º BPM/.test(await p.inputValue('#p-btl')), nome + ': batalhão salvo');

    // painel
    const tab = async t => { if (nome === 'cel' && ['erros', 'perfil', 'alunos'].includes(t)) { await p.click('.tabbar [data-mais]'); await p.click('#mais [data-tab="' + t + '"]'); } else await p.click((nome === 'cel' ? '.tabbar ' : '.side ') + '[data-tab="' + t + '"]'); await p.waitForTimeout(120); };
    await tab('painel'); await p.waitForSelector('.greet h1');
    ok(/Soldado PM Sabino/.test(await p.textContent('.greet h1')), nome + ': saudação com nome de guerra');
    await shot('03-painel');
    await p.evaluate(() => scrollTo(0, 900)); await shot('03b-painel-baixo');

    // plano
    await tab('plano'); await p.waitForSelector('.sem.agora');
    ok(await p.locator('.sem').count() === 26, nome + ': 26 semanas no plano');
    await shot('04-plano');
    await p.click('[data-praticar="real2026"]'); await p.waitForSelector('.cartao');
    ok(await p.locator('.cel').count() === 60, nome + ': prova real 2026 com 60 questões');
    await p.click('#q-entregar'); await p.waitForSelector('#q-sim'); await p.click('#q-sim'); await p.waitForSelector('.tbl-mat');

    // matérias e busca
    await tab('materias'); await p.fill('#busca', 'deserção'); await p.waitForTimeout(150);
    const nh = await p.locator('.hit').count(); ok(nh > 0, nome + ': busca "deserção" achou ' + nh);
    await shot('05-busca');
    await p.click('.hit >> nth=0'); await p.waitForSelector('.leitor-hd');
    await p.waitForTimeout(200); await shot('06-leitor');
    const domb = p.locator('[data-dom]').first(); await domb.scrollIntoViewIfNeeded(); await domb.click();
    ok(await domb.getAttribute('aria-pressed') === 'true', nome + ': marcou dominei');
    await p.locator('[data-fc]').first().scrollIntoViewIfNeeded(); await p.locator('[data-fc]').first().click();
    ok(await p.locator('[data-fc] .a').count() === 1, nome + ': flashcard vira');
    await shot('07-flashcard');
    await p.click('#voltar-mat'); await p.waitForSelector('#busca');

    // simulado imediato
    await tab('simulado'); await p.waitForSelector('.atalhos');
    await shot('08-montar');
    await p.click('details.pers > summary');
    await p.selectOption('#s-qtd', '5'); await p.click('#s-go');
    for (let i = 0; i < 5; i++) { await p.waitForSelector('.opt'); await p.click('.opt >> nth=' + (i % 2)); await p.waitForSelector('.fb'); if (i === 0) await shot('09-questao'); await p.click('#q-next'); }
    await p.waitForSelector('.score'); await shot('10-resultado');
    const res = await p.textContent('.score .big'); ok(/\/5/.test(res), nome + ': resultado ' + res.trim());

    // erros
    await tab('erros'); await p.waitForTimeout(100);
    const ne = await p.locator('details.rev').count(); console.log('   erros no caderno:', ne);
    await shot('11-erros');

    // prova completa
    await tab('simulado'); await p.selectOption('#s-mat', 'prova'); await p.waitForTimeout(100);
    await p.click('#s-go'); await p.waitForSelector('.cartao');
    const ncel = await p.locator('.cel').count(); ok(ncel > 20, nome + ': prova completa com ' + ncel + ' questões');
    ok(/Restam/.test(await p.textContent('#relogio')), nome + ': relógio de 4h');
    await p.click('.opt >> nth=1'); await p.click('#q-next'); await p.click('.opt >> nth=0');
    await shot('12-prova');
    await p.click('#q-entregar'); await p.waitForSelector('#q-sim'); await p.click('#q-sim');
    await p.waitForSelector('.tbl-mat'); await shot('13-prova-res');

    // alunos (admin)
    await tab('alunos'); await p.waitForSelector('#ad-novo');
    await p.click('#ad-novo'); await p.fill('#n-nome', 'João da Silva'); await p.fill('#n-guerra', 'Silva'); await p.fill('#n-idf', '123.456-7');
    ok(await p.inputValue('#n-user') === 'sd.silva', nome + ': usuário sugerido sd.silva');
    await shot('14-novo-aluno');
    await p.click('#n-btn'); await p.waitForSelector('.senha-box');
    const senha = (await p.locator('.senha-box').nth(1).textContent()).trim();
    ok(/^ctsp-[a-z2-9]{6}$/.test(senha), nome + ': senha provisória ' + senha);
    await shot('15-alunos');
    await p.click('#ad-novo'); await p.fill('#n-nome', 'Outro'); await p.fill('#n-guerra', 'Silva'); await p.fill('#n-idf', '9');
    await p.click('#n-btn'); await p.waitForSelector('#n-msg .err');
    ok(/já existe/.test(await p.textContent('#n-msg')), nome + ': usuário duplicado recusado');
    await p.click('#n-cancel');
    await p.click('[data-ver] >> nth=1'); await p.waitForSelector('.det'); await shot('16-detalhe');
    await p.click('[data-blq]'); await p.waitForSelector('.pill.off'); ok(true, nome + ': bloqueou');
    await p.click('[data-blq]'); await p.waitForTimeout(150);
    await p.click('[data-rst]'); await p.waitForTimeout(150);
    const senha2 = (await p.locator('.senha-box').nth(1).textContent()).trim();
    ok(senha2 !== '' , nome + ': senha redefinida ' + senha2);

    // sair e entrar como aluno
    await p.click(nome === 'cel' ? '.mtop [data-sair]' : '.side [data-sair]'); await p.waitForSelector('#v-entrar:not([hidden])');
    await p.waitForTimeout(150);
    ok(!(await vis('#l-primeiro')), nome + ': primeiro acesso some depois que há admin');
    await p.fill('#l-user', 'sd.silva'); await p.fill('#l-pass', 'errada'); await p.click('#l-btn'); await p.waitForSelector('#login-msg .err');
    ok(/incorretos/.test(await p.textContent('#login-msg')), nome + ': senha errada recusada');
    await p.fill('#l-pass', senha2); await p.click('#l-btn'); await p.waitForSelector('#v-trocar:not([hidden])');
    await shot('17-trocar');
    await p.fill('#t-pass', 'minhasenha'); await p.fill('#t-pass2', 'minhasenha'); await p.click('#t-btn');
    await p.waitForSelector('#f-perfil'); ok(true, nome + ': aluno trocou senha e entrou');
    ok(!(await p.locator('[data-tab="alunos"]').first().isVisible()), nome + ': aluno não vê aba Alunos');
    await tab('painel'); await shot('18-painel-aluno');
    await p.waitForSelector('#rank-l .hrow'); const rk = await p.locator('#rank-l .hrow').count(); ok(rk >= 1, nome + ': ranking da semana com ' + rk + ' nome(s)');
    await p.locator('#rank-l').scrollIntoViewIfNeeded(); await shot('19-ranking');
    // recarregar mantém sessão e progresso
    await p.reload(); await p.waitForSelector('#v-app:not([hidden]) .greet');
    ok(true, nome + ': sessão mantida ao recarregar');
    const chamadas = await p.evaluate(() => window.__chamadas.filter(c => c[0] === 'salvarProgresso').length);
    console.log('   erros de página:', erros.length ? erros : 'nenhum');
    ok(!erros.length, nome + ': sem erros de JavaScript');
    await ctx.close();
  }
  await b.close();
  console.log(falhas.length ? '\n' + falhas.length + ' FALHA(S)' : '\nTUDO OK');
})().catch(e => { console.error('ERRO NO TESTE:', e.message); process.exit(1); });
