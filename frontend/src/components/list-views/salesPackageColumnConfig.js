// salesPackageColumnConfig.js
// Configurable Column Schema, JSONPath Evaluator, and Filters for SalesPackagesListView
import { extractNgnPacketCodes, extractBitstreamPacketCodes, extractVpnPacketCodes } from '../../services/psmStructureService.js';
import { evaluateJsonPath } from '../../utils/jsonPath.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = ['id', 'name', 'portfolio_id', 'network_type', 'psm_code', 'ngn_packet_codes', 'bitstream_packet_codes', 'sku', 'maf', 'spec', 'start_date', 'end_date', 'version', 'lifecycle'];

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
    const upNum = upChar ? (parseFloat(upChar) || null) : null;
    const upStr = upChar ? (upChar.includes('bps') ? upChar : `${upChar} Mbps`) : '';
    return {
      download: downStr,
      upload: upStr,
      numericDown: downNum,
      numericUp: upNum,
      tech: detectAccessTechnology(item),
      inferred: false,
      upInferred: false,
      summary: upStr ? `${downStr} ↓ / ${upStr} ↑` : `${downStr} ↓`
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
  const upNum = upChar ? (parseFloat(upChar) || null) : null;
  const upStr = upChar ? (upChar.includes('bps') ? upChar : `${upChar} Mbps`) : '';

  return {
    download: downStr,
    upload: upStr,
    numericDown: speedVal,
    numericUp: upNum,
    tech: detectAccessTechnology(item),
    inferred: false,
    upInferred: false,
    summary: upStr ? `${downStr} ↓ / ${upStr} ↑` : `${downStr} ↓`
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
 * Resolves the Network Type (DSL or Fiber) based on the specification.
 * Decided strictly based on specification, with fallback to offer name if spec is generic.
 */
export function extractNetworkType(item) {
  if (!item) return '';
  const spec = item.productSpecification || item.raw?.productSpecification;
  const specStr = `${spec?.name || ''} ${spec?.id || ''}`.toLowerCase();

  // 1. Primary: Decide based on the specification
  if (/dsl|vdsl|adsl/.test(specStr)) {
    return 'DSL';
  }
  if (/ftth|fiber|fibre|glasfaser/.test(specStr)) {
    return 'Fiber';
  }

  // 2. Fallback: If spec is generic (e.g. spec_sales_package, VF_DE_SALES_SPEC), check offer name/id
  const offerStr = `${item.name || ''} ${item.id || ''}`.toLowerCase();
  if (/ftth|fiber|fibre|glasfaser/.test(offerStr)) {
    return 'Fiber';
  }
  if (/dsl|vdsl|adsl/.test(offerStr)) {
    return 'DSL';
  }

  return '';
}

/**
 * Resolves the Portfolio Id from direct offering characteristic "portfolio_id" (productOfferingCharacteristic).
 * Falls back to prodSpecCharValueUse if characteristic was defined there.
 */
export function extractPortfolioId(item) {
  if (!item) return '';

  // 1. Primary: Direct offering characteristic (productOfferingCharacteristic)
  const directChars = item.productOfferingCharacteristic || item.raw?.productOfferingCharacteristic;
  if (Array.isArray(directChars)) {
    const char = directChars.find(c => (c.name || '').toLowerCase() === 'portfolio_id');
    if (char) {
      if (Array.isArray(char.productOfferingCharacteristicValue) && char.productOfferingCharacteristicValue.length > 0) {
        return char.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
      }
      if (Array.isArray(char.productSpecCharacteristicValue) && char.productSpecCharacteristicValue.length > 0) {
        return char.productSpecCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
      }
      if (Array.isArray(char.values) && char.values.length > 0) {
        return char.values.join(', ');
      }
      if (Array.isArray(char.value)) {
        return char.value.join(', ');
      }
      if (char.value !== undefined && char.value !== null) {
        return String(char.value);
      }
    }
  }

  // 2. Secondary: Direct field on entity or draft data
  if (item.portfolio_id && String(item.portfolio_id).trim() !== '') {
    return String(item.portfolio_id).trim();
  }
  if (item.raw?.portfolio_id && String(item.raw.portfolio_id).trim() !== '') {
    return String(item.raw.portfolio_id).trim();
  }

  // 2. Secondary: Fallback to JSONPath across productOfferingCharacteristic
  const directVal = evaluateJsonPath(
    item,
    '$.productOfferingCharacteristic[?(@.name=="portfolio_id")].productOfferingCharacteristicValue[*].value || ' +
    '$.productOfferingCharacteristic[?(@.name=="portfolio_id")].value || ' +
    '$.productOfferingCharacteristic[?(@.name=="portfolio_id")].productSpecCharacteristicValue[*].value'
  );
  if (directVal !== null && directVal !== undefined && String(directVal).trim() !== '') {
    return String(directVal);
  }

  // 3. Fallback: Check prodSpecCharValueUse in case it was stored there
  const specVal = evaluateJsonPath(
    item,
    '$.prodSpecCharValueUse[?(@.name=="portfolio_id")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="portfolio_id")].value'
  );
  if (specVal !== null && specVal !== undefined && String(specVal).trim() !== '') {
    return String(specVal);
  }

  return '';
}

/**
 * Extracts the direct characteristic template_name value from a ProductOffering
 * (e.g. "PO_GigaZuhause_100_Kabel:(version=1)").
 */
export function extractTemplateName(item) {
  if (!item) return '';

  // 1. Primary: Direct offering characteristic (productOfferingCharacteristic)
  const directChars = item.productOfferingCharacteristic || item.raw?.productOfferingCharacteristic;
  if (Array.isArray(directChars)) {
    const char = directChars.find(c => (c.name || '').toLowerCase() === 'template_name');
    if (char) {
      if (Array.isArray(char.productOfferingCharacteristicValue) && char.productOfferingCharacteristicValue.length > 0) {
        return char.productOfferingCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
      }
      if (Array.isArray(char.productSpecCharacteristicValue) && char.productSpecCharacteristicValue.length > 0) {
        return char.productSpecCharacteristicValue.map(v => v?.value !== undefined ? String(v.value) : String(v)).join(', ');
      }
      if (Array.isArray(char.values) && char.values.length > 0) {
        return char.values.join(', ');
      }
      if (Array.isArray(char.value)) {
        return char.value.join(', ');
      }
      if (char.value !== undefined && char.value !== null) {
        return String(char.value);
      }
    }
  }

  // 2. Secondary: Fallback to JSONPath across productOfferingCharacteristic
  const directVal = evaluateJsonPath(
    item,
    '$.productOfferingCharacteristic[?(@.name=="template_name")].productOfferingCharacteristicValue[*].value || ' +
    '$.productOfferingCharacteristic[?(@.name=="template_name")].value || ' +
    '$.productOfferingCharacteristic[?(@.name=="template_name")].productSpecCharacteristicValue[*].value'
  );
  if (directVal !== null && directVal !== undefined && String(directVal).trim() !== '') {
    return String(directVal);
  }

  // 3. Fallback: Check prodSpecCharValueUse
  const specVal = evaluateJsonPath(
    item,
    '$.prodSpecCharValueUse[?(@.name=="template_name")].productSpecCharacteristicValue[*].value || ' +
    '$.prodSpecCharValueUse[?(@.name=="template_name")].value'
  );
  if (specVal !== null && specVal !== undefined && String(specVal).trim() !== '') {
    return String(specVal);
  }

  return '';
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
    case 'portfolio_id':
      return extractPortfolioId(item);
    case 'network_type':
      return extractNetworkType(item);
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
    key: 'portfolio_id',
    label: 'Portfolio Id',
    description: 'Portfolio identifier mapped from direct offering characteristic portfolio_id',
    jsonPath: '$.productOfferingCharacteristic[?(@.name=="portfolio_id")].productOfferingCharacteristicValue[*].value || $.productOfferingCharacteristic[?(@.name=="portfolio_id")].value',
    accessor: (item) => extractPortfolioId(item),
    width: '150px',
    minWidth: '130px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'network_type',
    label: 'Network Type',
    description: 'Broadband access network technology (DSL or Fiber) decided based on specification',
    accessor: (item) => extractNetworkType(item),
    width: '130px',
    minWidth: '110px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
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
    label: 'PKAT Id',
    description: 'PKAT packet identifier extracted via JSONPath from psm_aaw_packet_id characteristic',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="psm_aaw_packet_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psmAawPacketId")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="PSM_AAW_PACKET_ID")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_packet_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="psm_code")].productSpecCharacteristicValue[*].value || $.psm_aaw_packet_id',
    width: '160px',
    minWidth: '140px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'PKAT',
    badgeStyle: { color: 'var(--ds-ok)', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' }
  },
  {
    key: 'ngn_packet_codes',
    label: 'NGN PSM Code',
    description: 'Vodafone NGN PSM sales packet codes (e.g. PI216, PF340) resolved from structure and characteristics',
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
    label: 'Bitstream PSM Code',
    description: 'Telekom Bitstream wholesale PSM sales packet codes (e.g. PR403, PR411) resolved from structure and characteristics',
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
