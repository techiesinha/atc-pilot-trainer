import { useCallback, useState } from 'react';

export const useLocalStorage = <StoredValue>(
  storageKey: string,
  initialValue: StoredValue
) => {
  const [storedValue, setStoredValue] = useState<StoredValue>(() => {
    try {
      const existingItem = window.localStorage.getItem(storageKey);
      return existingItem
        ? (JSON.parse(existingItem) as StoredValue)
        : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: StoredValue | ((previousValue: StoredValue) => StoredValue)) => {
      setStoredValue((previousValue) => {
        const nextValue =
          typeof value === 'function'
            ? (value as (previous: StoredValue) => StoredValue)(previousValue)
            : value;
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
        } catch {
          /* storage quota exceeded — ignore silently */
        }
        return nextValue;
      });
    },
    [storageKey]
  );

  return [storedValue, setValue] as const;
};
