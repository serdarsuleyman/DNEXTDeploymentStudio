import React, { useState, useMemo, useEffect } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';
import { translateConditionToHuman } from '../../utils/categoryResolver';
import { generateOriginalMapperXml } from '../../utils/mapperXmlGenerator';

const MAPPER_CHAR_KEYS = [
  'source_component_id',
  'system_name',
  'simple_product_seq_no',
  'mapper_type',
  'direction',
  'basket_action',
  'attribute_action',
  'process_contexts',
  'attribute_code',
  'attribute_value',
  'attribute_additional_value'
];

function extractCharMap(rule) {
  const map = {};
  (Array.isArray(rule?.ruleCharacteristic) ? rule.ruleCharacteristic : []).forEach(c => {
    if (c && c.name) map[c.name] = c.value !== undefined && c.value !== null ? String(c.value) : '';
  });
  return map;
}

export default function MapperRuleDetailDrawer({
  rule,
  isOpen,
  mapperFacts = [],
  onClose,
  onSaveRule,
  onPushRule,
  onDeleteRule,
  isSaving = false,
  isPushing = false
}) {
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'skus' | 'characteristics' | 'json'
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [formData, setFormData] = useState(() => ({
    id: rule?.id || '',
    name: rule?.name || '',
    ruleType: rule?.ruleType || 'FORALL',
    status: rule?.status || 'draft',
    stateCategory: rule?.stateCategory || 'Initial',
    condition: Array.isArray(rule?.condition) && rule.condition.length > 0 ? [...rule.condition] : ['true']
  }));

  const [charMap, setCharMap] = useState(() => extractCharMap(rule));
  const [extraChars, setExtraChars] = useState(() =>
    (Array.isArray(rule?.ruleCharacteristic) ? rule.ruleCharacteristic : [])
      .filter(c => c && c.name && !MAPPER_CHAR_KEYS.includes(c.name))
  );
  const [skuEntities, setSkuEntities] = useState(() =>
    Array.isArray(rule?.managedAssetGroup?.entity) ? [...rule.managedAssetGroup.entity] : []
  );

  // SKU tab state
  const [skuSearch, setSkuSearch] = useState('');
  const [skuPage, setSkuPage] = useState(0);
  const [newSku, setNewSku] = useState('');
  const [newBlockId, setNewBlockId] = useState('1');

  // Raw JSON & Original XML tab state
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [xmlSkuScope, setXmlSkuScope] = useState('first');
  const [copiedXml, setCopiedXml] = useState(false);

  useEffect(() => {
    if (rule && isOpen) {
      setFormData({
        id: rule.id || '',
        name: rule.name || '',
        ruleType: rule.ruleType || 'FORALL',
        status: rule.status || 'draft',
        stateCategory: rule.stateCategory || 'Initial',
        condition: Array.isArray(rule.condition) && rule.condition.length > 0 ? [...rule.condition] : ['true']
      });
      setCharMap(extractCharMap(rule));
      setExtraChars(
        (Array.isArray(rule.ruleCharacteristic) ? rule.ruleCharacteristic : [])
          .filter(c => c && c.name && !MAPPER_CHAR_KEYS.includes(c.name))
      );
      setSkuEntities(Array.isArray(rule.managedAssetGroup?.entity) ? [...rule.managedAssetGroup.entity] : []);
      setSkuSearch('');
      setSkuPage(0);
      setJsonError(null);
    }
  }, [rule, isOpen]);

  const assembledRule = useMemo(() => {
    const chars = [];
    MAPPER_CHAR_KEYS.forEach(k => {
      const val = charMap[k];
      if (val !== undefined && val !== '') {
        chars.push({ name: k, value: val });
      }
    });
    extraChars.forEach(c => {
      if (c.name) chars.push({ name: c.name, value: c.value ?? '' });
    });

    const base = { ...(rule || {}) };
    delete base._meta;
    delete base._isNew;

    return {
      ...base,
      '@baseType': base['@baseType'] || 'Rule',
      '@schemaLocation': base['@schemaLocation'] || '/api/ruleEngine/v1/schema/rule.json',
      '@type': 'BasicRule',
      id: formData.id,
      name: formData.name || formData.id,
      category: ['mapperRules'],
      ruleType: formData.ruleType,
      conditionVariantType: 'expression',
      condition: formData.condition,
      result: base.result !== undefined ? base.result : 'true',
      status: formData.status,
      stateCategory: formData.stateCategory,
      ruleCharacteristic: chars,
      managedAssetGroup: {
        ...(base.managedAssetGroup || {}),
        entityType: 'SKU',
        entity: skuEntities
      },
      ...(rule?._isNew ? { _isNew: true } : { _dirty: true })
    };
  }, [rule, formData, charMap, extraChars, skuEntities]);

  useEffect(() => {
    if (activeTab === 'json') {
      const clean = { ...assembledRule };
      delete clean._isNew;
      delete clean._dirty;
      setRawJsonText(JSON.stringify(clean, null, 2));
    }
  }, [activeTab, assembledRule]);

  const originalMapperXml = useMemo(() => {
    if (activeTab !== 'xml') return '';
    return generateOriginalMapperXml(assembledRule, { skuScope: xmlSkuScope });
  }, [activeTab, assembledRule, xmlSkuScope]);

  const filteredSkus = useMemo(() => {
    const q = skuSearch.trim().toLowerCase();
    if (!q) return skuEntities;
    return skuEntities.filter(e =>
      String(e.name || e.sku || '').toLowerCase().includes(q) ||
      String(e.blockId || '').toLowerCase().includes(q)
    );
  }, [skuEntities, skuSearch]);

  const skuPageSize = 50;
  const pagedSkus = filteredSkus.slice(skuPage * skuPageSize, (skuPage + 1) * skuPageSize);
  const skuTotalPages = Math.max(1, Math.ceil(filteredSkus.length / skuPageSize));

  if (!isOpen || !rule) return null;

  const isOut = (charMap.direction || 'out') === 'out';
  const syncState = rule._meta?.syncState || (rule._isNew ? 'new' : 'synced');
  const refMeta = rule._meta?.referenceMeta;

  const handleAddSku = () => {
    const s = newSku.trim();
    if (!s) return;
    setSkuEntities(prev => [...prev, { name: s, blockId: newBlockId.trim() || '1' }]);
    setNewSku('');
  };

  const handleRemoveSku = (idxInPage) => {
    const targetItem = pagedSkus[idxInPage];
    const realIdx = skuEntities.indexOf(targetItem);
    if (realIdx !== -1) {
      setSkuEntities(prev => prev.filter((_, i) => i !== realIdx));
    }
  };

  const handleInsertFact = (fact) => {
    const placeholder = fact.parameter_types === 'integer' ? '0' : '"VAL"';
    const expr = `${fact.fact_object}.${fact.operation}(${placeholder})`;
    setFormData(prev => {
      const next = prev.condition.length === 1 && prev.condition[0] === 'true' ? [expr] : [...prev.condition, expr];
      return { ...prev, condition: next };
    });
  };

  const getPayloadToSubmit = () => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(rawJsonText);
        if (rule?._isNew) parsed._isNew = true;
        else parsed._dirty = true;
        return parsed;
      } catch (err) {
        setJsonError(`Invalid JSON: ${err.message}`);
        return null;
      }
    }
    return assembledRule;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1200,
      background: 'rgba(15, 23, 42, 0.45)',
      display: 'flex',
      justifyContent: 'flex-end'
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: isFullscreen ? '100vw' : 'min(920px, 94vw)',
          height: '100%',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 30px rgba(0,0,0,0.18)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: 'var(--ds-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <code style={{ fontSize: '14px', fontWeight: '800', color: 'var(--ds-brand)', fontFamily: 'var(--ds-font-mono)' }}>
                {formData.id || 'New Mapper Rule'}
              </code>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                color: isOut ? '#1d4ed8' : '#7e22ce',
                background: isOut ? '#eff6ff' : '#faf5ff',
                border: `1px solid ${isOut ? '#bfdbfe' : '#e9d5ff'}`,
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                {charMap.direction || 'out'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#0e7490', background: '#ecfeff', border: '1px solid #a5f3fc', padding: '2px 7px', borderRadius: '4px' }}>
                {charMap.mapper_type || 'sales_package'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: syncState === 'synced' ? '#15803d' : '#b45309',
                background: syncState === 'synced' ? '#dcfce7' : '#fef3c7',
                padding: '2px 7px',
                borderRadius: '4px'
              }}>
                {syncState.toUpperCase()}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: C.muted, marginTop: '4px' }}>
              {isOut
                ? 'OUT Flow: Shopping Cart → Multimapper → OGW Order (SystemAdditionalData)'
                : 'IN Flow: GetCustDetail-Resp → Multimapper → 360° View'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsFullscreen(f => !f)}
              style={{ padding: '5px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '6px', background: '#ffffff', cursor: 'pointer' }}
            >
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '5px 10px', fontSize: '14px', border: `1px solid ${C.border}`, borderRadius: '6px', background: '#ffffff', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, padding: '0 20px', gap: '16px', background: '#ffffff' }}>
          {[
            { id: 'visual', label: 'Visual Mapping' },
            { id: 'skus', label: `SKU Associations (${skuEntities.length})` },
            { id: 'characteristics', label: `Characteristics (${Object.keys(charMap).filter(k => charMap[k]).length + extraChars.length})` },
            { id: 'xml', label: 'Original Mapper XML' },
            { id: 'json', label: 'Raw JSON' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 4px',
                fontSize: '12.5px',
                fontWeight: activeTab === tab.id ? '700' : '600',
                color: activeTab === tab.id ? 'var(--ds-brand)' : C.muted,
                background: 'none',
                border: 'none',
                borderBottom: `2.5px solid ${activeTab === tab.id ? 'var(--ds-brand)' : 'transparent'}`,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {activeTab === 'visual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Identity & Component Metadata */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted, marginBottom: '10px' }}>
                  1. Identity & Component Metadata
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Rule ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      disabled={!rule._isNew}
                      onChange={e => setFormData(p => ({ ...p, id: e.target.value, name: p.name || e.target.value }))}
                      placeholder="MAPPER_sales_package..."
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '5px', background: rule._isNew ? '#ffffff' : '#f1f5f9' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Functional Area (mapper_type)</label>
                    <input
                      type="text"
                      value={charMap.mapper_type || ''}
                      onChange={e => setCharMap(p => ({ ...p, mapper_type: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Direction</label>
                    <select
                      value={charMap.direction || 'out'}
                      onChange={e => setCharMap(p => ({ ...p, direction: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                    >
                      <option value="out">out (Cart → OGW)</option>
                      <option value="in">in (CustDetail → 360°)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                    >
                      <option value="draft">draft</option>
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>SourceComponentID</label>
                    <input
                      type="text"
                      value={charMap.source_component_id || ''}
                      onChange={e => setCharMap(p => ({ ...p, source_component_id: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>SystemName</label>
                    <input
                      type="text"
                      value={charMap.system_name || ''}
                      onChange={e => setCharMap(p => ({ ...p, system_name: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Enrichment Payload */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted, marginBottom: '10px' }}>
                  2. Enrichment / Recognition Mapping Payload
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>AttributeCode</label>
                    <input
                      type="text"
                      value={charMap.attribute_code || ''}
                      onChange={e => setCharMap(p => ({ ...p, attribute_code: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>AttributeValue</label>
                    <input
                      type="text"
                      value={charMap.attribute_value || ''}
                      onChange={e => setCharMap(p => ({ ...p, attribute_value: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>AttributeAdditionalValue (XML / JSON Path)</label>
                    <input
                      type="text"
                      value={charMap.attribute_additional_value || ''}
                      onChange={e => setCharMap(p => ({ ...p, attribute_additional_value: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                  {refMeta?.source_attribute_additional_value && (
                    <div style={{ gridColumn: '1 / -1', fontSize: '11px', color: '#0369a1', background: '#f0f9ff', padding: '6px 10px', borderRadius: '5px' }}>
                      <strong>Ref DB Source Path:</strong> <code>{refMeta.source_attribute_additional_value}</code>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>BasketAction</label>
                    <select
                      value={charMap.basket_action || ''}
                      onChange={e => setCharMap(p => ({ ...p, basket_action: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                    >
                      <option value="">(absent)</option>
                      <option value="keep">keep</option>
                      <option value="change">change</option>
                      <option value="add">add</option>
                      <option value="remove">remove</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>AttributeAction</label>
                    <select
                      value={charMap.attribute_action || ''}
                      onChange={e => setCharMap(p => ({ ...p, attribute_action: e.target.value }))}
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                    >
                      <option value="">(absent)</option>
                      <option value="add">add</option>
                      <option value="overwrite">overwrite</option>
                      <option value="takeover">takeover</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ProcessContexts (comma-separated or *)</label>
                    <input
                      type="text"
                      value={charMap.process_contexts || ''}
                      onChange={e => setCharMap(p => ({ ...p, process_contexts: e.target.value }))}
                      placeholder="ACQ,MIGCOC,ILSBLU or *"
                      style={{ width: '100%', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '5px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Condition Logic */}
              <div style={{ border: `1px solid ${C.border}`, borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: C.muted }}>
                    3. Condition Logic (SourceConditions) · Result: <code>&quot;true&quot;</code>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <select
                      value={formData.ruleType}
                      onChange={e => setFormData(p => ({ ...p, ruleType: e.target.value }))}
                      style={{ padding: '4px 8px', fontSize: '12px', fontWeight: '700', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                    >
                      <option value="FORALL">FORALL</option>
                      <option value="FORSOME">FORSOME</option>
                      <option value="IF">IF</option>
                    </select>
                    {mapperFacts.length > 0 && (
                      <select
                        value=""
                        onChange={e => {
                          const idx = parseInt(e.target.value, 10);
                          if (!isNaN(idx) && mapperFacts[idx]) handleInsertFact(mapperFacts[idx]);
                        }}
                        style={{ padding: '4px 8px', fontSize: '11.5px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#f8fafc' }}
                      >
                        <option value="">+ Insert Mapper Fact…</option>
                        {mapperFacts.map((f, idx) => (
                          <option key={`${f.fact_object}.${f.operation}.${f.parameter_types}`} value={idx}>
                            {f.fact_object}.{f.operation}({f.parameter_types})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.condition.map((cond, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: '#f8fafc', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted }}>#{idx}</span>
                        <input
                          type="text"
                          value={cond}
                          onChange={e => {
                            const val = e.target.value;
                            setFormData(p => {
                              const next = [...p.condition];
                              next[idx] = val;
                              return { ...p, condition: next };
                            });
                          }}
                          style={{ flex: 1, padding: '5px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#ffffff' }}
                        />
                        {formData.condition.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, condition: p.condition.filter((_, i) => i !== idx) }))}
                            style={{ padding: '4px 8px', fontSize: '11px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#ffffff', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {cond && cond !== 'true' && (
                        <div style={{ fontSize: '11px', color: '#475569', paddingLeft: '24px' }}>
                          {translateConditionToHuman(cond)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'skus' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={skuSearch}
                  onChange={e => { setSkuSearch(e.target.value); setSkuPage(0); }}
                  placeholder="Filter SKUs or blockId…"
                  style={{ flex: '1 1 200px', padding: '6px 10px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '6px' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={newSku}
                    onChange={e => setNewSku(e.target.value)}
                    placeholder="SKU (e.g. R70.1000000129-24)"
                    style={{ width: '190px', padding: '6px 8px', fontSize: '12px', fontFamily: 'var(--ds-font-mono)', border: `1px solid ${C.border}`, borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    value={newBlockId}
                    onChange={e => setNewBlockId(e.target.value)}
                    placeholder="blockId"
                    style={{ width: '70px', padding: '6px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '6px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSku}
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700', color: '#ffffff', background: '#0f172a', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    + Add SKU
                  </button>
                </div>
              </div>

              <div style={{ border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.muted, fontSize: '11px' }}>
                      <th style={{ padding: '8px 12px' }}>SKU (managedAssetGroup.entity.name)</th>
                      <th style={{ padding: '8px 12px' }}>blockId</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSkus.length === 0 ? (
                      <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: C.muted }}>No SKU associations</td></tr>
                    ) : pagedSkus.map((ent, idx) => (
                      <tr key={`${ent.name || ent.sku}-${ent.blockId}-${idx}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: '7px 12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>{ent.name || ent.sku || ent.id}</td>
                        <td style={{ padding: '7px 12px' }}>{ent.blockId ?? '-'}</td>
                        <td style={{ padding: '7px 12px', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveSku(idx)}
                            style={{ fontSize: '11px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredSkus.length > skuPageSize && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: C.muted }}>
                  <span>Showing {skuPage * skuPageSize + 1}–{Math.min((skuPage + 1) * skuPageSize, filteredSkus.length)} of {filteredSkus.length}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" disabled={skuPage === 0} onClick={() => setSkuPage(p => p - 1)} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#fff' }}>Prev</button>
                    <button type="button" disabled={skuPage + 1 >= skuTotalPages} onClick={() => setSkuPage(p => p + 1)} style={{ padding: '4px 8px', border: `1px solid ${C.border}`, borderRadius: '4px', background: '#fff' }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'characteristics' && (
            <div style={{ border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${C.border}`, textAlign: 'left', color: C.muted, fontSize: '11px' }}>
                    <th style={{ padding: '8px 12px' }}>Characteristic Name</th>
                    <th style={{ padding: '8px 12px' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {assembledRule.ruleCharacteristic.map((c, idx) => (
                    <tr key={`${c.name}-${idx}`} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--ds-font-mono)', fontWeight: '600' }}>{c.name}</td>
                      <td style={{ padding: '7px 12px', fontFamily: 'var(--ds-font-mono)' }}>{String(c.value ?? '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'xml' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>SKU Scope:</span>
                  <select
                    value={xmlSkuScope}
                    onChange={e => setXmlSkuScope(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '12px', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff' }}
                  >
                    <option value="first">First SKU (Preview)</option>
                    <option value="all">All Linked SKUs ({skuEntities.length})</option>
                  </select>
                  <span style={{ fontSize: '11px', color: C.muted }}>
                    Auto-generated from DNEXT BasicRule JSON
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(originalMapperXml);
                      setCopiedXml(true);
                      setTimeout(() => setCopiedXml(false), 1800);
                    }}
                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '600', border: `1px solid ${C.border}`, borderRadius: '5px', background: '#ffffff', cursor: 'pointer' }}
                  >
                    {copiedXml ? 'Copied!' : 'Copy XML'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([originalMapperXml], { type: 'application/xml;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${formData.id || 'mapper_rule'}.xml`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    style={{ padding: '5px 10px', fontSize: '12px', fontWeight: '600', color: '#ffffff', background: '#0f172a', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Download .xml
                  </button>
                </div>
              </div>
              <pre style={{
                margin: 0,
                flex: 1,
                minHeight: '460px',
                padding: '14px',
                borderRadius: '6px',
                background: '#0f172a',
                color: '#e2e8f0',
                fontFamily: 'var(--ds-font-mono)',
                fontSize: '12px',
                lineHeight: 1.5,
                overflow: 'auto'
              }}>
                {originalMapperXml}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
              {jsonError && (
                <div style={{ padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '12px' }}>
                  {jsonError}
                </div>
              )}
              <textarea
                value={rawJsonText}
                onChange={e => { setRawJsonText(e.target.value); setJsonError(null); }}
                spellCheck={false}
                style={{
                  width: '100%',
                  minHeight: '480px',
                  flex: 1,
                  padding: '12px',
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: '12px',
                  border: `1px solid ${C.border}`,
                  borderRadius: '6px',
                  background: '#0f172a',
                  color: '#e2e8f0'
                }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '12px 20px',
          borderTop: `1px solid ${C.border}`,
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <div>
            {!rule._isNew && (
              <button
                type="button"
                onClick={() => {
                  const remote = window.confirm('Delete from remote DNEXT Rule Engine too? Click OK for Remote + Local, or Cancel to abort.');
                  if (remote) onDeleteRule(formData.id, true);
                }}
                style={{ padding: '7px 12px', fontSize: '12px', fontWeight: '600', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
              >
                Delete Rule
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '7px 14px', fontSize: '12px', fontWeight: '600', color: C.text, background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '6px', cursor: 'pointer' }}
            >
              Close
            </button>
            <button
              type="button"
              disabled={isSaving || isPushing}
              onClick={() => {
                const payload = getPayloadToSubmit();
                if (payload) onSaveRule(payload);
              }}
              style={{ padding: '7px 14px', fontSize: '12px', fontWeight: '700', color: '#0f172a', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              {isSaving ? 'Saving…' : 'Save Draft (Local)'}
            </button>
            <button
              type="button"
              disabled={isSaving || isPushing}
              onClick={() => {
                const payload = getPayloadToSubmit();
                if (payload) onPushRule(payload);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: '700',
                color: '#ffffff',
                background: 'var(--ds-brand)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Icon name="upload" size={13} />
              {isPushing ? 'Pushing…' : 'Save & Push to DNEXT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
