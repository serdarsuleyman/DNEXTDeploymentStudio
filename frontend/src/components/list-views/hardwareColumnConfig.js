// hardwareColumnConfig.js
// Configurable Column Schema and Definitions for HardwareListView
// Following the Dynamic & Configurable UI Rendering Specification

import { evaluateJsonPath } from '../../utils/jsonPath.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = [
  'id',
  'name',
  'spec',
  'sku',
  'product_type',
  'version',
  'lifecycle'
];

/**
 * Extracts raw string value for a hardware offering item given a column definition.
 */
export function getColumnRawValue(item, colDef) {
  if (!item || !colDef) return '';

  if (colDef.jsonPath) {
    const extracted = evaluateJsonPath(item, colDef.jsonPath);
    if (extracted !== null && extracted !== undefined && String(extracted).trim() !== '') {
      return String(extracted).trim();
    }
  }

  switch (colDef.key) {
    case 'id':
      return String(item.id || '');
    case 'name':
      return String(item.name || '');
    case 'sku': {
      const val = evaluateJsonPath(
        item,
        '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="hardware_sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="material_number")].productSpecCharacteristicValue[*].value || $.sku'
      );
      return val !== null && val !== undefined ? String(val).trim() : '';
    }
    case 'spec': {
      const s = item.productSpecification || item.raw?.productSpecification;
      return String(s?.name || s?.id || '');
    }
    case 'version':
      return String(item.version || '0');
    case 'lifecycle':
      return String(item.lifecycleStatus || '');
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

/**
 * Full catalogue of available configurable columns for HardwareListView.
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
    label: 'Hardware Offering Name',
    description: 'Commercial title of the hardware device / offering',
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
    label: 'Product Specification',
    description: 'Underlying hardware product specification (e.g. productSpecification_FN_Hardware)',
    width: '180px',
    minWidth: '160px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'sku',
    label: 'Hardware SKU',
    description: 'Device / Material SKU identifier extracted via JSONPath',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="hardware_sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="material_number")].productSpecCharacteristicValue[*].value || $.sku',
    width: '150px',
    minWidth: '130px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'SKU',
    badgeStyle: { color: 'var(--ds-info)', bg: 'rgba(2,132,199,0.1)', border: 'rgba(2,132,199,0.25)' }
  },
  {
    key: 'product_type',
    label: 'Product Type',
    description: 'Hardware product classification (e.g. Purchase, Rental, Accessory)',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="product_type")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="productType")].productSpecCharacteristicValue[*].value',
    width: '140px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select',
    codeLabel: 'Type'
  },
  {
    key: 'package_type_id',
    label: 'Package Type ID',
    description: 'Package classification identifier for hardware',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="package_type_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="packageTypeId")].productSpecCharacteristicValue[*].value',
    width: '150px',
    minWidth: '130px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select',
    codeLabel: 'PkgType'
  },
  {
    key: 'package_subtype_id',
    label: 'Package Subtype',
    description: 'Package subtype classification identifier',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="package_subtype_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="packageSubtypeId")].productSpecCharacteristicValue[*].value',
    width: '150px',
    minWidth: '130px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'product_family_id',
    label: 'Product Family',
    description: 'Product Family ID (e.g. FN_Hardware)',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="product_family_id")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="product_family_name")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="productFamilyName")].productSpecCharacteristicValue[*].value',
    width: '160px',
    minWidth: '140px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select',
    codeLabel: 'Family'
  },
  {
    key: 'maf',
    label: 'MAF',
    description: 'Market Segment / MAF indicator',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="maf")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="MAF")].productSpecCharacteristicValue[*].value',
    width: '110px',
    minWidth: '90px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select',
    codeLabel: 'MAF'
  },
  {
    key: 'product_visibility',
    label: 'Visibility',
    description: 'Sales channel visibility status',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="product_visibility")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="visibility")].productSpecCharacteristicValue[*].value',
    width: '120px',
    minWidth: '100px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'checkout_product',
    label: 'Checkout Product',
    description: 'Whether the item is an independent checkout product',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="checkout_product")].productSpecCharacteristicValue[*].value',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'initial_selectable',
    label: 'Initial Selectable',
    description: 'Initial selection flag for configuration flows',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="initial_selectable")].productSpecCharacteristicValue[*].value',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'contract_value',
    label: 'Contract Value',
    description: 'Contract value code or tier',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="contract_value")].productSpecCharacteristicValue[*].value',
    width: '130px',
    minWidth: '110px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'effective_date',
    label: 'Effective Date',
    description: 'Commercial effective start date',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="effective_date")].productSpecCharacteristicValue[*].value',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'expiration_date',
    label: 'Expiration Date',
    description: 'Commercial expiration date',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="expiration_date")].productSpecCharacteristicValue[*].value',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'start_date',
    label: 'Valid For: Start',
    description: 'Start of validity datetime',
    jsonPath: '$.validFor.startDateTime',
    width: '150px',
    minWidth: '130px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'end_date',
    label: 'Valid For: End',
    description: 'End of validity datetime',
    jsonPath: '$.validFor.endDateTime',
    width: '150px',
    minWidth: '130px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'version',
    label: 'Version',
    description: 'Entity version with interactive expansion tree',
    width: '110px',
    minWidth: '95px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'lifecycle',
    label: 'Lifecycle',
    description: 'Current lifecycle state (Launched, In study, Retired, Obsolete)',
    width: '120px',
    minWidth: '105px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  }
];
