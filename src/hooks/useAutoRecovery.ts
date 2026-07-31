import { useState, useEffect, useRef, useCallback } from 'react';

export interface AutoRecoveryPayload<T> {
  formState: T;
  timestamp: string;
}

export function useAutoRecovery<T>(
  storageKey: string,
  currentFormState: T,
  hasContentCheck: (state: T) => boolean,
  intervalMs: number = 30000
) {
  const [recoveryData, setRecoveryData] = useState<AutoRecoveryPayload<T> | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  // Keep a ref to the latest form state to avoid stale closure inside setInterval
  const formStateRef = useRef<T>(currentFormState);
  useEffect(() => {
    formStateRef.current = currentFormState;
  }, [currentFormState]);

  // Check for existing saved recovery data on component mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(storageKey);
      if (savedRaw) {
        const parsed: AutoRecoveryPayload<T> = JSON.parse(savedRaw);
        if (parsed && parsed.formState && hasContentCheck(parsed.formState)) {
          setRecoveryData(parsed);
          setShowBanner(true);
        }
      }
    } catch (err) {
      console.error('Failed to read auto-recovery data from localStorage:', err);
    }
  }, [storageKey]);

  // Periodically save current form state to localStorage every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const stateToSave = formStateRef.current;
      if (hasContentCheck(stateToSave)) {
        const payload: AutoRecoveryPayload<T> = {
          formState: stateToSave,
          timestamp: new Date().toISOString(),
        };
        try {
          localStorage.setItem(storageKey, JSON.stringify(payload));
          setLastSavedTime(new Date());
        } catch (err) {
          console.error('Failed to auto-save form state to localStorage:', err);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [storageKey, intervalMs]);

  const clearRecoveryData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Failed to remove auto-recovery key from localStorage:', err);
    }
    setRecoveryData(null);
    setShowBanner(false);
  }, [storageKey]);

  const saveNow = useCallback(() => {
    const stateToSave = formStateRef.current;
    if (hasContentCheck(stateToSave)) {
      const payload: AutoRecoveryPayload<T> = {
        formState: stateToSave,
        timestamp: new Date().toISOString(),
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(payload));
        setLastSavedTime(new Date());
      } catch (err) {
        console.error('Failed to manually trigger auto-save:', err);
      }
    }
  }, [storageKey]);

  return {
    recoveryData,
    showBanner,
    lastSavedTime,
    clearRecoveryData,
    saveNow,
    dismissBanner: () => setShowBanner(false),
  };
}
