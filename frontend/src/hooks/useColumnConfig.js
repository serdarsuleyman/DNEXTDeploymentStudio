import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Shared hook for configurable table columns with localStorage persistence,
 * optional schema migration, and customizer popover open/close state.
 */
export function useColumnConfig({
  storageKey,
  availableColumns,
  defaultColumnKeys,
  migrateSavedKeys = null
}) {
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof migrateSavedKeys === 'function') {
            parsed = migrateSavedKeys(parsed);
          }
          const valid = parsed.filter(k => availableColumns.some(c => c.key === k));
          if (valid.length > 0) return valid;
        }
      }
    } catch (e) {}
    return defaultColumnKeys;
  });

  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const customizerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visibleColumnKeys));
    } catch (e) {}
  }, [storageKey, visibleColumnKeys]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (customizerRef.current && !customizerRef.current.contains(e.target)) {
        setIsCustomizerOpen(false);
      }
    };
    if (isCustomizerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCustomizerOpen]);

  const visibleColumns = useMemo(() => {
    return availableColumns.filter(col => visibleColumnKeys.includes(col.key));
  }, [availableColumns, visibleColumnKeys]);

  const toggleColumn = (key) => {
    setVisibleColumnKeys(prev => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev;
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const resetToDefaults = () => {
    setVisibleColumnKeys(defaultColumnKeys);
  };

  return {
    visibleColumnKeys,
    setVisibleColumnKeys,
    visibleColumns,
    toggleColumn,
    resetToDefaults,
    isCustomizerOpen,
    setIsCustomizerOpen,
    customizerRef
  };
}
