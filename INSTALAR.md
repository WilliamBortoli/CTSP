# Passo a passo: programas e skills no Claude Code (notebook)

Pré-requisitos: Node.js 20+ e Git instalados; Claude Code instalado (`npm install -g @anthropic-ai/claude-code`).

## 1. Projeto CTSP
```bash
git clone https://github.com/WilliamBortoli/CTSP.git
cd CTSP
claude
```
Primeira mensagem para o Claude: **"Leia para-o-code/00-LEIA-PRIMEIRO.md e siga as etapas."**

## 2. Skills e plugins (digite dentro do Claude Code)
| O quê | Comandos |
|---|---|
| Superpowers (planejar, depurar, testes) | `/plugin install superpowers@claude-plugins-official` |
| HyperFrames (vídeos a partir de HTML) | `/plugin marketplace add heygen-com/hyperframes` e depois `/plugin install hyperframes@hyperframes` |
| Agent Skills (25 skills de engenharia) | `/plugin marketplace add addyosmani/agent-skills` e depois `/plugin install agent-skills@addy-agent-skills` |
| Ponytail (solução mais simples) | `/plugin marketplace add DietrichGebert/ponytail` e depois `/plugin install ponytail@ponytail` |
| Ruflo (só a skill-guia) | no terminal: `npx skills add ruvnet/ruflo --skill ruflo --yes` |

Reinicie o Claude Code depois de instalar. Confira com `/plugin` e `/skills`.

Não recomendado: Ruflo completo (`npx ruflo init`) instala automações em toda ação; OmniRoute só serve se você rodar o servidor OmniRoute.

## 3. VoiceStudio (narração e clonagem de voz, grátis)
1. Baixe e instale: https://github.com/debpalash/VoiceStudio/releases/latest
2. Abra o programa e baixe o modelo de voz que ele sugerir.
3. Skill para o Claude usar o programa:
```bash
git clone --depth 1 https://github.com/debpalash/VoiceStudio.git
# Windows (PowerShell):
mkdir $HOME\.claude\skills\voicestudio -Force; copy VoiceStudio\skills\voicestudio\SKILL.md $HOME\.claude\skills\voicestudio\
```

## 4. Vídeo do Reels
```bash
cd video/ctsp-reels
npx hyperframes@0.8.209 preview   # abre a prévia para editar
npx hyperframes@0.8.209 render    # gera o MP4 em renders/
```
