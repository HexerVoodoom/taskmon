import svgPaths from '../imports/svg-hfvoappsgk';
import { getActiveProfile, setActiveProfile, PROFILE_COUNT } from '../utils/storageKeys';

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  theme?: 'default' | 'win98' | 'glitch';
}

// Cor de cada perfil (0 preto+roxo · 1 rosa · 2 verde) — mesmas dos temas.
export const PROFILE_COLORS = ['#a855f7', '#ec4899', '#65a30d'];

// Casinha (estilo flat, preenchida quando ativa)
function HouseIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.5 12 3.5l8.5 7v8.5a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5Z"
        fill={active ? color : 'none'}
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.55}
      />
    </svg>
  );
}

// Troca de perfil: casinha ativa navega pra home; as outras trocam o save.
function switchProfile(index: number, isActive: boolean, onNavigate: (v: ViewType) => void) {
  if (isActive) {
    onNavigate('main');
    return;
  }
  setActiveProfile(index);
  window.location.reload();
}

// Branches Icon
function BranchesIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? 'var(--tk-text, #101828)' : 'var(--tk-muted, #6A7282)';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute bottom-[37.5%] left-1/4 right-3/4 top-[12.5%]">
        <div className="absolute inset-[-6.25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 11.2481">
            <path d="M0.624897 0.624897V10.6232" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[12.5%_12.5%_62.5%_62.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[62.5%_62.5%_12.5%_12.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[37.5%] right-1/4 top-[37.5%]">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.74856 8.74856">
            <path d={svgPaths.pb325a00} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Stats Icon (bar chart)
function StatsIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? 'var(--tk-text, #101828)' : 'var(--tk-muted, #6A7282)';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute inset-[12.5%]">
        <div className="absolute inset-[-4.17%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.2473 16.2473">
            <path d={svgPaths.p2dd35100} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.17%] left-3/4 right-1/4 top-[37.5%]">
        <div className="absolute inset-[-9.38%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 7.91536">
            <path d="M0.624897 7.29046V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[20.83%_45.83%_29.17%_54.17%]">
        <div className="absolute inset-[-6.25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 11.2481">
            <path d="M0.624897 10.6232V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[58.33%_66.67%_29.16%_33.33%]">
        <div className="absolute inset-[-25%_-0.62px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.24979 3.74979">
            <path d="M0.624897 3.1249V0.624897" stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Gamepad Icon — pixel-art (8-bit) to match the games page.
function PixelGamepadIcon({ isActive }: { isActive: boolean }) {
  const c = isActive ? 'var(--tk-text, #101828)' : 'var(--tk-muted, #6A7282)';
  return (
    <svg width="22" height="15" viewBox="0 0 12 8" shapeRendering="crispEdges" aria-hidden="true">
      {/* body */}
      <rect x="1" y="1" width="10" height="6" fill={c} />
      <rect x="0" y="2" width="12" height="4" fill={c} />
      {/* d-pad cross */}
      <rect x="2" y="3" width="3" height="1" fill="var(--tk-card, #fff)" />
      <rect x="3" y="2" width="1" height="3" fill="var(--tk-card, #fff)" />
      {/* A/B buttons */}
      <rect x="8" y="3" width="1" height="1" fill="var(--tk-card, #fff)" />
      <rect x="10" y="3" width="1" height="1" fill="var(--tk-card, #fff)" />
    </svg>
  );
}

// Settings Icon
function SettingsIcon({ isActive }: { isActive: boolean }) {
  const strokeColor = isActive ? 'var(--tk-text, #101828)' : 'var(--tk-muted, #6A7282)';
  return (
    <div className="h-[19.997px] overflow-clip relative shrink-0 w-full">
      <div className="absolute inset-[8.41%_12.68%]">
        <div className="absolute inset-[-3.76%_-4.19%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.1746 17.8838">
            <path d={svgPaths.p29134400} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[37.5%]">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.24979 6.24979">
            <path d={svgPaths.p7347300} stroke={strokeColor} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.24979" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function Header({ currentView, onNavigate, theme = 'default' }: HeaderProps) {
  const activeProfile = getActiveProfile();
  const profiles = Array.from({ length: PROFILE_COUNT }, (_, i) => i);

  // Win98 theme - mantém o layout antigo
  if (theme === 'win98') {
    return (
      <div className="win98-header">
        <div className="win98-menubar">
          {profiles.map(i => (
            <button
              key={i}
              className={`win98-menu-item ${i === activeProfile && currentView === 'main' ? 'active' : ''}`}
              onClick={() => switchProfile(i, i === activeProfile, onNavigate)}
              title={`Perfil ${i + 1}`}
            >
              <HouseIcon color={PROFILE_COLORS[i]} active={i === activeProfile} />
              {i + 1}
            </button>
          ))}
          <button className={`win98-menu-item ${currentView === 'evolution' ? 'active' : ''}`} onClick={() => onNavigate('evolution')}>
            Evolution
          </button>
          <button className={`win98-menu-item ${currentView === 'stats' ? 'active' : ''}`} onClick={() => onNavigate('stats')}>
            Stats
          </button>
          <button className={`win98-menu-item ${currentView === 'games' ? 'active' : ''}`} onClick={() => onNavigate('games')}>
            Games
          </button>
          <button className={`win98-menu-item ${currentView === 'settings' ? 'active' : ''}`} onClick={() => onNavigate('settings')}>
            Settings
          </button>
        </div>
      </div>
    );
  }

  // Default theme — 3 casinhas (uma por perfil) + navegação
  return (
    <div
      className="content-stretch flex flex-col items-start justify-center px-[12px] py-[8px] relative w-full"
      style={{ backgroundColor: 'var(--tk-card, #fff)', borderBottom: '1px solid var(--tk-border, #e5e7eb)' }}
    >
      <div className="h-[61.962px] relative shrink-0 w-full">
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex items-center justify-between relative size-full">

            {/* Left: 3 casinhas — uma por perfil (ativa = preenchida) */}
            <div className="flex gap-[6px] items-center">
              {profiles.map(i => {
                const isActive = i === activeProfile;
                return (
                  <button
                    key={i}
                    onClick={() => switchProfile(i, isActive, onNavigate)}
                    aria-label={isActive ? 'Início' : `Trocar para o perfil ${i + 1}`}
                    title={isActive ? `Perfil ${i + 1} (ativo)` : `Perfil ${i + 1}`}
                    className="relative rounded-[14px] shrink-0 size-[39.993px] transition-all active:scale-95 flex items-center justify-center"
                    style={{
                      backgroundColor: isActive ? `${PROFILE_COLORS[i]}22` : 'transparent',
                      border: isActive
                        ? `2px solid ${PROFILE_COLORS[i]}`
                        : '1px solid var(--tk-border, #e5e7eb)',
                    }}
                  >
                    <HouseIcon color={PROFILE_COLORS[i]} active={isActive} />
                  </button>
                );
              })}
            </div>

            {/* Right: buttons grouped (Games, Evolution, Stats, Config) */}
            <div className="h-[39.993px] relative shrink-0 flex gap-[5.985px] items-start">

              {/* Games / Activities */}
              <button
                onClick={() => onNavigate('games')}
                aria-label="Atividades"
                className="relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                style={{
                  backgroundColor: currentView === 'games' ? 'var(--tk-soft, #e5e7eb)' : 'transparent',
                  border: currentView === 'games' ? 'none' : '1px solid var(--tk-border, #c0c0c0)',
                }}
              >
                <div className="flex items-center justify-center size-full">
                  <PixelGamepadIcon isActive={currentView === 'games'} />
                </div>
              </button>

              {/* Evolution */}
              <button
                onClick={() => onNavigate('evolution')}
                aria-label="Evolução"
                className="relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                style={{
                  backgroundColor: currentView === 'evolution' ? 'var(--tk-soft, #e5e7eb)' : 'transparent',
                  border: currentView === 'evolution' ? 'none' : '1px solid var(--tk-border, #c0c0c0)',
                }}
              >
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <BranchesIcon isActive={currentView === 'evolution'} />
                </div>
              </button>

              {/* Stats */}
              <button
                onClick={() => onNavigate('stats')}
                aria-label="Estatísticas"
                className="relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                style={{
                  backgroundColor: currentView === 'stats' ? 'var(--tk-soft, #e5e7eb)' : 'transparent',
                  border: currentView === 'stats' ? 'none' : '1px solid var(--tk-border, #c0c0c0)',
                }}
              >
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <StatsIcon isActive={currentView === 'stats'} />
                </div>
              </button>

              {/* Settings */}
              <button
                onClick={() => onNavigate('settings')}
                aria-label="Configurações"
                className="relative rounded-[14px] shrink-0 size-[39.993px] transition-all"
                style={{
                  backgroundColor: currentView === 'settings' ? 'var(--tk-soft, #e5e7eb)' : 'transparent',
                  border: currentView === 'settings' ? 'none' : '1px solid var(--tk-border, #c0c0c0)',
                }}
              >
                <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-0 pt-[9.998px] px-[9.998px] relative size-full">
                  <SettingsIcon isActive={currentView === 'settings'} />
                </div>
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* Faixa decorativa temática do perfil (arcos góticos / gregas / listras).
          Em fluxo normal (não absolute): classes utilitárias de posição podem
          não existir no CSS pré-compilado. Margens negativas anulam o padding. */}
      <div className="tk-deco-strip" style={{ margin: '8px -12px -8px', width: 'calc(100% + 24px)' }} />
    </div>
  );
}
