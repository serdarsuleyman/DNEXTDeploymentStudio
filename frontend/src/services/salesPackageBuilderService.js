/**
 * salesPackageBuilderService.js
 *
 * Dedicated service module for constructing Vodafone DNEXT Sales Packages,
 * composite Bundle POPs, atomic Simple POPs (_bw, _in, _va, _vt), and the
 * synchronous TM Forum 620 deployment envelope.
 */

// Helper to normalize and ensure _v2 suffix on package code
export function normalizePackageCodeV2(code = '') {
  if (!code || typeof code !== 'string') return 'pkg_v2';
  const clean = code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return /_v2$/i.test(clean) ? clean : `${clean}_v2`;
}

/**
 * Builds the canonical Bundle POP ID following the Vodafone standard:
 * e.g. pop_dsl_16_v2_bundle_mcd0_pt2_comfort_6
 */
export function buildBundlePopId({
  packageCode = '',
  speed = 100,
  term = 24,
  playType = '2',
  variant = 'basic'
}) {
  const normPkg = normalizePackageCodeV2(packageCode);
  const cleanVariant = (variant || 'basic').toLowerCase().trim();
  const cleanSpeed = String(speed || 100).trim();
  const cleanTerm = String(term !== undefined ? term : 24).trim();
  const cleanPt = String(playType || '2').trim();

  // Strip leading 'po_' or 'pop_' if already present in packageCode for clean assembly
  const pkgBase = normPkg.replace(/^(po_|pop_)/i, '');

  return `pop_${pkgBase}_bundle_mcd${cleanTerm}_pt${cleanPt}_${cleanVariant}_${cleanSpeed}`;
}

/**
 * Builds the 4 Atomic Simple POPs (_bw, _in, _va, _vt) for a given Bundle POP.
 * Each Simple POP represents a single constituent price component.
 */
export function buildAtomicSimplePops(bundlePopId, popData = {}, formData = {}) {
  const now = new Date().toISOString();
  const currency = formData.currency || 'EUR';
  const speed = popData.speed || formData.downstreamSpeed || 100;
  const uploadSpeed = formData.upstreamSpeed || Math.round(Number(speed) * 0.2) || 20;
  const variant = (popData.connectionVariant || 'basic').toLowerCase();
  const isComfort = variant === 'comfort';

  const cleanCode = (v) => (v && v !== '-' ? String(v).trim() : '');

  // Helper to extract characteristic value from parent formData characteristics
  const getChar = (name) => {
    const ch = (formData.characteristics || []).find(c => c.name === name || c.id === name);
    if (!ch) return '';
    if (Array.isArray(ch.values) && ch.values.length > 0) return String(ch.values[0]);
    if (ch.value !== undefined && ch.value !== null && ch.value !== '') return String(ch.value);
    if (Array.isArray(ch.productSpecCharacteristicValue) && ch.productSpecCharacteristicValue.length > 0) {
      return String(ch.productSpecCharacteristicValue[0]?.value || ch.productSpecCharacteristicValue[0] || '');
    }
    return '';
  };

  // Helper to build TM Forum ProductOfferingPriceCharacteristic
  const makePopChar = (name, val, extra = {}) => ({
    id: extra.id || name,
    name,
    valueType: 'string',
    characteristicType: 'Choice',
    configurable: true,
    extensible: true,
    "@type": 'ProductOfferingPriceCharacteristic',
    productOfferingPriceCharacteristicValue: [
      {
        value: String(val !== undefined && val !== null ? val : ''),
        valueType: 'string',
        isDefault: true,
        ...(extra.unitOfMeasure ? { unitOfMeasure: extra.unitOfMeasure } : {})
      }
    ]
  });

  // Helper to build TM Forum ProductSpecificationCharacteristicValueUse
  const makeCharUse = (name, val, extra = {}) => ({
    name,
    valueType: 'string',
    productSpecCharacteristicValue: [
      {
        value: String(val !== undefined && val !== null ? val : ''),
        isDefault: true,
        ...(extra.unitOfMeasure ? { unitOfMeasure: extra.unitOfMeasure } : {})
      }
    ]
  });

  // Resolve PSM packet codes (prioritizing row-level edits, then parent characteristics)
  const psmInternetNgn = cleanCode(popData.psmNgn || popData.psmInternetNgn || popData.ngn?.salesPacketCode) || cleanCode(getChar('psm_sales_packet_code_internet_ngn')) || cleanCode(getChar('psm_sales_packet_code'));
  const psmInternetBs = cleanCode(popData.psmBitstream || popData.psmInternetBitstream || popData.bitstream?.salesPacketCode) || cleanCode(getChar('psm_sales_packet_code_internet_bitstream')) || cleanCode(getChar('psm_sales_packet_code'));
  const psmVoiceNgn = cleanCode(popData.psmNgn || popData.psmVoiceNgn || popData.ngn?.salesPacketCode) || cleanCode(getChar('psm_sales_packet_code_voice_ngn')) || cleanCode(getChar('psm_sales_packet_code'));
  const psmVoiceBs = cleanCode(popData.psmBitstream || popData.psmVoiceBitstream || popData.bitstream?.salesPacketCode) || cleanCode(getChar('psm_sales_packet_code_voice_bitstream')) || cleanCode(getChar('psm_sales_packet_code'));

  // Resolve Tariff codes (prioritizing row-level edits, then parent characteristics)
  const tariffInternetNgn = cleanCode(popData.tariffInternetNgn || popData.tariffInternet || getChar('tariff_code_internet_ngn') || getChar('tariff_code_internet')) || 'IP077';
  const tariffInternetBs = cleanCode(popData.tariffInternetBitstream || popData.tariffInternet || getChar('tariff_code_internet_bitstream') || getChar('tariff_code_internet')) || 'IP077';
  const tariffVoiceNgn = cleanCode(popData.tariffVoiceNgn || popData.tariffVoice || getChar('tariff_code_voice_ngn') || getChar('tariff_code_voice')) || 'VP077';
  const tariffVoiceBs = cleanCode(popData.tariffVoiceBitstream || popData.tariffVoice || getChar('tariff_code_voice_bitstream') || getChar('tariff_code_voice')) || 'VP077';

  // Resolve Product codes
  const prodInternetNgn = formData.productCodeNgn || getChar('product_code_internet_ngn') || 'I1204';
  const prodInternetBs = formData.productCodeBitstream || getChar('product_code_internet_bitstream') || getChar('product_code_internet') || 'I1203';
  const prodVoiceNgn = (formData.isVoiceNgnSupported !== false && formData.voiceProductCodeNgn)
    ? formData.voiceProductCodeNgn
    : (getChar('product_code_voice_ngn') || 'VI204');
  const prodVoiceBs = (formData.isVoiceBitstreamSupported !== false && formData.voiceProductCodeBitstream)
    ? formData.voiceProductCodeBitstream
    : (getChar('product_code_voice_bitstream') || getChar('product_code_voice') || 'VI203');

  // Resolve Bandwidth Service ID / OSM Code
  const svcBw = popData.bandwidthServiceId || popData.svcBw || formData.ccbBandwidthSku || (Number(speed) >= 250 ? 'V018V' : Number(speed) >= 100 ? 'V018N' : Number(speed) >= 50 ? 'V018H' : 'V018C');

  // Resolve service codes for access & telephony
  const svcIn = popData.svcIn || 'V0017';
  const svcVaNgn = popData.svcVaNgn || (isComfort ? 'VI003' : 'VI002');
  const svcVaBs = popData.svcVaBitstream || (isComfort ? 'VI006' : 'VI009');
  const svcVt = popData.svcVt || 'V0017';

  // Play Type & telephony settings
  const playTypeVal = String(popData.playType || (formData.isDoublePlay ? '2' : '1'));
  const isPlay1 = playTypeVal === '1';
  const voiceConnType = isComfort ? 'C_comfort' : 'C_basic';
  const channelsCount = isComfort ? '2' : '1';
  const numbersCount = isComfort ? '10' : '1';

  // Component prices calculation & rebalancing
  const totalPrice = Number(popData.totalPrice !== undefined && popData.totalPrice !== null ? popData.totalPrice : (popData.price !== undefined && popData.price !== null ? popData.price : 44.99));
  const inPrice = popData.popInternetAmount !== undefined ? Number(popData.popInternetAmount) : 14.00;
  const vaPrice = popData.popVoiceAccessAmount !== undefined ? Number(popData.popVoiceAccessAmount) : (isPlay1 ? 0.00 : (isComfort ? 19.98 : 15.99));
  const vtPrice = popData.popVoiceTariffAmount !== undefined ? Number(popData.popVoiceTariffAmount) : (isPlay1 ? 0.00 : 5.00);
  const bwPrice = popData.popBandwidthAmount !== undefined ? Number(popData.popBandwidthAmount) : Math.max(0, Number((totalPrice - (inPrice + vaPrice + vtPrice)).toFixed(2)));

  // 1. Bandwidth Option (_bw)
  const bwId = `${bundlePopId}_bw`;
  const bwCharList = [
    makePopChar('bandwidth_option_name', `Bandbreite ${speed} Mbit/s`),
    makePopChar('bandwidth', String(speed)),
    makePopChar('downstream_max', String(speed), { unitOfMeasure: 'Mbps' }),
    makePopChar('upstream_max', String(uploadSpeed), { unitOfMeasure: 'Mbps' }),
    makePopChar('connection_type', variant),
    makePopChar('play_type', playTypeVal),
    makePopChar('bandwith_sku_code', svcBw),
    makePopChar('service_code_internet_ngn', svcBw),
    makePopChar('service_code_internet_bitstream', svcBw),
    makePopChar('product_code_internet_ngn', prodInternetNgn),
    makePopChar('product_code_internet_bitstream', prodInternetBs),
    makePopChar('tariff_code_internet_ngn', tariffInternetNgn),
    makePopChar('tariff_code_internet_bitstream', tariffInternetBs)
  ];
  const bwCharUseList = [
    makeCharUse('bandwidth_option_name', `Bandbreite ${speed} Mbit/s`),
    makeCharUse('bandwidth', String(speed)),
    makeCharUse('downstream_max', String(speed), { unitOfMeasure: 'Mbps' }),
    makeCharUse('upstream_max', String(uploadSpeed), { unitOfMeasure: 'Mbps' }),
    makeCharUse('connection_type', variant),
    makeCharUse('play_type', playTypeVal),
    makeCharUse('bandwith_sku_code', svcBw),
    makeCharUse('service_code_internet_ngn', svcBw),
    makeCharUse('service_code_internet_bitstream', svcBw),
    makeCharUse('product_code_internet_ngn', prodInternetNgn),
    makeCharUse('product_code_internet_bitstream', prodInternetBs),
    makeCharUse('tariff_code_internet_ngn', tariffInternetNgn),
    makeCharUse('tariff_code_internet_bitstream', tariffInternetBs)
  ];
  if (psmInternetNgn) {
    bwCharList.push(makePopChar('psm_sales_packet_code_internet_ngn', psmInternetNgn));
    bwCharUseList.push(makeCharUse('psm_sales_packet_code_internet_ngn', psmInternetNgn));
  }
  if (psmInternetBs) {
    bwCharList.push(makePopChar('psm_sales_packet_code_internet_bitstream', psmInternetBs));
    bwCharUseList.push(makeCharUse('psm_sales_packet_code_internet_bitstream', psmInternetBs));
  }

  const simplePopBw = {
    id: bwId,
    name: bwId,
    description: `Bandwidth Option fee for ${speed} Mbit/s downstream (${svcBw})`,
    version: '0',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    recurringChargePeriodLength: 1,
    price: {
      unit: currency,
      value: bwPrice
    },
    validFor: {
      startDateTime: now
    },
    productOfferingPriceCharacteristic: bwCharList,
    prodSpecCharValueUse: bwCharUseList
  };

  // 2. Internet Access Baseline (_in)
  const inId = `${bundlePopId}_in`;
  const inTariffDisplay = tariffInternetNgn || tariffInternetBs;
  const inCharList = [
    makePopChar('bandwidth', String(speed)),
    makePopChar('connection_type', variant),
    makePopChar('play_type', playTypeVal),
    makePopChar('playType', playTypeVal),
    makePopChar('tariff_internet', inTariffDisplay),
    makePopChar('tariff_code_internet_ngn', tariffInternetNgn),
    makePopChar('tariff_code_internet_bitstream', tariffInternetBs),
    makePopChar('product_code_internet_ngn', prodInternetNgn),
    makePopChar('product_code_internet_bitstream', prodInternetBs),
    makePopChar('service_code_in', svcIn),
    makePopChar('service_code_internet_ngn', svcIn),
    makePopChar('service_code_internet_bitstream', svcIn)
  ];
  const inCharUseList = [
    makeCharUse('bandwidth', String(speed)),
    makeCharUse('connection_type', variant),
    makeCharUse('play_type', playTypeVal),
    makeCharUse('playType', playTypeVal),
    makeCharUse('tariff_internet', inTariffDisplay),
    makeCharUse('tariff_code_internet_ngn', tariffInternetNgn),
    makeCharUse('tariff_code_internet_bitstream', tariffInternetBs),
    makeCharUse('product_code_internet_ngn', prodInternetNgn),
    makeCharUse('product_code_internet_bitstream', prodInternetBs),
    makeCharUse('service_code_in', svcIn),
    makeCharUse('service_code_internet_ngn', svcIn),
    makeCharUse('service_code_internet_bitstream', svcIn)
  ];
  if (psmInternetNgn) {
    inCharList.push(makePopChar('psm_sales_packet_code_internet_ngn', psmInternetNgn));
    inCharUseList.push(makeCharUse('psm_sales_packet_code_internet_ngn', psmInternetNgn));
  }
  if (psmInternetBs) {
    inCharList.push(makePopChar('psm_sales_packet_code_internet_bitstream', psmInternetBs));
    inCharUseList.push(makeCharUse('psm_sales_packet_code_internet_bitstream', psmInternetBs));
  }

  const simplePopIn = {
    id: inId,
    name: inId,
    description: `Internet Access baseline fee for tariff ${inTariffDisplay} (${svcIn})`,
    version: '0',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    recurringChargePeriodLength: 1,
    price: {
      unit: currency,
      value: inPrice
    },
    validFor: {
      startDateTime: now
    },
    productOfferingPriceCharacteristic: inCharList,
    prodSpecCharValueUse: inCharUseList
  };

  // 3. Voice Access / Connection (_va)
  const vaId = `${bundlePopId}_va`;
  const vaCharList = [
    makePopChar('bandwidth', String(speed)),
    makePopChar('connection_type', variant),
    makePopChar('play_type', playTypeVal),
    makePopChar('voice_connection_type', voiceConnType),
    makePopChar('channels_count', channelsCount),
    makePopChar('numbers_count', numbersCount),
    makePopChar('product_code_voice_ngn', prodVoiceNgn),
    makePopChar('product_code_voice_bitstream', prodVoiceBs),
    makePopChar('tariff_code_voice_ngn', tariffVoiceNgn),
    makePopChar('tariff_code_voice_bitstream', tariffVoiceBs),
    makePopChar('service_code_va_ngn', svcVaNgn),
    makePopChar('service_code_va_bitstream', svcVaBs),
    makePopChar('service_code_voice_ngn', svcVaNgn),
    makePopChar('service_code_voice_bitstream', svcVaBs)
  ];
  const vaCharUseList = [
    makeCharUse('bandwidth', String(speed)),
    makeCharUse('connection_type', variant),
    makeCharUse('play_type', playTypeVal),
    makeCharUse('voice_connection_type', voiceConnType),
    makeCharUse('channels_count', channelsCount),
    makeCharUse('numbers_count', numbersCount),
    makeCharUse('product_code_voice_ngn', prodVoiceNgn),
    makeCharUse('product_code_voice_bitstream', prodVoiceBs),
    makeCharUse('tariff_code_voice_ngn', tariffVoiceNgn),
    makeCharUse('tariff_code_voice_bitstream', tariffVoiceBs),
    makeCharUse('service_code_va_ngn', svcVaNgn),
    makeCharUse('service_code_va_bitstream', svcVaBs),
    makeCharUse('service_code_voice_ngn', svcVaNgn),
    makeCharUse('service_code_voice_bitstream', svcVaBs)
  ];
  if (psmVoiceNgn) {
    vaCharList.push(makePopChar('psm_sales_packet_code_voice_ngn', psmVoiceNgn));
    vaCharUseList.push(makeCharUse('psm_sales_packet_code_voice_ngn', psmVoiceNgn));
  }
  if (psmVoiceBs) {
    vaCharList.push(makePopChar('psm_sales_packet_code_voice_bitstream', psmVoiceBs));
    vaCharUseList.push(makeCharUse('psm_sales_packet_code_voice_bitstream', psmVoiceBs));
  }

  const simplePopVa = {
    id: vaId,
    name: vaId,
    description: `Voice Connection line fee (${isComfort ? 'Komfort-Anschluss' : 'Basis-Anschluss'})`,
    version: '0',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    recurringChargePeriodLength: 1,
    price: {
      unit: currency,
      value: vaPrice
    },
    validFor: {
      startDateTime: now
    },
    productOfferingPriceCharacteristic: vaCharList,
    prodSpecCharValueUse: vaCharUseList
  };

  // 4. Voice Tariff (_vt)
  const vtId = `${bundlePopId}_vt`;
  const vtTariffDisplay = tariffVoiceNgn || tariffVoiceBs;
  const vtCharList = [
    makePopChar('bandwidth', String(speed)),
    makePopChar('connection_type', variant),
    makePopChar('play_type', playTypeVal),
    makePopChar('tariff_voice', vtTariffDisplay),
    makePopChar('tariff_code_voice_ngn', tariffVoiceNgn),
    makePopChar('tariff_code_voice_bitstream', tariffVoiceBs),
    makePopChar('product_code_voice_ngn', prodVoiceNgn),
    makePopChar('product_code_voice_bitstream', prodVoiceBs),
    makePopChar('service_code_vt', svcVt),
    makePopChar('service_code_voice_ngn', svcVt),
    makePopChar('service_code_voice_bitstream', svcVt)
  ];
  const vtCharUseList = [
    makeCharUse('bandwidth', String(speed)),
    makeCharUse('connection_type', variant),
    makeCharUse('play_type', playTypeVal),
    makeCharUse('tariff_voice', vtTariffDisplay),
    makeCharUse('tariff_code_voice_ngn', tariffVoiceNgn),
    makeCharUse('tariff_code_voice_bitstream', tariffVoiceBs),
    makeCharUse('product_code_voice_ngn', prodVoiceNgn),
    makeCharUse('product_code_voice_bitstream', prodVoiceBs),
    makeCharUse('service_code_vt', svcVt),
    makeCharUse('service_code_voice_ngn', svcVt),
    makeCharUse('service_code_voice_bitstream', svcVt)
  ];
  if (psmVoiceNgn) {
    vtCharList.push(makePopChar('psm_sales_packet_code_voice_ngn', psmVoiceNgn));
    vtCharUseList.push(makeCharUse('psm_sales_packet_code_voice_ngn', psmVoiceNgn));
  }
  if (psmVoiceBs) {
    vtCharList.push(makePopChar('psm_sales_packet_code_voice_bitstream', psmVoiceBs));
    vtCharUseList.push(makeCharUse('psm_sales_packet_code_voice_bitstream', psmVoiceBs));
  }

  const simplePopVt = {
    id: vtId,
    name: vtId,
    description: `Voice Tariff component fee for tariff ${vtTariffDisplay} (${svcVt})`,
    version: '0',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productofferingprice.json',
    isBundle: false,
    priceType: 'Recurring charge',
    recurringChargePeriodType: 'month',
    recurringChargePeriodLength: 1,
    price: {
      unit: currency,
      value: vtPrice
    },
    validFor: {
      startDateTime: now
    },
    productOfferingPriceCharacteristic: vtCharList,
    prodSpecCharValueUse: vtCharUseList
  };

  return {
    bw: simplePopBw,
    in: simplePopIn,
    va: simplePopVa,
    vt: simplePopVt,
    all: [simplePopBw, simplePopIn, simplePopVa, simplePopVt]
  };
}

/**
 * Builds a Composite Bundle POP (isBundle: true) referencing its 4 Simple POPs
 * via bundledPopRelationship. As per canonical TM Forum model, it acts as a composite
 * bundle price container (bundledproductofferingprice.json) without standalone scalar price/priceType.
 */
export function buildCompositeBundlePop(bundlePopId, popData = {}, simplePops = [], formData = {}) {
  const now = new Date().toISOString();
  const variant = (popData.connectionVariant || 'basic').toLowerCase();
  const isComfort = variant === 'comfort';

  const bundledPopRelationship = simplePops.map(sp => ({
    id: sp.id,
    href: `/api/productCatalogManagement/v4/productOfferingPrice/${sp.id}:(version=0)`,
    name: sp.name || sp.id,
    version: '0'
  }));

  return {
    id: bundlePopId,
    name: popData.name || bundlePopId,
    version: '0',
    description: `${formData.name || 'Sales Package'} bundled composite price container for ${isComfort ? 'Comfort (ISDN)' : 'Basic'} variant aggregating 4 atomic sub-prices (_bw, _in, _va, _vt)`,
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOfferingPrice',
    "@type": 'ProductOfferingPrice',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/bundledproductofferingprice.json',
    isBundle: true,
    validFor: {
      startDateTime: now
    },
    bundledPopRelationship
  };
}

/**
 * Builds the parent Sales Package ProductOffering JSON (isBundle: false, referencing Bundle POPs).
 */
export function buildSalesPackageOffering(formData = {}, bundlePops = []) {
  const now = new Date().toISOString();
  const rawId = formData.id || (formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'NEW_SALES_PACKAGE');
  const pkgId = normalizePackageCodeV2(rawId);
  const pkgName = formData.name || 'New Sales Package v2';

  const prodSpecCharValueUse = (formData.characteristics || []).map(ch => {
    const vals = Array.isArray(ch.values) && ch.values.length > 0 
      ? ch.values 
      : (ch.value !== undefined && ch.value !== null && ch.value !== '' ? [ch.value] : []);
    return {
      id: ch.id || ch.name,
      name: ch.name,
      valueType: ch.valueType || 'String',
      productSpecCharacteristicValue: vals.map(v => ({
        value: String(v),
        isDefault: true
      }))
    };
  });

  const productOfferingPrice = bundlePops.map(bp => ({
    id: bp.id,
    name: bp.name || bp.id,
    href: `/api/productCatalogManagement/v4/productOfferingPrice/${bp.id}:(version=0)`,
    "@referredType": 'ProductOfferingPrice'
  }));

  const productOfferingTerm = (formData.terms || []).map(t => {
    const amount = Number(t.duration?.amount) || 24;
    const term = {
      name: t.name || `${amount} Months Commitment`,
      duration: {
        amount,
        units: t.duration?.units || 'month'
      },
      "@type": t['@type'] || 'ProductOfferingTerm'
    };

    if (t.description) {
      term.description = t.description;
    }

    if (t.sku) {
      term.productOfferingTermCharacteristic = [
        {
          name: 'sku',
          valueType: 'string',
          productOfferingTermCharacteristicValue: [
            {
              value: t.sku,
              valueType: 'string'
            }
          ],
          "@type": 'ProductOfferingTermCharacteristic'
        }
      ];
    }

    return term;
  });

  const specId = formData.specificationId || 'VF_DE_SPEC_SALES_PACKAGE';
  const specName = formData.specificationName || 'VF_DE_Sales_Package_Specification';
  const specVer = formData.specificationVersion || '1';

  // Build TM Forum extensions.categoryGroupings mapping
  const categoryGroupings = (formData.categoryGroupings || []).map(cg => {
    const sku = cg.sku || cg.name || '';
    const categories = (cg.category || []).map(cat => {
      const catId = cat.id || cat.name || cat;
      const catVer = cat.version ? String(cat.version) : '1';
      return {
        id: catId,
        version: catVer,
        href: cat.href || `/api/productCatalogManagement/v4/category/${catId}:(version=${catVer})`
      };
    });

    return {
      name: sku,
      category: categories,
      prodSpecCharValueUse: [
        {
          name: 'sku',
          valueType: 'string',
          productSpecCharacteristicValue: [
            {
              value: sku
            }
          ]
        }
      ]
    };
  });

  const offering = {
    id: pkgId,
    name: pkgName,
    description: formData.description || '',
    version: '1',
    lifecycleStatus: 'In study',
    "@baseType": 'ProductOffering',
    "@type": 'ProductOffering',
    "@schemaLocation": '/api/productCatalogManagement/v4/schema/productoffering.json',
    isBundle: false,
    isSellable: true,
    validFor: {
      startDateTime: now
    },
    productSpecification: {
      id: specId,
      name: specName,
      version: specVer,
      href: `/api/productCatalogManagement/v4/productSpecification/${specId}:(version=${specVer})`,
      "@referredType": 'ProductSpecification'
    },
    productOfferingPrice,
    productOfferingTerm,
    prodSpecCharValueUse
  };

  // Wire direct characteristics (productOfferingCharacteristic)
  const productOfferingCharacteristic = [];
  const resolvedPortId = formData.portfolio_id || (Array.isArray(formData.productOfferingCharacteristic)
    ? (formData.productOfferingCharacteristic.find(c => (c.name || '').toLowerCase() === 'portfolio_id')?.value ||
       formData.productOfferingCharacteristic.find(c => (c.name || '').toLowerCase() === 'portfolio_id')?.values?.[0] || '')
    : '');

  if (resolvedPortId && String(resolvedPortId).trim() !== '') {
    productOfferingCharacteristic.push({
      id: `portfolio_id_${pkgId}`,
      name: 'portfolio_id',
      valueType: 'string',
      "@type": 'ProductOfferingCharacteristic',
      configurable: false,
      isUnique: false,
      productOfferingCharacteristicValue: [
        {
          value: String(resolvedPortId).trim(),
          isDefault: true
        }
      ]
    });
  }

  const resolvedTplName = formData.template_name || (Array.isArray(formData.productOfferingCharacteristic)
    ? (formData.productOfferingCharacteristic.find(c => (c.name || '').toLowerCase() === 'template_name')?.value ||
       formData.productOfferingCharacteristic.find(c => (c.name || '').toLowerCase() === 'template_name')?.values?.[0] || '')
    : '');

  if (resolvedTplName && String(resolvedTplName).trim() !== '') {
    productOfferingCharacteristic.push({
      id: `template_name_${pkgId}`,
      name: 'template_name',
      valueType: 'string',
      "@type": 'ProductOfferingCharacteristic',
      configurable: false,
      isUnique: false,
      productOfferingCharacteristicValue: [
        {
          value: String(resolvedTplName).trim(),
          isDefault: true
        }
      ]
    });
  }

  if (Array.isArray(formData.productOfferingCharacteristic)) {
    formData.productOfferingCharacteristic.forEach((c, idx) => {
      const cName = (c.name || '').toLowerCase();
      if (cName !== 'portfolio_id' && cName !== 'template_name') {
        const normalizedValueType = c.valueType || 'string';
        const rawPocv = Array.isArray(c.productOfferingCharacteristicValue) && c.productOfferingCharacteristicValue.length > 0
          ? c.productOfferingCharacteristicValue
          : (Array.isArray(c.values) && c.values.length > 0
            ? c.values.map((v, i) => ({ value: v, isDefault: i === 0 }))
            : (c.value !== undefined && c.value !== null && c.value !== '' ? [{ value: c.value, isDefault: false }] : []));
        const pocv = rawPocv.map((v) => {
          const item = {
            value: v?.value !== undefined ? String(v.value) : '',
            valueType: v?.valueType || normalizedValueType,
            isDefault: Boolean(v?.isDefault)
          };
          if (v?.unitOfMeasure && String(v.unitOfMeasure).trim() !== '') {
            item.unitOfMeasure = String(v.unitOfMeasure).trim();
          }
          return item;
        });
        productOfferingCharacteristic.push({
          id: c.id || `char_${pkgId}_${idx + 1}`,
          isUnique: Boolean(c.isUnique),
          maxCardinality: c.maxCardinality !== undefined ? Number(c.maxCardinality) : 1,
          minCardinality: c.minCardinality !== undefined ? Number(c.minCardinality) : 0,
          name: c.name || '',
          valueType: normalizedValueType,
          characteristicType: c.characteristicType || 'Simple Value',
          productOfferingCharacteristicValue: pocv,
          configurable: c.configurable !== undefined ? Boolean(c.configurable) : true,
          extensible: Boolean(c.extensible),
          '@type': c['@type'] || 'ProductOfferingPriceCharacteristic'
        });
      }
    });
  }

  if (productOfferingCharacteristic.length > 0) {
    offering.productOfferingCharacteristic = productOfferingCharacteristic;
  }

  // Map category groupings strictly under extensions as required by TM Forum / DNEXT
  if (categoryGroupings.length > 0) {
    offering.extensions = {
      categoryGroupings
    };
  } else if (Array.isArray(formData.category) && formData.category.length > 0) {
    offering.category = formData.category.map(cat => {
      const catId = cat.id || cat.name || cat;
      const catVer = cat.version ? String(cat.version) : '1';
      return {
        id: catId,
        version: catVer,
        href: cat.href || `/api/productCatalogManagement/v4/category/${catId}:(version=${catVer})`
      };
    });
  }

  return offering;
}

/**
 * MASTER FUNCTION:
 * Creates the complete Sales Package deployment structure, including:
 *   - The 4 Simple POPs per bundle (_bw, _in, _va, _vt)
 *   - The Bundle POPs (with bundledPopRelationship)
 *   - The Parent ProductOffering
 *   - The Synchronous POST Envelope with messages sorted by strict dependency order
 */
export function createSalesPackageDeploymentEnvelope(formData = {}) {
  const now = new Date().toISOString();
  const rawId = formData.id || (formData.name ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'NEW_SALES_PACKAGE');
  const pkgCode = normalizePackageCodeV2(rawId);

  const rawPops = formData.bundledPops || [];
  const simplePopsList = [];
  const bundlePopsList = [];

  rawPops.forEach((pop, index) => {
    // Resolve Canonical Bundle POP ID
    let bundleId = pop.id || '';
    if (!bundleId || bundleId.includes('NEW_SALES_PACKAGE') || !/_bundle_/i.test(bundleId)) {
      bundleId = buildBundlePopId({
        packageCode: pkgCode,
        speed: pop.speed || formData.downstreamSpeed || 100,
        term: pop.contractTerm !== undefined ? pop.contractTerm : (formData.minContractTermMonths !== undefined ? formData.minContractTermMonths : 24),
        playType: pop.playType || (formData.isDoublePlay ? '2' : '1'),
        variant: pop.connectionVariant || 'basic'
      });
    } else {
      // Re-align existing bundle ID so it has _v2 on package base before _bundle_
      // e.g. pop_dsl_16_bundle_mcd0_pt2_comfort_6 -> pop_dsl_16_v2_bundle_mcd0_pt2_comfort_6
      // e.g. pop_dsl_16_bundle_mcd0_pt2_comfort_6_v2 -> pop_dsl_16_v2_bundle_mcd0_pt2_comfort_6
      let cleanId = bundleId.replace(/_v2$/i, '');
      const parts = cleanId.split(/_bundle_/i);
      const prefix = /_v2$/i.test(parts[0]) ? parts[0] : `${parts[0]}_v2`;
      bundleId = `${prefix}_bundle_${parts[1]}`;
    }

    // 1. Generate the 4 Simple POPs for this Bundle POP
    const { bw, in: spIn, va, vt, all } = buildAtomicSimplePops(bundleId, pop, formData);
    simplePopsList.push(...all);

    // 2. Generate the composite Bundle POP referencing the 4 Simple POPs
    const bundlePop = buildCompositeBundlePop(bundleId, pop, all, formData);
    bundlePopsList.push(bundlePop);
  });

  // 3. Generate the Parent ProductOffering
  const offering = buildSalesPackageOffering(formData, bundlePopsList);

  // 4. Assemble the Synchronous POST Envelope
  // Strict dependency sequence:
  // Step 1..n: Simple POPs (sub_price_components)
  // Step n+1..m: Bundle POPs (bundle_pops)
  // Step m+1: ProductOffering (offer)
  const envelopeMessages = [];
  let order = 1;

  // Simple POPs
  simplePopsList.forEach(sp => {
    envelopeMessages.push({
      order: order++,
      entityType: 'ProductOfferingPrice',
      subType: 'sub_price_components',
      entityId: sp.id,
      entityName: sp.name,
      method: 'POST',
      endpoint: '/productCatalogManagement/v4/productOfferingPrice',
      headers: { 'Content-Type': 'application/json' },
      body: sp
    });
  });

  // Bundle POPs
  bundlePopsList.forEach(bp => {
    envelopeMessages.push({
      order: order++,
      entityType: 'ProductOfferingPrice',
      subType: 'bundle_pops',
      entityId: bp.id,
      entityName: bp.name,
      method: 'POST',
      endpoint: '/productCatalogManagement/v4/productOfferingPrice',
      headers: { 'Content-Type': 'application/json' },
      body: bp
    });
  });

  const ccbTariffs = Array.isArray(formData.ccbTariffs) ? formData.ccbTariffs : [];
  const ccbServices = Array.isArray(formData.ccbServiceAssociations) ? formData.ccbServiceAssociations : [];

  if (ccbTariffs.length > 0 || ccbServices.length > 0) {
    offering.extensions = {
      ...(offering.extensions || {}),
      ccbAssociations: {
        tariffs: ccbTariffs,
        services: ccbServices
      }
    };
  }

  // Parent Offering
  envelopeMessages.push({
    order: order++,
    entityType: 'ProductOffering',
    subType: 'offer',
    entityId: offering.id,
    entityName: offering.name,
    method: 'POST',
    endpoint: '/productCatalogManagement/v4/productOffering',
    headers: { 'Content-Type': 'application/json' },
    body: offering
  });

  const synchronousEnvelope = {
    envelopeType: 'SyncTmfDeploymentEnvelope',
    target: 'DNEXT',
    syncMode: 'SYNCHRONOUS',
    createdAt: now,
    totalEntities: envelopeMessages.length,
    messages: envelopeMessages,
    ...(ccbTariffs.length > 0 || ccbServices.length > 0
      ? {
          ccbAssociations: {
            tariffs: ccbTariffs,
            services: ccbServices
          }
        }
      : {})
  };

  return {
    pkgCode,
    offering,
    bundlePops: bundlePopsList,
    simplePops: simplePopsList,
    synchronousEnvelope
  };
}
