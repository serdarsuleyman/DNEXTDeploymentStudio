// productOfferingPriceColumnConfig.js
// Configurable Column Schema and Definitions for ProductOfferingPricesListView

import { evaluateJsonPath } from '../../utils/jsonPath.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = [
  'chargeType',
  'id',
  'name',
  'amount',
  'version',
  'lifecycle'
];

/**
 * Normalizes price details from a product offering price object
 */
export function getPriceDetails(item) {
  if (!item) return { priceType: 'Price', isRecurring: false, isOneTime: false, isBundle: false, period: '', amountStr: '-' };
  const raw = item.raw || item || {};
  const pt = (raw.priceType || '').toLowerCase();
  const isBundle = Boolean(
    raw.isBundle ||
    (Array.isArray(raw.bundledPopRelationship) && raw.bundledPopRelationship.length > 0) ||
    (Array.isArray(raw.bundledProductOfferingPrice) && raw.bundledProductOfferingPrice.length > 0)
  );
  const period = raw.recurringChargePeriodType || '';
  const priceVal = raw.price?.value !== undefined ? raw.price.value : raw.price?.price !== undefined ? raw.price.price : null;
  const priceUnit = raw.price?.unit || 'EUR';

  return {
    priceType: raw.priceType || (isBundle ? 'Bundle POP' : 'Price'),
    isRecurring: pt.includes('recurring'),
    isOneTime: pt.includes('one time') || pt.includes('onetime'),
    isBundle,
    period,
    amountVal: priceVal,
    amountStr: priceVal !== null ? `${priceVal} ${priceUnit}` : '-'
  };
}

/**
 * Extracts raw string value for a product offering price item given a column definition.
 */
export function getColumnRawValue(item, colDef) {
  if (!item || !colDef) return '';

  if (colDef.jsonPath) {
    const extracted = evaluateJsonPath(item, colDef.jsonPath);
    if (extracted !== null && extracted !== undefined && String(extracted).trim() !== '') {
      return String(extracted).trim();
    }
  }

  const details = getPriceDetails(item);

  switch (colDef.key) {
    case 'chargeType':
      return details.isBundle ? 'Bundle POP' : details.isRecurring ? 'Recurring' : details.isOneTime ? 'One-Time' : details.priceType;
    case 'id':
      return String(item.id || '');
    case 'name':
      return String(item.name || '');
    case 'amount':
      return details.amountStr;
    case 'period':
      return details.period || '';
    case 'priceType':
      return String(item.priceType || item.raw?.priceType || '');
    case 'description':
      return String(item.description || item.raw?.description || '');
    case 'version':
      return String(item.version || '0');
    case 'lifecycle':
      return String(item.lifecycleStatus || '');
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

/**
 * Full catalogue of available configurable columns for ProductOfferingPricesListView.
 */
export const AVAILABLE_COLUMNS = [
  {
    key: 'chargeType',
    label: 'Charge Type',
    description: 'Price classification (Recurring, One-Time, Bundle POP)',
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
    description: 'Unique TMF price identifier',
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
    label: 'Price Name',
    description: 'Commercial title of the price model',
    jsonPath: '$.name',
    width: 'auto',
    minWidth: '220px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'amount',
    label: 'Amount',
    description: 'Price value and currency with charging interval',
    jsonPath: '$.price.value || $.price.price',
    width: '140px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'period',
    label: 'Period',
    description: 'Recurring period frequency (e.g. month, year)',
    jsonPath: '$.recurringChargePeriodType',
    width: '120px',
    minWidth: '100px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'priceType',
    label: 'Price Type',
    description: 'Raw price type definition',
    jsonPath: '$.priceType',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Textual description of the price condition',
    jsonPath: '$.description',
    width: 'auto',
    minWidth: '200px',
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
    description: 'Price version with interactive expansion tree',
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
