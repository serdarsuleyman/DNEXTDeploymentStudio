// ruleDescriptors.js
// Complete descriptors and taxonomy for DNEXT Rule Engine
// Based on DNEXT Rule Engine Specification v1.4.2

export const RULE_CATEGORIES = [
  { id: 'implicitCompatibility', label: 'Implicit Compatibility', color: 'var(--ds-brand)' },
  { id: 'implicitEligibility', label: 'Implicit Eligibility', color: 'var(--ds-spec)' },
  { id: 'pricingLogicAlgorithm', label: 'Pricing Logic Algorithm', color: 'var(--ds-warn)' },
  { id: 'salesRules', label: 'Sales Rules', color: 'var(--ds-info)' },
  { id: 'mapperRules', label: 'Mapper Rules', color: '#0891b2' }
];

export const RULE_STATUSES = [
  { id: 'draft', label: 'Draft', color: 'var(--ds-warn)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { id: 'active', label: 'Active', color: 'var(--ds-ok)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  { id: 'inactive', label: 'Inactive', color: 'var(--ds-text-2)', bg: 'var(--ds-surface-2)', border: 'var(--ds-border-strong)' }
];

export const STATE_GROUPS = [
  { id: 'Initial', label: 'Initial', icon: 'clock' },
  { id: 'In progress', label: 'In Progress', icon: 'activity' },
  { id: 'Terminal success', label: 'Terminal Success', icon: 'check' }
];

export const RULE_QUANTIFIERS = [
  { id: 'FORALL', label: 'FORALL (All conditions must match)', description: 'Evaluates to true if every condition is met' },
  { id: 'FORSOME', label: 'FORSOME (At least one condition matches)', description: 'Evaluates to true if one or more conditions are met' },
  { id: 'IF', label: 'IF (Standard Conditional)', description: 'Direct conditional evaluation' },
  { id: 'FORNONE', label: 'FORNONE (None of the conditions match)', description: 'Evaluates to true if zero conditions are met' },
  { id: 'FORONE', label: 'FORONE (Exactly one condition matches)', description: 'Evaluates to true if exactly one condition is met' }
];

export const COMPATIBILITY_ACTIONS = [
  { id: 'Allowed', label: 'Allowed', description: 'Item is permitted in cart/configuration', color: 'var(--ds-ok)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' },
  { id: 'Defaulted', label: 'Defaulted', description: 'Item is added automatically by default', color: 'var(--ds-info)', bg: 'rgba(2,132,199,0.1)', border: 'rgba(2,132,199,0.3)' },
  { id: 'Defaulted-Obligated', label: 'Defaulted-Obligated', description: 'Item is mandatory and cannot be unselected', color: 'var(--ds-brand)', bg: 'rgba(230,0,0,0.08)', border: 'rgba(230,0,0,0.3)' },
  { id: 'Removal Not Allowed', label: 'Removal Not Allowed', description: 'Existing item cannot be removed from customer setup', color: 'var(--ds-warn)', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
];

export const OPERATION_TYPES = [
  { id: 'Service-Service', label: 'Service-Service' },
  { id: 'Service-Product', label: 'Service-Product' },
  { id: 'Product-Product', label: 'Product-Product' }
];

/**
 * 8 Core Business Archetypes for Rule Classification
 */
export const RULE_ARCHETYPES = [
  {
    id: 'downgrade_guarantee',
    label: 'Wechselgarantie (Downgrade/Upgrade)',
    shortLabel: 'Wechselgarantie',
    icon: 'shield',
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    description: 'Tariff mobility & downgrade guarantees during contract renewal or moves'
  },
  {
    id: 'mandatory_attachment',
    label: 'Mandatory Attachment / Fee',
    shortLabel: 'Mandatory Fee',
    icon: 'bag',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    description: 'Auto-injecting mandatory hardware, shipping or setup fees'
  },
  {
    id: 'promotional_default',
    label: 'Promotional Default (PWP)',
    shortLabel: 'Promo Default',
    icon: 'tag',
    color: '#059669',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    description: 'Pre-selecting subsidized hardware or promotional discounts with opt-out'
  },
  {
    id: 'retention_lock',
    label: 'Equipment Retention Lock',
    shortLabel: 'Retention Lock',
    icon: 'lock',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    description: 'Preventing compatible existing customer devices from being dropped'
  },
  {
    id: 'technical_compatibility',
    label: 'Technical Compatibility',
    shortLabel: 'Tech Compatibility',
    icon: 'cpu',
    color: '#7c3aed',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    description: 'Enforcing physical or technology compatibility between lines and equipment'
  },
  {
    id: 'customer_eligibility',
    label: 'Customer & Line Eligibility',
    shortLabel: 'Eligibility',
    icon: 'user',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    description: 'Restricting tariffs by customer segment (SOHO), credit, or pending orders'
  },
  {
    id: 'pricing_discount',
    label: 'Pricing & Discounts',
    shortLabel: 'Pricing Logic',
    icon: 'dollar',
    color: '#ca8a04',
    bg: '#fefce8',
    border: '#fef08a',
    description: 'Algorithmic pricing calculations and conditional waivers'
  },
  {
    id: 'sales_journey',
    label: 'Sales Journey & Context',
    shortLabel: 'Sales Rules',
    icon: 'activity',
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    description: 'Channel routing, agent permissions, and process context guards'
  }
];

/**
 * Extracts standard 11 compatibility characteristics from a BasicRule object
 */
export function extractCompatibilityCharacteristics(rule) {
  const chars = Array.isArray(rule?.ruleCharacteristic) ? rule.ruleCharacteristic : [];
  const map = {};
  chars.forEach(c => {
    if (c.name) map[c.name] = c.value;
  });

  return {
    package_type: map['package_type'] || 'DSL',
    description: map['description'] || rule?.description || rule?.name || '',
    business_intent: map['business_intent'] || '',
    source_type: map['source_type'] || 'Service',
    priority: map['priority'] !== undefined ? parseInt(map['priority'], 10) || 5 : 5,
    operation_type: map['operation_type'] || 'Service-Service',
    effective_date: map['effective_date'] || new Date().toISOString().split('T')[0],
    operation_value: map['operation.value'] || 'Allowed',
    ask_confirmation_first: String(map['operation.askconfirmationfirst']).toLowerCase() === 'true',
    override_initial_selectable: String(map['operation.overrideinitialselectable']).toLowerCase() === 'true',
    channels: map['channels'] || '*',
    process_contexts: (map['process_contexts'] || '').split(',').map(s => s.trim()).filter(Boolean)
  };
}

/**
 * Extracts target conditions from the TMF attributeValueList result structure
 */
export function extractResultTargets(rule) {
  const result = rule?.result || {};
  const rootAttr = result.attribute || {};
  const groupName = rootAttr.name || 'Target Selection';
  const childAttrs = Array.isArray(rootAttr.attribute) ? rootAttr.attribute : [];

  let targetAggregator = 'having';
  let conditionValue = '';
  const conditions = [];

  childAttrs.forEach(item => {
    if (item.name === 'TargetAggregator') targetAggregator = item.value;
    else if (item.name === 'ConditionValue') conditionValue = item.value;
    else if (item.name === 'TargetCondition') {
      const tcAttrs = Array.isArray(item.attribute) ? item.attribute : [];
      let type = '';
      let operator = '';
      let cVal = '';
      const params = {};

      tcAttrs.forEach(tcField => {
        if (tcField.name === 'Type') type = tcField.value;
        else if (tcField.name === 'Operator') operator = tcField.value;
        else if (tcField.name === 'ConditionValue') cVal = tcField.value;
        else if (tcField.name === 'Params') {
          const pAttrs = Array.isArray(tcField.attribute) ? tcField.attribute : [];
          let pName = '';
          let pValue = '';
          pAttrs.forEach(p => {
            if (p.name === 'name') pName = p.value;
            if (p.name === 'value') pValue = p.value;
          });
          if (pName) {
            params[pName] = pValue;
          } else {
            pAttrs.forEach(p => {
              if (p.name && p.name !== 'name' && p.value !== undefined) {
                params[p.name] = p.value;
              }
            });
          }
        }
      });

      conditions.push({ type, operator, conditionValue: cVal, params });
    }
  });

  // Extract helper properties from first condition if available
  const firstCatCond = conditions.find(c =>
    c.type === 'Category' ||
    c.type === 'catalog.getProductsInCategory' ||
    c.params?.categoryID ||
    c.params?.categoryId
  );
  const categoryId = firstCatCond?.params?.categoryID || firstCatCond?.params?.categoryId || null;

  const firstProdCond = conditions.find(c =>
    c.type === 'Product' ||
    c.params?.SKU ||
    c.params?.sku
  );
  const productSku = firstProdCond?.params?.SKU || firstProdCond?.params?.sku || null;

  const selectionType = firstProdCond ? 'Product' : (firstCatCond ? 'Category' : (groupName ? 'Category' : 'Unknown'));

  return {
    groupName,
    targetAggregator,
    conditionValue,
    conditions,
    selectionType,
    categoryId,
    productSku
  };
}

/**
 * Classifies any BasicRule into its business archetype
 */
export function classifyRule(rule) {
  if (!rule) return RULE_ARCHETYPES[0];

  const category = Array.isArray(rule.category) ? rule.category : [rule.category];
  const name = String(rule.name || '').toLowerCase();
  const chars = extractCompatibilityCharacteristics(rule);
  const opVal = chars.operation_value;
  const conditionsStr = Array.isArray(rule.condition) ? rule.condition.join(' ').toLowerCase() : '';
  const targets = extractResultTargets(rule);
  const targetStr = JSON.stringify(targets).toLowerCase();

  // 1. Explicit TMF Categories first
  if (category.includes('implicitEligibility')) {
    return RULE_ARCHETYPES.find(a => a.id === 'customer_eligibility') || RULE_ARCHETYPES[5];
  }
  if (category.includes('pricingLogicAlgorithm')) {
    return RULE_ARCHETYPES.find(a => a.id === 'pricing_discount') || RULE_ARCHETYPES[6];
  }
  if (category.includes('salesRules')) {
    return RULE_ARCHETYPES.find(a => a.id === 'sales_journey') || RULE_ARCHETYPES[7];
  }

  // 2. Wechselgarantie / Downgrade Guarantees
  if (
    name.includes('wechselgarantie') ||
    name.includes('downgrade') ||
    targetStr.includes('downgrade') ||
    (opVal === 'Allowed' && (
      conditionsStr.includes('tariffinminimumduration') ||
      conditionsStr.includes('tariffisinday') ||
      targetStr.includes('gettariffswithcontractvalue')
    ))
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'downgrade_guarantee') || RULE_ARCHETYPES[0];
  }

  // 3. Equipment Retention Lock
  if (
    opVal === 'Removal Not Allowed' ||
    name.includes('not removable') ||
    name.includes('removal not allowed') ||
    name.includes('lock') ||
    (conditionsStr.includes('installbase.containsproduct') && opVal !== 'Allowed')
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'retention_lock') || RULE_ARCHETYPES[3];
  }

  // 4. Mandatory Attachment / Fees
  if (
    opVal === 'Defaulted-Obligated' ||
    name.includes('versandkosten') ||
    name.includes('shipping') ||
    targetStr.includes('versandkosten') ||
    targetStr.includes('installation') ||
    (opVal === 'Defaulted' && (name.includes('mandatory') || name.includes('obligated')))
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'mandatory_attachment') || RULE_ARCHETYPES[1];
  }

  // 5. Promotional Defaults & PWP
  if (
    opVal === 'Defaulted' ||
    name.includes('promo') ||
    name.includes('pwp') ||
    name.includes('12x5') ||
    targetStr.includes('promo') ||
    targetStr.includes('pwp')
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'promotional_default') || RULE_ARCHETYPES[2];
  }

  // 6. Customer Eligibility Checks
  if (
    conditionsStr.includes('issoho') ||
    conditionsStr.includes('haspendingorder') ||
    conditionsStr.includes('customerobjectref')
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'customer_eligibility') || RULE_ARCHETYPES[5];
  }

  // 7. Technical Compatibility
  if (
    conditionsStr.includes('hastechnology') ||
    conditionsStr.includes('hasadditionaloption') ||
    conditionsStr.includes('hashighestpriority') ||
    opVal === 'Allowed'
  ) {
    return RULE_ARCHETYPES.find(a => a.id === 'technical_compatibility') || RULE_ARCHETYPES[4];
  }

  return RULE_ARCHETYPES.find(a => a.id === 'technical_compatibility') || RULE_ARCHETYPES[0];
}

/**
 * Detects the product domain / line (DSL, Cable, Fiber, Mobile, Hardware)
 */
export function detectProductDomain(rule) {
  const chars = extractCompatibilityCharacteristics(rule);
  const pkgType = String(chars.package_type || '').toUpperCase();
  const name = String(rule?.name || '').toUpperCase();
  const cond = Array.isArray(rule?.condition) ? rule.condition.join(' ').toUpperCase() : '';

  if (pkgType.includes('FIBER') || pkgType.includes('GPON') || name.includes('GLAS') || name.includes('FIBER') || name.includes('GPON')) {
    return 'Fiber / GPON';
  }
  if (pkgType.includes('CABLE') || name.includes('CABLE') || name.includes('KABEL')) {
    return 'Cable';
  }
  if (pkgType.includes('DSL') || name.includes('DSL')) {
    return 'DSL';
  }
  if (pkgType.includes('MOBILE') || pkgType.includes('5G') || name.includes('MOBILE')) {
    return 'Mobile';
  }
  if (name.includes('HARDWARE') || name.includes('ROUTER') || cond.includes('FN_HARDWARE')) {
    return 'Hardware';
  }
  return pkgType || 'Universal';
}

/**
 * Preset Rule Templates for Purpose-Driven Rule Authoring ("Create by Purpose")
 */
export const RULE_PURPOSE_TEMPLATES = [
  {
    id: 'downgrade_guarantee',
    title: 'Wechselgarantie (Downgrade/Upgrade Policy)',
    icon: 'shield',
    color: '#2563eb',
    tagline: 'Permit tariff transitions to lower/equivalent contract values after minimum contract duration',
    preset: {
      name: '12 Month Wechselgarantie Tariff Downgrade Policy',
      category: ['implicitCompatibility'],
      ruleType: 'FORALL',
      characteristics: {
        package_type: 'DSL',
        operation_value: 'Allowed',
        operation_type: 'Service-Service',
        priority: 5,
        channels: '*',
        process_contexts: ['ILSBLU', 'MOVBLU']
      },
      condition: [
        'cart.package.tariffInMinimumDuration().eq(true)',
        'customer.tariffIsInDay().gt(365)',
        'cart.package.isTariffChanged().eq(true)'
      ],
      resultGroup: 'Category 12 month package downgrade guarantee DSL',
      targetConditionType: 'catalog.getTariffsWithContractValue',
      targetParams: { Operation: '<=' }
    }
  },
  {
    id: 'mandatory_attachment',
    title: 'Mandatory Attachment / Fee Surcharge',
    icon: 'bag',
    color: '#dc2626',
    tagline: 'Auto-inject non-removable required hardware or shipping/setup fees when trigger product is chosen',
    preset: {
      name: 'Auto-Add Shipping Costs (Versandkosten) for New Hardware',
      category: ['implicitCompatibility'],
      ruleType: 'FORSOME',
      characteristics: {
        package_type: 'DSL',
        operation_value: 'Defaulted-Obligated',
        operation_type: 'Service-Product',
        priority: 6,
        channels: '*',
        process_contexts: ['ACQ', 'MIGCOC']
      },
      condition: [
        'cart.containsProductInCategory("FN169") || cart.containsProductInCategory("FN178")'
      ],
      resultGroup: 'Product Versandkosten Obligated Target',
      targetConditionType: 'Product',
      targetParams: { SKU: 'PO_Versandkosten' }
    }
  },
  {
    id: 'promotional_default',
    title: 'Promotional Hardware / PWP Discount',
    icon: 'tag',
    color: '#059669',
    tagline: 'Pre-select subsidized hardware or promotional discounts into cart with opt-out ability',
    preset: {
      name: 'Fiber PWP Promotional Hardware Default Offer',
      category: ['implicitCompatibility'],
      ruleType: 'FORALL',
      characteristics: {
        package_type: 'Fiber',
        operation_value: 'Defaulted',
        operation_type: 'Service-Product',
        priority: 2,
        channels: '*',
        process_contexts: ['ACQ', 'ILSBLU', 'MIGCOC']
      },
      condition: [
        'cart.package.hasProcessContext("ACQ") || cart.package.hasProcessContext("ILSBLU")',
        'cart.package.containsProductInProductFamily("fn_hardware")'
      ],
      resultGroup: 'Product GS_Glas_PWP Promotional Target',
      targetConditionType: 'Product',
      targetParams: { SKU: 'GS_Glas_PWP_IP532_12x5E[br]' }
    }
  },
  {
    id: 'retention_lock',
    title: 'Existing Hardware Retention Lock',
    icon: 'lock',
    color: '#d97706',
    tagline: 'Lock existing compatible customer equipment so it cannot be removed during plan changes',
    preset: {
      name: 'Lock Compatible Installed Base Router Against Removal',
      category: ['implicitCompatibility'],
      ruleType: 'FORSOME',
      characteristics: {
        package_type: 'DSL',
        operation_value: 'Removal Not Allowed',
        operation_type: 'Service-Service',
        priority: 5,
        channels: '*',
        process_contexts: ['ILSBLU', 'MOV121', 'MOVBLU']
      },
      condition: [
        'installBase.containsProductInCategory("FN218")',
        'cart.package.isTariffChanged().eq(true)'
      ],
      resultGroup: 'Hardware Removal Lock Target',
      targetConditionType: 'catalog.getProductsInCategory',
      targetParams: { categoryID: 'FN_HARDWARE' }
    }
  },
  {
    id: 'custom_rule',
    title: 'Custom / Advanced Rule',
    icon: 'edit',
    color: '#475569',
    tagline: 'Blank TMF620 authoring form for specialized commercial or technical requirements',
    preset: null
  }
];

export const FACT_DOMAINS = [
  {
    domain: 'Cart & Package',
    icon: 'bag',
    facts: [
      { id: 'cart.package.tariffInMinimumDuration().eq(boolean)', label: 'Tariff is in minimum contract duration', params: [{ name: 'isMinimumDuration', type: 'boolean', default: true }] },
      { id: 'cart.package.isTariffChanged().eq(boolean)', label: 'Tariff has changed', params: [{ name: 'isChanged', type: 'boolean', default: true }] },
      { id: 'cart.package.hasProductWithVersion(string, string)', label: 'Package has product version with operator', params: [{ name: 'sku', type: 'string', placeholder: 'e.g. R025.5000000073-24' }, { name: 'operator', type: 'string', options: ['<', '<=', '==', '>=', '>'] }] },
      { id: 'cart.package.hasTariffWithContractValue(string)', label: 'Package has tariff with contract value', params: [{ name: 'contractValue', type: 'string' }] },
      { id: 'cart.package.hasTariffWithVersion(string)', label: 'Package has tariff with version', params: [{ name: 'version', type: 'string' }] },
      { id: 'cart.package.hasProcessContext(string)', label: 'Package has process context', params: [{ name: 'context', type: 'string', placeholder: 'e.g. ILSBLU' }] },
      { id: 'cart.package.productInMinimumDuration(string)', label: 'Package product in minimum duration', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.package.containsProductInProductFamily(string)', label: 'Package contains product in family', params: [{ name: 'familyName', type: 'string', placeholder: 'e.g. fn_hardware' }] },
      { id: 'cart.containsProduct(string)', label: 'Cart contains product (by ID/SKU)', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.containsProduct(integer)', label: 'Cart contains product (numeric ID)', params: [{ name: 'numericId', type: 'integer' }] },
      { id: 'cart.containsProductInCategory(string)', label: 'Cart contains product in Category ID', params: [{ name: 'categoryID', type: 'string', placeholder: 'e.g. FN0548' }] },
      { id: 'cart.containsProductInCategoryName(string)', label: 'Cart contains product in Category Name', params: [{ name: 'categoryName', type: 'string' }] },
      { id: 'cart.containsNBAIndicator(string)', label: 'Cart contains NBA Indicator', params: [{ name: 'indicator', type: 'string' }] },
      { id: 'cart.packageContainsProduct(string)', label: 'Package contains product', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.packageContainsProductInCategory(string)', label: 'Package contains product in Category ID', params: [{ name: 'categoryID', type: 'string', placeholder: 'e.g. FN218' }] },
      { id: 'cart.packageContainsNewProduct(string)', label: 'Package contains newly added product', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.packageContainsNewProductInCategoryId(string)', label: 'Package contains newly added product in Category ID', params: [{ name: 'categoryID', type: 'string', placeholder: 'e.g. FN169' }] },
      { id: 'cart.packageContainsInstalledBaseProduct(string)', label: 'Package contains installed base product', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.packageContainsInstalledBaseCategory(string)', label: 'Package contains installed base Category ID', params: [{ name: 'categoryID', type: 'string' }] },
      { id: 'cart.packageContainedInstalledBaseProduct(string)', label: 'Package previously contained installed base product', params: [{ name: 'productId', type: 'string' }] },
      { id: 'cart.packageContainedInstalledBaseCategory(string)', label: 'Package previously contained installed base Category ID', params: [{ name: 'categoryID', type: 'string' }] },
      { id: 'cart.packageCreationTypeId(string)', label: 'Package creation type matches ID', params: [{ name: 'creationTypeId', type: 'string' }] }
    ]
  },
  {
    domain: 'Customer & Contract',
    icon: 'user',
    facts: [
      { id: 'customer.tariffIsInDay().gt(integer)', label: 'Customer days since tariff start >', params: [{ name: 'days', type: 'integer', default: 365 }] },
      { id: 'customer.isSoho().eq(boolean)', label: 'Customer is SOHO (Small Office / Home Office)', params: [{ name: 'isSoho', type: 'boolean', default: true }] },
      { id: 'customer.hasPendingOrderOfType(string, string)', label: 'Customer has pending order of type', params: [{ name: 'orderType', type: 'string' }, { name: 'status', type: 'string' }] },
      { id: 'CustomerObjectRef', label: 'Customer object reference check', params: [{ name: 'ref', type: 'string' }] }
    ]
  },
  {
    domain: 'Installed Base',
    icon: 'database',
    facts: [
      { id: 'installBase.containsProductInCategory(string)', label: 'Installed base contains product in Category ID', params: [{ name: 'categoryID', type: 'string', placeholder: 'e.g. FN218' }] },
      { id: 'installBase.containsProduct(string)', label: 'Installed base contains product (SKU/ID)', params: [{ name: 'productId', type: 'string' }] }
    ]
  },
  {
    domain: 'Availability & Technology',
    icon: 'activity',
    facts: [
      { id: 'availability.HasAdditionalOption(string, string, integer, string, integer)', label: 'Availability has additional option', params: [{ name: 'opt1', type: 'string' }, { name: 'opt2', type: 'string' }, { name: 'val1', type: 'integer' }, { name: 'opt3', type: 'string' }, { name: 'val2', type: 'integer' }] },
      { id: 'availability.HasTechnology(integer, integer, string, string[, string])', label: 'Availability matches technology speeds', params: [{ name: 'downSpeed', type: 'integer' }, { name: 'upSpeed', type: 'integer' }, { name: 'tech', type: 'string' }, { name: 'profile', type: 'string' }] },
      { id: 'availability.hasHighestPriority(integer, string, string, string[, string])', label: 'Availability has highest priority technology', params: [{ name: 'prio', type: 'integer' }, { name: 'tech1', type: 'string' }, { name: 'tech2', type: 'string' }, { name: 'context', type: 'string' }] }
    ]
  },
  {
    domain: 'Sales Agent & Channel',
    icon: 'shield',
    facts: [
      { id: 'agent.hasCombinationOfChannelAndSubchannel(string)', label: 'Agent has channel & subchannel combination', params: [{ name: 'channelCombo', type: 'string' }] },
      { id: 'agent.hasOseChannel(string)', label: 'Agent has OSE Channel', params: [{ name: 'channel', type: 'string' }] },
      { id: 'agent.hasPermission(string)', label: 'Agent has specific permission', params: [{ name: 'permission', type: 'string' }] }
    ]
  },
  {
    domain: 'Product & Order Matchers',
    icon: 'package',
    facts: [
      { id: 'Product.hasSKU(string)', label: 'Product has SKU code', params: [{ name: 'sku', type: 'string' }] },
      { id: 'MatchOrderLineWithAttributes', label: 'Match order line with specific attributes', params: [{ name: 'attributePattern', type: 'string' }] },
      { id: 'MustIncludeProductsWithNames', label: 'Order must include product names', params: [{ name: 'names', type: 'string' }] },
      { id: 'catch_all', label: 'Catch-all wildcard condition', params: [] }
    ]
  }
];

export const ALL_FACTS = FACT_DOMAINS.flatMap(d => d.facts.map(f => ({ ...f, domain: d.domain })));

/**
 * Serializes compatibility characteristics back into the TMF ruleCharacteristic array
 */
export function serializeCompatibilityCharacteristics(structured) {
  return [
    { name: 'package_type', value: String(structured.package_type || 'DSL') },
    { name: 'description', value: String(structured.description || '') },
    ...(structured.business_intent ? [{ name: 'business_intent', value: String(structured.business_intent) }] : []),
    { name: 'source_type', value: String(structured.source_type || 'Service') },
    { name: 'priority', value: String(structured.priority !== undefined ? structured.priority : 5) },
    { name: 'operation_type', value: String(structured.operation_type || 'Service-Service') },
    { name: 'effective_date', value: String(structured.effective_date || '') },
    { name: 'operation.value', value: String(structured.operation_value || 'Allowed') },
    { name: 'operation.askconfirmationfirst', value: String(Boolean(structured.ask_confirmation_first)) },
    { name: 'operation.overrideinitialselectable', value: String(Boolean(structured.override_initial_selectable)) },
    { name: 'channels', value: String(structured.channels || '*') },
    { name: 'process_contexts', value: Array.isArray(structured.process_contexts) ? structured.process_contexts.join(',') : String(structured.process_contexts || '') }
  ];
}

/**
 * Generates an English, natural-language explanation of a BasicRule
 */
export function generateNaturalLanguageSummary(rule) {
  if (!rule) return '';
  const chars = extractCompatibilityCharacteristics(rule);
  const targets = extractResultTargets(rule);
  const archetype = classifyRule(rule);

  const contextPart = chars.process_contexts.length > 0
    ? `In [${chars.process_contexts.join(', ')}] across channels [${chars.channels}]`
    : `Across channels [${chars.channels}]`;

  const actionVerb = (chars.operation_value || 'Allowed').toUpperCase();

  const targetDescriptions = targets.conditions.map(c => {
    if (c.type === 'catalog.getProductsInCategory' || c.type === 'Category') {
      const cid = c.params?.categoryID || c.params?.categoryId || c.params?.name;
      return `Category ${cid || '(category)'}`;
    }
    if (c.type === 'catalog.getTariffsWithContractValue') {
      return `tariffs with contract value ${c.params?.Operation || '<='}`;
    }
    if (c.type === 'Product') {
      return `Product SKU [${c.params?.SKU || c.params?.sku || '(sku)'}]`;
    }
    return `${c.type} (${JSON.stringify(c.params || {})})`;
  });

  const targetPart = targetDescriptions.length > 0
    ? targetDescriptions.join(' AND ')
    : targets.groupName || 'target entities';

  const conditionCount = Array.isArray(rule.condition) ? rule.condition.length : 0;
  const conditionSummary = conditionCount > 0
    ? `satisfying ${rule.ruleType || 'FORALL'} of ${conditionCount} condition(s)`
    : 'unconditionally';

  return `[${archetype.shortLabel}] ${contextPart}, when ${conditionSummary}, ${actionVerb} ${targetPart}.`;
}
