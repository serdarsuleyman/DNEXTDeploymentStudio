import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import {
  RULE_CATEGORIES,
  RULE_STATUSES,
  STATE_GROUPS,
  RULE_QUANTIFIERS,
  COMPATIBILITY_ACTIONS,
  OPERATION_TYPES,
  RULE_ARCHETYPES,
  RULE_PURPOSE_TEMPLATES,
  FACT_DOMAINS,
  ALL_FACTS,
  extractCompatibilityCharacteristics,
  serializeCompatibilityCharacteristics,
  extractResultTargets,
  classifyRule,
  detectProductDomain,
  generateNaturalLanguageSummary
} from '../../utils/ruleDescriptors';

const C = {
  bg: '#ffffff',
  panel: '#ffffff',
  border: 'var(--ds-border)',
  text: 'var(--ds-text)',
  muted: 'var(--ds-text-2)',
  brand: 'var(--ds-brand)',
  brandDark: 'var(--ds-brand-dark)',
  ok: 'var(--ds-ok)',
  warn: 'var(--ds-warn)',
  spec: 'var(--ds-spec)',
  info: 'var(--ds-info)'
};

export default function RuleDetailDrawer({
  rule,
  isOpen,
  onClose,
  onSaveRule,
  onDeleteRule,
  isSaving = false
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'json'
  const [copiedId, setCopiedId] = useState(false);
  const [expandedConditions, setExpandedConditions] = useState({});
  const [allConditionsMultiline, setAllConditionsMultiline] = useState(false);

  // Form State
  const [formData, setFormData] = useState(null);
  const [charsData, setCharsData] = useState(null);
  const [targetsData, setTargetsData] = useState(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Initialize form state when rule opens
  useEffect(() => {
    if (rule) {
      setFormData({
        id: rule.id || '',
        name: rule.name || '',
        ruleType: rule.ruleType || 'FORALL',
        conditionVariantType: rule.conditionVariantType || 'expression',
        condition: Array.isArray(rule.condition) ? [...rule.condition] : [],
        category: Array.isArray(rule.category) ? rule.category[0] || 'implicitCompatibility' : 'implicitCompatibility',
        status: rule.status || 'draft',
        stateCategory: rule.stateCategory || 'Initial'
      });
      setCharsData(extractCompatibilityCharacteristics(rule));
      setTargetsData(extractResultTargets(rule));
      setRawJsonText(JSON.stringify(rule, null, 2));
      setJsonError(null);
      setActiveTab('visual');
    }
  }, [rule?.id, rule?.updatedDate]);

  // Keep Raw JSON in sync with visual edits
  const currentMergedRule = useMemo(() => {
    if (!formData || !charsData || !targetsData) return null;

    const targetConditions = (targetsData.conditions || []).map(tc => ({
      name: "TargetCondition",
      attribute: [
        { name: "Type", value: tc.type || "Product" },
        { name: "Operator", value: tc.operator || "" },
        { name: "ConditionValue", value: tc.conditionValue || "" },
        {
          name: "Params",
          attribute: Object.entries(tc.params || {}).map(([k, v]) => ({ name: k, value: String(v) }))
        }
      ]
    }));

    return {
      "@baseType": "Rule",
      "@schemaLocation": "/api/ruleEngine/v1/schema/rule.json",
      "@type": "BasicRule",
      id: formData.id,
      href: `/api/ruleEngine/v1/rule/${formData.id}`,
      name: formData.name,
      branchName: "MATCH",
      ruleType: formData.ruleType,
      conditionVariantType: formData.conditionVariantType,
      condition: formData.condition,
      result: {
        "@type": "Result",
        variantType: "attributeValueList",
        attribute: {
          name: targetsData.groupName || "Target Selection",
          attribute: [
            { name: "TargetAggregator", value: targetsData.targetAggregator || "having" },
            { name: "ConditionValue", value: targetsData.conditionValue || "" },
            ...targetConditions
          ]
        }
      },
      category: [formData.category],
      status: formData.status,
      stateCategory: formData.stateCategory,
      ruleCharacteristic: serializeCompatibilityCharacteristics(charsData)
    };
  }, [formData, charsData, targetsData]);

  // Natural language summary generated live
  const naturalLanguageSummary = useMemo(() => {
    return generateNaturalLanguageSummary(currentMergedRule);
  }, [currentMergedRule]);

  if (!isOpen || !rule || !formData) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(formData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setRawJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      setFormData({
        id: parsed.id || formData.id,
        name: parsed.name || '',
        ruleType: parsed.ruleType || 'FORALL',
        conditionVariantType: parsed.conditionVariantType || 'expression',
        condition: Array.isArray(parsed.condition) ? parsed.condition : [],
        category: Array.isArray(parsed.category) ? parsed.category[0] || 'implicitCompatibility' : 'implicitCompatibility',
        status: parsed.status || 'draft',
        stateCategory: parsed.stateCategory || 'Initial'
      });
      setCharsData(extractCompatibilityCharacteristics(parsed));
      setTargetsData(extractResultTargets(parsed));
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const handleSave = () => {
    if (activeTab === 'json') {
      try {
        const parsed = JSON.parse(rawJsonText);
        onSaveRule && onSaveRule(parsed);
      } catch (err) {
        setJsonError(`Cannot save invalid JSON: ${err.message}`);
      }
    } else {
      onSaveRule && onSaveRule(currentMergedRule);
    }
  };

  // Purpose Template preset applicator
  const applyPurposeTemplate = (tpl) => {
    if (!tpl.preset) return;
    const p = tpl.preset;
    setFormData(prev => ({
      ...prev,
      name: p.name || prev.name,
      category: p.category ? p.category[0] : prev.category,
      ruleType: p.ruleType || prev.ruleType,
      condition: p.condition ? [...p.condition] : prev.condition
    }));
    if (p.characteristics) {
      setCharsData(prev => ({
        ...prev,
        ...p.characteristics,
        process_contexts: Array.isArray(p.characteristics.process_contexts)
          ? p.characteristics.process_contexts
          : String(p.characteristics.process_contexts || '').split(',').map(s => s.trim()).filter(Boolean)
      }));
    }
    if (p.resultGroup || p.targetConditionType) {
      setTargetsData(prev => ({
        ...prev,
        groupName: p.resultGroup || prev.groupName,
        conditions: p.targetConditionType ? [{
          type: p.targetConditionType,
          operator: '',
          conditionValue: '',
          params: p.targetParams ? { ...p.targetParams } : {}
        }] : prev.conditions
      }));
    }
  };

  // Condition Item Helpers
  const addCondition = (factId) => {
    const fact = ALL_FACTS.find(f => f.id === factId) || ALL_FACTS[0];
    const initialExpr = fact.id.includes('(') ? fact.id.replace(/\([^\)]*\)/, '("...")') : fact.id;
    setFormData(prev => ({
      ...prev,
      condition: [...prev.condition, initialExpr]
    }));
  };

  const updateCondition = (index, value) => {
    setFormData(prev => {
      const next = [...prev.condition];
      next[index] = value;
      return { ...prev, condition: next };
    });
  };

  const removeCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      condition: prev.condition.filter((_, i) => i !== index)
    }));
  };

  // Condition Multiline & Detail Helpers
  const toggleConditionExpand = (index) => {
    setExpandedConditions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatConditionMultiline = (index) => {
    const str = formData.condition[index] || '';
    const formatted = str
      .replace(/\s*\|\|\s*/g, '\n  || ')
      .replace(/\s*&&\s*/g, '\n  && ')
      .trim();
    updateCondition(index, formatted);
    setExpandedConditions(prev => ({ ...prev, [index]: true }));
  };

  const flattenConditionSingleLine = (index) => {
    const str = formData.condition[index] || '';
    const flattened = str.replace(/\s*\n\s*/g, ' ').trim();
    updateCondition(index, flattened);
    setExpandedConditions(prev => ({ ...prev, [index]: false }));
  };

  // Target Item Helpers
  const addTargetCondition = () => {
    setTargetsData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        { type: 'catalog.getProductsInCategory', operator: '', conditionValue: '', params: { categoryID: 'FN0548' } }
      ]
    }));
  };

  const removeTargetCondition = (idx) => {
    setTargetsData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== idx)
    }));
  };

  const updateTargetParam = (tcIdx, paramKey, paramVal) => {
    setTargetsData(prev => {
      const nextConditions = [...prev.conditions];
      nextConditions[tcIdx] = {
        ...nextConditions[tcIdx],
        params: {
          ...nextConditions[tcIdx].params,
          [paramKey]: paramVal
        }
      };
      return { ...prev, conditions: nextConditions };
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(3px)',
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1201,
          width: isFullscreen ? '100vw' : '820px',
          maxWidth: '100vw',
          height: '100vh',
          background: C.bg,
          borderLeft: isFullscreen ? 'none' : `1px solid ${C.border}`,
          boxShadow: '-12px 0 40px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* ─── Drawer Header ─── */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--ds-surface-subtle)',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0
        }}>
          {/* Top Row: Badges, View Switcher & Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Category Pill */}
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--ds-brand)',
                background: 'rgba(230,0,0,0.08)',
                border: '1px solid rgba(230,0,0,0.25)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {formData.category}
              </span>

              {/* Status Pill */}
              <span style={{
                fontSize: '11px',
                fontWeight: '700',
                color: formData.status === 'active' ? 'var(--ds-ok)' : 'var(--ds-warn)',
                background: formData.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                border: `1px solid ${formData.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                {formData.status.toUpperCase()}
              </span>

              {/* State Group Pill */}
              <span style={{
                fontSize: '11px',
                color: C.muted,
                background: 'var(--ds-surface-2)',
                border: `1px solid ${C.border}`,
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                {formData.stateCategory}
              </span>

              {/* Detected Purpose Archetype Badge */}
              {(() => {
                const arch = classifyRule(currentMergedRule);
                const iconChar = arch.icon === 'shield' ? '🛡️' :
                  arch.icon === 'bag' ? '📦' :
                  arch.icon === 'tag' ? '🎁' :
                  arch.icon === 'lock' ? '🔒' :
                  arch.icon === 'cpu' ? '⚡' :
                  arch.icon === 'user' ? '👤' :
                  arch.icon === 'dollar' ? '💰' : '🧭';

                return (
                  <span
                    title={arch.description}
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      color: arch.color,
                      background: arch.bg,
                      border: `1px solid ${arch.border}`,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>{iconChar}</span>
                    <span>{arch.shortLabel}</span>
                  </span>
                );
              })()}
            </div>

            {/* Header Right Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Tab Switcher: Visual Editor vs Raw JSON */}
              <div style={{ display: 'inline-flex', background: 'var(--ds-surface-2)', borderRadius: '6px', padding: '2px', border: `1px solid ${C.border}` }}>
                <button
                  type="button"
                  onClick={() => {
                    setRawJsonText(JSON.stringify(currentMergedRule, null, 2));
                    setActiveTab('visual');
                  }}
                  style={{
                    background: activeTab === 'visual' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: activeTab === 'visual' ? 'var(--ds-brand)' : C.muted,
                    fontWeight: activeTab === 'visual' ? '700' : '500',
                    fontSize: '11px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'visual' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Visual Authoring
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawJsonText(JSON.stringify(currentMergedRule, null, 2));
                    setActiveTab('json');
                  }}
                  style={{
                    background: activeTab === 'json' ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color: activeTab === 'json' ? 'var(--ds-brand)' : C.muted,
                    fontWeight: activeTab === 'json' ? '700' : '500',
                    fontSize: '11px',
                    padding: '4px 10px',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'json' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  Raw TMF JSON
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  padding: '4px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? '⤡' : '⤢'}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  padding: '4px 8px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '700'
                }}
                title="Close Drawer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Rule Name and Copyable ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter rule title / commercial description…"
                style={{
                  width: '100%',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: C.text,
                  border: '1px solid transparent',
                  borderRadius: '4px',
                  padding: '4px 6px',
                  outline: 'none',
                  background: 'transparent'
                }}
                onFocus={e => { e.target.style.background = '#ffffff'; e.target.style.borderColor = 'var(--ds-brand)'; }}
                onBlur={e => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent'; }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <code style={{ fontSize: '12px', color: 'var(--ds-brand)', background: 'rgba(230,0,0,0.06)', border: '1px solid rgba(230,0,0,0.2)', padding: '3px 8px', borderRadius: '4px', fontFamily: 'var(--ds-font-mono)', fontWeight: '700' }}>
                {formData.id}
              </code>
              <button
                type="button"
                onClick={handleCopyId}
                style={{
                  background: '#ffffff',
                  border: `1px solid ${C.border}`,
                  color: copiedId ? 'var(--ds-ok)' : C.text,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                {copiedId ? '✓ Copied' : 'Copy ID'}
              </button>
            </div>
          </div>

          {/* Live Natural Language Rule Summary Banner */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--ds-border)',
            borderLeft: '4px solid var(--ds-brand)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            color: 'var(--ds-text)',
            lineHeight: 1.5,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
          }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ds-brand)', fontWeight: '700', marginBottom: '2px' }}>
              Live Natural-Language Rule Summary
            </div>
            <div>{naturalLanguageSummary}</div>
          </div>
        </div>

        {/* ─── Drawer Body ─── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isFullscreen ? '24px 48px' : '20px 24px', background: C.bg }}>
          {activeTab === 'json' ? (
            /* ── Raw TMF JSON Tab ── */
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: C.muted }}>
                  Directly inspect and modify the raw TMForum <code>BasicRule</code> payload:
                </span>
                {jsonError && (
                  <span style={{ fontSize: '11px', color: 'var(--ds-brand)', fontWeight: '700' }}>
                    ⚠️ {jsonError}
                  </span>
                )}
              </div>
              <textarea
                value={rawJsonText}
                onChange={handleJsonChange}
                style={{
                  flex: 1,
                  minHeight: '480px',
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: '12px',
                  lineHeight: '1.45',
                  padding: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${jsonError ? 'var(--ds-brand)' : C.border}`,
                  background: 'var(--ds-surface-subtle)',
                  color: C.text,
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>
          ) : (
            /* ── Visual Authoring: WHEN → IF → THEN Flow ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* ════ PURPOSE QUICK-START TEMPLATES (Shown for New Rules) ════ */}
              {!rule?.id && (
                <div style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, var(--ds-surface-subtle) 100%)',
                  border: '1px solid var(--ds-border)',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>⚡</span>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: C.text, letterSpacing: '-0.01em' }}>
                        Quick-Start from Business Purpose Template
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: C.muted }}>
                      Pre-populates 80% of parameters for standard telco policies
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    {RULE_PURPOSE_TEMPLATES.map(tpl => {
                      const iconChar = tpl.icon === 'shield' ? '🛡️' :
                        tpl.icon === 'bag' ? '📦' :
                        tpl.icon === 'tag' ? '🎁' :
                        tpl.icon === 'lock' ? '🔒' : '🛠️';

                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => applyPurposeTemplate(tpl)}
                          style={{
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `1px solid ${C.border}`,
                            background: '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = tpl.color || 'var(--ds-brand)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = C.border;
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{iconChar}</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                              {tpl.title.replace(/^[^\s]+\s/, '')}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: C.muted, lineHeight: '1.3' }}>
                            {tpl.tagline}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ════ SECTION 1: WHEN (Context & Applicability) ════ */}
              <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                  <span style={{ background: 'var(--ds-brand)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px' }}>
                    1. WHEN
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                    Applicability Context & Metadata
                  </span>
                  <span style={{ fontSize: '11px', color: C.muted, marginLeft: 'auto' }}>
                    Channels, journey contexts, and validity period
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                  {/* Process Contexts */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, marginBottom: '4px' }}>
                      Process Contexts (Comma separated)
                    </label>
                    <input
                      type="text"
                      value={charsData.process_contexts.join(', ')}
                      onChange={e => setCharsData(prev => ({
                        ...prev,
                        process_contexts: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="e.g. ILSBLU, MOVBLU, ACQ, MIGCOC"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '12px' }}
                    />
                  </div>

                  {/* Sales Channels */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, marginBottom: '4px' }}>
                      Sales Channels
                    </label>
                    <input
                      type="text"
                      value={charsData.channels}
                      onChange={e => setCharsData(prev => ({ ...prev, channels: e.target.value }))}
                      placeholder="e.g. * (all) or CC, OSE"
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '12px' }}
                    />
                  </div>

                  {/* Effective Start Date */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, marginBottom: '4px' }}>
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={charsData.effective_date}
                      onChange={e => setCharsData(prev => ({ ...prev, effective_date: e.target.value }))}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '12px' }}
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, marginBottom: '4px' }}>
                      Priority (1 highest, 10 lowest)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={charsData.priority}
                      onChange={e => setCharsData(prev => ({ ...prev, priority: parseInt(e.target.value, 10) || 5 }))}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* ════ SECTION 2: IF (Condition Builder & LHS Logic) ════ */}
              <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'var(--ds-spec)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px' }}>
                      2. IF
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                      Condition Tree & Evaluation Logic
                    </span>
                  </div>

                  {/* Section Controls: Multiline Toggle & Quantifier Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !allConditionsMultiline;
                        setAllConditionsMultiline(next);
                        const map = {};
                        formData.condition.forEach((_, idx) => { map[idx] = next; });
                        setExpandedConditions(map);
                      }}
                      style={{
                        background: allConditionsMultiline ? 'rgba(124,58,237,0.1)' : '#ffffff',
                        border: `1px solid ${allConditionsMultiline ? 'var(--ds-spec)' : C.border}`,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: allConditionsMultiline ? 'var(--ds-spec)' : C.text,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Toggle all conditions between compact single-line and multiline detail view"
                    >
                      <span>{allConditionsMultiline ? '⊟ Single-line View' : '⊞ Expand All to Multiline'}</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: C.muted, fontWeight: '600' }}>Quantifier:</span>
                      <select
                        value={formData.ruleType}
                        onChange={e => setFormData(prev => ({ ...prev, ruleType: e.target.value }))}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec)' }}
                      >
                        {RULE_QUANTIFIERS.map(q => (
                          <option key={q.id} value={q.id}>{q.id}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Condition List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {formData.condition.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', background: 'var(--ds-surface-subtle)', borderRadius: '6px', color: C.muted, fontSize: '12px' }}>
                      No conditions configured. This rule will evaluate unconditionally.
                    </div>
                  ) : (
                    formData.condition.map((condStr, cIdx) => {
                      const isMultiline = allConditionsMultiline || Boolean(expandedConditions[cIdx]) || condStr.includes('\n');
                      const hasLogicalOps = condStr.includes('||') || condStr.includes('&&');
                      const lineCount = condStr.split('\n').length;

                      return (
                        <div
                          key={cIdx}
                          style={{
                            display: 'flex',
                            alignItems: isMultiline ? 'flex-start' : 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: isMultiline ? '#ffffff' : 'var(--ds-surface-subtle)',
                            border: `1px solid ${isMultiline ? 'var(--ds-border-strong)' : C.border}`,
                            fontSize: '12px',
                            boxShadow: isMultiline ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* Combinator Badge */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: isMultiline ? '4px' : '0' }}>
                            {cIdx > 0 ? (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: 'var(--ds-spec)',
                                background: 'rgba(124,58,237,0.08)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                textTransform: 'uppercase'
                              }}>
                                {formData.ruleType === 'FORSOME' ? 'OR' : 'AND'}
                              </span>
                            ) : (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: C.muted,
                                background: 'var(--ds-surface-2)',
                                padding: '2px 6px',
                                borderRadius: '3px'
                              }}>
                                #1
                              </span>
                            )}
                          </div>

                          {/* Dynamic Single-Line Input vs Multiline Textarea */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {isMultiline ? (
                              <textarea
                                value={condStr}
                                onChange={e => updateCondition(cIdx, e.target.value)}
                                rows={Math.max(2, Math.min(10, lineCount + 1))}
                                placeholder="Enter condition expression…"
                                style={{
                                  width: '100%',
                                  fontFamily: 'var(--ds-font-mono)',
                                  fontSize: '12px',
                                  lineHeight: '1.5',
                                  padding: '6px 8px',
                                  borderRadius: '4px',
                                  border: `1px solid ${C.border}`,
                                  background: '#ffffff',
                                  resize: 'vertical',
                                  outline: 'none',
                                  boxSizing: 'border-box'
                                }}
                              />
                            ) : (
                              <input
                                type="text"
                                value={condStr}
                                onChange={e => updateCondition(cIdx, e.target.value)}
                                placeholder="Enter condition expression…"
                                style={{
                                  width: '100%',
                                  fontFamily: 'var(--ds-font-mono)',
                                  fontSize: '12px',
                                  padding: '5px 8px',
                                  borderRadius: '4px',
                                  border: `1px solid ${C.border}`,
                                  background: '#ffffff',
                                  boxSizing: 'border-box'
                                }}
                              />
                            )}

                            {/* Extra helper hints in multiline mode */}
                            {isMultiline && hasLogicalOps && (
                              <div style={{ fontSize: '11px', color: C.muted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>Multi-clause condition. Edit clauses cleanly on separate lines.</span>
                              </div>
                            )}
                          </div>

                          {/* Row Action Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: isMultiline ? '2px' : '0' }}>
                            {/* Pretty Format button if has || or && */}
                            {hasLogicalOps && !condStr.includes('\n') && (
                              <button
                                type="button"
                                onClick={() => formatConditionMultiline(cIdx)}
                                style={{
                                  background: 'rgba(124,58,237,0.06)',
                                  border: '1px solid rgba(124,58,237,0.25)',
                                  color: 'var(--ds-spec)',
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  padding: '3px 7px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Auto-format and split clauses across multiple lines"
                              >
                                ⚡ Format
                              </button>
                            )}

                            {/* Flatten button if currently formatted multiline */}
                            {condStr.includes('\n') && (
                              <button
                                type="button"
                                onClick={() => flattenConditionSingleLine(cIdx)}
                                style={{
                                  background: 'var(--ds-surface-2)',
                                  border: `1px solid ${C.border}`,
                                  color: C.muted,
                                  fontSize: '11px',
                                  padding: '3px 7px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                                title="Flatten multiline condition back to a single line"
                              >
                                ═ Flatten
                              </button>
                            )}

                            {/* Expand / Collapse Toggle button */}
                            <button
                              type="button"
                              onClick={() => toggleConditionExpand(cIdx)}
                              style={{
                                background: isMultiline ? 'var(--ds-surface-2)' : '#ffffff',
                                border: `1px solid ${C.border}`,
                                color: isMultiline ? 'var(--ds-spec)' : C.text,
                                padding: '3px 7px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                whiteSpace: 'nowrap'
                              }}
                              title={isMultiline ? 'Collapse to single-line' : 'Expand to multiline details'}
                            >
                              <span>{isMultiline ? '▲' : '▼'}</span>
                              <span>{isMultiline ? 'Collapse' : 'Details'}</span>
                            </button>

                            {/* Delete Condition button */}
                            <button
                              type="button"
                              onClick={() => removeCondition(cIdx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--ds-brand)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                padding: '3px 6px',
                                borderRadius: '4px'
                              }}
                              title="Remove condition"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Fact Quick-Add Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <select
                      onChange={e => {
                        if (e.target.value) {
                          addCondition(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      style={{
                        padding: '6px 10px',
                        borderRadius: '5px',
                        border: `1px solid ${C.border}`,
                        fontSize: '12px',
                        color: C.text,
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="" disabled>+ Add condition from 40 humanized facts…</option>
                      {FACT_DOMAINS.map(domain => (
                        <optgroup key={domain.domain} label={`── ${domain.domain} ──`}>
                          {domain.facts.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.label} ({f.id})
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ════ SECTION 3: THEN (Compatibility Outcome & Target Selector) ════ */}
              <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: `1px solid ${C.border}`, paddingBottom: '8px' }}>
                  <span style={{ background: 'var(--ds-ok)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px' }}>
                    3. THEN
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                    Compatibility Action & Target Entities
                  </span>
                </div>

                {/* Compatibility Action Selector Cards */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: C.muted, marginBottom: '6px' }}>
                    Select Compatibility Outcome (Action)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                    {COMPATIBILITY_ACTIONS.map(action => {
                      const isSelected = charsData.operation_value === action.id;
                      return (
                        <div
                          key={action.id}
                          onClick={() => setCharsData(prev => ({ ...prev, operation_value: action.id }))}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: `2px solid ${isSelected ? action.color : C.border}`,
                            background: isSelected ? action.bg : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? action.color : C.text }}>
                            {action.label}
                          </div>
                          <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                            {action.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Target Conditions List */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: C.muted }}>
                      Target Entities / Selection Scope ({targetsData.conditions.length})
                    </label>
                    <button
                      type="button"
                      onClick={addTargetCondition}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--ds-brand)',
                        fontSize: '11px',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Target Scope
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {targetsData.conditions.map((tc, tcIdx) => (
                      <div
                        key={tcIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: 'var(--ds-surface-subtle)',
                          border: `1px solid ${C.border}`,
                          fontSize: '12px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <select
                          value={tc.type}
                          onChange={e => {
                            const val = e.target.value;
                            setTargetsData(prev => {
                              const next = [...prev.conditions];
                              next[tcIdx] = {
                                ...next[tcIdx],
                                type: val,
                                params: val === 'Product' ? { SKU: 'GS_Glas_PWP' } : { categoryID: 'FN0548' }
                              };
                              return { ...prev, conditions: next };
                            });
                          }}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px', fontWeight: '600' }}
                        >
                          <option value="catalog.getProductsInCategory">Products In Category (catalog.getProductsInCategory)</option>
                          <option value="catalog.getTariffsWithContractValue">Tariffs With Contract Value</option>
                          <option value="Product">Specific Product SKU</option>
                        </select>

                        {/* Parameter Fields */}
                        {tc.type === 'catalog.getProductsInCategory' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: C.muted }}>categoryID:</span>
                            <input
                              type="text"
                              value={tc.params?.categoryID || ''}
                              onChange={e => updateTargetParam(tcIdx, 'categoryID', e.target.value)}
                              placeholder="e.g. FN0548"
                              style={{ width: '100px', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px' }}
                            />
                          </div>
                        )}

                        {tc.type === 'Product' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: C.muted }}>SKU:</span>
                            <input
                              type="text"
                              value={tc.params?.SKU || tc.params?.sku || ''}
                              onChange={e => updateTargetParam(tcIdx, 'SKU', e.target.value)}
                              placeholder="e.g. GS_Glas_PWP_IP532"
                              style={{ width: '160px', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px' }}
                            />
                          </div>
                        )}

                        {tc.type === 'catalog.getTariffsWithContractValue' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '11px', color: C.muted }}>Operation:</span>
                            <select
                              value={tc.params?.Operation || '<='}
                              onChange={e => updateTargetParam(tcIdx, 'Operation', e.target.value)}
                              style={{ padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px' }}
                            >
                              <option value="<=">&lt;=</option>
                              <option value="==">==</option>
                              <option value=">=">&gt;=</option>
                            </select>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeTargetCondition(tcIdx)}
                          style={{
                            marginLeft: 'auto',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ds-brand)',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Remove target condition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ─── Drawer Footer Actions ─── */}
        <div style={{
          padding: '12px 24px',
          background: 'var(--ds-surface-subtle)',
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            {onDeleteRule && (
              <button
                type="button"
                onClick={() => onDeleteRule(formData.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--ds-brand)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600'
                }}
              >
                Delete Rule
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#ffffff',
                border: `1px solid ${C.border}`,
                color: C.text,
                padding: '6px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              style={{
                background: 'var(--ds-brand)',
                border: '1px solid var(--ds-brand-dark)',
                color: '#ffffff',
                padding: '6px 18px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                boxShadow: '0 1px 3px rgba(230,0,0,0.2)'
              }}
            >
              {isSaving ? 'Saving…' : 'Save Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
