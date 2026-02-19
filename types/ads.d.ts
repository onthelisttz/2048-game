export {};

declare global {
  interface AdBreakPlacementInfo {
    breakType?: string;
    breakName?: string;
    breakStatus?: string;
  }

  interface RewardedAdBreakOptions {
    type: 'reward';
    name: string;
    beforeReward?: (showAd: () => void) => void;
    adViewed?: () => void;
    adDismissed?: () => void;
    adBreakDone?: (placementInfo: AdBreakPlacementInfo) => void;
  }

  interface AdConfigOptions {
    preloadAdBreaks?: 'on' | 'off';
    sound?: 'on' | 'off';
    onReady?: () => void;
  }

  interface Window {
    adBreak?: (options: RewardedAdBreakOptions) => void;
    adConfig?: (options: AdConfigOptions) => void;
    adsbygoogle?: unknown[];
  }
}
