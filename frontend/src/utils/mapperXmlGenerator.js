// mapperXmlGenerator.js
// Pure reverse-transformation from DNEXT BasicRule JSON (category: mapperRules)
// back into the original FN_Mapper XML format (<Components><Component><SimpleProduct><Attribute>...).

const MAPPER_TYPE_TO_OGW_NAME = {
  sales_package: 'sales package',
  internet: 'internet',
  voice: 'voice',
  hardware: 'hardware',
  accesses: 'accesses',
  safetyPackage: 'safetyPackage',
  SecureNet: 'SecureNet',
  SuperWlan: 'SuperWlan',
  TV: 'TV',
  directoryEntry: 'directoryEntry',
  winback: 'winback'
};

const FACT_PARAM_NAMES = {
  'cart.containsProductInCategoryId': ['categoryID'],
  'order.containsProductInCategoryId': ['categoryID'],
  'order.containsInstallBaseProductInCategoryId': ['categoryID'],
  'order.packageContainedInstalledBaseProductInCategoryId': ['categoryID'],
  'order.containsProduct': ['SKU'],
  'order.packageContainedInstalledBaseProduct': ['SKU'],
  'order.packageContainedInstalledBaseProductInFamily': ['productFamily']
};

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getCharMap(rule) {
  const map = {};
  (Array.isArray(rule?.ruleCharacteristic) ? rule.ruleCharacteristic : []).forEach(c => {
    if (c && c.name) map[c.name] = c.value !== undefined && c.value !== null ? String(c.value) : '';
  });
  return map;
}

/**
 * Splits a boolean expression string on a top-level binary operator ('&&' or '||'),
 * respecting parentheses and quoted strings.
 */
function splitTopLevel(expr, op) {
  const parts = [];
  let depth = 0;
  let inQuote = null;
  let start = 0;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (inQuote) {
      if (ch === inQuote && expr[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth = Math.max(0, depth - 1);
    else if (depth === 0 && expr.startsWith(op, i)) {
      parts.push(expr.slice(start, i).trim());
      i += op.length - 1;
      start = i + 1;
    }
  }
  parts.push(expr.slice(start).trim());
  return parts.filter(Boolean);
}

function stripOuterParens(expr) {
  let s = expr.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let inQuote = null;
    let matchesOuter = true;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQuote) {
        if (ch === inQuote && s[i - 1] !== '\\') inQuote = null;
        continue;
      }
      if (ch === '"' || ch === "'") { inQuote = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i < s.length - 1) {
          matchesOuter = false;
          break;
        }
      }
    }
    if (matchesOuter) s = s.slice(1, -1).trim();
    else break;
  }
  return s;
}

function parseCallArgs(argsStr) {
  if (!argsStr.trim()) return [];
  const args = [];
  let inQuote = null;
  let start = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if (inQuote) {
      if (ch === inQuote && argsStr[i - 1] !== '\\') inQuote = null;
      continue;
    }
    if (ch === '"' || ch === "'") { inQuote = ch; continue; }
    if (ch === ',') {
      args.push(argsStr.slice(start, i).trim());
      start = i + 1;
    }
  }
  args.push(argsStr.slice(start).trim());
  return args.map(a => a.replace(/^["']|["']$/g, ''));
}

function renderConditionNode(expr, ruleId, indent, groupCounter) {
  const pad = ' '.repeat(indent);
  const s = stripOuterParens(expr);

  // Check top-level OR first, then AND
  const orParts = splitTopLevel(s, '||');
  if (orParts.length > 1) {
    return renderGroupXml('any', orParts, ruleId, indent, groupCounter);
  }

  const andParts = splitTopLevel(s, '&&');
  if (andParts.length > 1) {
    return renderGroupXml('all', andParts, ruleId, indent, groupCounter);
  }

  // Atomic predicate: optional leading '!' and optional '== false' / '== true'
  let negated = false;
  let inner = s;
  if (inner.startsWith('!')) {
    negated = true;
    inner = stripOuterParens(inner.slice(1));
  }
  if (/==\s*false$/i.test(inner)) {
    negated = !negated;
    inner = inner.replace(/==\s*false$/i, '').trim();
  } else if (/==\s*true$/i.test(inner)) {
    inner = inner.replace(/==\s*true$/i, '').trim();
  }

  const callMatch = inner.match(/^([a-zA-Z0-9_.]+)\((.*)\)$/);
  const factType = callMatch ? callMatch[1] : inner;
  const args = callMatch ? parseCallArgs(callMatch[2]) : [];
  const paramNames = FACT_PARAM_NAMES[factType] || [];

  const lines = [];
  lines.push(`${pad}<SourceCondition>`);
  lines.push(`${pad}    <Type>${escapeXml(factType)}</Type>`);
  if (args.length > 0) {
    lines.push(`${pad}    <Params>`);
    args.forEach((argVal, idx) => {
      const pName = paramNames[idx] || `param${idx + 1}`;
      lines.push(`${pad}        <Param name="${escapeXml(pName)}">${escapeXml(argVal)}</Param>`);
    });
    lines.push(`${pad}    </Params>`);
  }
  lines.push(`${pad}    <Operator>${negated ? 'is not' : 'is'}</Operator>`);
  lines.push(`${pad}    <ConditionValue>true</ConditionValue>`);
  lines.push(`${pad}</SourceCondition>`);
  return lines.join('\n');
}

function renderGroupXml(aggregator, childrenExprs, ruleId, indent, groupCounter) {
  const pad = ' '.repeat(indent);
  const idx = ++groupCounter.count;
  const condName = `${ruleId || 'MAPPER'}_Condition_${idx}`;
  const lines = [];
  lines.push(`${pad}<SourceConditions>`);
  lines.push(`${pad}    <Aggregator>${aggregator}</Aggregator>`);
  lines.push(`${pad}    <ConditionValue>true</ConditionValue>`);
  lines.push(`${pad}    <ConditionName>${escapeXml(condName)}</ConditionName>`);
  childrenExprs.forEach(child => {
    const cTrim = stripOuterParens(child);
    const isNestedGroup = splitTopLevel(cTrim, '||').length > 1 || splitTopLevel(cTrim, '&&').length > 1;
    if (isNestedGroup) {
      lines.push(`${pad}    <SourceCondition>`);
      lines.push(renderConditionNode(cTrim, ruleId, indent + 8, groupCounter));
      lines.push(`${pad}    </SourceCondition>`);
    } else {
      lines.push(renderConditionNode(cTrim, ruleId, indent + 4, groupCounter));
    }
  });
  lines.push(`${pad}</SourceConditions>`);
  return lines.join('\n');
}

function buildSourceConditionsXml(rule, indent) {
  const conds = Array.isArray(rule?.condition)
    ? rule.condition.map(c => String(c || '').trim()).filter(Boolean)
    : [];

  if (conds.length === 0 || (conds.length === 1 && conds[0].toLowerCase() === 'true')) {
    return null;
  }

  const rootAgg = rule?.ruleType === 'FORSOME' ? 'any' : 'all';
  const groupCounter = { count: 0 };

  if (conds.length === 1) {
    const single = stripOuterParens(conds[0]);
    const orParts = splitTopLevel(single, '||');
    if (orParts.length > 1) {
      return renderGroupXml('any', orParts, rule.id, indent, groupCounter);
    }
    const andParts = splitTopLevel(single, '&&');
    if (andParts.length > 1) {
      return renderGroupXml('all', andParts, rule.id, indent, groupCounter);
    }
    return renderGroupXml(rootAgg, [single], rule.id, indent, groupCounter);
  }

  return renderGroupXml(rootAgg, conds, rule.id, indent, groupCounter);
}

/**
 * Generates original FN_Mapper XML strictly from a DNEXT BasicRule JSON object.
 * @param {Object} rule - DNEXT BasicRule JSON
 * @param {Object} options - { skuScope: 'first' | 'all', maxSkus: number }
 * @returns {string} Formatted XML string
 */
export function generateOriginalMapperXml(rule, options = {}) {
  if (!rule) return '';
  const { skuScope = 'first', maxSkus = 250 } = options;
  const charMap = getCharMap(rule);

  const mapperType = charMap.mapper_type || 'sales_package';
  const sourceComponentId = charMap.source_component_id || '6';
  const ogwComponentName = MAPPER_TYPE_TO_OGW_NAME[mapperType] || mapperType;
  const systemName = charMap.system_name || 'FN';

  const entities = Array.isArray(rule?.managedAssetGroup?.entity) ? rule.managedAssetGroup.entity : [];
  const effectiveEntities = entities.length === 0
    ? [{ name: 'UNASSIGNED_SKU', blockId: '1' }]
    : (skuScope === 'all' ? entities.slice(0, maxSkus) : [entities[0]]);

  const processContexts = (charMap.process_contexts || '*')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const sourceConditionsXml = buildSourceConditionsXml(rule, 16);

  const buildAttributeXml = () => {
    const aLines = [];
    aLines.push('            <Attribute>');
    if (charMap.basket_action) {
      aLines.push(`                <BasketAction>${escapeXml(charMap.basket_action)}</BasketAction>`);
    }
    aLines.push(`                <AttributeCode>${escapeXml(charMap.attribute_code || '')}</AttributeCode>`);
    if (charMap.attribute_value !== undefined && charMap.attribute_value !== '') {
      aLines.push(`                <AttributeValue>${escapeXml(charMap.attribute_value)}</AttributeValue>`);
    }
    aLines.push(`                <AttributeAdditionalValue>${escapeXml(charMap.attribute_additional_value || '')}</AttributeAdditionalValue>`);
    if (charMap.source_attribute_additional_value) {
      aLines.push(`                <SourceAttributeAdditionalValue>${escapeXml(charMap.source_attribute_additional_value)}</SourceAttributeAdditionalValue>`);
    }
    if (charMap.component_element) {
      aLines.push(`                <ComponentElement>${escapeXml(charMap.component_element)}</ComponentElement>`);
    }
    aLines.push(`                <Direction>${escapeXml(charMap.direction || 'out')}</Direction>`);
    if (charMap.attribute_action) {
      aLines.push(`                <AttributeAction>${escapeXml(charMap.attribute_action)}</AttributeAction>`);
    }
    aLines.push('                <ProcessContexts>');
    (processContexts.length > 0 ? processContexts : ['*']).forEach(ctx => {
      aLines.push(`                    <ProcessContext>${escapeXml(ctx)}</ProcessContext>`);
    });
    aLines.push('                </ProcessContexts>');
    if (sourceConditionsXml) {
      aLines.push(sourceConditionsXml);
    }
    aLines.push('            </Attribute>');
    return aLines.join('\n');
  };

  const attributeXml = buildAttributeXml();

  const lines = [
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
    '<Components>',
    '    <Component>',
    `        <SourceComponentID>${escapeXml(sourceComponentId)}</SourceComponentID>`,
    `        <OGWComponentName>${escapeXml(ogwComponentName)}</OGWComponentName>`,
    `        <SystemName>${escapeXml(systemName)}</SystemName>`
  ];

  effectiveEntities.forEach(ent => {
    const sku = ent?.name || ent?.sku || ent?.id || 'UNASSIGNED_SKU';
    const elementId = ent?.blockId !== undefined && ent?.blockId !== null && ent?.blockId !== '' ? String(ent.blockId) : '1';
    lines.push('        <SimpleProduct>');
    lines.push(`            <ElementId>${escapeXml(elementId)}</ElementId>`);
    lines.push(`            <OGWComponentIdReference>${escapeXml(sourceComponentId)}</OGWComponentIdReference>`);
    lines.push(`            <SKU>${escapeXml(sku)}</SKU>`);
    lines.push(attributeXml);
    lines.push('        </SimpleProduct>');
  });

  if (skuScope === 'all' && entities.length > maxSkus) {
    lines.push(`        <!-- Truncated: showing ${maxSkus} of ${entities.length} linked SKUs -->`);
  }

  lines.push('    </Component>');
  lines.push('</Components>');
  return lines.join('\n');
}
