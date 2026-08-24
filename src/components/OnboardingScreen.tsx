import { useState } from 'react';
import { PETS, petForProfile, type PetType } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';
import { ActivityCategory } from '../types/attributes';
import { getActiveProfile } from '../utils/storageKeys';

interface InitialActivity {
  name: string;
  category: ActivityCategory;
  emoji: string;
}

interface OnboardingScreenProps {
  onComplete: (data: {
    userName: string;
    eggType: PetType;
    initialActivities: InitialActivity[];
  }) => void;
}

const ispt = localStorage.getItem('digiapp-language') === 'pt-BR';

const INTRO_TEXTS = ispt ? [
  'Bem-vindo ao Taskmon! Em breve você vai conhecer seu parceiro que vai te ajudar a alcançar seus objetivos.',
  'Conforme você completa tarefas e atividades, ele cresce com você — do ovo até a forma final, em 3 fases.',
  'O destino de vocês dois está nas suas mãos!',
] : [
  'Welcome to Taskmon! Soon you will meet your partner who will help you achieve your goals.',
  'As you complete tasks and activities, it grows with you — from egg to final form, across 3 phases.',
  'Both your destinies are in your hands!',
];

// ── Challenge chips ──────────────────────────────────────────────────────────
interface Challenge { id: string; emoji: string; label: string }
const CHALLENGES: Challenge[] = [
  { id: 'sleep',        emoji: '💤', label: ispt ? 'Sono'         : 'Sleep' },
  { id: 'exercise',     emoji: '🏃', label: ispt ? 'Exercício'    : 'Exercise' },
  { id: 'study',        emoji: '📚', label: ispt ? 'Estudo'       : 'Study' },
  { id: 'work',         emoji: '💼', label: ispt ? 'Trabalho'     : 'Work' },
  { id: 'diet',         emoji: '🥗', label: ispt ? 'Alimentação'  : 'Diet' },
  { id: 'stress',       emoji: '😤', label: ispt ? 'Estresse'     : 'Stress' },
  { id: 'focus',        emoji: '🎯', label: ispt ? 'Foco'         : 'Focus' },
  { id: 'organization', emoji: '📋', label: ispt ? 'Organização'  : 'Organization' },
  { id: 'social',       emoji: '👥', label: ispt ? 'Social'       : 'Social' },
  { id: 'finances',     emoji: '💰', label: ispt ? 'Finanças'     : 'Finances' },
];

// ── Suggested activities pool ────────────────────────────────────────────────
interface Suggestion { name: string; emoji: string; category: ActivityCategory }
const POOL: Record<string, Suggestion[]> = {
  sleep: [
    { name: ispt ? 'Horário de dormir fixo'       : 'Consistent sleep time',    emoji: '🛏️', category: 'Wellness' },
    { name: ispt ? 'Sem tela 1h antes de dormir'  : 'No screens 1h before bed', emoji: '📵', category: 'Wellness' },
    { name: ispt ? 'Rotina matinal'               : 'Morning routine',          emoji: '🌅', category: 'Wellness' },
  ],
  exercise: [
    { name: ispt ? '30min de treino'    : '30min workout',     emoji: '🏋️', category: 'Fitness' },
    { name: ispt ? 'Caminhada 20min'    : 'Daily walk 20min',  emoji: '🚶', category: 'Fitness' },
    { name: ispt ? 'Alongamento 10min'  : 'Stretch 10min',     emoji: '🧘', category: 'Fitness' },
  ],
  study: [
    { name: ispt ? 'Estudar 1h'            : 'Study 1h',       emoji: '📖', category: 'Study' },
    { name: ispt ? 'Ler 20min'             : 'Read 20min',     emoji: '📚', category: 'Study' },
    { name: ispt ? 'Revisar anotações'     : 'Review notes',   emoji: '✏️', category: 'Study' },
  ],
  work: [
    { name: ispt ? 'Trabalho focado 90min' : 'Deep work 90min', emoji: '💻', category: 'Work' },
    { name: ispt ? 'Planejar amanhã'       : 'Plan next day',   emoji: '📅', category: 'Work' },
    { name: ispt ? 'Limpar inbox'          : 'Clear inbox',     emoji: '📬', category: 'Work' },
  ],
  diet: [
    { name: ispt ? 'Beber 2L de água'        : 'Drink 2L water',         emoji: '💧', category: 'Health' },
    { name: ispt ? 'Refeição saudável'        : 'Healthy meal',           emoji: '🥗', category: 'Health' },
    { name: ispt ? 'Sem ultraprocessado'      : 'No ultra-processed food',emoji: '🚫', category: 'Health' },
  ],
  stress: [
    { name: ispt ? 'Meditar 10min'  : 'Meditate 10min', emoji: '🧘', category: 'Wellness' },
    { name: ispt ? 'Diário 10min'   : 'Journal 10min',  emoji: '📓', category: 'Wellness' },
    { name: ispt ? '1h sem celular' : '1h phone-free',  emoji: '📵', category: 'Wellness' },
  ],
  focus: [
    { name: ispt ? 'Pomodoro 25min'      : 'Pomodoro 25min',       emoji: '🍅', category: 'Discipline' },
    { name: ispt ? 'Bloco de foco único' : 'Single-task block',    emoji: '🎯', category: 'Discipline' },
    { name: ispt ? 'Sem redes sociais'   : 'No social media today',emoji: '🔕', category: 'Discipline' },
  ],
  organization: [
    { name: ispt ? 'Limpar mesa'       : 'Clear desk',       emoji: '🗂️', category: 'Discipline' },
    { name: ispt ? 'Revisão semanal'   : 'Weekly review',    emoji: '📊', category: 'Discipline' },
    { name: ispt ? 'Lista de compras'  : 'Grocery list',     emoji: '📝', category: 'Discipline' },
  ],
  social: [
    { name: ispt ? 'Ligar para um amigo'               : 'Call a friend',            emoji: '📞', category: 'Social' },
    { name: ispt ? 'Tempo de qualidade com família'    : 'Quality time with family', emoji: '👨‍👩‍👧', category: 'Social' },
  ],
  finances: [
    { name: ispt ? 'Registrar gastos do dia'    : 'Track daily expenses',    emoji: '💳', category: 'Discipline' },
    { name: ispt ? 'Revisar orçamento mensal'   : 'Review monthly budget',   emoji: '💰', category: 'Discipline' },
  ],
};

// ── Component ────────────────────────────────────────────────────────────────
export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<'name' | 'egg' | 'intro' | 'goals'>('name');
  const [introIndex, setIntroIndex] = useState(0);
  const [userName, setUserName] = useState('');
  // O bichinho NÃO é escolhível: cada habitat (casinha) tem o seu —
  // 0 gótico → Vix, 1 Grécia Antiga → Momo, 2 Mad Max → Kiwi.
  const selectedEgg: PetType = petForProfile(getActiveProfile());

  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set());

  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  const [randomName] = useState(`obs-${Math.random().toString(36).substring(7)}`);

  const accent = PETS[selectedEgg].accent;

  const handleNameSubmit = () => { if (userName.trim()) setStep('egg'); };
  const handleEggConfirm = () => setStep('intro');
  const handleIntroNext = () => {
    if (introIndex < INTRO_TEXTS.length - 1) setIntroIndex(introIndex + 1);
    else setStep('goals');
  };
  const handleBack = () => {
    if (step === 'egg') setStep('name');
    else if (step === 'intro') { setIntroIndex(0); setStep('egg'); }
    else if (step === 'goals') { setIntroIndex(0); setStep('intro'); }
  };

  const toggleChallenge = (id: string) => {
    setSelectedChallenges(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // Remove activities belonging only to this challenge
        const otherChallenges = [...next];
        const stillAvailable = new Set(otherChallenges.flatMap(c => POOL[c]?.map(a => a.name) ?? []));
        setSelectedActivities(prevActs => {
          const filtered = new Set<string>();
          prevActs.forEach(n => { if (stillAvailable.has(n)) filtered.add(n); });
          return filtered;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleActivity = (name: string) => {
    setSelectedActivities(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  // Build deduplicated pool from selected challenges
  const poolItems: Suggestion[] = [];
  const seen = new Set<string>();
  selectedChallenges.forEach(id => {
    (POOL[id] ?? []).forEach(s => {
      if (!seen.has(s.name)) { seen.add(s.name); poolItems.push(s); }
    });
  });

  const handleConfirmGoals = () => {
    const activities: InitialActivity[] = poolItems
      .filter(s => selectedActivities.has(s.name))
      .map(s => ({ name: s.name, category: s.category, emoji: s.emoji }));

    // Require at least one selection
    if (activities.length === 0) return;

    onComplete({ userName, eggType: selectedEgg, initialActivities: activities });
  };

  // ── Estilo Duolingo: cartões arredondados, botão "3D" com sombra dura ─────
  const card: React.CSSProperties = {
    backgroundColor: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: 20,
    boxShadow: '0 2px 0 #e5e7eb',
  };
  const primaryBtn = (disabled = false): React.CSSProperties => ({
    width: '100%',
    padding: '14px 0',
    borderRadius: 16,
    border: 'none',
    backgroundColor: disabled ? '#d1d5db' : accent,
    color: '#fff',
    fontWeight: 800,
    fontSize: '0.95rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : '0 4px 0 rgba(0,0,0,0.18)',
    transition: 'transform 0.06s, box-shadow 0.06s',
  });

  const stepIndex = ['name', 'egg', 'intro', 'goals'].indexOf(step);

  return (
    <div className="relative w-full min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f0fdf4 100%)' }}>
      <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-8 max-w-md mx-auto w-full gap-6">

        {/* Progresso (4 passos) */}
        <div className="w-full flex gap-2 pt-1">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="flex-1 h-2 rounded-full transition-all"
                 style={{ backgroundColor: i <= stepIndex ? accent : '#e5e7eb' }} />
          ))}
        </div>

        {/* ── Top Content Area ───────────────────────────────────────────── */}
        <div className="w-full flex-1 flex items-center justify-center">

          {/* Step: name */}
          {step === 'name' && (
            <div className="w-full space-y-5 max-w-[320px]">
              <div className="text-center space-y-2">
                <div className="text-5xl">🥚</div>
                <h1 className="font-extrabold" style={{ fontSize: '1.5rem', color: '#111827' }}>Taskmon</h1>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {ispt ? 'Complete tarefas reais. Evolua seu bichinho.' : 'Complete real tasks. Evolve your pet.'}
                </p>
              </div>
              <div style={card} className="p-4">
                <input
                  type="text"
                  autoComplete="new-password"
                  data-form-type="other"
                  spellCheck="false"
                  autoCapitalize="off"
                  name={randomName}
                  id={randomName}
                  readOnly={isInputReadOnly}
                  onFocus={() => setIsInputReadOnly(false)}
                  onBlur={() => setIsInputReadOnly(true)}
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleNameSubmit()}
                  maxLength={30}
                  placeholder={ispt ? 'seu nome' : 'your name'}
                  className="w-full px-2 py-2 bg-transparent text-center border-0 outline-none"
                  style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}
                  autoFocus
                />
              </div>
              <button onClick={handleNameSubmit} disabled={!userName.trim()} style={primaryBtn(!userName.trim())}>
                {ispt ? 'continuar' : 'continue'}
              </button>
            </div>
          )}

          {/* Step: egg — o pet do habitat, sem escolha */}
          {step === 'egg' && (
            <div className="w-full max-w-[340px] space-y-5">
              <div className="text-center space-y-1">
                <h2 className="font-extrabold" style={{ fontSize: '1.25rem', color: '#111827' }}>
                  {ispt ? 'Seu ovo chegou!' : 'Your egg has arrived!'}
                </h2>
                <p className="text-xs" style={{ color: '#9ca3af' }}>
                  {ispt
                    ? 'Cada casinha tem o seu bichinho — esse é o desta casinha'
                    : 'Each house has its own pet — this one is yours'}
                </p>
              </div>
              <div style={card} className="p-5 flex flex-col items-center gap-2">
                <img
                  src={getSpriteForStage('egg', selectedEgg)}
                  alt={ispt ? PETS[selectedEgg].eggNamePt : PETS[selectedEgg].eggNameEn}
                  className="w-24 h-24 object-contain"
                />
                <p className="text-sm font-extrabold" style={{ color: accent }}>
                  {ispt ? PETS[selectedEgg].eggNamePt : PETS[selectedEgg].eggNameEn}
                </p>
              </div>
              {/* Preview do pet do habitat */}
              <div style={card} className="p-4 flex items-center gap-3">
                <img src={getSpriteForStage(PETS[selectedEgg].phases[1])} alt={PETS[selectedEgg].name} className="w-14 h-14 object-contain" />
                <div>
                  <p className="text-sm font-extrabold" style={{ color: '#111827' }}>{PETS[selectedEgg].name}</p>
                  <p className="text-xs" style={{ color: '#6b7280' }}>
                    {`${PETS[selectedEgg].phaseNames[0]} → ${PETS[selectedEgg].phaseNames[1]} → ${PETS[selectedEgg].phaseNames[2]}`}
                  </p>
                </div>
              </div>
              <button onClick={handleEggConfirm} style={primaryBtn()}>
                {ispt ? 'continuar' : 'continue'}
              </button>
            </div>
          )}

          {/* Step: intro */}
          {step === 'intro' && (
            <div className="w-full space-y-5 max-w-[320px]">
              <div style={card} className="px-6 py-8 min-h-[180px] flex flex-col items-center justify-center gap-4">
                <img src={getSpriteForStage('egg', selectedEgg)} alt="" className="w-16 h-16 object-contain" />
                <p className="text-center text-sm" style={{ color: '#374151', lineHeight: 1.6 }}>
                  {INTRO_TEXTS[introIndex]}
                </p>
              </div>
              <button onClick={handleIntroNext} style={primaryBtn()}>
                {ispt ? 'continuar' : 'continue'}
              </button>
            </div>
          )}

          {/* Step: goals (challenge + activity suggestions) */}
          {step === 'goals' && (
            <div className="w-full max-w-[340px] space-y-4">
              <div style={card} className="px-5 py-5">
                {/* Challenge chips */}
                <p className="text-sm mb-3 font-extrabold" style={{ color: '#111827' }}>
                  {ispt ? 'O que te desafia?' : 'What challenges you?'}
                </p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {CHALLENGES.map(c => {
                    const active = selectedChallenges.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleChallenge(c.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                          border: `2px solid ${active ? accent : '#e5e7eb'}`,
                          backgroundColor: active ? accent : '#fff',
                          color: active ? '#fff' : '#6b7280',
                        }}
                      >
                        {c.emoji} {c.label}
                      </button>
                    );
                  })}
                </div>

                {/* Activity pool */}
                {poolItems.length > 0 && (
                  <>
                    <p className="text-sm mb-3 font-extrabold" style={{ color: '#111827' }}>
                      {ispt ? 'Selecione suas atividades:' : 'Pick your activities:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {poolItems.map(s => {
                        const active = selectedActivities.has(s.name);
                        return (
                          <button
                            key={s.name}
                            onClick={() => toggleActivity(s.name)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left"
                            style={{
                              border: `2px solid ${active ? accent : '#e5e7eb'}`,
                              backgroundColor: active ? `${accent}14` : '#fff',
                              color: active ? '#111827' : '#6b7280',
                            }}
                          >
                            {s.emoji} {s.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {selectedChallenges.size === 0 && (
                  <p className="text-xs text-center py-4" style={{ color: '#9ca3af' }}>
                    {ispt ? '↑ selecione ao menos um desafio' : '↑ select at least one challenge'}
                  </p>
                )}
              </div>

              <button
                onClick={handleConfirmGoals}
                disabled={selectedActivities.size === 0}
                style={primaryBtn(selectedActivities.size === 0)}
              >
                {ispt ? 'começar →' : 'start →'}
              </button>
            </div>
          )}
        </div>

        {/* ── Back button (all steps except name) ──────────────────────── */}
        {step !== 'name' && (
          <div className="w-full flex justify-start">
            <button
              onClick={handleBack}
              className="text-sm font-bold transition-colors"
              style={{ color: '#9ca3af' }}
            >
              ← {ispt ? 'voltar' : 'back'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
