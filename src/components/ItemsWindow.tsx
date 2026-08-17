import { useState } from 'react';
import type { Language } from '../utils/i18n';
import { SPECIAL_ITEMS, HEART_HEAL } from '../utils/shop';
import { PETS, PET_TYPES, type PetType } from '../types/progression';
import { keyForProfile, getActiveProfile, PROFILE_COUNT } from '../utils/storageKeys';
import { getSpriteForStage } from '../utils/sprites';
import { PROFILE_COLORS } from './Header';

interface ItemsWindowProps {
  foodInventory: Record<string, number>;
  onFeed: (emoji: string) => void;
  onClose: () => void;
  language?: Language;
  /** Doa 1 unidade do item pro inventário de outro perfil. */
  onGiftFood?: (targetProfile: number, emoji: string) => boolean;
}

/** Pets das outras casinhas (nome + sprite) pra escolher quem recebe o
 *  presente. Perfis sem save ficam de fora: escrever num save inexistente
 *  criaria um perfil fantasma. */
function giftTargets(): { index: number; name: string; sprite: string }[] {
  const active = getActiveProfile();
  const out: { index: number; name: string; sprite: string }[] = [];
  for (let i = 0; i < PROFILE_COUNT; i++) {
    if (i === active) continue;
    let eggType: string | undefined;
    let stage: string | undefined;
    try {
      const raw = localStorage.getItem(keyForProfile('GAME_STATE', i));
      if (!raw) continue;
      const save = JSON.parse(raw);
      eggType = save?.eggType;
      stage = save?.evolutionStage;
    } catch { continue; }
    const pet = (eggType ?? PET_TYPES[i] ?? 'vix') as PetType;
    out.push({
      index: i,
      name: PETS[pet].name,
      sprite: getSpriteForStage(stage ?? `${pet}-1`, pet),
    });
  }
  return out;
}

const FOOD_NAMES: Record<string, { en: string; pt: string; descEn: string; descPt: string }> = {
  '🍎': { en: 'Apple',       pt: 'Maçã',      descEn: 'A crisp, sweet apple — perfect brain food',          descPt: 'Uma maçã crocante e doce, perfeita para o cérebro'   },
  '🥩': { en: 'Protein',     pt: 'Proteína',   descEn: 'A juicy, flavorful piece of meat',                   descPt: 'Um pedaço suculento e saboroso de carne'             },
  '🥗': { en: 'Salad',       pt: 'Salada',     descEn: 'Fresh colorful veggies with a light dressing',       descPt: 'Legumes coloridos e frescos com um molho leve'        },
  '☕': { en: 'Coffee',      pt: 'Café',       descEn: 'Bitter black coffee, great for waking up',           descPt: 'Café amargo sem açúcar, muito bom para acordar'       },
  '🧃': { en: 'Juice',       pt: 'Suco',       descEn: 'Freshly squeezed tropical fruit juice',              descPt: 'Suco de fruta tropical espremido na hora'             },
  '🍚': { en: 'Rice',        pt: 'Arroz',      descEn: 'Simple steamed rice, steady fuel for the day',       descPt: 'Arroz cozido simples, energia constante pro dia'      },
  '🍕': { en: 'Pizza',       pt: 'Pizza',      descEn: 'A warm, cheesy slice — best shared with friends',    descPt: 'Uma fatia quente e queijuda, melhor compartilhada'    },
  '🍭': { en: 'Candy',       pt: 'Doce',       descEn: 'A colorful lollipop bursting with sweet flavor',     descPt: 'Uma bala colorida cheia de sabor doce'               },
  '📚': { en: 'EduPack',     pt: 'Edu-Pack',   descEn: 'Packed with nutrients that feed a curious mind',     descPt: 'Cheio de nutrientes que alimentam a mente curiosa'   },
  '🎯': { en: 'FocusBite',   pt: 'FocoSnack',  descEn: 'A small but mighty snack, laser-sharp focus',        descPt: 'Um petisco pequeno mas poderoso, foco total'          },
  '💧': { en: 'AquaDrop',    pt: 'AquaDrop',   descEn: 'Pure, ice-cold water — the simplest fuel',           descPt: 'Água pura e gelada, o combustível mais simples'       },
  '🧘': { en: 'ZenBar',      pt: 'Zen Bar',    descEn: 'A light herbal bar that settles the mind',           descPt: 'Uma barrinha herbal leve que acalma a mente'          },
  '💪': { en: 'ProtBar',     pt: 'Prot-Bar',   descEn: 'High-protein bar, straight fuel for tired muscles',  descPt: 'Barra proteica, combustível direto para músculos'    },
  '📓': { en: 'ThinkSnack',  pt: 'PensaSnack', descEn: 'A thoughtful mix of seeds and dark chocolate',       descPt: 'Uma mistura de sementes e chocolate amargo'          },
  '🌅': { en: 'DawnBite',    pt: 'Amanhecer',  descEn: 'A sunrise smoothie to kickstart your morning',       descPt: 'Um smoothie matinal para começar o dia com tudo'     },
  '💻': { en: 'CodeFuel',    pt: 'CodeFuel',   descEn: 'Energy gel for long hours at the keyboard',          descPt: 'Gel energético para longas horas no teclado'          },
  '📅': { en: 'PlanBite',    pt: 'PlanBite',   descEn: 'A structured snack to keep your day on track',       descPt: 'Um petisco estruturado para manter o dia nos trilhos' },
  '🍅': { en: 'TomatoBit',   pt: 'TomatoBit',  descEn: 'A ripe, tangy tomato — burst of fresh energy',       descPt: 'Um tomate maduro e ácido, explosão de energia fresca' },
  '🔕': { en: 'FocusPack',   pt: 'SilêncPac',  descEn: 'Noise-cancelling nutrients for deep work sessions',  descPt: 'Nutrientes que bloqueiam distrações para foco total' },
  '📞': { en: 'SocialPill',  pt: 'SocialPil',  descEn: 'A fizzy drink that boosts your social battery',      descPt: 'Uma bebida gaseificada que recarrega sua bateria social' },
};

function getFoodName(emoji: string, lang: Language): string {
  const special = SPECIAL_ITEMS[emoji];
  if (special) return lang === 'pt-BR' ? special.namePt : special.nameEn;
  const entry = FOOD_NAMES[emoji];
  if (!entry) return emoji;
  return lang === 'pt-BR' ? entry.pt : entry.en;
}

export function ItemsWindow({ foodInventory, onFeed, onClose, language = 'en-US', onGiftFood }: ItemsWindowProps) {
  const [justFed, setJustFed] = useState<string | null>(null);
  // Item tocado → escolher entre Usar e Presentear (null = grade normal).
  const [chosen, setChosen] = useState<string | null>(null);
  // 2º passo: escolher PRA QUEM presentear (só depois de tocar "Presentear").
  const [pickingPet, setPickingPet] = useState(false);
  // 3º passo: pet escolhido, aguardando confirmação do envio.
  const [confirmTarget, setConfirmTarget] = useState<{ index: number; name: string; sprite: string } | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const isPt = language === 'pt-BR';
  const items = Object.entries(foodInventory).filter(([, c]) => c > 0);
  const targets = onGiftFood ? giftTargets() : [];

  const closePanel = () => { setChosen(null); setPickingPet(false); setConfirmTarget(null); };

  const feed = (emoji: string) => {
    onFeed(emoji);
    setJustFed(emoji);
    closePanel();
    setTimeout(() => setJustFed(null), 500);
    try { navigator.vibrate?.(20); } catch { /* noop */ }
  };

  const donate = () => {
    if (!chosen || !confirmTarget || !onGiftFood) return;
    const { index, name } = confirmTarget;
    if (onGiftFood(index, chosen)) {
      closePanel();
      setSentTo(name);
      setTimeout(() => setSentTo(null), 1800);
      try { navigator.vibrate?.(25); } catch { /* noop */ }
    }
  };

  return (
    <div
      className="animate-in fade-in duration-150"
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}
      onClick={onClose}
    >
      <div
        className="animate-in fade-in zoom-in-95 duration-150"
        style={{
          width: '100%', maxWidth: 420, maxHeight: '82vh', display: 'flex', flexDirection: 'column',
          background: 'var(--tk-card, #fff)', borderRadius: 'var(--tk-radius, 20px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)', overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px',
          background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff',
        }}>
          <span className="tk-display" style={{ fontWeight: 800, fontSize: '1.05rem' }}>
            🧺 {isPt ? 'ITENS' : 'ITEMS'}
          </span>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.25)', border: 'none', borderRadius: '50%', width: 26, height: 26, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.85rem', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        <p style={{ color: 'var(--tk-muted, #6b7280)', fontSize: '0.72rem', textAlign: 'center', padding: '10px 16px 0' }}>
          {sentTo
            ? (isPt ? `Presente enviado pro ${sentTo}! 💝` : `Gift sent to ${sentTo}! 💝`)
            : onGiftFood
              ? (isPt ? 'Toque num item pra usar — ou doar pra outro pet.' : 'Tap an item to use it — or gift it to another pet.')
              : (isPt ? 'Toque numa comida pra dar pro seu pet.' : 'Tap a food to feed your pet.')}
        </p>

        {/* Passo 1: Usar × Presentear · Passo 2: escolher o pet (com sprite) */}
        {chosen && (
          <div style={{ margin: '10px 16px 0', padding: 12, borderRadius: 'var(--tk-radius-sm, 14px)', border: '1px solid var(--tk-border, #e5e7eb)', background: 'var(--tk-soft, #f9fafb)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {/* A comidinha só aparece ao escolher na pasta e na confirmação —
                  no meio do caminho ela é ruído. */}
              {!pickingPet && <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{chosen}</span>}
              <span style={{ flex: 1, color: 'var(--tk-text, #111827)', fontWeight: 800, fontSize: '0.9rem' }}>
                {pickingPet
                  ? (isPt ? 'Presentear quem?' : 'Gift to whom?')
                  : getFoodName(chosen, language)}
              </span>
              <button
                onClick={() => {
                  if (confirmTarget) setConfirmTarget(null);
                  else if (pickingPet) setPickingPet(false);
                  else closePanel();
                }}
                aria-label={pickingPet ? (isPt ? 'Voltar' : 'Back') : (isPt ? 'Cancelar' : 'Cancel')}
                style={{ border: 'none', background: 'transparent', color: 'var(--tk-muted, #6b7280)', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}
              >
                {pickingPet ? '←' : '✕'}
              </button>
            </div>

            {confirmTarget ? (
              // Passo 3: confirmar o envio — aqui a comidinha reaparece,
              // junto do pet que vai receber, pra não errar o presente.
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{chosen}</span>
                  <span style={{ fontSize: '1.4rem', color: 'var(--tk-muted, #6b7280)' }}>→</span>
                  <img src={confirmTarget.sprite} alt="" style={{ width: 56, height: 56, imageRendering: 'pixelated' }} />
                </div>
                <button
                  onClick={donate}
                  style={{
                    width: '100%', minHeight: 56, borderRadius: 12, border: 'none',
                    background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff',
                    fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer',
                  }}
                >
                  {isPt ? `Enviar pro ${confirmTarget.name}!` : `Send to ${confirmTarget.name}!`}
                </button>
              </div>
            ) : !pickingPet ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => feed(chosen)}
                  style={{ flex: 1, minHeight: 56, borderRadius: 12, border: 'none', background: 'var(--tk-btn-bg, var(--tk-accent))', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
                  🍽️ {isPt ? 'Usar' : 'Use'}
                </button>
                <button
                  onClick={() => setPickingPet(true)}
                  disabled={targets.length === 0}
                  title={targets.length === 0
                    ? (isPt ? 'Nenhuma outra casinha tem pet ainda' : 'No other house has a pet yet')
                    : undefined}
                  style={{
                    flex: 1, minHeight: 56, borderRadius: 12, border: '2px solid var(--tk-accent, #7c3aed)',
                    background: 'transparent', color: 'var(--tk-text, #111827)', fontWeight: 800, fontSize: '0.95rem',
                    cursor: targets.length === 0 ? 'default' : 'pointer', opacity: targets.length === 0 ? 0.5 : 1,
                  }}
                >
                  🎀 {isPt ? 'Presentear' : 'Gift'}
                </button>
              </div>
            ) : (
              // Cada opção mostra o SPRITE do pet que vai receber
              <div style={{ display: 'flex', gap: 10 }}>
                {targets.map(t => (
                  <button key={t.index} onClick={() => setConfirmTarget(t)}
                    title={isPt ? `Presentear ${t.name}` : `Gift to ${t.name}`}
                    style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '10px 6px', borderRadius: 12,
                      border: `2px solid ${PROFILE_COLORS[t.index]}`,
                      background: 'var(--tk-card, #fff)', cursor: 'pointer',
                    }}
                  >
                    <img src={t.sprite} alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />
                    <span style={{ color: 'var(--tk-text, #111827)', fontWeight: 800, fontSize: '0.85rem' }}>{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Item grid */}
        <div style={{ overflowY: 'auto', padding: 16, flex: 1 }}>
          {items.length === 0 ? (
            <p style={{ color: 'var(--tk-muted, #9ca3af)', fontSize: '0.8rem', textAlign: 'center', padding: '32px 0' }}>
              {isPt ? 'Sem itens ainda — compre comida na loja!' : 'No items yet — buy food in the shop!'}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {items.map(([emoji, count]) => {
                const special = SPECIAL_ITEMS[emoji];
                const name = getFoodName(emoji, language);
                const isFed = justFed === emoji;
                return (
                  <button
                    key={emoji}
                    // Com doação disponível, tocar abre o menu Usar/Doar;
                    // sem ela, mantém o comportamento antigo (usa direto).
                    onClick={() => (onGiftFood ? setChosen(emoji) : feed(emoji))}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      padding: '14px 8px',
                      borderRadius: 'var(--tk-radius-sm, 14px)',
                      border: '1px solid var(--tk-border, #e5e7eb)',
                      background: 'var(--tk-soft, #f9fafb)',
                      cursor: 'pointer',
                      transform: isFed ? 'scale(0.94)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: '2rem', lineHeight: 1 }}>{emoji}</span>
                    <span style={{ color: 'var(--tk-text, #111827)', fontWeight: 700, fontSize: '0.78rem', textAlign: 'center' }}>
                      {name}
                    </span>
                    <span style={{ color: 'var(--tk-muted, #9ca3af)', fontSize: '0.65rem' }}>
                      {special?.kind === 'glitchtama'
                        ? `⭐+1 ${isPt ? 'dia perfeito' : 'perfect day'}`
                        : special?.kind === 'heart'
                          ? `❤️+${HEART_HEAL}`
                          : `⚡+1 ${isPt ? 'energia' : 'energy'}`}
                    </span>
                    <span
                      className="tk-keep-mono"
                      style={{ fontSize: '0.68rem', fontWeight: 700, color: '#111', background: '#eafbe7', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 999, padding: '1px 8px', marginTop: 2 }}
                    >
                      ×{count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
