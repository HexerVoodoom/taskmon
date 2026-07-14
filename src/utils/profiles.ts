import { PROFILE_COUNT, keyForProfile } from './storageKeys';
import type { GameState } from '../contexts/GameStateContext';

export { PROFILE_COUNT };

export interface ProfileCloudBundle {
  onboardingComplete: boolean;
  userName: string;
  eggType: GameState['eggType'] | null;
  gameState: GameState | null;
}

export interface HubCloudPayload {
  version: 2;
  profiles: ProfileCloudBundle[];
}

export interface ProfileSummary {
  index: number;
  onboardingComplete: boolean;
  userName: string;
  evolutionStage: GameState['evolutionStage'];
  healthPoints: number;
  maxHealthPoints: number;
}

/** Reads everything needed to represent one profile — used both for the hub
 * UI cards and to build the cloud-save bundle. Pure localStorage read, no
 * dependency on which profile is currently active. */
export function readProfileBundle(index: number): ProfileCloudBundle {
  const onboardingComplete = localStorage.getItem(keyForProfile('ONBOARDING_COMPLETE', index)) === 'true';
  const userName = localStorage.getItem(keyForProfile('USER_NAME', index)) ?? '';
  const eggType = localStorage.getItem(keyForProfile('EGG_TYPE', index)) as GameState['eggType'] | null;
  let gameState: GameState | null = null;
  try {
    const raw = localStorage.getItem(keyForProfile('GAME_STATE', index));
    if (raw) gameState = JSON.parse(raw) as GameState;
  } catch {
    gameState = null;
  }
  return { onboardingComplete, userName, eggType, gameState };
}

export function getProfileSummary(index: number): ProfileSummary {
  const bundle = readProfileBundle(index);
  return {
    index,
    onboardingComplete: bundle.onboardingComplete,
    userName: bundle.userName,
    evolutionStage: bundle.gameState?.evolutionStage ?? 'digiegg',
    healthPoints: bundle.gameState?.healthPoints ?? 0,
    maxHealthPoints: bundle.gameState?.maxHealthPoints ?? 1,
  };
}

/** Only ever ADDS/overwrites with truthy incoming data — never blanks a
 * profile out just because the incoming bundle is empty (e.g. a profile
 * that was never played on the OTHER device). */
function writeProfileBundle(index: number, bundle: Partial<ProfileCloudBundle>): void {
  if (bundle.gameState) {
    localStorage.setItem(keyForProfile('GAME_STATE', index), JSON.stringify(bundle.gameState));
  }
  if (bundle.onboardingComplete) {
    localStorage.setItem(keyForProfile('ONBOARDING_COMPLETE', index), 'true');
  }
  if (bundle.userName) {
    localStorage.setItem(keyForProfile('USER_NAME', index), bundle.userName);
  }
  if (bundle.eggType) {
    localStorage.setItem(keyForProfile('EGG_TYPE', index), bundle.eggType);
  }
}

/** Bundles all 3 profiles into one payload — the hub's cloud save always
 * carries all profiles together under a single saveId/email. */
export function buildHubCloudPayload(): HubCloudPayload {
  const profiles: ProfileCloudBundle[] = [];
  for (let i = 0; i < PROFILE_COUNT; i++) profiles.push(readProfileBundle(i));
  return { version: 2, profiles };
}

/** Applies a cloud payload to local storage for all 3 profiles. Also
 * understands the pre-hub format (a bare GameState object was the whole
 * cloud payload) and adopts it as profile 0, matching the app's previous
 * single-save behavior. */
export function applyHubCloudPayload(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const asHub = payload as Partial<HubCloudPayload>;
  if (Array.isArray(asHub.profiles)) {
    asHub.profiles.slice(0, PROFILE_COUNT).forEach((bundle, i) => writeProfileBundle(i, bundle));
    return;
  }
  writeProfileBundle(0, { gameState: payload as GameState });
}
