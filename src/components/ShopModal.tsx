import { useState } from 'react';
import { SHOP_ITEMS, type ShopItem } from '../utils/shop';
import { bitsStyle } from '../utils/currency';
import { DEFAULT_REAL_REWARDS, type RealReward, type RewardRedemption } from '../utils/economy';
import type { Language } from '../utils/i18n';

/**
 * 🛒 Shop — spend Bits earned in the minigames on food for the pet. Themed to
 * match the rest of the app (rounded cards, per-profile accent color) instead
 * of the old 8-bit dark-navy look.
 *
 * Aba 🎁 Prêmios: recompensas do MUNDO REAL (dossiê R16) — catálogo editável
 * pelo responsável (portão de adulto = continha de multiplicar), resgate
 * desconta Bits e mostra um cartão pra apresentar ao responsável.
 */
export function ShopModal({ language, points, onBuy, onClose, realRewards, rewardRedemptions, onRedeemReward, onSaveRewards }: {
  language: Language;
  points: number;
  onBuy: (itemId: string) => boolean;
  onClose: () => void;
  realRewards?: RealReward[];
  rewardRedemptions: RewardRedemption[];
  onRedeemReward: (reward: RealReward) => boolean;
  onSaveRewards: (rewards: RealReward[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  const [tab, setTab] = useState<'food' | 'rewards'>('food');
  const [voucher, setVoucher] = useState<RewardRedemption | null>(null);
  // Portão de adulto: null = fechado · 'gate' = perguntando · 'edit' = editor aberto
  const [editState, setEditState] = useState<null | 'gate' | 'edit'>(null);
  const [gate, setGate] = useState<{ a: number; b: number; answer: string }>({ a: 6, b: 7, answer: '' });
  const [newReward, setNewReward] = useState<{ name: string; emoji: string; price: string }>({ name: '', emoji: '🎁', price: '150' });

  const rewards = realRewards ?? DEFAULT_REAL_REWARDS;

  const buy = (item: ShopItem) => {
    const ok = onBuy(item.id);
    setFlash({ id: item.id, ok });
    setTimeout(() => setFlash(null), 900);
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  const redeem = (reward: RealReward) => {
    const ok = onRedeemReward(reward);
    setFlash({ id: reward.id, ok });
    setTimeout(() => setFlash(null), 900);
    if (ok) setVoucher({ ...reward, at: new Date().toISOString() });
    try { navigator.vibrate?.(ok ? 25 : 60); } catch { /* noop */ }
  };

  const openGate = () => {
    const a = 3 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    setGate({ a, b, answer: '' });
    setEditState('gate');
  };

  const tryGate = () => {
    if (parseInt(gate.answer, 10) === gate.a * gate.b) setEditState('edit');
    else setEditState(null);
  };

  const addReward = () => {
    const price = Math.max(1, parseInt(newReward.price, 10) || 0);
    const name = newReward.name.trim();
    if (!name) return;
    onSaveRewards([
      ...rewards,
      { id: `r-${Date.now()}`, namePt: name, nameEn: name, emoji: newReward.emoji || '🎁', price },
    ]);
    setNewReward({ name: '', emoji: '🎁', price: '150' });
  };

  const removeReward = (id: string) => {
    onSaveRewards(rewards.filter(r => r.id !== id));
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
      <div className="animate-in fade-in zoom-in-95 duration-150" style={{
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

        {/* Abas: Comida × Prêmios de verdade */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0' }}>
          {([['food', isPt ? '🍽️ Comida' : '🍽️ Food'], ['rewards', isPt ? '🎁 Prêmios' : '🎁 Rewards']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 999, fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer',
                border: '1px solid var(--tk-border, #e5e7eb)',
                background: tab === key ? 'var(--tk-btn-bg, var(--tk-accent))' : 'var(--tk-soft, #f3f4f6)',
                color: tab === key ? '#fff' : 'var(--tk-text, #374151)',
              }}>
              {label}
            </button>
          ))}
        </div>

        <p style={{ color: 'var(--tk-muted, #6b7280)', fontSize: '0.72rem', textAlign: 'center', padding: '10px 16px 0' }}>
          {tab === 'food'
            ? (isPt ? 'Comida pro seu pet — comer dá +1 de energia (até 5x por hora).'
                    : 'Food for your pet — eating gives +1 energy (up to 5x per hour).')
            : (isPt ? 'Prêmios do mundo real! Resgatou? Mostra o cartão pra quem cuida de você. 💜'
                    : 'Real-world rewards! Redeemed one? Show the card to your grown-up. 💜')}
        </p>

        {/* 🎁 Rewards grid */}
        {tab === 'rewards' && (
          <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rewards.map(reward => {
              const affordable = points >= reward.price;
              const flashHere = flash?.id === reward.id;
              return (
                <div key={reward.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 'var(--tk-radius-sm, 14px)',
                  border: flashHere ? `2px solid ${flash!.ok ? '#4ade80' : '#f87171'}` : '1px solid var(--tk-border, #e5e7eb)',
                  background: 'var(--tk-soft, #f9fafb)',
                }}>
                  <span style={{ fontSize: '1.7rem', lineHeight: 1 }}>{reward.emoji}</span>
                  <span style={{ flex: 1, color: 'var(--tk-text, #111827)', fontWeight: 700, fontSize: '0.82rem' }}>
                    {isPt ? reward.namePt : reward.nameEn}
                  </span>
                  {editState === 'edit' ? (
                    <button onClick={() => removeReward(reward.id)}
                      style={{ border: 'none', background: '#fee2e2', color: '#b91c1c', borderRadius: 8, padding: '4px 10px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>
                      {isPt ? 'Remover' : 'Remove'}
                    </button>
                  ) : (
                    <button onClick={() => redeem(reward)} disabled={!affordable}
                      className="tk-keep-mono"
                      style={{ ...bitsStyle, fontSize: '0.72rem', color: '#111', background: affordable ? '#eafbe7' : '#f3f4f6', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 999, padding: '4px 10px', cursor: affordable ? 'pointer' : 'default', opacity: affordable ? 1 : 0.55 }}>
                      {reward.price} Bits
                    </button>
                  )}
                </div>
              );
            })}

            {/* Histórico de resgates (últimos 5) */}
            {rewardRedemptions.length > 0 && editState !== 'edit' && (
              <div style={{ marginTop: 4 }}>
                <p style={{ color: 'var(--tk-muted, #6b7280)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  {isPt ? 'Resgatados' : 'Redeemed'}
                </p>
                {rewardRedemptions.slice(-5).reverse().map((r, i) => (
                  <button key={`${r.at}-${i}`} onClick={() => setVoucher(r)}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 4, borderRadius: 10, border: '1px dashed var(--tk-border, #d1d5db)', background: 'transparent', cursor: 'pointer', color: 'var(--tk-muted, #6b7280)', fontSize: '0.75rem' }}>
                    <span>{r.emoji}</span>
                    <span style={{ flex: 1, textAlign: 'left' }}>{isPt ? r.namePt : r.nameEn}</span>
                    <span>{new Date(r.at).toLocaleDateString(isPt ? 'pt-BR' : 'en-US')}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Portão de adulto → editor do catálogo */}
            {editState === null && (
              <button onClick={openGate}
                style={{ marginTop: 4, padding: '8px 0', borderRadius: 10, border: '1px dashed var(--tk-border, #d1d5db)', background: 'transparent', color: 'var(--tk-muted, #6b7280)', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}>
                {isPt ? '👤 Sou responsável — editar prêmios' : '👤 Grown-up — edit rewards'}
              </button>
            )}
            {editState === 'gate' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10, border: '1px solid var(--tk-border, #e5e7eb)', background: 'var(--tk-soft, #f9fafb)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--tk-text, #111827)', fontWeight: 700 }}>
                  {isPt ? `Quanto é ${gate.a} × ${gate.b}?` : `What is ${gate.a} × ${gate.b}?`}
                </span>
                <input inputMode="numeric" value={gate.answer} autoFocus
                  onChange={e => setGate(g => ({ ...g, answer: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') tryGate(); }}
                  style={{ width: 56, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--tk-border, #d1d5db)', fontSize: '0.8rem' }} />
                <button onClick={tryGate} style={{ border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', borderRadius: 8, padding: '5px 12px', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer' }}>OK</button>
              </div>
            )}
            {editState === 'edit' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px', borderRadius: 12, border: '1px solid var(--tk-border, #e5e7eb)', background: 'var(--tk-soft, #f9fafb)' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={newReward.emoji} maxLength={4} aria-label="emoji"
                    onChange={e => setNewReward(r => ({ ...r, emoji: e.target.value }))}
                    style={{ width: 44, textAlign: 'center', padding: '6px 4px', borderRadius: 8, border: '1px solid var(--tk-border, #d1d5db)', fontSize: '0.9rem' }} />
                  <input value={newReward.name} placeholder={isPt ? 'Novo prêmio…' : 'New reward…'}
                    onChange={e => setNewReward(r => ({ ...r, name: e.target.value }))}
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--tk-border, #d1d5db)', fontSize: '0.8rem' }} />
                  <input inputMode="numeric" value={newReward.price} aria-label="Bits"
                    onChange={e => setNewReward(r => ({ ...r, price: e.target.value }))}
                    style={{ width: 64, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--tk-border, #d1d5db)', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={addReward} style={{ flex: 1, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', borderRadius: 8, padding: '7px 0', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}>
                    {isPt ? '+ Adicionar' : '+ Add'}
                  </button>
                  <button onClick={() => setEditState(null)} style={{ flex: 1, border: '1px solid var(--tk-border, #d1d5db)', background: 'transparent', color: 'var(--tk-text, #374151)', borderRadius: 8, padding: '7px 0', fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer' }}>
                    {isPt ? 'Fechar edição' : 'Done editing'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🎫 Voucher do resgate — o "cartão" pra mostrar pro responsável */}
        {voucher && (
          <div onClick={() => setVoucher(null)} style={{ position: 'fixed', inset: 0, zIndex: 130, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="animate-in fade-in zoom-in-95 duration-200" style={{ width: '100%', maxWidth: 320, background: '#fffbeb', border: '3px dashed #f59e0b', borderRadius: 18, padding: '22px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.6rem' }}>{voucher.emoji}</div>
              <p style={{ fontWeight: 900, fontSize: '1.02rem', color: '#78350f', margin: '8px 0 2px' }}>
                {isPt ? voucher.namePt : voucher.nameEn}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#92400e' }}>
                {isPt ? `Resgatado por ${voucher.price} Bits em ${new Date(voucher.at).toLocaleDateString('pt-BR')}` : `Redeemed for ${voucher.price} Bits on ${new Date(voucher.at).toLocaleDateString('en-US')}`}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#78350f', fontWeight: 700, marginTop: 10 }}>
                {isPt ? 'Mostra esse cartão pra quem cuida de você! 🤝' : 'Show this card to your grown-up! 🤝'}
              </p>
            </div>
          </div>
        )}

        {/* Food grid */}
        {tab === 'food' && (
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
        )}
      </div>
    </div>
  );
}
