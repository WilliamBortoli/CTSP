// API falsa em memória (com localStorage) para testar o site sem o Supabase.
(() => {
  const K = 'mock-db';
  const ler = () => { try { return JSON.parse(localStorage.getItem(K)) || {users: {}, perfis: {}, prog: {}, sess: null}; } catch (e) { return {users: {}, perfis: {}, prog: {}, sess: null}; } };
  const grava = db => localStorage.setItem(K, JSON.stringify(db));
  const uid = () => 'u' + Math.random().toString(36).slice(2, 10);
  const espera = () => new Promise(r => setTimeout(r, 40));
  const erro = m => { const e = new Error(m); e.message = m; return e; };
  window.__chamadas = [];
  const log = (n, a) => window.__chamadas.push([n, a]);
  window.CTSP_API = {
    async sessao(){ await espera(); return ler().sess; },
    async entrar(u, s){ await espera(); log('entrar', u); const db = ler(); const id = Object.keys(db.users).find(k => db.users[k].u === u && db.users[k].s === s); if (!id) throw {code: 'invalid_credentials', message: 'Invalid login credentials'}; db.sess = id; grava(db); return id; },
    async sair(){ const db = ler(); db.sess = null; grava(db); },
    async existeAdmin(){ await espera(); return Object.values(ler().perfis).some(p => p.papel === 'admin'); },
    async criarAdmin(c){ await espera(); const db = ler(); if (c.codigo !== 'ROCAM-TESTE') throw erro('codigo_invalido'); if (Object.values(db.perfis).some(p => p.papel === 'admin')) throw {code: 'ja_tem_admin'};
      const id = uid(); db.users[id] = {u: c.usuario, s: c.senha}; db.perfis[id] = {id, usuario: c.usuario, nome: c.nome, guerra: c.guerra, idf: null, btl: '', crbm: '', incl: null, foto: null, papel: 'admin', ativo: true, senha_provisoria: false, criado_em: new Date().toISOString()}; db.prog[id] = {}; grava(db); return this.entrar(c.usuario, c.senha); },
    async perfil(id){ await espera(); return ler().perfis[id] || null; },
    async salvarPerfil(id, campos){ await espera(); log('salvarPerfil', Object.keys(campos)); const db = ler(); Object.assign(db.perfis[id], campos); grava(db); },
    async trocarSenha(n){ await espera(); const db = ler(); db.users[db.sess].s = n; grava(db); },
    async progresso(id){ await espera(); return ler().prog[id] || null; },
    async salvarProgresso(id, dados){ await espera(); log('salvarProgresso', dados.sims.length); const db = ler(); db.prog[id] = dados; grava(db); },
    async ranking(){ await espera(); const db = ler(); return Object.values(db.perfis).filter(p => p.ativo).map(p => { const s = ((db.prog[p.id] || {}).sims || []); const q = s.reduce((a, x) => a + x.tot, 0), ok = s.reduce((a, x) => a + x.ok, 0); return {guerra: p.guerra, btl: p.btl, pontos: q + 2 * ok, questoes: q, acertos: ok, eu: p.id === db.sess}; }).sort((a, b) => b.pontos - a.pontos); },
    async listarAlunos(){ await espera(); const db = ler(); return Object.values(db.perfis).map(p => Object.assign({}, p, {dados: db.prog[p.id] || {}})); },
    async criarAluno(c, senha){ await espera(); const db = ler(); if (Object.values(db.perfis).some(p => p.usuario === c.usuario)) throw erro('usuario_existe'); if (c.idf && Object.values(db.perfis).some(p => p.idf === c.idf)) throw erro('idf_existe');
      const id = uid(); db.users[id] = {u: c.usuario, s: senha}; db.perfis[id] = Object.assign({id, incl: null, foto: null, papel: 'aluno', ativo: true, senha_provisoria: true, criado_em: new Date().toISOString()}, c); db.prog[id] = {}; grava(db); return id; },
    async atualizarAluno(id, campos){ await espera(); const db = ler(); Object.assign(db.perfis[id], campos); grava(db); },
    async redefinirSenha(id, s){ await espera(); const db = ler(); db.users[id].s = s; db.perfis[id].senha_provisoria = true; grava(db); },
    async excluirAluno(id){ await espera(); const db = ler(); delete db.users[id]; delete db.perfis[id]; delete db.prog[id]; grava(db); }
  };
})();
