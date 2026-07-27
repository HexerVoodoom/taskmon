// Minigame currency — "Bits" (internal field stays GameState.gamePoints).
// Rendered with NO icon: just the name/number in a calculator-LCD look —
// monospace, black or white depending on the background it sits on (each
// call site picks the color; this shared style only sets the font).
import type { CSSProperties } from 'react';

export const BITS_NAME = 'Bits';

/** Calculator/LCD font for the Bits wallet readouts — no fixed color. */
export const bitsStyle: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  letterSpacing: '1.5px',
  fontWeight: 700,
};
