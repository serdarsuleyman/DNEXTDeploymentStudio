// salesPackageColumnConfig.js
// Configurable Column Schema, JSONPath Evaluator, and Filters for SalesPackagesListView
import { extractNgnPacketCodes, extractBitstreamPacketCodes, extractVpnPacketCodes } from '../../services/psmStructureService.js';

export const DEFAULT_COLUMN_KEYS = ['id', 'name', 'psm_code', 'ngn_packet_codes', 'bitstream_packet_codes', 'sku', 'maf', 'spec', 'start_date', 'end_date', 'version', 'lifecycle'];



/**
 * Evaluates a single JSONPath segment against an item.
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

  // Tokenize regex matching properties, array indices, wildcard [*], and predicate filters
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
      // Wildcard retains the array elements
      continue;
    }

    if (propName !== undefined) {
      if (isFirst && current[propName] === undefined && item[propName] !== undefined) {
        current = item[propName];
      } else if (Array.isArray(current)) {
        // Collect property across all array elements and flatten if values are arrays
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

/**
 * Extracts speed profile via JSONPath from characteristics, with fallback to spec/offer names
 */
export function extractSpeedProfile(item) {
  // 1. Try extracting bandwidth characteristics directly via JSONPath
  const downChar = evaluateJsonPath(
    item,
    '$.prodSpecCharValueUse[?(@.name=="default_bandwidth")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="bandwidth")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="download_speed")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="downstream_bandwidth")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="speed_download")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="bandwidth_down")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="Bandwidth")].productSpecCharacteristicValue[*].value'
  );

  const upChar = evaluateJsonPath(
    item,
    '$.prodSpecCharValueUse[?(@.name=="upstream_bandwidth")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="bandwidth_upstream_max")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="upload_speed")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="speed_upload")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="bandwidth_up")].productSpecCharacteristicValue[*].value'
  );

  if (downChar) {
    const downNum = parseInt(downChar, 10) || 0;
    const downStr = downChar.includes('bps') ? downChar : (downNum >= 1000 ? `${downNum / 1000} Gbps` : `${downChar} Mbps`);
    const upStr = upChar ? (upChar.includes('bps') ? upChar : `${upChar} Mbps`) : `${Math.round(downNum * 0.5)} Mbps`;
    const upNum = upChar ? (parseInt(upChar, 10) || 0) : Math.round(downNum * 0.5);
    return {
      download: downStr,
      upload: upStr,
      numericDown: downNum,
      numericUp: upNum,
      tech: detectAccessTechnology(item),
      inferred: false,
      upInferred: false,
      summary: `${downStr} ↓ / ${upStr} ↑`
    };
  }

  // 2. Fallback: extract speed from specification or package name via JSONPath
  const specStr = evaluateJsonPath(item, '$.productSpecification.name || $.productSpecification.id') || '';
  const offerStr = evaluateJsonPath(item, '$.name || $.id') || '';
  const str = `${specStr} ${offerStr}`.toLowerCase();
  const isFiber = str.includes('ftth') || str.includes('fiber') || str.includes('fibre') || str.includes('glasfaser');
  const match = str.match(/\b(1000|600|300|250|150|100|50|25|16)\b/);
  const speedVal = match ? parseInt(match[1], 10) : (isFiber ? 1000 : 100);

  const downStr = speedVal >= 1000 ? `${speedVal / 1000} Gbps` : `${speedVal} Mbps`;
  const upStr = isFiber
    ? (speedVal >= 1000 ? '500 Mbps' : `${Math.round(speedVal * 0.5)} Mbps`)
    : `${Math.min(40, Math.round(speedVal * 0.25))} Mbps`;

  const upNum = isFiber
    ? (speedVal >= 1000 ? 500 : Math.round(speedVal * 0.5))
    : Math.min(40, Math.round(speedVal * 0.25));

  return {
    download: downStr,
    upload: upStr,
    numericDown: speedVal,
    numericUp: upNum,
    tech: detectAccessTechnology(item),
    inferred: false,
    upInferred: false,
    summary: `${downStr} ↓ / ${upStr} ↑`
  };
}

/**
 * Best-effort access technology label (FTTH / CABLE / DSL / 5G) from spec + offering names.
 */
export function detectAccessTechnology(item) {
  const specStr = evaluateJsonPath(item, '$.productSpecification.name || $.productSpecification.id') || '';
  const offerStr = evaluateJsonPath(item, '$.name || $.id') || '';
  const str = `${specStr} ${offerStr}`.toLowerCase();
  if (/ftth|fiber|fibre|glasfaser/.test(str)) return 'FTTH';
  if (/cable|kabel|docsis/.test(str)) return 'CABLE';
  if (/vdsl|adsl|\bdsl\b/.test(str)) return 'DSL';
  if (/\b5g\b|gigacube|lte/.test(str)) return '5G';
  return null;
}

/**
 * Resolves a comparable/searchable raw value for a given column definition.
 * Prioritizes declarative JSONPath resolution, with fallbacks to core fields.
 */
export function getColumnRawValue(item, colDef) {
  if (!item || !colDef) return '';

  if (colDef.accessor) {
    return colDef.accessor(item);
  }

  // Primary: evaluate declarative JSONPath when available
  if (colDef.jsonPath) {
    const val = evaluateJsonPath(item, colDef.jsonPath);
    if (val !== null && val !== undefined && String(val).trim() !== '') {
      return String(val);
    }
  }

  // Fallback to core fields
  switch (colDef.key) {
    case 'id':
      return String(item.id || '');
    case 'name':
      return String(item.name || '');
    case 'spec': {
      const s = item.productSpecification || item.raw?.productSpecification;
      return String(s?.name || s?.id || '');
    }
    case 'speed':
      return extractSpeedProfile(item).summary;
    case 'version':
      return String(item.version || '0');
    case 'lifecycle':
      return String(item.lifecycleStatus || '');
    case 'start_date':
      return String(item.validFor?.startDateTime || item.raw?.validFor?.startDateTime || '');
    case 'end_date':
      return String(item.validFor?.endDateTime || item.raw?.validFor?.endDateTime || '');
    case 'ngn_packet_codes':
      return extractNgnPacketCodes(item);
    case 'bitstream_packet_codes':
    case 'vpn_packet_codes':
      return extractBitstreamPacketCodes(item);
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

/**
 * Full catalogue of available configurable columns for SalesPackagesListView.
 * Supports:
 * - sortable: boolean
 * - filterable: boolean
 * - filterType: 'text' | 'select'
 * - jsonPath: string (declarative JSONPath expression)
 */
export const AVAILABLE_COLUMNS = [
  {
    key: 'id',
    label: 'ID / Identifier',
    description: 'Unique TMF offering identifier',
    jsonPath: '$.id',
    width: 'auto',
    minWidth: '180px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'name',
    label: 'Sales Package Name',
    description: 'Commercial title of the sales package product offering',
    jsonPath: '$.name',
    width: 'auto',
    minWidth: '220px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'spec',
    label: 'Package Specification',
    description: 'Target Product Specification reference with clickable filter chip',
    jsonPath: '$.productSpecification.name || $.productSpecification.id',
    width: 'auto',
    minWidth: '200px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'speed',
    label: 'Speed (Down/Up)',
    description: 'Max downstream and upstream broadband bandwidths',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="download_speed")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="downstream_bandwidth")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="speed_download")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="Bandwidth")].productSpecCharacteristicValue[*].value',
    width: '150px',
    minWidth: '140px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'tariff_code_internet',
    label: 'Internet Tariff Code',
    description: 'Fixed-net broadband tariff code extracted via JSONPath from characteristics (consolidated if multiple)',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="tariff_code_internet")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="InternetTariffCode")].productSpecCharacteristicValue[*].value',
    width: '180px',
    minWidth: '160px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'INT',
    badgeStyle: { color: 'var(--ds-info)', bg: 'rgba(2,132,199,0.1)', border: 'rgba(2,132,199,0.25)' }
  },
  {
    key: 'tariff_code_voice',
    label: 'Voice Tariff Code',
    description: 'Telephony voice tariff code extracted via JSONPath from characteristics (consolidated if multiple)',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="tariff_code_voice")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="VoiceTariffCode")].productSpecCharacteristicValue[*].value',
    width: '180px',
    minWidth: '160px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'VOI',
    badgeStyle: { color: 'var(--ds-spec)', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)' }
  },
  {
    key: 'tariff_codes',
    label: 'Tariff Codes',
    description: 'Internet (INT) and voice (VOI) tariff codes combined in one compact column',
    internetPath: '$.prodSpecCharValueUse[?(@.name=="tariff_code_internet")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="InternetTariffCode")].productSpecCharacteristicValue[*].value',
    voicePath: '$.prodSpecCharValueUse[?(@.name=="tariff_code_voice")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="VoiceTariffCode")].productSpecCharacteristicValue[*].value',
    accessor: (item) => [evaluateJsonPath(item, '$.prodSpecCharValueUse[?(@.name=="tariff_code_internet")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="InternetTariffCode")].productSpecCharacteristicValue[*].value'), evaluateJsonPath(item, '$.prodSpecCharValueUse[?(@.name=="tariff_code_voice")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="VoiceTariffCode")].productSpecCharacteristicValue[*].value')].filter(Boolean).join(', '),
    width: '200px',
    minWidth: '170px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'validity',
    label: 'Validity',
    description: 'Validity period (start → end) with active / upcoming / expired state',
    accessor: (item) => String(evaluateJsonPath(item, '$.validFor.startDateTime || $.validFor.startDate || $.startDateTime || $.startDate') || ''),
    width: '200px',
    minWidth: '180px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'psm_code',
    label: 'PSM Code',
    description: 'PSM packet identifier extracted via JSONPath from psm_aaw_packet_id characteristic',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="psm_aaw_packet_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psmAawPacketId")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="PSM_AAW_PACKET_ID")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_packet_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_code")].productSpecCharacteristicValue[*].value || $.psm_aaw_packet_id',
    width: '160px',
    minWidth: '140px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'PSM',
    badgeStyle: { color: 'var(--ds-ok)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' }
  },
  {
    key: 'ngn_packet_codes',
    label: 'NGN Packet Codes',
    description: 'Vodafone NGN sales packet codes (e.g. PI216, PF340) resolved from structure and characteristics',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_internet_ngn")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_voice_ngn")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_ngn")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code")].productSpecCharacteristicValue[*].value',
    accessor: (item) => extractNgnPacketCodes(item),
    width: '170px',
    minWidth: '150px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'NGN',
    badgeStyle: { color: 'var(--ds-info)', bg: 'rgba(2,132,199,0.1)', border: 'rgba(2,132,199,0.25)' }
  },
  {
    key: 'bitstream_packet_codes',
    label: 'Bitstream Packet Codes',
    description: 'Telekom Bitstream wholesale sales packet codes (e.g. PR403, PR411) resolved from structure and characteristics',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_internet_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_voice_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_internet_vpn")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code")].productSpecCharacteristicValue[*].value',
    accessor: (item) => extractBitstreamPacketCodes(item),
    width: '180px',
    minWidth: '160px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'Bitstream',
    badgeStyle: { color: 'var(--ds-spec)', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)' }
  },
  {
    key: 'vpn_packet_codes',
    label: 'VPN Packet Codes (Legacy)',
    description: 'Alias for Bitstream wholesale sales packet codes',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_internet_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_voice_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_bitstream")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code_internet_vpn")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_sales_packet_code")].productSpecCharacteristicValue[*].value',
    accessor: (item) => extractBitstreamPacketCodes(item),
    width: '180px',
    minWidth: '160px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'Bitstream',
    badgeStyle: { color: 'var(--ds-spec)', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)' }
  },
  {
    key: 'sku',
    label: 'SKU',
    description: 'Stock Keeping Unit (SKU) characteristic extracted from offering characteristics or category groupings',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="SKU")].productSpecCharacteristicValue[*].value || $.extensions.categoryGroupings[*].prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.sku',
    width: '180px',
    minWidth: '150px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'SKU',
    badgeStyle: { color: 'var(--ds-spec)', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)' },
    badgeIcon: ''
  },
  {
    key: 'maf',
    label: 'MAF(Base)',
    description: 'Monthly Access Fee (Base) extracted from maf characteristic under the offer',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="maf")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="MAF")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="maf_base")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="monthly_access_fee")].productSpecCharacteristicValue[*].value || $.productOfferingPrice[?(@.priceType=="recurring")].price.value || $.productOfferingPrice[*].price.value',
    width: '130px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    align: 'right'
  },
  {
    key: 'start_date',
    label: 'Start Date',
    description: 'Offering validity start date from validFor.startDateTime via JSONPath',
    jsonPath: '$.validFor.startDateTime || $.validFor.startDate || $.startDateTime || $.startDate',
    width: '135px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'end_date',
    label: 'End Date',
    description: 'Offering validity end date from validFor.endDateTime via JSONPath',
    jsonPath: '$.validFor.endDateTime || $.validFor.endDate || $.endDateTime || $.endDate',
    width: '135px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'version',
    label: 'Version',
    description: 'TMF version number (click to view all versions)',
    jsonPath: '$.version',
    width: '95px',
    minWidth: '90px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'lifecycle',
    label: 'Lifecycle Status',
    description: 'TMF lifecycle state (Launched, In study, Active, Obsolete)',
    jsonPath: '$.lifecycleStatus',
    width: '120px',
    minWidth: '110px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  }
];
