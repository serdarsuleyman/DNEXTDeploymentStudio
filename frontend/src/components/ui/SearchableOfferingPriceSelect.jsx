import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from './Icon';

/**
 * Searchable Offering Combobox for assigning Price Components (POPs)
 * Allows live keystroke search filtering across all catalog offerings,
 * displaying the Offering Name, Version badge, and ID.
 */
export default function SearchableOfferingPriceSelect({
  offerings = [],
  onSelectOffering,
  onAddCustomBlank,
  placeholder = 'Type to search offering by name or version (e.g. Glasfaser, v1)...'
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

  // Filter offerings by query as typed in with keystrokes
  const filteredOfferings = useMemo(() => {
    if (!searchQuery.trim()) return offerings;
    const q = searchQuery.toLowerCase().trim();
    return offerings.filter(o => {
      const nameMatch = (o.name || '').toLowerCase().includes(q);
      const idMatch = (o.id || '').toLowerCase().includes(q);
      const verMatch = (`v${o.version}`.toLowerCase().includes(q) || String(o.version) === q);
      return nameMatch || idMatch || verMatch;
    });
  }, [offerings, searchQuery]);

  const handleSelect = (offering) => {
    if (!offering) return;
    onSelectOffering(offering);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleBlankCustom = () => {
    if (onAddCustomBlank) {
      onAddCustomBlank();
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#ffffff',
          border: `1px solid ${isOpen ? 'var(--ds-spec)' : 'var(--ds-border)'}`,
          borderRadius: '6px',
          boxShadow: isOpen ? '0 0 0 2px rgba(124,58,237,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
          transition: 'all 0.15s ease'
        }}
      >
        <span style={{ padding: '0 10px', color: 'var(--ds-spec)', display: 'flex', alignItems: 'center' }}>
          <Icon name="tag" size={14} />
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
            maxHeight: '290px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header showing match count and Blank Price Component option */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--ds-surface-subtle)',
              borderBottom: '1px solid var(--ds-border)',
              fontSize: '11px',
              color: 'var(--ds-text-2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px'
            }}
          >
            <span>
              {searchQuery ? `Matching "${searchQuery}"` : 'Select Offering to Assign Price Component'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: '700', color: 'var(--ds-spec)' }}>
                {filteredOfferings.length} of {offerings.length} Offerings
              </span>
              {onAddCustomBlank && (
                <button
                  type="button"
                  onClick={handleBlankCustom}
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    color: 'var(--ds-spec)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                  title="Create a new blank price component from scratch"
                >
                  + Blank Custom Price
                </button>
              )}
            </div>
          </div>

          {/* List items */}
          {filteredOfferings.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--ds-text-2)', fontSize: '12px', fontStyle: 'italic' }}>
              No offerings found matching "{searchQuery}".
              {onAddCustomBlank && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={handleBlankCustom}
                    style={{
                      background: 'var(--ds-spec)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '5px 12px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    + Add New Blank Price Component
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredOfferings.map(offering => {
              const priceInfo = offering.resolvedPriceInfo;
              const hasPops = offering.rawPops && offering.rawPops.length > 0;

              return (
                <div
                  key={`${offering.id}_v${offering.version}`}
                  onClick={() => handleSelect(offering)}
                  style={{
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    background: '#ffffff',
                    borderBottom: '1px solid var(--ds-surface-subtle)',
                    transition: 'background 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(124,58,237,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  {/* Offering Name & Version & ID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <Icon name="package" size={14} color="var(--ds-spec)" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--ds-text)' }}>
                          {offering.name}
                        </span>
                        {/* Offering Version Badge */}
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: '800',
                          color: 'var(--ds-spec)',
                          background: 'rgba(124,58,237,0.1)',
                          border: '1px solid rgba(124,58,237,0.3)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          v{offering.version || '1'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <code style={{
                          fontSize: '10.5px',
                          color: 'var(--ds-text-2)',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {offering.id}
                        </code>
                        {priceInfo?.value !== null && priceInfo?.value !== undefined && (
                          <span style={{ fontSize: '10.5px', color: 'var(--ds-ok)', fontWeight: '600' }}>
                            • {priceInfo.value} {priceInfo.unit} ({priceInfo.period || priceInfo.priceType})
                          </span>
                        )}
                        {hasPops && !priceInfo && (
                          <span style={{ fontSize: '10.5px', color: 'var(--ds-spec)', fontStyle: 'italic' }}>
                            • {offering.rawPops.length} Attached Price Component(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Add Action Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(offering);
                    }}
                    style={{
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid var(--ds-spec)',
                      color: 'var(--ds-spec)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <Icon name="plus" size={11} />
                    <span>Assign Price</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
