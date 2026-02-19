import { AD_REWARD_PLACEMENT_NAME, ADSENSE_CLIENT } from '@/utils/config';

const REWARDED_TIMEOUT_MS = 30000;
let adPlacementInitialized = false;

export function isAdsConfigured(): boolean {
  return ADSENSE_CLIENT.length > 0;
}

export function initAdPlacement(): void {
  if (adPlacementInitialized || typeof window === 'undefined') return;
  if (!isAdsConfigured()) return;
  if (typeof window.adConfig !== 'function') return;

  window.adConfig({
    preloadAdBreaks: 'on',
    sound: 'on',
  });
  adPlacementInitialized = true;
}

export async function showRewardedAd(placementName: string = AD_REWARD_PLACEMENT_NAME): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!isAdsConfigured()) return false;

  initAdPlacement();

  const adBreak = window.adBreak;
  if (typeof adBreak !== 'function') return false;

  return new Promise<boolean>((resolve) => {
    let done = false;
    const finish = (result: boolean) => {
      if (done) return;
      done = true;
      resolve(result);
    };

    const timeout = window.setTimeout(() => finish(false), REWARDED_TIMEOUT_MS);

    adBreak({
      type: 'reward',
      name: placementName,
      beforeReward: (showAd) => {
        showAd();
      },
      adViewed: () => {
        window.clearTimeout(timeout);
        finish(true);
      },
      adDismissed: () => {
        window.clearTimeout(timeout);
        finish(false);
      },
      adBreakDone: (placementInfo) => {
        if (placementInfo?.breakStatus && placementInfo.breakStatus !== 'viewed') {
          window.clearTimeout(timeout);
          finish(false);
        }
      },
    });
  });
}

export function getAdBootstrapScript(): string {
  return `
window.adsbygoogle = window.adsbygoogle || [];
window.adBreak = window.adBreak || function(o){ window.adsbygoogle.push(o); };
window.adConfig = window.adConfig || function(o){ window.adsbygoogle.push(o); };
`;
}
