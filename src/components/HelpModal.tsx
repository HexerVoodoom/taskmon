import { X } from 'lucide-react';
import { Language } from '../utils/i18n';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
}

const SECTIONS = [
  {
    titleEn: 'Your Taskmon',
    titlePt: 'Seu Taskmon',
    items: [
      {
        icon: '❤️',
        labelEn: 'HP (Hearts)',
        labelPt: 'HP (Corações)',
        descEn: 'Your pet\'s health. At day\'s end you lose hearts for what you left undone vs. the phase requirement; uncleaned poop drains 1 heart every 6h. Healed by rubbing (max 1 heart/day) or by using a Little Heart item (a rare dungeon drop). Reaches 0 → sleepy mode: the pet sleeps with half a heart but KEEPS its phase (heal to 1 heart to wake it). Once a week an automatic 🛡️ shield absorbs one rough day, and a day with no registered tasks is neutral (nothing lost).',
        descPt: 'A saúde do seu pet. Na virada do dia você perde corações pelo que faltou em relação ao requisito da fase; cocô não limpo tira 1 coração a cada 6h. Recupera esfregando (máx. 1 coração/dia) ou usando um Coraçãozinho (drop raro da masmorra). Chega a 0 → modo dorminhoco: o pet dorme com meio coração mas MANTÉM a fase (cure até 1 coração pra acordar). Uma vez por semana o 🛡️ escudo automático absorve um dia difícil, e dia sem tarefa cadastrada é neutro (não perde nada).',
      },
      {
        icon: '⚡',
        labelEn: 'Energy (right bar)',
        labelPt: 'Energia (barra lateral)',
        descEn: 'The number of bars equals your phase\'s task requirement (Phase 2: 5 tasks → 5 bars). Fills only by feeding from the Items menu and resets each day. Perfect day = complete your daily goal + FULL energy at day\'s end.',
        descPt: 'A quantidade de barras é igual ao requisito de tarefas da fase (Fase 2: 5 tarefas → 5 barras). Sobe apenas alimentando pelo menu Itens e zera todo dia. Dia perfeito = cumprir a meta diária + energia CHEIA no fim do dia.',
      },
    ],
  },
  {
    titleEn: 'Evolution',
    titlePt: 'Evolução',
    items: [
      {
        icon: '📊',
        labelEn: 'Perfect Days bar',
        labelPt: 'Barra de Dias Perfeitos',
        descEn: 'Each day you complete the required number of activities (with full energy) earns a Perfect Day. Fill the bar to evolve — Egg → Phase 1 → 2 → 3!',
        descPt: 'Cada dia em que você completa as atividades necessárias (com energia cheia) conta como Dia Perfeito. Encha a barra para evoluir — Ovo → Fase 1 → 2 → 3!',
      },
      {
        icon: '🏠',
        labelEn: '3 profiles (houses)',
        labelPt: '3 perfis (casinhas)',
        descEn: 'The 3 houses at the top are 3 separate saves, each with its own pet (Vix, Momo or Kiwi) and its own colors. Tap a house to switch; tap the active one to go home.',
        descPt: 'As 3 casinhas lá em cima são 3 saves separados, cada um com seu próprio pet (Vix, Momo ou Kiwi) e suas próprias cores. Toque numa casinha para trocar; toque na ativa para ir pra home.',
      },
      {
        icon: '🔒',
        labelEn: 'Evolution padlock',
        labelPt: 'Cadeado de evolução',
        descEn: 'On the Evolution page, tap your CURRENT pet to lock/unlock evolution. While locked it never evolves (perfect days still accumulate); unlock and it evolves at the next day turn.',
        descPt: 'Na página de Evolução, toque no seu pet ATUAL para travar/destravar a evolução. Travado, ele nunca evolui (os dias perfeitos continuam contando); destrave e ele evolui na próxima virada de dia.',
      },
      {
        icon: '🌀',
        labelEn: 'Glitchtama',
        labelPt: 'Glitchtama',
        descEn: 'Rare item earned by clearing all 5 dungeon floors. Using it from the Items folder grants 1 perfect day (an evolution point).',
        descPt: 'Item raro ganho ao concluir os 5 andares da masmorra. Usar na pastinha de itens concede 1 dia perfeito (um ponto de evolução).',
      },
      {
        icon: '🛒',
        labelEn: 'Shop',
        labelPt: 'Loja',
        descEn: 'Spend Bits on food of different types for your pet — same +1 energy as task-completion food.',
        descPt: 'Gaste Bits em comidas de tipos diferentes pro seu pet — mesmo +1 de energia da comida ganha ao completar tarefas.',
      },
      {
        icon: '💠',
        labelEn: 'Bits',
        labelPt: 'Bits',
        descEn: 'Every real task/activity completed gives +10 Bits right away. Minigames also give Bits, but capped per day: 20 base + 30 per real task done today — doing your tasks raises the cap!',
        descPt: 'Cada tarefa/atividade real concluída dá +10 Bits na hora. Minijogos também dão Bits, mas com teto diário: 20 base + 30 por tarefa real feita hoje — fazer as tarefas aumenta o limite!',
      },
      {
        icon: '🎁',
        labelEn: 'Real rewards',
        labelPt: 'Prêmios de verdade',
        descEn: 'The shop\'s Rewards tab has real-world prizes set up by your grown-up (pick the movie, extra story…). Redeeming shows a card — present it to claim your prize!',
        descPt: 'A aba Prêmios da loja tem recompensas do mundo real definidas pelo responsável (escolher o filme, história extra…). Resgatar mostra um cartão — apresente pra ganhar o prêmio!',
      },
      {
        icon: '🧺',
        labelEn: 'Family picnic',
        labelPt: 'Piquenique da família',
        descEn: 'In the together house: the real tasks completed by all 3 profiles add up each week. Reaching the goal (15) unlocks a picnic where the 3 pets celebrate together. Teamwork, never a ranking!',
        descPt: 'Na casinha coletiva: as tarefas reais dos 3 perfis somam durante a semana. Bater a meta (15) libera um piquenique onde os 3 pets celebram juntos. Trabalho em equipe, nunca ranking!',
      },
      {
        icon: '🎓',
        labelEn: 'Educational games',
        labelPt: 'Jogos educativos',
        descEn: 'Pet Market (math and coins) and Letter Hunt (letters and words), both with voice narration and a mode for little ones and another for big kids. 2 Bits per hit.',
        descPt: 'Feirinha dos Pets (matemática e moedas) e Caça-Letras (letras e palavras), os dois com narração por voz e um modo pros pequenos e outro pros grandes. 2 Bits por acerto.',
      },
      {
        icon: '🛡️',
        labelEn: 'Weekly shield',
        labelPt: 'Escudo semanal',
        descEn: 'Once a week, automatically, the shield absorbs one rough day: no hearts lost, perfect days kept. Recharges every Monday.',
        descPt: 'Uma vez por semana, automaticamente, o escudo segura um dia difícil: nenhum coração perdido, dias perfeitos preservados. Recarrega toda segunda-feira.',
      },
    ],
  },
  {
    titleEn: 'Daily Actions',
    titlePt: 'Ações do Dia',
    items: [
      {
        icon: '📁',
        labelEn: 'Items',
        labelPt: 'Itens',
        descEn: 'Your inventory. Food (task rewards or bought in the shop) refills energy (up to 5 feedings/hour). Dungeon-drop specials live here too: Little Hearts heal 1 HP and the Glitchtama grants a perfect day — neither counts against the food limit.',
        descPt: 'Seu inventário. Comida (recompensa de tarefas ou comprada na loja) enche energia (até 5 refeições/hora). Itens especiais da masmorra também ficam aqui: Coraçõezinhos curam 1 HP e o Glitchtama dá um dia perfeito — nenhum conta no limite de comida.',
      },
      {
        icon: '🚿',
        labelEn: 'Bath',
        labelPt: 'Banho',
        descEn: 'Give your pet a shower anytime. Cleans up active poop events (stopping the heart drain).',
        descPt: 'Dê banho no seu pet a qualquer hora. Limpa o cocô ativo (e para o dreno de coração).',
      },
      {
        icon: '🫶',
        labelEn: 'Affection (Rub)',
        labelPt: 'Carinho (esfregar)',
        descEn: 'Rub your pet (press and drag over it) to pop little hearts. The only way to heal HP: ~2s of rubbing = half a heart, up to 1 heart per day.',
        descPt: 'Esfregue seu pet (segure e arraste sobre ele) para soltar coraçõezinhos. Único jeito de curar HP: ~2s esfregando = meio coração, máx. 1 coração por dia.',
      },
      {
        icon: '💤',
        labelEn: 'Sleep',
        labelPt: 'Dormir',
        descEn: 'Let your pet rest. It won\'t poop while asleep, so sleeping overnight protects it from penalties.',
        descPt: 'Deixe seu pet descansar. Ele não faz cocô dormindo, então dormir à noite o protege de penalidades.',
      },
      {
        icon: '🚽',
        labelEn: 'Poop indicator',
        labelPt: 'Indicador de cocô',
        descEn: 'Shows when a poop event is approaching. Clean it via the Bath button.',
        descPt: 'Mostra quando um evento de cocô está chegando. Limpe pelo botão Banho.',
      },
    ],
  },
  {
    titleEn: 'Care Events',
    titlePt: 'Eventos de Cuidado',
    items: [
      {
        icon: '💩',
        labelEn: 'Poop event',
        labelPt: 'Evento de cocô',
        descEn: 'Appears up to twice a day (never while asleep). Give a bath to clean it. While left uncleaned it drains 1 heart every 6 hours.',
        descPt: 'Aparece até duas vezes por dia (nunca dormindo). Dê banho para limpar. Enquanto não limpo, tira 1 coração a cada 6 horas.',
      },
    ],
  },
];

export function HelpModal({ isOpen, onClose, language, theme = 'default' }: HelpModalProps) {
  if (!isOpen) return null;

  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-0">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200 ${
          isGlitch
            ? 'bg-[#0a0a0a] border-t-2 border-[#00ffff] text-[#00ffff]'
            : isWin98
            ? 'bg-[#c0c0c0] border-t-2 border-white'
            : 'bg-[#1a2230] text-white rounded-t-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 flex-shrink-0 ${
            isWin98
              ? 'bg-[linear-gradient(to_right,#000080,#1084d0)]'
              : isGlitch
              ? 'border-b border-[#00ffff]/30'
              : 'border-b border-white/10'
          }`}
        >
          <span
            className={`font-bold ${isWin98 ? 'text-white' : isGlitch ? 'text-[#00ffff]' : 'text-white'}`}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {isPt ? 'ℹ️ Ajuda' : 'ℹ️ Help'}
          </span>
          <button
            onClick={onClose}
            className={`p-1 ${isWin98 ? 'text-white hover:bg-[#000060]' : isGlitch ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-white/60 hover:text-white'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {SECTIONS.map(section => (
            <div key={section.titleEn}>
              <p
                className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                  isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-[#000080]' : 'text-[#2bff95]'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                {isPt ? section.titlePt : section.titleEn}
              </p>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div
                    key={item.labelEn}
                    className={`flex gap-3 p-2 rounded ${
                      isGlitch
                        ? 'bg-[#00ffff]/5 border border-[#00ffff]/20'
                        : isWin98
                        ? 'bg-white border border-[#808080]'
                        : 'bg-white/5'
                    }`}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                    <div>
                      <p
                        className={`font-bold text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-white'}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {isPt ? item.labelPt : item.labelEn}
                      </p>
                      <p
                        className={`text-xs mt-0.5 leading-snug ${isWin98 ? 'text-gray-700' : isGlitch ? 'text-[#00ff00]/80' : 'text-white/60'}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {isPt ? item.descPt : item.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer close button */}
        <div className={`flex-shrink-0 p-3 ${isWin98 ? 'border-t border-[#808080]' : 'border-t border-white/10'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 text-xs font-bold rounded ${
              isGlitch
                ? 'bg-[#00ffff] text-black'
                : isWin98
                ? 'bg-[#000080] text-white border-2 border-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {isPt ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
