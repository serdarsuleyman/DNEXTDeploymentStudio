import test from 'node:test';
import assert from 'node:assert/strict';
import { isSalesPackageSpec, isOptionSpec, isHardwareSpec } from '../entityClassifiers.js';
import { evaluateJsonPath } from '../jsonPath.js';
import { extractNetworkType, extractPortfolioId, extractTemplateName } from '../../components/list-views/salesPackageColumnConfig.js';
import { extractOptionType } from '../../components/list-views/optionColumnConfig.js';

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

test('extractNetworkType correctly identifies DSL vs Fiber based on spec and fallback', () => {
  // DSL based on spec
  assert.equal(
    extractNetworkType({ productSpecification: { id: 'productSpecification_FN_SalesPackage_DSL' } }),
    'DSL'
  );
  assert.equal(
    extractNetworkType({ productSpecification: { name: 'DSL_Sales_Package_Specification' } }),
    'DSL'
  );

  // Fiber based on spec
  assert.equal(
    extractNetworkType({ productSpecification: { id: 'productSpecification_FN_SalesPackage_FTTH' } }),
    'Fiber'
  );
  assert.equal(
    extractNetworkType({ productSpecification: { name: 'VF_DE_Fiber_Broadband' } }),
    'Fiber'
  );

  // Fallback to offering name when spec is generic
  assert.equal(
    extractNetworkType({ productSpecification: { id: 'spec_sales_package' }, name: 'GigaZuhause 500 Glasfaser' }),
    'Fiber'
  );
  assert.equal(
    extractNetworkType({ productSpecification: { id: 'VF_DE_SALES_SPEC' }, name: 'GigaZuhause 100 DSL' }),
    'DSL'
  );
});

test('extractOptionType maps Bandwidth, Bandwidth/Tariff and derives other types from spec without option word', () => {
  // Bandwidth alone (no option word)
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_Bandwidth' }, name: 'Bandbreite 50 Mbit/s' }),
    'Bandwidth'
  );

  // Bandwidth/Tariff joined
  assert.equal(
    extractOptionType({
      productSpecification: { id: 'productSpecification_FN_Options_Bandwidth' },
      name: 'Bandbreite 50 Mbit/s Internet-Tarif IP527'
    }),
    'Bandwidth/Tariff'
  );

  // Derived from spec names with "option" word removed
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_VoiceTariff' } }),
    'Voice Tariff'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_VoiceAccess' } }),
    'Voice Access'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_RegionalService' } }),
    'Regional Service'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_AccessTechnology' } }),
    'Access Technology'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_ValueAdded' } }),
    'Value Added'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_FN_Options_Non-RecurringService' } }),
    'Non Recurring Service'
  );
  assert.equal(
    extractOptionType({ productSpecification: { id: 'productSpecification_CheckoutOption' } }),
    'Checkout'
  );
});

test('extractPortfolioId extracts portfolio_id from direct characteristic', () => {
  // Empty item
  assert.equal(extractPortfolioId(null), '');
  assert.equal(extractPortfolioId({}), '');

  // Direct characteristic in productOfferingCharacteristic with productOfferingCharacteristicValue
  assert.equal(
    extractPortfolioId({
      productOfferingCharacteristic: [
        {
          name: 'portfolio_id',
          productOfferingCharacteristicValue: [{ value: 'PF_2026_Q1_FIXED' }]
        }
      ]
    }),
    'PF_2026_Q1_FIXED'
  );

  // Direct characteristic with direct .value
  assert.equal(
    extractPortfolioId({
      raw: {
        productOfferingCharacteristic: [
          {
            name: 'portfolio_id',
            value: 'PORTFOLIO_DE_SUMMER'
          }
        ]
      }
    }),
    'PORTFOLIO_DE_SUMMER'
  );

  // Fallback to prodSpecCharValueUse
  assert.equal(
    extractPortfolioId({
      prodSpecCharValueUse: [
        {
          name: 'portfolio_id',
          productSpecCharacteristicValue: [{ value: 'FALLBACK_PID_001' }]
        }
      ]
    }),
    'FALLBACK_PID_001'
  );
});

test('buildSalesPackageOffering wires both prodSpecCharValueUse and direct productOfferingCharacteristic', async () => {
  const { buildSalesPackageOffering } = await import('../../services/salesPackageBuilderService.js');

  const formData = {
    name: 'GigaZuhause 1000 Kabel v2',
    id: 'po_gigazuhause_1000_kabel_v2',
    portfolio_id: 'PF_2026_Q1_FIXED',
    template_name: 'PO_GigaZuhause_100_Kabel:(version=1)',
    characteristics: [
      {
        id: 'speed_down',
        name: 'speed_down',
        value: '1000'
      },
      {
        id: 'speed_up',
        name: 'speed_up',
        values: ['50']
      }
    ],
    productOfferingCharacteristic: [
      {
        id: 'direct_char_promo',
        name: 'promo_code',
        valueType: 'string',
        productOfferingCharacteristicValue: [{ value: 'BLACK_FRIDAY_2026', isDefault: true }]
      }
    ]
  };

  const offering = buildSalesPackageOffering(formData, []);

  // Spec characteristics are mapped to prodSpecCharValueUse
  assert.ok(Array.isArray(offering.prodSpecCharValueUse));
  assert.equal(offering.prodSpecCharValueUse.length, 2);
  assert.equal(offering.prodSpecCharValueUse[0].name, 'speed_down');
  assert.equal(offering.prodSpecCharValueUse[0].productSpecCharacteristicValue[0].value, '1000');

  // Direct characteristics are mapped to productOfferingCharacteristic
  assert.ok(Array.isArray(offering.productOfferingCharacteristic));
  assert.equal(offering.productOfferingCharacteristic.length, 3);

  // 1. portfolio_id is wired as direct characteristic
  const portfolioChar = offering.productOfferingCharacteristic.find(c => c.name === 'portfolio_id');
  assert.ok(portfolioChar);
  assert.equal(portfolioChar.productOfferingCharacteristicValue[0].value, 'PF_2026_Q1_FIXED');

  // 2. template_name is wired as direct characteristic
  const templateChar = offering.productOfferingCharacteristic.find(c => c.name === 'template_name');
  assert.ok(templateChar);
  assert.equal(templateChar.productOfferingCharacteristicValue[0].value, 'PO_GigaZuhause_100_Kabel:(version=1)');

  // 3. promo_code is preserved as direct characteristic
  const promoChar = offering.productOfferingCharacteristic.find(c => c.name === 'promo_code');
  assert.ok(promoChar);
  assert.equal(promoChar.productOfferingCharacteristicValue[0].value, 'BLACK_FRIDAY_2026');
});

test('extractTemplateName extracts template_name from direct characteristic with version', () => {
  assert.equal(extractTemplateName(null), '');
  assert.equal(extractTemplateName({}), '');

  assert.equal(
    extractTemplateName({
      productOfferingCharacteristic: [
        {
          name: 'template_name',
          productOfferingCharacteristicValue: [{ value: 'PO_GigaZuhause_250_Kabel:(version=2)' }]
        }
      ]
    }),
    'PO_GigaZuhause_250_Kabel:(version=2)'
  );

  assert.equal(
    extractTemplateName({
      raw: {
        productOfferingCharacteristic: [
          {
            name: 'template_name',
            value: 'PO_GigaZuhause_50_DSL:(version=1)'
          }
        ]
      }
    }),
    'PO_GigaZuhause_50_DSL:(version=1)'
  );
});

test('extractPortfolioId extracts portfolio_id from direct characteristic and direct property', () => {
  assert.equal(extractPortfolioId(null), '');
  assert.equal(extractPortfolioId({}), '');

  // 1. Direct characteristic with values array
  assert.equal(
    extractPortfolioId({
      productOfferingCharacteristic: [
        {
          name: 'portfolio_id',
          values: ['PF_2026_TEST_ARRAY']
        }
      ]
    }),
    'PF_2026_TEST_ARRAY'
  );

  // 2. Direct characteristic with productOfferingCharacteristicValue
  assert.equal(
    extractPortfolioId({
      productOfferingCharacteristic: [
        {
          name: 'portfolio_id',
          productOfferingCharacteristicValue: [{ value: 'PF_2026_TEST_POCV', isDefault: true }]
        }
      ]
    }),
    'PF_2026_TEST_POCV'
  );

  // 3. Direct property fallback
  assert.equal(
    extractPortfolioId({
      portfolio_id: 'PF_DIRECT_PROP_123'
    }),
    'PF_DIRECT_PROP_123'
  );
});

test('createSalesPackageDeploymentEnvelope wires portfolio_id from productOfferingCharacteristic if not in formData.portfolio_id', async () => {
  const { createSalesPackageDeploymentEnvelope } = await import('../../services/salesPackageBuilderService.js');
  const envelope = createSalesPackageDeploymentEnvelope({
    code: 'TEST_PACKAGE_DIRECT_ONLY',
    name: 'Test Package Direct Only',
    technology: 'FIBRE',
    downstreamSpeed: 500,
    upstreamSpeed: 100,
    productOfferingCharacteristic: [
      {
        id: 'portfolio_id',
        name: 'portfolio_id',
        value: 'PF_FROM_DIRECT_CHARS',
        values: ['PF_FROM_DIRECT_CHARS']
      }
    ]
  });

  const offering = envelope.offering;
  const portfolioChar = offering.productOfferingCharacteristic?.find(c => c.name === 'portfolio_id');
  assert.ok(portfolioChar);
  assert.equal(portfolioChar.productOfferingCharacteristicValue[0].value, 'PF_FROM_DIRECT_CHARS');
});

test('createSalesPackageDeploymentEnvelope includes selected aawPacketId in bundlePop productOfferingPriceCharacteristic', async () => {
  const { createSalesPackageDeploymentEnvelope } = await import('../../services/salesPackageBuilderService.js');
  const envelope = createSalesPackageDeploymentEnvelope({
    id: 'po_test_pkg',
    name: 'Test Package',
    bundledPops: [
      {
        id: 'pop_test_bundle_1',
        name: 'Test Bundle POP',
        speed: 250,
        contractTerm: 24,
        playType: '2',
        connectionVariant: 'basic',
        aawPacketId: 'R025.5000000530-24'
      }
    ]
  });

  assert.equal(envelope.bundlePops.length, 1);
  const aawChar = envelope.bundlePops[0].productOfferingPriceCharacteristic?.find(c => c.name === 'psm_aaw_packet_id');
  assert.ok(aawChar);
  assert.equal(aawChar.productOfferingPriceCharacteristicValue[0].value, 'R025.5000000530-24');
});
