/**
 * catalogReference.js
 *
 * Read-only Reference Catalog & Service Association API over
 * reference_data/2_reference_db/vfde_catalog_reference.db (CCB_* and PPM_* tables).
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const router = express.Router();

const STUDIO_ROOT = path.resolve(__dirname, '..', '..');
const REF_DB_PATH = path.join(STUDIO_ROOT, 'reference_data', '2_reference_db', 'vfde_catalog_reference.db');
const VAT_RATE = 0.19;

let refDb = null;

function getRefDb() {
  if (refDb) return refDb;
  if (!fs.existsSync(REF_DB_PATH)) {
    throw new Error(`Reference database not found at ${REF_DB_PATH}`);
  }
  refDb = new sqlite3.Database(REF_DB_PATH, sqlite3.OPEN_READONLY);
  return refDb;
}

function queryAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const conn = getRefDb();
      conn.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function queryOne(sql, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const conn = getRefDb();
      conn.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    } catch (err) {
      reject(err);
    }
  });
}

function parseDecimal(val) {
  if (val === null || val === undefined || val === '') return 0;
  const num = parseFloat(String(val).replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
}

function round2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function inferNetworkType(productCode) {
  if (productCode === 'I1204' || productCode === 'VI202') return 'NGN';
  if (productCode === 'I1203' || productCode === 'VI203') return 'BITSTREAM';
  return null;
}

function deriveTmfPopRole(serviceDomain, serviceType, serviceCode = '') {
  if (serviceType === 'BANDWIDTH') return '_bw';
  if (serviceType === 'MAIN_ACCESS' || /^VI\d+$/i.test(serviceCode)) return '_va';
  if (serviceType === 'ONETIME_CHARGE') return '_ot';
  if (serviceType === 'TARIFF_OPTION') return '_option';
  if (/^RZG\d+$/i.test(serviceCode)) return '_regio';
  if (serviceCode === 'V0017') {
    return serviceDomain === 'VOICE' ? '_vt' : '_in';
  }
  return serviceDomain === 'VOICE' ? '_vt' : '_in';
}

function formatTariffRow(row) {
  return {
    serviceDomain: row.SERVICE_DOMAIN,
    productCode: row.PRODUCT_CODE,
    productVersionCode: row.PRODUCT_VERSION_CODE,
    pricingStructureCode: row.PRICING_STRUCTURE_CODE,
    networkType: inferNetworkType(row.PRODUCT_CODE),
    name: row.NAME,
    effectiveDate: row.EFFECTIVE_DATE,
    tariffBase: row.TARIFF_BASE,
    vorlageProductCode: row.VORLAGE_PRODUCT_CODE || null,
    vorlagePricingStructureCode: row.VORLAGE_PRICING_STRUCTURE_CODE || null,
    ppmMapping: row.PPM_ACCESS_TYPE
      ? {
          accessType: row.PPM_ACCESS_TYPE,
          ccbProduct: row.PPM_CCB_PRODUCT,
          articleName: row.PPM_ARTICLE_NAME
        }
      : null
  };
}

async function fetchTariffServices(productCode, pricingStructureCode, { serviceType, activeOnly = true } = {}) {
  const expectedDomain = String(productCode || '').toUpperCase().startsWith('V') ? 'VOICE' : 'INTERNET';
  const conditions = [
    'pts.PRODUCT_CODE = ?',
    'pts.PRICING_STRUCTURE_CODE = ?',
    'pts.SERVICE_DOMAIN = ?'
  ];
  const params = [productCode, pricingStructureCode, expectedDomain];

  if (activeOnly) {
    conditions.push("(pts.DEACTIVATED IS NULL OR pts.DEACTIVATED = '')");
  }
  if (serviceType) {
    conditions.push('s.SERVICE_TYPE = ?');
    params.push(serviceType);
  }

  const sql = `
    SELECT
      pts.SERVICE_DOMAIN,
      pts.PRODUCT_CODE,
      pts.PRICING_STRUCTURE_CODE,
      pts.SERVICE_CODE,
      COALESCE(NULLIF(s.NAME, ''), NULLIF(ps.SERVICE_NAME, ''), NULLIF(pts.SERVICE_NAME, ''), pts.SERVICE_CODE) AS RESOLVED_NAME,
      s.SERVICE_TYPE,
      ps.PRODUCT_SUBSCRIPTION_RULE,
      ps.MAXIMUM_SUBSCRIPTIONS,
      sl.SERVICE_LEVEL_VALUE,
      (SELECT GROUP_CONCAT(DISTINCT um.USAGE_MODE_VALUE)
       FROM CCB_SERVICE_USAGE_MODE um
       WHERE um.SERVICE_DOMAIN = pts.SERVICE_DOMAIN AND um.SERVICE_CODE = pts.SERVICE_CODE) AS AVAILABLE_USAGE_MODES,
      MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'RC' THEN ect.AMOUNT END) AS RC_AMOUNT,
      MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'RC' THEN ect.PERIOD_TYPE_VALUE END) AS RC_PERIOD,
      MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'OT' THEN ect.AMOUNT END) AS OT_AMOUNT,
      MAX(ect.USAGE_MODE_VALUE) AS ECT_USAGE_MODE,
      MAX(ect.EFFECTIVE_STATUS) AS EFFECTIVE_STATUS
    FROM CCB_PRODUCT_TARIFF_SERVICE_LK pts
    LEFT JOIN CCB_SERVICE s
      ON pts.SERVICE_DOMAIN = s.SERVICE_DOMAIN AND pts.SERVICE_CODE = s.SERVICE_CODE
    LEFT JOIN CCB_PRODUCT_SERVICE_LK ps
      ON pts.SERVICE_DOMAIN = ps.SERVICE_DOMAIN AND pts.PRODUCT_CODE = ps.PRODUCT_CODE AND pts.SERVICE_CODE = ps.SERVICE_CODE
    LEFT JOIN CCB_SERVICE_LEVEL sl
      ON pts.SERVICE_DOMAIN = sl.SERVICE_DOMAIN AND pts.SERVICE_CODE = sl.SERVICE_LEVEL_ID
    LEFT JOIN CCB_ECT_PRODUCT_TARIFF_SERVICE_LK ect
      ON pts.SERVICE_DOMAIN = ect.SERVICE_DOMAIN
      AND pts.PRODUCT_CODE = ect.PRODUCT_CODE
      AND pts.PRICING_STRUCTURE_CODE = ect.PRICING_STRUCTURE_CODE
      AND pts.SERVICE_CODE = ect.SERVICE_CODE
    WHERE ${conditions.join(' AND ')}
    GROUP BY pts.SERVICE_DOMAIN, pts.PRODUCT_CODE, pts.PRICING_STRUCTURE_CODE, pts.SERVICE_CODE
    ORDER BY pts.SERVICE_DOMAIN, s.SERVICE_TYPE, pts.SERVICE_CODE
  `;

  const rows = await queryAll(sql, params);
  return rows.map((r) => {
    const rcNet = parseDecimal(r.RC_AMOUNT);
    const otNet = parseDecimal(r.OT_AMOUNT);
    return {
      serviceDomain: r.SERVICE_DOMAIN,
      serviceCode: r.SERVICE_CODE,
      serviceName: r.RESOLVED_NAME,
      serviceType: r.SERVICE_TYPE || null,
      tmfPopRole: deriveTmfPopRole(r.SERVICE_DOMAIN, r.SERVICE_TYPE, r.SERVICE_CODE),
      subscriptionRule: r.PRODUCT_SUBSCRIPTION_RULE || null,
      maxSubscriptions: r.MAXIMUM_SUBSCRIPTIONS ? parseInt(r.MAXIMUM_SUBSCRIPTIONS, 10) : null,
      serviceLevel: r.SERVICE_LEVEL_VALUE || null,
      availableUsageModes: r.AVAILABLE_USAGE_MODES ? r.AVAILABLE_USAGE_MODES.split(',').sort() : [],
      charges: {
        rcNet,
        rcGross: round2(rcNet * (1 + VAT_RATE)),
        rcPeriod: r.RC_PERIOD || 'M',
        otNet,
        otGross: round2(otNet * (1 + VAT_RATE)),
        usageModeValue: r.ECT_USAGE_MODE || '1',
        effectiveStatus: r.EFFECTIVE_STATUS || 'ACTIVE'
      }
    };
  });
}

/**
 * GET /api/reference/services
 * Master list of all catalog services across CCB_SERVICE and CCB_PRODUCT_SERVICE_LK
 * (used when creating a new tariff or showing all available services)
 */
router.get('/services', async (req, res) => {
  try {
    const { serviceDomain, productCode } = req.query;
    const conditions = [];
    const params = [];

    if (serviceDomain) {
      conditions.push('u.SERVICE_DOMAIN = ?');
      params.push(String(serviceDomain).toUpperCase());
    }
    if (productCode) {
      conditions.push('(ps.PRODUCT_CODE = ? OR ps.PRODUCT_CODE IS NULL)');
      params.push(String(productCode).toUpperCase());
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      WITH all_svc AS (
        SELECT SERVICE_DOMAIN, SERVICE_CODE FROM CCB_SERVICE
        UNION
        SELECT SERVICE_DOMAIN, SERVICE_CODE FROM CCB_PRODUCT_SERVICE_LK
        UNION
        SELECT SERVICE_DOMAIN, SERVICE_CODE FROM CCB_PRODUCT_TARIFF_SERVICE_LK
        UNION
        SELECT
          CASE WHEN PRODUCT_CODE LIKE 'V%' THEN 'VOICE' ELSE 'INTERNET' END AS SERVICE_DOMAIN,
          SERVICE_CODE
        FROM CCB_SALES_PACKAGE_CONTENT
      )
      SELECT
        u.SERVICE_DOMAIN,
        u.SERVICE_CODE,
        COALESCE(
          NULLIF(s.NAME, ''),
          NULLIF(MAX(ps.SERVICE_NAME), ''),
          NULLIF((SELECT MAX(pts.SERVICE_NAME) FROM CCB_PRODUCT_TARIFF_SERVICE_LK pts WHERE pts.SERVICE_DOMAIN = u.SERVICE_DOMAIN AND pts.SERVICE_CODE = u.SERVICE_CODE), ''),
          u.SERVICE_CODE
        ) AS RESOLVED_NAME,
        s.SERVICE_TYPE,
        MAX(ps.PRODUCT_SUBSCRIPTION_RULE) AS PRODUCT_SUBSCRIPTION_RULE,
        MAX(ps.MAXIMUM_SUBSCRIPTIONS) AS MAXIMUM_SUBSCRIPTIONS,
        sl.SERVICE_LEVEL_VALUE,
        (SELECT GROUP_CONCAT(DISTINCT um.USAGE_MODE_VALUE)
         FROM CCB_SERVICE_USAGE_MODE um
         WHERE um.SERVICE_DOMAIN = u.SERVICE_DOMAIN AND um.SERVICE_CODE = u.SERVICE_CODE) AS AVAILABLE_USAGE_MODES
      FROM all_svc u
      LEFT JOIN CCB_SERVICE s
        ON u.SERVICE_DOMAIN = s.SERVICE_DOMAIN AND u.SERVICE_CODE = s.SERVICE_CODE
      LEFT JOIN CCB_PRODUCT_SERVICE_LK ps
        ON u.SERVICE_DOMAIN = ps.SERVICE_DOMAIN AND u.SERVICE_CODE = ps.SERVICE_CODE
      LEFT JOIN CCB_SERVICE_LEVEL sl
        ON u.SERVICE_DOMAIN = sl.SERVICE_DOMAIN AND u.SERVICE_CODE = sl.SERVICE_LEVEL_ID
      ${where}
      GROUP BY u.SERVICE_DOMAIN, u.SERVICE_CODE
      ORDER BY u.SERVICE_DOMAIN, s.SERVICE_TYPE, u.SERVICE_CODE
    `;
    const rows = await queryAll(sql, params);
    const items = rows.map((r) => ({
      serviceDomain: r.SERVICE_DOMAIN,
      serviceCode: r.SERVICE_CODE,
      serviceName: r.RESOLVED_NAME,
      serviceType: r.SERVICE_TYPE || null,
      tmfPopRole: deriveTmfPopRole(r.SERVICE_DOMAIN, r.SERVICE_TYPE, r.SERVICE_CODE),
      subscriptionRule: r.PRODUCT_SUBSCRIPTION_RULE || null,
      maxSubscriptions: r.MAXIMUM_SUBSCRIPTIONS ? parseInt(r.MAXIMUM_SUBSCRIPTIONS, 10) : null,
      serviceLevel: r.SERVICE_LEVEL_VALUE || null,
      availableUsageModes: r.AVAILABLE_USAGE_MODES ? r.AVAILABLE_USAGE_MODES.split(',').sort() : [],
      charges: {
        rcNet: 0,
        rcGross: 0,
        rcPeriod: 'M',
        otNet: 0,
        otGross: 0,
        usageModeValue: '1',
        effectiveStatus: 'ACTIVE'
      }
    }));
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/tariffs
 */
router.get('/tariffs', async (req, res) => {
  try {
    const { accessType, serviceDomain, productCode } = req.query;
    const conditions = [];
    const params = [];

    if (accessType) {
      conditions.push('ppm.ACCESS_TYPE = ?');
      params.push(accessType.toUpperCase());
    }
    if (serviceDomain) {
      conditions.push('t.SERVICE_DOMAIN = ?');
      params.push(serviceDomain.toUpperCase());
    }
    if (productCode) {
      conditions.push('t.PRODUCT_CODE = ?');
      params.push(productCode.toUpperCase());
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `
      SELECT
        t.*,
        ppm.ACCESS_TYPE AS PPM_ACCESS_TYPE,
        ppm.CCB_PRODUCT AS PPM_CCB_PRODUCT,
        ppm.ARTICLE_NAME AS PPM_ARTICLE_NAME
      FROM CCB_PRODUCT_TARIFF_LK t
      LEFT JOIN PPM_REF_PRODUCT_TARIFF_ARTICLE_LK ppm
        ON t.PRODUCT_CODE = ppm.PRODUCT_CODE AND t.PRICING_STRUCTURE_CODE = ppm.PRICING_STRUCTURE_CODE
      ${where}
      ORDER BY t.SERVICE_DOMAIN, t.PRODUCT_CODE, t.PRICING_STRUCTURE_CODE
    `;
    const rows = await queryAll(sql, params);
    res.json({ count: rows.length, items: rows.map(formatTariffRow) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/tariffs/:productCode/:pricingStructureCode/services
 */
router.get('/tariffs/:productCode/:pricingStructureCode/services', async (req, res) => {
  try {
    const { productCode, pricingStructureCode } = req.params;
    const { serviceType, activeOnly = 'true' } = req.query;
    let services = await fetchTariffServices(productCode, pricingStructureCode, {
      serviceType,
      activeOnly: activeOnly !== 'false'
    });
    // Fallback: TMF/AAW uses VI204 for Voice NGN, whereas CCB tables store it under VI202
    if (services.length === 0 && productCode.toUpperCase() === 'VI204') {
      services = await fetchTariffServices('VI202', pricingStructureCode, {
        serviceType,
        activeOnly: activeOnly !== 'false'
      });
    }
    if (services.length === 0) {
      return res.status(404).json({ error: `No services found for tariff ${productCode}/${pricingStructureCode}` });
    }
    res.json({
      productCode,
      pricingStructureCode,
      networkType: inferNetworkType(productCode),
      services
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/packet-tariffs
 * Matches AAW_PACKET_ID and/or SALES_PACKET_CODE list to all Internet & Voice tariff codes
 */
router.get('/packet-tariffs', async (req, res) => {
  try {
    const { aawPacketId, salesPacketCodes } = req.query;
    const conditions = ["(p.DEACTIVATED IS NULL OR p.DEACTIVATED = '')"];
    const params = [];

    const orClauses = [];
    if (aawPacketId) {
      const aawIds = String(aawPacketId)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (aawIds.length > 0) {
        orClauses.push(`p.AAW_PACKET_ID IN (${aawIds.map(() => '?').join(',')})`);
        params.push(...aawIds);
      }
    }
    if (salesPacketCodes) {
      const codes = String(salesPacketCodes)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (codes.length > 0) {
        orClauses.push(`p.SALES_PACKET_CODE IN (${codes.map(() => '?').join(',')})`);
        params.push(...codes);
      }
    }
    if (orClauses.length > 0) {
      conditions.push(`(${orClauses.join(' OR ')})`);
    }

    const sql = `
      SELECT
        p.AAW_PACKET_ID,
        p.SALES_PACKET_CODE,
        p.SALES_PACKET_NAME,
        p.Z_PLAY_TYPE,
        p.Z_BANDWIDTH,
        p.BILLING_NAME_BASE_CHARGE,
        c.PRODUCT_CODE,
        c.PRICING_STRUCTURE_CODE,
        t.SERVICE_DOMAIN,
        t.NAME AS TARIFF_NAME
      FROM CCB_SALES_PACKAGE p
      JOIN CCB_SALES_PACKAGE_CONTENT c ON p.SALES_PACKET_CODE = c.SALES_PACKET_CODE
      LEFT JOIN CCB_PRODUCT_TARIFF_LK t
        ON c.PRODUCT_CODE = t.PRODUCT_CODE AND c.PRICING_STRUCTURE_CODE = t.PRICING_STRUCTURE_CODE
      WHERE ${conditions.join(' AND ')}
        AND (c.DEACTIVATED IS NULL OR c.DEACTIVATED = '')
      GROUP BY p.SALES_PACKET_CODE, c.PRODUCT_CODE, c.PRICING_STRUCTURE_CODE
      ORDER BY p.SALES_PACKET_CODE, c.PRODUCT_CODE
    `;
    const rows = await queryAll(sql, params);

    const byPacket = new Map();
    for (const r of rows) {
      if (!byPacket.has(r.SALES_PACKET_CODE)) {
        byPacket.set(r.SALES_PACKET_CODE, {
          salesPacketCode: r.SALES_PACKET_CODE,
          aawPacketId: r.AAW_PACKET_ID,
          salesPacketName: r.SALES_PACKET_NAME,
          playType: r.Z_PLAY_TYPE,
          bandwidth: r.Z_BANDWIDTH,
          grossBaseCharge: parseDecimal(r.BILLING_NAME_BASE_CHARGE),
          internetTariffs: [],
          voiceTariffs: []
        });
      }
      const entry = byPacket.get(r.SALES_PACKET_CODE);
      const domain = r.SERVICE_DOMAIN || (r.PRODUCT_CODE.startsWith('V') ? 'VOICE' : 'INTERNET');
      const tariffItem = {
        productCode: r.PRODUCT_CODE,
        pricingStructureCode: r.PRICING_STRUCTURE_CODE,
        networkType: inferNetworkType(r.PRODUCT_CODE),
        tariffName: r.TARIFF_NAME || r.PRICING_STRUCTURE_CODE
      };
      if (domain === 'VOICE') {
        entry.voiceTariffs.push(tariffItem);
      } else {
        entry.internetTariffs.push(tariffItem);
      }
    }

    const items = Array.from(byPacket.values());
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/packages
 */
router.get('/packages', async (req, res) => {
  try {
    const { playType, bandwidth, minContractDuration } = req.query;
    const conditions = ["(DEACTIVATED IS NULL OR DEACTIVATED = '')"];
    const params = [];

    if (playType !== undefined) {
      conditions.push('Z_PLAY_TYPE = ?');
      params.push(parseInt(playType, 10));
    }
    if (bandwidth !== undefined) {
      conditions.push('Z_BANDWIDTH = ?');
      params.push(parseInt(bandwidth, 10));
    }
    if (minContractDuration !== undefined) {
      conditions.push('Z_MIN_CONTRACT_DURATION = ?');
      params.push(parseInt(minContractDuration, 10));
    }

    const sql = `
      SELECT * FROM CCB_SALES_PACKAGE
      WHERE ${conditions.join(' AND ')}
      ORDER BY SALES_PACKET_CODE
    `;
    const rows = await queryAll(sql, params);
    const items = rows.map((r) => ({
      salesPacketCode: r.SALES_PACKET_CODE,
      aawPacketId: r.AAW_PACKET_ID,
      playType: r.Z_PLAY_TYPE,
      bandwidth: r.Z_BANDWIDTH,
      minContractDuration: r.Z_MIN_CONTRACT_DURATION,
      salesPacketName: r.SALES_PACKET_NAME,
      effectiveDate: r.EFFECTIVE_DATE,
      netVerificationCharge: parseDecimal(r.NET_VERIFICATION_CHARGE),
      grossBaseCharge: parseDecimal(r.BILLING_NAME_BASE_CHARGE)
    }));
    res.json({ count: items.length, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/packages/:salesPacketCode
 */
router.get('/packages/:salesPacketCode', async (req, res) => {
  try {
    const { salesPacketCode } = req.params;
    const headerRow = await queryOne(
      'SELECT * FROM CCB_SALES_PACKAGE WHERE SALES_PACKET_CODE = ?',
      [salesPacketCode]
    );
    if (!headerRow) {
      return res.status(404).json({ error: `Sales package ${salesPacketCode} not found` });
    }

    const contentSql = `
      SELECT
        c.SALES_PACKET_CODE,
        c.PRODUCT_CODE,
        c.PRICING_STRUCTURE_CODE,
        c.SERVICE_CODE,
        c.MANDATORY_INDICATOR,
        c.INVOICE_GROUPING_IND,
        t.SERVICE_DOMAIN AS TARIFF_DOMAIN,
        COALESCE(NULLIF(s.NAME, ''), NULLIF(ps.SERVICE_NAME, ''), NULLIF(pts.SERVICE_NAME, ''), c.SERVICE_CODE) AS RESOLVED_NAME,
        s.SERVICE_TYPE,
        ps.PRODUCT_SUBSCRIPTION_RULE,
        ps.MAXIMUM_SUBSCRIPTIONS,
        sl.SERVICE_LEVEL_VALUE,
        MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'RC' THEN ect.AMOUNT END) AS RC_AMOUNT,
        MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'RC' THEN ect.PERIOD_TYPE_VALUE END) AS RC_PERIOD,
        MAX(CASE WHEN ect.CHARGE_OCCURRENCE_TYPE = 'OT' THEN ect.AMOUNT END) AS OT_AMOUNT,
        MAX(ect.USAGE_MODE_VALUE) AS ECT_USAGE_MODE,
        MAX(ect.EFFECTIVE_STATUS) AS EFFECTIVE_STATUS
      FROM CCB_SALES_PACKAGE_CONTENT c
      LEFT JOIN CCB_PRODUCT_TARIFF_LK t
        ON c.PRODUCT_CODE = t.PRODUCT_CODE AND c.PRICING_STRUCTURE_CODE = t.PRICING_STRUCTURE_CODE
      LEFT JOIN CCB_SERVICE s
        ON c.SERVICE_CODE = s.SERVICE_CODE AND (t.SERVICE_DOMAIN IS NULL OR s.SERVICE_DOMAIN = t.SERVICE_DOMAIN)
      LEFT JOIN CCB_PRODUCT_SERVICE_LK ps
        ON c.PRODUCT_CODE = ps.PRODUCT_CODE AND c.SERVICE_CODE = ps.SERVICE_CODE AND (t.SERVICE_DOMAIN IS NULL OR ps.SERVICE_DOMAIN = t.SERVICE_DOMAIN)
      LEFT JOIN CCB_PRODUCT_TARIFF_SERVICE_LK pts
        ON c.PRODUCT_CODE = pts.PRODUCT_CODE AND c.PRICING_STRUCTURE_CODE = pts.PRICING_STRUCTURE_CODE AND c.SERVICE_CODE = pts.SERVICE_CODE AND (t.SERVICE_DOMAIN IS NULL OR pts.SERVICE_DOMAIN = t.SERVICE_DOMAIN)
      LEFT JOIN CCB_SERVICE_LEVEL sl
        ON c.SERVICE_CODE = sl.SERVICE_LEVEL_ID AND (t.SERVICE_DOMAIN IS NULL OR sl.SERVICE_DOMAIN = t.SERVICE_DOMAIN)
      LEFT JOIN CCB_ECT_PRODUCT_TARIFF_SERVICE_LK ect
        ON c.PRODUCT_CODE = ect.PRODUCT_CODE AND c.PRICING_STRUCTURE_CODE = ect.PRICING_STRUCTURE_CODE AND c.SERVICE_CODE = ect.SERVICE_CODE AND (t.SERVICE_DOMAIN IS NULL OR ect.SERVICE_DOMAIN = t.SERVICE_DOMAIN)
      WHERE c.SALES_PACKET_CODE = ?
        AND (c.DEACTIVATED IS NULL OR c.DEACTIVATED = '')
      GROUP BY c.SALES_PACKET_CODE, c.PRODUCT_CODE, c.PRICING_STRUCTURE_CODE, c.SERVICE_CODE
      ORDER BY c.PRODUCT_CODE, c.MANDATORY_INDICATOR DESC, c.SERVICE_CODE
    `;
    const contentRows = await queryAll(contentSql, [salesPacketCode]);

    const tariffSql = `
      SELECT DISTINCT
        t.*,
        ppm.ACCESS_TYPE AS PPM_ACCESS_TYPE,
        ppm.CCB_PRODUCT AS PPM_CCB_PRODUCT,
        ppm.ARTICLE_NAME AS PPM_ARTICLE_NAME
      FROM CCB_SALES_PACKAGE_CONTENT c
      JOIN CCB_PRODUCT_TARIFF_LK t
        ON c.PRODUCT_CODE = t.PRODUCT_CODE AND c.PRICING_STRUCTURE_CODE = t.PRICING_STRUCTURE_CODE
      LEFT JOIN PPM_REF_PRODUCT_TARIFF_ARTICLE_LK ppm
        ON t.PRODUCT_CODE = ppm.PRODUCT_CODE AND t.PRICING_STRUCTURE_CODE = ppm.PRICING_STRUCTURE_CODE
      WHERE c.SALES_PACKET_CODE = ?
    `;
    const tariffRows = await queryAll(tariffSql, [salesPacketCode]);

    let mandatoryNetRcSum = 0;
    const associations = contentRows.map((r) => {
      const domain = r.TARIFF_DOMAIN || (r.PRODUCT_CODE.startsWith('V') ? 'VOICE' : 'INTERNET');
      const rcNet = parseDecimal(r.RC_AMOUNT);
      const otNet = parseDecimal(r.OT_AMOUNT);
      if (r.MANDATORY_INDICATOR === 'Y') {
        mandatoryNetRcSum += rcNet;
      }
      return {
        productCode: r.PRODUCT_CODE,
        pricingStructureCode: r.PRICING_STRUCTURE_CODE,
        serviceDomain: domain,
        serviceCode: r.SERVICE_CODE,
        serviceName: r.RESOLVED_NAME,
        serviceType: r.SERVICE_TYPE || null,
        tmfPopRole: deriveTmfPopRole(domain, r.SERVICE_TYPE, r.SERVICE_CODE),
        mandatoryIndicator: r.MANDATORY_INDICATOR,
        invoiceGroupingInd: r.INVOICE_GROUPING_IND,
        subscriptionRule: r.PRODUCT_SUBSCRIPTION_RULE || null,
        maxSubscriptions: r.MAXIMUM_SUBSCRIPTIONS ? parseInt(r.MAXIMUM_SUBSCRIPTIONS, 10) : null,
        serviceLevel: r.SERVICE_LEVEL_VALUE || null,
        charges: {
          rcNet,
          rcGross: round2(rcNet * (1 + VAT_RATE)),
          rcPeriod: r.RC_PERIOD || 'M',
          otNet,
          otGross: round2(otNet * (1 + VAT_RATE)),
          usageModeValue: r.ECT_USAGE_MODE || '1',
          effectiveStatus: r.EFFECTIVE_STATUS || 'ACTIVE'
        }
      };
    });

    res.json({
      header: {
        salesPacketCode: headerRow.SALES_PACKET_CODE,
        aawPacketId: headerRow.AAW_PACKET_ID,
        playType: headerRow.Z_PLAY_TYPE,
        bandwidth: headerRow.Z_BANDWIDTH,
        minContractDuration: headerRow.Z_MIN_CONTRACT_DURATION,
        salesPacketName: headerRow.SALES_PACKET_NAME,
        effectiveDate: headerRow.EFFECTIVE_DATE,
        netVerificationCharge: parseDecimal(headerRow.NET_VERIFICATION_CHARGE),
        grossBaseCharge: parseDecimal(headerRow.BILLING_NAME_BASE_CHARGE)
      },
      tariffs: tariffRows.map(formatTariffRow),
      associations,
      computedTotals: {
        mandatoryNetRcSum: Number(mandatoryNetRcSum.toFixed(4)),
        mandatoryGrossRcSum: round2(mandatoryNetRcSum * (1 + VAT_RATE))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reference/ppm-articles
 */
router.get('/ppm-articles', async (req, res) => {
  try {
    const { accessType, salesComponentType, coProduct, q, limit = '50' } = req.query;
    const conditions = ["EFFECTIVE_STATUS = 'ACTIVE'", "DISCONTINUE_IND = 'N'"];
    const params = [];

    if (accessType) {
      conditions.push('ACCESS_TYPE = ?');
      params.push(accessType.toUpperCase());
    }
    if (salesComponentType !== undefined) {
      conditions.push('SALES_COMPONENT_TYPE = ?');
      params.push(parseInt(salesComponentType, 10));
    }
    if (coProduct !== undefined) {
      conditions.push('CO_PRODUCT = ?');
      params.push(parseInt(coProduct, 10));
    }
    if (q) {
      conditions.push('(LOWER(ARTICLE_NAME) LIKE ? OR LOWER(ARTICLE_CODE) LIKE ?)');
      const term = `%${q.toLowerCase()}%`;
      params.push(term, term);
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const sql = `
      SELECT ACCESS_TYPE, ARTICLE_CODE, ARTICLE_NAME, EFFECTIVE_STATUS, CO_PRODUCT, SALES_COMPONENT_TYPE, SALES_SEGMENT
      FROM PPM_REF_ARTICLE
      WHERE ${conditions.join(' AND ')}
      ORDER BY ACCESS_TYPE, ARTICLE_CODE
      LIMIT ?
    `;
    const rows = await queryAll(sql, [...params, parsedLimit]);
    res.json({
      count: rows.length,
      items: rows.map((r) => ({
        accessType: r.ACCESS_TYPE,
        articleCode: r.ARTICLE_CODE,
        articleName: r.ARTICLE_NAME,
        effectiveStatus: r.EFFECTIVE_STATUS,
        coProduct: r.CO_PRODUCT,
        salesComponentType: r.SALES_COMPONENT_TYPE,
        salesSegment: r.SALES_SEGMENT
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reference/validate-rollup
 */
router.post('/validate-rollup', async (req, res) => {
  try {
    const { targetGrossPrice, vatRate = VAT_RATE, associations = [] } = req.body || {};
    if (targetGrossPrice === undefined || !Array.isArray(associations)) {
      return res.status(400).json({ error: 'targetGrossPrice and associations[] are required.' });
    }

    const warnings = [];
    const tmfPopBreakdown = {};
    let mandatoryNetRcSum = 0;

    for (const item of associations) {
      const domain = item.serviceDomain || (String(item.productCode || '').startsWith('V') ? 'VOICE' : 'INTERNET');
      const role = item.tmfPopRole || deriveTmfPopRole(domain, item.serviceType, item.serviceCode);
      const rcNet = Number(item.rcNet) || 0;

      if (item.mandatoryIndicator === 'Y') {
        mandatoryNetRcSum += rcNet;
        if (!tmfPopBreakdown[role]) {
          tmfPopBreakdown[role] = { net: 0, gross: 0, serviceCodes: [] };
        }
        tmfPopBreakdown[role].net = Number((tmfPopBreakdown[role].net + rcNet).toFixed(4));
        tmfPopBreakdown[role].gross = round2(tmfPopBreakdown[role].net * (1 + vatRate));
        tmfPopBreakdown[role].serviceCodes.push(item.serviceCode);
      }
    }

    const mandatoryGrossRcSum = round2(mandatoryNetRcSum * (1 + vatRate));
    const deltaGross = round2(mandatoryGrossRcSum - Number(targetGrossPrice));
    const valid = Math.abs(deltaGross) <= 0.02;

    if (!valid) {
      warnings.push(
        `Gross rollup mismatch: mandatory services sum to ${mandatoryGrossRcSum.toFixed(2)} EUR vs target ${Number(targetGrossPrice).toFixed(2)} EUR (delta ${deltaGross.toFixed(2)} EUR).`
      );
    }

    res.json({
      valid,
      mandatoryNetRcSum: Number(mandatoryNetRcSum.toFixed(4)),
      mandatoryGrossRcSum,
      deltaGross,
      warnings,
      tmfPopBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
