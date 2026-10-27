# 1. Preparar o notebook (tudo a partir dos repositórios do WilliamBortoli)

## Programas básicos (Windows)
1. Git: https://git-scm.com/download/win
2. Node.js 20+ (LTS): https://nodejs.org
3. Python 3.10+: https://python.org (marque "Add to PATH")
4. Claude Code, no PowerShell: `npm install -g @anthropic-ai/claude-code`

## Nosso projeto (site + banco + vídeo)
```powershell
mkdir $HOME\projetos; cd $HOME\projetos
git clone https://github.com/WilliamBortoli/CTSP.git
```
- Site no ar: https://williambortoli.github.io/CTSP/ (pasta `docs/`, publica sozinho a cada `git push`).
- Banco: Supabase, projeto **CTSP**. Conecte no Claude Code: `claude mcp add --transport http supabase https://mcp.supabase.com/mcp` e faça login quando pedir.

## Skills e plugins (dos nossos repositórios)
No PowerShell, dentro de `$HOME\projetos`, abra `claude` e digite:

| O quê | Comandos no Claude Code |
|---|---|
| Superpowers | `/plugin marketplace add WilliamBortoli/superpowers` e `/plugin install superpowers@superpowers-dev` |
| Ponytail | `/plugin marketplace add WilliamBortoli/ponytail` e `/plugin install ponytail@ponytail` |
| Agent Skills | `/plugin marketplace add WilliamBortoli/agent-skills` e `/plugin install agent-skills@addy-agent-skills` |
| HyperFrames (vídeo) | `/plugin marketplace add heygen-com/hyperframes` e `/plugin install hyperframes@hyperframes` |
| Ruflo (só a skill-guia) | no PowerShell: `npx skills add WilliamBortoli/ruflo --skill ruflo --yes` |

Feche e abra o Claude Code de novo. Confira com `/plugin` e `/skills`.

## VoiceStudio (narração)
1. Instale o app: https://github.com/debpalash/VoiceStudio/releases/latest e baixe o modelo de voz dentro dele.
2. Skill:
```powershell
git clone --depth 1 https://github.com/debpalash/VoiceStudio.git $HOME\projetos\VoiceStudio
mkdir $HOME\.claude\skills\voicestudio -Force
copy $HOME\projetos\VoiceStudio\skills\voicestudio\SKILL.md $HOME\.claude\skills\voicestudio\
```

## OmniRoute (opcional, não necessário)
Só se quiser rodar o gateway de IAs: `git clone https://github.com/WilliamBortoli/OmniRoute.git` e siga o README dele.

## Testes do site
```powershell
cd $HOME\projetos\CTSP
npm i -D playwright; npx playwright install chromium
cd docs; python -m http.server 8765    # deixe esta janela aberta
# em outra janela, na pasta CTSP:
node testes/teste.js http://localhost:8765/ prints   # deve terminar em "TUDO OK"
```

## Começar
```powershell
cd $HOME\projetos\CTSP
claude
```
Primeira mensagem: **"Leia para-o-code/00-LEIA-PRIMEIRO.md e siga as etapas a partir da 2."**
