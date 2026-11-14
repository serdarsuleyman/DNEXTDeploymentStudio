// categoryResolver.js
// Human-readable resolution for TMForum Rule Categories and Catalog Category IDs (FNxxx)
// Designed for Vodafone Germany DNEXT Cloud Deployment Studio

import rawCatalogCategories from '../data/catalogCategories.js';

/**
 * Rich definitions for TMForum / DNEXT Rule Categories
 */
export const RULE_CATEGORY_DEFINITIONS = {
  implicitCompatibility: {
    id: 'implicitCompatibility',
    shortLabel: 'Product Compatibility',
    fullTitle: 'Product Compatibility & Dependency Rules',
    tagline: 'Technical & commercial dependencies between tariffs, hardware & options',
    description: 'Governs which products, accessories, and options can, must, or cannot be configured together in the shopping cart. Dictates whether items are Allowed, Defaulted, or Mandatory (Defaulted-Obligated).',
    evaluationPhase: 'Evaluated in cart during item selection & bundle configuration.',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    badgeColor: 'var(--ds-brand)',
    icon: 'cpu'
  },
  implicitEligibility: {
    id: 'implicitEligibility',
    shortLabel: 'Customer Eligibility',
    fullTitle: 'Customer & Technical Line Eligibility',
    tagline: 'Restricts offers by customer segment, credit standing or line qualification',
    description: 'Enforces customer-level qualification criteria including consumer vs SOHO status, credit score bands, open order conflicts, and physical line technology availability at the installation address.',
    evaluationPhase: 'Evaluated during customer identification and lead qualification.',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    badgeColor: 'var(--ds-spec)',
    icon: 'user'
  },
  pricingLogicAlgorithm: {
    id: 'pricingLogicAlgorithm',
    shortLabel: 'Pricing & Discounts',
    fullTitle: 'Algorithmic Pricing & Discount Calculations',
    tagline: 'Calculates dynamic pricing, promotional waivers and bundled discounts',
    description: 'Computes contextual pricing adjustments such as waiver of activation or shipping fees, bundled hardware subsidies (PWP), and recurring multi-product discounts (e.g. GigaKombi).',
    evaluationPhase: 'Evaluated during cart total calculation and checkout quote generation.',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    badgeColor: 'var(--ds-warn)',
    icon: 'tag'
  },
  salesRules: {
    id: 'salesRules',
    shortLabel: 'Sales Policies',
    fullTitle: 'Sales Channel & Journey Policy Rules',
    tagline: 'Controls agent permissions, channel routing and sales journey steps',
    description: 'Regulates sales journey progression, differentiating between telesales, retail stores, and online self-service (OSE). Governs override permissions and mandatory verification gates.',
    evaluationPhase: 'Evaluated across journey stage transitions and channel authentication.',
    color: '#475569',
    bg: '#f8fafc',
    border: '#e2e8f0',
    badgeColor: 'var(--ds-text)',
    icon: 'activity'
  }
};

/**
 * Fast lookup map for Catalog Categories (FNxxx)
 */
const CATEGORY_MAP = new Map();
if (Array.isArray(rawCatalogCategories)) {
  rawCatalogCategories.forEach(cat => {
    if (cat?.id) {
      CATEGORY_MAP.set(cat.id.trim(), cat);
    }
  });
}

/**
 * Resolves a Catalog Category ID (e.g. "FN12", "FN0548") into its commercial metadata
 */
export function lookupCatalogCategory(categoryId) {
  if (!categoryId) return null;
  const cleanId = String(categoryId).trim().replace(/['"]/g, '');
  const entry = CATEGORY_MAP.get(cleanId);
  if (!entry) return null;

  let parentName = null;
  if (entry.parentId && CATEGORY_MAP.has(entry.parentId)) {
    parentName = CATEGORY_MAP.get(entry.parentId).name;
  }

  return {
    id: entry.id,
    name: entry.name,
    parentId: entry.parentId || null,
    parentName,
    fullLabel: `${entry.id} — ${entry.name}${parentName ? ` (${parentName})` : ''}`
  };
}

/**
 * Returns formatted label e.g. "FN12 (Anschluss-Hardware)" or original string
 */
export function formatCategoryLabel(categoryId) {
  const cat = lookupCatalogCategory(categoryId);
  return cat ? `${cat.id} (${cat.name})` : categoryId;
}

/**
 * Returns a sorted list of all catalog categories for dropdowns/autocomplete
 */
export function getAllCatalogCategories() {
  return Array.from(CATEGORY_MAP.values()).map(c => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    label: `${c.id} — ${c.name}`
  })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Scans any condition expression or text for FNxxx category codes and returns resolved objects
 */
export function extractCategoriesFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(/FN[0-9]{2,5}/g) || [];
  const unique = Array.from(new Set(matches));
  return unique.map(id => lookupCatalogCategory(id) || { id, name: id, fullLabel: id });
}

/**
 * Resolves a TMForum Rule Category definition
 */
export function getRuleCategoryMeta(categoryKey) {
  const key = Array.isArray(categoryKey) ? categoryKey[0] : categoryKey;
  return RULE_CATEGORY_DEFINITIONS[key] || {
    id: key || 'unknown',
    shortLabel: key || 'General',
    fullTitle: key || 'General Rule',
    tagline: 'Standard business rule definition',
    description: 'Enforces catalog and business logic according to DNEXT specification.',
    evaluationPhase: 'Evaluated by the DNEXT Rule Engine.',
    color: '#6b7280',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    badgeColor: 'var(--ds-text)',
    icon: 'file'
  };
}

/**
 * Translates a single condition expression into plain language
 */
export function translateConditionToHuman(cond) {
  if (!cond || typeof cond !== 'string') return '';
  let str = cond.trim();

  // Detect and resolve FNxxx category IDs in the expression
  const cats = extractCategoriesFromText(str);
  cats.forEach(c => {
    if (c.name && c.name !== c.id) {
      str = str.replace(new RegExp(`['"]?${c.id}['"]?`, 'g'), `"${c.id}: ${c.name}"`);
    }
  });

  // Common fact translations
  str = str
    .replace(/cart\.containsProductInCategory\(([^)]+)\)/g, 'Cart contains product from Category $1')
    .replace(/cart\.packageContainsProductInCategory\(([^)]+)\)/g, 'Selected package has item from Category $1')
    .replace(/cart\.packageContainsNewProductInCategoryId\(([^)]+)\)/g, 'New item added in Category $1')
    .replace(/installBase\.containsProductInCategory\(([^)]+)\)/g, 'Customer already owns product from Category $1')
    .replace(/context\.journey\s*==\s*'([^']+)'/g, 'Journey is $1')
    .replace(/context\.technology\s*==\s*'([^']+)'/g, 'Access technology is $1')
    .replace(/customer\.segment\s*==\s*'([^']+)'/g, 'Customer segment is $1')
    .replace(/order\.type\s*==\s*'([^']+)'/g, 'Order type is $1')
    .replace(/\s*&&\s*/g, ' AND ')
    .replace(/\s*\|\|\s*/g, ' OR ')
    .replace(/==/g, 'equals')
    .replace(/!=/g, 'is not');

  return str;
}

/**
 * Generates a comprehensive, human-readable natural language summary of a rule
 */
export function generateRuleHumanSummary(formData, charsData, targetsData) {
  const parts = [];

  // 1. Context / Scope
  const contexts = charsData?.process_contexts?.length ? charsData.process_contexts.join(', ') : 'All Journeys';
  const pkgType = charsData?.package_type || 'General';
  const channels = charsData?.channels && charsData.channels !== '*' ? charsData.channels : 'All Channels';

  parts.push(`During [${contexts}] for [${pkgType}] offerings on [${channels}]:`);

  // 2. Conditions
  const conditions = formData?.condition || [];
  if (conditions.length === 0) {
    parts.push('Unconditionally (applies to all eligible orders)');
  } else {
    const quantifier = formData?.ruleType === 'FORSOME' ? 'at least ONE of the following is true' : 'ALL of the following are true';
    parts.push(`IF ${quantifier}:`);
    conditions.forEach((c, idx) => {
      const human = translateConditionToHuman(c);
      parts.push(`  • ${human}`);
    });
  }

  // 3. Actions / Outcome
  const actionVal = charsData?.operation_value || 'Allowed';
  const targetType = targetsData?.selectionType || 'Category';
  let targetDesc = '';

  const catId = targetsData?.categoryId || targetsData?.conditions?.find(c =>
    c.type === 'Category' ||
    c.type === 'catalog.getProductsInCategory' ||
    c.params?.categoryID ||
    c.params?.categoryId
  )?.params?.categoryID;

  if (targetType === 'Product') {
    targetDesc = targetsData?.productName || targetsData?.productSku ? `Product "${targetsData.productName || targetsData.productSku}"` : 'the specified Product';
  } else {
    const catMeta = lookupCatalogCategory(catId);
    targetDesc = catMeta ? `Category "${catMeta.name}" (${catMeta.id})` : (catId ? `Category "${catId}"` : `Category "${targetsData?.groupName || 'Target Selection'}"`);
  }

  let outcomeVerb = '';
  switch (actionVal) {
    case 'Defaulted-Obligated':
      outcomeVerb = 'automatically ATTACHES as MANDATORY (cannot be removed)';
      break;
    case 'Defaulted':
      outcomeVerb = 'pre-selects by DEFAULT (customer may opt out)';
      break;
    case 'Allowed':
      outcomeVerb = 'is PERMITTED for selection';
      break;
    case 'Removal Not Allowed':
      outcomeVerb = 'CANNOT BE REMOVED from the existing customer subscription';
      break;
    default:
      outcomeVerb = `is marked as [${actionVal}]`;
  }

  parts.push(`THEN ${targetDesc} ${outcomeVerb}.`);

  return parts.join('\n');
}
