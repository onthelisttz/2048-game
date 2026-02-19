'use client';

import { useEffect } from 'react';
import { initAdPlacement } from '@/utils/ads';

export function AdInitializer() {
  useEffect(() => {
    initAdPlacement();
  }, []);

  return null;
}
