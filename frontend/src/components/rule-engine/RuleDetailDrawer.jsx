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

const RULE_CHARACTERISTIC_SPECS = [
  {
    key: 'package_type',
    name: 'package_type',
    label: 'Package Type / Product Domain',
    section: 'Commercial Scope',
    description: 'Product technology family (DSL, Fiber / GPON, Cable, Mobile) governing line qualification.',
    type: 'select',
    options: ['DSL', 'Fiber / GPON', 'Cable', 'Mobile', 'Convergent', 'Generic'],
    icon: 'package'
  },
  {
    key: 'description',
    name: 'description',
    label: 'Rule Description',
    section: 'Commercial Scope',
    description: 'Commercial and operational rule explanation describing the policy requirement.',
    type: 'textarea',
    icon: 'clipboard'
  },
  {
    key: 'business_intent',
    name: 'business_intent',
    label: 'Plain Language Business Intent',
    section: 'Commercial Scope',
    description: 'High-level commercial intent and rationale evaluated by sales catalog journeys.',
    type: 'textarea',
    icon: 'info'
  },
  {
    key: 'source_type',
    name: 'source_type',
    label: 'Source Entity Type',
    section: 'Commercial Scope',
    description: 'Triggering entity domain that initiates rule evaluation (Service, Product, Customer).',
    type: 'select',
    options: ['Service', 'Product', 'Customer', 'Resource'],
    icon: 'layers'
  },
  {
    key: 'priority',
    name: 'priority',
    label: 'Evaluation Priority',
    section: 'Execution Guardrails',
    description: 'Execution priority weight (1 highest, 10 lowest) for rule conflict resolution.',
    type: 'number',
    min: 1,
    max: 10,
    icon: 'sliders'
  },
  {
    key: 'operation_type',
    name: 'operation_type',
    label: 'Operation Boundary Type',
    section: 'Execution Guardrails',
    description: 'Boundary between trigger and target entities (e.g. Service-Service, Service-Product).',
    type: 'select',
    options: ['Service-Service', 'Service-Product', 'Product-Product', 'Product-Service', 'Customer-Product'],
    icon: 'repeat'
  },
  {
    key: 'effective_date',
    name: 'effective_date',
    label: 'Effective Date',
    section: 'Execution Guardrails',
    description: 'Calendar date from which this rule policy takes operational effect.',
    type: 'date',
    icon: 'calendar'
  },
  {
    key: 'channels',
    name: 'channels',
    label: 'Eligible Sales Channels',
    section: 'Execution Guardrails',
    description: 'Sales distribution channels (* for all channels, or comma-separated: OSE, Retail, Telesales).',
    type: 'channels',
    icon: 'globe'
  },
  {
    key: 'process_contexts',
    name: 'process_contexts',
    label: 'Business Process Contexts',
    section: 'Execution Guardrails',
    description: 'Comma-separated process codes triggering the rule (ILSBLU, MOVBLU, ACQ, MIGCOC, New_Order, Upgrade).',
    type: 'contexts',
    icon: 'cpu'
  },
  {
    key: 'operation_value',
    name: 'operation.value',
    label: 'Compatibility Action Outcome',
    section: 'Action & Behavior',
    description: 'Enforcement outcome in cart: Allowed, Defaulted, Defaulted-Obligated, Incompatible, etc.',
    type: 'select',
    options: ['Allowed', 'Defaulted', 'Defaulted-Obligated', 'Incompatible', 'Removal Not Allowed', 'Requires-Defaulted'],
    icon: 'zap'
  },
  {
    key: 'ask_confirmation_first',
    name: 'operation.askconfirmationfirst',
    label: 'Prompt User Confirmation',
    section: 'Action & Behavior',
    description: 'Requires customer or sales agent to confirm with a prompt dialog before applying action.',
    type: 'boolean',
    icon: 'alert'
  },
  {
    key: 'override_initial_selectable',
    name: 'operation.overrideinitialselectable',
    label: 'Override Initial Selectable State',
    section: 'Action & Behavior',
    description: 'Overrides whether the target product item appears selectable on initial page load.',
    type: 'boolean',
    icon: 'check'
  }
];

const STANDARD_KEYS = new Set([
  'package_type', 'description', 'business_intent', 'source_type',
  'priority', 'operation_type', 'effective_date', 'operation.value',
  'operation.askconfirmationfirst', 'operation.overrideinitialselectable',
  'channels', 'process_contexts'
]);

function buildInitialFormData(rule) {
  if (!rule) return null;
  return {
    id: rule.id || '',
    name: rule.name || '',
    ruleType: rule.ruleType || 'FORALL',
    conditionVariantType: rule.conditionVariantType || 'expression',
    condition: Array.isArray(rule.condition) ? [...rule.condition] : [],
    category: Array.isArray(rule.category) ? rule.category[0] || 'implicitCompatibility' : (rule.category || 'implicitCompatibility'),
    status: rule.status || 'draft',
    stateCategory: rule.stateCategory || 'Initial'
  };
}

function buildInitialCharsData(rule) {
  if (!rule) return null;
  const initialChars = extractCompatibilityCharacteristics(rule);
  const refDef = (rule.id && RULE_COMMERCIAL_DEFINITIONS[rule.id]) || null;
  if (refDef?.businessDefinition) {
    initialChars.description = refDef.businessDefinition;
  }
  if (refDef?.plainLanguageIntent) {
    initialChars.business_intent = refDef.plainLanguageIntent;
  }
  return initialChars;
}

function buildInitialCustomChars(rule) {
  if (!rule) return [];
  return (Array.isArray(rule.ruleCharacteristic) ? rule.ruleCharacteristic : [])
    .filter(c => c && c.name && !STANDARD_KEYS.has(c.name))
    .map(c => ({
      name: c.name,
      value: c.value !== undefined ? String(c.value) : '',
      valueType: c.valueType || 'String'
    }));
}

export default function RuleDetailDrawer({
  rule,
  isOpen,
  onClose,
  onSaveRule,
  onDeleteRule,
  isSaving = false
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'characteristics' | 'json'
  const [copiedId, setCopiedId] = useState(false);

  const [showCategoryHelp, setShowCategoryHelp] = useState(false);
  const [expandedConditions, setExpandedConditions] = useState({});
  const [allConditionsMultiline, setAllConditionsMultiline] = useState(false);
  const [isSavingReference, setIsSavingReference] = useState(false);
  const [savedReferenceFeedback, setSavedReferenceFeedback] = useState(false);

  // Form State
  const [formData, setFormData] = useState(() => buildInitialFormData(rule));
  const [charsData, setCharsData] = useState(() => buildInitialCharsData(rule));
  const [customChars, setCustomChars] = useState(() => buildInitialCustomChars(rule));
  const [charSearch, setCharSearch] = useState('');
  const [selectedCharSection, setSelectedCharSection] = useState('All');
  const [newCustomCharName, setNewCustomCharName] = useState('');
  const [newCustomCharValue, setNewCustomCharValue] = useState('');
  const [targetsData, setTargetsData] = useState(() => rule ? extractResultTargets(rule) : null);
  const [rawJsonText, setRawJsonText] = useState(() => rule ? JSON.stringify(rule, null, 2) : '');
  const [jsonError, setJsonError] = useState(null);

  // Sync form state when rule or isOpen changes
  useEffect(() => {
    if (rule && isOpen) {
      setFormData(buildInitialFormData(rule));
      setCharsData(buildInitialCharsData(rule));
      setCustomChars(buildInitialCustomChars(rule));
      setTargetsData(extractResultTargets(rule));
      setRawJsonText(JSON.stringify(rule, null, 2));
      setJsonError(null);
      setCharSearch('');
      setSelectedCharSection('All');
      setNewCustomCharName('');
      setNewCustomCharValue('');
    }
  }, [rule, isOpen]);

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
      ruleCharacteristic: [
        ...serializeCompatibilityCharacteristics(charsData),
        ...(customChars || []).map(c => ({
          name: c.name,
          value: String(c.value !== undefined ? c.value : ''),
          ...(c.valueType ? { valueType: c.valueType } : {})
        }))
      ]
    };
  }, [formData, charsData, targetsData, customChars]);

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

      const standardKeys = new Set([
        'package_type', 'description', 'business_intent', 'source_type',
        'priority', 'operation_type', 'effective_date', 'operation.value',
        'operation.askconfirmationfirst', 'operation.overrideinitialselectable',
        'channels', 'process_contexts'
      ]);
      if (Array.isArray(parsed.ruleCharacteristic)) {
        const parsedCustom = parsed.ruleCharacteristic
          .filter(c => c && c.name && !standardKeys.has(c.name))
          .map(c => ({
            name: c.name,
            value: c.value !== undefined ? String(c.value) : '',
            valueType: c.valueType || 'String'
          }));
        setCustomChars(parsedCustom);
      }
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const updateCharVal = (key, value) => {
    setCharsData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddCustomChar = () => {
    if (!newCustomCharName.trim()) return;
    const name = newCustomCharName.trim();
    const value = newCustomCharValue.trim();
    setCustomChars(prev => {
      const filtered = prev.filter(c => c.name !== name);
      return [...filtered, { name, value, valueType: 'String' }];
    });
    setNewCustomCharName('');
    setNewCustomCharValue('');
  };

  const handleRemoveCustomChar = (name) => {
    setCustomChars(prev => prev.filter(c => c.name !== name));
  };

  const handleUpdateCustomCharVal = (name, value) => {
    setCustomChars(prev => prev.map(c => c.name === name ? { ...c, value } : c));
  };

  // Filtered characteristics for the Characteristics tab
  const filteredStandardSpecs = useMemo(() => {
    return RULE_CHARACTERISTIC_SPECS.filter(spec => {
      if (selectedCharSection !== 'All' && selectedCharSection !== 'Custom' && spec.section !== selectedCharSection) {
        return false;
      }
      if (selectedCharSection === 'Custom') {
        return false;
      }
      if (charSearch.trim()) {
        const q = charSearch.toLowerCase().trim();
        const curVal = String(charsData?.[spec.key] !== undefined ? (Array.isArray(charsData[spec.key]) ? charsData[spec.key].join(', ') : charsData[spec.key]) : '').toLowerCase();
        const nameMatch = spec.name.toLowerCase().includes(q);
        const labelMatch = spec.label.toLowerCase().includes(q);
        const descMatch = (spec.description || '').toLowerCase().includes(q);
        const valMatch = curVal.includes(q);
        return nameMatch || labelMatch || descMatch || valMatch;
      }
      return true;
    });
  }, [charSearch, selectedCharSection, charsData]);

  const filteredCustomChars = useMemo(() => {
    if (selectedCharSection !== 'All' && selectedCharSection !== 'Custom') return [];
    if (!charSearch.trim()) return customChars;
    const q = charSearch.toLowerCase().trim();
    return customChars.filter(c => (c.name || '').toLowerCase().includes(q) || (c.value || '').toLowerCase().includes(q));
  }, [customChars, charSearch, selectedCharSection]);

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

        {/* ─── Dedicated Navigation Tab Bar ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${C.border}`,
          background: '#ffffff',
          padding: '0 24px',
          gap: '12px',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={() => {
              setRawJsonText(JSON.stringify(currentMergedRule, null, 2));
              setActiveTab('visual');
            }}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: activeTab === 'visual' ? '700' : '600',
              color: activeTab === 'visual' ? 'var(--ds-brand)' : C.muted,
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${activeTab === 'visual' ? 'var(--ds-brand)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="sliders" size={14} />
            <span>Visual Authoring</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRawJsonText(JSON.stringify(currentMergedRule, null, 2));
              setActiveTab('characteristics');
            }}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: activeTab === 'characteristics' ? '700' : '600',
              color: activeTab === 'characteristics' ? 'var(--ds-brand)' : C.muted,
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${activeTab === 'characteristics' ? 'var(--ds-brand)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="clipboard" size={14} />
            <span>Characteristics</span>
            <span style={{
              fontSize: '11px',
              background: activeTab === 'characteristics' ? 'rgba(230,0,0,0.1)' : 'var(--ds-surface-2)',
              color: activeTab === 'characteristics' ? 'var(--ds-brand)' : C.muted,
              padding: '1px 7px',
              borderRadius: '10px',
              fontWeight: '700'
            }}>
              {RULE_CHARACTERISTIC_SPECS.length + customChars.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRawJsonText(JSON.stringify(currentMergedRule, null, 2));
              setActiveTab('json');
            }}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: activeTab === 'json' ? '700' : '600',
              color: activeTab === 'json' ? 'var(--ds-brand)' : C.muted,
              background: 'none',
              border: 'none',
              borderBottom: `2.5px solid ${activeTab === 'json' ? 'var(--ds-brand)' : 'transparent'}`,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="file" size={14} />
            <span>Raw TMF JSON</span>
          </button>
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
          ) : activeTab === 'characteristics' ? (
            /* ── Characteristics Tab (for view / edit / new) ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Card with Stats & Controls */}
              <div style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="clipboard" size={16} color="var(--ds-brand)" />
                      <span>Rule Characteristics & Policy Parameters</span>
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: C.muted }}>
                      TMForum TMF620 Compatibility Governance Metadata and Custom Attributes (<code>ruleCharacteristic</code>).
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: 'var(--ds-brand-dark)',
                      background: 'rgba(230,0,0,0.08)',
                      border: '1px solid rgba(230,0,0,0.2)',
                      padding: '3px 10px',
                      borderRadius: '6px'
                    }}>
                      {RULE_CHARACTERISTIC_SPECS.length + customChars.length} Total Parameters
                    </span>
                    <span style={{
                      fontSize: '11.5px',
                      fontWeight: '700',
                      color: 'var(--ds-spec)',
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      padding: '3px 10px',
                      borderRadius: '6px'
                    }}>
                      {customChars.length} Custom Attributes
                    </span>
                  </div>
                </div>

                {/* Controls Bar: Search Filter & Section Quick-Select */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: `1px solid ${C.border}`,
                  flexWrap: 'wrap'
                }}>
                  {/* Search Filter Input */}
                  <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                    <input
                      type="text"
                      placeholder="Type keystrokes to filter characteristics..."
                      value={charSearch}
                      onChange={e => setCharSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 30px 7px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: `1px solid ${C.border}`,
                        background: 'var(--ds-surface-subtle)',
                        outline: 'none',
                        color: C.text
                      }}
                    />
                    {charSearch ? (
                      <button
                        type="button"
                        onClick={() => setCharSearch('')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    ) : (
                      <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }}>
                        <Icon name="search" size={13} />
                      </span>
                    )}
                  </div>

                  {/* Section Category Filter Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {['All', 'Commercial Scope', 'Execution Guardrails', 'Action & Behavior', 'Custom'].map(sec => {
                      const count = sec === 'All'
                        ? RULE_CHARACTERISTIC_SPECS.length + customChars.length
                        : sec === 'Custom'
                          ? customChars.length
                          : RULE_CHARACTERISTIC_SPECS.filter(s => s.section === sec).length;
                      const isSel = selectedCharSection === sec;
                      return (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSelectedCharSection(sec)}
                          style={{
                            background: isSel ? 'var(--ds-brand)' : 'var(--ds-surface-2)',
                            color: isSel ? '#ffffff' : C.text,
                            border: `1px solid ${isSel ? 'var(--ds-brand)' : C.border}`,
                            padding: '4px 10px',
                            borderRadius: '14px',
                            fontSize: '11px',
                            fontWeight: isSel ? '700' : '500',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span>{sec}</span>
                          <span style={{
                            fontSize: '10px',
                            opacity: 0.85,
                            background: isSel ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                            padding: '1px 5px',
                            borderRadius: '10px'
                          }}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sections Breakdown */}
              {['Commercial Scope', 'Execution Guardrails', 'Action & Behavior'].map(secName => {
                const specs = filteredStandardSpecs.filter(s => s.section === secName);
                if (specs.length === 0) return null;

                return (
                  <div
                    key={secName}
                    style={{
                      background: C.panel,
                      border: `1px solid ${C.border}`,
                      borderRadius: '10px',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{
                      padding: '12px 18px',
                      background: 'var(--ds-surface-subtle)',
                      borderBottom: `1px solid ${C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                          {secName}
                        </span>
                        <span style={{ fontSize: '11px', color: C.muted }}>
                          ({specs.length} {specs.length === 1 ? 'parameter' : 'parameters'})
                        </span>
                      </div>
                    </div>

                    <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                      {specs.map(spec => {
                        const val = charsData?.[spec.key];

                        return (
                          <div
                            key={spec.key}
                            style={{
                              background: '#ffffff',
                              border: `1px solid ${C.border}`,
                              borderRadius: '8px',
                              padding: '12px 14px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Icon name={spec.icon} size={14} color="var(--ds-brand)" />
                                <span style={{ fontSize: '12.5px', fontWeight: '700', color: C.text }}>
                                  {spec.label}
                                </span>
                              </div>
                              <code style={{
                                fontSize: '11px',
                                color: 'var(--ds-brand-dark)',
                                background: 'rgba(230,0,0,0.06)',
                                border: '1px solid rgba(230,0,0,0.2)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontFamily: 'var(--ds-font-mono)'
                              }}>
                                {spec.name}
                              </code>
                            </div>

                            <p style={{ margin: 0, fontSize: '11px', color: C.muted, lineHeight: '1.4' }}>
                              {spec.description}
                            </p>

                            {/* Control based on spec.type */}
                            <div style={{ marginTop: '4px' }}>
                              {spec.type === 'select' && (
                                <select
                                  value={val || spec.options[0]}
                                  onChange={e => updateCharVal(spec.key, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    borderRadius: '5px',
                                    border: `1px solid ${C.border}`,
                                    background: '#ffffff',
                                    color: C.text,
                                    outline: 'none'
                                  }}
                                >
                                  {spec.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              )}

                              {spec.type === 'textarea' && (
                                <textarea
                                  rows={2}
                                  value={val || ''}
                                  onChange={e => updateCharVal(spec.key, e.target.value)}
                                  placeholder={`Enter ${spec.label.toLowerCase()}...`}
                                  style={{
                                    width: '100%',
                                    padding: '6px 8px',
                                    fontSize: '12px',
                                    borderRadius: '5px',
                                    border: `1px solid ${C.border}`,
                                    background: '#ffffff',
                                    color: C.text,
                                    outline: 'none',
                                    resize: 'vertical',
                                    lineHeight: '1.4'
                                  }}
                                />
                              )}

                              {spec.type === 'number' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input
                                    type="number"
                                    min={spec.min}
                                    max={spec.max}
                                    value={val !== undefined ? val : 5}
                                    onChange={e => updateCharVal(spec.key, parseInt(e.target.value, 10))}
                                    style={{
                                      width: '90px',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      fontWeight: '700',
                                      borderRadius: '5px',
                                      border: `1px solid ${C.border}`,
                                      background: '#ffffff',
                                      color: C.text
                                    }}
                                  />
                                  <span style={{ fontSize: '11px', color: C.muted }}>
                                    Weight (1 = Top Evaluation, 10 = Lowest)
                                  </span>
                                </div>
                              )}

                              {spec.type === 'date' && (
                                <input
                                  type="date"
                                  value={val || ''}
                                  onChange={e => updateCharVal(spec.key, e.target.value)}
                                  style={{
                                    padding: '5px 8px',
                                    fontSize: '12px',
                                    borderRadius: '5px',
                                    border: `1px solid ${C.border}`,
                                    background: '#ffffff',
                                    color: C.text
                                  }}
                                />
                              )}

                              {spec.type === 'boolean' && (
                                <button
                                  type="button"
                                  onClick={() => updateCharVal(spec.key, !val)}
                                  style={{
                                    background: val ? 'rgba(16,185,129,0.1)' : 'var(--ds-surface-2)',
                                    border: `1px solid ${val ? 'var(--ds-ok)' : C.border}`,
                                    color: val ? 'var(--ds-ok)' : C.muted,
                                    padding: '6px 14px',
                                    borderRadius: '5px',
                                    fontSize: '11.5px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  <span>{val ? '✓ True (Active)' : '✕ False (Inactive)'}</span>
                                </button>
                              )}

                              {spec.type === 'channels' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    type="text"
                                    value={val || '*'}
                                    onChange={e => updateCharVal(spec.key, e.target.value)}
                                    placeholder="Channels (e.g. *, OSE, Retail, Telesales)"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      borderRadius: '5px',
                                      border: `1px solid ${C.border}`,
                                      background: '#ffffff',
                                      color: C.text
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {['* (All)', 'OSE', 'Retail', 'Telesales', 'Care'].map(chTag => (
                                      <button
                                        key={chTag}
                                        type="button"
                                        onClick={() => {
                                          const rawTag = chTag.startsWith('*') ? '*' : chTag;
                                          updateCharVal(spec.key, rawTag);
                                        }}
                                        style={{
                                          background: 'var(--ds-surface-2)',
                                          border: `1px solid ${C.border}`,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontSize: '10px',
                                          cursor: 'pointer',
                                          color: C.text
                                        }}
                                      >
                                        {chTag}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {spec.type === 'contexts' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <input
                                    type="text"
                                    value={Array.isArray(val) ? val.join(', ') : (val || '')}
                                    onChange={e => {
                                      const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                      updateCharVal(spec.key, arr);
                                    }}
                                    placeholder="Contexts (e.g. ILSBLU, MOVBLU, ACQ, MIGCOC)"
                                    style={{
                                      width: '100%',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      borderRadius: '5px',
                                      border: `1px solid ${C.border}`,
                                      background: '#ffffff',
                                      color: C.text
                                    }}
                                  />
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    {['ILSBLU', 'MOVBLU', 'ACQ', 'MIGCOC', 'New_Order', 'Upgrade'].map(ctxTag => (
                                      <button
                                        key={ctxTag}
                                        type="button"
                                        onClick={() => {
                                          const currentArr = Array.isArray(val) ? [...val] : String(val || '').split(',').map(s => s.trim()).filter(Boolean);
                                          if (!currentArr.includes(ctxTag)) {
                                            updateCharVal(spec.key, [...currentArr, ctxTag]);
                                          }
                                        }}
                                        style={{
                                          background: 'var(--ds-surface-2)',
                                          border: `1px solid ${C.border}`,
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontSize: '10px',
                                          cursor: 'pointer',
                                          color: C.text
                                        }}
                                      >
                                        + {ctxTag}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Custom & Extended Characteristics Section */}
              {(selectedCharSection === 'All' || selectedCharSection === 'Custom') && (
                <div style={{
                  background: C.panel,
                  border: `1px solid ${C.border}`,
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    padding: '12px 18px',
                    background: 'var(--ds-surface-subtle)',
                    borderBottom: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="tag" size={14} color="var(--ds-spec)" />
                      <span style={{ fontSize: '13px', fontWeight: '700', color: C.text }}>
                        Custom & Extended Characteristics
                      </span>
                      <span style={{ fontSize: '11px', color: C.muted }}>
                        ({customChars.length} {customChars.length === 1 ? 'custom attribute' : 'custom attributes'})
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: C.muted }}>
                      Extra TMF key-value parameters persisted in <code>ruleCharacteristic</code>
                    </span>
                  </div>

                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredCustomChars.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '12px', fontStyle: 'italic', background: 'var(--ds-surface-subtle)', borderRadius: '6px' }}>
                        {customChars.length === 0
                          ? 'No custom characteristics currently defined. Add one below to extend this rule.'
                          : `No custom characteristics matching "${charSearch}".`}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {filteredCustomChars.map((cc, ccIdx) => (
                          <div
                            key={ccIdx}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'var(--ds-surface-subtle)',
                              border: `1px solid ${C.border}`,
                              borderRadius: '6px',
                              padding: '8px 12px',
                              gap: '12px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '180px' }}>
                              <code style={{ fontSize: '12px', fontWeight: '700', color: 'var(--ds-spec)', fontFamily: 'var(--ds-font-mono)' }}>
                                {cc.name}
                              </code>
                              <span style={{ fontSize: '10px', color: C.muted, background: 'var(--ds-surface-2)', padding: '1px 5px', borderRadius: '4px' }}>
                                {cc.valueType || 'String'}
                              </span>
                            </div>

                            <div style={{ flex: 1, minWidth: '200px' }}>
                              <input
                                type="text"
                                value={cc.value}
                                onChange={e => handleUpdateCustomCharVal(cc.name, e.target.value)}
                                placeholder="Value..."
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  borderRadius: '4px',
                                  border: `1px solid ${C.border}`,
                                  background: '#ffffff',
                                  color: C.text
                                }}
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveCustomChar(cc.name)}
                              style={{
                                background: 'rgba(230,0,0,0.06)',
                                border: '1px solid rgba(230,0,0,0.2)',
                                color: 'var(--ds-brand)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                              title="Remove custom characteristic"
                            >
                              <Icon name="trash" size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Add Custom Characteristic Bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${C.border}`,
                      flexWrap: 'wrap'
                    }}>
                      <input
                        type="text"
                        placeholder="Name (e.g. policyTag, legalNotice)"
                        value={newCustomCharName}
                        onChange={e => setNewCustomCharName(e.target.value)}
                        style={{
                          flex: '1 1 180px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '5px',
                          border: `1px solid ${C.border}`,
                          background: '#ffffff',
                          color: C.text
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. GigaKombi_Broadband)"
                        value={newCustomCharValue}
                        onChange={e => setNewCustomCharValue(e.target.value)}
                        style={{
                          flex: '1 1 200px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '5px',
                          border: `1px solid ${C.border}`,
                          background: '#ffffff',
                          color: C.text
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomChar}
                        disabled={!newCustomCharName.trim()}
                        style={{
                          background: newCustomCharName.trim() ? 'var(--ds-spec)' : 'var(--ds-surface-2)',
                          color: newCustomCharName.trim() ? '#ffffff' : C.muted,
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '5px',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: newCustomCharName.trim() ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>+</span> Add Custom Characteristic
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
