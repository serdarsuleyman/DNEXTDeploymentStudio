// optionColumnConfig.js
// Configurable Column Schema and Definitions for OptionsListView
// Following the Dynamic & Configurable UI Rendering Specification

import { evaluateJsonPath, getColumnRawValue as getSalesPackageColumnRawValue } from './salesPackageColumnConfig';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = ['id', 'name', 'sku', 'product_family_name', 'spec', 'maf', 'version', 'lifecycle'];

/**
 * Extracts raw string value for an option item given a column definition.
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
      const val = evaluateJsonPath(item, '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="SKU")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="tivano_option_sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="option_sku")].productSpecCharacteristicValue[*].value || $.sku');
      return val !== null && val !== undefined ? String(val).trim() : '';
    }
    case 'product_family_name': {
      const val = evaluateJsonPath(item, '$.prodSpecCharValueUse[?(@.name=="product_family_name")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="productFamilyName")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="PRODUCT_FAMILY_NAME")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="product_family")].productSpecCharacteristicValue[*].value || $.product_family_name');
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
 * Full catalogue of available configurable columns for OptionsListView.
 */
export const AVAILABLE_COLUMNS = [
  {
    key: 'id',
    label: 'ID / Identifier',
    description: 'Unique TMF offering identifier',
    jsonPath: '$.id',
    width: 'auto',
    minWidth: '180px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'name',
    label: 'Option Name',
    description: 'Commercial title of the option product offering',
    jsonPath: '$.name',
    width: 'auto',
    minWidth: '220px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'sku',
    label: 'SKU',
    description: 'Option SKU identifier extracted from characteristic via JSONPath',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="SKU")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="tivano_option_sku")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="option_sku")].productSpecCharacteristicValue[*].value || $.sku',
    width: '150px',
    minWidth: '130px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'SKU',
    badgeStyle: { color: 'var(--ds-info)', bg: 'rgba(2,132,199,0.1)', border: 'rgba(2,132,199,0.25)' },
    badgeIcon: ''
  },
  {
    key: 'product_family_name',
    label: 'Product Family',
    description: 'Product Family Name extracted from characteristic via JSONPath',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="product_family_name")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="productFamilyName")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="PRODUCT_FAMILY_NAME")].productSpecCharacteristicValue[*].value || $.prodSpecCharValueUse[?(@.name=="product_family")].productSpecCharacteristicValue[*].value || $.product_family_name',
    width: '170px',
    minWidth: '150px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'FAM',
    badgeStyle: { color: '#be185d', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
    badgeIcon: ''
  },
  {
    key: 'spec',
    label: 'Option Specification',
    description: 'Target Product Specification reference containing Option',
    jsonPath: '$.productSpecification.name || $.productSpecification.id',
    width: 'auto',
    minWidth: '200px',
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
