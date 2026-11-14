import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import DnextEntityDrawer from '../DnextEntityDrawer';
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
import {
  RULE_CATEGORY_DEFINITIONS,
  getRuleCategoryMeta,
  lookupCatalogCategory,
  formatCategoryLabel,
  getAllCatalogCategories,
  extractCategoriesFromText,
  generateRuleHumanSummary
} from '../../utils/categoryResolver';
import { RULE_COMMERCIAL_DEFINITIONS } from '../../data/ruleCommercialDefinitions.js';

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

  const [showCategoryHelp, setShowCategoryHelp] = useState(false);
  const [expandedConditions, setExpandedConditions] = useState({});
  const [allConditionsMultiline, setAllConditionsMultiline] = useState(false);
  const [isSavingReference, setIsSavingReference] = useState(false);
  const [savedReferenceFeedback, setSavedReferenceFeedback] = useState(false);

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

      const initialChars = extractCompatibilityCharacteristics(rule);
      const refDef = (rule.id && RULE_COMMERCIAL_DEFINITIONS[rule.id]) || null;
      if (refDef?.businessDefinition) {
        initialChars.description = refDef.businessDefinition;
      }
      if (refDef?.plainLanguageIntent) {
        initialChars.business_intent = refDef.plainLanguageIntent;
      }
      setCharsData(initialChars);

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
      description: charsData.description || formData.name,
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

  // Plain-Language Rule Summary generated live with Category Resolution
  const humanRuleSummary = useMemo(() => {
    return generateRuleHumanSummary(formData, charsData, targetsData);
  }, [formData, charsData, targetsData]);

  // Catalog category catalog list for searchable dropdowns
  const allCatalogCategories = useMemo(() => {
    return getAllCatalogCategories();
  }, []);

  // Commercial definition entry from reference data JSON
  const currentReferenceDef = useMemo(() => {
    return (formData?.id && RULE_COMMERCIAL_DEFINITIONS[formData.id]) || null;
  }, [formData?.id]);

  // Modal Detail View for any referenced Entity (Category or ProductOffering)
  const [inspectedEntity, setInspectedEntity] = useState(null);

  const handleOpenEntity = (entity) => {
    if (!entity) return;
    const id = typeof entity === 'string' ? entity : (entity.id || entity.name);
    const isCat = String(id).startsWith('FN') || entity.entityType === 'Category';
    const entityType = isCat ? 'Category' : (entity.entityType || 'ProductOffering');
    const name = entity.name || id;
    setInspectedEntity({
      id,
      name,
      entityType,
      version: entity.version !== undefined ? String(entity.version) : '1',
      lifecycleStatus: entity.lifecycleStatus || 'Launched',
      raw: typeof entity === 'object' ? entity : { id, name }
    });
  };

  // Aggregated list of all categories referenced in the rule (intent, conditions, targets)
  const allReferencedCategories = useMemo(() => {
    const map = new Map();
    // 1. From reference commercial definition
    (currentReferenceDef?.referencedCategories || []).forEach(c => {
      if (c?.id) map.set(c.id, c);
    });
    // 2. From conditions expressions (e.g. FN40, FN76)
    (formData?.condition || []).forEach(condStr => {
      extractCategoriesFromText(condStr).forEach(c => {
        if (c?.id && !map.has(c.id)) map.set(c.id, c);
      });
    });
    // 3. From target scope (e.g. FN36)
    const targetCatId = targetsData?.categoryId || targetsData?.conditions?.find(c =>
      c.type === 'Category' ||
      c.type === 'catalog.getProductsInCategory' ||
      c.params?.categoryID ||
      c.params?.categoryId
    )?.params?.categoryID;
    if (targetCatId && !map.has(targetCatId)) {
      const resolved = lookupCatalogCategory(targetCatId);
      if (resolved) map.set(targetCatId, resolved);
      else map.set(targetCatId, { id: targetCatId, name: targetCatId });
    }
    return Array.from(map.values());
  }, [currentReferenceDef, formData?.condition, targetsData]);

  if (!isOpen || !rule || !formData) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(formData.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };



  const handleSaveReferenceDefinition = async () => {
    if (!formData?.id) return;
    setIsSavingReference(true);
    try {
      await fetch(`/api/dnext/rules/${formData.id}/definition`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDefinition: charsData.description,
          plainLanguageIntent: humanRuleSummary,
          policyTag: currentReferenceDef?.policyTag || 'Commercial Policy'
        })
      });
      setSavedReferenceFeedback(true);
      setTimeout(() => setSavedReferenceFeedback(false), 2500);
    } catch (err) {
      console.error('Failed to save commercial definition to reference data:', err);
    } finally {
      setIsSavingReference(false);
    }
  };

  const handleInsertTag = (tag) => {
    setCharsData(prev => {
      const current = prev.description ? prev.description.trim() + ' ' : '';
      return {
        ...prev,
        description: current + tag + ' '
      };
    });
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
              {/* Category Pill with Commercial Meaning Popover */}
              {(() => {
                const catMeta = getRuleCategoryMeta(formData.category);
                return (
                  <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: catMeta.badgeColor || 'var(--ds-brand)',
                        background: catMeta.bg || 'rgba(230,0,0,0.08)',
                        border: `1px solid ${catMeta.border || 'rgba(230,0,0,0.25)'}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title={`${catMeta.fullTitle}\n\n${catMeta.description}\n\nTiming: ${catMeta.evaluationPhase}`}
                    >
                      <span>{catMeta.shortLabel}</span>
                      <button
                        type="button"
                        onClick={() => setShowCategoryHelp(!showCategoryHelp)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 2px',
                          color: 'inherit',
                          fontSize: '11px',
                          opacity: 0.85
                        }}
                        title="Learn more about this rule category"
                      >
                        ℹ️
                      </button>
                    </div>

                    {/* Category Explanation Popover */}
                    {showCategoryHelp && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '6px',
                          width: '320px',
                          background: '#ffffff',
                          border: '1px solid var(--ds-border-strong)',
                          borderRadius: '8px',
                          padding: '12px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          zIndex: 1300,
                          animation: 'fadeIn 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '800', color: catMeta.badgeColor }}>
                            {catMeta.fullTitle}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCategoryHelp(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: '13px' }}
                          >
                            ✕
                          </button>
                        </div>
                        <p style={{ fontSize: '11px', color: C.text, lineHeight: '1.45', margin: '0 0 8px 0' }}>
                          {catMeta.description}
                        </p>
                        <div style={{ fontSize: '10px', color: C.muted, background: 'var(--ds-surface-subtle)', padding: '5px 7px', borderRadius: '4px', marginBottom: '10px' }}>
                          ⏱️ <strong>Evaluation Timing:</strong> {catMeta.evaluationPhase}
                        </div>
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: C.muted, display: 'block', marginBottom: '4px' }}>
                            Change Rule Category:
                          </span>
                          <select
                            value={formData.category}
                            onChange={e => {
                              setFormData(prev => ({ ...prev, category: e.target.value }));
                            }}
                            style={{
                              width: '100%',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              border: `1px solid ${C.border}`,
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            {Object.values(RULE_CATEGORY_DEFINITIONS).map(cDef => (
                              <option key={cDef.id} value={cDef.id}>
                                {cDef.shortLabel} ({cDef.id})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

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
              <h2 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '700',
                color: C.text,
                lineHeight: '1.3',
                wordBreak: 'break-word'
              }}>
                {formData.name || 'Untitled Rule'}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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

              {/* ════ SECTION 0: BUSINESS DEFINITION & COMMERCIAL INTENT ════ */}
              <div style={{
                background: '#ffffff',
                border: `1px solid ${C.border}`,
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'var(--ds-brand)', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '2px 7px', borderRadius: '4px' }}>
                      0. BUSINESS DEFINITION
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                      Commercial Definition & Plain-Language Intent
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {currentReferenceDef?.policyTag && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#2563eb',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        📋 Policy: {currentReferenceDef.policyTag}
                      </span>
                    )}
                    {currentReferenceDef?.regulatoryRef && (
                      <span style={{
                        fontSize: '10px',
                        color: C.muted,
                        background: 'var(--ds-surface-subtle)',
                        border: `1px solid ${C.border}`,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        ⚖️ {currentReferenceDef.regulatoryRef}
                      </span>
                    )}
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--ds-ok)',
                      background: 'rgba(16,185,129,0.06)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {currentReferenceDef?.userOverridden ? '✍️ User Curated' : '🤖 LLM Generated Reference'}
                    </span>
                  </div>
                </div>

                {/* Referenced Catalog Categories Interactive Links */}
                {allReferencedCategories && allReferencedCategories.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: 'var(--ds-surface-subtle)', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Referenced Categories:
                    </span>
                    {allReferencedCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleOpenEntity({ id: cat.id, name: cat.name, entityType: 'Category' })}
                        style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#b45309',
                          background: '#fffbeb',
                          border: '1px solid #fde68a',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fef3c7';
                          e.currentTarget.style.borderColor = '#d97706';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#fffbeb';
                          e.currentTarget.style.borderColor = '#fde68a';
                        }}
                        title={`Click to open Category Detail View for ${cat.id} (${cat.name})`}
                      >
                        <Icon name="folder" size={12} />
                        <span><strong>{cat.id}</strong>: {cat.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>↗</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Editable Commercial Definition & Policy Rationale Textarea */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>✍️ Commercial Definition & Policy Rationale</span>
                      <span style={{ fontSize: '10px', color: C.muted, fontWeight: 'normal' }}>(Preserved in CR_BusinessDefinitions.json reference dataset)</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: C.muted }}>
                        {(charsData.description || '').length} chars
                      </span>
                      <button
                        type="button"
                        onClick={handleSaveReferenceDefinition}
                        disabled={isSavingReference}
                        style={{
                          background: savedReferenceFeedback ? 'rgba(16,185,129,0.1)' : '#ffffff',
                          border: `1px solid ${savedReferenceFeedback ? 'var(--ds-ok)' : 'var(--ds-border-strong)'}`,
                          color: savedReferenceFeedback ? 'var(--ds-ok)' : 'var(--ds-text)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: isSavingReference ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                        title="Persist this commercial definition into the official CR_BusinessDefinitions.json reference data"
                      >
                        <span>{savedReferenceFeedback ? '✓ Saved to Reference!' : isSavingReference ? 'Saving…' : '💾 Save to Reference'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick-insert Tag Chips */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: C.muted, fontWeight: '600' }}>Quick Tags:</span>
                    {[
                      { label: '+ 🛡️ Wechselgarantie Policy', tag: '[Policy: Wechselgarantie Guarantee]' },
                      { label: '+ ⚖️ TKG §54 Compliance', tag: '[Regulatory: TKG §54 Consumer Protection]' },
                      { label: '+ 📦 Mandatory Attachment', tag: '[Requirement: Mandatory Hardware Attachment]' },
                      { label: '+ 🎁 Promotional Waiver (PWP)', tag: '[Promotion: Subsidized Device / Fee Waiver]' },
                      { label: '+ 🏷️ Jira OREF-', tag: '[Jira: OREF-]' }
                    ].map(t => (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => handleInsertTag(t.tag)}
                        style={{
                          background: 'var(--ds-surface-subtle)',
                          border: `1px solid ${C.border}`,
                          color: 'var(--ds-text)',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.1s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ds-brand)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={charsData.description}
                    onChange={e => setCharsData(prev => ({
                      ...prev,
                      description: e.target.value,
                      business_intent: e.target.value
                    }))}
                    placeholder="Document the commercial purpose, target customer experience, regulatory rationale, or campaign details for this rule..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: `1px solid ${C.border}`,
                      fontSize: '12px',
                      lineHeight: '1.45',
                      color: C.text,
                      background: '#ffffff',
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--ds-brand)'; }}
                    onBlur={e => { e.target.style.borderColor = C.border; }}
                  />
                </div>
              </div>

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

                            {/* In-Context Catalog Category Decoders */}
                            {(() => {
                              const refCats = extractCategoriesFromText(condStr);
                              if (refCats.length === 0) return null;
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  <span style={{ fontSize: '10px', color: C.muted, fontWeight: '700' }}>Referenced:</span>
                                  {refCats.map(cat => (
                                    <button
                                      key={cat.id}
                                      type="button"
                                      onClick={() => handleOpenEntity({ id: cat.id, name: cat.name, entityType: 'Category' })}
                                      title={`Click to open category detail view: ${cat.fullLabel || cat.id}`}
                                      style={{
                                        fontSize: '10px',
                                        fontWeight: '600',
                                        color: 'var(--ds-brand)',
                                        background: 'rgba(230,0,0,0.06)',
                                        border: '1px solid rgba(230,0,0,0.2)',
                                        padding: '2px 7px',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={e => {
                                        e.currentTarget.style.background = 'var(--ds-brand)';
                                        e.currentTarget.style.color = '#ffffff';
                                      }}
                                      onMouseLeave={e => {
                                        e.currentTarget.style.background = 'rgba(230,0,0,0.06)';
                                        e.currentTarget.style.color = 'var(--ds-brand)';
                                      }}
                                    >
                                      <span>🏷️</span>
                                      <span>{cat.id}: <strong>{cat.name}</strong></span>
                                      {cat.parentName && <span style={{ opacity: 0.7 }}>({cat.parentName})</span>}
                                      <span style={{ fontSize: '9px', opacity: 0.7 }}>↗</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Row Action Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingTop: isMultiline ? '2px' : '0' }}>
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

                {/* ════ RESOLVED OUTCOME & TARGET ALLOWED SCOPE CALLOUT ════ */}
                {(() => {
                  const catCondition = targetsData.conditions?.find(c =>
                    c.type === 'Category' ||
                    c.type === 'catalog.getProductsInCategory' ||
                    c.params?.categoryID ||
                    c.params?.categoryId
                  );
                  const catId = catCondition?.params?.categoryID || catCondition?.params?.categoryId || targetsData?.categoryId;
                  const resolvedCat = lookupCatalogCategory(catId);

                  const prodCondition = targetsData.conditions?.find(c => c.type === 'Product' || c.params?.SKU || c.params?.sku);
                  const targetSku = prodCondition?.params?.SKU || prodCondition?.params?.sku;

                  const isAllowed = charsData.operation_value === 'Allowed';
                  const isObligated = charsData.operation_value === 'Defaulted-Obligated';
                  const isDefaulted = charsData.operation_value === 'Defaulted';
                  const isNotRemovable = charsData.operation_value === 'Removal Not Allowed';

                  const badgeColor = isAllowed ? 'var(--ds-ok)' : isObligated ? 'var(--ds-brand)' : isNotRemovable ? 'var(--ds-warn)' : 'var(--ds-info)';
                  const badgeBg = isAllowed ? 'rgba(16,185,129,0.06)' : isObligated ? 'rgba(230,0,0,0.05)' : isNotRemovable ? 'rgba(245,158,11,0.06)' : 'rgba(2,132,199,0.06)';
                  const badgeBorder = isAllowed ? 'rgba(16,185,129,0.3)' : isObligated ? 'rgba(230,0,0,0.25)' : isNotRemovable ? 'rgba(245,158,11,0.3)' : 'rgba(2,132,199,0.25)';

                  return (
                    <div style={{
                      background: badgeBg,
                      border: `1px solid ${badgeBorder}`,
                      borderLeft: `4px solid ${badgeColor}`,
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>
                          {isAllowed ? '✅' : isObligated ? '🔒' : isDefaulted ? '📦' : '🛡️'}
                        </span>
                        <div>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.04em', color: badgeColor }}>
                            {isAllowed ? 'Allowed Target Scope' : 'Target Outcome & Scope'}
                          </div>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>Outcome: <strong style={{ color: badgeColor }}>{charsData.operation_value || 'Allowed'}</strong></span>
                            <span style={{ color: C.muted }}>→</span>
                            {resolvedCat ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEntity({ id: resolvedCat.id, name: resolvedCat.name, entityType: 'Category' })}
                                style={{
                                  background: '#ffffff',
                                  color: 'var(--ds-ok)',
                                  border: '1px solid rgba(16,185,129,0.4)',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--ds-ok)';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '#ffffff';
                                  e.currentTarget.style.color = 'var(--ds-ok)';
                                }}
                                title={`Click to open Detail View for Category ${resolvedCat.id} (${resolvedCat.name})`}
                              >
                                <Icon name="folder" size={14} />
                                <span>Allowed Category: <strong>{resolvedCat.id} — {resolvedCat.name}</strong></span>
                                {resolvedCat.parentName && (
                                  <span style={{ fontSize: '11px', opacity: 0.85, fontWeight: 'normal' }}>
                                    ({resolvedCat.parentName})
                                  </span>
                                )}
                                <span style={{ fontSize: '11px', marginLeft: '4px' }}>↗</span>
                              </button>
                            ) : catId ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEntity({ id: catId, name: catId, entityType: 'Category' })}
                                style={{
                                  background: '#ffffff',
                                  color: 'var(--ds-ok)',
                                  border: '1px solid rgba(16,185,129,0.4)',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--ds-ok)';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '#ffffff';
                                  e.currentTarget.style.color = 'var(--ds-ok)';
                                }}
                                title={`Click to open Detail View for Category ${catId}`}
                              >
                                <span>Allowed Category: <strong>{catId}</strong></span>
                                <span style={{ fontSize: '11px' }}>↗</span>
                              </button>
                            ) : targetSku ? (
                              <button
                                type="button"
                                onClick={() => handleOpenEntity({ id: targetSku, name: targetSku, entityType: 'ProductOffering' })}
                                style={{
                                  background: '#ffffff',
                                  color: 'var(--ds-info)',
                                  border: '1px solid rgba(2,132,199,0.4)',
                                  padding: '4px 12px',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--ds-info)';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = '#ffffff';
                                  e.currentTarget.style.color = 'var(--ds-info)';
                                }}
                                title={`Click to open Detail View for Product SKU: ${targetSku}`}
                              >
                                <Icon name="package" size={14} />
                                <span>Target SKU: <strong>{targetSku}</strong></span>
                                <span style={{ fontSize: '11px' }}>↗</span>
                              </button>
                            ) : (
                              <span style={{ color: C.muted, fontStyle: 'italic' }}>
                                {targetsData.groupName || 'No specific target category assigned'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {resolvedCat && (
                        <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)' }}>
                          ID: {resolvedCat.id}
                        </div>
                      )}
                    </div>
                  );
                })()}

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
                                params: val === 'Product'
                                  ? { SKU: 'GS_Glas_PWP' }
                                  : (val === 'catalog.getTariffsWithContractValue' ? { Operation: '<=' } : { categoryID: tc.params?.categoryID || tc.params?.categoryId || 'FN36' })
                              };
                              return { ...prev, conditions: next };
                            });
                          }}
                          style={{ padding: '4px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px', fontWeight: '600' }}
                        >
                          <option value="Category">Category (TMF Standard)</option>
                          <option value="catalog.getProductsInCategory">Products In Category (catalog.getProductsInCategory)</option>
                          <option value="catalog.getTariffsWithContractValue">Tariffs With Contract Value</option>
                          <option value="Product">Specific Product SKU</option>
                        </select>

                        {/* Parameter Fields */}
                        {(tc.type === 'Category' || tc.type === 'catalog.getProductsInCategory') && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', color: C.muted }}>categoryID:</span>
                              <input
                                list="catalog-category-datalist"
                                type="text"
                                value={tc.params?.categoryID || tc.params?.categoryId || ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  const match = val.match(/^(FN[0-9]+)/);
                                  const catId = match ? match[1] : val.trim();
                                  updateTargetParam(tcIdx, 'categoryID', catId);
                                }}
                                placeholder="Search category ID or name…"
                                style={{ width: '130px', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px' }}
                              />
                            </div>

                            {/* Resolved Category Name Badge Link */}
                            {(() => {
                              const catId = tc.params?.categoryID || tc.params?.categoryId;
                              const resolvedCat = lookupCatalogCategory(catId);
                              if (!resolvedCat) return null;
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEntity({ id: resolvedCat.id, name: resolvedCat.name, entityType: 'Category' })}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: 'var(--ds-ok)',
                                    background: 'rgba(16,185,129,0.08)',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={e => {
                                    e.currentTarget.style.background = 'var(--ds-ok)';
                                    e.currentTarget.style.color = '#ffffff';
                                  }}
                                  onMouseLeave={e => {
                                    e.currentTarget.style.background = 'rgba(16,185,129,0.08)';
                                    e.currentTarget.style.color = 'var(--ds-ok)';
                                  }}
                                  title={`Click to open Detail View: ${resolvedCat.fullLabel}`}
                                >
                                  <Icon name="folder" size={12} />
                                  <span>{resolvedCat.name} ({resolvedCat.id})</span>
                                  <span style={{ fontSize: '10px' }}>↗</span>
                                </button>
                              );
                            })()}
                          </div>
                        )}

                        {tc.type === 'Product' && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', color: C.muted }}>SKU:</span>
                            <input
                              type="text"
                              value={tc.params?.SKU || tc.params?.sku || ''}
                              onChange={e => updateTargetParam(tcIdx, 'SKU', e.target.value)}
                              placeholder="e.g. GS_Glas_PWP_IP532"
                              style={{ width: '160px', padding: '3px 6px', borderRadius: '4px', border: `1px solid ${C.border}`, fontSize: '11px' }}
                            />
                            {(tc.params?.SKU || tc.params?.sku) && (
                              <button
                                type="button"
                                onClick={() => handleOpenEntity({ id: tc.params?.SKU || tc.params?.sku, entityType: 'ProductOffering' })}
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: 'var(--ds-info)',
                                  background: 'rgba(2,132,199,0.08)',
                                  border: '1px solid rgba(2,132,199,0.3)',
                                  padding: '2px 8px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--ds-info)';
                                  e.currentTarget.style.color = '#ffffff';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(2,132,199,0.08)';
                                  e.currentTarget.style.color = 'var(--ds-info)';
                                }}
                                title={`Click to open Detail View for SKU: ${tc.params?.SKU || tc.params?.sku}`}
                              >
                                <Icon name="package" size={12} />
                                <span>View Product ↗</span>
                              </button>
                            )}
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

        {/* Global Catalog Categories Datalist for autocomplete */}
        <datalist id="catalog-category-datalist">
          {allCatalogCategories.map(cat => (
            <option key={cat.id} value={`${cat.id} — ${cat.name}`} />
          ))}
        </datalist>
      </div>

      {/* ─── Detail View Drawer for Referred Entities (Categories, Product Offerings) ─── */}
      {inspectedEntity && (
        <DnextEntityDrawer
          item={inspectedEntity}
          isOpen={Boolean(inspectedEntity)}
          onClose={() => setInspectedEntity(null)}
          zIndex={1400}
        />
      )}
    </div>
  );
}
