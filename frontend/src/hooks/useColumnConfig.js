import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * Shared hook for configurable table columns with localStorage persistence,
 * column ordering, select/deselect all, optional schema migration, and customizer popover open/close state.
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

  // visibleColumns strictly follows the user-defined order in visibleColumnKeys
  const visibleColumns = useMemo(() => {
    return visibleColumnKeys
      .map(key => availableColumns.find(col => col.key === key))
      .filter(Boolean);
  }, [availableColumns, visibleColumnKeys]);

  const toggleColumn = (key) => {
    setVisibleColumnKeys(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  const moveColumn = (key, direction) => {
    setVisibleColumnKeys(prev => {
      const idx = prev.indexOf(key);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      next.splice(targetIdx, 0, removed);
      return next;
    });
  };

  const reorderColumns = (source, target) => {
    setVisibleColumnKeys(prev => {
      const sourceIdx = typeof source === 'number' ? source : prev.indexOf(source);
      const targetIdx = typeof target === 'number' ? target : prev.indexOf(target);

      if (sourceIdx === -1 || targetIdx === -1 || sourceIdx === targetIdx) return prev;
      if (sourceIdx < 0 || sourceIdx >= prev.length || targetIdx < 0 || targetIdx >= prev.length) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIdx, 1);
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const selectAll = () => {
    const currentSet = new Set(visibleColumnKeys);
    const unselected = availableColumns.filter(c => !currentSet.has(c.key)).map(c => c.key);
    setVisibleColumnKeys([...visibleColumnKeys, ...unselected]);
  };

  const deselectAll = () => {
    setVisibleColumnKeys([]);
  };

  const toggleSelectAll = () => {
    if (availableColumns.length > 0 && visibleColumnKeys.length === availableColumns.length) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const resetToDefaults = () => {
    setVisibleColumnKeys(defaultColumnKeys);
  };

  return {
    availableColumns,
    defaultColumnKeys,
    visibleColumnKeys,
    setVisibleColumnKeys,
    visibleColumns,
    toggleColumn,
    moveColumn,
    reorderColumns,
    selectAll,
    deselectAll,
    toggleSelectAll,
    resetToDefaults,
    isCustomizerOpen,
    setIsCustomizerOpen,
    onToggleOpen: () => setIsCustomizerOpen(prev => !prev),
    customizerRef
  };
}
