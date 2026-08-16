import { useMemo, useState } from 'react';
import { getSpriteForStage } from '../utils/sprites';
import { playTaskComplete, playFeed, playDegenerate } from '../utils/sounds';
import { PETS, type PetType } from '../types/progression';
import type { Language } from '../utils/i18n';

/**
 * 🧺 Feirinha dos Pets — minijogo EDUCATIVO de matemática/dinheiro.
 * O pet do jogador abre uma banquinha e os pets das irmãs vêm comprar
 * (interação entre os 3 pets). Dois modos por idade:
 *  - 🐣 Pequenos (contar): o freguês pede N frutas; a criança toca as frutas
 *    uma a uma na cesta. Com narração por voz (pré-leitores).
 *  - 🦸 Grandes (somar): o pedido custa X Bits; pagar tocando moedas de
 *    1/5/10 até somar o valor exato (alfabetização financeira — casa com a
 *    economia de Bits/prêmios do app).
 * Recompensa modesta: +2 Bits por pedido certo (educativo, não farmável).
 */
const ROUNDS = 8;
const HIT_BITS = 2;
const FRUITS = ['🍎', '🍌', '🍇', '🍊', '🍓'];

function speakLine(text: string, language: Language) {
  try {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = language === 'pt-BR' ? 'pt-BR' : 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch { /* noop */ }
}

export function FeirinhaGame({ eggType, language, onEarnPoints, onExit }: {
  eggType?: string;
  language: Language;
  onEarnPoints: (pts: number) => void;
  onExit: () => void;
}) {
  const isPt = language === 'pt-BR';
  const mono = { fontFamily: 'monospace' as const };
  const myPet = (PETS[eggType as PetType] ? eggType : 'vix') as PetType;
  // Os OUTROS dois pets são os fregueses da banquinha.
  const customers = useMemo(
    () => (Object.keys(PETS) as PetType[]).filter(p => p !== myPet),
    [myPet],
  );

  const [mode, setMode] = useState<'count' | 'pay' | null>(null);
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [order, setOrder] = useState<{ fruit: string; qty: number; price: number }>({ fruit: '🍎', qty: 2, price: 7 });
  const [basket, setBasket] = useState(0);
  const [paid, setPaid] = useState(0);
  const [feedback, setFeedback] = useState<'ok' | 'no' | null>(null);
  const [done, setDone] = useState(false);

  const customer = customers[round % customers.length];
  const customerName = PETS[customer].name;

  const newOrder = (r: number, m: 'count' | 'pay') => {
    const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const qty = 1 + Math.floor(Math.random() * 5);
    // Preço = quantidade × preço unitário (2–5) — a conta mostrada é
    // verdadeira, e qualquer valor é pagável com moedas 1/5/10.
    const unit = 2 + Math.floor(Math.random() * 4);
    const price = qty * unit;
    setOrder({ fruit, qty, price });
    setBasket(0);
    setPaid(0);
    setFeedback(null);
    const nm = PETS[customers[r % customers.length]].name;
    if (m === 'count') {
      speakLine(isPt ? `${nm} quer ${qty} ${qty === 1 ? 'fruta' : 'frutas'}!` : `${nm} wants ${qty} ${qty === 1 ? 'fruit' : 'fruits'}!`, language);
    } else {
      speakLine(isPt ? `O pedido custa ${price} Bits.` : `The order costs ${price} Bits.`, language);
    }
  };

  const start = (m: 'count' | 'pay') => { setMode(m); setRound(0); setHits(0); setDone(false); newOrder(0, m); };

  const resolve = (correct: boolean) => {
    setFeedback(correct ? 'ok' : 'no');
    if (correct) { playTaskComplete(); onEarnPoints(HIT_BITS); setHits(h => h + 1); }
    else playDegenerate();
    setTimeout(() => {
      const next = round + 1;
      if (next >= ROUNDS) { setDone(true); playFeed(); }
      else { setRound(next); newOrder(next, mode!); }
    }, 1100);
  };

  const addFruit = () => {
    if (feedback) return;
    playFeed();
    const n = basket + 1;
    setBasket(n);
    speakLine(String(n), language);
  };

  const addCoin = (v: number) => {
    if (feedback) return;
    const n = paid + v;
    setPaid(n);
    if (n === order.price) resolve(true);
    else if (n > order.price) resolve(false);
  };

  const panel = (children: React.ReactNode) => (
    <div style={{ position: 'fixed', inset: 0, zIndex: 120, background: '#1a2e1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 16 }} className="tk-keep-mono">
      <button onClick={onExit} aria-label={isPt ? 'Sair' : 'Exit'} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: 38, height: 38, color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}>✕</button>
      {children}
    </div>
  );

  if (!mode) {
    return panel(<>
      <span style={{ fontSize: '3.2rem' }}>🧺</span>
      <h2 style={{ ...mono, color: '#a3e635', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Feirinha dos Pets' : 'Pet Market'}</h2>
      <p style={{ ...mono, color: '#d9f99d', fontSize: '0.92rem', textAlign: 'center', maxWidth: 300, margin: 0 }}>
        {isPt ? 'Seu pet abriu uma banquinha — e os pets da família vêm comprar!' : 'Your pet opened a stall — and the family pets come shopping!'}
      </p>
      <button onClick={() => start('count')} style={{ ...mono, minWidth: 260, minHeight: 76, borderRadius: 18, border: 'none', background: '#65a30d', color: '#fff', fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer' }}>
        🐣 {isPt ? 'Contar frutinhas' : 'Count the fruits'}
      </button>
      <button onClick={() => start('pay')} style={{ ...mono, minWidth: 260, minHeight: 76, borderRadius: 18, border: 'none', background: '#4d7c0f', color: '#fff', fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer' }}>
        🦸 {isPt ? 'Pagar com moedas' : 'Pay with coins'}
      </button>
    </>);
  }

  if (done) {
    return panel(<>
      <span style={{ fontSize: '3.2rem' }}>🎉</span>
      <h2 style={{ ...mono, color: '#a3e635', fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{isPt ? 'Feira encerrada!' : 'Market closed!'}</h2>
      <p style={{ ...mono, color: '#d9f99d', fontSize: '1.1rem', margin: 0 }}>
        {isPt ? `${hits}/${ROUNDS} pedidos certos · +${hits * HIT_BITS} Bits` : `${hits}/${ROUNDS} orders right · +${hits * HIT_BITS} Bits`}
      </p>
      <button onClick={() => setMode(null)} style={{ ...mono, minWidth: 220, minHeight: 60, borderRadius: 16, border: 'none', background: '#65a30d', color: '#fff', fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer' }}>
        {isPt ? 'Jogar de novo' : 'Play again'}
      </button>
    </>);
  }

  return panel(<>
    <p style={{ ...mono, color: '#d9f99d', fontSize: '0.85rem', margin: 0 }}>{isPt ? 'Pedido' : 'Order'} {round + 1}/{ROUNDS} · ⭐ {hits}</p>

    {/* A banquinha: freguês de um lado, vendedor do outro */}
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <img src={getSpriteForStage(`${customer}-1`)} alt={customerName} style={{ width: 108, height: 108, imageRendering: 'pixelated' }} />
        <p style={{ ...mono, color: '#fff', fontSize: '0.82rem', margin: 0 }}>{customerName}</p>
      </div>
      <div style={{ fontSize: '2.4rem', paddingBottom: 26 }}>🛒</div>
      <div style={{ textAlign: 'center' }}>
        <img src={getSpriteForStage(`${myPet}-1`)} alt="" style={{ width: 108, height: 108, imageRendering: 'pixelated', transform: 'scaleX(-1)' }} />
        <p style={{ ...mono, color: '#fff', fontSize: '0.82rem', margin: 0 }}>{isPt ? 'sua banquinha' : 'your stall'}</p>
      </div>
    </div>

    {/* Balão do pedido — a PERGUNTA é o elemento mais importante da tela:
        fonte bem grande, com o número em destaque ainda maior. */}
    <div style={{ background: '#fff', borderRadius: 18, padding: '16px 20px', textAlign: 'center', minWidth: 260, maxWidth: '94vw' }}>
      {mode === 'count' ? (
        <p style={{ ...mono, color: '#111', fontSize: '1.5rem', lineHeight: 1.25, fontWeight: 800, margin: 0 }}>
          {isPt ? 'Quero' : 'I want'} <span style={{ fontSize: '2.4rem', color: '#4d7c0f' }}>{order.qty}</span> <span style={{ fontSize: '2rem' }}>{order.fruit}</span>
          {isPt ? ', por favor!' : ', please!'}
        </p>
      ) : (
        <p style={{ ...mono, color: '#111', fontSize: '2rem', lineHeight: 1.25, fontWeight: 800, margin: 0 }}>
          {order.qty} {order.fruit} = <span style={{ color: '#4d7c0f' }}>{order.price}</span>
          <span style={{ fontSize: '1.3rem' }}> Bits</span>
        </p>
      )}
      <button onClick={() => (mode === 'count'
        ? speakLine(isPt ? `Quero ${order.qty} frutas` : `I want ${order.qty} fruits`, language)
        : speakLine(isPt ? `Custa ${order.price} Bits` : `It costs ${order.price} Bits`, language))}
        aria-label={isPt ? 'Ouvir pedido' : 'Hear order'}
        style={{ border: 'none', background: 'transparent', fontSize: '1.8rem', cursor: 'pointer', marginTop: 4 }}>🔊</button>
    </div>

    {feedback && (
      <p style={{ ...mono, fontSize: '1.7rem', fontWeight: 800, color: feedback === 'ok' ? '#a3e635' : '#f87171', margin: 0 }}>
        {feedback === 'ok' ? (isPt ? 'Isso! 🎉' : 'Yes! 🎉') : (isPt ? 'Quase! 💚' : 'Almost! 💚')}
      </p>
    )}

    {mode === 'count' ? (<>
      {/* Cesta com contagem falada — alvos grandes (≥75px, NN/g) */}
      <div style={{ ...mono, color: '#fff', fontSize: '1.6rem', minHeight: 40 }}>
        {Array.from({ length: basket }, () => order.fruit).join(' ')}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <button onClick={addFruit} disabled={!!feedback}
          style={{ width: 100, height: 100, borderRadius: 22, border: 'none', background: '#365314', fontSize: '2.6rem', cursor: 'pointer' }}>
          {order.fruit}
        </button>
        <button onClick={() => resolve(basket === order.qty)} disabled={!!feedback || basket === 0}
          style={{ ...mono, width: 130, height: 100, borderRadius: 22, border: 'none', background: '#65a30d', color: '#fff', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer' }}>
          {isPt ? 'Entregar!' : 'Deliver!'}
        </button>
      </div>
    </>) : (<>
      <p style={{ ...mono, color: '#fff', fontSize: '1.15rem', margin: 0 }}>
        {isPt ? 'Pago' : 'Paid'}: <strong>{paid}</strong> / {order.price}
      </p>
      <div style={{ display: 'flex', gap: 14 }}>
        {[1, 5, 10].map(v => (
          <button key={v} onClick={() => addCoin(v)} disabled={!!feedback}
            style={{ ...mono, width: 92, height: 92, borderRadius: '50%', border: '3px solid #facc15', background: '#a16207', color: '#fff', fontSize: '1.3rem', fontWeight: 800, cursor: 'pointer' }}>
            {v}
          </button>
        ))}
      </div>
    </>)}
  </>);
}
