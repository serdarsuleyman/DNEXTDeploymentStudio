import React, { useState, useEffect, useMemo } from 'react';
import { C } from '../../styles/theme';

/**
 * CcbServiceAssociationPanel
 *
 * STEP 3: Internet and Voice Services
 * - Top Selected Services pane showing all selected services + live Net/Gross rollup
 * - Two independent, filterable side-by-side tables: Internet Services (left) & Voice Services (right)
 */
export default function CcbServiceAssociationPanel({
  technology = 'FIBRE',
  activePop = null,
  savedAssociations = [],
  tablesOnly = false,
  onApplyToActivePop,
  onAssociationsChange
}) {
  const [mode, setMode] = useState('clone'); // 'clone' | 'tariff'
  const [packages, setPackages] = useState([]);
  const [selectedPacketCode, setSelectedPacketCode] = useState('');
  const [tariffs, setTariffs] = useState([]);
  const [selectedInternetTariff, setSelectedInternetTariff] = useState('');
  const [selectedVoiceTariff, setSelectedVoiceTariff] = useState('');
  const [associations, setAssociations] = useState(savedAssociations || []);
  const [ppmArticles, setPpmArticles] = useState([]);
  const [targetGrossPrice, setTargetGrossPrice] = useState(() =>
    activePop?.price ? Number(activePop.price) : 39.99
  );
  const [rollupResult, setRollupResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedBanner, setAppliedBanner] = useState('');

  // Independent filter states for Internet & Voice tables
  const [inetSearch, setInetSearch] = useState('');
  const [inetTypeFilter, setInetTypeFilter] = useState('ALL');
  const [inetSelectedOnly, setInetSelectedOnly] = useState(false);

  const [voiceSearch, setVoiceSearch] = useState('');
  const [voiceTypeFilter, setVoiceTypeFilter] = useState('ALL');
  const [voiceSelectedOnly, setVoiceSelectedOnly] = useState(false);

  const accessType = technology === 'DSL' ? 'DSL' : 'FIBRE';

  useEffect(() => {
    if (Array.isArray(savedAssociations) && savedAssociations.length > 0) {
      setAssociations(savedAssociations);
    }
  }, [savedAssociations]);

  useEffect(() => {
    if (activePop?.price !== undefined && activePop?.price !== '') {
      setTargetGrossPrice(Number(activePop.price) || 0);
    }
  }, [activePop?.id, activePop?.price]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch('/api/reference/packages').then((r) => (r.ok ? r.json() : { items: [] })),
      fetch(`/api/reference/tariffs?accessType=${encodeURIComponent(accessType)}`).then((r) =>
        r.ok ? r.json() : { items: [] }
      ),
      fetch(`/api/reference/ppm-articles?accessType=${encodeURIComponent(accessType)}&limit=100`).then((r) =>
        r.ok ? r.json() : { items: [] }
      )
    ])
      .then(([pkgRes, tariffRes, ppmRes]) => {
        if (!mounted) return;
        setPackages(pkgRes.items || []);
        setTariffs(tariffRes.items || []);
        setPpmArticles(ppmRes.items || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      });
    return () => {
      mounted = false;
    };
  }, [accessType]);

  const handleLoadPackage = async (packetCode) => {
    setSelectedPacketCode(packetCode);
    setAppliedBanner('');
    setError('');
    if (!packetCode) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reference/packages/${encodeURIComponent(packetCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load package');

      const mapped = (data.associations || []).map((a) => ({
        ...a,
        rcNet: a.charges?.rcNet ?? 0,
        otNet: a.charges?.otNet ?? 0,
        ppmArticleCode: ''
      }));
      setAssociations(mapped);
      if (data.header?.grossBaseCharge) {
        setTargetGrossPrice(data.header.grossBaseCharge);
      }
      setRollupResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromTariffs = async () => {
    setAppliedBanner('');
    setError('');
    const selections = [selectedInternetTariff, selectedVoiceTariff].filter(Boolean);
    if (selections.length === 0) {
      setError('Select at least one Internet or Voice tariff.');
      return;
    }
    setLoading(true);
    try {
      const results = await Promise.all(
        selections.map(async (pair) => {
          const [prod, tariff] = pair.split('|');
          const domainGuess = prod.startsWith('V') ? 'VOICE' : 'INTERNET';
          const res = await fetch(
            `/api/reference/tariffs/${encodeURIComponent(prod)}/${encodeURIComponent(tariff)}/services`
          );
          let serviceList = [];
          if (res.ok) {
            const data = await res.json();
            serviceList = data.services || [];
          }
          // Fallback to all catalog services if tariff is newly created / not in CCB
          if (serviceList.length === 0) {
            const masterRes = await fetch(`/api/reference/services?serviceDomain=${encodeURIComponent(domainGuess)}`);
            if (masterRes.ok) {
              const masterData = await masterRes.json();
              serviceList = masterData.items || [];
            }
          }
          return serviceList.map((s) => ({
            productCode: prod,
            pricingStructureCode: tariff,
            serviceDomain: s.serviceDomain,
            serviceCode: s.serviceCode,
            serviceName: s.serviceName,
            serviceType: s.serviceType,
            tmfPopRole: s.tmfPopRole,
            mandatoryIndicator:
              s.subscriptionRule === 'M' ||
              s.serviceCode === 'V0017' ||
              s.serviceType === 'BANDWIDTH' ||
              s.serviceType === 'MAIN_ACCESS'
                ? 'Y'
                : 'N',
            subscriptionRule: s.subscriptionRule,
            rcNet: s.charges?.rcNet ?? 0,
            otNet: s.charges?.otNet ?? 0,
            ppmArticleCode: ''
          }));
        })
      );
      setAssociations(results.flat());
      setRollupResult(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const commitAssociations = (next) => {
    setAssociations(next);
    if (onAssociationsChange) onAssociationsChange(next);
  };

  const handleToggleSelect = (targetIdx) => {
    const next = associations.map((row, i) => {
      if (i !== targetIdx) return row;
      const nextMandatory = row.mandatoryIndicator === 'Y' ? 'N' : 'Y';
      const gross =
        row.rcGross !== undefined
          ? row.rcGross
          : Math.round(((Number(row.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
      return {
        ...row,
        mandatoryIndicator: nextMandatory,
        rcGross: gross,
        billingName: row.billingName !== undefined ? row.billingName : ''
      };
    });
    commitAssociations(next);
    setRollupResult(null);
  };

  const handleLoadAllMasterServices = async (domain) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/reference/services?serviceDomain=${encodeURIComponent(domain)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load catalog services');
      const existingCodes = new Set(
        associations.filter((a) => a.serviceDomain === domain).map((a) => a.serviceCode)
      );
      const defaultProd = domain === 'VOICE' ? 'VI202' : 'I1204';
      const additions = (data.items || [])
        .filter((s) => !existingCodes.has(s.serviceCode))
        .map((s) => ({
          productCode: defaultProd,
          pricingStructureCode: 'CUSTOM',
          serviceDomain: s.serviceDomain,
          serviceCode: s.serviceCode,
          serviceName: s.serviceName,
          serviceType: s.serviceType,
          tmfPopRole: s.tmfPopRole,
          mandatoryIndicator: 'N',
          subscriptionRule: s.subscriptionRule,
          rcNet: 0,
          otNet: 0,
          ppmArticleCode: ''
        }));
      if (additions.length > 0) {
        setAssociations((prev) => [...prev, ...additions]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRcNet = (targetIdx, val) => {
    const num = parseFloat(val);
    const safeNet = Number.isFinite(num) ? num : 0;
    const safeGross = Math.round((safeNet * 1.19 + Number.EPSILON) * 100) / 100;
    const next = associations.map((row, i) =>
      i === targetIdx ? { ...row, rcNet: safeNet, rcGross: safeGross } : row
    );
    commitAssociations(next);
    setRollupResult(null);
  };

  const handleUpdateRcGross = (targetIdx, val) => {
    const num = parseFloat(val);
    const safeGross = Number.isFinite(num) ? num : 0;
    const safeNet = Math.round(((safeGross / 1.19) + Number.EPSILON) * 10000) / 10000;
    const next = associations.map((row, i) =>
      i === targetIdx ? { ...row, rcGross: safeGross, rcNet: safeNet } : row
    );
    commitAssociations(next);
    setRollupResult(null);
  };

  const handleUpdateBillingName = (targetIdx, val) => {
    const next = associations.map((row, i) =>
      i === targetIdx ? { ...row, billingName: val } : row
    );
    commitAssociations(next);
  };

  const handleUpdatePpmArticle = (targetIdx, code) => {
    setAssociations((prev) =>
      prev.map((row, i) => (i === targetIdx ? { ...row, ppmArticleCode: code } : row))
    );
  };

  const handleValidateRollup = async () => {
    setError('');
    try {
      const res = await fetch('/api/reference/validate-rollup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGrossPrice: Number(targetGrossPrice) || 0,
          associations
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setRollupResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const handleApply = async () => {
    const result = rollupResult || (await handleValidateRollup());
    if (!result || !onApplyToActivePop) return;

    const internetRow = associations.find((a) => a.serviceDomain === 'INTERNET');
    const voiceRow = associations.find((a) => a.serviceDomain === 'VOICE');
    const bwRow = associations.find(
      (a) => a.mandatoryIndicator === 'Y' && (a.tmfPopRole === '_bw' || a.serviceType === 'BANDWIDTH')
    );

    onApplyToActivePop({
      tmfPopBreakdown: result.tmfPopBreakdown,
      mandatoryGrossRcSum: result.mandatoryGrossRcSum,
      internetTariffCode: internetRow?.pricingStructureCode || '',
      voiceTariffCode: voiceRow?.pricingStructureCode || '',
      bandwidthServiceCode: bwRow?.serviceCode || '',
      salesPacketCode: selectedPacketCode || '',
      associations
    });
    setAppliedBanner(
      `Applied €${result.mandatoryGrossRcSum.toFixed(2)} breakdown to ${activePop?.id || 'active POP'}`
    );
  };

  // Indexed rows so edits always map back to the exact item in `associations`
  const indexedRows = useMemo(
    () => associations.map((row, idx) => ({ row, idx })),
    [associations]
  );

  const internetAll = useMemo(
    () => indexedRows.filter(({ row }) => row.serviceDomain === 'INTERNET'),
    [indexedRows]
  );
  const voiceAll = useMemo(
    () => indexedRows.filter(({ row }) => row.serviceDomain === 'VOICE'),
    [indexedRows]
  );

  const internetTypes = useMemo(
    () => Array.from(new Set(internetAll.map(({ row }) => row.serviceType || 'OTHER'))).sort(),
    [internetAll]
  );
  const voiceTypes = useMemo(
    () => Array.from(new Set(voiceAll.map(({ row }) => row.serviceType || 'OTHER'))).sort(),
    [voiceAll]
  );

  const filterRows = (list, search, typeFilter, selectedOnly) => {
    const q = search.trim().toLowerCase();
    return list.filter(({ row }) => {
      if (selectedOnly && row.mandatoryIndicator !== 'Y') return false;
      if (typeFilter !== 'ALL' && (row.serviceType || 'OTHER') !== typeFilter) return false;
      if (q) {
        const hay = `${row.serviceCode} ${row.serviceName} ${row.productCode} ${row.pricingStructureCode}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  };

  const internetFiltered = useMemo(
    () => filterRows(internetAll, inetSearch, inetTypeFilter, inetSelectedOnly),
    [internetAll, inetSearch, inetTypeFilter, inetSelectedOnly]
  );
  const voiceFiltered = useMemo(
    () => filterRows(voiceAll, voiceSearch, voiceTypeFilter, voiceSelectedOnly),
    [voiceAll, voiceSearch, voiceTypeFilter, voiceSelectedOnly]
  );

  const selectedItems = useMemo(
    () => indexedRows.filter(({ row }) => row.mandatoryIndicator === 'Y'),
    [indexedRows]
  );

  const liveNetSum = useMemo(
    () => selectedItems.reduce((acc, { row }) => acc + (Number(row.rcNet) || 0), 0),
    [selectedItems]
  );
  const liveGrossSum = Math.round((liveNetSum * 1.19 + Number.EPSILON) * 100) / 100;

  const internetTariffs = tariffs.filter((t) => t.serviceDomain === 'INTERNET');
  const voiceTariffs = tariffs.filter((t) => t.serviceDomain === 'VOICE');

  const renderServiceTable = ({
    domain,
    title,
    domainBadgeColor,
    domainBgColor,
    rows,
    totalCount,
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    types,
    selectedOnly,
    setSelectedOnly
  }) => (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--ds-border)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0
      }}
    >
      {/* Table Card Header + Filters */}
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--ds-surface-subtle)',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '4px',
                background: domainBgColor,
                color: domainBadgeColor
              }}
            >
              {title}
            </span>
            <span style={{ fontSize: '11px', color: C.muted }}>
              Showing {rows.length} of {totalCount}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleLoadAllMasterServices(domain)}
              disabled={loading}
              title={`Show all ${domain} services from catalog`}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '4px',
                border: `1px solid ${domainBadgeColor}`,
                background: '#fff',
                color: domainBadgeColor,
                cursor: 'pointer'
              }}
            >
              + Show All Services
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: C.text, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={selectedOnly}
                onChange={(e) => setSelectedOnly(e.target.checked)}
              />
              Selected only
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by code, name, tariff..."
            style={{
              flex: '1 1 160px',
              padding: '6px 8px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--ds-border)',
              background: '#fff'
            }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              borderRadius: '6px',
              border: '1px solid var(--ds-border)',
              background: '#fff'
            }}
          >
            <option value="ALL">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div style={{ maxHeight: '400px', overflowY: 'auto', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--ds-border)', textAlign: 'left', position: 'sticky', top: 0 }}>
              <th style={{ padding: '7px 8px', width: '36px' }}>Sel</th>
              <th style={{ padding: '7px 8px' }}>Service</th>
              <th style={{ padding: '7px 8px' }}>Role</th>
              <th style={{ padding: '7px 8px' }}>Net RC (€)</th>
              <th style={{ padding: '7px 8px' }}>Gross (€)</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: C.muted }}>
                  No services loaded or matching current filter.
                </td>
              </tr>
            ) : (
              rows.map(({ row, idx }) => {
                const isSelected = row.mandatoryIndicator === 'Y';
                const gross =
                  row.rcGross !== undefined && row.rcGross !== null && row.rcGross !== ''
                    ? Number(row.rcGross) || 0
                    : Math.round(((Number(row.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
                const rowKey = `${row.productCode}-${row.pricingStructureCode}-${row.serviceCode}-${idx}`;
                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      style={{
                        borderBottom: isSelected ? 'none' : '1px solid var(--ds-border)',
                        background: isSelected ? '#f0fdf4' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(idx)}
                        />
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <div>
                          <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{row.serviceCode}</span>{' '}
                          <span>{row.serviceName}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: C.muted }}>
                          {row.productCode}/{row.pricingStructureCode}
                          {row.serviceType ? ` · ${row.serviceType}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <span style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '2px 5px', borderRadius: '4px', fontSize: '11px' }}>
                          {row.tmfPopRole}
                        </span>
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <input
                          type="number"
                          step="0.0001"
                          value={row.rcNet}
                          onChange={(e) => handleUpdateRcNet(idx, e.target.value)}
                          style={{
                            width: '76px',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--ds-border)',
                            fontSize: '12px'
                          }}
                        />
                      </td>
                      <td style={{ padding: '6px 8px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        €{gross.toFixed(2)}
                      </td>
                    </tr>
                    {isSelected && (
                      <tr
                        style={{
                          borderBottom: '1px solid var(--ds-border)',
                          background: '#f8fafc'
                        }}
                      >
                        <td colSpan={5} style={{ padding: '8px 12px 10px 34px' }}>
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '110px 110px minmax(180px, 1fr)',
                            gap: '10px',
                            alignItems: 'end',
                            background: '#ffffff',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '8px 10px'
                          }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: 'var(--ds-text-3)', marginBottom: '3px' }}>
                                Net Price (€)
                              </label>
                              <input
                                type="number"
                                step="0.0001"
                                value={row.rcNet ?? 0}
                                onChange={(e) => handleUpdateRcNet(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--ds-border-strong)',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: 'var(--ds-text-3)', marginBottom: '3px' }}>
                                Gross Price (€)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={gross}
                                onChange={(e) => handleUpdateRcGross(idx, e.target.value)}
                                style={{
                                  width: '100%',
                                  padding: '4px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--ds-border-strong)',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '10.5px', fontWeight: '700', color: 'var(--ds-text-3)', marginBottom: '3px' }}>
                                Billing Name
                              </label>
                              <input
                                type="text"
                                value={row.billingName || ''}
                                onChange={(e) => handleUpdateBillingName(idx, e.target.value)}
                                placeholder={row.serviceName || 'Enter billing name...'}
                                style={{
                                  width: '100%',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid var(--ds-border-strong)',
                                  fontSize: '12px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {!tablesOnly && (
        <>
          {/* Source Loader Card */}
          <div
        style={{
          background: C.panel,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '10px',
          padding: '18px 22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CCB Internet &amp; Voice Service Association
              </h3>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                vfde_catalog_reference.db
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
              Clone an existing CCB Sales Package or load Internet &amp; Voice tariffs, filter and select services below, and apply to the active Bundled POP.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setMode('clone')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                cursor: 'pointer',
                border: `1px solid ${mode === 'clone' ? C.vodafoneRed : 'var(--ds-border)'}`,
                background: mode === 'clone' ? '#fef2f2' : '#fff',
                color: mode === 'clone' ? C.vodafoneRed : C.text
              }}
            >
              Clone CCB Package
            </button>
            <button
              type="button"
              onClick={() => setMode('tariff')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                cursor: 'pointer',
                border: `1px solid ${mode === 'tariff' ? C.vodafoneRed : 'var(--ds-border)'}`,
                background: mode === 'tariff' ? '#fef2f2' : '#fff',
                color: mode === 'tariff' ? C.vodafoneRed : C.text
              }}
            >
              Select Tariffs ({accessType})
            </button>
          </div>
        </div>

        {mode === 'clone' ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedPacketCode}
              onChange={(e) => handleLoadPackage(e.target.value)}
              style={{
                flex: '1 1 320px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--ds-border)',
                fontSize: '12px',
                background: '#fff'
              }}
            >
              <option value="">-- Select a CCB Sales Package to clone ({packages.length} available) --</option>
              {packages.map((p) => (
                <option key={p.salesPacketCode} value={p.salesPacketCode}>
                  {p.salesPacketCode} — {p.salesPacketName} ({p.playType}-Play, {p.bandwidth}M, €{p.grossBaseCharge})
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: C.muted, fontWeight: '600' }}>Target Gross (€):</span>
              <input
                type="number"
                step="0.01"
                value={targetGrossPrice}
                onChange={(e) => {
                  setTargetGrossPrice(e.target.value);
                  setRollupResult(null);
                }}
                style={{
                  width: '90px',
                  padding: '7px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--ds-border)',
                  fontSize: '12px'
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedInternetTariff}
              onChange={(e) => setSelectedInternetTariff(e.target.value)}
              style={{
                flex: '1 1 240px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--ds-border)',
                fontSize: '12px',
                background: '#fff'
              }}
            >
              <option value="">-- Internet Tariff ({internetTariffs.length}) --</option>
              {internetTariffs.map((t) => (
                <option key={`${t.productCode}|${t.pricingStructureCode}`} value={`${t.productCode}|${t.pricingStructureCode}`}>
                  [{t.networkType}] {t.productCode}/{t.pricingStructureCode} — {t.name}
                </option>
              ))}
            </select>
            <select
              value={selectedVoiceTariff}
              onChange={(e) => setSelectedVoiceTariff(e.target.value)}
              style={{
                flex: '1 1 240px',
                padding: '8px 10px',
                borderRadius: '6px',
                border: '1px solid var(--ds-border)',
                fontSize: '12px',
                background: '#fff'
              }}
            >
              <option value="">-- Voice Tariff ({voiceTariffs.length}) --</option>
              {voiceTariffs.map((t) => (
                <option key={`${t.productCode}|${t.pricingStructureCode}`} value={`${t.productCode}|${t.pricingStructureCode}`}>
                  [{t.networkType}] {t.productCode}/{t.pricingStructureCode} — {t.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleLoadFromTariffs}
              disabled={loading}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                background: C.vodafoneRed,
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Load Services'}
            </button>
          </div>
        )}

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '12px' }}>
            {error}
          </div>
        )}
        {appliedBanner && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: '600' }}>
            {appliedBanner}
          </div>
        )}
      </div>

      {/* Top Selected Services Pane */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Selected Services ({selectedItems.length})
            </span>
            <span style={{ fontSize: '12px', color: C.muted }}>
              Net RC: <strong>€{liveNetSum.toFixed(4)}</strong> · Gross RC:{' '}
              <strong style={{ color: Math.abs(liveGrossSum - Number(targetGrossPrice || 0)) <= 0.02 ? '#047857' : C.text }}>
                €{liveGrossSum.toFixed(2)}
              </strong>
              {rollupResult && (
                <span>
                  {' '}· Delta: <strong style={{ color: rollupResult.valid ? '#047857' : '#b91c1c' }}>€{rollupResult.deltaGross.toFixed(2)}</strong>
                </span>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleValidateRollup}
              disabled={selectedItems.length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: '1px solid var(--ds-border-strong)',
                background: '#fff',
                color: C.text,
                cursor: selectedItems.length ? 'pointer' : 'not-allowed'
              }}
            >
              Validate Rollup
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!activePop || selectedItems.length === 0}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                background: activePop && selectedItems.length ? C.vodafoneRed : '#cbd5e1',
                color: '#fff',
                cursor: activePop && selectedItems.length ? 'pointer' : 'not-allowed'
              }}
              title={activePop ? `Apply breakdown to ${activePop.id}` : 'Select a Bundled POP in Pricing & Tariffs first'}
            >
              Apply to Active Bundled POP
            </button>
          </div>
        </div>

        {selectedItems.length === 0 ? (
          <div style={{ fontSize: '12px', color: C.muted }}>
            No services selected yet. Load a CCB package or tariff above, then check services in the Internet or Voice tables below.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {selectedItems.map(({ row, idx }) => {
              const isInet = row.serviceDomain === 'INTERNET';
              const gross = Math.round(((Number(row.rcNet) || 0) * 1.19 + Number.EPSILON) * 100) / 100;
              return (
                <div
                  key={`sel-${row.productCode}-${row.pricingStructureCode}-${row.serviceCode}-${idx}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    background: isInet ? '#eff6ff' : '#faf5ff',
                    border: `1px solid ${isInet ? '#bfdbfe' : '#e9d5ff'}`,
                    color: C.text
                  }}
                >
                  <span style={{ fontWeight: '700', fontSize: '10px', color: isInet ? '#1d4ed8' : '#7e22ce' }}>
                    {row.serviceDomain}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{row.serviceCode}</span>
                  <span>{row.serviceName}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: C.muted }}>({row.tmfPopRole})</span>
                  <strong>€{gross.toFixed(2)}</strong>
                  <button
                    type="button"
                    onClick={() => handleToggleSelect(idx)}
                    title="Remove service"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: C.muted,
                      cursor: 'pointer',
                      fontWeight: '700',
                      padding: '0 2px',
                      fontSize: '13px',
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Side-by-Side Filterable Tables: Internet Services (Left) & Voice Services (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        {renderServiceTable({
          domain: 'INTERNET',
          title: 'INTERNET SERVICES',
          domainBadgeColor: '#1d4ed8',
          domainBgColor: '#dbeafe',
          rows: internetFiltered,
          totalCount: internetAll.length,
          search: inetSearch,
          setSearch: setInetSearch,
          typeFilter: inetTypeFilter,
          setTypeFilter: setInetTypeFilter,
          types: internetTypes,
          selectedOnly: inetSelectedOnly,
          setSelectedOnly: setInetSelectedOnly
        })}

        {renderServiceTable({
          domain: 'VOICE',
          title: 'VOICE SERVICES',
          domainBadgeColor: '#7e22ce',
          domainBgColor: '#f3e8ff',
          rows: voiceFiltered,
          totalCount: voiceAll.length,
          search: voiceSearch,
          setSearch: setVoiceSearch,
          typeFilter: voiceTypeFilter,
          setTypeFilter: setVoiceTypeFilter,
          types: voiceTypes,
          selectedOnly: voiceSelectedOnly,
          setSelectedOnly: setVoiceSelectedOnly
        })}
      </div>
    </div>
  );
}
