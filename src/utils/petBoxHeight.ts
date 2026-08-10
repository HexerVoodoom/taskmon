// Altura da caixa do pet — CompanionHUD (home normal) e TogetherHome (4ª
// casinha) usam o MESMO valor pra ficarem visualmente equivalentes. Não é
// um número fixo: clamp() encolhe a caixa proporcionalmente quando falta
// altura de viewport, sem passar do teto nas telas normais/altas (assim
// sobra mais espaço pra lista de tarefas/atividades rolar). Valores 2/3 dos
// originais (220/42dvh/360) — a caixa em si é 1/3 mais baixa; o sprite do
// pet continua 132px (ver FLOOR_BOTTOM_PX abaixo).
export const PET_BOX_HEIGHT = 'clamp(147px, 28dvh, 240px)';

// Distância fixa (não percentual) dos pés do sprite até a base da caixa.
// Como o pet NÃO encolhe junto com a caixa, ancorar por % do tipo
// `top: 72% - offset` faz a distância do chão até o topo da caixa mudar
// junto da altura — e nas alturas menores isso cortava (overflow) o sprite
// pela base. Uma distância fixa em px do FUNDO da caixa resolve isso pra
// qualquer altura, sem nunca cortar o pet.
export const FLOOR_BOTTOM_PX = 3;
