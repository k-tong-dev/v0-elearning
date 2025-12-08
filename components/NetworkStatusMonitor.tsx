'use client';

import React from 'react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { NetworkStatusPopup } from './NetworkStatusPopup';

/**
 * Global Network Status Monitor Component
 * Automatically monitors network status and displays beautiful popup notifications
 * when the user goes offline, has a slow connection, or comes back online.
 */
export function NetworkStatusMonitor() {
  const networkStatus = useNetworkStatus();

  return (
    <NetworkStatusPopup
      isOnline={networkStatus.isOnline}
      isSlowConnection={networkStatus.isSlowConnection}
      effectiveType={networkStatus.effectiveType}
    />
  );
}

