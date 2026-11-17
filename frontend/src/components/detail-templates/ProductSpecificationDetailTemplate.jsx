import React, { useState } from 'react';
import { EntityTypeBadge, VersionCell } from '../list-views/cellRenderers';

const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: 'var(--ds-border)',
  subCardBg: 'var(--ds-surface-subtle)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)',
  spec: 'var(--ds-spec)'
};

export default function ProductSpecificationDetailTemplate({ item }) {
  const raw = item?.raw || {};
  const chars = Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : [];
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = chars.filter(c => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const nameMatch = (c.name || '').toLowerCase().includes(q);
    const valueMatch = Array.isArray(c.productSpecCharacteristicValue) &&
      c.productSpecCharacteristicValue.some(v => String(v.value || '').toLowerCase().includes(q));
    return nameMatch || valueMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, #ffffff 85%)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: '12px',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <EntityTypeBadge type="ProductSpecification" />
          <VersionCell version={item.version} />
        </div>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800', color: C.text }}>
          {item.name || item.id}
        </h1>
        <div style={{ fontSize: '12px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
          ID: {item.id}
        </div>
      </div>

      {/* Characteristics Table */}
      <div style={{ background: C.panel, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', padding: '18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: C.text }}>
            Specification Characteristics ({chars.length})
          </h3>
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter by characteristic name..."
            style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${C.cardBorder}`, background: '#ffffff', color: C.text, fontSize: '12px', width: '220px' }}
          />
        </div>

        {chars.length === 0 ? (
          <div style={{ color: C.muted, fontSize: '12px', fontStyle: 'italic' }}>
            No characteristics defined on this specification.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
            {filtered.map((char, i) => (
              <div key={i} style={{ background: 'var(--ds-surface-subtle)', padding: '12px', borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>{char.name}</div>
                <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>Type: {char.valueType || 'String'}</div>
                {Array.isArray(char.productSpecCharacteristicValue) && char.productSpecCharacteristicValue.length > 0 && (
                  <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {char.productSpecCharacteristicValue.map((v, vi) => (
                      <span key={vi} style={{ fontSize: '11px', background: 'rgba(124,58,237,0.08)', color: 'var(--ds-spec)', border: '1px solid rgba(124,58,237,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                        {String(v.value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
