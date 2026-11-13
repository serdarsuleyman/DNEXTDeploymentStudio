// allObjectsColumnConfig.js
// Configurable Column Schema and Definitions for AllObjectsListView

import { evaluateJsonPath } from '../../utils/jsonPath.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = [
  'type',
  'id',
  'name',
  'version',
  'lifecycle'
];

/**
 * Extracts raw string value for a catalog item given a column definition.
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
    case 'type':
      return String(item.entityType || '');
    case 'id':
      return String(item.id || '');
    case 'name':
      return String(item.name || '');
    case 'description':
      return String(item.description || item.raw?.description || '');
    case 'isBundle':
      return (item.isBundle || item.raw?.isBundle) ? 'Yes' : 'No';
    case 'version':
      return String(item.version || '0');
    case 'lifecycle':
      return String(item.lifecycleStatus || '');
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

/**
 * Full catalogue of available configurable columns for AllObjectsListView.
 */
export const AVAILABLE_COLUMNS = [
  {
    key: 'type',
    label: 'Type',
    description: 'DNEXT entity type classification',
    width: '150px',
    minWidth: '130px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'id',
    label: 'ID / Identifier',
    description: 'Unique catalog object identifier',
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
    label: 'Name / Title',
    description: 'Object commercial or technical name',
    jsonPath: '$.name',
    width: 'auto',
    minWidth: '220px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Object description',
    jsonPath: '$.description',
    width: 'auto',
    minWidth: '200px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'isBundle',
    label: 'Bundle',
    description: 'Whether the item is a bundle composition',
    jsonPath: '$.isBundle',
    width: '100px',
    minWidth: '85px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
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
