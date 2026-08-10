// Altura da caixa do pet — CompanionHUD (home normal) e TogetherHome (4ª
// casinha) usam o MESMO valor pra ficarem visualmente equivalentes. Não é
// um número fixo: em telas mais baixas, 360px sozinho já comia quase metade
// da viewport, sobrando pouquíssimo espaço pra lista de tarefas/atividades
// rolar (menos de 2 itens visíveis). clamp() encolhe a caixa proporcionalmente
// quando falta altura, sem passar de 360px nas telas normais/altas.
export const PET_BOX_HEIGHT = 'clamp(220px, 42dvh, 360px)';
