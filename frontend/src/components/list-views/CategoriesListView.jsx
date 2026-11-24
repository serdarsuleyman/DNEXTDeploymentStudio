import React, { useState, useRef, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { SpecLink, VersionCell, LifecyclePill } from './cellRenderers';
import { C, ENTITY_CONFIG } from './constants';

/**
 * CategoriesListView
 * Dedicated list view for Categories in the DNEXT Catalog.
 *
 * Core Capabilities:
 * 1. Hierarchical Tree View:
 *    - Renders categories in hierarchical order starting from the root element(s).
 *    - Visual indentation, connecting tree guides, expand/collapse toggles.
 *    - Root indicators, depth badges (L0, L1, L2...), direct child and subtree counts.
 *    - Search within tree with automatic path expansion and match highlighting.
 *    - Expand All, Collapse All, and level-specific expansion presets (L1, L2, L3).
 *
 * 2. Flat Table View:
 *    - Full tabular catalog overview with hierarchy parent references, versions, and statuses.
 *
 * 3. Detail Drawer Integration:
 *    - Clickable category names and "View Details →" buttons trigger onOpenDetail.
 */
export default function CategoriesListView({
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
  cacheStatus = null,
  onOpenDetail
}) {
  // View mode: 'hierarchy' (default) or 'flat'
  const [viewMode, setViewMode] = useState('hierarchy');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded nodes in tree mode
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [hasInitializedExpansion, setHasInitializedExpansion] = useState(false);

  // Flat mode version dropdown state
  const [isVersionMenuOpen, setIsVersionMenuOpen] = useState(false);
  const versionMenuRef = useRef(null);

  // Copied ID state
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (versionMenuRef.current && !versionMenuRef.current.contains(e.target)) {
        setIsVersionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── 1. Build Hierarchy Tree from Groups ───
  const { nodeMap, rootNodes, maxTreeDepth, totalCategoryCount, branchCount } = useMemo(() => {
    const map = new Map();
    let totalCount = 0;

    // Create node wrappers
    groups.forEach(g => {
      const item = g.latestItem;
      const raw = item?.raw || item || {};
      const id = item.id || raw.id;
      const isExplicitRoot = raw.isRoot === true;
      const parentId = raw.parentId || raw.parent?.id || null;
      const subCategoryRefs = Array.isArray(raw.subCategory) ? raw.subCategory : [];

      map.set(id, {
        id,
        groupKey: g.groupKey,
        name: item.name || raw.name || id,
        version: g.latestVersion || item.version || '1',
        lifecycleStatus: item.lifecycleStatus || raw.lifecycleStatus || 'Launched',
        isRoot: isExplicitRoot,
        parentId,
        parentRef: raw.parent || null,
        subCategoryRefs,
        group: g,
        item,
        raw,
        children: []
      });
      totalCount++;
    });

    const roots = [];
    let branches = 0;

    // Link children to parents based on parentId
    map.forEach(node => {
      const pId = node.parentId;
      if (node.isRoot || !pId || !map.has(pId) || pId === node.id) {
        roots.push(node);
      } else {
        const parentNode = map.get(pId);
        parentNode.children.push(node);
      }
    });

    // Cross-link via subCategory array if parent declared children
    map.forEach(node => {
      if (node.subCategoryRefs.length > 0) {
        node.subCategoryRefs.forEach(ref => {
          if (ref.id && map.has(ref.id)) {
            const childNode = map.get(ref.id);
            if (!node.children.includes(childNode)) {
              // If child was placed in roots because it lacked parentId, move it under this parent
              const rootIdx = roots.indexOf(childNode);
              if (rootIdx !== -1) roots.splice(rootIdx, 1);
              node.children.push(childNode);
            }
          }
        });
      }
    });

    // Sort nodes alphabetically at each level (root elements first)
    const sortNodes = (arr) => {
      arr.sort((a, b) => {
        if (a.isRoot && !b.isRoot) return -1;
        if (!a.isRoot && b.isRoot) return 1;
        return (a.name || a.id).localeCompare(b.name || b.id);
      });
      arr.forEach(n => {
        if (n.children.length > 0) {
          branches++;
          sortNodes(n.children);
        }
      });
    };
    sortNodes(roots);

    // Compute depth, parent chain and descendant counts
    let maxDepth = 0;
    const computeStats = (node, depth = 0, path = []) => {
      node.depth = depth;
      node.path = path;
      if (depth > maxDepth) maxDepth = depth;
      let descendants = node.children.length;
      node.children.forEach(child => {
        descendants += computeStats(child, depth + 1, [...path, node.id]);
      });
      node.totalDescendants = descendants;
      return descendants;
    };
    roots.forEach(r => computeStats(r, 0, []));

    return {
      nodeMap: map,
      rootNodes: roots,
      maxTreeDepth: maxDepth,
      totalCategoryCount: totalCount,
      branchCount: branches
    };
  }, [groups]);

  // Initial expand: Expand root(s) and first level on load
  useEffect(() => {
    if (!hasInitializedExpansion && rootNodes.length > 0) {
      const initial = new Set();
      rootNodes.forEach(r => {
        initial.add(r.id);
        r.children.forEach(c => {
          if (c.children.length > 0) {
            initial.add(c.id);
          }
        });
      });
      setExpandedNodes(initial);
      setHasInitializedExpansion(true);
    }
  }, [rootNodes, hasInitializedExpansion]);

  // ─── 2. Search Matching & Path Expansion ───
  const { matchedNodeIds, visibleAncestorIds, isFiltering } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedNodeIds: new Set(), visibleAncestorIds: new Set(), isFiltering: false };
    }

    const matched = new Set();
    const ancestors = new Set();

    nodeMap.forEach(node => {
      const nameMatch = (node.name || '').toLowerCase().includes(q);
      const idMatch = (node.id || '').toLowerCase().includes(q);
      const descMatch = (node.raw.description || '').toLowerCase().includes(q);

      if (nameMatch || idMatch || descMatch) {
        matched.add(node.id);
        (node.path || []).forEach(pId => ancestors.add(pId));
      }
    });

    return { matchedNodeIds: matched, visibleAncestorIds: ancestors, isFiltering: true };
  }, [searchQuery, nodeMap]);

  // Auto-expand ancestors when searching so matched nodes are immediately visible
  useEffect(() => {
    if (isFiltering && visibleAncestorIds.size > 0) {
      setExpandedNodes(prev => {
        const next = new Set(prev);
        visibleAncestorIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [isFiltering, visibleAncestorIds]);

  // ─── 3. Flatten Visible Tree Rows ───
  const visibleTreeRows = useMemo(() => {
    const rows = [];

    const traverse = (nodes) => {
      for (const node of nodes) {
        // If filtering, only display node if it matches or has matching descendants
        if (isFiltering && !matchedNodeIds.has(node.id) && !visibleAncestorIds.has(node.id)) {
          continue;
        }

        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isDirectMatch = isFiltering && matchedNodeIds.has(node.id);

        rows.push({
          node,
          depth: node.depth,
          hasChildren,
          isExpanded,
          isDirectMatch
        });

        if (hasChildren && isExpanded) {
          traverse(node.children);
        }
      }
    };

    traverse(rootNodes);
    return rows;
  }, [rootNodes, expandedNodes, isFiltering, matchedNodeIds, visibleAncestorIds]);

  // ─── Tree Expand / Collapse Helpers ───
  const handleToggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleExpandAllTree = () => {
    const allBranchIds = new Set();
    nodeMap.forEach(n => {
      if (n.children && n.children.length > 0) {
        allBranchIds.add(n.id);
      }
    });
    setExpandedNodes(allBranchIds);
  };

  const handleCollapseAllTree = () => {
    // Keep only roots expanded, or collapse all completely
    setExpandedNodes(new Set());
  };

  const isTreeExpanded = expandedNodes.size > 0;
  const handleToggleAllTree = () => {
    if (isTreeExpanded) {
      handleCollapseAllTree();
    } else {
      handleExpandAllTree();
    }
  };

  const handleExpandToLevel = (targetDepth) => {
    const targetSet = new Set();
    nodeMap.forEach(n => {
      if (n.depth < targetDepth && n.children && n.children.length > 0) {
        targetSet.add(n.id);
      }
    });
    setExpandedNodes(targetSet);
  };

  // Copy ID helper
  const handleCopyId = (e, id) => {
    e.stopPropagation();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Flat mode multi-version groups
  const multiVersionGroups = useMemo(() => groups.filter(g => g.previousVersions && g.previousVersions.length > 0), [groups]);
  const hasVersions = multiVersionGroups.length > 0;
  const isAnyExpanded = hasVersions && multiVersionGroups.some(g => expandedGroups && expandedGroups.has(g.groupKey));

  const handleToggleVersions = () => {
    if (isAnyExpanded) {
      onCollapseAll && onCollapseAll();
    } else {
      onExpandAll && onExpandAll();
    }
  };

  // Flat mode filtered groups
  const flatFilteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase();
    return groups.filter(g => {
      const name = (g.name || '').toLowerCase();
      const id = (g.id || '').toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [groups, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
      
      {/* ─── Metric & KPI Header Strip ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        marginTop: '6px'
      }}>
        {/* Total Categories */}
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(230,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--ds-brand)'
          }}><Icon name="folder" size={18} /></div>
          <div>
            <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Total Categories
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: C.text, lineHeight: '1.2' }}>
              {totalCategoryCount}
            </div>
          </div>
        </div>

        {/* Root Elements */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(16,185,129,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--ds-ok)'
          }}><Icon name="tree" size={18} /></div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ds-ok)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Root Elements
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--ds-ok)', lineHeight: '1.2' }}>
              {rootNodes.length}
              {rootNodes.length === 1 && (
                <span style={{ fontSize: '11px', fontWeight: '600', color: C.muted, marginLeft: '6px' }}>
                  ({rootNodes[0]?.name || rootNodes[0]?.id})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Hierarchy Tree Depth */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'rgba(124,58,237,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: 'var(--ds-spec)'
          }}><Icon name="tree" size={18} /></div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ds-spec)', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Hierarchy Depth
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--ds-spec)', lineHeight: '1.2' }}>
              {maxTreeDepth + 1} Levels
              <span style={{ fontSize: '11px', fontWeight: '600', color: C.muted, marginLeft: '6px' }}>
                ({branchCount} branches)
              </span>
            </div>
          </div>
        </div>

        {/* Active Mode */}
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>
              Active View Mode
            </div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{viewMode === 'hierarchy' ? 'Hierarchical Tree' : 'Flat List'}</span>
            </div>
          </div>

          {/* Mode Switcher Pill */}
          <div style={{ display: 'inline-flex', background: 'var(--ds-surface-2)', padding: '2px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => setViewMode('hierarchy')}
              style={{
                background: viewMode === 'hierarchy' ? '#ffffff' : 'transparent',
                border: 'none',
                color: viewMode === 'hierarchy' ? 'var(--ds-brand)' : C.muted,
                fontWeight: viewMode === 'hierarchy' ? '700' : '500',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: viewMode === 'hierarchy' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="View categories in hierarchical order starting from root"
            >
              <span><Icon name="tree" size={14} /></span>
              <span>Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('flat')}
              style={{
                background: viewMode === 'flat' ? '#ffffff' : 'transparent',
                border: 'none',
                color: viewMode === 'flat' ? 'var(--ds-brand)' : C.muted,
                fontWeight: viewMode === 'flat' ? '700' : '500',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                boxShadow: viewMode === 'flat' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="View categories in flat table"
            >
              <span><Icon name="clipboard" size={14} /></span>
              <span>Flat</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Toolbar: Tree / Flat Controls, Search & Refresh ─── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'var(--ds-surface-subtle)',
        border: `1px solid ${C.border}`,
        borderRadius: '8px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left Toolbar Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={viewMode === 'hierarchy' ? 'Filter tree (expands matching branches)…' : 'Search categories…'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 26px 6px 12px',
                borderRadius: '6px',
                border: `1px solid ${searchQuery ? 'var(--ds-brand)' : 'var(--ds-border-strong)'}`,
                background: searchQuery ? 'rgba(230,0,0,0.04)' : '#ffffff',
                color: C.text,
                fontSize: '12px',
                width: '260px',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: C.muted,
                  fontSize: '12px',
                  cursor: 'pointer',
                  padding: '2px'
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tree-Specific Expansion Actions */}
          {viewMode === 'hierarchy' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleToggleAllTree}
                style={{
                  background: isTreeExpanded ? 'rgba(230,0,0,0.06)' : '#ffffff',
                  border: `1px solid ${isTreeExpanded ? 'rgba(230,0,0,0.3)' : C.border}`,
                  color: isTreeExpanded ? 'var(--ds-brand-dark)' : C.text,
                  padding: '4px 10px',
                  borderRadius: '5px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
                title={isTreeExpanded ? "Collapse all tree branches" : "Expand all tree branches"}
              >
                <span>{isTreeExpanded ? '⊟' : '⊞'}</span>
                <span>{isTreeExpanded ? 'Collapse All' : 'Expand All'}</span>
              </button>

              {/* Level Preset Buttons */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', background: 'var(--ds-border)', padding: '2px', borderRadius: '5px' }}>
                <span style={{ fontSize: '11px', color: C.muted, padding: '0 4px', fontWeight: '700' }}>LEVEL:</span>
                <button
                  type="button"
                  onClick={() => handleExpandToLevel(1)}
                  style={{
                    background: '#ffffff',
                    border: 'none',
                    color: C.text,
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Expand to Root level only"
                >
                  L1
                </button>
                <button
                  type="button"
                  onClick={() => handleExpandToLevel(2)}
                  style={{
                    background: '#ffffff',
                    border: 'none',
                    color: C.text,
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Expand to Level 2"
                >
                  L2
                </button>
                <button
                  type="button"
                  onClick={() => handleExpandToLevel(3)}
                  style={{
                    background: '#ffffff',
                    border: 'none',
                    color: C.text,
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="Expand to Level 3"
                >
                  L3
                </button>
              </div>

              {isFiltering && (
                <span style={{ fontSize: '11px', color: 'var(--ds-warn)', background: 'var(--ds-warn-soft)', border: '1px solid var(--ds-warn-border)', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                  {matchedNodeIds.size} match{matchedNodeIds.size !== 1 ? 'es' : ''} in tree
                </span>
              )}
            </div>
          )}

          {/* Flat Mode Versions Button */}
          {viewMode === 'flat' && hasVersions && (
            <div style={{ position: 'relative' }} ref={versionMenuRef}>
              <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleToggleVersions}
                  style={{
                    background: isAnyExpanded ? 'rgba(230,0,0,0.08)' : '#ffffff',
                    border: `1px solid ${isAnyExpanded ? 'var(--ds-brand)' : C.border}`,
                    borderRight: 'none',
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    borderTopLeftRadius: '5px',
                    borderBottomLeftRadius: '5px',
                    color: isAnyExpanded ? 'var(--ds-brand)' : C.text,
                    padding: '4px 9px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{isAnyExpanded ? '⊟' : '⊞'}</span>
                  <span>{isAnyExpanded ? 'Collapse Versions' : 'Expand Versions'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVersionMenuOpen(prev => !prev)}
                  style={{
                    background: isAnyExpanded ? 'rgba(230,0,0,0.08)' : '#ffffff',
                    border: `1px solid ${isAnyExpanded ? 'var(--ds-brand)' : C.border}`,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    borderTopRightRadius: '5px',
                    borderBottomRightRadius: '5px',
                    color: isAnyExpanded ? 'var(--ds-brand)' : C.muted,
                    padding: '4px 6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  ▼
                </button>
              </div>

              {isVersionMenuOpen && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 'calc(100% + 6px)',
                  background: '#ffffff',
                  border: `1px solid var(--ds-border-strong)`,
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  zIndex: 100,
                  minWidth: '165px',
                  overflow: 'hidden',
                  padding: '4px 0'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionMenuOpen(false);
                      onExpandAll && onExpandAll();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>⊞</span>
                    <span>Expand All Versions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVersionMenuOpen(false);
                      onCollapseAll && onCollapseAll();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 12px',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>⊟</span>
                    <span>Collapse All Versions</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── VIEW 1: HIERARCHICAL TREE VIEW ─── */}
      {viewMode === 'hierarchy' ? (
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          {visibleTreeRows.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>
              {isFiltering ? `No categories found matching "${searchQuery}".` : 'No categories available in catalog.'}
            </div>
          ) : (
            <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  borderBottom: `1px solid ${C.border}`,
                  background: 'var(--ds-surface-subtle)',
                  color: C.muted,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}>
                  <th style={{ padding: '10px 8px', width: '38px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={groups.length > 0 && selectedIds.size === groups.length}
                      onChange={onToggleSelectAll}
                      style={{ cursor: 'pointer', accentColor: C.indigo }}
                      title="Select all categories"
                    />
                  </th>
                  <th style={{ padding: '10px 12px' }}>
                    Category Hierarchy & Name
                  </th>
                  <th style={{ padding: '10px 12px', width: '150px' }}>ID / Code</th>
                  <th style={{ padding: '10px 12px', width: '90px' }}>Version</th>
                  <th style={{ padding: '10px 12px', width: '180px' }}>Subcategories</th>
                  <th style={{ padding: '10px 12px', width: '110px' }}>Status</th>
                  <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleTreeRows.map(({ node, depth, hasChildren, isExpanded, isDirectMatch }) => {
                  const isSelected = selectedIds.has(node.id);
                  const isLaunched = (node.lifecycleStatus || '').toLowerCase() === 'launched';
                  const isInStudy = (node.lifecycleStatus || '').toLowerCase() === 'in study';
                  const isRoot = node.isRoot || depth === 0;

                  return (
                    <tr
                      key={node.id}
                      onDoubleClick={() => onOpenDetail && onOpenDetail(node.item)}
                      title="Double-click to view details"
                      style={{
                        borderBottom: `1px solid ${C.border}`,
                        background: isDirectMatch
                          ? 'rgba(245,158,11,0.08)'
                          : isSelected
                            ? 'rgba(230,0,0,0.06)'
                            : isRoot
                              ? 'rgba(16,185,129,0.03)'
                              : '#ffffff',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isDirectMatch
                          ? 'rgba(245,158,11,0.15)'
                          : isSelected
                            ? 'rgba(230,0,0,0.1)'
                            : 'var(--ds-surface-subtle)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isDirectMatch
                          ? 'rgba(245,158,11,0.08)'
                          : isSelected
                            ? 'rgba(230,0,0,0.06)'
                            : isRoot
                              ? 'rgba(16,185,129,0.03)'
                              : '#ffffff';
                      }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => onToggleSelectItem && onToggleSelectItem(node.id)}
                          style={{ cursor: 'pointer', accentColor: C.indigo }}
                        />
                      </td>

                      {/* Hierarchy Tree Node & Name */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          paddingLeft: `${depth * 24}px`,
                          position: 'relative'
                        }}>
                          {/* Tree Indentation Guide Line */}
                          {depth > 0 && (
                            <span style={{
                              position: 'absolute',
                              left: `${(depth * 24) - 12}px`,
                              top: '-8px',
                              bottom: '50%',
                              width: '10px',
                              borderLeft: '1px dashed var(--ds-border-strong)',
                              borderBottom: '1px dashed var(--ds-border-strong)',
                              pointerEvents: 'none'
                            }} />
                          )}

                          {/* Expand/Collapse Toggle or Leaf Bullet */}
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleNode(node.id);
                              }}
                              style={{
                                width: '20px',
                                height: '20px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: isExpanded ? 'rgba(230,0,0,0.08)' : 'var(--ds-surface-2)',
                                border: `1px solid ${isExpanded ? 'rgba(230,0,0,0.3)' : 'var(--ds-border-strong)'}`,
                                borderRadius: '4px',
                                color: isExpanded ? 'var(--ds-brand)' : C.muted,
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                padding: 0,
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}
                              title={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name} (${node.children.length} subcategories)`}
                            >
                              {isExpanded ? '▼' : '▶'}
                            </button>
                          ) : (
                            <span style={{
                              width: '20px',
                              height: '20px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--ds-text-3)',
                              fontSize: '12px',
                              flexShrink: 0
                            }}>
                              •
                            </span>
                          )}

                          {/* Icon indicator */}
                          <span style={{
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            background: isRoot ? 'rgba(16,185,129,0.1)' : hasChildren ? 'var(--ds-warn-soft)' : 'var(--ds-surface-subtle)',
                            border: `1px solid ${isRoot ? 'rgba(16,185,129,0.25)' : hasChildren ? 'var(--ds-warn-border)' : 'var(--ds-border)'}`,
                            flexShrink: 0
                          }}>
                            <Icon name={isRoot ? '' : hasChildren ? 'folder' : 'file'} size={14} />
                          </span>

                          {/* Level badge */}
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isRoot ? 'rgba(16,185,129,0.12)' : 'var(--ds-surface-2)',
                            color: isRoot ? 'var(--ds-ok)' : C.muted,
                            border: `1px solid ${isRoot ? 'rgba(16,185,129,0.3)' : 'var(--ds-border)'}`,
                            flexShrink: 0
                          }}>
                            {isRoot ? 'ROOT' : `L${depth}`}
                          </span>

                          {/* Category Name (Clickable) */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDetail && onOpenDetail(node.item);
                            }}
                            style={{
                              fontSize: isRoot ? '13.5px' : '13px',
                              fontWeight: isRoot ? '800' : hasChildren ? '700' : '600',
                              color: isDirectMatch ? 'var(--ds-warn)' : C.text,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              textDecoration: 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ds-brand)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = isDirectMatch ? 'var(--ds-warn)' : C.text}
                            title={`Click to view Category details for ${node.name}`}
                          >
                            <span>{node.name}</span>
                            {isDirectMatch && (
                              <span style={{
                                fontSize: '11px',
                                background: '#fef3c7',
                                color: 'var(--ds-warn)',
                                border: '1px solid var(--ds-warn-border)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: '700'
                              }}>
                                Match
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ID / Code */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <code style={{
                            fontSize: '12px',
                            color: isRoot ? 'var(--ds-ok)' : 'var(--ds-warn)',
                            background: 'var(--ds-surface-subtle)',
                            border: '1px solid var(--ds-border)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontFamily: 'var(--ds-font-mono)',
                            fontWeight: '600'
                          }}>
                            {node.id}
                          </code>
                          <button
                            type="button"
                            onClick={(e) => handleCopyId(e, node.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedId === node.id ? 'var(--ds-ok)' : C.muted,
                              cursor: 'pointer',
                              padding: '2px',
                              fontSize: '11px'
                            }}
                            title={copiedId === node.id ? 'Copied!' : 'Copy category ID'}
                          >
                            {copiedId === node.id ? '✓' : ''}
                          </button>
                        </div>
                      </td>

                      {/* Version */}
                      <td style={{ padding: '10px 12px' }}>
                        <VersionCell version={node.version} />
                      </td>

                      {/* Subcategories Breakdown */}
                      <td style={{ padding: '10px 12px' }}>
                        {hasChildren ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              color: 'var(--ds-spec)',
                              background: 'rgba(124,58,237,0.08)',
                              border: '1px solid rgba(124,58,237,0.25)',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {node.children.length} direct
                            </span>
                            {node.totalDescendants > node.children.length && (
                              <span style={{ fontSize: '11px', color: C.muted }}>
                                ({node.totalDescendants} in subtree)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--ds-text-3)', fontStyle: 'italic' }}>
                            Leaf node
                          </span>
                        )}
                      </td>

                      {/* Lifecycle Status */}
                      <td style={{ padding: '10px 12px' }}>
                        <LifecyclePill status={node.lifecycleStatus} />
                      </td>

                      {/* Action */}
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDetail && onOpenDetail(node.item);
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid var(--ds-border)',
                            borderRadius: '4px',
                            color: 'var(--ds-brand)',
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '3px 8px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--ds-brand)';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = 'var(--ds-brand)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = 'var(--ds-brand)';
                            e.currentTarget.style.borderColor = 'var(--ds-border)';
                          }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ─── VIEW 2: FLAT TABLE VIEW ─── */
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <table className="ds-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{
                borderBottom: `1px solid ${C.border}`,
                background: 'var(--ds-surface-subtle)',
                color: C.muted,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                <th style={{ padding: '10px 8px', width: '38px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={flatFilteredGroups.length > 0 && selectedIds.size === flatFilteredGroups.length}
                    onChange={onToggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: C.indigo }}
                  />
                </th>
                <th style={{ padding: '10px 12px' }}>Category Name</th>
                <th style={{ padding: '10px 12px', width: '150px' }}>ID / Code</th>
                <th style={{ padding: '10px 12px', width: '90px' }}>Version</th>
                <th style={{ padding: '10px 12px', width: '220px' }}>Hierarchy Role</th>
                <th style={{ padding: '10px 12px', width: '140px' }}>Subcategories</th>
                <th style={{ padding: '10px 12px', width: '110px' }}>Status</th>
                <th style={{ padding: '10px 12px', width: '100px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {flatFilteredGroups.map((group) => {
                const item = group.latestItem;
                const raw = item.raw || item || {};
                const isSelected = selectedIds.has(item.id);
                const isExpanded = expandedGroups.has(group.groupKey);
                const hasMultipleVersions = group.previousVersions && group.previousVersions.length > 0;
                const isRoot = Boolean(raw.isRoot === true || !raw.parentId);
                const parentNode = raw.parentId ? nodeMap.get(raw.parentId) : null;
                const subCount = Array.isArray(raw.subCategory) ? raw.subCategory.length : 0;
                const isLaunched = (item.lifecycleStatus || '').toLowerCase() === 'launched';
                const isInStudy = (item.lifecycleStatus || '').toLowerCase() === 'in study';

                return (
                  <tr
                    key={group.groupKey}
                    onDoubleClick={() => onOpenDetail && onOpenDetail(item)}
                    title="Double-click to view details"
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      background: isSelected ? 'rgba(230,0,0,0.06)' : '#ffffff',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(230,0,0,0.1)' : 'var(--ds-surface-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? 'rgba(230,0,0,0.06)' : '#ffffff';
                    }}
                  >
                    {/* Checkbox */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => onToggleSelectItem && onToggleSelectItem(item.id)}
                        style={{ cursor: 'pointer', accentColor: C.indigo }}
                      />
                    </td>

                    {/* Name */}
                    <td style={{ padding: '10px 12px' }}>
                      <div
                        onClick={() => onOpenDetail && onOpenDetail(item)}
                        style={{
                          fontWeight: '700',
                          color: C.text,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--ds-brand)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = C.text}
                      >
                        <span><Icon name={isRoot ? '' : subCount > 0 ? 'folder' : 'file'} size={14} /></span>
                        <span>{item.name || item.id}</span>
                      </div>
                    </td>

                    {/* ID */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <code style={{ fontSize: '12px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>
                          {item.id}
                        </code>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(e, item.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: copiedId === item.id ? 'var(--ds-ok)' : C.muted,
                            cursor: 'pointer',
                            padding: '2px',
                            fontSize: '11px'
                          }}
                          title={copiedId === item.id ? 'Copied!' : 'Copy category ID'}
                        >
                          {copiedId === item.id ? '✓' : ''}
                        </button>
                      </div>
                    </td>

                    {/* Version */}
                    <td style={{ padding: '10px 12px' }}>
                      <VersionCell version={item.version} />
                    </td>

                    {/* Hierarchy Role */}
                    <td style={{ padding: '10px 12px' }}>
                      {isRoot ? (
                        <span style={{ fontSize: '11px', color: 'var(--ds-ok)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: '700' }}>
                          <Icon name="tree" size={14} /> Root Element
                        </span>
                      ) : parentNode ? (
                        <div style={{ fontSize: '11px', color: C.muted, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <span>↳ Child of</span>
                          <span style={{ fontWeight: '600', color: C.text }}>{parentNode.name}</span>
                          <code style={{ fontSize: '11px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>[{parentNode.id}]</code>
                        </div>
                      ) : raw.parentId ? (
                        <div style={{ fontSize: '11px', color: C.muted }}>
                          ↳ Child of <code style={{ fontSize: '11px', color: 'var(--ds-warn)', fontFamily: 'var(--ds-font-mono)' }}>[{raw.parentId}]</code>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: C.muted }}>Independent</span>
                      )}
                    </td>

                    {/* Subcategories */}
                    <td style={{ padding: '10px 12px' }}>
                      {subCount > 0 ? (
                        <span style={{ fontSize: '11px', color: 'var(--ds-spec)', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                          {subCount} subcategories
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>None</span>
                      )}
                    </td>

                    {/* Lifecycle Status */}
                    <td style={{ padding: '10px 12px' }}>
                      <LifecyclePill status={item.lifecycleStatus} />
                    </td>

                    {/* Action */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenDetail && onOpenDetail(item);
                        }}
                        style={{
                          background: 'none',
                          border: '1px solid var(--ds-border)',
                          borderRadius: '4px',
                          color: 'var(--ds-brand)',
                          fontSize: '11px',
                          fontWeight: '600',
                          padding: '3px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
