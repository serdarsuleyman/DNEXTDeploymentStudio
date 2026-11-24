import React, { useState, useMemo } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

/**
 * OfferingSpecificationAndOverridesTab
 * 
 * Reusable Specification and Overrides detail tab component for all ProductOffering views
 * (Sales Packages, Options, Hardware, and Generic Offerings).
 * 
 * Supports both:
 *  - View Mode (default): read-only grids of spec linkage, spec overrides, and direct characteristics.
 *  - Edit Mode (editable=true): interactive tables allowing editing/overriding spec characteristics
 *    and dynamically adding/editing/removing direct offering characteristics.
 * 
 * Displays:
 *  1. Associated Product Specification (linked spec details and optional navigation)
 *  2. Spec Characteristic Overrides (from prodSpecCharValueUse)
 *  3. Direct Offering Characteristics (from productOfferingCharacteristic, placed under spec characteristics)
 */
export default function OfferingSpecificationAndOverridesTab({
  raw,
  item,
  specObj,
  specChars: propSpecChars,
  directChars: propDirectChars,
  onNavigateToEntity,
  headerTitle,
  renderEditBar = null,
  renderFooter = null,
  editable = false,
  // Spec char edit callbacks
  onUpdateSpecChar,
  onDeleteSpecChar,
  onArrayValueChange,
  onAddArrayValue,
  onRemoveArrayValue,
  onToggleArrayType,
  // Direct char edit callbacks
  onUpdateDirectChar,
  onDeleteDirectChar,
  onDirectArrayValueChange,
  onAddDirectArrayValue,
  onRemoveDirectArrayValue,
  onToggleDirectArrayType,
  onAddDirectChar
}) {
  const [charSearch, setCharSearch] = useState('');

  // 1. Spec Characteristic Overrides (from prodSpecCharValueUse or raw characteristics)
  const specChars = useMemo(() => {
    if (propSpecChars) return propSpecChars;
    if (Array.isArray(raw?.prodSpecCharValueUse)) return raw.prodSpecCharValueUse;
    if (Array.isArray(item?.prodSpecCharValueUse)) return item.prodSpecCharValueUse;
    if (Array.isArray(raw?.characteristics)) return raw.characteristics;
    if (Array.isArray(raw?.productSpecCharacteristic)) return raw.productSpecCharacteristic;
    return [];
  }, [propSpecChars, raw, item]);

  // 2. Direct Offering Characteristics (from productOfferingCharacteristic)
  const directChars = useMemo(() => {
    if (propDirectChars) return propDirectChars;
    if (Array.isArray(raw?.productOfferingCharacteristic)) return raw.productOfferingCharacteristic;
    if (Array.isArray(item?.productOfferingCharacteristic)) return item.productOfferingCharacteristic;
    return [];
  }, [propDirectChars, raw, item]);

  // Resolved Product Specification
  const activeSpec = useMemo(() => {
    return specObj || raw?.productSpecification || item?.productSpecification || null;
  }, [specObj, raw, item]);

  // Filtered spec characteristics
  const filteredSpecChars = useMemo(() => {
    if (!charSearch.trim()) return specChars;
    const q = charSearch.toLowerCase().trim();
    return specChars.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const valMatch = (
        Array.isArray(c.productSpecCharacteristicValue)
          ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
          : (Array.isArray(c.values) ? c.values : (Array.isArray(c.value) ? c.value : [c.value]))
      ).some(v => String(v || '').toLowerCase().includes(q));
      return nameMatch || valMatch;
    });
  }, [specChars, charSearch]);

  // Filtered direct offering characteristics
  const filteredDirectChars = useMemo(() => {
    if (!charSearch.trim()) return directChars;
    const q = charSearch.toLowerCase().trim();
    return directChars.filter(c => {
      const nameMatch = (c.name || '').toLowerCase().includes(q);
      const valMatch = (
        Array.isArray(c.productOfferingCharacteristicValue)
          ? c.productOfferingCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
          : (Array.isArray(c.productSpecCharacteristicValue)
            ? c.productSpecCharacteristicValue.map(v => (v?.value !== undefined ? v.value : v))
            : (Array.isArray(c.values) ? c.values : (Array.isArray(c.value) ? c.value : [c.value])))
      ).some(v => String(v || '').toLowerCase().includes(q));
      return nameMatch || valMatch;
    });
  }, [directChars, charSearch]);

  const formatCharValue = (char, isDirect = false) => {
    if (isDirect && Array.isArray(char.productOfferingCharacteristicValue) && char.productOfferingCharacteristicValue.length > 0) {
      return char.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
    }
    if (Array.isArray(char.productSpecCharacteristicValue) && char.productSpecCharacteristicValue.length > 0) {
      return char.productSpecCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
    }
    if (Array.isArray(char.values) && char.values.length > 0) {
      return char.values.join(', ');
    }
    if (Array.isArray(char.value)) {
      return char.value.join(', ');
    }
    if (char.value !== undefined && char.value !== null) {
      return String(char.value);
    }
    return 'N/A';
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    fontSize: '12px',
    color: C.text,
    background: '#ffffff',
    border: '1px solid var(--ds-border-strong)',
    borderRadius: '6px',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Optional Edit Bar (e.g. In edit mode for offerings) */}
      {renderEditBar}

      {/* ── Associated Product Specification Linkage Card ── */}
      {activeSpec && (
        <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '13.5px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span><Icon name="clipboard" size={14} /> Associated Product Specification</span>
          </h3>
          <div style={{
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              {onNavigateToEntity ? (
                <button
                  type="button"
                  onClick={() => onNavigateToEntity(activeSpec, 'ProductSpecification')}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--ds-spec)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    textDecoration: 'underline'
                  }}
                  title="Navigate to Product Specification Detail View"
                >
                  <span>{activeSpec.name || activeSpec.id}</span>
                  <span style={{ fontSize: '11px', textDecoration: 'none' }}>↗</span>
                </button>
              ) : (
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ds-spec)' }}>
                  {activeSpec.name || activeSpec.id}
                </div>
              )}
              <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                ID: {activeSpec.id}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {activeSpec.version !== undefined && (
                <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.12)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  v{activeSpec.version}
                </span>
              )}
              {onNavigateToEntity && (
                <button
                  type="button"
                  onClick={() => onNavigateToEntity(activeSpec, 'ProductSpecification')}
                  style={{
                    background: 'var(--ds-spec)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 3px rgba(124,58,237,0.3)',
                    transition: 'opacity 0.15s ease'
                  }}
                  title="Navigate to Product Specification Detail View"
                >
                  <span>View Specification</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 1. Spec Characteristic Overrides Grid (from prodSpecCharValueUse) ── */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span><Icon name="settings" size={14} /> {headerTitle || 'Spec Characteristic Overrides'}</span>
              <span style={{ fontSize: '11px', background: 'rgba(2,132,199,0.1)', color: 'var(--ds-info)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                {filteredSpecChars.length} / {specChars.length}
              </span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
              Characteristic values and parameters configured from the associated product specification (prodSpecCharValueUse).
            </p>
          </div>

          {/* Filter by Characteristic Name / Value */}
          {(specChars.length > 0 || directChars.length > 0) && (
            <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', width: '100%' }}>
              <input
                type="text"
                placeholder="Filter characteristics..."
                value={charSearch}
                onChange={(e) => setCharSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 28px 7px 30px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${C.cardBorder}`,
                  background: 'var(--ds-surface-subtle)',
                  color: C.text,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                <Icon name="search" size={13} />
              </span>
              {charSearch && (
                <button
                  type="button"
                  onClick={() => setCharSearch('')}
                  title="Clear filter"
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: C.muted,
                    cursor: 'pointer',
                    fontSize: '13px',
                    padding: 0,
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Spec Characteristics Content (Read-Only vs Editable Mode) */}
        {filteredSpecChars.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: 'var(--ds-surface-subtle)', borderRadius: '8px' }}>
            {charSearch ? `No specification characteristics matching "${charSearch}".` : 'No specification characteristic overrides configured on this offering.'}
          </div>
        ) : editable ? (
          <div style={{ border: '1px solid var(--ds-border)', borderRadius: '8px', overflow: 'hidden', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', width: '36px', fontSize: '11px', fontWeight: '700' }}>#</th>
                  <th style={{ padding: '8px 12px', width: '35%', fontSize: '11px', fontWeight: '700' }}>Characteristic Name</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700' }}>Configured Override Value(s)</th>
                  {onDeleteSpecChar && (
                    <th style={{ padding: '8px 12px', width: '48px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredSpecChars.map((c, idx) => {
                  const charKey = c.id || c.name || idx;
                  const isArrayMode = Boolean(c.isArray || (Array.isArray(c.values) && c.values.length > 1));
                  const valuesList = Array.isArray(c.values) && c.values.length > 0
                    ? c.values
                    : (c.value !== undefined && c.value !== null ? [c.value] : ['']);

                  return (
                    <tr
                      key={charKey}
                      style={{
                        borderBottom: '1px solid var(--ds-surface-2)',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'var(--ds-text-3)', fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: '600', fontSize: '12.5px', color: 'var(--ds-text)', fontFamily: 'var(--ds-font-mono)' }}>
                          {c.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--ds-font-mono)',
                            fontWeight: '700',
                            background: isArrayMode ? '#ede9fe' : 'var(--ds-surface-2)',
                            color: isArrayMode ? 'var(--ds-spec)' : 'var(--ds-text-2)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${isArrayMode ? 'var(--ds-spec-border)' : 'var(--ds-border)'}`
                          }}>
                            {isArrayMode ? `Array (${valuesList.length})` : 'Single Value'}
                          </span>
                          {c.maxCardinality !== undefined && c.maxCardinality !== null && (
                            <span style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--ds-font-mono)',
                              fontWeight: '600',
                              color: 'var(--ds-text-2)',
                              background: 'var(--ds-surface-subtle)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--ds-border-strong)'
                            }} title={`Cardinality defined in spec: [${c.minCardinality !== undefined ? c.minCardinality : 0}..${c.maxCardinality}]`}>
                              [{c.minCardinality !== undefined ? c.minCardinality : 0}..{c.maxCardinality}]
                            </span>
                          )}
                          {c.valueType && (
                            <span style={{
                              fontSize: '10.5px',
                              fontFamily: 'var(--ds-font-mono)',
                              color: 'var(--ds-text-3)',
                              background: 'var(--ds-surface-2)',
                              padding: '1px 5px',
                              borderRadius: '3px'
                            }}>
                              {c.valueType}
                            </span>
                          )}
                          {onToggleArrayType && (
                            <button
                              type="button"
                              onClick={() => onToggleArrayType(c.id || c.name)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--ds-text-3)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: 'auto'
                              }}
                              title={isArrayMode ? 'Switch to single value' : 'Convert to array of values'}
                            >
                              {isArrayMode ? 'Switch to Single' : 'Convert to Array'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {isArrayMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {valuesList.map((val, vIdx) => (
                              <div key={vIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '10.5px',
                                  color: 'var(--ds-text-3)',
                                  fontFamily: 'var(--ds-font-mono)',
                                  background: 'var(--ds-surface-2)',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  minWidth: '22px',
                                  textAlign: 'center'
                                }}>
                                  [{vIdx}]
                                </span>
                                <input
                                  type="text"
                                  value={val || ''}
                                  onChange={(e) => onArrayValueChange?.(c.id || c.name, vIdx, e.target.value)}
                                  style={{
                                    ...inputStyle,
                                    fontFamily: c.name?.includes('id') || c.name?.includes('code') || c.name?.includes('sku') ? 'monospace' : 'inherit',
                                    color: (c.name === 'psm_aaw_packet_id' || c.name === 'psmAawPacketId') && String(val).startsWith('R025.') ? 'var(--ds-warn)' : C.text,
                                    fontWeight: (c.name === 'psm_aaw_packet_id' || c.name === 'psmAawPacketId') && String(val).startsWith('R025.') ? '700' : 'normal',
                                    flex: 1
                                  }}
                                  placeholder={`Value #${vIdx + 1}...`}
                                />
                                {valuesList.length > 1 && onRemoveArrayValue && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveArrayValue(c.id || c.name, vIdx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--ds-text-3)',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '2px 6px'
                                    }}
                                    title="Remove this value"
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}

                            {onAddArrayValue && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => onAddArrayValue(c.id || c.name)}
                                  disabled={typeof c.maxCardinality === 'number' && valuesList.length >= c.maxCardinality}
                                  style={{
                                    background: '#ffffff',
                                    border: '1px dashed var(--ds-text-3)',
                                    borderRadius: '4px',
                                    padding: '3px 10px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: (typeof c.maxCardinality === 'number' && valuesList.length >= c.maxCardinality) ? 'var(--ds-text-3)' : 'var(--ds-text-2)',
                                    cursor: (typeof c.maxCardinality === 'number' && valuesList.length >= c.maxCardinality) ? 'not-allowed' : 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <span style={{ fontWeight: '700', color: C.vodafoneRed }}>+</span> Add Value
                                </button>
                                <span style={{ fontSize: '11px', color: 'var(--ds-text-3)' }}>
                                  ({valuesList.length} {valuesList.length === 1 ? 'item' : 'items'} in array
                                  {c.maxCardinality !== undefined && c.maxCardinality !== null ? ` · max ${c.maxCardinality}` : ''})
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              value={valuesList[0] !== undefined ? valuesList[0] : (c.value || '')}
                              onChange={(e) => {
                                if (onArrayValueChange) {
                                  onArrayValueChange(c.id || c.name, 0, e.target.value);
                                } else if (onUpdateSpecChar) {
                                  onUpdateSpecChar(c.id || c.name, 'value', e.target.value);
                                }
                              }}
                              style={{
                                ...inputStyle,
                                fontFamily: c.name?.includes('id') || c.name?.includes('code') || c.name?.includes('sku') ? 'monospace' : 'inherit',
                                color: c.name === 'psm_aaw_packet_id' ? 'var(--ds-warn)' : C.text,
                                fontWeight: c.name === 'psm_aaw_packet_id' ? '700' : 'normal',
                                flex: 1
                              }}
                              placeholder="Value..."
                            />
                            {c.maxCardinality === 1 ? (
                              <span style={{
                                fontSize: '11px',
                                color: 'var(--ds-text-3)',
                                fontFamily: 'var(--ds-font-mono)',
                                whiteSpace: 'nowrap'
                              }} title="Max cardinality is 1 per characteristic definition">
                                [max 1]
                              </span>
                            ) : onAddArrayValue ? (
                              <button
                                type="button"
                                onClick={() => onAddArrayValue(c.id || c.name)}
                                style={{
                                  background: 'var(--ds-surface-subtle)',
                                  border: '1px solid var(--ds-border-strong)',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  color: 'var(--ds-text-2)',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Add another value"
                              >
                                + Add Value
                              </button>
                            ) : null}
                          </div>
                        )}
                      </td>
                      {onDeleteSpecChar && (
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onDeleteSpecChar(c.id || c.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ds-text-3)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                            title="Delete Characteristic Override"
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
            {filteredSpecChars.map((char, i) => (
              <div key={i} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{char.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--ds-info)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {formatCharValue(char, false)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 2. Direct Offering Characteristics Grid (from productOfferingCharacteristic) ── */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--ds-spec)' }}><Icon name="sliders" size={14} /> Direct Offering Characteristics</span>
              <span style={{ fontSize: '11px', background: 'rgba(124,58,237,0.1)', color: 'var(--ds-spec)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                {filteredDirectChars.length} / {directChars.length}
              </span>
            </h3>
            <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.muted }}>
              Characteristics configured directly on this offering (productOfferingCharacteristic).
            </p>
          </div>

          {/* Add Direct Characteristic Button in Edit Mode */}
          {editable && onAddDirectChar && (
            <button
              type="button"
              onClick={onAddDirectChar}
              style={{
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                color: 'var(--ds-spec)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--ds-spec)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(124,58,237,0.1)';
                e.currentTarget.style.color = 'var(--ds-spec)';
              }}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>+</span> Add Direct Characteristic
            </button>
          )}
        </div>

        {/* Direct Characteristics Content (Read-Only vs Editable Mode) */}
        {filteredDirectChars.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: 'var(--ds-surface-subtle)', borderRadius: '8px' }}>
            {charSearch
              ? `No direct characteristics matching "${charSearch}".`
              : (editable
                ? 'No direct characteristics configured yet. Click "+ Add Direct Characteristic" above to add characteristics directly to the offer.'
                : 'No direct characteristics configured on this offering (productOfferingCharacteristic).')}
          </div>
        ) : editable ? (
          <div style={{ border: '1px solid var(--ds-border)', borderRadius: '8px', overflow: 'hidden', maxHeight: '420px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: '1px solid var(--ds-border)', color: 'var(--ds-text-2)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', width: '36px', fontSize: '11px', fontWeight: '700' }}>#</th>
                  <th style={{ padding: '8px 12px', width: '35%', fontSize: '11px', fontWeight: '700' }}>Characteristic Name</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '700' }}>Configured Value(s)</th>
                  {onDeleteDirectChar && (
                    <th style={{ padding: '8px 12px', width: '48px', textAlign: 'center', fontSize: '11px', fontWeight: '700' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredDirectChars.map((c, idx) => {
                  const charKey = c.id || c.name || idx;
                  const isArrayMode = Boolean(c.isArray || (Array.isArray(c.values) && c.values.length > 1));
                  const valuesList = Array.isArray(c.values) && c.values.length > 0
                    ? c.values
                    : (Array.isArray(c.productOfferingCharacteristicValue)
                      ? c.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v))
                      : (c.value !== undefined && c.value !== null ? [String(c.value)] : ['']));

                  return (
                    <tr
                      key={charKey}
                      style={{
                        borderBottom: '1px solid var(--ds-surface-2)',
                        background: idx % 2 === 0 ? '#ffffff' : '#fafafa'
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: 'var(--ds-text-3)', fontSize: '11px', fontFamily: 'var(--ds-font-mono)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        <input
                          type="text"
                          value={c.name || ''}
                          onChange={(e) => onUpdateDirectChar?.(c.id || idx, 'name', e.target.value)}
                          placeholder="e.g. portfolio_id..."
                          style={{
                            ...inputStyle,
                            fontFamily: 'var(--ds-font-mono)',
                            fontWeight: '600',
                            color: 'var(--ds-text)'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                          <span style={{
                            fontSize: '10.5px',
                            fontFamily: 'var(--ds-font-mono)',
                            fontWeight: '700',
                            background: isArrayMode ? '#ede9fe' : 'var(--ds-surface-2)',
                            color: isArrayMode ? 'var(--ds-spec)' : 'var(--ds-text-2)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${isArrayMode ? 'var(--ds-spec-border)' : 'var(--ds-border)'}`
                          }}>
                            {isArrayMode ? `Array (${valuesList.length})` : 'Single Value'}
                          </span>
                          {onToggleDirectArrayType && (
                            <button
                              type="button"
                              onClick={() => onToggleDirectArrayType(c.id || idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--ds-text-3)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                marginLeft: 'auto'
                              }}
                              title={isArrayMode ? 'Switch to single value' : 'Convert to array of values'}
                            >
                              {isArrayMode ? 'Switch to Single' : 'Convert to Array'}
                            </button>
                          )}
                        </div>
                        {onUpdateDirectChar && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed var(--ds-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                              <select
                                value={c.valueType || 'string'}
                                onChange={(e) => onUpdateDirectChar(c.id || idx, 'valueType', e.target.value)}
                                title="valueType"
                                style={{ ...inputStyle, padding: '3px 6px', fontSize: '11px' }}
                              >
                                <option value="string">string</option>
                                <option value="number">number</option>
                                <option value="integer">integer</option>
                                <option value="boolean">boolean</option>
                              </select>
                              <select
                                value={c.characteristicType || 'Simple Value'}
                                onChange={(e) => onUpdateDirectChar(c.id || idx, 'characteristicType', e.target.value)}
                                title="characteristicType"
                                style={{ ...inputStyle, padding: '3px 6px', fontSize: '11px' }}
                              >
                                <option value="Simple Value">Simple Value</option>
                                <option value="List of Values">List of Values</option>
                                <option value="Range">Range</option>
                              </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '64px 64px 1fr', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                value={c.minCardinality !== undefined ? c.minCardinality : 0}
                                onChange={(e) => onUpdateDirectChar(c.id || idx, 'minCardinality', Number(e.target.value) || 0)}
                                title="minCardinality"
                                placeholder="min"
                                style={{ ...inputStyle, padding: '3px 6px', fontSize: '11px' }}
                              />
                              <input
                                type="number"
                                min="0"
                                value={c.maxCardinality !== undefined ? c.maxCardinality : 1}
                                onChange={(e) => onUpdateDirectChar(c.id || idx, 'maxCardinality', Number(e.target.value) || 1)}
                                title="maxCardinality"
                                placeholder="max"
                                style={{ ...inputStyle, padding: '3px 6px', fontSize: '11px' }}
                              />
                              <select
                                value={c['@type'] || 'ProductOfferingPriceCharacteristic'}
                                onChange={(e) => onUpdateDirectChar(c.id || idx, '@type', e.target.value)}
                                title="@type"
                                style={{ ...inputStyle, padding: '3px 6px', fontSize: '11px' }}
                              >
                                <option value="ProductOfferingPriceCharacteristic">ProductOfferingPriceCharacteristic</option>
                                <option value="ProductOfferingCharacteristic">ProductOfferingCharacteristic</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '11px', color: 'var(--ds-text-2)' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={c.configurable !== undefined ? Boolean(c.configurable) : true}
                                  onChange={(e) => onUpdateDirectChar(c.id || idx, 'configurable', e.target.checked)}
                                />
                                configurable
                              </label>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(c.extensible)}
                                  onChange={(e) => onUpdateDirectChar(c.id || idx, 'extensible', e.target.checked)}
                                />
                                extensible
                              </label>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(c.isUnique)}
                                  onChange={(e) => onUpdateDirectChar(c.id || idx, 'isUnique', e.target.checked)}
                                />
                                isUnique
                              </label>
                            </div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                        {isArrayMode ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {valuesList.map((val, vIdx) => {
                              const pocvEntry = Array.isArray(c.productOfferingCharacteristicValue) ? c.productOfferingCharacteristicValue[vIdx] : null;
                              const updatePocvField = (fieldKey, fieldVal) => {
                                if (!onUpdateDirectChar) return;
                                const nextPocv = valuesList.map((v, i) => {
                                  const prevItem = Array.isArray(c.productOfferingCharacteristicValue) ? (c.productOfferingCharacteristicValue[i] || {}) : {};
                                  return {
                                    value: v !== undefined ? String(v) : '',
                                    valueType: prevItem.valueType || c.valueType || 'string',
                                    isDefault: prevItem.isDefault ?? false,
                                    ...(prevItem.unitOfMeasure ? { unitOfMeasure: prevItem.unitOfMeasure } : {}),
                                    ...(i === vIdx ? { [fieldKey]: fieldVal } : {})
                                  };
                                });
                                onUpdateDirectChar(c.id || idx, 'productOfferingCharacteristicValue', nextPocv);
                              };
                              return (
                              <div key={vIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  fontSize: '10.5px',
                                  color: 'var(--ds-text-3)',
                                  fontFamily: 'var(--ds-font-mono)',
                                  background: 'var(--ds-surface-2)',
                                  padding: '2px 5px',
                                  borderRadius: '3px',
                                  minWidth: '22px',
                                  textAlign: 'center'
                                }}>
                                  [{vIdx}]
                                </span>
                                <input
                                  type="text"
                                  value={val || ''}
                                  onChange={(e) => onDirectArrayValueChange?.(c.id || idx, vIdx, e.target.value)}
                                  style={{
                                    ...inputStyle,
                                    fontFamily: 'inherit',
                                    flex: 1
                                  }}
                                  placeholder={`Value #${vIdx + 1}...`}
                                />
                                <input
                                  type="text"
                                  value={pocvEntry?.unitOfMeasure || ''}
                                  onChange={(e) => updatePocvField('unitOfMeasure', e.target.value)}
                                  placeholder="Unit (e.g. Second)"
                                  title="unitOfMeasure"
                                  style={{ ...inputStyle, width: '110px', fontSize: '11px' }}
                                />
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--ds-text-2)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(pocvEntry?.isDefault)}
                                    onChange={(e) => updatePocvField('isDefault', e.target.checked)}
                                  />
                                  Default
                                </label>
                                {valuesList.length > 1 && onRemoveDirectArrayValue && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveDirectArrayValue(c.id || idx, vIdx)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: 'var(--ds-text-3)',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      padding: '2px 6px'
                                    }}
                                    title="Remove this value"
                                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              );
                            })}

                            {onAddDirectArrayValue && (
                              <button
                                type="button"
                                onClick={() => onAddDirectArrayValue(c.id || idx)}
                                style={{
                                  background: '#ffffff',
                                  border: '1px dashed var(--ds-text-3)',
                                  borderRadius: '4px',
                                  padding: '3px 10px',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: 'var(--ds-text-2)',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px',
                                  width: 'fit-content'
                                }}
                              >
                                <span style={{ fontWeight: '700', color: 'var(--ds-spec)' }}>+</span> Add Value
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="text"
                              value={valuesList[0] !== undefined ? valuesList[0] : (c.value || '')}
                              onChange={(e) => {
                                if (onDirectArrayValueChange) {
                                  onDirectArrayValueChange(c.id || idx, 0, e.target.value);
                                } else if (onUpdateDirectChar) {
                                  onUpdateDirectChar(c.id || idx, 'value', e.target.value);
                                }
                              }}
                              style={{
                                ...inputStyle,
                                flex: 1
                              }}
                              placeholder="Value..."
                            />
                            {onUpdateDirectChar && (
                              <>
                                <input
                                  type="text"
                                  value={c.productOfferingCharacteristicValue?.[0]?.unitOfMeasure || ''}
                                  onChange={(e) => {
                                    const prevFirst = c.productOfferingCharacteristicValue?.[0] || {};
                                    onUpdateDirectChar(c.id || idx, 'productOfferingCharacteristicValue', [
                                      {
                                        value: valuesList[0] !== undefined ? String(valuesList[0]) : String(c.value || ''),
                                        valueType: prevFirst.valueType || c.valueType || 'string',
                                        isDefault: prevFirst.isDefault ?? false,
                                        ...(e.target.value ? { unitOfMeasure: e.target.value } : {})
                                      }
                                    ]);
                                  }}
                                  placeholder="Unit (e.g. Second)"
                                  title="unitOfMeasure"
                                  style={{ ...inputStyle, width: '115px', fontSize: '11px' }}
                                />
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--ds-text-2)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={Boolean(c.productOfferingCharacteristicValue?.[0]?.isDefault)}
                                    onChange={(e) => {
                                      const prevFirst = c.productOfferingCharacteristicValue?.[0] || {};
                                      onUpdateDirectChar(c.id || idx, 'productOfferingCharacteristicValue', [
                                        {
                                          value: valuesList[0] !== undefined ? String(valuesList[0]) : String(c.value || ''),
                                          valueType: prevFirst.valueType || c.valueType || 'string',
                                          isDefault: e.target.checked,
                                          ...(prevFirst.unitOfMeasure ? { unitOfMeasure: prevFirst.unitOfMeasure } : {})
                                        }
                                      ]);
                                    }}
                                  />
                                  Default
                                </label>
                              </>
                            )}
                            {onAddDirectArrayValue && (
                              <button
                                type="button"
                                onClick={() => onAddDirectArrayValue(c.id || idx)}
                                style={{
                                  background: 'var(--ds-surface-subtle)',
                                  border: '1px solid var(--ds-border-strong)',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  color: 'var(--ds-text-2)',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Add another value"
                              >
                                + Add Value
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      {onDeleteDirectChar && (
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => onDeleteDirectChar(c.id || idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--ds-text-3)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                            title="Delete Direct Characteristic"
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
            {filteredDirectChars.map((char, i) => (
              <div key={i} style={{ background: 'var(--ds-surface-subtle)', border: `1px solid ${C.cardBorder}`, borderRadius: '6px', padding: '10px 12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: C.text }}>{char.name || char.id}</div>
                <div style={{ fontSize: '11px', color: 'var(--ds-spec)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {formatCharValue(char, true)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Render optional bottom navigation or footer actions */}
      {renderFooter}
    </div>
  );
}
