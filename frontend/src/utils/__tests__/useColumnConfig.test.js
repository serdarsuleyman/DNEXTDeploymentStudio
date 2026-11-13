import test from 'node:test';
import assert from 'node:assert/strict';

test('useColumnConfig reordering and select all logic', () => {
  const availableColumns = [
    { key: 'colA', label: 'Column A' },
    { key: 'colB', label: 'Column B' },
    { key: 'colC', label: 'Column C' },
    { key: 'colD', label: 'Column D' }
  ];

  let visibleColumnKeys = ['colA', 'colB', 'colC'];

  // Test visibleColumns ordering
  const getVisibleColumns = (keys) => keys.map(k => availableColumns.find(c => c.key === k)).filter(Boolean);
  let visibleCols = getVisibleColumns(visibleColumnKeys);
  assert.deepEqual(visibleCols.map(c => c.key), ['colA', 'colB', 'colC']);

  // Move colB up
  const moveColumn = (keys, key, direction) => {
    const idx = keys.indexOf(key);
    if (idx === -1) return keys;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= keys.length) return keys;
    const next = [...keys];
    const [removed] = next.splice(idx, 1);
    next.splice(targetIdx, 0, removed);
    return next;
  };

  visibleColumnKeys = moveColumn(visibleColumnKeys, 'colB', 'up');
  assert.deepEqual(visibleColumnKeys, ['colB', 'colA', 'colC']);
  assert.deepEqual(getVisibleColumns(visibleColumnKeys).map(c => c.key), ['colB', 'colA', 'colC']);

  // Move colB down
  visibleColumnKeys = moveColumn(visibleColumnKeys, 'colB', 'down');
  assert.deepEqual(visibleColumnKeys, ['colA', 'colB', 'colC']);

  // Move colC down (at boundary) -> no change
  visibleColumnKeys = moveColumn(visibleColumnKeys, 'colC', 'down');
  assert.deepEqual(visibleColumnKeys, ['colA', 'colB', 'colC']);

  // Select all (preserves existing order, appends rest)
  const selectAll = (keys) => {
    const currentSet = new Set(keys);
    const unselected = availableColumns.filter(c => !currentSet.has(c.key)).map(c => c.key);
    return [...keys, ...unselected];
  };

  visibleColumnKeys = selectAll(visibleColumnKeys);
  assert.deepEqual(visibleColumnKeys, ['colA', 'colB', 'colC', 'colD']);

  // Deselect all
  const deselectAll = () => [];
  visibleColumnKeys = deselectAll();
  assert.deepEqual(visibleColumnKeys, []);
});
