function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === '') return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

// Default is false to avoid accidentally enabling development behavior.
export const IS_DEVELOPMENT = parseBooleanEnv(process.env.NEXT_PUBLIC_IS_DEVELOPMENT, false);

function parseStringEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

export const ADSENSE_CLIENT = parseStringEnv(process.env.NEXT_PUBLIC_ADSENSE_CLIENT);
export const ADMOB_APP_ID = parseStringEnv(process.env.NEXT_PUBLIC_ADMOB_APP_ID);
export const ADMOB_INTERSTITIAL_SLOT = parseStringEnv(process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_SLOT);
export const ADMOB_REWARDED_SLOT = parseStringEnv(process.env.NEXT_PUBLIC_ADMOB_REWARDED_SLOT);
export const AD_REWARD_PLACEMENT_NAME = parseStringEnv(process.env.NEXT_PUBLIC_AD_REWARD_PLACEMENT_NAME) || 'gems_reward';
export const AD_BREAK_TEST_MODE = parseBooleanEnv(process.env.NEXT_PUBLIC_AD_BREAK_TEST_MODE, false);
