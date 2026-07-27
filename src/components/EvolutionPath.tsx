import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { PETS, FORM_REQUIREMENTS, getStageLevel, stageForLevel, type PetType, type EvolutionStage } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';

interface EvolutionPathProps {
  /** Forma atual (id, ex.: 'vix-2' ou 'egg'). */
  evolutionStage: string;
  eggType?: PetType;
  perfectDays?: number;
  unlockedEvolutions?: string[];
  /** Cadeado de evolução: tocar na forma ATUAL alterna. */
  evolutionLocked?: boolean;
  onToggleEvolutionLock?: () => void;
  /** Regressão manual para uma forma anterior (recebe o id da forma). */
  onDegenerate?: (targetStage: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  language?: 'pt-BR' | 'en-US';
}

const LEVELS: EvolutionStage[] = ['egg', 'fase-1', 'fase-2', 'fase-3'];

export function EvolutionPath({
  evolutionStage,
  eggType = 'vix',
  perfectDays = 0,
  unlockedEvolutions = [],
  evolutionLocked = false,
  onToggleEvolutionLock,
  onDegenerate,
  language = 'en-US',
}: EvolutionPathProps) {
  const isPt = language === 'pt-BR';
  const pet = PETS[eggType] ?? PETS.vix;
  const accent = pet.accent;
  const currentLevel = getStageLevel(evolutionStage);
  const currentIdx = LEVELS.indexOf(currentLevel);
  const unlockedSet = useMemo(() => new Set(unlockedEvolutions), [unlockedEvolutions]);
  const [confirmDegenerate, setConfirmDegenerate] = useState<{ stage: string; name: string; isSecondConfirm: boolean } | null>(null);
  // Formas futuras (ainda não alcançadas) ficam ocultas — tocar no ícone
  // revela qual é; como é estado local do componente, sair da tela (unmount)
  // reverte tudo automaticamente.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const toggleReveal = (stageId: string) => {
    setRevealed(prev => {
      const next = new Set(prev);
      next.has(stageId) ? next.delete(stageId) : next.add(stageId);
      return next;
    });
  };

  const required = FORM_REQUIREMENTS[currentLevel].required;
  const isFinal = currentLevel === 'fase-3';

  const handleDegenerateConfirm = () => {
    if (!confirmDegenerate) return;
    if (confirmDegenerate.isSecondConfirm) {
      onDegenerate?.(confirmDegenerate.stage);
      setConfirmDegenerate(null);
    } else {
      setConfirmDegenerate({ ...confirmDegenerate, isSecondConfirm: true });
    }
  };

  const steps = LEVELS.map((level, idx) => {
    const stageId = stageForLevel(pet.id, level);
    const name = level === 'egg'
      ? (isPt ? 'Ovo' : 'Egg')
      : pet.phaseNames[Number(level.slice(-1)) - 1];
    const subtitle = level === 'egg'
      ? (isPt ? 'Onde tudo começa' : 'Where it all begins')
      : (isPt ? `Fase ${level.slice(-1)}` : `Phase ${level.slice(-1)}`);
    const isFuture = idx > currentIdx && !unlockedSet.has(stageId);
    return {
      level, stageId, name, subtitle,
      isCurrent: idx === currentIdx,
      isPast: idx < currentIdx,
      isFuture,
      isRevealed: isFuture && revealed.has(stageId),
    };
  });

  return (
    <div className="max-w-md mx-auto">
      {/* Confirmação de regressão */}
      {confirmDegenerate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in-95 duration-150" style={{ backgroundColor: 'var(--tk-card, #fff)' }}>
            <h3 className="text-lg mb-4 font-bold" style={{ color: 'var(--tk-text, #111)' }}>
              {confirmDegenerate.isSecondConfirm
                ? (isPt ? '⚠️ ÚLTIMO AVISO!' : '⚠️ FINAL WARNING!')
                : (isPt ? '⚠️ Confirmar regressão' : '⚠️ Confirm regression')}
            </h3>
            <p className="mb-6 text-sm" style={{ color: 'var(--tk-muted, #555)' }}>
              {confirmDegenerate.isSecondConfirm
                ? (isPt
                    ? `Tem CERTEZA ABSOLUTA que quer voltar para ${confirmDegenerate.name}? Isso NÃO pode ser desfeito!`
                    : `Are you ABSOLUTELY SURE you want to go back to ${confirmDegenerate.name}? This CANNOT be undone!`)
                : (isPt
                    ? `Quer voltar para ${confirmDegenerate.name}? Você perde o progresso além dessa fase.`
                    : `Go back to ${confirmDegenerate.name}? You'll lose progress beyond this phase.`)}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDegenerate(null)}
                className="flex-1 py-2.5 rounded-xl transition-colors text-sm font-bold"
                style={{ backgroundColor: 'var(--tk-soft, #eee)', color: 'var(--tk-text, #333)' }}
              >
                {isPt ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                onClick={handleDegenerateConfirm}
                className={`flex-1 py-2.5 text-white rounded-xl transition-colors text-sm font-bold ${
                  confirmDegenerate.isSecondConfirm ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                {confirmDegenerate.isSecondConfirm ? (isPt ? 'SIM, VOLTAR!' : 'YES, GO BACK!') : (isPt ? 'Confirmar' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progresso de dias perfeitos até a próxima fase */}
      <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--tk-card, #fff)', border: '2px solid var(--tk-border, #e5e7eb)' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-bold" style={{ color: 'var(--tk-text, #333)' }}>
            {isFinal
              ? (isPt ? '🏆 Forma final alcançada!' : '🏆 Final form reached!')
              : (isPt ? '⭐ Dias perfeitos para evoluir' : '⭐ Perfect days to evolve')}
          </p>
          {!isFinal && (
            <span className="text-sm font-extrabold" style={{ color: accent }}>
              {Math.min(perfectDays, required)}/{required}
            </span>
          )}
        </div>
        {!isFinal && (
          <div className="h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--tk-soft, #f3f4f6)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (perfectDays / required) * 100)}%`, backgroundColor: accent }}
            />
          </div>
        )}
        <p className="text-xs mt-2" style={{ color: 'var(--tk-muted, #888)' }}>
          {isFinal
            ? (isPt ? `${pet.phaseNames[2]} é a última fase do ${pet.name}. Continue cuidando bem!` : `${pet.phaseNames[2]} is ${pet.name}'s last phase. Keep up the good care!`)
            : (isPt
                ? `Dia perfeito = meta de tarefas batida + energia cheia no fim do dia.`
                : `Perfect day = task goal met + full energy at the end of the day.`)}
        </p>
      </div>

      {/* Linha evolutiva linear */}
      <div className="space-y-1">
        {steps.map((step, idx) => (
          <div key={step.stageId + idx}>
            <div
              className="rounded-2xl p-4 transition-all"
              style={{
                backgroundColor: 'var(--tk-card, #fff)',
                border: step.isCurrent ? `2.5px solid ${accent}` : '2px solid var(--tk-border, #e5e7eb)',
                boxShadow: step.isCurrent ? `0 4px 14px ${accent}33` : 'none',
                opacity: step.isFuture ? 0.6 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                {/* Sprite — a forma atual alterna o cadeado; futuras aparecem em silhueta */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: step.isCurrent ? `${accent}18` : 'var(--tk-soft, #f3f4f6)' }}
                >
                  {step.isCurrent && onToggleEvolutionLock ? (
                    <button
                      onClick={onToggleEvolutionLock}
                      aria-label={isPt ? 'Alternar cadeado de evolução' : 'Toggle evolution padlock'}
                      title={evolutionLocked
                        ? (isPt ? 'Destravar evolução' : 'Unlock evolution')
                        : (isPt ? 'Travar evolução' : 'Lock evolution')}
                      className="relative flex items-center justify-center rounded-xl cursor-pointer"
                      style={{ width: '3.5rem', height: '3.5rem' }}
                    >
                      <img
                        src={getSpriteForStage(step.stageId, pet.id)}
                        alt={step.name}
                        className="object-contain"
                        style={{ width: '3.5rem', height: '3.5rem', filter: evolutionLocked ? 'grayscale(0.7) brightness(0.75)' : 'none' }}
                      />
                      {evolutionLocked && (
                        <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: '1.5rem', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                          🔒
                        </span>
                      )}
                    </button>
                  ) : step.isFuture ? (
                    <button
                      onClick={() => toggleReveal(step.stageId)}
                      aria-label={step.isRevealed
                        ? (isPt ? 'Ocultar forma futura' : 'Hide future form')
                        : (isPt ? 'Revelar forma futura' : 'Reveal future form')}
                      title={step.isRevealed
                        ? (isPt ? 'Toque para ocultar' : 'Tap to hide')
                        : (isPt ? 'Toque para revelar' : 'Tap to reveal')}
                      className="flex items-center justify-center rounded-xl cursor-pointer"
                      style={{ width: '3.5rem', height: '3.5rem' }}
                    >
                      <img
                        src={getSpriteForStage(step.stageId, pet.id)}
                        alt={step.isRevealed ? step.name : '???'}
                        className="object-contain"
                        style={{ width: '3.5rem', height: '3.5rem', filter: step.isRevealed ? 'none' : 'brightness(0) opacity(0.25)' }}
                      />
                    </button>
                  ) : (
                    <img
                      src={getSpriteForStage(step.stageId, pet.id)}
                      alt={step.name}
                      className="w-14 h-14 object-contain"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold tk-display" style={{ color: step.isFuture && !step.isRevealed ? 'var(--tk-muted, #999)' : 'var(--tk-text, #111)', fontSize: '1rem' }}>
                      {step.isFuture && !step.isRevealed ? '???' : step.name}
                    </h3>
                    {step.isCurrent && (
                      <span className="text-white text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: accent }}>
                        {isPt ? 'ATUAL' : 'CURRENT'}
                      </span>
                    )}
                    {step.isCurrent && evolutionLocked && (
                      <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        🔒 {isPt ? 'TRAVADA' : 'LOCKED'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--tk-muted, #888)' }}>{step.subtitle}</p>
                </div>

                {/* Ação: voltar para fase anterior */}
                {step.isPast && step.level !== 'egg' && onDegenerate && (
                  <button
                    onClick={() => setConfirmDegenerate({ stage: step.stageId, name: step.name, isSecondConfirm: false })}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                    style={{ backgroundColor: 'var(--tk-soft, #eee)', color: 'var(--tk-muted, #666)' }}
                  >
                    {isPt ? 'Voltar' : 'Go back'}
                  </button>
                )}
              </div>
            </div>

            {idx < steps.length - 1 && (
              <div className="flex justify-center py-0.5">
                <ChevronDown size={20} style={{ color: idx < currentIdx ? accent : 'var(--tk-muted, #bbb)' }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
