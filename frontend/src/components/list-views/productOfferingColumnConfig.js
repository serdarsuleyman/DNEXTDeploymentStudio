// productOfferingColumnConfig.js
// Configurable Column Schema and Definitions for ProductOfferingsListView

import { evaluateJsonPath } from '../../utils/jsonPath.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = [
  'id',
  'name',
  'spec',
  'version',
  'lifecycle'
];

/**
 * Extracts raw string value for a product offering item given a column definition.
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
    case 'spec': {
      const s = item.productSpecification || item.raw?.productSpecification;
      return String(s?.name || s?.id || '');
    }
    case 'sku': {
      const val = evaluateJsonPath(
        item,
        '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.sku'
      );
      return val !== null && val !== undefined ? String(val).trim() : '';
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
 * Full catalogue of available configurable columns for ProductOfferingsListView.
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
    label: 'Offering Name',
    description: 'Commercial title of the product offering',
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
    description: 'Associated specification definition',
    width: '180px',
    minWidth: '160px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'sku',
    label: 'SKU',
    description: 'Offering SKU code',
    jsonPath: '$.prodSpecCharValueUse[?(@.name=="sku")].productSpecCharacteristicValue[*].value || $.sku',
    width: '150px',
    minWidth: '130px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text',
    codeLabel: 'SKU'
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
