'use client';

import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[useLocalStorage] Read error for "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      if (typeof window === 'undefined') return;

      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`[useLocalStorage] Write error for "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e) => {
      if (e.key !== key || e.newValue === null) return;

      try {
        const newValue = JSON.parse(e.newValue);

        // PREVENT SELF-TRIGGERED UPDATE
        if (JSON.stringify(newValue) === JSON.stringify(storedValue)) return;

        setStoredValue(newValue);
      } catch {
        // Ignore parse errors
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storedValue]); // ← storedValue is safe here

  return [storedValue, setValue];
}

export default useLocalStorage;