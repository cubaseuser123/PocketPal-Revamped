import { useCallback } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

/**
 * Hook that wraps an action and blocks it when offline, showing a toast-style message.
 * Use for critical financial operations like UPI, Load Money, Transfer Money.
 */
export function useOnlineAction() {
  const netInfo = useNetInfo();

  const requireOnline = useCallback(
    <T extends (...args: any[]) => Promise<any>>(
      action: T,
      onOffline?: () => void
    ): ((...args: Parameters<T>) => Promise<ReturnType<T> | undefined>) => {
      return async (...args: Parameters<T>) => {
        if (!netInfo.isConnected) {
          onOffline?.();
          return undefined;
        }
        return action(...args);
      };
    },
    [netInfo.isConnected]
  );

  return {
    isOnline: netInfo.isConnected ?? true,
    requireOnline,
  };
}
