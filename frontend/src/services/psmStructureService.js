/**
 * PSM Structure & CCB Provisioning Consolidation Service
 * 
 * Single source of truth for extracting, normalizing, and synchronizing
 * PSM packet codes, AAW master packets, commitment SKUs, network availability,
 * and CCB tariff/service codes across Sales Package views and creation workflows.
 */

import referenceValues from '../config/referenceValues.json' with { type: 'json' };

// Certified Vodafone DSL Fallback Tiers & Service Codes paired with network technology (I1204 NGN / I1203 Bitstream)
export const VODAFONE_DSL_FALLBACK_TIERS = referenceValues.dslFallbackTiers;

export const FALLBACK_VFDE_CATEGORIES = referenceValues.fallbackCategories;

export const BASELINE_SALES_PACKAGE_SPECS = {
  ...Object.fromEntries(
    referenceValues.baselineSalesPackageSpecs.multiValueCharacteristics.map((name) => [
      name,
      { minCardinality: 0, maxCardinality: 99, valueType: 'string' }
    ])
  ),
  ...referenceValues.baselineSalesPackageSpecs.scalarCharacteristics
};

export function getDefaultUploadSpeed(downSpeed) {
  const s = Number(downSpeed) || 0;
  const match = referenceValues.bandwidths.defaultUploadByDownloadMbps.find((r) => s >= r.minDown);
  return match ? match.up : 10;
}

export function getDslAccessProfileDescription(downSpeed) {
  const s = Number(downSpeed) || 0;
  const match = referenceValues.bandwidths.dslAccessProfiles.find((r) => s >= r.minDown);
  return match ? match.description : 'ADSL2+ / ATM / Annex J';
}

export function getStandardFallbackTiers(nominalSpeed) {
  const s = Number(nominalSpeed);
  const rule = referenceValues.standardFallbackRules.find((r) => s >= r.minNominalSpeed);
  return rule ? [...rule.fallbackSpeeds] : [];
}

// Helper to extract characteristic values array from any entity
export function extractCharValues(entity, charName) {
  if (!entity) return [];
  const raw = entity.raw || entity;
  const target = (charName || '').toLowerCase().trim();

  const charList = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic)
        ? raw.productSpecCharacteristic
        : (Array.isArray(raw.productOfferingPriceCharacteristic)
            ? raw.productOfferingPriceCharacteristic
            : []));

  const found = charList.find(c => (c.name || '').toLowerCase().trim() === target);
  if (!found) return [];

  let vals = [];
  if (Array.isArray(found.productSpecCharacteristicValue)) {
    vals = found.productSpecCharacteristicValue.map(v => v.value !== undefined ? String(v.value) : String(v));
  } else if (Array.isArray(found.productOfferingPriceCharacteristicValue)) {
    vals = found.productOfferingPriceCharacteristicValue.map(v => v.value !== undefined ? String(v.value) : String(v));
  } else if (found.value !== undefined && found.value !== null) {
    vals = [String(found.value)];
  }

  return vals.map(s => String(s).trim()).filter(Boolean);
}

// Helper to extract characteristic single string value
export function extractChar(entity, charName) {
  return extractCharValues(entity, charName).join(', ');
}

// Detect technology type
export function detectTechnology(offering) {
  const raw = offering?.raw || offering || {};
  const name = String(offering?.name || raw.name || offering?.id || raw.id || '').toUpperCase();
  const spec = raw.productSpecification || offering?.productSpecification || {};
  const specName = String(spec.name || spec.id || '').toUpperCase();
  const techChar = extractChar(offering, 'product_type') || extractChar(offering, 'technology');

  if (techChar) {
    const t = techChar.toUpperCase();
    if (t.includes('FIBRE') || t.includes('FTTH') || t.includes('GLASFASER')) return 'FIBRE';
    if (t.includes('DSL') || t.includes('VDSL')) return 'DSL';
    if (t.includes('CABLE') || t.includes('DOCSIS') || t.includes('KABEL')) return 'CABLE';
  }

  if (name.includes('GLASFASER') || name.includes('FTTH') || name.includes('FIBRE') || specName.includes('FTTH')) return 'FIBRE';
  if (name.includes('DSL') || name.includes('VDSL') || specName.includes('DSL')) return 'DSL';
  if (name.includes('CABLE') || name.includes('KABEL') || name.includes('DOCSIS') || specName.includes('CABLE')) return 'CABLE';

  return 'DSL';
}

const KNOWN_SPEED_REGEX = new RegExp(
  `(?:^|[^0-9])(${referenceValues.bandwidths.knownDownloadSpeedsMbps.join('|')})(?:[^0-9]|$)`
);

// Detect download and upload speeds in Mbps
export function detectSpeeds(offering) {
  const raw = offering?.raw || offering || {};
  const idStr = String(offering?.id || raw.id || '').toLowerCase();
  const nameStr = String(offering?.name || raw.name || '').toLowerCase();

  const bwChar = extractChar(offering, 'bandwidth') || extractChar(offering, 'default_bandwidth') || extractChar(offering, 'downstream_bandwidth');
  let down = parseInt(bwChar, 10);

  if (isNaN(down) || !down) {
    const m = (idStr + ' ' + nameStr).match(KNOWN_SPEED_REGEX);
    down = m ? parseInt(m[1], 10) : 100;
  }

  const upChar = extractChar(offering, 'upstream_bandwidth') ||
    extractChar(offering, 'bandwidth_upstream_max') ||
    extractChar(offering, 'upload_speed') ||
    extractChar(offering, 'speed_upload') ||
    extractChar(offering, 'bandwidth_up');
  const parsedUp = upChar ? parseFloat(upChar) : null;
  const up = (!isNaN(parsedUp) && parsedUp > 0) ? parsedUp : null;

  return { down, up };
}

// Detect network support based on catalog characteristics and speed constraints
export function detectSupportedNetworks(offering, speeds = null, psmCodes = []) {
  const tech = detectTechnology(offering);
  const spd = speeds ? speeds.down : detectSpeeds(offering).down;

  const rawChars = Array.isArray(offering?.raw?.prodSpecCharValueUse)
    ? offering.raw.prodSpecCharValueUse
    : (Array.isArray(offering?.prodSpecCharValueUse) ? offering.prodSpecCharValueUse : []);

  const hasNgnChar = rawChars.some(c => (c.name || '').toLowerCase().includes('_ngn'));
  const hasBsChar = rawChars.some(c => (c.name || '').toLowerCase().includes('_bitstream'));
  const hasPiPsm = psmCodes.some(c => String(c).trim().startsWith('PI'));
  const hasPrPsm = psmCodes.some(c => String(c).trim().startsWith('PR'));
  const hasPfPsm = psmCodes.some(c => String(c).trim().startsWith('PF'));

  if (tech === 'DSL') {
    // In Vodafone Germany:
    // - 100 Mbps (VDSL Vectoring), 250 Mbps (Supervectoring), and 3 Mbps fallback are strictly Telekom Bitstream wholesale.
    // - Vodafone NGN colocation is only available for 16M (ADSL2+) and 50M (VDSL) speed tiers.
    const isBitstreamOnlyTier = spd >= 100 || spd === 3;
    const hasNgn = !isBitstreamOnlyTier && (hasNgnChar || hasPiPsm);
    const hasBitstream = hasBsChar || hasPrPsm || true; // All DSL packages support or default to Bitstream

    return {
      technology: 'DSL',
      hasNgn,
      hasBitstream,
      hasCable: false,
      hasFtth: false,
      primaryNetwork: (hasNgn && hasBitstream) ? 'Vodafone NGN / Telekom Bitstream' : 'Telekom Bitstream'
    };
  }

  if (tech === 'FIBRE') {
    // In Vodafone Germany, Fibre (FTTH) offerings are available for both Vodafone NGN (On-Net / FTTH) and Telekom Bitstream Wholesale.
    // Availability is indicated by _ngn / _bitstream characteristics and PSM codes (PF... for NGN, PR... for Bitstream).
    const hasNgn = hasNgnChar || hasPfPsm || hasPiPsm || true;
    const hasBitstream = hasBsChar || hasPrPsm || true;

    return {
      technology: 'FIBRE',
      hasNgn,
      hasBitstream,
      hasCable: false,
      hasFtth: true,
      primaryNetwork: (hasNgn && hasBitstream) ? 'Vodafone NGN / Telekom Bitstream' : (hasNgn ? 'Vodafone NGN' : 'Telekom Bitstream')
    };
  }

  if (tech === 'CABLE') {
    return {
      technology: 'CABLE',
      hasNgn: false,
      hasBitstream: false,
      hasCable: true,
      hasFtth: false,
      primaryNetwork: 'Vodafone Cable (DOCSIS)'
    };
  }

  return {
    technology: tech,
    hasNgn: hasNgnChar || hasPiPsm,
    hasBitstream: hasBsChar || hasPrPsm,
    hasCable: false,
    hasFtth: hasPfPsm,
    primaryNetwork: hasNgnChar ? 'Vodafone NGN' : 'Telekom Bitstream'
  };
}

// Extract AAW Master Packet ID (e.g. R025.5000000076)
export function extractMasterPacketId(offering) {
  if (!offering) return 'R025.5000000530';
  const raw = offering.raw || offering;

  // 1. Direct psm_aaw_packet_id
  const directAaw = extractCharValues(raw, 'psm_aaw_packet_id');
  for (const v of directAaw) {
    if (v && String(v).startsWith('R025.')) {
      return String(v).split('-')[0].trim();
    }
  }

  // 2. Scan all characteristic values for R025.
  const rawChars = Array.isArray(raw.prodSpecCharValueUse)
    ? raw.prodSpecCharValueUse
    : (Array.isArray(raw.productSpecCharacteristic) ? raw.productSpecCharacteristic : []);

  for (const c of rawChars) {
    const vals = Array.isArray(c.productSpecCharacteristicValue)
      ? c.productSpecCharacteristicValue.map(v => v.value)
      : [c.value];
    for (const v of vals) {
      if (v && String(v).startsWith('R025.')) {
        return String(v).split('-')[0].trim();
      }
    }
  }

  // 3. Fallback table by known technology / speed
  const tech = detectTechnology(offering);
  const speeds = detectSpeeds(offering);
  const down = speeds.down;

  if (tech === 'DSL') {
    if (down === 250) return 'R025.5000000077';
    if (down === 100) return 'R025.5000000076';
    if (down === 50) return 'R025.5000000075';
    if (down === 16) return 'R025.5000000073';
  } else if (tech === 'FIBRE') {
    if (down === 1000) return 'R025.5000000532';
    if (down === 600) return 'R025.5000000528';
    if (down === 300) return 'R025.5000000530';
    if (down === 150) return 'R025.5000000527';
  }

  return 'R025.5000000530';
}

// Extract Commitment Terms and Selling SKUs
export function extractTermsAndSkus(offering, masterPacketId = null) {
  const mPacket = masterPacketId || extractMasterPacketId(offering);
  const raw = offering?.raw || offering || {};
  const rawTerms = Array.isArray(raw.productOfferingTerm) ? raw.productOfferingTerm : [];
  const rawSkus = extractCharValues(raw, 'sku');

  const validDurations = [24, 18, 12];
  let terms = [];

  if (rawTerms.length > 0) {
    rawTerms
      .filter(t => validDurations.includes(Number(t.duration?.amount)))
      .forEach((t, idx) => {
        const amount = Number(t.duration?.amount);
        const units = t.duration?.units || 'Month';
        const termChars = t.productOfferingTermCharacteristic || t.prodSpecCharValueUse || [];
        const termSkuChar = termChars.find(c => (c.name || '').toLowerCase() === 'sku');
        
        let skuValues = [];
        if (Array.isArray(termSkuChar?.productOfferingTermCharacteristicValue)) {
          skuValues = termSkuChar.productOfferingTermCharacteristicValue
            .map(v => v?.value !== undefined ? String(v.value).trim() : String(v).trim())
            .filter(Boolean);
        } else if (termSkuChar?.value !== undefined && termSkuChar?.value !== null) {
          skuValues = [String(termSkuChar.value).trim()];
        }

        if (skuValues.length === 0) {
          skuValues = [`${mPacket}-${amount}`];
        }

        skuValues.forEach((skuVal, sIdx) => {
          const pkt = skuVal.includes('-') ? skuVal.split('-')[0] : mPacket;
          const durUnits = String(units || 'Month').toLowerCase().startsWith('month')
            ? (amount === 1 ? 'Month' : 'Months')
            : (amount === 1 ? units : `${units}s`);
          const cleanName = (t.name && !t.name.toLowerCase().includes('minimum_contract_duration') && !t.name.toLowerCase().includes('mminimum_contract_duration'))
            ? t.name
            : `Contract Duration: ${amount} ${durUnits}`;
          terms.push({
            id: t.id ? `${t.id}_${skuVal}` : `term_${amount}_${idx}_${sIdx}`,
            packetId: pkt,
            name: cleanName,
            description: t.description || null,
            duration: { amount, units },
            sku: skuVal,
            isDefault: amount === 24 && sIdx === 0
          });
        });
      });
  }

  // If rawTerms was empty or yielded no terms, check if rawSkus exists
  if (terms.length === 0 && rawSkus.length > 0) {
    const rawDuration = extractChar(raw, 'ContractDuration') || extractChar(raw, 'minimum_contract_duration');
    const defaultDur = parseInt(rawDuration, 10) || 24;

    rawSkus.forEach((skuVal, idx) => {
      const durMatch = String(skuVal).match(/-(\d+)$/);
      const amount = durMatch ? parseInt(durMatch[1], 10) : defaultDur;
      const pkt = skuVal.includes('-') ? skuVal.split('-')[0] : mPacket;
      terms.push({
        id: `term_${amount}_${skuVal}`,
        packetId: pkt,
        name: `Contract Duration: ${amount} Months`,
        description: null,
        duration: { amount, units: 'Month' },
        sku: skuVal,
        isDefault: amount === 24 && idx === 0
      });
    });
  }

  // If still empty (offering had neither terms nor SKUs), supply standard 24 Months default
  if (terms.length === 0) {
    terms.push({
      id: 'term_24',
      packetId: mPacket,
      name: 'Contract Duration: 24 Months',
      description: null,
      duration: { amount: 24, units: 'Month' },
      sku: `${mPacket}-24`,
      isDefault: true
    });
  }

  // Ensure default flag is set on at least one term (prefer 24 months)
  if (!terms.some(t => t.isDefault)) {
    const term24 = terms.find(t => t.duration?.amount === 24);
    if (term24) {
      term24.isDefault = true;
    } else if (terms.length > 0) {
      terms[0].isDefault = true;
    }
  }

  // Order descending by duration amount
  terms.sort((a, b) => (b.duration?.amount || 0) - (a.duration?.amount || 0));

  const skus = Array.from(new Set([
    ...rawSkus,
    ...terms.map(t => t.sku).filter(Boolean)
  ]));

  return { terms, skus };
}

/**
 * Master Consolidation: Extract Normalized PSM Structure from an Offering
 * 
 * @param {Object} offering - Offering entity (catalogSalesPackages item or raw catalog JSON)
 * @param {Array} catalogPool - Full pool of catalog entities to resolve child POPs
 * @returns {Object} Normalized PsmStructure
 */
export function extractPsmStructure(offering, catalogPool = []) {
  if (!offering) return null;
  const raw = offering.raw || offering;

  const technology = detectTechnology(offering);
  const speeds = detectSpeeds(offering);
  const masterPacketId = extractMasterPacketId(offering);
  const { terms, skus } = extractTermsAndSkus(offering, masterPacketId);

  // Raw PSM codes from offering characteristics
  const rawOfferPsmCodes = extractCharValues(raw, 'psm_sales_packet_code');
  const supportedNetworks = detectSupportedNetworks(offering, speeds, rawOfferPsmCodes);

  // Build entity map for POP resolution
  const popMap = new Map();
  (catalogPool || []).forEach(e => {
    const r = e.raw || e;
    const id = String(e.id || r.id || '');
    if (id) popMap.set(id, r);
  });

  // Extract raw POP references
  const rawPopRefs = Array.isArray(raw.productOfferingPrice) ? raw.productOfferingPrice : [];
  let resolvedVariants = { basic: null, comfort: null };
  let resolvedPopsList = [];

  rawPopRefs.forEach((pRef, idx) => {
    const pId = String(pRef.id || `pop_${idx}`);
    const popObj = popMap.get(pId) || pRef;
    const pName = popObj.name || pId;
    const pPrice = popObj.price?.value !== undefined ? Number(popObj.price.value) : (popObj.price !== undefined ? Number(popObj.price) : 0);

    const connVar = (extractChar(popObj, 'connection_type') || (pId.includes('comfort') ? 'comfort' : 'basic')).toLowerCase();
    const playType = extractChar(popObj, 'play_type') || '2';
    let popSpeed = Number(extractChar(popObj, 'bandwidth')) || speeds.down;

    // Component decomposition
    const childRels = Array.isArray(popObj.bundledPopRelationship)
      ? popObj.bundledPopRelationship
      : (Array.isArray(popObj.bundledProductOfferingPrice) ? popObj.bundledProductOfferingPrice : []);

    let compBw = null;
    let compIn = null;
    let compVa = null;
    let compVt = null;

    childRels.forEach(rel => {
      const cId = String(rel.id || '');
      const cObj = popMap.get(cId) || rel;
      const cPrice = cObj.price?.value !== undefined ? Number(cObj.price.value) : (cObj.price !== undefined ? Number(cObj.price) : 0);

      const parsedComp = {
        id: cId,
        price: cPrice,
        raw: cObj,
        svcCodeNgn: extractChar(cObj, 'service_code_internet_ngn') || extractChar(cObj, 'service_code_voice_ngn') || '',
        svcCodeBs: extractChar(cObj, 'service_code_internet_bitstream') || extractChar(cObj, 'service_code_voice_bitstream') || '',
        pktCodeNgn: extractChar(cObj, 'psm_sales_packet_code_internet_ngn') || extractChar(cObj, 'psm_sales_packet_code_voice_ngn') || '',
        pktCodeBs: extractChar(cObj, 'psm_sales_packet_code_internet_bitstream') || extractChar(cObj, 'psm_sales_packet_code_voice_bitstream') || '',
        tariffNgn: extractChar(cObj, 'tariff_code_internet_ngn') || extractChar(cObj, 'tariff_code_voice_ngn') || '',
        tariffBs: extractChar(cObj, 'tariff_code_internet_bitstream') || extractChar(cObj, 'tariff_code_voice_bitstream') || ''
      };

      if (cId.endsWith('_bw') || cId.includes('_bw_') || cId.includes('_bandwidth')) compBw = parsedComp;
      else if (cId.endsWith('_in') || cId.includes('_in_') || cId.includes('_internet')) compIn = parsedComp;
      else if (cId.endsWith('_va') || cId.includes('_va_') || cId.includes('_voice_access')) compVa = parsedComp;
      else if (cId.endsWith('_vt') || cId.includes('_vt_') || cId.includes('_voice_tariff')) compVt = parsedComp;
    });

    // Default speed service code
    const defaultSvcBw = technology === 'FIBRE'
      ? (popSpeed >= 1000 ? 'IG006' : popSpeed >= 600 ? 'IG019' : popSpeed >= 300 ? 'IG018' : 'IG017')
      : (popSpeed >= 250 ? 'V018V' : popSpeed >= 175 ? 'V018U' : popSpeed >= 100 ? 'V018N' : popSpeed >= 50 ? 'V018H' : popSpeed === 16 ? 'V018C' : 'V0178');

    const svcBw = compBw?.svcCodeBs || compBw?.svcCodeNgn || defaultSvcBw;
    const svcIn = compIn?.svcCodeBs || compIn?.svcCodeNgn || 'V0017';
    const svcVaBs = compVa?.svcCodeBs || (connVar === 'comfort' ? 'VI006' : 'VI009');
    const svcVaNgn = compVa?.svcCodeNgn || (connVar === 'comfort' ? 'VI003' : 'VI002');
    const svcVt = compVt?.svcCodeBs || compVt?.svcCodeNgn || 'V0017';

    // PSM codes for Bitstream
    const rawPsmIntBs = extractChar(popObj, 'psm_sales_packet_code_internet_bitstream') || compIn?.pktCodeBs || compBw?.pktCodeBs;
    const rawPsmVoiceBs = extractChar(popObj, 'psm_sales_packet_code_voice_bitstream') || compVa?.pktCodeBs || compVt?.pktCodeBs;
    const defaultPsmBs = technology === 'FIBRE'
      ? (popSpeed >= 1000
          ? (connVar === 'comfort' ? 'PR418' : 'PR417')
          : popSpeed >= 600
            ? (connVar === 'comfort' ? 'PR414' : 'PR413')
            : popSpeed >= 300
              ? (connVar === 'comfort' ? 'PR412' : 'PR411')
              : (connVar === 'comfort' ? 'PR410' : 'PR409'))
      : (popSpeed >= 250 ? (connVar === 'comfort' ? 'PR404' : 'PR403') : popSpeed >= 100 ? (connVar === 'comfort' ? 'PR394' : 'PR393') : (connVar === 'comfort' ? 'PR384' : 'PR383'));

    const psmIntBs = rawPsmIntBs || defaultPsmBs;
    const psmVoiceBs = rawPsmVoiceBs || defaultPsmBs;

    // PSM codes for NGN (ONLY if supported!)
    const rawPsmIntNgn = extractChar(popObj, 'psm_sales_packet_code_internet_ngn') || compIn?.pktCodeNgn || compBw?.pktCodeNgn;
    const rawPsmVoiceNgn = extractChar(popObj, 'psm_sales_packet_code_voice_ngn') || compVa?.pktCodeNgn || compVt?.pktCodeNgn;
    const defaultPsmNgn = technology === 'FIBRE'
      ? (popSpeed >= 1000
          ? (connVar === 'comfort' ? 'PF347' : 'PF346')
          : popSpeed >= 600
            ? (connVar === 'comfort' ? 'PF343' : 'PF342')
            : popSpeed >= 300
              ? (connVar === 'comfort' ? 'PF341' : 'PF340')
              : (connVar === 'comfort' ? 'PF339' : 'PF338'))
      : (popSpeed >= 50 ? (connVar === 'comfort' ? 'PI223' : 'PI216') : (connVar === 'comfort' ? 'PI207' : 'PI206'));

    const psmInternetNgn = supportedNetworks.hasNgn ? (rawPsmIntNgn || defaultPsmNgn) : '-';
    const psmVoiceNgn = supportedNetworks.hasNgn ? (rawPsmVoiceNgn || defaultPsmNgn) : '-';
    const psmInternetBitstream = psmIntBs;
    const psmVoiceBitstream = psmVoiceBs;

    // Tariff codes
    const defaultTariffInt = technology === 'FIBRE'
      ? (popSpeed >= 1000 ? 'IP532' : popSpeed >= 600 ? 'IP531' : 'IP530')
      : (popSpeed >= 250 ? 'IP077' : popSpeed >= 100 ? 'IP076' : popSpeed >= 50 ? 'IP074' : 'IP073');
    const defaultTariffVoice = technology === 'FIBRE'
      ? (popSpeed >= 1000 ? 'VP532' : popSpeed >= 600 ? 'VP531' : 'VP530')
      : (popSpeed >= 250 ? 'VP077' : popSpeed >= 100 ? 'VP076' : popSpeed >= 50 ? 'VP074' : 'VP073');

    const tariffInternetBitstream = extractChar(popObj, 'tariff_code_internet_bitstream') || compIn?.tariffBs || defaultTariffInt;
    const tariffVoiceBitstream = extractChar(popObj, 'tariff_code_voice_bitstream') || compVa?.tariffBs || compVt?.tariffBs || defaultTariffVoice;
    const tariffInternetNgn = supportedNetworks.hasNgn ? (extractChar(popObj, 'tariff_code_internet_ngn') || compIn?.tariffNgn || defaultTariffInt) : '-';
    const tariffVoiceNgn = supportedNetworks.hasNgn ? (extractChar(popObj, 'tariff_code_voice_ngn') || compVa?.tariffNgn || compVt?.tariffNgn || defaultTariffVoice) : '-';

    const serviceInternetBitstream = [svcIn, svcBw].filter(Boolean).join(', ');
    const serviceVoiceBitstream = [svcVt, svcVaBs].filter(Boolean).join(', ');
    const serviceInternetNgn = supportedNetworks.hasNgn ? [svcIn, svcBw].filter(Boolean).join(', ') : '-';
    const serviceVoiceNgn = supportedNetworks.hasNgn ? [svcVt, svcVaNgn].filter(Boolean).join(', ') : '-';

    const popData = {
      id: pId,
      name: pName,
      connectionVariant: connVar,
      playType,
      speed: popSpeed,
      price: pPrice || (connVar === 'comfort' ? 48.98 : 44.99),
      hasNgn: supportedNetworks.hasNgn,
      hasBitstream: supportedNetworks.hasBitstream,
      popBandwidthAmount: compBw?.price ?? (technology === 'DSL' ? 0.00 : 15.00),
      popInternetAmount: compIn?.price ?? 14.00,
      popVoiceAccessAmount: compVa?.price ?? (connVar === 'comfort' ? 19.98 : 15.99),
      popVoiceTariffAmount: compVt?.price ?? 5.00,
      svcBw,
      svcIn,
      svcVaNgn: supportedNetworks.hasNgn ? svcVaNgn : '-',
      svcVaBitstream: svcVaBs,
      svcVt,
      psmInternetNgn,
      tariffInternetNgn,
      serviceInternetNgn,
      psmVoiceNgn,
      tariffVoiceNgn,
      serviceVoiceNgn,
      psmInternetBitstream,
      tariffInternetBitstream,
      serviceInternetBitstream,
      psmVoiceBitstream,
      tariffVoiceBitstream,
      serviceVoiceBitstream,
      bitstream: {
        isAvailable: supportedNetworks.hasBitstream,
        salesPacketCode: psmInternetBitstream,
        internet: { packetCode: psmInternetBitstream, tariffCode: tariffInternetBitstream, serviceCodes: [svcIn, svcBw] },
        voice: { packetCode: psmVoiceBitstream, tariffCode: tariffVoiceBitstream, serviceCodes: [svcVt, svcVaBs] }
      },
      ngn: {
        isAvailable: supportedNetworks.hasNgn,
        salesPacketCode: supportedNetworks.hasNgn ? psmInternetNgn : null,
        internet: supportedNetworks.hasNgn ? { packetCode: psmInternetNgn, tariffCode: tariffInternetNgn, serviceCodes: [svcIn, svcBw] } : null,
        voice: supportedNetworks.hasNgn ? { packetCode: psmVoiceNgn, tariffCode: tariffVoiceNgn, serviceCodes: [svcVt, svcVaNgn] } : null
      }
    };

    resolvedPopsList.push(popData);
    if (connVar === 'basic' && !resolvedVariants.basic) resolvedVariants.basic = popData;
    if (connVar === 'comfort' && !resolvedVariants.comfort) resolvedVariants.comfort = popData;
  });

  // Calculate clean, verified sales packet codes
  const salesPacketCodes = [];
  if (rawOfferPsmCodes.length > 0) {
    rawOfferPsmCodes.forEach(c => {
      const code = String(c).trim();
      if (!code) return;
      if (code.startsWith('PI') && !supportedNetworks.hasNgn) return; // filter out synthetic/unsupported NGN codes
      if (!salesPacketCodes.includes(code)) salesPacketCodes.push(code);
    });
  }
  if (salesPacketCodes.length === 0) {
    resolvedPopsList.forEach(p => {
      if (supportedNetworks.hasBitstream && p.psmInternetBitstream && p.psmInternetBitstream !== '-') {
        if (!salesPacketCodes.includes(p.psmInternetBitstream)) salesPacketCodes.push(p.psmInternetBitstream);
      }
      if (supportedNetworks.hasNgn && p.psmInternetNgn && p.psmInternetNgn !== '-') {
        if (!salesPacketCodes.includes(p.psmInternetNgn)) salesPacketCodes.push(p.psmInternetNgn);
      }
    });
  }

  return {
    masterPacketId,
    skus,
    terms,
    technology,
    speeds,
    supportedNetworks,
    salesPacketCodes,
    variants: resolvedVariants,
    resolvedPops: resolvedPopsList
  };
}

/**
 * Extracts a consolidated, deduplicated list of all active PSM Sales Packet codes
 * (both Vodafone NGN and Telekom Bitstream) across all configured bundled POPs.
 * 
 * @param {Array} pops Bundled POP items
 * @param {Object} supportedNetworks Optional { hasNgn, hasBitstream } network constraint
 * @returns {Array<string>} Distinct uppercase PSM packet codes
 */
export function getConsolidatedPsmCodes(pops = [], supportedNetworks = null) {
  const psmCodes = new Set();
  const allowNgn = supportedNetworks ? supportedNetworks.hasNgn !== false : true;
  const allowBs = supportedNetworks ? supportedNetworks.hasBitstream !== false : true;

  const validCode = (v) => {
    if (!v) return false;
    const s = String(v).trim();
    return s !== '' && s !== '-';
  };

  const addCodes = (val) => {
    if (!validCode(val)) return;
    String(val).split(/[\s,]+/).forEach(token => {
      const trimmed = token.trim();
      if (trimmed && trimmed !== '-') {
        const code = /_v2$/i.test(trimmed)
          ? `${trimmed.replace(/_v2$/i, '').toUpperCase()}_v2`
          : trimmed.toUpperCase();
        psmCodes.add(code);
      }
    });
  };

  (pops || []).forEach(p => {
    // 1. NGN packet code for this POP
    if (allowNgn && p.hasNgn !== false) {
      const ngnCode = p.psmNgn || p.psmInternetNgn || p.ngn?.salesPacketCode || '';
      addCodes(ngnCode);
      if (p.psmVoiceNgn && p.psmVoiceNgn !== ngnCode) {
        addCodes(p.psmVoiceNgn);
      }
    }
    // 2. Bitstream packet code for this POP
    if (allowBs && p.hasBitstream !== false) {
      const bsCode = p.psmBitstream || p.psmInternetBitstream || p.bitstream?.salesPacketCode || '';
      addCodes(bsCode);
      if (p.psmVoiceBitstream && p.psmVoiceBitstream !== bsCode) {
        addCodes(p.psmVoiceBitstream);
      }
    }
  });

  return Array.from(psmCodes).sort();
}

/**
 * Synchronize offering characteristics from resolved POPs and supported networks.
 * Strictly guarantees that non-applicable network codes are NOT injected.
 * When NGN and Bitstream packet codes are updated on POPs, the consolidated list
 * is synchronized into the `psm_sales_packet_code` characteristic, removing any replaced codes.
 */
export function syncPsmCharacteristics(pops, prevCharacteristics = [], supportedNetworks = null) {
  const psmCodes = new Set();
  const ngnPsmCodes = new Set();
  const bsPsmCodes = new Set();
  const tariffIntNgn = new Set();
  const tariffIntBs = new Set();
  const tariffVoiceNgn = new Set();
  const tariffVoiceBs = new Set();
  const svcsIntNgn = new Set();
  const svcsIntBs = new Set();
  const svcsVoiceNgn = new Set();
  const svcsVoiceBs = new Set();

  const allowNgn = supportedNetworks ? supportedNetworks.hasNgn !== false : true;
  const allowBs = supportedNetworks ? supportedNetworks.hasBitstream !== false : true;

  const validCode = (v) => {
    if (!v) return false;
    const s = String(v).trim();
    return s !== '' && s !== '-';
  };

  const addCodes = (val, targetSet) => {
    if (!validCode(val)) return;
    String(val).split(/[\s,]+/).forEach(token => {
      const trimmed = token.trim();
      if (trimmed && trimmed !== '-') {
        const code = /_v2$/i.test(trimmed)
          ? `${trimmed.replace(/_v2$/i, '').toUpperCase()}_v2`
          : trimmed.toUpperCase();
        targetSet.add(code);
      }
    });
  };

  // 1. Gather consolidated PSM sales packet codes directly from POPs
  const consolidatedPsm = getConsolidatedPsmCodes(pops, supportedNetworks);
  if (pops && pops.length > 0) {
    // When bundled POPs exist, reflect ONLY the active codes on the POPs. Replaced codes are removed.
    consolidatedPsm.forEach(code => psmCodes.add(code));
  } else {
    // Only fallback to existing PSM codes if no POPs exist at all
    const existingPsmChar = prevCharacteristics.find(c => (c.name || '').toLowerCase() === 'psm_sales_packet_code');
    if (existingPsmChar && Array.isArray(existingPsmChar.values)) {
      existingPsmChar.values.forEach(v => {
        addCodes(v, psmCodes);
      });
    } else if (existingPsmChar?.value) {
      addCodes(existingPsmChar.value, psmCodes);
    }
  }

  // 2. Gather network-specific PSM codes, tariffs and service codes from POPs
  pops.forEach(p => {
    if (allowNgn && p.hasNgn !== false) {
      const ngnCode = p.psmNgn || p.psmInternetNgn || p.ngn?.salesPacketCode || '';
      addCodes(ngnCode, ngnPsmCodes);
      if (p.psmVoiceNgn && p.psmVoiceNgn !== ngnCode) {
        addCodes(p.psmVoiceNgn, ngnPsmCodes);
      }
      addCodes(p.tariffInternetNgn || p.tariffInternet, tariffIntNgn);
      addCodes(p.tariffVoiceNgn || p.tariffVoice, tariffVoiceNgn);
      if (p.serviceInternetNgn && p.serviceInternetNgn !== '-') {
        String(p.serviceInternetNgn).split(',').forEach(s => s.trim() && s.trim() !== '-' && svcsIntNgn.add(s.trim()));
      }
      if (p.serviceVoiceNgn && p.serviceVoiceNgn !== '-') {
        String(p.serviceVoiceNgn).split(',').forEach(s => s.trim() && s.trim() !== '-' && svcsVoiceNgn.add(s.trim()));
      }
    }

    if (allowBs && p.hasBitstream !== false) {
      const bsCode = p.psmBitstream || p.psmInternetBitstream || p.bitstream?.salesPacketCode || '';
      addCodes(bsCode, bsPsmCodes);
      if (p.psmVoiceBitstream && p.psmVoiceBitstream !== bsCode) {
        addCodes(p.psmVoiceBitstream, bsPsmCodes);
      }
      addCodes(p.tariffInternetBitstream || p.tariffInternet, tariffIntBs);
      addCodes(p.tariffVoiceBitstream || p.tariffVoice, tariffVoiceBs);
      if (p.serviceInternetBitstream && p.serviceInternetBitstream !== '-') {
        String(p.serviceInternetBitstream).split(',').forEach(s => s.trim() && s.trim() !== '-' && svcsIntBs.add(s.trim()));
      }
      if (p.serviceVoiceBitstream && p.serviceVoiceBitstream !== '-') {
        String(p.serviceVoiceBitstream).split(',').forEach(s => s.trim() && s.trim() !== '-' && svcsVoiceBs.add(s.trim()));
      }
    }
  });

  const distinctSpeeds = [...new Set(pops.map(p => Number(p.speed)).filter(Boolean))].sort((a, b) => b - a);

  const consolidatedPsmList = Array.from(psmCodes).sort();
  const ngnList = Array.from(ngnPsmCodes).sort();
  const bsList = Array.from(bsPsmCodes).sort();

  const mapping = {
    psm_sales_packet_code: consolidatedPsmList,
    psm_sales_packet_code_ngn: ngnList,
    psm_sales_packet_code_internet_ngn: ngnList,
    psm_sales_packet_code_voice_ngn: ngnList,
    psm_sales_packet_code_bitstream: bsList,
    psm_sales_packet_code_internet_bitstream: bsList,
    psm_sales_packet_code_voice_bitstream: bsList,
    psm_packet_code: consolidatedPsmList,
    sales_packet_code: consolidatedPsmList,
    ngn_packet_code: ngnList,
    bitstream_packet_code: bsList,
    tariff_code_internet_ngn: Array.from(tariffIntNgn).filter(Boolean),
    tariff_code_internet_bitstream: Array.from(tariffIntBs).filter(Boolean),
    tariff_code_internet: Array.from(new Set([...tariffIntNgn, ...tariffIntBs])).filter(Boolean),
    tariff_internet: Array.from(new Set([...tariffIntNgn, ...tariffIntBs])).filter(Boolean),
    tariff_code_voice_ngn: Array.from(tariffVoiceNgn).filter(Boolean),
    tariff_code_voice_bitstream: Array.from(tariffVoiceBs).filter(Boolean),
    tariff_code_voice: Array.from(new Set([...tariffVoiceNgn, ...tariffVoiceBs])).filter(Boolean),
    tariff_voice: Array.from(new Set([...tariffVoiceNgn, ...tariffVoiceBs])).filter(Boolean),
    service_code_internet_ngn: Array.from(svcsIntNgn).filter(Boolean),
    service_code_internet_bitstream: Array.from(svcsIntBs).filter(Boolean),
    service_code_internet: Array.from(new Set([...svcsIntNgn, ...svcsIntBs])).filter(Boolean),
    service_code_voice_ngn: Array.from(svcsVoiceNgn).filter(Boolean),
    service_code_voice_bitstream: Array.from(svcsVoiceBs).filter(Boolean),
    service_code_voice: Array.from(new Set([...svcsVoiceNgn, ...svcsVoiceBs])).filter(Boolean)
  };

  if (distinctSpeeds.length > 0) {
    mapping.bandwidth = distinctSpeeds.map(String);
    mapping.default_bandwidth = [String(distinctSpeeds[0])];
    if (distinctSpeeds.length > 1) {
      mapping.fallback_bandwidth = distinctSpeeds.slice(1).map(String);
    }
  }

  let foundPsmChar = false;
  const updatedChars = (prevCharacteristics || []).map(ch => {
    const k = (ch.name || '').toLowerCase();
    if (k === 'psm_sales_packet_code') {
      foundPsmChar = true;
    }
    if (mapping[k] !== undefined) {
      const arr = mapping[k];
      return {
        ...ch,
        values: arr.length > 0 ? arr : [''],
        value: arr.join(', '),
        productSpecCharacteristicValue: arr.map(v => ({ value: v, isDefault: true })),
        isArray: arr.length > 1 || ch.isArray
      };
    }
    return ch;
  });

  // Ensure psm_sales_packet_code is always present in characteristics
  if (!foundPsmChar) {
    updatedChars.push({
      id: 'char_psm_sales_packet_code',
      name: 'psm_sales_packet_code',
      values: consolidatedPsmList.length > 0 ? consolidatedPsmList : [''],
      value: consolidatedPsmList.join(', '),
      productSpecCharacteristicValue: consolidatedPsmList.map(v => ({ value: v, isDefault: true })),
      valueType: 'String',
      isArray: consolidatedPsmList.length > 1
    });
  }

  return updatedChars;
}

/**
 * Extracts NGN Packet Codes for an offering.
 * Reuses existing offering characteristics and extractPsmStructure resolution.
 * 
 * @param {Object} offering 
 * @param {Array} catalogPool 
 * @returns {string} Comma-separated unique NGN packet codes (e.g. "PI216, PI223" or "PF340")
 */
export function extractNgnPacketCodes(offering, catalogPool = []) {
  if (!offering) return '';
  const raw = offering.raw || offering;

  // 1. Direct explicit NGN characteristics on the offering
  const explicitCodes = [
    ...extractCharValues(raw, 'psm_sales_packet_code_internet_ngn'),
    ...extractCharValues(raw, 'psm_sales_packet_code_voice_ngn'),
    ...extractCharValues(raw, 'psm_sales_packet_code_ngn'),
    ...extractCharValues(raw, 'psm_packet_code_ngn'),
    ...extractCharValues(raw, 'ngn_packet_code'),
    ...extractCharValues(raw, 'ngn_packet_codes')
  ].filter(Boolean);

  if (explicitCodes.length > 0) {
    return Array.from(new Set(explicitCodes.map(s => String(s).trim()))).filter(Boolean).join(', ');
  }

  // 2. Extract NGN codes from general psm_sales_packet_code (prefixes PI and PF)
  const allPsmCodes = [
    ...extractCharValues(raw, 'psm_sales_packet_code'),
    ...extractCharValues(raw, 'psm_packet_code'),
    ...extractCharValues(raw, 'sales_packet_code'),
    ...extractCharValues(raw, 'sales_packet_codes')
  ].flatMap(s => String(s).split(/[\s,]+/)).map(s => s.trim()).filter(Boolean);

  const ngnFromPsm = allPsmCodes.filter(c => c.startsWith('PI') || c.startsWith('PF'));
  if (ngnFromPsm.length > 0) {
    return Array.from(new Set(ngnFromPsm)).join(', ');
  }

  // 3. Reuse extractPsmStructure to resolve NGN packet codes
  const psm = extractPsmStructure(offering, catalogPool);
  if (!psm) return '';

  const codes = [];
  if (psm.supportedNetworks?.hasNgn) {
    (psm.resolvedPops || []).forEach(p => {
      if (p.psmInternetNgn && p.psmInternetNgn !== '-') codes.push(p.psmInternetNgn);
      if (p.psmVoiceNgn && p.psmVoiceNgn !== '-') codes.push(p.psmVoiceNgn);
    });

    if (codes.length === 0 && Array.isArray(psm.salesPacketCodes)) {
      psm.salesPacketCodes.forEach(c => {
        const s = String(c).trim();
        if (s.startsWith('PI') || s.startsWith('PF')) codes.push(s);
      });
    }
  }

  return Array.from(new Set(codes.filter(Boolean))).join(', ');
}

/**
 * Extracts Wholesale / Bitstream Packet Codes for an offering.
 * Reuses existing offering characteristics and extractPsmStructure resolution.
 * 
 * @param {Object} offering 
 * @param {Array} catalogPool 
 * @returns {string} Comma-separated unique Bitstream packet codes (e.g. "PR403, PR404" or "PR411")
 */
export function extractBitstreamPacketCodes(offering, catalogPool = []) {
  if (!offering) return '';
  const raw = offering.raw || offering;

  // 1. Direct explicit Bitstream characteristics on the offering
  const explicitCodes = [
    ...extractCharValues(raw, 'psm_sales_packet_code_internet_bitstream'),
    ...extractCharValues(raw, 'psm_sales_packet_code_voice_bitstream'),
    ...extractCharValues(raw, 'psm_sales_packet_code_bitstream'),
    ...extractCharValues(raw, 'psm_sales_packet_code_internet_vpn'),
    ...extractCharValues(raw, 'psm_sales_packet_code_voice_vpn'),
    ...extractCharValues(raw, 'psm_sales_packet_code_vpn'),
    ...extractCharValues(raw, 'vpn_packet_code'),
    ...extractCharValues(raw, 'vpn_packet_codes'),
    ...extractCharValues(raw, 'bitstream_packet_code'),
    ...extractCharValues(raw, 'bitstream_packet_codes')
  ].filter(Boolean);

  if (explicitCodes.length > 0) {
    return Array.from(new Set(explicitCodes.map(s => String(s).trim()))).filter(Boolean).join(', ');
  }

  // 2. Extract Bitstream codes from general psm_sales_packet_code (prefixes PR and PB)
  const allPsmCodes = [
    ...extractCharValues(raw, 'psm_sales_packet_code'),
    ...extractCharValues(raw, 'psm_packet_code'),
    ...extractCharValues(raw, 'sales_packet_code'),
    ...extractCharValues(raw, 'sales_packet_codes')
  ].flatMap(s => String(s).split(/[\s,]+/)).map(s => s.trim()).filter(Boolean);

  const vpnFromPsm = allPsmCodes.filter(c => c.startsWith('PR') || c.startsWith('PB'));
  if (vpnFromPsm.length > 0) {
    return Array.from(new Set(vpnFromPsm)).join(', ');
  }

  // 3. Reuse extractPsmStructure to resolve Bitstream packet codes
  const psm = extractPsmStructure(offering, catalogPool);
  if (!psm) return '';

  const codes = [];
  if (psm.supportedNetworks?.hasBitstream) {
    (psm.resolvedPops || []).forEach(p => {
      if (p.psmInternetBitstream && p.psmInternetBitstream !== '-') codes.push(p.psmInternetBitstream);
      if (p.psmVoiceBitstream && p.psmVoiceBitstream !== '-') codes.push(p.psmVoiceBitstream);
    });

    if (codes.length === 0 && Array.isArray(psm.salesPacketCodes)) {
      psm.salesPacketCodes.forEach(c => {
        const s = String(c).trim();
        if (s.startsWith('PR') || s.startsWith('PB')) codes.push(s);
      });
    }
  }

  return Array.from(new Set(codes.filter(Boolean))).join(', ');
}

// Alias for backwards compatibility
export const extractVpnPacketCodes = extractBitstreamPacketCodes;

