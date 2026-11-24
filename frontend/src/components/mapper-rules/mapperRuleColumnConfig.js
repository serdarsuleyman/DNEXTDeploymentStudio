// mapperRuleColumnConfig.js
// Configurable Column Schema and Definitions for MapperRulesListView

export const DEFAULT_MAPPER_COLUMN_KEYS = [
  'id',
  'mapperType',
  'direction',
  'sourceComponentId',
  'attributeCode',
  'attributeValue',
  'attributeAdditionalValue',
  'basketAction',
  'attributeAction',
  'processContexts',
  'skuCount',
  'condition',
  'status'
];

function getCharacteristicValue(item, charName) {
  if (!item) return '';
  const chars = Array.isArray(item.ruleCharacteristic) ? item.ruleCharacteristic : [];
  const found = chars.find(c => c && c.name === charName);
  if (found && found.value !== undefined && found.value !== null) {
    return String(found.value);
  }
  return '';
}

/**
 * Extracts raw string value for a mapper rule item given a column definition.
 */
export function getMapperColumnRawValue(item, colDef) {
  if (!item || !colDef) return '';
  const m = item._meta || {};

  switch (colDef.key) {
    case 'id':
      return String(item.id || '');
    case 'name':
      return String(item.name || '');
    case 'mapperType':
      return getCharacteristicValue(item, 'mapper_type') || String(m.mapperType || '');
    case 'direction':
      return getCharacteristicValue(item, 'direction') || String(m.direction || '');
    case 'sourceComponentId':
      return getCharacteristicValue(item, 'source_component_id') || String(m.sourceComponentId || '');
    case 'systemName':
      return getCharacteristicValue(item, 'system_name') || String(m.systemName || '');
    case 'attributeCode':
      return getCharacteristicValue(item, 'attribute_code') || String(m.attributeCode || '');
    case 'attributeValue':
      return getCharacteristicValue(item, 'attribute_value') || String(m.attributeValue || '');
    case 'attributeAdditionalValue':
      return getCharacteristicValue(item, 'attribute_additional_value') || String(m.attributeAdditionalValue || '');
    case 'basketAction':
      return getCharacteristicValue(item, 'basket_action') || String(m.basketAction || '');
    case 'attributeAction':
      return getCharacteristicValue(item, 'attribute_action') || String(m.attributeAction || '');
    case 'processContexts':
      return getCharacteristicValue(item, 'process_contexts') || String(m.processContexts || '');
    case 'skuCount':
      return String(
        m.skuCount !== undefined
          ? m.skuCount
          : (Array.isArray(item.managedAssetGroup?.entity) ? item.managedAssetGroup.entity.length : 0)
      );
    case 'condition':
      return Array.isArray(item.condition) && item.condition.length > 0
        ? item.condition.join(' && ')
        : 'true';
    case 'status':
      return String(item.status || 'draft');
    case 'syncState':
      return String(m.syncState || 'synced');
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

export const AVAILABLE_MAPPER_COLUMNS = [
  {
    key: 'id',
    label: 'Rule ID',
    description: 'Unique Mapper Rule identifier (e.g. MAPPER_accesses1)',
    width: '170px',
    minWidth: '150px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'mapperType',
    label: 'Area',
    description: 'Functional area (mapper_type characteristic)',
    width: '130px',
    minWidth: '110px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'direction',
    label: 'Dir',
    description: 'Mapping direction (out: Cart → OGW, in: CustDetail → 360°)',
    width: '80px',
    minWidth: '70px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'sourceComponentId',
    label: 'Source Comp Id',
    description: 'Source component identifier (source_component_id characteristic)',
    width: '125px',
    minWidth: '110px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'attributeCode',
    label: 'Attribute Code',
    description: 'Target/source attribute code (attribute_code characteristic)',
    width: '170px',
    minWidth: '140px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'attributeValue',
    label: 'Value',
    description: 'Attribute value (attribute_value characteristic)',
    width: '150px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'attributeAdditionalValue',
    label: 'Additional Value (Path)',
    description: 'Target/source XML/JSON path (attribute_additional_value characteristic)',
    width: '240px',
    minWidth: '180px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'basketAction',
    label: 'Basket Action',
    description: 'Basket action (basket_action characteristic)',
    width: '120px',
    minWidth: '105px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'attributeAction',
    label: 'Attr Action',
    description: 'Attribute action (attribute_action characteristic)',
    width: '115px',
    minWidth: '100px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'processContexts',
    label: 'Contexts',
    description: 'Applicable process contexts (process_contexts characteristic)',
    width: '150px',
    minWidth: '120px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'skuCount',
    label: 'SKUs',
    description: 'Count of linked SKUs in managedAssetGroup.entity[]',
    width: '80px',
    minWidth: '70px',
    defaultVisible: true,
    sortable: true,
    filterable: false,
    filterType: 'text'
  },
  {
    key: 'condition',
    label: 'Condition',
    description: 'Quantifier and condition expression',
    width: '210px',
    minWidth: '160px',
    defaultVisible: true,
    sortable: false,
    filterable: false,
    filterType: 'text'
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Rule lifecycle status (active, draft, inactive)',
    width: '115px',
    minWidth: '95px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'systemName',
    label: 'System',
    description: 'Source system name (system_name characteristic)',
    width: '95px',
    minWidth: '80px',
    defaultVisible: false,
    sortable: true,
    filterable: false,
    filterType: 'text'
  },
  {
    key: 'syncState',
    label: 'Sync State',
    description: 'Local cache sync state (synced, modified, new)',
    width: '110px',
    minWidth: '95px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'name',
    label: 'Rule Name',
    description: 'Rule display name',
    width: '200px',
    minWidth: '160px',
    defaultVisible: false,
    sortable: true,
    filterable: false,
    filterType: 'text'
  }
];
