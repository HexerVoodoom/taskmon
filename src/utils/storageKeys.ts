// Base (unscoped) localStorage key names. For keys in PROFILE_SCOPED_NAMES
// below, the real key used at runtime is `${base}_p${activeProfile}` (see
// STORAGE_KEYS) — everything else is shared across the 3 profiles (device/UI
// prefs, and the hub-level cloud save identity).
const BASE_KEYS = {
  GAME_STATE: 'digiapp_state_v3',
  AI_SETTINGS: 'digiapp-ai-settings',
  THEME: 'digiapp-theme',
  LANGUAGE: 'digiapp-language',
  ONBOARDING_COMPLETE: 'digiapp-onboarding-complete',
  USER_NAME: 'digiapp-user-name',
  EGG_TYPE: 'digiapp-egg-type',
  FIRST_TASK_POPUP_SHOWN: 'digiapp-first-task-popup-shown',
  ROOKIE_POPUP_SHOWN: 'digiapp-rookie-popup-shown',
  NOTIFICATIONS_ENABLED: 'digiapp-notifications-enabled',
  PWA_INSTALL_DISMISSED: 'digiapp-pwa-install-dismissed',
  SCHEDULED_NOTIFICATIONS: 'digiapp-scheduled-notifications',
  DAILY_NOTIFICATION_CHECK: 'digiapp-daily-notification-check',
  SAVE_ID: 'digiapp-save-id',
  USER_EMAIL: 'digiapp-user-email',
  IS_SLEEPING: 'digiapp-is-sleeping',
  FOOD_FEED_TIMES: 'digiapp-food-feed-times',
  RUB_HEAL_DAY: 'digiapp-rub-heal-day',
  DAILY_REPORT_SHOWN: 'digiapp-daily-report-shown',
  RUB_HINT_SHOWN: 'digiapp-rub-hint-shown',
  AUTO_SLEEP_ENABLED: 'digiapp-auto-sleep-enabled',
  AUTO_SLEEP_START: 'digiapp-auto-sleep-start',
  AUTO_SLEEP_END: 'digiapp-auto-sleep-end',
  DUNGEON_DIFFICULTY: 'digiapp-dungeon-difficulty',
  DUNGEON_BEST: 'digiapp-dungeon-best',
  DUNGEON_HEART_DROPS: 'digiapp-dungeon-heart-drops',
  DINO_BEST: 'digiapp-dino-best',
  ROOF_BEST: 'digiapp-roof-best',
  BUBBLE_BEST: 'digiapp-bubble-best',
  FLOWER_BEST: 'digiapp-flower-best',
  WEREWOLF_BEST: 'digiapp-werewolf-best',
  SOUND_MUTED: 'digiapp-sound-muted',
  FCM_TOKEN: 'digiapp-fcm-token',
  LAST_CLOUD_SYNC: 'digiapp-last-cloud-sync',
} as const;

export type BaseKeyName = keyof typeof BASE_KEYS;

export const PROFILE_COUNT = 3;

const ACTIVE_PROFILE_KEY = 'digiapp-active-profile';

// Everything tied to "this pet's save" (game state, onboarding identity,
// per-pet caches/counters) is namespaced per profile. Device/UI prefs and
// the hub-level cloud save identity (SAVE_ID/USER_EMAIL) stay shared.
const PROFILE_SCOPED_NAMES = new Set<BaseKeyName>([
  'GAME_STATE',
  'ONBOARDING_COMPLETE',
  'USER_NAME',
  'EGG_TYPE',
  'FIRST_TASK_POPUP_SHOWN',
  'ROOKIE_POPUP_SHOWN',
  'SCHEDULED_NOTIFICATIONS',
  'DAILY_NOTIFICATION_CHECK',
  'IS_SLEEPING',
  'FOOD_FEED_TIMES',
  'RUB_HEAL_DAY',
  'DAILY_REPORT_SHOWN',
  'RUB_HINT_SHOWN',
  'AUTO_SLEEP_ENABLED',
  'AUTO_SLEEP_START',
  'AUTO_SLEEP_END',
  'DUNGEON_DIFFICULTY',
  'DUNGEON_BEST',
  'DUNGEON_HEART_DROPS',
  'DINO_BEST',
  'ROOF_BEST',
  'BUBBLE_BEST',
  'FLOWER_BEST',
  'WEREWOLF_BEST',
  'LAST_CLOUD_SYNC',
]);

export function getActiveProfile(): number {
  const raw = Number(localStorage.getItem(ACTIVE_PROFILE_KEY));
  return Number.isInteger(raw) && raw >= 0 && raw < PROFILE_COUNT ? raw : 0;
}

export function setActiveProfile(index: number): void {
  localStorage.setItem(ACTIVE_PROFILE_KEY, String(index));
}

function scopedKey(base: string, profileIndex: number): string {
  return `${base}_p${profileIndex}`;
}

/** Resolves a base key name to the real localStorage key for a SPECIFIC
 * profile, regardless of which profile is currently active. Used by the hub
 * UI and cloud-save bundling to read/write all 3 profiles at once. */
export function keyForProfile(name: BaseKeyName, profileIndex: number): string {
  const base = BASE_KEYS[name];
  return PROFILE_SCOPED_NAMES.has(name) ? scopedKey(base, profileIndex) : base;
}

// One-time migration: installs from before the profile hub existed kept
// everything under the base key names. The first time this module loads
// under the new code, fold those legacy values into profile 0 so existing
// players don't lose progress. Values are copied (not moved) — harmless
// orphan legacy keys are safer than a data-loss bug.
function migrateLegacyToProfile0(): void {
  if (localStorage.getItem(ACTIVE_PROFILE_KEY) !== null) return;
  if (localStorage.getItem(BASE_KEYS.GAME_STATE) !== null) {
    for (const name of PROFILE_SCOPED_NAMES) {
      const base = BASE_KEYS[name];
      const value = localStorage.getItem(base);
      if (value !== null) localStorage.setItem(scopedKey(base, 0), value);
    }
  }
  setActiveProfile(0);
}
migrateLegacyToProfile0();

/** Drop-in replacement for the old flat STORAGE_KEYS object: every property
 * access resolves against the CURRENTLY ACTIVE profile for profile-scoped
 * keys, and to the shared base key otherwise. */
export const STORAGE_KEYS: Record<BaseKeyName, string> = new Proxy({} as Record<BaseKeyName, string>, {
  get(_target, prop: string) {
    const name = prop as BaseKeyName;
    const base = BASE_KEYS[name];
    if (base === undefined) return undefined;
    return PROFILE_SCOPED_NAMES.has(name) ? scopedKey(base, getActiveProfile()) : base;
  },
});
