import { useMemo } from 'react';
import { X, Users, Plus } from 'lucide-react';
import { getStageLevel } from '../types/progression';
import { DIGIMON_STAGE_NAMES } from '../constants/labels';
import { getActiveProfile, setActiveProfile, PROFILE_COUNT } from '../utils/storageKeys';
import { getProfileSummary } from '../utils/profiles';
import type { Language } from '../utils/i18n';

interface ProfileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'default' | 'win98' | 'glitch';
  language: Language;
}

const STAGE_EMOJI: Record<string, string> = {
  digiegg: '🥚',
  'baby-i': '🐣',
  'baby-ii': '🐥',
  rookie: '⚔️',
  champion: '🛡️',
  ultimate: '✨',
  mega: '👑',
  ultra: '🌟',
};

export function ProfileHubModal({ isOpen, onClose, theme = 'default', language }: ProfileHubModalProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const isPt = language === 'pt-BR';

  // Re-read on every open so a profile just played elsewhere shows fresh data.
  const activeProfile = useMemo(() => (isOpen ? getActiveProfile() : 0), [isOpen]);
  const summaries = useMemo(
    () => (isOpen ? Array.from({ length: PROFILE_COUNT }, (_, i) => getProfileSummary(i)) : []),
    [isOpen]
  );

  if (!isOpen) return null;

  const handleSelect = (index: number) => {
    if (index === activeProfile) {
      onClose();
      return;
    }
    setActiveProfile(index);
    window.location.reload();
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl ${
        isGlitch ? 'glitch-container' : isWin98 ? 'win98-container' : 'modern-container bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isGlitch ? 'glitch-header' : isWin98 ? 'win98-header' : 'modern-header border-gray-200'
        }`}>
          <div className="flex items-center gap-2">
            <Users size={20} className={isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-teal-600'} />
            <h2 className={isGlitch ? 'glitch-title' : isWin98 ? 'win98-title' : 'modern-title'} style={{ fontFamily: 'monospace' }}>
              {isPt ? '👥 Hub de Perfis' : '👥 Profile Hub'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded transition-colors ${isGlitch ? 'glitch-button' : isWin98 ? 'win98-button' : 'hover:bg-gray-200'}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className={`p-4 space-y-3 ${isGlitch ? 'bg-[#0a0a0a]' : isWin98 ? 'bg-[#c0c0c0]' : 'bg-white'}`}>
          <p className={`text-xs ${isGlitch ? 'text-[#00ffff]/70' : isWin98 ? 'text-[#000000]' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
            {isPt
              ? 'Três saves independentes na mesma instalação. Toque num perfil para trocar.'
              : 'Three independent saves on the same install. Tap a profile to switch.'}
          </p>

          {summaries.map((summary) => {
            const isActive = summary.index === activeProfile;
            const level = getStageLevel(summary.evolutionStage);
            const stageEmoji = STAGE_EMOJI[level] ?? '🥚';
            const stageName = DIGIMON_STAGE_NAMES[summary.evolutionStage] ?? summary.evolutionStage;

            return (
              <button
                key={summary.index}
                onClick={() => handleSelect(summary.index)}
                className={`w-full text-left p-4 rounded border transition-all flex items-center gap-3 ${
                  isActive
                    ? isGlitch
                      ? 'bg-[#1a1a1a] border-[#00ffff]'
                      : isWin98
                      ? 'bg-white border-[#000080] border-2'
                      : 'bg-teal-50 border-teal-300'
                    : isGlitch
                    ? 'bg-[#141414] border-[#333] hover:border-[#00ffff]/60'
                    : isWin98
                    ? 'bg-white border-gray-400 hover:bg-gray-100'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-3xl leading-none flex-shrink-0">
                  {summary.onboardingComplete ? stageEmoji : <Plus size={28} className={isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-gray-600' : 'text-gray-400'} />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`truncate ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}`} style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      {summary.onboardingComplete
                        ? (summary.userName || (isPt ? `Perfil ${summary.index + 1}` : `Profile ${summary.index + 1}`))
                        : (isPt ? `Perfil ${summary.index + 1}` : `Profile ${summary.index + 1}`)}
                    </h3>
                    {isActive && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                        isGlitch ? 'bg-[#00ffff] text-black' : isWin98 ? 'bg-[#000080] text-white' : 'bg-teal-500 text-white'
                      }`} style={{ fontFamily: 'monospace' }}>
                        {isPt ? 'ATIVO' : 'ACTIVE'}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-gray-600' : 'text-gray-500'}`} style={{ fontFamily: 'monospace' }}>
                    {summary.onboardingComplete
                      ? `${stageName} · ❤️ ${summary.healthPoints}/${summary.maxHealthPoints}`
                      : (isPt ? 'Vazio — toque para começar' : 'Empty — tap to start')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`flex gap-2 p-4 border-t ${isGlitch ? 'bg-[#0a0a0a] border-[#00ffff]' : isWin98 ? 'bg-[#c0c0c0] border-white' : 'bg-gray-50 border-gray-200'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2 px-4 rounded transition-colors ${isGlitch ? 'glitch-button primary' : isWin98 ? 'win98-button primary' : 'modern-button'}`}
            style={{ fontFamily: 'monospace', fontWeight: 'bold' }}
          >
            {isPt ? '✅ Fechar' : '✅ Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
