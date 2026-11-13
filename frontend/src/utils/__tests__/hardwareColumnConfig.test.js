import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AVAILABLE_COLUMNS,
  DEFAULT_COLUMN_KEYS,
  getColumnRawValue
} from '../../components/list-views/hardwareColumnConfig.js';

test('hardwareColumnConfig exports valid column catalogue and default keys', () => {
  assert(Array.isArray(AVAILABLE_COLUMNS));
  assert(AVAILABLE_COLUMNS.length >= 10);
  assert(Array.isArray(DEFAULT_COLUMN_KEYS));
  DEFAULT_COLUMN_KEYS.forEach(key => {
    assert(AVAILABLE_COLUMNS.some(c => c.key === key), `Missing column definition for default key ${key}`);
  });
});

test('getColumnRawValue extracts standard and characteristic fields for hardware', () => {
  const mockHardwareItem = {
    id: 'po_hw_fritzbox_7630_purchase',
    name: 'FRITZ!Box 7630 Purchase',
    version: '1.2',
    lifecycleStatus: 'Launched',
    productSpecification: {
      id: 'productSpecification_FN_Hardware',
      name: 'FN_Hardware'
    },
    raw: {
      prodSpecCharValueUse: [
        {
          name: 'sku',
          productSpecCharacteristicValue: [{ value: 'HW_FRITZ_7630' }]
        },
        {
          name: 'product_type',
          productSpecCharacteristicValue: [{ value: 'Purchase' }]
        },
        {
          name: 'product_family_id',
          productSpecCharacteristicValue: [{ value: 'FN_Hardware' }]
        },
        {
          name: 'package_type_id',
          productSpecCharacteristicValue: [{ value: 'Router' }]
        }
      ]
    }
  };

  const idCol = AVAILABLE_COLUMNS.find(c => c.key === 'id');
  const nameCol = AVAILABLE_COLUMNS.find(c => c.key === 'name');
  const specCol = AVAILABLE_COLUMNS.find(c => c.key === 'spec');
  const skuCol = AVAILABLE_COLUMNS.find(c => c.key === 'sku');
  const pTypeCol = AVAILABLE_COLUMNS.find(c => c.key === 'product_type');
  const pkgTypeCol = AVAILABLE_COLUMNS.find(c => c.key === 'package_type_id');
  const versionCol = AVAILABLE_COLUMNS.find(c => c.key === 'version');
  const lifecycleCol = AVAILABLE_COLUMNS.find(c => c.key === 'lifecycle');

  assert.equal(getColumnRawValue(mockHardwareItem, idCol), 'po_hw_fritzbox_7630_purchase');
  assert.equal(getColumnRawValue(mockHardwareItem, nameCol), 'FRITZ!Box 7630 Purchase');
  assert.equal(getColumnRawValue(mockHardwareItem, specCol), 'FN_Hardware');
  assert.equal(getColumnRawValue(mockHardwareItem, skuCol), 'HW_FRITZ_7630');
  assert.equal(getColumnRawValue(mockHardwareItem, pTypeCol), 'Purchase');
  assert.equal(getColumnRawValue(mockHardwareItem, pkgTypeCol), 'Router');
  assert.equal(getColumnRawValue(mockHardwareItem, versionCol), '1.2');
  assert.equal(getColumnRawValue(mockHardwareItem, lifecycleCol), 'Launched');
});
