import { useState } from 'react';
import { SHOP_ITEMS, type ShopItem } from '../utils/shop';
import { bitsStyle } from '../utils/currency';
import type { Language } from '../utils/i18n';

/**
 * 🛒 Shop — spend Bits earned in the minigames on food for the pet. Themed to
 * match the rest of the app (rounded cards, per-profile accent color) instead
 * of the old 8-bit dark-navy look.
 */
export function ShopModal({ language, points, onBuy, onClose }: {
  language: Language;
  points: number;
  onBuy: (itemId: string) => boolean;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);

  const buy = (item: ShopItem) => {
    const ok = onBuy(item.id);
    setFlash({ id: item.id, ok });
    setTimeout(() => setFlash(null), 900);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div style={{
        width: '100%', maxWidth: 420, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        background: 'var(--tk-card, #fff)', borderRadius: 'var(--tk-radius, 20px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
          background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff',
        }}>
          <span className="tk-display" style={{ fontWeight: 800, fontSize: '1.05rem' }}>
            🍽️ {isPt ? 'LOJA' : 'SHOP'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="tk-keep-mono"
              style={{ ...bitsStyle, fontSize: '0.9rem', color: '#111', background: '#eafbe7', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 999, padding: '2px 10px' }}
            >
              {points} Bits
            </span>
            <button onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}>
              ✕
            </button>
          </div>
        </div>

        <p style={{ color: 'var(--tk-muted, #6b7280)', fontSize: '0.72rem', textAlign: 'center', padding: '10px 16px 0' }}>
          {isPt ? 'Comida pro seu pet — comer dá +1 de energia (até 5x por hora).'
                : "Food for your pet — eating gives +1 energy (up to 5x per hour)."}
        </p>

        {/* Food grid */}
        <div style={{ overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {SHOP_ITEMS.map(item => {
            const affordable = points >= item.price;
            const flashHere = flash?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => buy(item)}
                disabled={!affordable}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '14px 8px',
                  borderRadius: 'var(--tk-radius-sm, 14px)',
                  border: flashHere
                    ? `2px solid ${flash!.ok ? '#4ade80' : '#f87171'}`
                    : '1px solid var(--tk-border, #e5e7eb)',
                  background: affordable ? 'var(--tk-soft, #f9fafb)' : 'var(--tk-soft, #f3f4f6)',
                  opacity: affordable ? 1 : 0.55,
                  cursor: affordable ? 'pointer' : 'default',
                  transition: 'transform 0.1s',
                }}
              >
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.icon}</span>
                <span style={{ color: 'var(--tk-text, #111827)', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center' }}>
                  {isPt ? item.namePt : item.nameEn}
                </span>
                <span
                  className="tk-keep-mono"
                  style={{ ...bitsStyle, fontSize: '0.72rem', color: '#111', background: '#eafbe7', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 999, padding: '1px 8px' }}
                >
                  {item.price} Bits
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
