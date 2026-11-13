import { useState, useEffect, useMemo } from 'react';

/**
 * Shared hook for inline column filtering, distinct select options, and multi-type sorting
 * across grouped entity list views.
 */
export function useTableFilterSort({
  groups = [],
  availableColumns = [],
  visibleColumns = [],
  getColumnRawValue,
  getCustomSortValue = null
}) {
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [columnFilters, setColumnFilters] = useState({});

  const activeFilterEntries = useMemo(() => Object.entries(columnFilters), [columnFilters]);

  useEffect(() => {
    if (activeFilterEntries.length > 0 && !showFilterRow) {
      setShowFilterRow(true);
    }
  }, [activeFilterEntries.length]);

  const handleSort = (colKey) => {
    const colDef = availableColumns.find(c => c.key === colKey);
    if (!colDef || !colDef.sortable) return;

    setSortConfig(prev => {
      if (prev.key === colKey) {
        if (prev.direction === 'asc') return { key: colKey, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: 'asc' };
      }
      return { key: colKey, direction: 'asc' };
    });
  };

  const clearSort = () => setSortConfig({ key: null, direction: 'asc' });

  const handleFilterChange = (colKey, value) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      if (!value || value.trim() === '' || value === '__all__') {
        delete next[colKey];
      } else {
        next[colKey] = value;
      }
      return next;
    });
  };

  const clearAllFilters = () => setColumnFilters({});

  const distinctOptionsMap = useMemo(() => {
    const map = {};
    visibleColumns.forEach(col => {
      if (col.filterable && col.filterType === 'select') {
        const set = new Set();
        groups.forEach(g => {
          const val = getColumnRawValue(g.latestItem, col);
          if (val) set.add(val);
        });
        map[col.key] = Array.from(set).sort();
      }
    });
    return map;
  }, [groups, visibleColumns, getColumnRawValue]);

  const processedGroups = useMemo(() => {
    let result = groups.filter(group => {
      for (const [colKey, filterVal] of activeFilterEntries) {
        if (!filterVal) continue;
        const colDef = availableColumns.find(c => c.key === colKey);
        if (!colDef) continue;

        const target = filterVal.toLowerCase().trim();
        const latestVal = getColumnRawValue(group.latestItem, colDef).toLowerCase();
        const matchLatest = colDef.filterType === 'select'
          ? latestVal === target
          : latestVal.includes(target);

        const matchPrev = (group.previousVersions || []).some(v => {
          const vVal = getColumnRawValue(v, colDef).toLowerCase();
          return colDef.filterType === 'select' ? vVal === target : vVal.includes(target);
        });

        if (!matchLatest && !matchPrev) return false;
      }
      return true;
    });

    if (sortConfig.key) {
      const colDef = availableColumns.find(c => c.key === sortConfig.key);
      if (colDef) {
        const dir = sortConfig.direction === 'asc' ? 1 : -1;
        result = [...result].sort((a, b) => {
          if (typeof getCustomSortValue === 'function') {
            const customA = getCustomSortValue(a.latestItem, colDef);
            const customB = getCustomSortValue(b.latestItem, colDef);
            if (customA !== null && customB !== null && customA !== customB) {
              return (customA - customB) * dir;
            }
          }

          const valA = getColumnRawValue(a.latestItem, colDef);
          const valB = getColumnRawValue(b.latestItem, colDef);

          const numA = parseFloat(valA);
          const numB = parseFloat(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return (numA - numB) * dir;
          }

          return valA.localeCompare(valB) * dir;
        });
      }
    }

    return result;
  }, [groups, activeFilterEntries, sortConfig, availableColumns, getColumnRawValue, getCustomSortValue]);

  return {
    showFilterRow,
    setShowFilterRow,
    sortConfig,
    handleSort,
    clearSort,
    columnFilters,
    handleFilterChange,
    clearAllFilters,
    activeFilterEntries,
    distinctOptionsMap,
    processedGroups
  };
}
