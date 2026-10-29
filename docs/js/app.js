/* Preparatório CTSP: site de estudo com contas no Supabase.
   Telas: entrar, primeiro acesso (administradora), troca de senha provisória e o app
   (painel, plano, matérias/apostilas, simulado, caderno de erros, perfil e, para a administradora, alunos). */
(() => {
'use strict';

/* ============ configuração e conteúdo ============ */
const CFG = window.CTSP_CONFIG || {};
const C = window.CONTEUDO || {mats: [], plano: [], leis: [], ordemProva: []};
const VISUAL = {
  li: {cor: 'gold', ico: '<path d="M29 12 16 17v9c0 8 5.5 13 13 15 7.5-2 13-7 13-15v-9z" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="m23 27 4.5 4.5L36 23" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'},
  pm: {cor: 'red', ico: '<path d="M18 40h22M23 40l6-14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/><rect x="25" y="15" width="15" height="8" rx="2" transform="rotate(45 32 19)" fill="none" stroke="currentColor" stroke-width="2.4"/>'},
  ppm: {cor: 'blue', ico: '<circle cx="26" cy="26" r="9" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="m33 33 9 9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M22 26h8M26 22v8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'},
  cf: {cor: 'green', ico: '<path d="M29 14v28M19 42h20M15 22h28" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M15 22 10 33a5 5 0 0 0 10 0zM43 22l-5 11a5 5 0 0 0 10 0z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'},
  dp: {cor: 'gold', ico: '<path d="M17 16h18l6 6v20H17z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M22 28h14M22 33h14M22 38h9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>'},
  pp: {cor: 'blue', ico: '<circle cx="21" cy="31" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="37" cy="31" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M27 31h4M15 31h-3M46 31h-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'},
  da: {cor: 'green', ico: '<path d="M14 24 29 15l15 9z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 26v12M25 26v12M33 26v12M40 26v12M14 42h30" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'}
};
const NOMES = {li: 'Legislação Institucional', pm: 'Penal Militar', ppm: 'Processual Penal Militar', cf: 'Constitucional', dp: 'Direito Penal', pp: 'Processual Penal', da: 'Administrativo'};
const MATS = C.mats.map(m => Object.assign({}, m, {nomeCurto: NOMES[m.id] || m.nome}, VISUAL[m.id] || VISUAL.li));
const MAT = Object.fromEntries(MATS.map(m => [m.id, m]));
const TOP = {}; MATS.forEach(m => m.tops.forEach(t => { t.mat = m.id; TOP[t.id] = t; }));
const ORDEM = C.ordemProva && C.ordemProva.length ? C.ordemProva : MATS.map(m => m.id);
const COR = {gold: ['var(--goldA)', 'var(--gold)'], red: ['var(--redA)', 'var(--red)'], blue: ['var(--blueA)', 'var(--blue)'], green: ['var(--greenA)', 'var(--green)']};
const NIV = {1: ['Nível 1', 'Revisão direta da regra'], 2: ['Nível 2', 'Casos do serviço'], 3: ['Nível 3', 'Padrão Fundatec']};
const LISTAS = {
  btl: [['Batalhões de Polícia Militar', Array.from({length: 41}, (_, i) => (i + 1) + 'º BPM')],
        ['Unidades especializadas', ['BOE · Operações Especiais', 'BPChq · Polícia de Choque', 'BPRv · Polícia Rodoviária', 'BAPM · Batalhão Ambiental', 'Batalhão de Aviação', 'Batalhão de Guarda', 'APM · Academia de Polícia Militar', 'Escola de formação', 'Comando-Geral / Estado-Maior']]],
  crbm: [['Regiões (CRBM)', ['CRBM Capital', 'CRBM Metropolitano', 'CRBM Serra', 'CRBM Vale do Taquari', 'CRBM Vale do Rio Pardo', 'CRBM Vale do Rio dos Sinos', 'CRBM Litoral Norte', 'CRBM Sul', 'CRBM Centro', 'CRBM Fronteira Oeste', 'CRBM Missões', 'CRBM Planalto', 'CRBM Alto Uruguai', 'CRBM Campanha', 'CRBM Fronteira Noroeste', 'CRBM Hortênsias', 'CRBM Litoral Sul']],
         ['Outros', ['Comando especializado', 'Outra região']]]
};

/* ============ utilidades ============ */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const ic = (id, st) => '<svg class="i"' + (st ? ' style="' + st + '"' : '') + '><use href="#i-' + id + '"/></svg>';
const isoDe = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hoje = () => isoDe(new Date());
const somaDias = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return isoDe(d); };
const dm = iso => iso ? iso.slice(8, 10) + '/' + iso.slice(5, 7) : '';
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = (a, b) => b ? Math.round(a * 100 / b) : 0;
const semAcento = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const tempo = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
const L = 'ABCDE';
let toastT;
function toast(m){ const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3400); }
function msg(el, tipo, texto){ const e = $(el); if (e) e.innerHTML = texto ? '<div class="' + tipo + '">' + ic(tipo === 'ok' ? 'check' : 'alert') + '<span>' + texto + '</span></div>' : ''; }
function hashTxt(s){ let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(36); }
const ocupado = (btn, on, texto) => { if (!btn) return; if (on) { btn.dataset.txt = btn.innerHTML; btn.disabled = true; btn.innerHTML = (texto || 'Aguarde') + '<span class="dots"></span>'; } else { btn.disabled = false; if (btn.dataset.txt) btn.innerHTML = btn.dataset.txt; } };
const tituloDe = p => 'Soldado PM ' + (p.guerra || '');
const abrevDe = p => 'SD PM ' + (p.guerra || '');
const validoUsuario = u => /^[a-z0-9._-]{3,30}$/.test(u);

function erroTexto(e){
  const c = (e && (e.code || e.error_code)) || '', m = String((e && e.message) || '');
  if (c === 'invalid_credentials' || /invalid login credentials/i.test(m)) return 'Usuário ou senha incorretos. Confira e tente de novo.';
  if (c === 'email_not_confirmed' || /not confirmed/i.test(m)) return 'Esta conta não está liberada. Fale com a administradora.';
  if (c === 'user_already_exists' || c === 'usuario_existe' || /usuario_existe|already registered/i.test(m)) return 'Esse usuário já existe. Escolha outro.';
  if (/idf_existe/.test(m)) return 'Essa identidade funcional já está cadastrada em outra conta.';
  if (/codigo_invalido/.test(m)) return 'Código de instalação incorreto.';
  if (/usuario_invalido/.test(m)) return 'Usuário inválido: de 3 a 30 letras minúsculas, números, ponto ou traço.';
  if (/senha_curta/.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/apenas a administradora|campo reservado/.test(m)) return 'Só a administradora pode fazer isso.';
  if (c === '23505' || /duplicate key/i.test(m)) return 'Usuário ou identidade funcional já cadastrados.';
  if (c === 'ja_tem_admin') return 'A administradora já foi criada. Entre com o usuário dela.';
  if (c === 'same_password' || /should be different/i.test(m)) return 'A nova senha precisa ser diferente da atual.';
  if (c === 'weak_password' || /password should be/i.test(m)) return 'Senha fraca. Use pelo menos 6 caracteres, misturando letras e números.';
  if (/rate limit/i.test(m) || c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit') return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (/failed to fetch|network|load failed/i.test(m)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
  if (/row-level security|permission denied/i.test(m)) return 'Sem permissão para isso. Entre de novo e tente outra vez.';
  return 'Algo deu errado' + (m ? ': ' + esc(m) : '.') ;
}

/* ============ API (Supabase) ============ */
function criarAPI(){
  if (window.CTSP_API) return window.CTSP_API; // usado nos testes automáticos
  if (!CFG.supabaseUrl || !CFG.supabaseChave || !window.supabase) return null;
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseChave, {auth: {persistSession: true, autoRefreshToken: true, storageKey: 'ctsp-sessao'}});
  const email = u => u + '@' + (CFG.dominioLogin || 'aluno.ctsp.app');
  const ok = r => { if (r.error) throw r.error; return r.data; };
  return {
    async sessao(){ const {data} = await sb.auth.getSession(); return data && data.session ? data.session.user.id : null; },
    async entrar(usuario, senha){ const d = ok(await sb.auth.signInWithPassword({email: email(usuario), password: senha})); return d.user.id; },
    async sair(){ try { await sb.auth.signOut(); } catch (e) {} },
    async existeAdmin(){ return !!ok(await sb.rpc('existe_admin')); },
    async criarAdmin(c){
      const r = ok(await sb.rpc('criar_admin_inicial', {p_codigo: c.codigo, p_usuario: c.usuario, p_senha: c.senha, p_nome: c.nome, p_guerra: c.guerra}));
      if (!r) throw {code: 'ja_tem_admin'};
      return this.entrar(c.usuario, c.senha);
    },
    async perfil(id){ return ok(await sb.from('perfis').select('*').eq('id', id).maybeSingle()); },
    async salvarPerfil(id, campos){ ok(await sb.from('perfis').update(campos).eq('id', id)); },
    async trocarSenha(nova){ ok(await sb.auth.updateUser({password: nova})); },
    async progresso(id){ const d = ok(await sb.from('progresso').select('dados').eq('user_id', id).maybeSingle()); return d ? d.dados : null; },
    async salvarProgresso(id, dados){ ok(await sb.from('progresso').upsert({user_id: id, dados, atualizado_em: new Date().toISOString()})); },
    async listarAlunos(){
      const [p, g] = await Promise.all([sb.from('perfis').select('*').order('criado_em'), sb.from('progresso').select('user_id,dados,atualizado_em')]);
      const ps = ok(p), gs = ok(g), m = {}; gs.forEach(x => { m[x.user_id] = x; });
      return ps.map(x => Object.assign({}, x, {dados: m[x.id] ? m[x.id].dados : {}, atualizado: m[x.id] ? m[x.id].atualizado_em : null}));
    },
    async criarAluno(c, senha){
      return ok(await sb.rpc('admin_criar_aluno', {p_usuario: c.usuario, p_senha: senha, p_nome: c.nome, p_guerra: c.guerra, p_idf: c.idf || null, p_btl: c.btl || '', p_crbm: c.crbm || ''}));
    },
    async atualizarAluno(id, campos){ ok(await sb.from('perfis').update(campos).eq('id', id)); },
    async redefinirSenha(id, senha){ ok(await sb.rpc('admin_redefinir_senha', {p_alvo: id, p_senha: senha})); },
    async excluirAluno(id){ ok(await sb.rpc('admin_excluir_aluno', {p_alvo: id})); }
  };
}
const API = criarAPI();

/* ============ estado ============ */
let ME = null, D = null, BANCO = [], QID = {}, ABA = 'painel', LEITOR = null, SIM = null, BUSCA = '';
const SCFG = {mat: 'todas', nivel: '0', qtd: 10, modo: 'imediato'};
const normDados = d => { d = d && typeof d === 'object' ? d : {}; return {v: 1, sims: Array.isArray(d.sims) ? d.sims : [], erros: Array.isArray(d.erros) ? d.erros : [], vistas: d.vistas || {}, dom: d.dom || {}, revs: d.revs || {}, estudo: d.estudo || {}}; };
let salvarT = null, salvando = Promise.resolve(), pendente = false;
function salvar(){ pendente = true; clearTimeout(salvarT); salvarT = setTimeout(gravar, 700); }
function gravar(){
  clearTimeout(salvarT); if (!pendente || !ME || !API) return salvando; pendente = false;
  const copia = JSON.parse(JSON.stringify(D));
  salvando = salvando.then(() => API.salvarProgresso(ME.id, copia)).catch(e => { pendente = true; toast('Não deu para salvar agora. ' + erroTexto(e).replace(/<[^>]+>/g, '')); if (!/row-level security|permission denied|JWT/i.test(String(e && e.message))) setTimeout(gravar, 8000); });
  return salvando;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') gravar(); });
window.addEventListener('pagehide', gravar);

/* ============ banco de questões ============ */
async function carregarBanco(){
  try {
    const r = await fetch('dados/banco.json', {cache: 'no-cache'});
    const arr = await r.json();
    BANCO = arr.filter(q => q && MAT[q.mat] && Array.isArray(q.alternativas) && q.alternativas.length >= 2 && Number.isInteger(+q.correta)).map(q => {
      const id = q.id || ('q' + hashTxt(q.mat + '|' + q.enunciado + '|' + q.alternativas.join('|')));
      return Object.assign({}, q, {id, nivel: +q.nivel || 2, correta: +q.correta});
    });
    QID = Object.fromEntries(BANCO.map(q => [q.id, q]));
  } catch (e) { BANCO = []; QID = {}; toast('Não deu para carregar o banco de questões.'); }
}
const pool = c => BANCO.filter(q => (c.mat === 'todas' || q.mat === c.mat) && (c.nivel === '0' || String(q.nivel) === c.nivel) && (!c.top || !q.top || q.top === c.top));
function escolher(lista, n){
  const v = D.vistas || {};
  return shuffle(lista.slice()).sort((a, b) => (v[a.id] || 0) - (v[b.id] || 0)).slice(0, n);
}
function embaralhar(q){
  // só não embaralha alternativa que aponta para outra ("todas as anteriores", "A e B"); o resto vinha com a certa quase sempre na A
  if (q.alternativas.some(a => /(das|as) anteriores|alternativas? [A-E]\b|\b[A-E] e [A-E]\b/.test(a))) return q;
  const ix = shuffle(q.alternativas.map((_, i) => i));
  return Object.assign({}, q, {alternativas: ix.map(i => q.alternativas[i]), correta: ix.indexOf(q.correta)});
}

/* ============ navegação ============ */
const VIEWS = ['entrar', 'primeiro', 'trocar', 'app'];
function mostrar(v){ VIEWS.forEach(x => { $('#v-' + x).hidden = x !== v; }); $('#carregando').hidden = true; scrollTo(0, 0); }
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); irPara(g.dataset.go); return; }
  if (e.target.closest('[data-foto]')) { trocarMinhaFoto(); return; }
  if (e.target.closest('[data-sair]')) { sair(); return; }
  if (e.target.closest('[data-mais]')) { abrirMais(); return; }
  const t = e.target.closest('[data-tab]'); if (t) { fecharMais(); if (t.dataset.tab === 'materias') LEITOR = null; aba(t.dataset.tab); return; }
  const tp = e.target.closest('[data-topico]'); if (tp) { e.preventDefault(); abrirTopico(tp.dataset.topico); return; }
  const mt = e.target.closest('[data-mat]'); if (mt) { abrirMateria(mt.dataset.mat); return; }
  const pr = e.target.closest('[data-praticar]'); if (pr) { praticar(pr.dataset.praticar); return; }
});
function irPara(v){ if (v === 'primeiro') { $('#f-primeiro').reset(); msg('#p1-msg'); } mostrar(v); }
async function sair(){ await gravar(); if (API) await API.sair(); ME = null; D = null; SIM = null; LEITOR = null; mostrar('entrar'); prepararEntrada(); toast('Você saiu do portal.'); }
function abrirMais(){
  fecharMais();
  const m = document.createElement('div'); m.className = 'sheet'; m.id = 'mais';
  const n = D ? D.erros.length : 0;
  m.innerHTML = '<div class="in"><button class="nv" data-tab="erros">' + ic('alert') + 'Caderno de erros' + (n ? '<span class="b">' + n + '</span>' : '') + '</button><button class="nv" data-tab="perfil">' + ic('user') + 'Meu perfil</button>' +
    (ME && ME.papel === 'admin' ? '<button class="nv" data-tab="alunos">' + ic('users') + 'Alunos</button>' : '') + '<button class="nv" data-sair>' + ic('logout') + 'Sair</button></div>';
  m.addEventListener('click', e => { if (e.target === m) fecharMais(); });
  document.body.appendChild(m);
}
function fecharMais(){ const m = $('#mais'); if (m) m.remove(); }

/* ============ entrada ============ */
async function prepararEntrada(){
  $('#l-primeiro').hidden = true;
  if (!API) { msg('#login-msg', 'err', 'Site ainda não configurado: falta preencher o endereço e a chave do Supabase no arquivo js/config.js (veja o LEIA-ME).'); return; }
  try { $('#l-primeiro').hidden = await API.existeAdmin(); } catch (e) { /* sem banco ainda */ }
}
try { $('#l-user').value = localStorage.getItem('ctsp-usuario') || ''; } catch (e) { /* sem armazenamento */ }
$('#l-olho').addEventListener('click', () => { const p = $('#l-pass'), ver = p.type === 'password'; p.type = ver ? 'text' : 'password'; const b = $('#l-olho'); b.classList.toggle('on', ver); b.setAttribute('aria-pressed', ver); b.setAttribute('aria-label', ver ? 'Esconder senha' : 'Mostrar senha'); });
$('#f-login').addEventListener('submit', async e => {
  e.preventDefault();
  if (!API) return prepararEntrada();
  const u = $('#l-user').value.trim().toLowerCase(), p = $('#l-pass').value;
  if (!u || !p) return msg('#login-msg', 'err', 'Preencha usuário e senha.');
  if (!validoUsuario(u)) return msg('#login-msg', 'err', 'Usuário inválido: use letras minúsculas, números, ponto ou traço.');
  const b = $('#l-btn'); ocupado(b, true, 'Entrando');
  try { const id = await API.entrar(u, p); msg('#login-msg'); $('#l-pass').value = ''; try { localStorage.setItem('ctsp-usuario', u); } catch (e) { /* sem armazenamento */ } await iniciarSessao(id); }
  catch (er) { msg('#login-msg', 'err', erroTexto(er)); }
  ocupado(b, false);
});
$('#f-primeiro').addEventListener('submit', async e => {
  e.preventDefault();
  const codigo = $('#a-codigo').value.trim().toUpperCase(), nome = $('#a-nome').value.trim(), guerra = $('#a-guerra').value.trim(), usuario = $('#a-user').value.trim().toLowerCase(), senha = $('#a-pass').value;
  if (!codigo) return msg('#p1-msg', 'err', 'Informe o código de instalação.');
  if (!nome || !guerra) return msg('#p1-msg', 'err', 'Preencha nome completo e nome de guerra.');
  if (!validoUsuario(usuario)) return msg('#p1-msg', 'err', 'Usuário inválido: de 3 a 30 letras minúsculas, números, ponto ou traço.');
  if (senha.length < 6) return msg('#p1-msg', 'err', 'A senha precisa ter pelo menos 6 caracteres.');
  if (senha !== $('#a-pass2').value) return msg('#p1-msg', 'err', 'As senhas não conferem.');
  const b = $('#a-btn'); ocupado(b, true, 'Criando');
  try { const id = await API.criarAdmin({codigo, nome, guerra, usuario, senha}); await iniciarSessao(id); toast('Administradora criada. Complete o seu perfil.'); }
  catch (er) { msg('#p1-msg', 'err', erroTexto(er)); }
  ocupado(b, false);
});
$('#f-trocar').addEventListener('submit', async e => {
  e.preventDefault();
  const p = $('#t-pass').value;
  if (p.length < 6) return msg('#t-msg', 'err', 'A nova senha precisa ter pelo menos 6 caracteres.');
  if (p !== $('#t-pass2').value) return msg('#t-msg', 'err', 'As senhas não conferem.');
  const b = $('#t-btn'); ocupado(b, true, 'Salvando');
  try { await API.trocarSenha(p); await API.salvarPerfil(ME.id, {senha_provisoria: false}); ME.senha_provisoria = false; $('#f-trocar').reset(); msg('#t-msg'); entrarApp('perfil'); toast('Senha criada. Confira os seus dados.'); }
  catch (er) { msg('#t-msg', 'err', erroTexto(er)); }
  ocupado(b, false);
});

async function iniciarSessao(id){
  const perfil = await API.perfil(id);
  if (!perfil) { await API.sair(); msg('#login-msg', 'err', 'Esta conta não tem acesso ao portal. Fale com a administradora.'); return mostrar('entrar'); }
  if (!perfil.ativo) { await API.sair(); msg('#login-msg', 'err', 'Esta conta está bloqueada. Fale com a administradora.'); return mostrar('entrar'); }
  ME = perfil;
  D = normDados(await API.progresso(id));
  if (!BANCO.length) await carregarBanco();
  API.salvarPerfil(id, {ultimo_acesso: new Date().toISOString()}).catch(() => {});
  if (ME.senha_provisoria) { $('#t-ola').textContent = 'Olá, ' + tituloDe(ME); return mostrar('trocar'); }
  entrarApp(ME.papel === 'admin' && !ME.btl ? 'perfil' : 'painel');
}

/* ============ foto de perfil ============ */
const silhueta = '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
const avatarIn = foto => '<span class="img">' + (foto ? '<img alt="" src="' + esc(foto) + '">' : silhueta) + '</span><span class="cam">' + ic('camera') + '</span>';
const avatarMini = u => '<span class="tbl-av">' + (u.foto ? '<img alt="" src="' + esc(u.foto) + '">' : silhueta) + '</span>';
function prepararFoto(src){
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => { const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, s = Math.min(w, h), c = document.createElement('canvas'); c.width = c.height = 320;
      c.getContext('2d').drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 320, 320); ok(c.toDataURL('image/jpeg', .82)); };
    img.onerror = () => falha(new Error('imagem'));
    img.src = src;
  });
}
const lerArquivo = f => new Promise((ok, falha) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = falha; r.readAsDataURL(f); });
function escolherFoto(atual, aoSalvar){
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = '<div class="box" role="dialog" aria-label="Foto de perfil"><div class="ph2"><div><div class="kick">Foto de perfil</div><h2 style="font-size:22px">Como quer adicionar?</h2></div><button class="ib" data-x aria-label="Fechar">' + ic('x') + '</button></div><div id="f-msg"></div>' +
    '<div class="foto-ops" id="f-ops"><label class="btn ghost" for="f-gal">' + ic('image') + 'Escolher da galeria ou dos arquivos</label><input id="f-gal" type="file" accept="image/*" hidden>' +
    '<button class="btn ghost" type="button" id="f-cam">' + ic('camera') + 'Tirar foto agora</button><input id="f-capt" type="file" accept="image/*" capture="user" hidden>' +
    (atual ? '<button class="btn danger" type="button" id="f-rm">' + ic('trash') + 'Remover foto</button>' : '') + '</div>' +
    '<div class="cam-live" id="f-live" hidden><video id="f-video" autoplay playsinline muted></video><div class="row2"><button class="btn ghost" type="button" id="f-voltar">Voltar</button><button class="btn gold" type="button" id="f-shot">' + ic('camera') + 'Capturar</button></div></div></div>';
  document.body.appendChild(m); document.body.style.overflow = 'hidden';
  let stream = null;
  const fechar = () => { if (stream) stream.getTracks().forEach(t => t.stop()); m.remove(); document.body.style.overflow = ''; };
  const usar = async src => { try { await aoSalvar(await prepararFoto(src)); fechar(); } catch (e) { msg('#f-msg', 'err', 'Não deu para usar essa imagem. Tente outro arquivo JPG ou PNG.'); } };
  const doArquivo = async inp => { const f = inp.files && inp.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return msg('#f-msg', 'err', 'Escolha um arquivo de imagem.'); usar(await lerArquivo(f)); };
  m.querySelector('[data-x]').onclick = fechar;
  m.addEventListener('click', e => { if (e.target === m) fechar(); });
  m.querySelector('#f-gal').onchange = e => doArquivo(e.target);
  m.querySelector('#f-capt').onchange = e => doArquivo(e.target);
  const rm = m.querySelector('#f-rm'); if (rm) rm.onclick = async () => { await aoSalvar(null); fechar(); };
  m.querySelector('#f-cam').onclick = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('sem api');
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'user', width: {ideal: 720}}});
      m.querySelector('#f-video').srcObject = stream; m.querySelector('#f-ops').hidden = true; m.querySelector('#f-live').hidden = false; msg('#f-msg');
    } catch (e) { m.querySelector('#f-capt').click(); }
  };
  m.querySelector('#f-voltar').onclick = () => { if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; m.querySelector('#f-live').hidden = true; m.querySelector('#f-ops').hidden = false; };
  m.querySelector('#f-shot').onclick = () => {
    const v = m.querySelector('#f-video'), c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    const x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(v, 0, 0); usar(c.toDataURL('image/jpeg', .9));
  };
}
function trocarMinhaFoto(){
  if (!ME) return;
  escolherFoto(ME.foto, async f => {
    try { await API.salvarPerfil(ME.id, {foto: f}); ME.foto = f; pintarMe(); aba(ABA); toast(f ? 'Foto atualizada.' : 'Foto removida.'); }
    catch (e) { toast(erroTexto(e).replace(/<[^>]+>/g, '')); throw e; }
  });
}

/* ============ listas com busca (batalhão e região) ============ */
function filtrar(lista, q){
  q = q.trim(); const num = /^\d+$/.test(q), nq = semAcento(q);
  return lista.map(([g, itens]) => [g, itens.filter(t => !q || (num ? (/^\d+/.exec(t) || [''])[0].startsWith(q) : semAcento(t).includes(nq)))]).filter(([, it]) => it.length);
}
function ligarCombos(raiz){
  (raiz || document).querySelectorAll('.combo').forEach(cb => {
    if (cb.dataset.ok) return; cb.dataset.ok = 1;
    const inp = cb.querySelector('input'), base = LISTAS[cb.dataset.lista]; let box = null, ativo = -1;
    const fechar = () => { if (box) { box.remove(); box = null; } cb.classList.remove('open'); ativo = -1; };
    const marcar = t => { inp.value = t; fechar(); inp.dataset.escolhido = t; };
    const realce = (t, q) => { if (!q) return esc(t); const i = /^\d+$/.test(q) ? 0 : semAcento(t).indexOf(semAcento(q)); return i < 0 ? esc(t) : esc(t.slice(0, i)) + '<b>' + esc(t.slice(i, i + q.length)) + '</b>' + esc(t.slice(i + q.length)); };
    const abrir = () => {
      const q = inp.dataset.escolhido === inp.value ? '' : inp.value, grupos = filtrar(base, q);
      if (!box) { box = document.createElement('div'); box.className = 'lista'; box.setAttribute('role', 'listbox'); cb.appendChild(box); cb.classList.add('open'); }
      box.innerHTML = grupos.length ? grupos.map(([g, it]) => '<div class="grp">' + esc(g) + '</div>' + it.map(t => '<button type="button" class="op' + (t === inp.value ? ' sel' : '') + '" role="option" data-v="' + esc(t) + '">' + realce(t, q.trim()) + '</button>').join('')).join('')
        : '<div class="vazio">Nada encontrado para "' + esc(q) + '".</div>' + (cb.dataset.lista === 'btl' && q.trim() ? '<button type="button" class="op" data-v="' + esc(q.trim()) + '">Usar "' + esc(q.trim()) + '" como unidade</button>' : '');
      box.querySelectorAll('.op').forEach(o => { o.onmousedown = e => { e.preventDefault(); marcar(o.dataset.v); }; });
      ativo = -1;
    };
    inp.addEventListener('focus', abrir); inp.addEventListener('click', abrir);
    inp.addEventListener('input', e => { if (e.isTrusted) { delete inp.dataset.escolhido; abrir(); } });
    inp.addEventListener('blur', () => setTimeout(fechar, 120));
    inp.addEventListener('keydown', e => {
      if (!box) return; const ops = [...box.querySelectorAll('.op')];
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); ativo = (ativo + (e.key === 'ArrowDown' ? 1 : -1) + ops.length) % ops.length; ops.forEach((o, i) => o.classList.toggle('on', i === ativo)); if (ops[ativo]) ops[ativo].scrollIntoView({block: 'nearest'}); }
      else if (e.key === 'Enter' && ops.length) { e.preventDefault(); marcar((ops[ativo] || ops[0]).dataset.v); }
      else if (e.key === 'Escape') fechar();
    });
  });
}
const valido = (lista, v) => LISTAS[lista].some(([, it]) => it.includes(v));
const comboHTML = (id, lista, valor, icone, ph) => '<div class="combo" data-lista="' + lista + '"><div class="inp">' + ic(icone) + '<input id="' + id + '" autocomplete="off" placeholder="' + ph + '" value="' + esc(valor || '') + '"' + (valor ? ' data-escolhido="' + esc(valor) + '"' : '') + '><svg class="i chev"><use href="#i-down"/></svg></div></div>';

/* ============ app ============ */
function pintarMe(){
  $('#me-ph').innerHTML = avatarIn(ME.foto);
  $('#me-nome').textContent = abrevDe(ME);
  $('#me-unid').textContent = ME.papel === 'admin' ? 'Administradora' + (ME.btl ? ' · ' + ME.btl : '') : (ME.btl || 'Unidade não informada') + (ME.crbm ? ' · ' + ME.crbm : '');
  document.querySelectorAll('[data-admin]').forEach(b => { b.hidden = ME.papel !== 'admin'; });
}
function entrarApp(t){ if (!ME) return mostrar('entrar'); pintarMe(); mostrar('app'); aba(t || 'painel'); }
function aba(t){
  if (t === 'alunos' && ME.papel !== 'admin') t = 'painel';
  if (t !== 'materias') LEITOR = null;
  ABA = t;
  document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t || (t === 'leitor' && b.dataset.tab === 'materias')));
  document.querySelectorAll('.tb[data-mais]').forEach(b => b.classList.toggle('on', ['erros', 'perfil', 'alunos'].includes(t)));
  const n = D.erros.length; document.querySelectorAll('[data-nerros]').forEach(b => { b.hidden = !n; b.textContent = n; });
  ({painel: rPainel, plano: rPlano, materias: rMaterias, simulado: rSimulado, erros: rErros, perfil: rPerfil, alunos: rAlunos}[t] || rPainel)();
  scrollTo(0, 0);
}
const mtop = () => '<div class="mtop"><div class="em"></div><b>Preparatório CTSP</b><button class="btn ghost sm out" data-sair>' + ic('logout') + 'Sair</button></div>';

/* ---- métricas ---- */
function stats(){
  let ok = 0, tot = 0; const pm = {}; MATS.forEach(m => { pm[m.id] = {ok: 0, tot: 0}; });
  D.sims.forEach(s => { ok += s.ok; tot += s.tot; (s.porMat || []).forEach(([m, a, t]) => { if (pm[m]) { pm[m].ok += a; pm[m].tot += t; } }); });
  const dias = new Set(D.sims.map(s => s.d)); Object.keys(D.dom).forEach(k => dias.add(D.dom[k]));
  let seq = 0, d = hoje(); if (!dias.has(d)) d = somaDias(d, -1);
  while (dias.has(d)) { seq++; d = somaDias(d, -1); }
  const dom = Object.keys(D.dom).filter(k => TOP[k]).length;
  const pontos = tot + ok * 2 + dom * 15;
  const fraca = MATS.filter(m => pm[m.id].tot).sort((a, b) => pct(pm[a.id].ok, pm[a.id].tot) - pct(pm[b.id].ok, pm[b.id].tot))[0] || MAT.pm || MATS[0];
  return {ok, tot, pm, seq, pontos, fraca, ult: D.sims[0], dom, minutos: Math.round(D.sims.reduce((a, s) => a + (s.seg || 0), 0) / 60)};
}
function semanaAtual(){ const d = hoje(); return C.plano.find(p => d >= p.ini && d <= p.fim) || (d < (C.plano[0] || {}).ini ? C.plano[0] : C.plano[C.plano.length - 1]); }
function revisoes(){
  const d = hoje(), out = [];
  Object.keys(D.dom).forEach(tid => { if (!TOP[tid]) return; const st = (D.revs[tid] || []).length; if (st >= 3) return; if (d >= somaDias(D.dom[tid], [1, 7, 30][st])) out.push({tid, st}); });
  return out;
}
function cincoAnos(p){ if (!p.incl) return null; const d = new Date(p.incl + 'T12:00:00'); d.setFullYear(d.getFullYear() + 5); return d.toLocaleDateString('pt-BR'); }
const kpi = (c, i, v, l) => '<div class="kpi"><div class="ic c-' + c + '">' + ic(i) + '</div><div style="min-width:0"><div class="v">' + v + '</div><div class="l">' + l + '</div></div></div>';
const missao = (feito, c, i, t, sub, attrs) => '<button class="mi' + (feito ? ' done' : '') + '" ' + attrs + '><span class="ic ' + c + '">' + ic(i) + '</span><span class="tx"><b>' + esc(t) + '</b><small>' + esc(sub) + '</small></span><span class="go">' + ic(feito ? 'check' : 'arrow') + '</span></button>';
function anel(n){ const off = 314 - 314 * Math.min(60, n) / 60; return '<div class="ring"><svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="gr"><stop offset="0" stop-color="#DEB252"/><stop offset="1" stop-color="#F4D78C"/></linearGradient></defs><circle cx="60" cy="60" r="50" stroke="rgba(222,190,120,.12)" stroke-width="10" fill="none"/><circle cx="60" cy="60" r="50" stroke="url(#gr)" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="' + off + '" transform="rotate(-90 60 60)"/></svg><b>' + (n ? n + '/60' : '—') + '<small>último</small></b></div>'; }
function cardMat(m, s){
  const st = s.pm[m.id], a = pct(st.ok, st.tot), [bg, fg] = COR[m.cor], dom = m.tops.filter(t => D.dom[t.id]).length;
  return '<button class="mat" data-mat="' + m.id + '"><span class="w' + (m.q > 8 ? ' hot' : '') + '">' + m.q + ' na prova</span><svg class="ill" viewBox="0 0 58 58" style="color:' + fg + '" aria-hidden="true"><rect width="58" height="58" rx="16" fill="' + bg + '"/>' + m.ico + '</svg><b>' + esc(m.nomeCurto) + '</b><div class="bar' + (st.tot && a < 75 ? ' red' : '') + '"><i style="width:' + (st.tot ? a : 0) + '%"></i></div><div class="meta"><span>' + dom + '/' + m.tops.length + ' tópicos</span><span>' + (st.tot ? a + '% acerto' : 'sem questões') + '</span></div></button>';
}

/* ---- painel ---- */
function rPainel(){
  const s = stats(), data = new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
  const ac = pct(s.ok, s.tot), ca = cincoAnos(ME), meta = 2000, pp = Math.min(100, pct(s.pontos, meta)), w = semanaAtual(), rv = revisoes();
  const foco = s.tot ? 'Seu acerto está em <b style="color:var(--gold2)">' + ac + '%</b>. Hoje o foco é <b style="color:var(--ink)">' + esc(s.fraca.nomeCurto) + '</b>, a matéria em que você mais errou.' : 'Comece pelo plano da semana e faça um simulado de nível 1 para o portal medir a sua base.';
  const ultNota = s.ult && s.ult.tot ? Math.round(s.ult.ok * 60 / s.ult.tot) : 0;
  const wt = w ? w.t.filter(t => TOP[t]) : [], wd = wt.filter(t => D.dom[t]).length;
  $('#main').innerHTML = mtop() +
  '<div class="hello"><div class="greet"><div class="k">' + esc(data) + '</div><h1>E aí, <em>' + esc(tituloDe(ME)) + '</em>.</h1><p>' + foco + '</p>' +
    '<div class="cta"><button class="btn gold" data-praticar="fraca">' + ic('play') + 'Começar missão de hoje</button><button class="btn ghost" data-tab="plano">' + ic('cal') + 'Ver o plano</button></div>' +
    '<svg class="art" viewBox="0 0 220 220" aria-hidden="true"><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F4D78C"/><stop offset="1" stop-color="#A97A24"/></linearGradient><radialGradient id="g2"><stop offset="0" stop-color="rgba(222,178,82,.35)"/><stop offset="1" stop-color="rgba(222,178,82,0)"/></radialGradient></defs><circle cx="110" cy="110" r="100" fill="url(#g2)"/><path d="M50 50h120v95l-60 45-60-45z" fill="#0d0b08" stroke="#5a4520" stroke-width="3"/><path d="M62 70 110 98 158 70v18l-48 28-48-28z" fill="url(#g1)"/><path d="M62 98 110 126 158 98v18l-48 28-48-28z" fill="url(#g1)" opacity=".85"/><path d="m110 150 4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#F4D78C"/></svg></div>' +
  '<div class="idcard"><div class="hd"><button type="button" class="avatar" data-foto aria-label="Trocar foto de perfil">' + avatarIn(ME.foto) + '</button><div class="nm"><b>' + esc(abrevDe(ME)) + '</b><small>' + (ME.idf ? 'ID FUNCIONAL ' + esc(ME.idf) : esc(ME.usuario)) + '</small></div></div>' +
    '<div class="tagrow">' + (ME.btl ? '<span class="tg">' + ic('shield') + esc(ME.btl) + '</span>' : '') + (ME.crbm ? '<span class="tg">' + ic('map') + esc(ME.crbm) + '</span>' : '') + (ca ? '<span class="tg">' + ic('cal') + '5 anos em ' + ca + '</span>' : '') + (!ME.btl ? '<button class="tg" data-tab="perfil">' + ic('edit') + 'Completar perfil</button>' : '') + '</div>' +
    '<div class="rank"><svg width="42" height="42" viewBox="0 0 42 42" aria-hidden="true"><rect width="42" height="42" rx="10" fill="rgba(222,178,82,.12)"/><path d="M11 16 21 22l10-6v4l-10 6-10-6z" fill="#DEB252"/><path d="M11 23l10 6 10-6v4l-10 6-10-6z" fill="#DEB252" opacity=".45"/></svg><div style="flex:1;min-width:0"><b>Pontos de estudo</b><small>' + s.pontos + ' de ' + meta + ' pontos</small><div class="bar"><i style="width:' + pp + '%"></i></div></div></div></div></div>' +
  '<div class="kpis">' + kpi('gold', 'target', s.tot ? ac + '%' : '—', 'acerto geral · meta 90%') + kpi('red', 'flame', s.seq + (s.seq === 1 ? ' dia' : ' dias'), 'seguidos estudando') +
    kpi('blue', 'book', s.dom + '/' + Object.keys(TOP).length, 'tópicos dominados') + kpi('green', 'medal', D.sims.length, D.sims.length === 1 ? 'simulado feito' : 'simulados feitos') + '</div>' +
  '<div class="grid"><div class="pnl"><div class="ph2"><h3>' + ic('check') + 'Missão de hoje</h3></div><div class="mis">' +
    (w ? missao(wt.length && wd === wt.length, 'c-gold', 'cal', 'Semana ' + w.s + ' do plano' + (wt.length ? ': ' + wd + ' de ' + wt.length + ' tópicos' : ''), w.txt || 'Estude os tópicos desta semana', 'data-tab="plano"') : '') +
    missao(!rv.length, 'c-blue', 'repeat', rv.length ? 'Revisar ' + rv.length + (rv.length === 1 ? ' tópico' : ' tópicos') + ' hoje' : 'Revisões em dia', rv.length ? 'Revisão espaçada: 1, 7 e 30 dias depois de dominar' : 'Marque tópicos como dominados nas apostilas', rv.length ? 'data-topico="' + rv[0].tid + '" data-rev="1"' : 'data-tab="materias"') +
    missao(D.sims.some(x => x.d === hoje()), 'c-gold', 'target', '10 questões · ' + s.fraca.nomeCurto, 'Simulado focado na matéria mais fraca', 'data-praticar="fraca"') +
    missao(!D.erros.length, 'c-red', 'alert', D.erros.length ? 'Refazer ' + D.erros.length + ' questões do caderno de erros' : 'Caderno de erros em dia', D.erros.length ? 'Questões que você errou' : 'Nenhuma questão pendente', 'data-tab="erros"') + '</div></div>' +
  '<div class="pnl"><div class="ph2"><h3>' + ic('chart') + 'Rumo ao corte</h3></div>' + (!s.ult ? '<p style="margin:0;color:var(--ink2)">O corte de 2026 foi 52 de 60. Faça um simulado para o portal projetar a sua nota.</p><button class="btn gold" data-praticar="rapido">' + ic('play') + 'Fazer meu primeiro simulado (10 questões)</button></div></div>' : '<div class="goal">' + anel(ultNota) +
    '<ul><li>' + ic(ultNota >= 52 ? 'check' : 'alert', 'color:var(--' + (ultNota >= 52 ? 'green' : 'red') + ')') + (s.ult ? (ultNota >= 52 ? 'Acima da nota de corte de 2026 (52)' : 'Faltam ' + (52 - ultNota) + ' para o corte de 2026 (52)') : 'Faça um simulado para medir') + '</li><li>' + ic('target', 'color:var(--gold)') + 'Meta: 54 a 57 de 60</li><li>' + ic('list', 'color:var(--blue)') + 'Projeção sobre 60 questões</li></ul></div>' +
    '<div class="hist">' + (D.sims.length ? D.sims.slice(0, 4).map(x => '<div class="hrow"><b>' + esc(x.nome) + '</b><span class="n" style="color:var(--' + (pct(x.ok, x.tot) >= 80 ? 'green' : 'red') + ')">' + x.ok + '/' + x.tot + '</span><span class="hint">' + dm(x.d) + '</span></div>').join('') : '<div class="empty">Seus simulados aparecem aqui.</div>') + '</div></div></div>') +
  '<div class="pnl"><div class="ph2"><h3>' + ic('book') + 'Suas matérias</h3><button class="link" data-tab="materias">Abrir todas</button></div><div class="mats">' + MATS.map(m => cardMat(m, s)).join('') + '</div></div>';
  const rb = document.querySelector('[data-rev]'); if (rb) rb.addEventListener('click', () => { const tid = rb.dataset.topico; (D.revs[tid] = D.revs[tid] || []).push(hoje()); salvar(); }, {capture: true});
}

/* ---- plano ---- */
function rPlano(){
  const d = hoje(), w = semanaAtual();
  const fases = [['Diagnóstico', '26/10 a 08/11', '2026-10-26', '2026-11-08'], ['Base', '09/11 a 28/02', '2026-11-09', '2027-02-28'], ['Aprofundamento', '01/03 a 04/04', '2027-03-01', '2027-04-04'], ['Reta final', '05/04 até a prova', '2027-04-05', '2027-06-13']];
  const chip = tid => { const t = TOP[tid]; if (!t) return ''; return '<button class="chip' + (D.dom[tid] ? ' ok' : '') + '" data-topico="' + tid + '">' + (D.dom[tid] ? '✓ ' : '') + esc(NOMES[t.mat] || t.mat) + ' · ' + esc(t.nome) + '</button>'; };
  $('#main').innerHTML = mtop() + '<div class="pghead"><div class="k">Projeto de estudo · out/2026 a jun/2027</div><h1>Plano <em>semanal</em></h1><p>Cada semana tem os seus tópicos. Toque num tópico para abrir a apostila naquele ponto; marque "Dominei" ao terminar.</p></div>' +
    '<div class="fases">' + fases.map(f => '<div class="fase' + (d >= f[2] && d <= f[3] ? ' on' : '') + '"><b>' + f[0] + '</b>' + f[1] + '</div>').join('') + '</div>' +
    '<div class="semanas">' + C.plano.map(p => { const agora = p === w, ts = p.t.filter(t => TOP[t]), dd = ts.filter(t => D.dom[t]).length;
      return '<div class="sem' + (agora ? ' agora' : '') + (p.fim < d && !agora ? ' passou' : '') + '"><div class="top"><b>Semana ' + esc(p.s) + (agora ? ' · agora' : '') + '</b><span>' + dm(p.ini) + ' a ' + dm(p.fim) + ' · ' + esc(p.tipo) + (ts.length ? ' · ' + dd + '/' + ts.length : '') + '</span></div>' +
        (p.txt ? '<p>' + esc(p.txt) + '</p>' : '') + (ts.length ? '<div class="chips">' + ts.map(chip).join('') + '</div>' : '') +
        (p.m.length ? '<div class="chips">' + p.m.map(m => '<button class="chip" data-praticar="' + m + '">' + ic('target') + 'Treinar ' + esc(NOMES[m] || m) + '</button>').join('') + '</div>' : '') +
        (p.links.length ? '<div class="chips">' + (p.links.some(l => /^Prova CTSP\/2026/.test(l[0])) ? '<button class="chip" data-praticar="real2026">' + ic('target') + 'Fazer a prova 2026 aqui (4h, corrige sozinho)</button>' : '') + p.links.map(l => '<a class="chip" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + ic('link') + esc(l[0]) + '</a>').join('') + '</div>' : '') + '</div>'; }).join('') + '</div>';
  const atual = document.querySelector('.sem.agora'); if (atual && C.plano.indexOf(w) > 1) setTimeout(() => atual.scrollIntoView({block: 'start'}), 50);
}

/* ---- matérias e busca ---- */
const TXT = {};
function textoTopico(tid){ if (!TXT[tid]) { const d = document.createElement('div'); d.innerHTML = TOP[tid].html.replace(/></g, '> <'); d.querySelectorAll('.t-num,.tags,small').forEach(e => e.remove()); TXT[tid] = d.textContent.replace(/\s+/g, ' ').trim(); } return TXT[tid]; }
function buscar(q){
  const ws = semAcento(q).split(/\s+/).filter(w => w.length > 1); if (!ws.length) return [];
  const out = [];
  Object.values(TOP).forEach(t => {
    const txt = textoTopico(t.id), hay = semAcento(t.title + ' ' + t.nome + ' ' + t.ref + ' ' + txt);
    if (!ws.every(w => hay.includes(w))) return;
    const pos = Math.max(0, semAcento(txt).indexOf(ws[0])), ini = Math.max(0, pos - 70);
    const score = ws.reduce((a, w) => a + (semAcento(t.title).includes(w) ? 5 : 0) + (hay.split(w).length - 1), 0);
    out.push({t, snip: (ini ? '…' : '') + txt.slice(ini, ini + 220) + '…', score});
  });
  return out.sort((a, b) => b.score - a.score).slice(0, 30);
}
function marcarTermos(texto, q){
  const ws = semAcento(q).split(/\s+/).filter(w => w.length > 2); let out = esc(texto); if (!ws.length) return out;
  const n = semAcento(out), rs = []; ws.forEach(w => { let i = n.indexOf(w); while (i >= 0) { rs.push([i, i + w.length]); i = n.indexOf(w, i + w.length); } });
  if (!rs.length) return out; rs.sort((a, b) => a[0] - b[0]); let r = '', last = 0; rs.forEach(([a, b]) => { if (a < last) return; r += out.slice(last, a) + '<mark>' + out.slice(a, b) + '</mark>'; last = b; }); return r + out.slice(last);
}
function hitsHTML(){
  const q = BUSCA.trim(); if (!q) return '';
  const hs = buscar(q); if (!hs.length) return '<div class="empty">Nada encontrado para "' + esc(q) + '". Tente outra palavra.</div>';
  return '<div class="hint">' + hs.length + ' resultado(s)</div>' + hs.map(h => '<button class="hit" data-topico="' + h.t.id + '"><span class="chips"><span class="badge g">' + esc(NOMES[h.t.mat] || '') + '</span><span class="badge">' + esc(h.t.ref) + '</span></span><b>' + esc(h.t.title) + '</b><span>' + marcarTermos(h.snip, q) + '</span></button>').join('');
}
function rMaterias(){
  if (LEITOR) return rLeitor();
  const s = stats();
  $('#main').innerHTML = mtop() + '<div class="pghead"><div class="k">7 apostilas · ' + Object.keys(TOP).length + ' tópicos</div><h1>Matérias do <em>edital</em></h1><p>Cada apostila traz o que cai, atalhos, casos do serviço e pegadinhas da Fundatec. Toque numa matéria para ler ou busque um assunto.</p></div>' +
    '<div class="sbox">' + ic('search') + '<input id="busca" type="search" placeholder="Busque um assunto: prazo do IPM, deserção, LAI, art. 5º" value="' + esc(BUSCA) + '" autocomplete="off"></div>' +
    '<div class="hits" id="hits">' + hitsHTML() + '</div>' +
    '<div class="pnl" id="grade"' + (BUSCA.trim() ? ' hidden' : '') + '><div class="mats">' + MATS.map(m => cardMat(m, s)).join('') + '</div></div>' +
    (C.leis && C.leis.length ? '<div class="pnl" id="fontes"' + (BUSCA.trim() ? ' hidden' : '') + '><div class="ph2"><h3>' + ic('link') + 'Lei seca e fontes</h3></div><div class="chips">' + C.leis.map(l => '<a class="chip" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>').join('') + (C.docs || []).map(l => '<a class="chip" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>').join('') + '</div></div>' : '');
  $('#busca').addEventListener('input', e => { BUSCA = e.target.value; $('#hits').innerHTML = hitsHTML(); $('#grade').hidden = !!BUSCA.trim(); const f = $('#fontes'); if (f) f.hidden = !!BUSCA.trim(); });
}
function abrirMateria(mid){ if (!MAT[mid]) return; LEITOR = mid; ABA = 'materias'; aba('materias'); }
function abrirTopico(tid){
  const t = TOP[tid]; if (!t) return;
  if (ABA !== 'materias' || LEITOR !== t.mat) { LEITOR = t.mat; ABA = 'materias'; LEITOR_ALVO = tid; aba('materias'); }
  else { const el = document.getElementById(tid); if (el) el.scrollIntoView({block: 'start'}); }
}
let LEITOR_ALVO = null;
const APO_ICO = {
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m9 12 2 2 4-4" stroke-linecap="round"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.01" stroke-linecap="round"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/></svg>'
};
function rLeitor(){
  const m = MAT[LEITOR], s = stats(), st = s.pm[m.id], dom = m.tops.filter(t => D.dom[t.id]).length;
  const nq = BANCO.filter(q => q.mat === m.id).length;
  const tact = t => '<div class="tact"><span class="lab">Tópico ' + esc(t.n) + '</span><button class="domb" data-dom="' + t.id + '" aria-pressed="' + (D.dom[t.id] ? 'true' : 'false') + '"><span class="ck">✓</span><span>' + (D.dom[t.id] ? 'Dominado' : 'Dominei') + '</span></button>' + (nq ? '<button class="btn ghost sm" data-praticar="' + m.id + '">' + ic('target') + 'Questões de ' + esc(m.nomeCurto) + '</button>' : '') + '</div>';
  $('#main').innerHTML = mtop() + '<div><button class="btn ghost sm" data-tab="materias" id="voltar-mat">' + ic('back') + 'Matérias</button></div>' +
    '<div class="leitor-hd"><div class="kick">Apostila · ' + m.q + ' questões na prova · mínimo ' + m.min + '</div><h1>' + m.h1 + '</h1><p class="lede">' + esc(m.lede) + '</p>' +
    '<div class="tagrow"><span class="tg">' + ic('book') + dom + '/' + m.tops.length + ' tópicos dominados</span><span class="tg">' + ic('target') + (st.tot ? pct(st.ok, st.tot) + '% de acerto' : 'sem questões feitas') + '</span>' + (nq ? '<button class="btn gold sm" data-praticar="' + m.id + '">' + ic('play') + 'Simulado desta matéria</button>' : '') + '</div>' +
    '<div class="chips">' + (m.links || []).map(l => '<a class="chip" href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + ic('link') + esc(l[0]) + '</a>').join('') + '</div></div>' +
    '<div class="pnl"><div class="ph2"><h3>' + ic('list') + 'Índice</h3><span class="hint">toque para ir ao tópico</span></div><div class="chips">' + m.tops.map(t => '<button class="chip' + (D.dom[t.id] ? ' ok' : '') + '" data-ir="' + t.id + '">' + esc(t.n) + ' · ' + esc(t.nome) + '</button>').join('') + '<button class="chip" data-ir="rev-' + m.id + '">Revisão em 1 minuto</button><button class="chip" data-ir="quiz-' + m.id + '">Mini-teste</button></div></div>' +
    '<div class="apost">' + m.tops.map(t => t.html + tact(t)).join('') +
      '<section class="topic" id="rev-' + m.id + '"><div class="sec-title"><h2>Revisão em 1 minuto</h2><span class="ln"></span></div><video class="vrev" controls playsinline preload="metadata" src="videos/revisao-' + m.id + '.mp4" onerror="this.hidden=true" aria-label="Vídeo de revisão de ' + esc(m.nome) + '"></video><p class="note">Responda de cabeça e toque no cartão para conferir.</p><div class="fcs">' + (m.rev || []).map((r, i) => '<button class="fcx" data-fc="' + i + '" aria-pressed="false"><span class="k">Tema ' + (i + 1) + '</span><span>' + esc(r[0]) + '</span><span class="h">Toque para ver a resposta</span></button>').join('') + '</div></section>' +
      '<section class="topic" id="quiz-' + m.id + '"><div class="sec-title"><h2>Mini-teste</h2><span class="ln"></span></div><div class="mis">' + (m.quiz || []).map((q, i) => '<div class="mq"><p>' + esc(q[0]) + '</p><div><button class="btn ghost sm" data-mq="' + i + '">Ver resposta</button></div><p class="ans" id="mq-' + i + '" hidden>' + esc(q[1]) + '</p></div>').join('') + '</div></section></div>';
  document.querySelectorAll('#main [data-ico]').forEach(el => { if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', APO_ICO[el.dataset.ico] || ''); });
  $('#voltar-mat').addEventListener('click', e => { e.stopPropagation(); LEITOR = null; aba('materias'); });
  document.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => { const el = document.getElementById(b.dataset.ir); if (el) el.scrollIntoView({block: 'start'}); }));
  document.querySelectorAll('[data-dom]').forEach(b => b.addEventListener('click', () => {
    const tid = b.dataset.dom;
    if (D.dom[tid]) { delete D.dom[tid]; delete D.revs[tid]; } else { D.dom[tid] = hoje(); D.revs[tid] = []; toast('Tópico dominado. O painel avisa quando revisar (1, 7 e 30 dias).'); }
    salvar(); const on = !!D.dom[tid]; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.lastChild.textContent = on ? 'Dominado' : 'Dominei';
    document.querySelectorAll('[data-ir="' + tid + '"]').forEach(c => c.classList.toggle('ok', on));
  }));
  document.querySelectorAll('[data-fc]').forEach(b => b.addEventListener('click', () => { const r = m.rev[+b.dataset.fc], on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.innerHTML = '<span class="k">Tema ' + (+b.dataset.fc + 1) + '</span><span>' + esc(r[0]) + '</span>' + (on ? '<span class="a">' + esc(r[1]) + '</span>' : '') + '<span class="h">' + (on ? 'Toque para esconder' : 'Toque para ver a resposta') + '</span>'; }));
  document.querySelectorAll('[data-mq]').forEach(b => b.addEventListener('click', () => { const a = $('#mq-' + b.dataset.mq); a.hidden = !a.hidden; b.textContent = a.hidden ? 'Ver resposta' : 'Esconder resposta'; }));
  if (LEITOR_ALVO) { const alvo = LEITOR_ALVO; LEITOR_ALVO = null; setTimeout(() => { const el = document.getElementById(alvo); if (el) el.scrollIntoView({block: 'start'}); }, 30); }
}

/* ---- simulado ---- */
function praticar(alvo){
  if (!BANCO.length) { toast('O banco de questões ainda não carregou.'); return; }
  SIM = null;
  if (alvo === 'real2026') {
    const qs = BANCO.filter(q => q.origem === 'prova-2026');
    if (!qs.length) return toast('A prova de 2026 não está no banco.');
    SIM = {qs, resp: qs.map(() => null), i: 0, ini: Date.now(), fim: null, nome: 'Prova CTSP 2026 (real)', modo: 'final', prova: true, confirmar: false};
    ABA = 'simulado'; document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === 'simulado'));
    rQuestao(); scrollTo(0, 0); return;
  }
  if (alvo === 'rapido') { SCFG.mat = 'todas'; SCFG.nivel = '0'; SCFG.qtd = 10; SCFG.modo = 'imediato'; return iniciar(); }
  if (alvo === 'prova') { SCFG.mat = 'prova'; SCFG.nivel = '0'; SCFG.modo = 'final'; return iniciar(); }
  if (alvo === 'fraca') { const f = stats().fraca; SCFG.mat = f.id; SCFG.nivel = '0'; SCFG.qtd = 10; SCFG.modo = 'imediato'; return iniciar(); }
  if (MAT[alvo]) { SCFG.mat = alvo; SCFG.nivel = '0'; SCFG.qtd = 10; SCFG.modo = 'imediato'; }
  aba('simulado');
}
function rSimulado(){
  if (SIM) { if (!SIM.fim) return rQuestao(); SIM = null; }
  const opts = '<option value="todas">Todas as matérias</option>' + MATS.map(m => '<option value="' + m.id + '"' + (SCFG.mat === m.id ? ' selected' : '') + '>' + esc(m.nomeCurto) + '</option>').join('') + '<option value="prova"' + (SCFG.mat === 'prova' ? ' selected' : '') + '>Prova completa (60 questões)</option>';
  const prova = SCFG.mat === 'prova';
  const fraca = stats().fraca;
  $('#main').innerHTML = mtop() + '<div class="pnl"><div class="ph2"><h3>' + ic('target') + 'Simulado</h3><span class="hint">' + BANCO.length + ' questões no banco</span></div>' +
    '<div class="atalhos"><button class="nivc" data-praticar="rapido"><b>Rápido</b><span>10 questões mistas, corrige na hora</span></button>' +
    '<button class="nivc" data-praticar="fraca"><b>Matéria mais fraca</b><span>10 questões de ' + esc(fraca.nomeCurto) + '</span></button>' +
    '<button class="nivc" data-praticar="prova"><b>Prova completa</b><span>60 questões, 4 horas</span></button></div>' +
    '<details class="pers"' + (SCFG.aberto ? ' open' : '') + '><summary>Personalizar (matéria, quantidade, nível)</summary><div>' +
    '<div class="cfg"><div class="field"><label for="s-mat">Matéria</label><div class="inp">' + ic('book') + '<select id="s-mat">' + opts + '</select></div></div>' +
    '<div class="field"><label for="s-qtd">Quantidade</label><div class="inp">' + ic('list') + '<select id="s-qtd"' + (prova ? ' disabled' : '') + '>' + [5, 10, 20, 30].map(n => '<option' + (SCFG.qtd === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select></div></div>' +
    '<p class="hint" id="s-disp" style="grid-column:1/-1;margin:0"></p></div>' +
    '<div class="niv">' + ['1', '2', '3'].map(n => '<button class="nivc' + (SCFG.nivel === n ? ' on' : '') + '" data-niv="' + n + '"><b>' + NIV[n][0] + '</b><span>' + NIV[n][1] + '</span></button>').join('') + '</div>' +
    '<button class="nivc' + (SCFG.nivel === '0' ? ' on' : '') + '" data-niv="0" style="flex-direction:row;align-items:center;gap:10px"><b style="font-size:14px">Misturar níveis</b><span>recomendado</span></button>' +
    '<div class="modo"><button class="nivc' + (SCFG.modo === 'imediato' && !prova ? ' on' : '') + '" data-modo="imediato"' + (prova ? ' disabled' : '') + '><b style="font-size:14px">Corrigir a cada questão</b><span>Vê a explicação na hora</span></button><button class="nivc' + (SCFG.modo === 'final' || prova ? ' on' : '') + '" data-modo="final"><b style="font-size:14px">Corrigir no final</b><span>' + (prova ? 'Como na prova: 4 horas' : 'Treina o ritmo da prova') + '</span></button></div>' +
    '<button class="btn gold" id="s-go">' + ic('play') + 'Começar simulado</button></div></details>' + (D.erros.length ? '<button class="btn ghost" data-tab="erros">' + ic('repeat') + 'Refazer o caderno de erros (' + D.erros.length + ')</button>' : '') + '</div>';
  const disp = () => {
    SCFG.mat = $('#s-mat').value; if (SCFG.mat !== 'prova') SCFG.qtd = +$('#s-qtd').value;
    let n, novas;
    if (SCFG.mat === 'prova') { n = ORDEM.reduce((a, m) => a + Math.min(MAT[m].q, pool({mat: m, nivel: SCFG.nivel}).length), 0); novas = BANCO.filter(q => !D.vistas[q.id]).length; }
    else { const p = pool(SCFG); n = p.length; novas = p.filter(q => !D.vistas[q.id]).length; }
    $('#s-disp').textContent = n + ' questões · ' + novas + ' novas para você'; $('#s-go').disabled = !n;
  };
  $('#s-mat').onchange = () => { SCFG.mat = $('#s-mat').value; rSimulado(); };
  $('#s-qtd').onchange = disp; disp();
  document.querySelectorAll('[data-niv]').forEach(b => { b.onclick = () => { SCFG.nivel = b.dataset.niv; rSimulado(); }; });
  document.querySelectorAll('[data-modo]').forEach(b => { b.onclick = () => { SCFG.modo = b.dataset.modo; rSimulado(); }; });
  $('#s-go').onclick = iniciar;
  $('details.pers').ontoggle = e => { SCFG.aberto = e.target.open; };
}
function iniciar(){
  let qs, nome, modo = SCFG.modo, prova = false;
  if (SCFG.mat === 'prova') {
    prova = true; modo = 'final';
    qs = ORDEM.flatMap(m => escolher(pool({mat: m, nivel: SCFG.nivel}), MAT[m].q));
    nome = 'Prova completa' + (SCFG.nivel !== '0' ? ' · N' + SCFG.nivel : '');
  } else {
    qs = escolher(pool(SCFG), SCFG.qtd);
    nome = (SCFG.mat === 'todas' ? 'Geral' : MAT[SCFG.mat].nomeCurto) + (SCFG.nivel !== '0' ? ' · N' + SCFG.nivel : '');
  }
  if (!qs.length) return toast('Não há questões com esses filtros.');
  qs = qs.map(embaralhar);
  SIM = {qs, resp: qs.map(() => null), i: 0, ini: Date.now(), fim: null, nome, modo, prova, confirmar: false};
  ABA = 'simulado'; document.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === 'simulado'));
  rQuestao(); scrollTo(0, 0);
}
function relogio(){ if (!SIM) return ''; const el = (Date.now() - SIM.ini) / 1000; return SIM.prova ? 'Restam ' + tempo(4 * 3600 - el) : tempo(el); }
function rQuestao(){
  const q = SIM.qs[SIM.i], r = SIM.resp[SIM.i], imediato = SIM.modo === 'imediato', trav = imediato && r != null, ult = SIM.i === SIM.qs.length - 1;
  $('#main').innerHTML = mtop() + '<div class="pnl"><div class="qhead"><div class="qnum">Questão ' + (SIM.i + 1) + ' <small>de ' + SIM.qs.length + '</small></div><div class="tagrow"><span class="tg">' + ic('book') + esc(MAT[q.mat].nomeCurto) + '</span><span class="tg">' + ic('target') + 'Nível ' + q.nivel + '</span><span class="relogio" id="relogio">' + relogio() + '</span></div></div>' +
    '<div class="prog"><i style="width:' + pct(SIM.resp.filter(x => x != null).length, SIM.qs.length) + '%"></i></div><div class="enun">' + esc(q.enunciado) + '</div><div class="opts">' +
    q.alternativas.map((a, k) => '<button class="opt' + (trav && k === q.correta ? ' certa' : '') + (trav && k === r && r !== q.correta ? ' errada' : '') + (!imediato && r === k ? ' marcada' : '') + '" data-k="' + k + '"' + (trav ? ' disabled' : '') + ' aria-pressed="' + (r === k) + '"><span class="bub">' + L[k] + '</span><span>' + esc(a) + '</span></button>').join('') + '</div>' +
    (trav ? '<div class="fb ' + (r === q.correta ? 'okk' : 'no') + '"><h4>' + (r === q.correta ? 'Correta!' : 'Resposta certa: ' + L[q.correta]) + '</h4><div>' + esc(q.explicacao) + '</div>' + (q.fundamento ? '<div class="fund">' + esc(q.fundamento) + '</div>' : '') + '</div>' : '') +
    '<div class="qnav"><button class="btn ghost" id="q-ant"' + (SIM.i === 0 ? ' disabled' : '') + '>' + ic('back') + 'Anterior</button>' +
      (imediato ? '<button class="btn gold" id="q-next"' + (r != null ? '' : ' disabled') + '>' + (!ult ? 'Próxima' : 'Ver resultado') + ic('arrow') + '</button>' : '<button class="btn gold" id="q-next">' + (!ult ? 'Próxima' + ic('arrow') : 'Entregar' + ic('check')) + '</button>') + '</div>' +
    (SIM.confirmar ? '<div class="err">' + ic('alert') + '<span>' + SIM.resp.filter(x => x == null).length + ' questão(ões) em branco contam como erro. <button class="link" id="q-sim">Entregar mesmo assim</button> · <button class="link" id="q-nao">Voltar</button></span></div>' : '') +
    (!imediato ? '<div class="ph2"><span class="hint">Cartão-resposta</span><button class="link" id="q-entregar">Entregar agora</button></div><div class="cartao">' + SIM.qs.map((x, k) => '<button class="cel' + (SIM.resp[k] != null ? ' resp' : '') + (k === SIM.i ? ' atual' : '') + '" data-cel="' + k + '">' + (k + 1) + (SIM.resp[k] != null ? L[SIM.resp[k]] : '') + '</button>').join('') + '</div>' : '') +
    '<div><button class="link" id="q-sair">Encerrar e ver o resultado do que fiz</button></div></div>';
  if (!imediato) document.querySelectorAll('.opt.marcada').forEach(b => { b.style.borderColor = 'var(--gold)'; b.style.background = 'var(--goldA)'; b.querySelector('.bub').style.cssText = 'background:var(--gold);border-color:var(--gold);color:var(--onGold)'; });
  document.querySelectorAll('.opt').forEach(b => { b.onclick = () => { const k = +b.dataset.k; SIM.resp[SIM.i] = (!imediato && SIM.resp[SIM.i] === k) ? null : k; SIM.confirmar = false; rQuestao(); }; });
  $('#q-ant').onclick = () => { SIM.i = Math.max(0, SIM.i - 1); SIM.confirmar = false; rQuestao(); scrollTo(0, 0); };
  $('#q-next').onclick = () => { if (!ult) { SIM.i++; SIM.confirmar = false; rQuestao(); scrollTo(0, 0); } else entregar(); };
  const en = $('#q-entregar'); if (en) en.onclick = entregar;
  const qs = $('#q-sim'); if (qs) qs.onclick = finalizar;
  const qn = $('#q-nao'); if (qn) qn.onclick = () => { SIM.confirmar = false; rQuestao(); };
  document.querySelectorAll('[data-cel]').forEach(b => { b.onclick = () => { SIM.i = +b.dataset.cel; SIM.confirmar = false; rQuestao(); }; });
  $('#q-sair').onclick = () => { if (SIM.resp.some(x => x != null)) finalizar(); else { SIM = null; aba('simulado'); } };
}
function entregar(){ if (SIM.modo === 'final' && SIM.resp.some(x => x == null)) { SIM.confirmar = true; rQuestao(); } else finalizar(); }
setInterval(() => { const el = document.getElementById('relogio'); if (el && SIM && !SIM.fim) { el.textContent = relogio(); if (SIM.prova) { const s = (Date.now() - SIM.ini) / 1000; el.classList.toggle('warn', s > 3.75 * 3600); if (s >= 4 * 3600) finalizar(); } } }, 1000);
function finalizar(){
  if (!SIM || SIM.fim) return;
  const respondidas = SIM.modo === 'final' ? SIM.qs.map((q, i) => [q, SIM.resp[i]]) : SIM.qs.map((q, i) => [q, SIM.resp[i]]).filter(([, r]) => r != null);
  const ok = respondidas.filter(([q, r]) => r === q.correta).length, por = {};
  respondidas.forEach(([q, r]) => {
    const p = por[q.mat] || (por[q.mat] = [q.mat, 0, 0]); p[2]++;
    D.vistas[q.id] = (D.vistas[q.id] || 0) + 1;
    const ie = D.erros.findIndex(e => e.id === q.id);
    if (r === q.correta) { p[1]++; if (ie >= 0) D.erros.splice(ie, 1); }
    else if (ie >= 0) { D.erros[ie].vezes = (D.erros[ie].vezes || 1) + 1; D.erros[ie].d = hoje(); D.erros[ie].resp = r; }
    else D.erros.unshift({id: q.id, resp: r, d: hoje(), vezes: 1});
  });
  if (D.erros.length > 300) D.erros.length = 300;
  const seg = Math.round((Date.now() - SIM.ini) / 1000);
  D.sims.unshift({d: hoje(), nome: SIM.nome, ok, tot: respondidas.length, seg, porMat: Object.values(por), prova: SIM.prova || undefined});
  if (D.sims.length > 150) D.sims.length = 150;
  const dd = D.estudo[hoje()] || (D.estudo[hoje()] = {}); dd.sim = (dd.sim || 0) + Math.round(seg / 60);
  SIM.fim = {ok, tot: respondidas.length, por}; salvar(); gravar(); rResultado();
}
function rResultado(){
  const {ok, tot, por} = SIM.fim, a = pct(ok, tot), nota = tot ? Math.round(ok * 60 / tot) : 0;
  const min = m => MAT[m] ? MAT[m].min : 1;
  const tabela = SIM.prova ? '<div class="tw"><table class="tbl-mat"><tr><th>Matéria</th><th>Acertos</th><th>Mínimo</th></tr>' + ORDEM.map(m => { const p = por[m] || [m, 0, 0]; return '<tr><td><b>' + esc(MAT[m].nomeCurto) + '</b></td><td>' + p[1] + '/' + p[2] + '</td><td style="color:var(--' + (p[1] >= min(m) ? 'green' : 'red') + ')">' + min(m) + '</td></tr>'; }).join('') + '</table></div>' +
    '<p style="margin:0;color:var(--ink2)">' + (ok >= 42 && ORDEM.every(m => (por[m] || [0, 0])[1] >= min(m)) ? 'Aprovada no mínimo do edital (42 pontos e mínimo por matéria). ' : 'Abaixo do mínimo do edital (42 pontos e mínimo por matéria). ') + (ok >= 52 ? 'Acima da nota de corte de 2026 (52).' : 'A nota de corte de 2026 foi 52.') + '</p>' : '';
  const erradas = SIM.qs.map((q, i) => [q, SIM.resp[i]]).filter(([q, r]) => (r != null || SIM.modo === 'final') && r !== q.correta);
  $('#main').innerHTML = mtop() + '<div class="pnl"><div class="ph2"><h3>' + ic('medal') + 'Resultado · ' + esc(SIM.nome) + '</h3><span class="hint">' + tempo((Date.now() - SIM.ini) / 1000) + '</span></div><div class="score"><div class="big">' + ok + '<small>/' + tot + '</small></div><b style="font:700 24px var(--fm);color:var(--' + (a >= 80 ? 'green' : 'red') + ')">' + a + '%</b>' + (!SIM.prova && tot ? '<span class="hint">equivale a ' + nota + ' de 60</span>' : '') + '</div>' +
    '<p style="margin:0;color:var(--ink2)">' + (a >= 90 ? 'Nível de aprovação, ' + esc(tituloDe(ME)) + '. Mantenha o ritmo.' : a >= 75 ? 'Bom resultado, ' + esc(tituloDe(ME)) + '. Revise os erros para chegar aos 90%.' : 'Vamos reforçar a base, ' + esc(tituloDe(ME)) + '. As questões erradas foram para o caderno de erros.') + '</p>' + tabela +
    (erradas.length ? '<button class="btn gold" id="r-rev">' + ic('alert') + 'Revisar meus ' + erradas.length + ' erros agora</button>' : '') +
    '<div class="row2"><button class="btn ' + (erradas.length ? 'ghost' : 'gold') + '" id="r-novo">' + ic('repeat') + 'Novo simulado</button><button class="btn ghost" data-tab="painel">' + ic('home') + 'Voltar ao painel</button></div></div>' +
    (erradas.length ? '<div class="pnl" id="r-erros"><div class="ph2"><h3>' + ic('list') + 'Correção dos erros</h3></div>' + erradas.map(([q, r]) => revQ(q, r)).join('') + '</div>' : '');
  $('#r-novo').onclick = () => { SIM = null; aba('simulado'); };
  const rv = $('#r-rev'); if (rv) rv.onclick = () => { const d = document.querySelector('#r-erros details'); d.open = true; d.scrollIntoView({behavior: 'smooth', block: 'start'}); };
}
function revQ(q, r, extra){
  return '<details class="rev"><summary><span class="mk no">' + esc(MAT[q.mat].nomeCurto) + '</span><span class="s">' + esc(q.enunciado.slice(0, 120)) + '</span></summary><div class="body"><div class="enun" style="font-size:15px">' + esc(q.enunciado) + '</div><div>' +
    q.alternativas.map((a, k) => '<div class="alt' + (k === q.correta ? ' certa' : (k === r ? ' errada' : '')) + '"><span class="l">' + L[k] + '</span><span>' + esc(a) + '</span><span class="t">' + (k === q.correta ? 'gabarito' : (k === r ? 'sua resposta' : '')) + '</span></div>').join('') + '</div>' +
    '<div class="fb no"><div>' + esc(q.explicacao) + '</div>' + (q.fundamento ? '<div class="fund">' + esc(q.fundamento) + '</div>' : '') + '</div>' + (extra || '') + '</div></details>';
}

/* ---- caderno de erros ---- */
function rErros(){
  const lista = D.erros.filter(e => QID[e.id]);
  $('#main').innerHTML = mtop() + '<div class="pnl"><div class="ph2"><h3>' + ic('alert') + 'Caderno de erros</h3>' + (lista.length ? '<button class="btn gold sm" id="e-refazer">' + ic('repeat') + 'Refazer ' + Math.min(20, lista.length) + '</button>' : '') + '</div>' +
    '<p style="margin:0;color:var(--ink2)">Toda questão que você erra fica aqui e sai quando você acerta ao refazer. As alternativas mudam de posição a cada vez.</p>' +
    (lista.length ? lista.map(e => revQ(QID[e.id], e.resp, '<div class="chips"><span class="badge r">errada ' + (e.vezes || 1) + 'x · ' + dm(e.d) + '</span><button class="link" data-rm="' + esc(e.id) + '">Já aprendi, tirar do caderno</button></div>')).join('') : '<div class="empty">Nenhum erro guardado. As questões que você errar nos simulados aparecem aqui.</div>') + '</div>';
  document.querySelectorAll('[data-rm]').forEach(b => { b.onclick = () => { const i = D.erros.findIndex(e => e.id === b.dataset.rm); if (i >= 0) D.erros.splice(i, 1); salvar(); aba('erros'); }; });
  const rf = $('#e-refazer'); if (rf) rf.onclick = () => { const qs = shuffle(lista.slice()).slice(0, 20).map(e => embaralhar(QID[e.id])); SIM = {qs, resp: qs.map(() => null), i: 0, ini: Date.now(), fim: null, nome: 'Caderno de erros', modo: 'imediato', prova: false}; ABA = 'simulado'; rQuestao(); scrollTo(0, 0); };
}

/* ---- perfil ---- */
function rPerfil(){
  $('#main').innerHTML = mtop() + '<form class="pnl" id="f-perfil" novalidate><div class="ph2"><h3>' + ic('user') + 'Meu perfil</h3><span class="hint">Usuário: ' + esc(ME.usuario) + (ME.papel === 'admin' ? ' · administradora' : '') + '</span></div><div id="p-msg"></div>' +
    '<div class="avup"><button type="button" class="avatar" data-foto style="width:88px;height:88px;border-radius:22px" aria-label="Trocar foto de perfil">' + avatarIn(ME.foto) + '</button><div style="min-width:0"><b>' + esc(tituloDe(ME)) + '</b><div class="hint">Toque na foto para trocar: galeria, arquivos ou câmera.</div></div></div>' +
    '<div class="field"><label for="p-nome">Nome completo</label><div class="inp">' + ic('id') + '<input id="p-nome" autocomplete="name" value="' + esc(ME.nome || '') + '"></div></div>' +
    '<div class="field"><label for="p-guerra">Nome de guerra</label><div class="inp">' + ic('medal') + '<span class="fixo">SD PM</span><input id="p-guerra" value="' + esc(ME.guerra || '') + '"></div></div>' +
    '<div class="row2"><div class="field"><label for="p-btl">Batalhão / unidade</label>' + comboHTML('p-btl', 'btl', ME.btl, 'shield', 'Toque ou digite o número') + '</div><div class="field"><label for="p-crbm">Região (CRBM)</label>' + comboHTML('p-crbm', 'crbm', ME.crbm, 'map', 'Toque ou digite a região') + '</div></div>' +
    '<div class="row2"><div class="field"><label>Identidade funcional</label><div class="inp">' + ic('id') + '<input value="' + esc(ME.idf || '') + '" disabled></div><span class="hint">' + (ME.papel === 'admin' ? 'Altere pela tela de alunos.' : 'Só a administradora altera.') + '</span></div><div class="field"><label for="p-incl">Data de inclusão</label><div class="inp">' + ic('cal') + '<input id="p-incl" type="date" value="' + esc(ME.incl || '') + '"></div><span class="hint">Usada para calcular os 5 anos de serviço.</span></div></div>' +
    '<div class="row2"><div class="field"><label for="p-pass">Nova senha (opcional)</label><div class="inp">' + ic('lock') + '<input id="p-pass" type="password" autocomplete="new-password" placeholder="deixe em branco para manter"></div></div><div class="field"><label for="p-pass2">Repita a nova senha</label><div class="inp">' + ic('lock') + '<input id="p-pass2" type="password" autocomplete="new-password"></div></div></div>' +
    '<button class="btn gold" type="submit" id="p-btn">' + ic('check') + 'Salvar perfil</button></form>';
  ligarCombos($('#f-perfil'));
  $('#f-perfil').onsubmit = async e => {
    e.preventDefault();
    const n = $('#p-nome').value.trim(), g = $('#p-guerra').value.trim(), b = $('#p-btl').value.trim(), r = $('#p-crbm').value.trim(), p = $('#p-pass').value;
    if (!n || !g) return msg('#p-msg', 'err', 'Nome completo e nome de guerra não podem ficar vazios.');
    if (r && !valido('crbm', r)) return msg('#p-msg', 'err', 'Escolha a região (CRBM) na lista.');
    if (p && p.length < 6) return msg('#p-msg', 'err', 'A nova senha precisa ter pelo menos 6 caracteres.');
    if (p && p !== $('#p-pass2').value) return msg('#p-msg', 'err', 'As senhas não conferem.');
    const btn = $('#p-btn'); ocupado(btn, true, 'Salvando');
    try {
      const campos = {nome: n, guerra: g, btl: b, crbm: r, incl: $('#p-incl').value || null};
      await API.salvarPerfil(ME.id, campos); Object.assign(ME, campos);
      if (p) await API.trocarSenha(p);
      pintarMe(); rPerfil(); msg('#p-msg', 'ok', 'Perfil salvo, ' + esc(tituloDe(ME)) + '.' + (p ? ' Senha trocada.' : ''));
    } catch (er) { msg('#p-msg', 'err', erroTexto(er)); ocupado(btn, false); }
  };
}

/* ---- administradora: alunos ---- */
let ALUNOS = [], ADM_SENHA = null, ADM_CONF = null, ADM_VER = null;
const senhaProvisoria = () => { const a = 'abcdefghjkmnpqrstuvwxyz23456789', r = crypto.getRandomValues(new Uint32Array(6)); return 'ctsp-' + Array.from(r, n => a[n % a.length]).join(''); };
async function rAlunos(){
  $('#main').innerHTML = mtop() + '<div class="pnl"><span>Carregando alunos<span class="dots"></span></span></div>';
  try { ALUNOS = await API.listarAlunos(); } catch (e) { $('#main').innerHTML = mtop() + '<div class="err">' + ic('alert') + '<span>' + erroTexto(e) + '</span></div>'; return; }
  pintarAlunos();
}
function resumo(u){ const d = normDados(u.dados); let ok = 0, tot = 0; const pm = {}; d.sims.forEach(s => { ok += s.ok; tot += s.tot; (s.porMat || []).forEach(([m, a, t]) => { pm[m] = pm[m] || [0, 0]; pm[m][0] += a; pm[m][1] += t; }); }); return {d, ok, tot, pm, dom: Object.keys(d.dom).filter(k => TOP[k]).length, hoje: d.sims.some(s => s.d === hoje())}; }
function pintarAlunos(){
  const us = ALUNOS, rs = us.map(resumo);
  let ok = 0, tot = 0; rs.forEach(r => { ok += r.ok; tot += r.tot; });
  const fmt = iso => { if (!iso) return 'nunca'; const d = new Date(iso); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}); };
  $('#main').innerHTML = mtop() +
    '<div class="greet" style="padding:24px"><div class="k">Painel da administradora</div><h1 style="font-size:clamp(24px,3vw,32px)">Alunos do grupo</h1><p>Crie acessos, bloqueie, redefina senhas e acompanhe o desempenho de cada colega.</p></div>' +
    '<div class="kpis">' + kpi('gold', 'users', us.length, 'contas no portal') + kpi('green', 'flame', rs.filter(r => r.hoje).length, 'estudaram hoje') + kpi('blue', 'target', tot ? pct(ok, tot) + '%' : '—', 'acerto médio') + kpi('red', 'lock', us.filter(u => !u.ativo).length, 'contas bloqueadas') + '</div>' +
    (ADM_SENHA ? '<div class="ok">' + ic('key') + '<span>Acesso de <b>' + esc(ADM_SENHA[0]) + '</b>: usuário <b class="senha-box">' + esc(ADM_SENHA[0]) + '</b> e senha provisória <b class="senha-box">' + esc(ADM_SENHA[1]) + '</b>. Passe ao colega com o link do site; no primeiro login ele cria a senha dele.</span></div>' : '') +
    '<div class="pnl"><div class="ph2"><h3>' + ic('users') + 'Alunos</h3><div class="act"><button class="btn ghost sm" id="ad-backup">' + ic('list') + 'Cópia de segurança</button><button class="btn ghost sm" id="ad-atual">' + ic('repeat') + 'Atualizar</button><button class="btn gold sm" id="ad-novo">' + ic('plus') + 'Novo aluno</button></div></div>' +
    (us.length ? '<div class="tw"><table><tr><th>Aluno</th><th>Unidade</th><th>Último acesso</th><th>Acerto</th><th>Tópicos</th><th>Situação</th><th>Ações</th></tr>' +
      us.map((u, i) => { const r = rs[i], eu = u.id === ME.id;
        return '<tr><td><div class="who">' + avatarMini(u) + '<div><b>' + esc(abrevDe(u)) + '</b><br><small style="color:var(--mut)">' + esc(u.usuario) + (u.idf ? ' · ' + esc(u.idf) : '') + (u.papel === 'admin' ? ' · admin' : '') + '</small></div></div></td><td>' + esc(u.btl || '—') + (u.crbm ? ' · ' + esc(u.crbm) : '') + '</td><td>' + fmt(u.ultimo_acesso) + '</td><td>' + (r.tot ? pct(r.ok, r.tot) + '% <small style="color:var(--mut)">(' + r.d.sims.length + ' sim.)</small>' : '—') + '</td><td>' + r.dom + '/' + Object.keys(TOP).length + '</td><td><span class="pill ' + (u.ativo ? 'ok">ativo' : 'off">bloqueado') + '</span>' + (u.senha_provisoria ? ' <span class="pill" style="background:var(--goldA);color:var(--gold)">senha provisória</span>' : '') + '</td><td>' +
          (ADM_CONF === u.id ? '<div class="confirm">Excluir de vez? <button class="btn danger sm" data-del="' + u.id + '">Excluir</button><button class="btn ghost sm" data-cancel>Cancelar</button></div>' :
          '<div class="act"><button class="ib" data-ver="' + u.id + '" title="Ver desempenho">' + ic('eye') + '</button>' + (eu ? '' : '<button class="ib" data-blq="' + u.id + '" title="' + (u.ativo ? 'Bloquear' : 'Desbloquear') + '">' + ic(u.ativo ? 'ban' : 'check') + '</button><button class="ib" data-rst="' + u.id + '" title="Redefinir senha">' + ic('key') + '</button><button class="ib del" data-cdel="' + u.id + '" title="Excluir">' + ic('trash') + '</button>') + '</div>') + '</td></tr>' +
          (ADM_VER === u.id ? '<tr><td colspan="7">' + detalheAluno(u, r) + '</td></tr>' : ''); }).join('') + '</table></div>'
      : '<div class="empty">Nenhum aluno ainda. Use "Novo aluno".</div>') + '</div>';
  const at = (sel, fn) => document.querySelectorAll(sel).forEach(b => { b.onclick = () => fn(b); });
  const achar = id => ALUNOS.find(u => u.id === id);
  at('[data-ver]', b => { ADM_VER = ADM_VER === b.dataset.ver ? null : b.dataset.ver; pintarAlunos(); });
  at('[data-blq]', async b => { const u = achar(b.dataset.blq); try { await API.atualizarAluno(u.id, {ativo: !u.ativo}); u.ativo = !u.ativo; toast(abrevDe(u) + (u.ativo ? ' desbloqueado.' : ' bloqueado.')); pintarAlunos(); } catch (e) { toast(erroTexto(e).replace(/<[^>]+>/g, '')); } });
  at('[data-rst]', async b => { const u = achar(b.dataset.rst), p = senhaProvisoria(); try { await API.redefinirSenha(u.id, p); u.senha_provisoria = true; ADM_SENHA = [u.usuario, p]; pintarAlunos(); scrollTo(0, 0); } catch (e) { toast(erroTexto(e).replace(/<[^>]+>/g, '')); } });
  at('[data-cdel]', b => { ADM_CONF = b.dataset.cdel; pintarAlunos(); });
  at('[data-cancel]', () => { ADM_CONF = null; pintarAlunos(); });
  at('[data-del]', async b => { const u = achar(b.dataset.del); try { await API.excluirAluno(u.id); ALUNOS = ALUNOS.filter(x => x.id !== u.id); ADM_CONF = null; toast(abrevDe(u) + ' excluído.'); pintarAlunos(); } catch (e) { toast(erroTexto(e).replace(/<[^>]+>/g, '')); } });
  $('#ad-novo').onclick = novoAluno;
  $('#ad-atual').onclick = () => { ADM_SENHA = null; rAlunos(); };
  $('#ad-backup').onclick = () => {
    const dados = {gerado_em: new Date().toISOString(), site: location.href, alunos: ALUNOS.map(u => Object.assign({}, u))};
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 1)], {type: 'application/json'}));
    a.download = 'ctsp-backup-' + hoje() + '.json'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Cópia de segurança baixada: perfis e progresso de todos.');
  };
}
function detalheAluno(u, r){
  return '<div class="det"><b>' + esc(tituloDe(u)) + '</b>' + (u.nome ? '<span class="hint">' + esc(u.nome) + '</span>' : '') +
    MATS.map(m => { const p = r.pm[m.id] || [0, 0], a = pct(p[0], p[1]); return '<div class="mbar"><span>' + esc(m.nomeCurto) + '</span><span>' + (p[1] ? a + '% · ' + p[1] + ' questões' : 'sem questões') + '</span><div class="bar' + (p[1] && a < 75 ? ' red' : '') + '"><i style="width:' + (p[1] ? a : 0) + '%"></i></div></div>'; }).join('') +
    '<div class="hist">' + (r.d.sims.slice(0, 5).map(x => '<div class="hrow"><b>' + esc(x.nome) + '</b><span class="n">' + x.ok + '/' + x.tot + '</span><span class="hint">' + dm(x.d) + '</span></div>').join('') || '<div class="empty">Nenhum simulado ainda.</div>') + '</div></div>';
}
function novoAluno(){
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = '<form class="box" id="f-novo" novalidate><div class="kick">Administração</div><h2 style="font-size:24px">Novo aluno</h2><div id="n-msg"></div>' +
    '<div class="field"><label for="n-nome">Nome completo</label><div class="inp">' + ic('id') + '<input id="n-nome"></div></div>' +
    '<div class="row2"><div class="field"><label for="n-guerra">Nome de guerra</label><div class="inp">' + ic('medal') + '<span class="fixo">SD PM</span><input id="n-guerra"></div></div><div class="field"><label for="n-idf">Identidade funcional</label><div class="inp">' + ic('id') + '<input id="n-idf" placeholder="000.000-0"></div></div></div>' +
    '<div class="row2"><div class="field"><label for="n-btl">Batalhão</label>' + comboHTML('n-btl', 'btl', '', 'shield', 'Toque ou digite') + '</div><div class="field"><label for="n-crbm">Região (CRBM)</label>' + comboHTML('n-crbm', 'crbm', '', 'map', 'Toque ou digite') + '</div></div>' +
    '<div class="field"><label for="n-user">Usuário</label><div class="inp">' + ic('user') + '<input id="n-user" autocapitalize="none" spellcheck="false"></div><span class="hint">O portal gera uma senha provisória para você passar ao colega.</span></div>' +
    '<div class="row2"><button class="btn ghost" type="button" id="n-cancel">Cancelar</button><button class="btn gold" type="submit" id="n-btn">' + ic('check') + 'Criar acesso</button></div></form>';
  document.body.appendChild(m); document.body.style.overflow = 'hidden'; ligarCombos(m);
  const fechar = () => { m.remove(); document.body.style.overflow = ''; };
  $('#n-cancel').onclick = fechar;
  $('#n-guerra').addEventListener('input', () => { const u = $('#n-user'); if (!u.dataset.mexeu) u.value = 'sd.' + semAcento($('#n-guerra').value).replace(/[^a-z0-9]/g, ''); });
  $('#n-user').addEventListener('input', () => { $('#n-user').dataset.mexeu = 1; });
  $('#f-novo').onsubmit = async e => {
    e.preventDefault();
    const nm = $('#n-nome').value.trim(), g = $('#n-guerra').value.trim(), id = $('#n-idf').value.trim(), b = $('#n-btl').value.trim(), r = $('#n-crbm').value.trim(), u = $('#n-user').value.trim().toLowerCase();
    if (!nm || !g) return msg('#n-msg', 'err', 'Preencha nome completo e nome de guerra.');
    if (r && !valido('crbm', r)) return msg('#n-msg', 'err', 'Escolha a região (CRBM) na lista.');
    if (!validoUsuario(u)) return msg('#n-msg', 'err', 'Usuário inválido: de 3 a 30 letras minúsculas, números, ponto ou traço.');
    const btn = $('#n-btn'); ocupado(btn, true, 'Criando');
    try {
      const p = senhaProvisoria();
      await API.criarAluno({usuario: u, nome: nm, guerra: g, idf: id || null, btl: b, crbm: r}, p);
      fechar(); ADM_SENHA = [u, p]; rAlunos();
    } catch (er) { msg('#n-msg', 'err', erroTexto(er)); ocupado(btn, false); }
  };
}

/* ============ início ============ */
(async () => {
  if (!API) { mostrar('entrar'); prepararEntrada(); return; }
  try {
    const id = await API.sessao();
    if (id) { await iniciarSessao(id); if (ME) return; }
  } catch (e) { /* sessão expirada */ }
  mostrar('entrar'); prepararEntrada();
})();
})();
