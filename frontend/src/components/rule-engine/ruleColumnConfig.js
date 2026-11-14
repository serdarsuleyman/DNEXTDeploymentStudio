// ruleColumnConfig.js
// Configurable Column Schema and Definitions for RulesListView

import { evaluateJsonPath } from '../../utils/jsonPath.js';
import {
  extractCompatibilityCharacteristics,
  classifyRule,
  detectProductDomain
} from '../../utils/ruleDescriptors.js';
import { RULE_COMMERCIAL_DEFINITIONS } from '../../data/ruleCommercialDefinitions.js';

export { evaluateJsonPath };

export const DEFAULT_COLUMN_KEYS = [
  'id',
  'archetype',
  'name',
  'category',
  'ruleType',
  'operationValue',
  'status',
  'effectiveDate',
  'priority'
];

/**
 * Extracts raw string value for a rule item given a column definition.
 */
export function getColumnRawValue(item, colDef) {
  if (!item || !colDef) return '';

  const chars = extractCompatibilityCharacteristics(item);

  switch (colDef.key) {
    case 'id':
      return String(item.id || '');
    case 'archetype':
      return classifyRule(item).shortLabel || '';
    case 'domain':
      return detectProductDomain(item) || '';
    case 'name':
      return String(item.name || '');
    case 'businessDefinition': {
      const ref = RULE_COMMERCIAL_DEFINITIONS[item.id];
      return ref?.businessDefinition || chars.description || item.name || '';
    }
    case 'category':
      return Array.isArray(item.category) ? item.category.join(', ') : String(item.category || '');
    case 'ruleType':
      return String(item.ruleType || '');
    case 'operationValue':
      return String(chars.operation_value || '');
    case 'operationType':
      return String(chars.operation_type || '');
    case 'status':
      return String(item.status || '');
    case 'stateCategory':
      return String(item.stateCategory || '');
    case 'effectiveDate':
      return String(chars.effective_date || '');
    case 'priority':
      return String(chars.priority !== undefined ? chars.priority : '');
    case 'channels':
      return String(chars.channels || '');
    case 'processContexts':
      return Array.isArray(chars.process_contexts) ? chars.process_contexts.join(', ') : '';
    case 'description':
      return String(chars.description || '');
    default:
      return item[colDef.key] !== undefined ? String(item[colDef.key]) : '';
  }
}

/**
 * Full catalogue of available configurable columns for RulesListView.
 */
export const AVAILABLE_COLUMNS = [
  {
    key: 'id',
    label: 'Rule ID',
    description: 'Unique rule identifier (e.g. CR006472)',
    jsonPath: '$.id',
    width: '120px',
    minWidth: '105px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'archetype',
    label: 'Business Purpose',
    description: 'Commercial business archetype (Wechselgarantie, Mandatory Fee, Promo Default, etc.)',
    width: '185px',
    minWidth: '165px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'domain',
    label: 'Product Domain',
    description: 'Associated line / technology (DSL, Cable, Fiber, Mobile, Hardware)',
    width: '130px',
    minWidth: '110px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'name',
    label: 'Rule Name',
    description: 'Human-readable title / description of the compatibility rule',
    jsonPath: '$.name',
    width: 'auto',
    minWidth: '240px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'businessDefinition',
    label: 'Commercial Definition',
    description: 'LLM-generated commercial definition and policy rationale',
    width: '320px',
    minWidth: '240px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'category',
    label: 'Category',
    description: 'Rule engine classification (e.g. implicitCompatibility)',
    width: '180px',
    minWidth: '160px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'ruleType',
    label: 'Quantifier',
    description: 'Quantifier condition logic (FORALL, FORSOME, IF, FORNONE)',
    width: '120px',
    minWidth: '105px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'operationValue',
    label: 'Compatibility Action',
    description: 'Outcome action (Allowed, Defaulted, Defaulted-Obligated, Removal Not Allowed)',
    width: '170px',
    minWidth: '150px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'status',
    label: 'Status',
    description: 'Rule lifecycle status (draft, active, inactive)',
    width: '110px',
    minWidth: '95px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'stateCategory',
    label: 'State Group',
    description: 'Workflow execution phase (Initial, In progress, Terminal success)',
    width: '130px',
    minWidth: '115px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'effectiveDate',
    label: 'Effective Date',
    description: 'Rule activation start date',
    width: '130px',
    minWidth: '115px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'priority',
    label: 'Priority',
    description: 'Evaluation priority ranking (1 is highest)',
    width: '90px',
    minWidth: '80px',
    defaultVisible: true,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'operationType',
    label: 'Operation Type',
    description: 'Compatibility relationship type (Service-Service, Service-Product)',
    width: '140px',
    minWidth: '120px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'channels',
    label: 'Channels',
    description: 'Applicable sales channels (*, CC, etc.)',
    width: '100px',
    minWidth: '90px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'processContexts',
    label: 'Process Contexts',
    description: 'Target order journey contexts (e.g. ILSBLU, MOVBLU, ACQ)',
    width: '180px',
    minWidth: '150px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'description',
    label: 'Extended Description',
    description: 'Detailed description from rule characteristics',
    width: 'auto',
    minWidth: '220px',
    defaultVisible: false,
    sortable: true,
    filterable: true,
    filterType: 'text'
  }
];
