# Taskmon — Guia para agentes

App de produtividade gamificado (bichinho virtual original, estilo Tamagotchi).
React 18 + TypeScript + Vite 6 (web) e Capacitor 8.4 (APK Android).
Fork do DigiApp, mas **sem nenhuma referência a Digimon**: pets originais em pixel art (PNG),
progressão linear própria e 3 perfis de jogo. UI/textos em PT-BR e EN (sempre os
dois, via `language === 'pt-BR'`).

## Comandos (rode ANTES de todo commit)

```bash
npx tsc --noEmit     # typecheck — deve sair limpo (exit 0)
npx vitest run       # testes — todos devem passar
npm run build        # vite build + PNG→WebP + wrangler pages functions build (dist/ é commitado!)
```

## Deploy

- Cloudflare **Workers Builds** linkado direto no `main` — push publica sozinho.
  Config em `wrangler.jsonc` (assets=./dist + `main=./dist/_worker.js/index.js`);
  o script `build` compila `functions/` para `dist/_worker.js/` via
  `wrangler pages functions build`. NÃO recriar `public/_redirects` (conflita com
  `not_found_handling` e causa "Infinite loop detected").
- Ao mudar assets estáticos/HTML de forma incompatível, **bump `CACHE_VERSION`**
  em `public/sw.js` (v16 atual).
- KV/secrets (`DIGIAPP_SAVES` etc.) são configurados no dashboard do projeto.

## Os 3 perfis (hub de casinhas)

- **3 saves totalmente independentes** na mesma instalação. As **3 casinhas** no
  header trocam de perfil (casinha ativa → home; inativa → `setActiveProfile` +
  reload). Cores: perfil 0 **preto+roxo** (dark) · 1 **rosa** · 2 **verde**.
- `src/utils/storageKeys.ts`: `STORAGE_KEYS` é um **Proxy** — chaves de save
  resolvem para `${base}_p{perfilAtivo}` (`digiapp-active-profile`); prefs de
  dispositivo (tema, idioma, som, SAVE_ID/USER_EMAIL) são compartilhadas.
  `keyForProfile()` lê qualquer perfil. Migração one-time: save legado → perfil 0.
- **Cloud save**: um blob por e-mail com os 3 perfis juntos
  (`utils/profiles.ts` → `buildHubCloudPayload`/`applyHubCloudPayload`;
  formato antigo = GameState solto vira perfil 0). saveId = SHA-256 do e-mail.
- **Tema por perfil**: `<html class="tk-theme" data-profile="N">` (setado no
  App). Vars `--tk-*` + re-mapeamento de utilitários (`.bg-white` → var) no fim
  de `src/index.css`. Zonas retrô (loja/masmorra/minijogos/itens) usam
  `.tk-keep-mono` para manter o monospace. Temas win98/glitch não são afetados.
- **Temáticas**: 0 GÓTICO · 1 GRÉCIA ANTIGA · 2 MAD MAX. Cada perfil define
  `--tk-scene` (cenário padrão do box do pet, PNG pixel-art em `src/assets/scenes/`; cenário da loja
  equipado substitui), `--tk-deco`/`--tk-deco-size` (faixa do header e da
  moldura do pet, `.tk-deco-strip`), `--tk-font-display`+`.tk-display`
  (títulos), `--tk-radius`/`--tk-radius-sm` (cantos), `--tk-btn-bg` (gradiente
  dos botões) e `--tk-bg-full` (textura do fundo). Casinhas do header são
  ícones temáticos (capela/templo/abrigo) em `Header.tsx`.

## Regras do jogo (fonte da verdade — NÃO reinventar)

| Sistema | Regra |
|---|---|
| 🐣 Pets e fases | 3 pets originais em pixel art PNG (`src/assets/pets/`, mapeados em `utils/sprites.ts`; SVG gerado é fallback): **Vix** (roxo), **Momo** (rosa), **Kiwi** (verde) — escolhidos no ovo do onboarding. Linha **linear, sem branches**: `egg` → `<pet>-1` → `<pet>-2` → `<pet>-3` (Vixinho→Vix→Vixão etc., `types/progression.ts` `PETS`). Sem sistema de atributos (virus/data/vaccine REMOVIDO). Migração de saves DigiApp preserva o nível (`LEGACY_EGG_TYPE`, `getStageLevel` aceita ids legados). |
| 📊 Requisitos | `FORM_REQUIREMENTS`: egg 1 tarefa/dia (cap 2) · fase-1 3 (cap 5) · fase-2 5 (cap 7) · fase-3 6 (cap 9). HP máx: 1/2/3/4. `daysToEvolve`: 1/3/10/— (dias perfeitos). Dias da semana selecionáveis a partir da fase 2. |
| ❤️ Corações (HP) | Perde na virada do dia: `floor((1 − feitas/meta) × maxHP)`, meta = `min(cadastradas, requisito da fase)`. HP aceita 0.5. HP 0 → volta uma fase (desconto: começa com `floor(required/2)` dias perfeitos). |
| 🫶 Carinho | Cura principal: esfregar o pet ~2s = +0.5 coração, máx. 1/dia (`RUB_HEAL_DAY`). Alternativa: **Coraçãozinho** (`💗`, loja/drop da masmorra) cura +1 ao usar. |
| 🍎 Comida | Máx. 5/hora (`FOOD_FEED_TIMES`). Dá **+1 energia apenas** (sem atributos). Ganha-se completando tarefas (no ovo a tarefa dá energia direto, sem comida). Coraçãozinho/Glitchtama não contam no limite. |
| ⚡ Energia | Enche só comendo, zera todo dia. Barras = requisito de tarefas da fase (`getMaxEnergyForStage`). Cheia no fim do dia = condição do dia perfeito. |
| ⭐ Dia perfeito | `tarefas ≥ min(cadastradas, requisito) && ≥1 cadastrada && energia cheia` → +1 perfectDay. Dia não-perfeito → −1. **🌀 Glitchtama** (recompensa dos 5 andares da masmorra) dá +1 ao usar. |
| 🔒 Cadeado | Página de Evolução: tocar no pet ATUAL alterna `evolutionLocked` (travado = não evolui na virada; perfectDays acumulam). Botão "Voltar" regride pra fase anterior (2 confirmações). |
| 💩 Cocô / 🚿 / 💤 | Idênticos ao DigiApp: 2×/dia (07–15h; 2º 8–10h após o 1º), não limpo = −1 coração/6h (pausa dormindo), banho limpa, sono manual + automático. Ovo é isento de cocô. |
| 💠 Bits | Moeda dos minijogos (`gamePoints`), fonte de calculadora verde neon (`utils/currency.ts`; elemento precisa estar sob `.tk-keep-mono` p/ manter a fonte). Dino floor(score/100) · PPT 5/vitória · Masmorra Bits/inimigo + bônus `10+5×(andar−1)`. **Sem drops de itens de evolução** (removidos). |
| ⚔️ Masmorra | `utils/dungeon.ts`: run = 5 andares × 6 inimigos, sorteados entre as **sombras dos pets** (`shadow-<pet>-<fase>`) e os **monstros dedicados** de `utils/dungeonEnemies.ts` (2 por fase, fase 1→3, `LADDER_TIERS`). Dificuldade andar F = base+(F−1); base persiste e reseta SEMANALMENTE. **Minijogo livre**: sem gate de entrada, perder NÃO custa coração real (só reseta a run). Drop 💗 5%/inimigo máx. 2/dia. Concluir 5 andares → 🌀 Glitchtama + base+1. Cenários retrô por andar (`utils/dungeonScenes.ts`). `PLAYER_STATS` por fase no DungeonGame. |
| 🛒 Loja | Vende só **comida** (8 tipos, `utils/shop.ts` `SHOP_ITEMS`, 10–20 Bits) — cada uma soma no `foodInventory` e alimenta igual à comida de tarefa (+1 energia). Coraçãozinho/Glitchtama NÃO são mais vendidos (só drop da masmorra, `SPECIAL_ITEMS`). Sistema de missões e cenários compráveis foi removido (cenários já possuídos por saves antigos continuam equipáveis via `equippedBackground`, só não há mais UI pra trocar). |

## Arquitetura

- `src/App.tsx` (~1700 linhas) — orquestra tudo; seta `data-profile`/`tk-theme`
  no `<html>`.
- `src/contexts/GameStateContext.tsx` — GameState + persistência (localStorage +
  cloud 3s debounce) + **migração DigiApp→Taskmon** no load (`migrateLoadedState`:
  estágio legado → fase equivalente, remove itens extintos do inventário).
  No load use fallback `?? padrão` SEMPRE.
- `src/types/progression.ts` — PETS, fases, requisitos, níveis (`getStageLevel`
  aceita ids novos E legados).
- `src/utils/sprites.ts` — sprites dos pets: **PNG em `src/assets/pets/`** (9 formas + 9
  sombras da masmorra, 320×320, geradas via Higgsfield/Gemini); ovos seguem em SVG
  gerado em código. `getSpriteForStage(stage, eggType?)`. Cenários por perfil:
  PNG do Higgsfield em `src/assets/scenes/` (gothic/greek/madmax), ligados em
  `--tk-scene` no `src/index.css`.
- `src/utils/dailyReset.ts` + `src/hooks/useDailyReset.ts` — reset na virada
  (check 30s; NÃO reintroduzir ticker de 1s), evolução/degeneração linear.
- `src/components/Header.tsx` — 3 casinhas + navegação.
- `src/components/CompanionHUD.tsx` — área do pet (memo(); handlers via useCallback).
  Fala idle a cada 3min chama `/api/chat` (Groq; guard de `document.hidden`).
- IA: `functions/api/chat.js` — personalidade por pet (campo da API continua
  `digimonName` por compat, é só o nome do pet).
- Push: Web Push VAPID + FCM (dois canais, mesma KV) — inalterado do DigiApp;
  `workers/push-scheduler.js` deploy manual via wrangler dentro de `workers/`.
- Widgets Android: inalterados (recebem os nomes novos via `DigiWidgetPlugin`).
- Testes: `npx vitest run` cobre progressão, reset diário, missões.

## Footguns (aprendidos a dor — não repita)

1. **`src/index.css` é o ÚNICO CSS empacotado** (Tailwind v4 pré-compilado; NÃO há
   plugin do Tailwind no Vite). Keyframes/estilos novos vão NELE (no fim).
   Classe utilitária que não está no index.css não aplica nada. Para
   posicionamento crítico, prefira `style={{}}` inline.
2. O tema por perfil re-mapeia utilitários (`.bg-white`, `.text-gray-*`, teal)
   via `!important` sob `html.tk-theme` — cuidado ao "consertar" cores que
   parecem erradas no código: a cor final vem das vars `--tk-*`.
3. **Build Android**: JDK 21 no CI, Kotlin jvmTarget **17**, compileOptions
   re-pinados para 17 DEPOIS do `apply from: 'capacitor.build.gradle'`.
4. `handleX = useCallback` com deps certas — CompanionHUD é `memo()`.
5. Side effects NUNCA dentro de updater do setGameState (StrictMode invoca 2×).
6. O sandbox de dev **não acessa** produção (proxy 403) — teste local com
   `npx vite preview` + Playwright (`/opt/pw-browsers/chromium`, import
   `/opt/node22/lib/node_modules/playwright/index.js`, CommonJS: `import pkg`).
7. Chaves de localStorage continuam com prefixo `digiapp-*` de propósito
   (compat com saves existentes) — não renomear.
8. `wrangler.jsonc` na raiz é o deploy; `workers/wrangler.toml` é OUTRO worker
   (push-scheduler). Não confundir.

## Convenções

- Commits em PT-BR, `tipo(escopo): resumo` (feat/fix/refactor/style/chore).
- Textos de UI sempre PT-BR + EN. Falas do pet: curtas, fofas, sem emoji nas
  frases faladas (o `speak()` remove emojis; `speakRaw()` preserva).
- Ao mudar regra de jogo: atualizar `GuideModal.tsx` E `HelpModal.tsx` E os
  testes (`useDailyReset.test.ts`, `progression.test.ts`).
- Verificação visual: screenshot via Playwright antes de declarar UI pronta.
