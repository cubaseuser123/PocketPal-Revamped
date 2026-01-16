import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const OFFLINE_QUEUE_KEY = 'POCKETPAL_OFFLINE_QUEUE';

export interface OfflineAction {
  id: string;
  type: 'createGoal' | 'deleteGoal' | 'updateGoal' | 'addSubscription' | 'cancelSubscription' | 'startQuest';
  payload: any;
  timestamp: number;
}

interface OfflineQueueContextType {
  isOnline: boolean;
  queue: OfflineAction[];
  queueAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => Promise<void>;
  processQueue: () => Promise<void>;
}

const OfflineQueueContext = createContext<OfflineQueueContextType | null>(null);

export function useOfflineQueue() {
  const context = useContext(OfflineQueueContext);
  if (!context) {
    throw new Error('useOfflineQueue must be used within OfflineQueueProvider');
  }
  return context;
}

interface OfflineQueueProviderProps {
  children: ReactNode;
  onProcessAction?: (action: OfflineAction) => Promise<void>;
}

export function OfflineQueueProvider({ children, onProcessAction }: OfflineQueueProviderProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineAction[]>([]);

  // Load queue from storage on mount
  useEffect(() => {
    const loadQueue = async () => {
      try {
        const stored = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (stored) {
          setQueue(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load offline queue:', e);
      }
    };
    loadQueue();
  }, []);

  // Save queue to storage whenever it changes
  useEffect(() => {
    const saveQueue = async () => {
      try {
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      } catch (e) {
        console.error('Failed to save offline queue:', e);
      }
    };
    saveQueue();
  }, [queue]);

  // Listen to network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      const nowOnline = !!state.isConnected;
      setIsOnline(nowOnline);

      // If we just came online and have queued actions, process them
      if (wasOffline && nowOnline && queue.length > 0) {
        processQueue();
      }
    });

    return () => unsubscribe();
  }, [isOnline, queue]);

  const queueAction = useCallback(async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };
    setQueue((prev) => [...prev, newAction]);
  }, []);

  const processQueue = useCallback(async () => {
    if (!onProcessAction || queue.length === 0) return;

    const actionsToProcess = [...queue];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        await onProcessAction(action);
      } catch (e) {
        console.error('Failed to process offline action:', action.type, e);
        failedActions.push(action);
      }
    }

    // Keep only failed actions in the queue
    setQueue(failedActions);
  }, [queue, onProcessAction]);

  return (
    <OfflineQueueContext.Provider value={{ isOnline, queue, queueAction, processQueue }}>
      {children}
    </OfflineQueueContext.Provider>
  );
}
