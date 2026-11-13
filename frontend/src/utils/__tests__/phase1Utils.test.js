import test from 'node:test';
import assert from 'node:assert/strict';
import { isSalesPackageSpec, isOptionSpec, isHardwareSpec } from '../entityClassifiers.js';
import { evaluateJsonPath } from '../jsonPath.js';

test('isSalesPackageSpec detects sales package specifications', () => {
  assert.equal(isSalesPackageSpec(null), false);
  assert.equal(
    isSalesPackageSpec({ entityType: 'ProductOffering', productSpecification: { id: 'VF_DE_SPEC_SALES_PACKAGE' } }),
    true
  );
  assert.equal(
    isSalesPackageSpec({ entityType: 'ProductOffering', raw: { productSpecification: { name: 'productspecification_fn_salespackage_ftth' } } }),
    true
  );
  assert.equal(
    isSalesPackageSpec({ entityType: 'ProductOffering', productSpecification: { id: 'spec_option_voice' } }),
    false
  );
});

test('isOptionSpec detects option ProductOfferings only', () => {
  assert.equal(
    isOptionSpec({ entityType: 'ProductOffering', productSpecification: { name: 'FN_Option_Voice' } }),
    true
  );
  assert.equal(
    isOptionSpec({ entityType: 'Category', productSpecification: { name: 'Option' } }),
    false
  );
});

test('isHardwareSpec detects hardware by spec or characteristic', () => {
  assert.equal(
    isHardwareSpec({ entityType: 'ProductOffering', productSpecification: { id: 'productSpecification_FN_Hardware' } }),
    true
  );
  assert.equal(
    isHardwareSpec({
      entityType: 'ProductOffering',
      prodSpecCharValueUse: [{ name: 'productFamilyName', productSpecCharacteristicValue: [{ value: 'FN_Hardware' }] }]
    }),
    true
  );
  assert.equal(
    isHardwareSpec({ entityType: 'ProductOffering', productSpecification: { id: 'VF_DE_SPEC_SALES_PACKAGE' } }),
    false
  );
});

test('evaluateJsonPath resolves dot paths, predicates, and fallbacks', () => {
  const item = {
    id: 'po_1',
    raw: {
      id: 'po_1',
      name: 'GigaZuhause 250',
      prodSpecCharValueUse: [
        {
          name: 'tariff_code_internet',
          productSpecCharacteristicValue: [{ value: 'IP528' }, { value: 'IP529' }]
        }
      ]
    }
  };

  assert.equal(evaluateJsonPath(item, '$.name'), 'GigaZuhause 250');
  assert.equal(
    evaluateJsonPath(item, '$.prodSpecCharValueUse[?(@.name=="tariff_code_internet")].productSpecCharacteristicValue[*].value'),
    'IP528, IP529'
  );
  assert.equal(
    evaluateJsonPath(item, '$.missingField || $.id'),
    'po_1'
  );
  assert.equal(evaluateJsonPath(null, '$.id'), null);
});
