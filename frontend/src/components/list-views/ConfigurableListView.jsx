import React from 'react';
import {
  resolveListViewTemplateId,
  getListViewComponent
} from './listViewRegistry';

/**
 * ConfigurableListView
 * Dynamic dispatcher that renders the appropriate list view component based on
 * the active template configuration (automatically resolved by entityType and field values,
 * or explicitly selected by the user).
 */
export default function ConfigurableListView({
  templateId,
  context = {},
  cacheStatus = null,
  groups = [],
  selectedIds = new Set(),
  expandedGroups = new Set(),
  onToggleSelectAll,
  onToggleSelectItem,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
  onRefreshCatalog,
  isRefreshing = false,
  onOpenDetail,
  onSpecFilter,
  onResumeDraft,
  onDraftsCountChange
}) {
  const sampleItem = groups.length > 0 ? groups[0]?.latestItem : null;
  const activeTemplateId = templateId || resolveListViewTemplateId(context, sampleItem);
  const Component = getListViewComponent(activeTemplateId);

  const effectiveCacheStatus = cacheStatus || context?.cacheStatus || null;

  return (
    <Component
      groups={groups}
      selectedIds={selectedIds}
      expandedGroups={expandedGroups}
      onToggleSelectAll={onToggleSelectAll}
      onToggleSelectItem={onToggleSelectItem}
      onToggleExpand={onToggleExpand}
      onExpandAll={onExpandAll}
      onCollapseAll={onCollapseAll}
      onRefreshCatalog={onRefreshCatalog}
      isRefreshing={isRefreshing}
      cacheStatus={effectiveCacheStatus}
      onOpenDetail={onOpenDetail}
      onSpecFilter={onSpecFilter}
      onResumeDraft={onResumeDraft}
      onDraftsCountChange={onDraftsCountChange}
    />
  );
}
