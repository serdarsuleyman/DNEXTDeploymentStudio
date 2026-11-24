import React, { useState, useMemo } from 'react';

function isObjectOrArray(val) {
  return val !== null && typeof val === 'object';
}

function matchesSearch(keyName, val, query) {
  if (!query) return false;
  const q = query.toLowerCase();
  if (keyName !== null && keyName !== undefined && String(keyName).toLowerCase().includes(q)) {
    return true;
  }
  if (!isObjectOrArray(val)) {
    return String(val).toLowerCase().includes(q);
  }
  try {
    return JSON.stringify(val).toLowerCase().includes(q);
  } catch {
    return false;
  }
}

function JsonNode({ name, value, depth = 0, defaultExpandedDepth = 2, expandSignal, searchQuery }) {
  const isContainer = isObjectOrArray(value);
  const isArray = Array.isArray(value);
  const keys = useMemo(() => (isContainer ? Object.keys(value) : []), [isContainer, value]);
  const [expanded, setExpanded] = useState(depth < defaultExpandedDepth);
  const [lastSignal, setLastSignal] = useState(expandSignal);

  if (expandSignal !== lastSignal) {
    setLastSignal(expandSignal);
    if (expandSignal > 0) setExpanded(true);
    else if (expandSignal < 0) setExpanded(depth === 0);
  }

  const selfMatches = searchQuery ? matchesSearch(name, value, searchQuery) : false;
  const shouldAutoExpand = Boolean(searchQuery && isContainer && selfMatches);
  const isOpen = shouldAutoExpand || expanded;

  const renderPrimitive = (v) => {
    if (v === null) return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>null</span>;
    if (typeof v === 'boolean') return <span style={{ color: '#7c3aed', fontWeight: '700' }}>{String(v)}</span>;
    if (typeof v === 'number') return <span style={{ color: '#0369a1', fontWeight: '600' }}>{v}</span>;
    return <span style={{ color: '#15803d', wordBreak: 'break-word' }}>&quot;{String(v)}&quot;</span>;
  };

  if (!isContainer) {
    const highlightBg = searchQuery && selfMatches ? '#fef08a' : 'transparent';
    return (
      <div style={{ paddingLeft: `${depth * 16}px`, lineHeight: '1.55', background: highlightBg, borderRadius: '3px' }}>
        {name !== undefined && (
          <>
            <span style={{ color: '#9f1239', fontWeight: '600' }}>&quot;{name}&quot;</span>
            <span style={{ color: '#64748b' }}>: </span>
          </>
        )}
        {renderPrimitive(value)}
      </div>
    );
  }

  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';
  const countLabel = isArray ? `${keys.length} items` : `${keys.length} keys`;

  return (
    <div style={{ paddingLeft: `${depth * 16}px`, lineHeight: '1.55' }}>
      <div
        onClick={() => setExpanded((prev) => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          cursor: 'pointer',
          userSelect: 'none',
          borderRadius: '3px',
          padding: '0 3px'
        }}
      >
        <span style={{ color: '#64748b', fontSize: '10px', width: '10px', display: 'inline-block' }}>
          {keys.length === 0 ? '' : isOpen ? '▼' : '▶'}
        </span>
        {name !== undefined && (
          <>
            <span style={{ color: '#9f1239', fontWeight: '600' }}>&quot;{name}&quot;</span>
            <span style={{ color: '#64748b' }}>: </span>
          </>
        )}
        <span style={{ color: '#334155', fontWeight: '700' }}>{openBracket}</span>
        {!isOpen && keys.length > 0 && (
          <span style={{ color: '#64748b', fontSize: '11px', background: '#e2e8f0', padding: '0 6px', borderRadius: '4px' }}>
            {countLabel}
          </span>
        )}
        {(!isOpen || keys.length === 0) && (
          <span style={{ color: '#334155', fontWeight: '700' }}>{closeBracket}</span>
        )}
      </div>

      {isOpen && keys.length > 0 && (
        <div>
          {keys.map((k) => (
            <JsonNode
              key={k}
              name={isArray ? undefined : k}
              value={value[k]}
              depth={depth + 1}
              defaultExpandedDepth={defaultExpandedDepth}
              expandSignal={expandSignal}
              searchQuery={searchQuery}
            />
          ))}
          <div style={{ paddingLeft: '14px', color: '#334155', fontWeight: '700' }}>{closeBracket}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Interactive JSON Tree Viewer with search, expand/collapse all, and Tree/Raw toggle.
 */
export default function JsonTreeViewer({ data, defaultExpandedDepth = 2 }) {
  const [viewMode, setViewMode] = useState('tree'); // 'tree' | 'raw'
  const [searchQuery, setSearchQuery] = useState('');
  const [expandSignal, setExpandSignal] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '8px' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 220px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search JSON keys or values..."
            style={{
              width: '100%',
              maxWidth: '280px',
              padding: '5px 9px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--ds-border)',
              background: '#ffffff'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {viewMode === 'tree' && (
            <>
              <button
                type="button"
                onClick={() => setExpandSignal((s) => (s > 0 ? s + 1 : 1))}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '5px',
                  border: '1px solid var(--ds-border)',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => setExpandSignal((s) => (s < 0 ? s - 1 : -1))}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '5px',
                  border: '1px solid var(--ds-border)',
                  background: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                Collapse All
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === 'tree' ? 'raw' : 'tree'))}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              borderRadius: '5px',
              border: '1px solid var(--ds-border-strong)',
              background: viewMode === 'tree' ? '#f1f5f9' : '#ffffff',
              cursor: 'pointer'
            }}
          >
            {viewMode === 'tree' ? 'Raw Text' : 'Tree View'}
          </button>
        </div>
      </div>

      {/* Viewer Container */}
      <div
        style={{
          flex: 1,
          background: 'var(--ds-surface-subtle)',
          border: '1px solid var(--ds-border)',
          borderRadius: '8px',
          padding: '14px 16px',
          overflowY: 'auto',
          fontFamily: 'var(--ds-font-mono)',
          fontSize: '12px'
        }}
      >
        {viewMode === 'tree' ? (
          <JsonNode
            value={data}
            depth={0}
            defaultExpandedDepth={defaultExpandedDepth}
            expandSignal={expandSignal}
            searchQuery={searchQuery.trim()}
          />
        ) : (
          <pre style={{ margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap', color: 'var(--ds-text)' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
