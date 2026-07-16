import { Language, useTranslation } from '../utils/i18n';

interface NewActivityBarProps {
  onNewActivity: () => void;
  theme?: 'default' | 'win98' | 'glitch';
  language: Language;
}

/** Barra do topo da home: título do dia + botão de nova atividade. */
export function NewActivityBar({ onNewActivity, theme = 'default', language }: NewActivityBarProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const t = useTranslation(language);

  return (
    <div className="flex gap-3 items-center w-full">
      <h2
        className={`flex-1 min-w-0 truncate font-extrabold ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : ''}`}
        style={{ fontSize: '1.05rem', color: !isGlitch && !isWin98 ? 'var(--tk-text, #111827)' : undefined }}
      >
        {language === 'pt-BR' ? 'Hoje' : 'Today'}
      </h2>

      <button
        onClick={onNewActivity}
        className={`px-4 py-2 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 active:scale-95 ${
          isGlitch
            ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black hover:opacity-90'
            : isWin98
              ? 'bg-[#c0c0c0] border-2 border-white hover:bg-[#d0d0d0] text-black'
              : 'text-white font-bold hover:brightness-105'
        }`}
        style={
          !isGlitch && !isWin98
            ? {
                backgroundColor: 'var(--tk-accent, #14b8a6)',
                boxShadow: '0 3px 0 var(--tk-accent-dark, rgba(0,0,0,0.25))',
              }
            : undefined
        }
      >
        <span className="text-sm whitespace-nowrap font-bold">
          + {t.activities.addNew}
        </span>
      </button>
    </div>
  );
}
