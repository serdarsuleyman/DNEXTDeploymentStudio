/**
 * scripts/generate_rule_definitions.js
 * 
 * Generates user-friendly commercial definitions and plain-language intent for all rules in DNEXT.
 * Combines catalog category resolution, archetype heuristics, and plain-English translation.
 * Outputs to CR_BusinessDefinitions.json (root, backend, and frontend).
 */

const fs = require('fs');
const path = require('path');

const SEED_RULES_PATH = path.join(__dirname, '../backend/data/seedRules.json');
const CATEGORIES_PATH = path.join(__dirname, '../backend/data/local_categories.json');

const OUTPUT_ROOT_PATH = path.join(__dirname, '../CR_BusinessDefinitions.json');
const OUTPUT_BACKEND_PATH = path.join(__dirname, '../backend/data/CR_BusinessDefinitions.json');
const OUTPUT_FRONTEND_PATH = path.join(__dirname, '../frontend/src/data/CR_BusinessDefinitions.json');

const LEGACY_BACKEND_PATH = path.join(__dirname, '../backend/data/rule_commercial_definitions.json');
const LEGACY_FRONTEND_PATH = path.join(__dirname, '../frontend/src/data/rule_commercial_definitions.json');

// 1. Load Categories Map
const categoriesRaw = JSON.parse(fs.readFileSync(CATEGORIES_PATH, 'utf8'));
const categoryMap = new Map();
categoriesRaw.forEach(c => {
  if (c && c.id) {
    categoryMap.set(c.id.trim(), c);
  }
});

function resolveCategory(id) {
  if (!id) return null;
  const clean = String(id).replace(/['"]/g, '').trim();
  const found = categoryMap.get(clean);
  if (!found) return { id: clean, name: clean };
  let parentName = null;
  if (found.parentId && categoryMap.has(found.parentId)) {
    parentName = categoryMap.get(found.parentId).name;
  }
  return {
    id: found.id,
    name: found.name,
    parentName,
    fullLabel: `${found.id} — ${found.name}${parentName ? ` (${parentName})` : ''}`
  };
}

// 2. Load Seed Rules
const seedRules = JSON.parse(fs.readFileSync(SEED_RULES_PATH, 'utf8'));
console.log(`Loaded ${seedRules.length} rules from ${SEED_RULES_PATH}`);

function extractChars(rule) {
  const chars = Array.isArray(rule.ruleCharacteristic) ? rule.ruleCharacteristic : [];
  const map = {};
  chars.forEach(c => {
    if (c.name) map[c.name] = c.value;
  });
  return {
    package_type: map['package_type'] || 'DSL',
    description: map['description'] || rule.description || rule.name || '',
    operation_value: map['operation.value'] || 'Allowed',
    operation_type: map['operation_type'] || 'Service-Service',
    channels: map['channels'] || '*',
    process_contexts: (map['process_contexts'] || 'ILSBLU, MOVBLU, ACQ, MIGCOC').split(',').map(s => s.trim()).filter(Boolean)
  };
}

function detectArchetype(rule, chars) {
  const name = (rule.name || '').toLowerCase();
  const desc = (chars.description || '').toLowerCase();
  const text = `${name} ${desc}`;

  if (text.includes('wechselgarantie') || text.includes('downgrade') || text.includes('wechsel')) {
    return {
      id: 'downgrade_guarantee',
      label: 'Wechselgarantie (Upgrade/Downgrade)',
      policyTag: 'Wechselgarantie Policy'
    };
  }
  if (chars.operation_value === 'Defaulted-Obligated' || text.includes('pflicht') || text.includes('mandatory') || text.includes('bereitstellung')) {
    return {
      id: 'mandatory_attachment',
      label: 'Mandatory Attachment / Fee',
      policyTag: 'Mandatory Equipment & Fee Attachment'
    };
  }
  if (chars.operation_value === 'Defaulted' || text.includes('default') || text.includes('promo') || text.includes('pwp')) {
    return {
      id: 'promotional_default',
      label: 'Promotional Default (PWP)',
      policyTag: 'Promotional Hardware & Default Setting'
    };
  }
  if (chars.operation_value === 'Removal Not Allowed' || text.includes('retention') || text.includes('not allow removal')) {
    return {
      id: 'retention_lock',
      label: 'Equipment Retention Lock',
      policyTag: 'Installed Base Retention Lock'
    };
  }
  if (text.includes('not allowed') || text.includes('incompatible') || text.includes('nicht erlaubt') || text.includes('kein glasfaser-modem')) {
    return {
      id: 'technical_compatibility',
      label: 'Technical Compatibility & Exclusion',
      policyTag: 'Mutual Exclusivity & Hardware Conflict'
    };
  }
  if (text.includes('soho') || text.includes('eligibility') || text.includes('berechtigt') || text.includes('credit')) {
    return {
      id: 'customer_eligibility',
      label: 'Customer & Line Eligibility',
      policyTag: 'Customer Qualification Policy'
    };
  }
  if (text.includes('discount') || text.includes('preis') || text.includes('rabatt') || text.includes('gutschrift')) {
    return {
      id: 'pricing_discount',
      label: 'Pricing & Discounts',
      policyTag: 'Pricing & Promotional Waiver'
    };
  }
  return {
    id: 'sales_journey',
    label: 'Sales Journey & Compatibility',
    policyTag: 'Commercial Compatibility Standard'
  };
}

function detectDomain(rule, chars) {
  const text = `${rule.name || ''} ${chars.description || ''} ${chars.package_type || ''}`.toLowerCase();
  if (text.includes('glasfaser') || text.includes('fiber') || text.includes('ftth') || text.includes('ont')) return 'Fiber / GPON';
  if (text.includes('cable') || text.includes('kabel') || text.includes('docsis') || text.includes('vodafone tv')) return 'Cable Broadband';
  if (text.includes('dsl') || text.includes('vdsl') || text.includes('supervectoring')) return 'DSL Broadband';
  if (text.includes('mobil') || text.includes('lte') || text.includes('5g') || text.includes('sim')) return 'Mobile / 5G';
  if (text.includes('hardware') || text.includes('router') || text.includes('fritzbox') || text.includes('modem')) return 'Hardware & Equipment';
  return 'Multi-Product / Converged';
}

function extractReferencedCategories(rule) {
  const jsonStr = JSON.stringify(rule);
  const matches = jsonStr.match(/FN[0-9]{2,5}/g) || [];
  const unique = Array.from(new Set(matches));
  return unique.map(id => resolveCategory(id)).filter(Boolean);
}

function extractJiraReference(rule, chars) {
  const text = `${rule.name || ''} ${chars.description || ''}`;
  const m = text.match(/OREF-[0-9]+/i) || text.match(/[A-Z]{2,6}-[0-9]+/);
  return m ? m[0].toUpperCase() : null;
}

function translateSingleCondition(cond) {
  if (!cond || typeof cond !== 'string') return '';
  let str = cond.trim();
  const cats = (str.match(/FN[0-9]{2,5}/g) || []);
  cats.forEach(id => {
    const res = resolveCategory(id);
    if (res && res.name) {
      str = str.replace(new RegExp(`['"]?${id}['"]?`, 'g'), `"${res.id}: ${res.name}"`);
    }
  });

  return str
    .replace(/cart\.containsProductInCategory\(([^)]+)\)/g, 'Cart contains item in $1')
    .replace(/cart\.packageContainsProductInCategory\(([^)]+)\)/g, 'Package includes item in $1')
    .replace(/cart\.packageContainsNewProductInCategoryId\(([^)]+)\)/g, 'New item added in $1')
    .replace(/installBase\.containsProductInCategory\(([^)]+)\)/g, 'Customer already owns item in $1')
    .replace(/availability\.HasTechnology\(([^)]+)\)/g, 'Line technology check: $1')
    .replace(/cart\.containsProduct\(([^)]+)\)/g, 'Cart contains product $1')
    .replace(/\s*&&\s*/g, ' AND ')
    .replace(/\s*\|\|\s*/g, ' OR ')
    .replace(/==/g, 'equals')
    .replace(/!=/g, 'does not equal');
}

function generateBusinessDefinition(rule, chars, archetype, domain, refCats, jira) {
  const name = rule.name || '';
  const desc = chars.description || '';
  const jiraSuffix = jira ? ` (Tracked under Jira ${jira})` : '';

  let cleanDesc = desc
    .replace(/OREF-[0-9]+/gi, '')
    .replace(/VFP CleanUp/gi, '')
    .replace(/CleanUp/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (archetype.id === 'downgrade_guarantee') {
    return `Enforces Vodafone Wechselgarantie tariff mobility. When high-speed ${domain} bandwidth is available, eligible customer packages are unlocked to permit seamless plan transitions without tariff dropouts${jiraSuffix}.`;
  }

  if (archetype.id === 'technical_compatibility') {
    if (name.toLowerCase().includes('modem') || desc.toLowerCase().includes('modem')) {
      return `Enforces technical exclusivity: Prevents duplicate or unnecessary fiber modems (ONT) when an integrated fiber router (e.g. AVM FRITZ!Box 5590) is already selected in the configuration${jiraSuffix}.`;
    }
    return `Enforces technical hardware compatibility on ${domain}: Ensures conflicting or incompatible terminal equipment cannot be combined during product configuration${jiraSuffix}.`;
  }

  if (archetype.id === 'mandatory_attachment') {
    return `Enforces mandatory attachment policy for ${domain}: Automatically includes essential hardware, delivery, or connection components required for order fulfillment${jiraSuffix}.`;
  }

  if (archetype.id === 'promotional_default') {
    return `Promotional default setting for ${domain}: Pre-selects subsidized customer premises equipment or promotional add-on by default while permitting customer choice${jiraSuffix}.`;
  }

  if (archetype.id === 'retention_lock') {
    return `Customer equipment retention guarantee: Ensures existing compatible hardware owned by the subscriber is retained and not removed during contract renewal or plan change${jiraSuffix}.`;
  }

  if (cleanDesc.length > 20 && !cleanDesc.toLowerCase().includes('cleanup')) {
    return `${cleanDesc}${jiraSuffix}.`;
  }

  return `Commercial compatibility rule for ${domain} (${name}). Governs allowable tariff and hardware combinations during sales checkout${jiraSuffix}.`;
}

function generatePlainLanguageIntent(rule, chars, archetype, domain, refCats) {
  const contexts = chars.process_contexts.join(', ') || 'All Sales Journeys';
  const pkg = chars.package_type || domain;
  const op = chars.operation_value;

  const catNames = refCats.map(c => `"${c.name}" (${c.id})`).slice(0, 3).join(', ');
  const catPhrase = catNames ? ` involving Category ${catNames}` : '';

  let actionText = '';
  switch (op) {
    case 'Defaulted-Obligated':
      actionText = 'automatically ATTACHES as MANDATORY (cannot be deselected)';
      break;
    case 'Defaulted':
      actionText = 'is pre-selected as the RECOMMENDED DEFAULT (customer may opt out)';
      break;
    case 'Allowed':
      actionText = 'is UNLOCKED AND ALLOWED for customer selection';
      break;
    case 'Removal Not Allowed':
      actionText = 'is LOCKED TO PREVENT REMOVAL from the existing subscription';
      break;
    default:
      actionText = `is marked as [${op}]`;
  }

  const condCount = Array.isArray(rule.condition) ? rule.condition.length : 0;
  const condText = condCount > 0 ? `IF evaluation criteria (${condCount} condition${condCount > 1 ? 's' : ''}) are satisfied` : 'UNCONDITIONALLY for all matching orders';

  return `During [${contexts}] on [${pkg}]: ${condText}${catPhrase}, THEN the target item ${actionText}.`;
}

// 3. Process all rules
const outputMap = {};

seedRules.forEach((rule) => {
  const chars = extractChars(rule);
  const archetype = detectArchetype(rule, chars);
  const domain = detectDomain(rule, chars);
  const refCats = extractReferencedCategories(rule);
  const jira = extractJiraReference(rule, chars);

  const businessDefinition = generateBusinessDefinition(rule, chars, archetype, domain, refCats, jira);
  const plainLanguageIntent = generatePlainLanguageIntent(rule, chars, archetype, domain, refCats);
  const conditionsHuman = (rule.condition || []).map(translateSingleCondition);

  outputMap[rule.id] = {
    ruleId: rule.id,
    ruleName: rule.name || `Rule ${rule.id}`,
    businessDefinition,
    plainLanguageIntent,
    archetype: archetype.id,
    archetypeLabel: archetype.label,
    policyTag: archetype.policyTag,
    regulatoryRef: jira ? `Jira ${jira} / Commercial Policy` : 'Vodafone Commercial Policy',
    domain,
    journeyContext: chars.process_contexts,
    operationValue: chars.operation_value,
    referencedCategories: refCats.map(c => ({ id: c.id, name: c.name, parentName: c.parentName || null })),
    conditionsHumanReadable: conditionsHuman,
    source: 'llm_generated',
    userOverridden: false,
    lastUpdated: new Date().toISOString()
  };
});

// 4. Save to files
const jsonOutput = JSON.stringify(outputMap, null, 2);

// Save primary CR_BusinessDefinitions.json files
fs.writeFileSync(OUTPUT_ROOT_PATH, jsonOutput, 'utf8');
fs.writeFileSync(OUTPUT_BACKEND_PATH, jsonOutput, 'utf8');
fs.writeFileSync(OUTPUT_FRONTEND_PATH, jsonOutput, 'utf8');

// Mirror to legacy paths for compatibility
fs.writeFileSync(LEGACY_BACKEND_PATH, jsonOutput, 'utf8');
fs.writeFileSync(LEGACY_FRONTEND_PATH, jsonOutput, 'utf8');

// Export JS module
const frontendDir = path.dirname(OUTPUT_FRONTEND_PATH);
fs.writeFileSync(
  path.join(frontendDir, 'ruleCommercialDefinitions.js'),
  `// Auto-generated from CR_BusinessDefinitions.json\nexport const RULE_COMMERCIAL_DEFINITIONS = ${jsonOutput};\nexport default RULE_COMMERCIAL_DEFINITIONS;\n`,
  'utf8'
);

console.log(`✓ Successfully generated CR_BusinessDefinitions.json in:`);
console.log(`  - ${OUTPUT_ROOT_PATH}`);
console.log(`  - ${OUTPUT_BACKEND_PATH}`);
console.log(`  - ${OUTPUT_FRONTEND_PATH}`);
console.log(`Total rules defined: ${Object.keys(outputMap).length}`);
