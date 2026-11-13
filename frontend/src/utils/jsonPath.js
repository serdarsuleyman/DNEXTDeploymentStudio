/**
 * Lightweight, zero-dependency JSONPath Evaluator optimized for TMF620 entities.
 * Supports:
 * - Dot-traversal: 'prop.subprop'
 * - Array indices & wildcards: 'items[0].name', 'items[*].value'
 * - Array property mapping: 'productSpecCharacteristicValue.value'
 * - Standard & shorthand predicate filters: '[?(@.name == "tariff_code_voice")]'
 * - Value consolidation for multi-cardinality values (e.g. "IP528, IP531")
 * - Fallback alternatives separated by '||': 'path1 || path2'
 * - Direct resolution from root or item.raw
 */

function evaluateSingleJsonPath(item, pathStr) {
  if (!item || !pathStr) return null;

  let p = String(pathStr).trim();
  if (p.startsWith('$.')) p = p.slice(2);
  else if (p.startsWith('$')) p = p.slice(1);
  if (p.startsWith('.')) p = p.slice(1);

  if (p.startsWith('raw.') && item.raw) {
    p = p.slice(4);
  }

  const tokenRegex = /([a-zA-Z0-9_@]+)|\[\?\(@\.([a-zA-Z0-9_@]+)\s*==\s*['\"]([^'\"]+)['\"]\)|\[([a-zA-Z0-9_@]+)=['\"]?([^'\"\]]+)['\"]?\]|\[(\d+)\]|\[\*\]/g;

  let match;
  let current = item.raw || item;
  let isFirst = true;

  while ((match = tokenRegex.exec(p)) !== null) {
    if (current === undefined || current === null) return null;

    const propName = match[1];
    const predStdProp = match[2];
    const predStdVal = match[3];
    const predShortProp = match[4];
    const predShortVal = match[5];
    const arrayIndex = match[6];
    const isWildcard = match[0] === '[*]';

    if (isWildcard) {
      continue;
    }

    if (propName !== undefined) {
      if (isFirst && current[propName] === undefined && item[propName] !== undefined) {
        current = item[propName];
      } else if (Array.isArray(current)) {
        const mapped = [];
        for (const el of current) {
          if (el && typeof el === 'object' && el[propName] !== undefined) {
            if (Array.isArray(el[propName])) {
              mapped.push(...el[propName]);
            } else {
              mapped.push(el[propName]);
            }
          }
        }
        current = mapped;
      } else {
        current = current[propName];
      }
    } else if (arrayIndex !== undefined) {
      const idx = parseInt(arrayIndex, 10);
      current = Array.isArray(current) ? current[idx] : null;
    } else if (predStdProp !== undefined || predShortProp !== undefined) {
      const predProp = predStdProp || predShortProp;
      const predVal = predStdVal || predShortVal;
      if (!Array.isArray(current)) return null;
      const matches = current.filter(el => el && String(el[predProp]).toLowerCase() === predVal.toLowerCase());
      if (matches.length === 0) return null;
      current = matches.length === 1 ? matches[0] : matches;
    }
    isFirst = false;
  }

  if (current !== undefined && current !== null) {
    if (Array.isArray(current)) {
      const values = [];
      for (const el of current) {
        if (el === null || el === undefined) continue;
        if (typeof el === 'object') {
          if (el.value !== undefined) values.push(String(el.value).trim());
          else if (el.name !== undefined) values.push(String(el.name).trim());
        } else {
          values.push(String(el).trim());
        }
      }
      const unique = Array.from(new Set(values.filter(Boolean)));
      return unique.length > 0 ? unique.join(', ') : null;
    }
    if (typeof current === 'object' && current.value !== undefined) {
      return String(current.value).trim();
    }
    return String(current).trim();
  }
  return null;
}

export function evaluateJsonPath(item, pathStr) {
  if (!item || !pathStr) return null;

  const paths = String(pathStr).split(/\s*\|\|\s*/);
  for (const singlePath of paths) {
    const res = evaluateSingleJsonPath(item, singlePath.trim());
    if (res !== null && res !== undefined && res !== '') {
      return res;
    }
  }
  return null;
}
