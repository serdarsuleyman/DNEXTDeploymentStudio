import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';

/**
 * Searchable Category Combobox with live keystroke filtering
 * Formatted based on DNEXT Catalog definitions: Name, Category ID (FNxxx), and Parent hierarchy.
 */
export default function SearchableCategorySelect({
  categories = [],
  assignedCategoryIds = [],
  onSelectCategory,
  placeholder = 'Type to search category by name or ID (e.g. FN12, FTTH, Mobile)...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure only category items are considered
  const sanitizedCategories = useMemo(() => {
    return (categories || []).filter(c => {
      if (!c || !c.id) return false;
      const type = c['@type'] || c.entityType;
      if (type && type !== 'Category') return false;
      return true;
    });
  }, [categories]);

  // Filter categories by query as typed in with keystrokes
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return sanitizedCategories;
    const q = searchQuery.toLowerCase().trim();
    return sanitizedCategories.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const idMatch = (c.id || '').toLowerCase().includes(q);
      const parentMatch = (c.parentId || '').toLowerCase().includes(q) || (c.parentName || '').toLowerCase().includes(q);
      return nameMatch || idMatch || parentMatch;
    });
  }, [sanitizedCategories, searchQuery]);

  const assignedSet = useMemo(() => {
    const s = new Set();
    (assignedCategoryIds || []).forEach(c => {
      const id = typeof c === 'string' ? c : (c?.id || c?.name);
      if (id) s.add(String(id).toLowerCase());
    });
    return s;
  }, [assignedCategoryIds]);

  const handleSelect = (cat) => {
    if (!cat) return;
    onSelectCategory(cat);
    setSearchQuery('');
    // Keep focus for rapid multi-category adding
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: `1px solid ${isOpen ? 'var(--ds-brand)' : 'var(--ds-border)'}`,
          borderRadius: '6px',
          boxShadow: isOpen ? '0 0 0 2px rgba(230,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ padding: '0 10px', color: 'var(--ds-brand)', display: 'flex', alignItems: 'center' }}>
          <Icon name="search" size={14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '8px 10px 8px 0',
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--ds-text)',
            width: '100%'
          }}
        />
        {/* Clear Search Query button */}
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              if (inputRef.current) inputRef.current.focus();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ds-text-2)',
              cursor: 'pointer',
              padding: '0 6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
        {/* Toggle Dropdown arrow */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ds-text-2)',
            cursor: 'pointer',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            borderLeft: '1px solid var(--ds-border)'
          }}
          title={isOpen ? 'Close menu' : 'Open menu'}
        >
          <span style={{ fontSize: '10px', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>
            ▼
          </span>
        </button>
      </div>

      {/* Floating Filtered Options List */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: '#ffffff',
            border: '1px solid var(--ds-border)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            maxHeight: '260px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header showing match count */}
          <div
            style={{
              padding: '6px 12px',
              background: 'var(--ds-surface-subtle)',
              borderBottom: '1px solid var(--ds-border)',
              fontSize: '11px',
              color: 'var(--ds-text-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              {searchQuery ? `Matching "${searchQuery}"` : 'All Catalog Categories'}
            </span>
            <span style={{ fontWeight: '700', color: 'var(--ds-brand)' }}>
              {filteredCategories.length} of {sanitizedCategories.length}
            </span>
          </div>

          {/* List items */}
          {filteredCategories.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ds-text-2)', fontSize: '12px', fontStyle: 'italic' }}>
              No catalog categories found matching "{searchQuery}".
            </div>
          ) : (
            filteredCategories.map(cat => {
              const isAssigned = assignedSet.has(String(cat.id).toLowerCase());

              return (
                <div
                  key={cat.id}
                  onClick={() => {
                    if (!isAssigned) handleSelect(cat);
                  }}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: isAssigned ? 'default' : 'pointer',
                    background: isAssigned ? 'rgba(0,0,0,0.02)' : '#ffffff',
                    borderBottom: '1px solid var(--ds-surface-subtle)',
                    transition: 'background 0.1s ease',
                    opacity: isAssigned ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isAssigned) e.currentTarget.style.background = 'rgba(230,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isAssigned) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Icon name="folder" size={14} color="var(--ds-brand)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ds-text)' }}>
                          {cat.name}
                        </span>
                        <code style={{
                          fontSize: '11px',
                          color: 'var(--ds-brand-dark)',
                          background: 'rgba(230,0,0,0.06)',
                          border: '1px solid rgba(230,0,0,0.2)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {cat.id}
                        </code>
                      </div>
                      {cat.parentId && (
                        <div style={{ fontSize: '10.5px', color: 'var(--ds-text-2)' }}>
                          Parent: {cat.parentName || cat.parentId}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAssigned ? (
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--ds-ok)',
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        ✓ Assigned
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(cat);
                        }}
                        style={{
                          background: 'rgba(230,0,0,0.08)',
                          border: '1px solid var(--ds-brand)',
                          color: 'var(--ds-brand)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Icon name="plus" size={11} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
