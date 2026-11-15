import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';

/**
 * Searchable Specification Combobox with live keystroke filtering
 * Formatted based on DNEXT Catalog definitions: Name, Version pill, and Unique ID.
 */
export default function SearchableSpecSelect({
  specs = [],
  selectedSpec,
  onChange,
  compact = false,
  placeholder = 'Type keystrokes to search...'
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

  // Filter specs by query as typed in with keystrokes
  const filteredSpecs = useMemo(() => {
    if (!searchQuery.trim()) return specs;
    const q = searchQuery.toLowerCase().trim();
    return specs.filter(s => {
      const nameMatch = (s.name || '').toLowerCase().includes(q);
      const idMatch = (s.id || '').toLowerCase().includes(q);
      const verMatch = (`v${s.version}`.toLowerCase().includes(q) || String(s.version) === q);
      return nameMatch || idMatch || verMatch;
    });
  }, [specs, searchQuery]);

  const selectedKey = selectedSpec?.id ? `${selectedSpec.id}:::${selectedSpec.version !== undefined ? selectedSpec.version : '0'}` : '';

  const handleSelect = (spec) => {
    onChange(spec);
    setIsOpen(false);
    setSearchQuery('');
  };

  const currentDisplayLabel = selectedSpec?.id
    ? (selectedSpec.name && selectedSpec.name !== selectedSpec.id
        ? `${selectedSpec.name} (v${selectedSpec.version !== undefined ? selectedSpec.version : '0'}) · ID: ${selectedSpec.id}`
        : `${selectedSpec.name || selectedSpec.id} (v${selectedSpec.version !== undefined ? selectedSpec.version : '0'})`)
    : '';

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: compact ? '380px' : '100%' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: `1px solid ${isOpen ? 'var(--ds-spec)' : 'rgba(124,58,237,0.4)'}`,
          borderRadius: compact ? '4px' : '6px',
          boxShadow: isOpen ? '0 0 0 2px rgba(124,58,237,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ padding: compact ? '0 6px' : '0 10px', color: 'var(--ds-spec)', display: 'flex', alignItems: 'center' }}>
          <Icon name="search" size={compact ? 12 : 14} />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchQuery : (searchQuery || currentDisplayLabel)}
          placeholder={placeholder}
          onFocus={() => {
            setIsOpen(true);
            setSearchQuery('');
          }}
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
            padding: compact ? '3px 6px 3px 0' : '8px 10px 8px 0',
            fontSize: compact ? '11.5px' : '13px',
            fontWeight: '600',
            color: 'var(--ds-text)',
            width: '100%'
          }}
        />
        {/* Clear Search Query button */}
        {isOpen && searchQuery && (
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
              setSearchQuery('');
              setTimeout(() => inputRef.current?.focus(), 50);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ds-spec)',
            cursor: 'pointer',
            padding: compact ? '3px 8px' : '8px 12px',
            display: 'flex',
            alignItems: 'center',
            borderLeft: '1px solid rgba(124,58,237,0.15)'
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
              padding: '6px 10px',
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
              {searchQuery ? `Matching "${searchQuery}"` : 'All Available Specifications'}
            </span>
            <span style={{ fontWeight: '700', color: 'var(--ds-spec)' }}>
              {filteredSpecs.length} of {specs.length}
            </span>
          </div>

          {/* List items */}
          {filteredSpecs.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ds-text-2)', fontSize: '12px', fontStyle: 'italic' }}>
              No specifications found matching "{searchQuery}".
            </div>
          ) : (
            filteredSpecs.map(s => {
              const itemKey = `${s.id}:::${s.version}`;
              const isSelected = itemKey === selectedKey;
              const isSameName = (s.name || '').trim().toLowerCase() === (s.id || '').trim().toLowerCase();

              return (
                <div
                  key={itemKey}
                  onClick={() => handleSelect(s)}
                  style={{
                    padding: compact ? '6px 10px' : '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(124,58,237,0.08)' : '#ffffff',
                    borderBottom: '1px solid var(--ds-surface-subtle)',
                    transition: 'background 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(124,58,237,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: compact ? '12px' : '13px', fontWeight: '700', color: isSelected ? 'var(--ds-spec)' : 'var(--ds-text)' }}>
                        {s.name || s.id}
                      </span>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: '700',
                          background: 'rgba(124,58,237,0.14)',
                          color: 'var(--ds-spec)',
                          padding: '1px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        v{s.version}
                      </span>
                    </div>
                    {!isSameName && (
                      <div style={{ fontSize: '10.5px', color: 'var(--ds-text-2)', fontFamily: 'var(--ds-font-mono)' }}>
                        ID: {s.id}
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <span style={{ fontSize: '12px', color: 'var(--ds-spec)', fontWeight: '700' }}>
                      ✓
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
