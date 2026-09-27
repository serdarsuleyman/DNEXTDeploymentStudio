/**
 * salesPackageEngine.js
 *
 * Declarative generator engine that transforms high-level commercial inputs
 * into complete, validated TMF 620 JSON file trees and registers them
 * directly into vodafone_catalog.db under deployment package `POC_V2`.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const { db, getTmfPackagesDir } = require('./db');
function getTmfV2Dir() {
  return path.join(getTmfPackagesDir(), 'TMFVersion2');
}

/**
 * Generates a deterministic UUID v4
 */
function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Standard Presets
 */
const PRESETS = [
  {
    id: 'preset_fiber_250',
    title: 'GigaZuhause 250 Glasfaser',
    name: 'GigaZuhause 250 Glasfaser',
    description: 'High-speed Fiber GPON portfolio with 250 Mbps down / 50 Mbps up',
    technology: 'FIBRE',
    downloadSpeed: 250,
    uploadSpeed: 50,
    targetPrice: 44.99,
    durations: [24, 18, 12],
    packageId: 'R025.5000000528',
    internetTariffCode: 'IP528',
    voiceTariffCode: 'VP528',
    bandwidthSkuCode: 'IG018',
    voiceFlatrateType: 'ALLNET_FLAT',
    includeKomfort: true,
    regioZoneClass: 'RZG00',
    regioFeePrice: 0.00,
    activationFeePrice: 49.99,
    activationSkuCode: 'V0083'
  },
  {
    id: 'preset_fiber_150',
    title: 'GigaZuhause Basic 150 Glasfaser',
    name: 'GigaZuhause Basic 150 Glasfaser',
    description: 'Entry Fiber GPON portfolio with 150 Mbps down / 75 Mbps up',
    technology: 'FIBRE',
    downloadSpeed: 150,
    uploadSpeed: 75,
    targetPrice: 39.99,
    durations: [24, 18, 12],
    packageId: 'R025.5000000527',
    internetTariffCode: 'IP527',
    voiceTariffCode: 'VP527',
    bandwidthSkuCode: 'IG017',
    voiceFlatrateType: 'ALLNET_FLAT',
    includeKomfort: true,
    regioZoneClass: 'RZG00',
    regioFeePrice: 0.00,
    activationFeePrice: 49.99,
    activationSkuCode: 'V0083'
  },
  {
    id: 'preset_dsl_100',
    title: 'GigaZuhause 100 DSL',
    name: 'GigaZuhause 100 DSL',
    description: 'VDSL2 Vectoring portfolio with 100 Mbps down / 40 Mbps up with certified fallbacks',
    technology: 'DSL',
    downloadSpeed: 100,
    uploadSpeed: 40,
    targetPrice: 44.99,
    durations: [24, 18, 12],
    packageId: 'R025.5000000075',
    internetTariffCode: 'IP075',
    voiceTariffCode: 'VP075',
    bandwidthSkuCode: 'V018M',
    voiceFlatrateType: 'ALLNET_FLAT',
    includeKomfort: true,
    regioZoneClass: 'RZG00',
    regioFeePrice: 0.00,
    activationFeePrice: 49.99,
    activationSkuCode: 'V0083',
    fallbackTiers: [
      { speed: 50, upload: 10, skuCode: 'V018H', name: 'DSL Bandbreite 50 Mbit/s' },
      { speed: 16, upload: 2.4, skuCode: 'V018C', name: 'DSL Bandbreite 16 Mbit/s' }
    ]
  },
  {
    id: 'preset_dsl_16',
    title: 'GigaZuhause 16 DSL',
    name: 'GigaZuhause 16 DSL',
    description: 'Standard ADSL2+ portfolio with 16 Mbps down / 2.4 Mbps up and copper fallbacks (6M, 3M, 2M, 1M)',
    technology: 'DSL',
    downloadSpeed: 16,
    uploadSpeed: 2.4,
    targetPrice: 34.99,
    durations: [24, 18, 12],
    packageId: 'R025.5000000073',
    internetTariffCode: 'IP073',
    voiceTariffCode: 'VP073',
    bandwidthSkuCode: 'V018C',
    voiceFlatrateType: 'ALLNET_FLAT',
    includeKomfort: true,
    regioZoneClass: 'RZG00',
    regioFeePrice: 0.00,
    activationFeePrice: 49.99,
    activationSkuCode: 'V0083',
    fallbackTiers: [
      { speed: 6, upload: 0.6, skuCode: 'V0178', name: 'DSL Bandbreite 6 Mbit/s' },
      { speed: 3, upload: 0.4, skuCode: 'V0175', name: 'DSL Bandbreite 3 Mbit/s' },
      { speed: 2, upload: 0.3, skuCode: 'V0174', name: 'DSL Bandbreite 2 Mbit/s' },
      { speed: 1, upload: 0.15, skuCode: 'V0118', name: 'DSL Bandbreite 1 Mbit/s' }
    ]
  }
];

function sanitizeIdentifier(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function sanitizeFolderName(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Core Generation Engine
 */
async function generateSalesPackage(config) {
  const name = config.name || config.title;
  const {
    technology = 'FIBRE',
    downloadSpeed = 150,
    uploadSpeed = 50,
    targetPrice = 39.99,
    durations = [24, 18, 12],
    packageId = `R025.5000000${Math.floor(100 + Math.random() * 900)}`,
    internetTariffCode = 'IP527',
    voiceTariffCode = 'VP527',
    bandwidthSkuCode = technology === 'FIBRE' ? 'IG017' : 'V018C',
    includeKomfort = true,
    fallbackTiers = [],
    regioZoneClass = 'RZG00',
    regioZoneName = regioZoneClass === 'RZG00' ? 'Standard (On-Net)' : `Regio Zone ${regioZoneClass}`,
    regioSkuCode = `${internetTariffCode}${regioZoneClass}`,
    activationSkuCode = `${internetTariffCode}V0083`
  } = config;

  if (!name) {
    throw new Error('Package name is required.');
  }

  const slug = sanitizeIdentifier(name);
  const folderName = sanitizeFolderName(name);
  const tmfV2Dir = getTmfV2Dir();
  const packageDir = path.join(tmfV2Dir, folderName);

  const offerDir = path.join(packageDir, 'offer');
  const bundlePopDir = path.join(packageDir, 'prices', 'bundle_pops');
  const subPopDir = path.join(packageDir, 'prices', 'sub_price_components');
  const upperSpecDir = path.join(tmfV2Dir, 'specifications');

  [offerDir, bundlePopDir, subPopDir, upperSpecDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const generatedFiles = [];

  // 1. Price Decomposition Engine (supports manual distribution or standard automatic defaults)
  const internetBasePrice = config.internetBasePrice !== undefined ? Number(config.internetBasePrice) : 24.99;
  const voicePrice = config.voicePrice !== undefined ? Number(config.voicePrice) : 5.00;
  const nominalBandwidthPrice = config.nominalBandwidthPrice !== undefined
    ? Number(config.nominalBandwidthPrice)
    : Math.max(0, +(targetPrice - internetBasePrice - voicePrice).toFixed(2));
  const voiceBasicPrice = config.voiceBasicPrice !== undefined ? Number(config.voiceBasicPrice) : 0.0;
  const voiceComfortPrice = config.voiceComfortPrice !== undefined ? Number(config.voiceComfortPrice) : 3.99;
  const regioFeePrice = config.regioFeePrice !== undefined ? Number(config.regioFeePrice) : 0.0;
  const activationFeePrice = config.activationFeePrice !== undefined ? Number(config.activationFeePrice) : 49.99;
  const fallbackPrices = config.fallbackPrices || {};

  // 2. Build Sub-Price Components (Simple POPs)

  // Sub-Price 1: Internet Tariff Component
  const internetSubPopId = `pop_comp_internet_tariff_${internetTariffCode.toLowerCase()}`;
  const internetSubPop = {
    id: internetSubPopId,
    name: `Internet Tariff Base (${internetTariffCode})`,
    version: '0',
    description: `Monthly recurring base fee for Internet Tariff ${internetTariffCode}`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    price: { unit: 'EUR', value: internetBasePrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' }
  };
  const internetSubPopPath = path.join(subPopDir, `${internetSubPopId}.json`);
  fs.writeFileSync(internetSubPopPath, JSON.stringify(internetSubPop, null, 2));
  generatedFiles.push({ path: internetSubPopPath, id: internetSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: internetSubPop.name });

  // Sub-Price 2: Nominal Bandwidth Component
  const techPrefix = technology === 'FIBRE' ? 'fiber' : 'dsl';
  const nominalBwSubPopId = `pop_comp_bandwidth_service_${techPrefix}_${downloadSpeed}m`;
  const nominalBwSubPop = {
    id: nominalBwSubPopId,
    name: `${technology === 'FIBRE' ? 'Glasfaser' : 'DSL'} Bandbreite ${downloadSpeed} Mbit/s`,
    version: '0',
    description: `Monthly recurring fee for ${downloadSpeed} Mbps download bandwidth tier`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    price: { unit: 'EUR', value: nominalBandwidthPrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    productOfferingPriceCharacteristic: [
      {
        id: generateUUID(),
        name: 'bandwith_sku_code',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: bandwidthSkuCode, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'bandwidth_option_name',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: `${technology === 'FIBRE' ? 'Glasfaser' : 'DSL'} Bandbreite ${downloadSpeed} Mbit/s`, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'downstream_max',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: String(downloadSpeed), valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'upstream_max',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: String(uploadSpeed), valueType: 'string', isDefault: true }]
      }
    ]
  };
  const nominalBwSubPopPath = path.join(subPopDir, `${nominalBwSubPopId}.json`);
  fs.writeFileSync(nominalBwSubPopPath, JSON.stringify(nominalBwSubPop, null, 2));
  generatedFiles.push({ path: nominalBwSubPopPath, id: nominalBwSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: nominalBwSubPop.name });

  // Sub-Price 2 (Fallbacks): Fallback Bandwidth Components if any
  const allBwTiers = [
    { speed: downloadSpeed, upload: uploadSpeed, skuCode: bandwidthSkuCode, subPopId: nominalBwSubPopId, name: nominalBwSubPop.name, isFallback: false }
  ];

  if (technology === 'DSL' && Array.isArray(fallbackTiers) && fallbackTiers.length > 0) {
    for (const fb of fallbackTiers) {
      const fbSubPopId = `pop_comp_bandwidth_service_${techPrefix}_${fb.speed}m`;
      const fbPrice = fallbackPrices[fb.speed] !== undefined
        ? Number(fallbackPrices[fb.speed])
        : (fb.price !== undefined ? Number(fb.price) : 0.0);

      const fbSubPop = {
        id: fbSubPopId,
        name: fb.name || `DSL Bandbreite ${fb.speed} Mbit/s`,
        version: '0',
        description: `Fallback monthly bandwidth service tier (${fb.speed} Mbps)`,
        lifecycleStatus: 'In study',
        "@baseType": 'ProductOfferingPrice',
        "@type": 'ProductOfferingPrice',
        isBundle: false,
        priceType: 'Recurring charge',
        recurringChargePeriodType: 'month',
        price: { unit: 'EUR', value: fbPrice },
        validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
        productOfferingPriceCharacteristic: [
          {
            id: generateUUID(),
            name: 'bandwith_sku_code',
            valueType: 'string',
            characteristicType: 'Choice',
            configurable: true,
            extensible: true,
            "@type": 'ProductOfferingPriceCharacteristic',
            productOfferingPriceCharacteristicValue: [{ value: fb.skuCode, valueType: 'string', isDefault: true }]
          },
          {
            id: generateUUID(),
            name: 'bandwidth_option_name',
            valueType: 'string',
            characteristicType: 'Choice',
            configurable: true,
            extensible: true,
            "@type": 'ProductOfferingPriceCharacteristic',
            productOfferingPriceCharacteristicValue: [{ value: fb.name || `DSL Bandbreite ${fb.speed} Mbit/s`, valueType: 'string', isDefault: true }]
          },
          {
            id: generateUUID(),
            name: 'downstream_max',
            valueType: 'string',
            characteristicType: 'Choice',
            configurable: true,
            extensible: true,
            "@type": 'ProductOfferingPriceCharacteristic',
            productOfferingPriceCharacteristicValue: [{ value: String(fb.speed), valueType: 'string', isDefault: true }]
          }
        ]
      };
      const fbSubPopPath = path.join(subPopDir, `${fbSubPopId}.json`);
      fs.writeFileSync(fbSubPopPath, JSON.stringify(fbSubPop, null, 2));
      generatedFiles.push({ path: fbSubPopPath, id: fbSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: fbSubPop.name });
      allBwTiers.push({ speed: fb.speed, upload: fb.upload, skuCode: fb.skuCode, subPopId: fbSubPopId, name: fbSubPop.name, isFallback: true });
    }
  }

  // Sub-Price 3: Voice Tariff Component
  const voiceSubPopId = `pop_comp_voice_tariff_${voiceTariffCode.toLowerCase()}`;
  const voiceSubPop = {
    id: voiceSubPopId,
    name: `Voice Tariff Component (${voiceTariffCode})`,
    version: '0',
    description: `Monthly recurring telephony plan fee (${voiceTariffCode})`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    price: { unit: 'EUR', value: voicePrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' }
  };
  const voiceSubPopPath = path.join(subPopDir, `${voiceSubPopId}.json`);
  fs.writeFileSync(voiceSubPopPath, JSON.stringify(voiceSubPop, null, 2));
  generatedFiles.push({ path: voiceSubPopPath, id: voiceSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: voiceSubPop.name });

  // Sub-Price 4: Voice Connection Components (Basis 0€ & Komfort 3.99€)
  const voiceBasicSubPopId = 'pop_comp_voice_connection_cbasic';
  const voiceBasicSubPop = {
    id: voiceBasicSubPopId,
    name: 'Basis-Anschluss Voice Connection',
    version: '0',
    description: 'Standard single-line voice connection (1 channel, 1 number)',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    price: { unit: 'EUR', value: voiceBasicPrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    productOfferingPriceCharacteristic: [
      {
        id: generateUUID(),
        name: 'voice_connection_type',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: 'C_basic', valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'channels_count',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: '1', valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'numbers_count',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: '1', valueType: 'string', isDefault: true }]
      }
    ]
  };
  const voiceBasicSubPopPath = path.join(subPopDir, `${voiceBasicSubPopId}.json`);
  fs.writeFileSync(voiceBasicSubPopPath, JSON.stringify(voiceBasicSubPop, null, 2));
  generatedFiles.push({ path: voiceBasicSubPopPath, id: voiceBasicSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: voiceBasicSubPop.name });

  let voiceComfortSubPopId = 'pop_comp_voice_connection_ccomfort';
  if (includeKomfort) {
    const voiceComfortSubPop = {
      id: voiceComfortSubPopId,
      name: 'Komfort-Anschluss Voice Connection',
      version: '0',
      description: 'ISDN multi-line voice connection (2 channels, up to 10 MSNs)',
      lifecycleStatus: 'In study',
      "@baseType": 'ProductOfferingPrice',
      "@type": 'ProductOfferingPrice',
      isBundle: false,
      priceType: 'Recurring charge',
      recurringChargePeriodType: 'month',
      price: { unit: 'EUR', value: voiceComfortPrice },
      validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
      productOfferingPriceCharacteristic: [
        {
          id: generateUUID(),
          name: 'voice_connection_type',
          valueType: 'string',
          characteristicType: 'Choice',
          configurable: true,
          extensible: true,
          "@type": 'ProductOfferingPriceCharacteristic',
          productOfferingPriceCharacteristicValue: [{ value: 'C_comfort', valueType: 'string', isDefault: true }]
        },
        {
          id: generateUUID(),
          name: 'tivano_sku',
          valueType: 'string',
          characteristicType: 'Choice',
          configurable: true,
          extensible: true,
          "@type": 'ProductOfferingPriceCharacteristic',
          productOfferingPriceCharacteristicValue: [{ value: 'YK004VI019VC', valueType: 'string', isDefault: true }]
        },
        {
          id: generateUUID(),
          name: 'channels_count',
          valueType: 'string',
          characteristicType: 'Choice',
          configurable: true,
          extensible: true,
          "@type": 'ProductOfferingPriceCharacteristic',
          productOfferingPriceCharacteristicValue: [{ value: '2', valueType: 'string', isDefault: true }]
        },
        {
          id: generateUUID(),
          name: 'numbers_count',
          valueType: 'string',
          characteristicType: 'Choice',
          configurable: true,
          extensible: true,
          "@type": 'ProductOfferingPriceCharacteristic',
          productOfferingPriceCharacteristicValue: [{ value: '10', valueType: 'string', isDefault: true }]
        }
      ]
    };

    const voiceComfortSubPopPath = path.join(subPopDir, `${voiceComfortSubPopId}.json`);
    fs.writeFileSync(voiceComfortSubPopPath, JSON.stringify(voiceComfortSubPop, null, 2));
    generatedFiles.push({ path: voiceComfortSubPopPath, id: voiceComfortSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: voiceComfortSubPop.name });
  }

  // Sub-Price 5: Regio Fee Component (Recurring)
  const regioSubPopId = `pop_comp_regio_fee_${internetTariffCode.toLowerCase()}_${regioZoneClass.toLowerCase()}`;
  const regioSubPop = {
    id: regioSubPopId,
    name: `Regio Fee Component (${regioZoneClass} - ${regioFeePrice > 0 ? regioFeePrice.toFixed(2) + '€' : '0.00€'})`,
    version: '0',
    description: `Monthly recurring regional surcharge fee (${regioZoneClass} - ${regioZoneName})`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    price: { unit: 'EUR', value: regioFeePrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    productOfferingPriceCharacteristic: [
      {
        id: generateUUID(),
        name: 'regio_class_sku',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: regioSkuCode, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'regio_zone_code',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: regioZoneClass, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'regio_zone_name',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: regioZoneName, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'access_supplier',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: 'DTAG', valueType: 'string', isDefault: true }]
      }
    ]
  };
  const regioSubPopPath = path.join(subPopDir, `${regioSubPopId}.json`);
  fs.writeFileSync(regioSubPopPath, JSON.stringify(regioSubPop, null, 2));
  generatedFiles.push({ path: regioSubPopPath, id: regioSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: regioSubPop.name });

  // Sub-Price 6: Activation Fee Component (One-Time Provisioning Fee)
  const activationSubPopId = `pop_comp_activation_fee_${internetTariffCode.toLowerCase()}_v0083`;
  const activationSubPop = {
    id: activationSubPopId,
    name: `Bereitstellungsentgelt Activation Fee (V0083 - ${activationFeePrice > 0 ? activationFeePrice.toFixed(2) + '€' : '0.00€ Waiver'})`,
    version: '0',
    description: `One-time initial provisioning and line activation charge (V0083)`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'One time charge',
    price: { unit: 'EUR', value: activationFeePrice },
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    productOfferingPriceCharacteristic: [
      {
        id: generateUUID(),
        name: 'activation_sku_code',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: activationSkuCode, valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'tivano_option_sku',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: 'V0083', valueType: 'string', isDefault: true }]
      },
      {
        id: generateUUID(),
        name: 'fee_type',
        valueType: 'string',
        characteristicType: 'Choice',
        configurable: true,
        extensible: true,
        "@type": 'ProductOfferingPriceCharacteristic',
        productOfferingPriceCharacteristicValue: [{ value: 'OneTimeProvisioning', valueType: 'string', isDefault: true }]
      }
    ]
  };
  const activationSubPopPath = path.join(subPopDir, `${activationSubPopId}.json`);
  fs.writeFileSync(activationSubPopPath, JSON.stringify(activationSubPop, null, 2));
  generatedFiles.push({ path: activationSubPopPath, id: activationSubPopId, type: 'ProductOfferingPrice', offerType: 'PriceComponent', name: activationSubPop.name });

  // 3. Generate Parent Bundle POPs (1 per Bandwidth Tier × Voice Connection)
  // Aggregates strictly 6 atomic simple prices (No simple POP per offering term)
  const bundlePops = [];
  for (const bw of allBwTiers) {
    // A. Basis-Anschluss Bundle POP
    const bundleBasicId = `pop_bundle_${slug}_bw${bw.speed}_cbasic`;
    const bundleBasic = {
      id: bundleBasicId,
      name: `${name} Monthly Price (${bw.speed}M ${bw.isFallback ? 'Fallback' : 'Nominal'} + Basis-Anschluss)`,
      version: '0',
      description: `Composite monthly price container aggregating 6 atomic sub-prices (Bandwidth, Voice Access, Regio Fee, Activation Fee, Internet Tariff Base, Voice Tariff) for ${name} (${bw.speed}M Basis)`,
      lifecycleStatus: 'In study',
      "@baseType": 'ProductOfferingPrice',
      "@type": 'ProductOfferingPrice',
      "@schemaLocation": '/api/productCatalogManagement/v4/schema/bundledproductofferingprice.json',
      isBundle: true,
      validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
      bundledPopRelationship: [
        { id: internetSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${internetSubPopId}:(version=0)`, name: internetSubPop.name, version: '0' },
        { id: bw.subPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${bw.subPopId}:(version=0)`, name: bw.name, version: '0' },
        { id: voiceSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${voiceSubPopId}:(version=0)`, name: voiceSubPop.name, version: '0' },
        { id: voiceBasicSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${voiceBasicSubPopId}:(version=0)`, name: voiceBasicSubPop.name, version: '0' },
        { id: regioSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${regioSubPopId}:(version=0)`, name: regioSubPop.name, version: '0' },
        { id: activationSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${activationSubPopId}:(version=0)`, name: activationSubPop.name, version: '0' }
      ]
    };
    const bundleBasicPath = path.join(bundlePopDir, `${bundleBasicId}.json`);
    fs.writeFileSync(bundleBasicPath, JSON.stringify(bundleBasic, null, 2));
    generatedFiles.push({ path: bundleBasicPath, id: bundleBasicId, type: 'BundledProductOfferingPrice', offerType: 'BundlePOP', name: bundleBasic.name });
    bundlePops.push(bundleBasic);

    // B. Komfort-Anschluss Bundle POP
    if (includeKomfort) {
      const bundleComfortId = `pop_bundle_${slug}_bw${bw.speed}_ccomfort`;
      const bundleComfort = {
        id: bundleComfortId,
        name: `${name} Monthly Price (${bw.speed}M ${bw.isFallback ? 'Fallback' : 'Nominal'} + Komfort-Anschluss)`,
        version: '0',
        description: `Composite monthly price container aggregating 6 atomic sub-prices (Bandwidth, Voice Access, Regio Fee, Activation Fee, Internet Tariff Base, Voice Tariff) for ${name} (${bw.speed}M Komfort)`,
        lifecycleStatus: 'In study',
        "@baseType": 'ProductOfferingPrice',
        "@type": 'ProductOfferingPrice',
        "@schemaLocation": '/api/productCatalogManagement/v4/schema/bundledproductofferingprice.json',
        isBundle: true,
        validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
        bundledPopRelationship: [
          { id: internetSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${internetSubPopId}:(version=0)`, name: internetSubPop.name, version: '0' },
          { id: bw.subPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${bw.subPopId}:(version=0)`, name: bw.name, version: '0' },
          { id: voiceSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${voiceSubPopId}:(version=0)`, name: voiceSubPop.name, version: '0' },
          { id: voiceComfortSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${voiceComfortSubPopId}:(version=0)`, name: 'Komfort-Anschluss Voice Connection', version: '0' },
          { id: regioSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${regioSubPopId}:(version=0)`, name: regioSubPop.name, version: '0' },
          { id: activationSubPopId, href: `/api/productCatalogManagement/v4/productOfferingPrice/${activationSubPopId}:(version=0)`, name: activationSubPop.name, version: '0' }
        ]
      };
      const bundleComfortPath = path.join(bundlePopDir, `${bundleComfortId}.json`);
      fs.writeFileSync(bundleComfortPath, JSON.stringify(bundleComfort, null, 2));
      generatedFiles.push({ path: bundleComfortPath, id: bundleComfortId, type: 'BundledProductOfferingPrice', offerType: 'BundlePOP', name: bundleComfort.name });
      bundlePops.push(bundleComfort);
    }
  }

  // 4. Generate Consolidated Master Product Specification (placed at upper level scratch/TMFVersion2/specifications)
  const specId = 'spec_sales_package';
  const spec = {
    id: specId,
    name: 'VF_DE_SALES_SPEC',
    version: '0',
    description: 'Vodafone Germany Fixed-Net Sales Package Master Specification',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductSpecification',
    "@type": 'ProductSpecification',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productspecification.json',
    isBundle: false,
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    productSpecCharacteristic: [
      { id: generateUUID(), name: 'Package_ID', valueType: 'string', configurable: false, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'PackageName', valueType: 'string', configurable: false, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'Technology', valueType: 'string', configurable: false, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'InternetTariffCode', valueType: 'string', configurable: false, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'VoiceTariffCode', valueType: 'string', configurable: false, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'BandwidthDownstreamMax', valueType: 'string', configurable: true, "@type": 'ProductSpecCharacteristic' },
      { id: generateUUID(), name: 'BandwidthUpstreamMax', valueType: 'string', configurable: true, "@type": 'ProductSpecCharacteristic' },
      {
        id: generateUUID(),
        name: 'ContractDuration',
        valueType: 'string',
        configurable: true,
        minCardinality: 1,
        maxCardinality: 1,
        "@type": 'ProductSpecCharacteristic',
        productSpecCharacteristicValue: [
          { value: '24', valueType: 'string', isDefault: true, unitOfMeasure: 'month' },
          { value: '18', valueType: 'string', isDefault: false, unitOfMeasure: 'month' },
          { value: '12', valueType: 'string', isDefault: false, unitOfMeasure: 'month' }
        ]
      }
    ]
  };
  const specPath = path.join(upperSpecDir, `${specId}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  generatedFiles.push({ path: specPath, id: specId, type: 'ProductSpecification', offerType: 'Specification', name: spec.name });

  // 5. Generate Product Offering
  const offerId = `offering_${slug}`;
  const offeringTerms = durations.map(d => ({
    name: `${d} Months Contract Commitment`,
    description: d === 18 ? '18-month minimum contract term (Wechselgarantie)' : `${d}-month minimum contract term`,
    duration: { amount: d, units: 'month' }
  }));

  const offerCategoryList = technology === 'FIBRE'
    ? [
        { id: 'FN186', name: 'Fibre Package FIBRE', version: '0', href: '/api/productCatalogManagement/v4/category/FN186:(version=0)', "@referredType": 'Category' },
        { id: 'FN0505', name: 'GigaZuhause Basic Glasfaser', version: '0', href: '/api/productCatalogManagement/v4/category/FN0505:(version=0)', "@referredType": 'Category' },
        { id: 'FN0507', name: 'Fibre Package GPON', version: '0', href: '/api/productCatalogManagement/v4/category/FN0507:(version=0)', "@referredType": 'Category' },
        { id: 'FN155', name: 'DSL_total', version: '0', href: '/api/productCatalogManagement/v4/category/FN155:(version=0)', "@referredType": 'Category' },
        { id: 'FN0515', name: 'SalesPackages less than 39,99 Euro', version: '0', href: '/api/productCatalogManagement/v4/category/FN0515:(version=0)', "@referredType": 'Category' }
      ]
    : [
        { id: 'FN155', name: 'DSL_total', version: '0', href: '/api/productCatalogManagement/v4/category/FN155:(version=0)', "@referredType": 'Category' },
        { id: 'FN76', name: 'DSL Package', version: '0', href: '/api/productCatalogManagement/v4/category/FN76:(version=0)', "@referredType": 'Category' },
        { id: 'FN74', name: 'Double Play Package', version: '0', href: '/api/productCatalogManagement/v4/category/FN74:(version=0)', "@referredType": 'Category' },
        { id: 'FN0515', name: 'SalesPackages less than 39,99 Euro', version: '0', href: '/api/productCatalogManagement/v4/category/FN0515:(version=0)', "@referredType": 'Category' },
        { id: 'FN0552', name: 'DSL 10/25', version: '0', href: '/api/productCatalogManagement/v4/category/FN0552:(version=0)', "@referredType": 'Category' }
      ];

  const offeringPopRefs = bundlePops.map(bp => ({
    id: bp.id,
    name: bp.name,
    href: `/api/productCatalogManagement/v4/productOfferingPrice/${bp.id}:(version=0)`,
    "@referredType": 'ProductOfferingPrice'
  }));

  const offering = {
    id: offerId,
    name: name,
    version: '0',
    description: `${name} broadband internet and telephony flatrate package`,
    lifecycleStatus: 'In study',
    validFor: { startDateTime: '2025-10-26T00:00:00.000Z' },
    "@baseType": 'ProductOffering',
    "@type": 'ProductOffering',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productoffering.json',
    isBundle: false,
    isSellable: true,
    productSpecification: {
      id: specId,
      name: 'VF_DE_SALES_SPEC',
      version: '0',
      href: `/api/productCatalogManagement/v4/productSpecification/${specId}:(version=0)`,
      "@referredType": 'ProductSpecification'
    },
    category: offerCategoryList,
    productOfferingTerm: offeringTerms,
    productOfferingPrice: offeringPopRefs,
    prodSpecCharValueUse: [
      { id: generateUUID(), name: 'Package_ID', valueType: 'string', configurable: false, mandatory: true, productSpecCharacteristicValue: [{ value: packageId, isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'PackageName', valueType: 'string', configurable: false, mandatory: true, productSpecCharacteristicValue: [{ value: name, isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'Technology', valueType: 'string', configurable: false, mandatory: true, productSpecCharacteristicValue: [{ value: technology === 'FIBRE' ? 'Fiber/GPON' : 'DSL/ADSL2+', isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'InternetTariffCode', valueType: 'string', configurable: false, productSpecCharacteristicValue: [{ value: internetTariffCode, isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'VoiceTariffCode', valueType: 'string', configurable: false, productSpecCharacteristicValue: [{ value: voiceTariffCode, isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'BandwidthDownstreamMax', valueType: 'string', configurable: true, productSpecCharacteristicValue: [{ value: String(downloadSpeed), isDefault: true, valueType: 'string' }] },
      { id: generateUUID(), name: 'BandwidthUpstreamMax', valueType: 'string', configurable: true, productSpecCharacteristicValue: [{ value: String(uploadSpeed), isDefault: true, valueType: 'string' }] },
      {
        id: generateUUID(),
        name: 'ContractDuration',
        valueType: 'string',
        configurable: true,
        minCardinality: 1,
        maxCardinality: 1,
        "@type": 'ProductSpecificationCharacteristicValueUse',
        productSpecCharacteristicValue: durations.map((d, idx) => ({
          value: String(d),
          valueType: 'string',
          isDefault: idx === 0,
          unitOfMeasure: 'month'
        }))
      }
    ]
  };

  const offerPath = path.join(offerDir, `${offerId}.json`);
  fs.writeFileSync(offerPath, JSON.stringify(offering, null, 2));
  generatedFiles.push({ path: offerPath, id: offerId, type: 'ProductOffering', offerType: 'SalesPackage', name: offering.name });

  // 6. Direct Database Sync to POC_V2
  await syncToDatabase(generatedFiles);

  return {
    success: true,
    packageName: name,
    folderName,
    packagePath: packageDir,
    totalEntitiesGenerated: generatedFiles.length,
    offeringId: offerId,
    bundlePopCount: bundlePops.length,
    subPriceCount: generatedFiles.filter(f => f.offerType === 'PriceComponent').length,
    files: generatedFiles
  };
}

/**
 * Database Synchronization Helper
 */
function syncToDatabase(files) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    db.serialize(() => {
      db.run(
        `INSERT INTO dnext_deployment_package (id, name, type, description, file_path, created_at, updated_at)
         VALUES ('POC_V2', 'Vodafone POC V2 (TMF 620 Standard)', 'POC', 'Standardized TMF 620 Commercial Bundle Packages', 'tmf_packages/TMFVersion2', ?, ?)
         ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at, file_path = COALESCE(dnext_deployment_package.file_path, 'tmf_packages/TMFVersion2')`,
        [now, now]
      );

      const stmt = db.prepare(`
        INSERT INTO dnext_deployment_item
          (dnext_entity_id, dnext_entity_type, dnext_version, vf_de_offer_id, vf_de_offer_type,
           sync_status, file_path, entity_name, deployment_package_id, created_at, updated_at)
        VALUES (?, ?, '0', ?, ?, 'pending', ?, ?, 'POC_V2', ?, ?)
        ON CONFLICT(dnext_entity_id) DO UPDATE SET
          dnext_entity_type = excluded.dnext_entity_type,
          dnext_version = '0',
          vf_de_offer_id = excluded.vf_de_offer_id,
          vf_de_offer_type = excluded.vf_de_offer_type,
          file_path = excluded.file_path,
          entity_name = excluded.entity_name,
          deployment_package_id = 'POC_V2',
          updated_at = excluded.updated_at
      `);

      for (const item of files) {
        const relPath = path.relative(ROOT, item.path).replace(/\\/g, '/');
        stmt.run([
          item.id,
          item.type,
          item.id,
          item.offerType,
          relPath,
          item.name,
          now,
          now
        ]);
      }

      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

module.exports = {
  generateSalesPackage,
  PRESETS
};
