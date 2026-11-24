import React, { useState, useEffect } from 'react';
import { C } from '../../styles/theme';

function stripV2(code = '') {
  return String(code || '').trim().replace(/_v2$/i, '');
}

/**
 * CcbTariffSelectionPanel
 *
 * STEP 3: Tariff Selection for Internet and Voice
 * Two-column layout (Internet Tariff on the left, Voice Tariff on the right):
 *  - Auto-populates from the selected offer template's tariff codes
 *  - Supports Select Existing (CCB_PRODUCT_TARIFF_LK), Clone (Vorlage), or Create New tariff
 */
export default function CcbTariffSelectionPanel({
  technology = 'FIBRE',
  aawPacketId = '',
  psmPacketCodes = [],
  bundledPops = [],
  internetProductCode = 'I1204',
  voiceProductCode = 'VI204',
  internetProductCodes = [],
  voiceProductCodes = [],
  selectedInternetTariffCode = '',
  selectedVoiceTariffCode = '',
  customInternetTariff = null,
  customVoiceTariff = null,
  onSelectInternetTariff,
  onSelectVoiceTariff,
  onSyncTariffCharacteristics,
  onLoadTariffServices,
  onEditTariff,
  onTariffListChange,
  savedTariffUiState = null,
  onTariffUiStateChange
}) {
  const [tariffs, setTariffs] = useState([]);
  const [packetMappings, setPacketMappings] = useState([]);
  const [tariffProductMap, setTariffProductMap] = useState(() => savedTariffUiState?.tariffProductMap || {});
  const [removedTariffs, setRemovedTariffs] = useState(() => savedTariffUiState?.removedTariffs || {});
  const [createdTariffs, setCreatedTariffs] = useState(
    () => savedTariffUiState?.createdTariffs || { INTERNET: [], VOICE: [] }
  );
  const [editedTariffs, setEditedTariffs] = useState(() => savedTariffUiState?.editedTariffs || {});
  const [editingRequest, setEditingRequest] = useState(null);
  const [copiedTariffKey, setCopiedTariffKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastTariffListSigRef = React.useRef('');

  // Hydrate when resuming a draft
  useEffect(() => {
    if (!savedTariffUiState) return;
    if (savedTariffUiState.tariffProductMap) setTariffProductMap(savedTariffUiState.tariffProductMap);
    if (savedTariffUiState.removedTariffs) setRemovedTariffs(savedTariffUiState.removedTariffs);
    if (savedTariffUiState.createdTariffs) setCreatedTariffs(savedTariffUiState.createdTariffs);
    if (savedTariffUiState.editedTariffs) setEditedTariffs(savedTariffUiState.editedTariffs);
  }, [JSON.stringify(savedTariffUiState)]);

  // Persist UI state changes back to formData for draft save/resume
  useEffect(() => {
    if (!onTariffUiStateChange) return;
    const nextState = {
      tariffProductMap,
      removedTariffs,
      createdTariffs,
      editedTariffs
    };
    const sig = JSON.stringify(nextState);
    if (CcbTariffSelectionPanel._lastUiSig !== sig) {
      CcbTariffSelectionPanel._lastUiSig = sig;
      onTariffUiStateChange(nextState);
    }
  }, [tariffProductMap, removedTariffs, createdTariffs, editedTariffs]);

  const accessType = technology === 'DSL' ? 'DSL' : 'FIBRE';

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/reference/tariffs?accessType=${encodeURIComponent(accessType)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load tariffs'))))
      .then((data) => {
        if (mounted) {
          setTariffs(data.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [accessType]);

  // Fetch all PSM Packet ID -> Internet & Voice Tariff mappings for this Sales Package
  useEffect(() => {
    let mounted = true;
    const popPsmCodes = (Array.isArray(bundledPops) ? bundledPops : []).flatMap((pop) => [
      pop.psmNgn,
      pop.psmBitstream,
      pop.psmInternetNgn,
      pop.psmInternetBitstream,
      pop.psmVoiceNgn,
      pop.psmVoiceBitstream
    ]);
    const allTokens = [
      ...(String(aawPacketId || '').split(',').map((s) => stripV2(s))),
      ...(Array.isArray(psmPacketCodes) ? psmPacketCodes : []).map((c) => stripV2(c)),
      ...popPsmCodes.map((c) => stripV2(c))
    ]
      .map((s) => s.trim())
      .filter((s) => s && s !== '-');

    const aawIds = Array.from(new Set(allTokens.filter((c) => /^R\d+/i.test(c))));
    const salesCodes = Array.from(new Set(allTokens.filter((c) => !/^R\d+/i.test(c))));

    if (aawIds.length === 0 && salesCodes.length === 0) {
      setPacketMappings([]);
      return;
    }

    const qs = new URLSearchParams();
    if (aawIds.length > 0) qs.set('aawPacketId', aawIds.join(','));
    if (salesCodes.length > 0) qs.set('salesPacketCodes', salesCodes.join(','));

    fetch(`/api/reference/packet-tariffs?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (mounted) setPacketMappings(data.items || []);
      })
      .catch(() => {
        if (mounted) setPacketMappings([]);
      });
    return () => {
      mounted = false;
    };
  }, [aawPacketId, JSON.stringify(psmPacketCodes), bundledPops.length]);

  const internetTariffs = tariffs.filter((t) => t.serviceDomain === 'INTERNET');
  const voiceTariffs = tariffs.filter((t) => t.serviceDomain === 'VOICE');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div
        style={{
          background: C.panel,
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '10px',
          padding: '18px 22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                STEP 3: Tariff Selection
              </h3>
              <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px' }}>
                {accessType} · CCB_PRODUCT_TARIFF_LK
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>
              Tariffs are auto-populated from the selected offer template. Select an existing CCB tariff, clone from a Vorlage, or define a new tariff.
            </p>
          </div>
          {loading && <span style={{ fontSize: '12px', color: C.muted }}>Loading tariffs...</span>}
        </div>
        {error && (
          <div style={{ marginTop: '10px', padding: '8px 12px', borderRadius: '6px', background: '#fef2f2', color: '#b91c1c', fontSize: '12px' }}>
            {error}
          </div>
        )}
      </div>

      {/* Two Side-by-Side Selectable Tables: One Row Per Tariff with Multi-Select Product Codes */}
      {(() => {
        const inetByTariff = new Map();
        const voiceByTariff = new Map();

        const addToGroup = (map, prod, code, name = '') => {
          const c = stripV2(code);
          const p = String(prod || '').trim();
          if (!c || c === '-') return;
          if (!map.has(c)) {
            const matchedRef = tariffs.find(
              (t) => stripV2(t.pricingStructureCode).toUpperCase() === c.toUpperCase()
            );
            map.set(c, {
              productCodes: new Set(),
              tariffName: name || matchedRef?.name || ''
            });
          } else if (name && !map.get(c).tariffName) {
            map.get(c).tariffName = name;
          }
          if (p && p !== '-') map.get(c).productCodes.add(p);
        };

        for (const pm of packetMappings) {
          for (const t of pm.internetTariffs || []) addToGroup(inetByTariff, t.productCode, t.pricingStructureCode, t.tariffName);
          for (const t of pm.voiceTariffs || []) addToGroup(voiceByTariff, t.productCode, t.pricingStructureCode, t.tariffName);
        }

        if (inetByTariff.size === 0 && voiceByTariff.size === 0) {
          for (const pop of bundledPops || []) {
            addToGroup(inetByTariff, internetProductCode || 'I1204', pop.tariffInternetNgn || pop.tariffInternet);
            addToGroup(inetByTariff, 'I1203', pop.tariffInternetBitstream);
            addToGroup(voiceByTariff, voiceProductCode || 'VI204', pop.tariffVoiceNgn || pop.tariffVoice);
            addToGroup(voiceByTariff, 'VI203', pop.tariffVoiceBitstream);
          }
        }

        if (inetByTariff.size === 0 && selectedInternetTariffCode) {
          (internetProductCodes.length > 0 ? internetProductCodes.map((p) => p.productCode) : [internetProductCode || 'I1204']).forEach((p) =>
            addToGroup(inetByTariff, p, selectedInternetTariffCode, customInternetTariff?.name || '')
          );
        }
        if (voiceByTariff.size === 0 && selectedVoiceTariffCode) {
          (voiceProductCodes.length > 0 ? voiceProductCodes.map((p) => p.productCode) : [voiceProductCode || 'VI204']).forEach((p) =>
            addToGroup(voiceByTariff, p, selectedVoiceTariffCode, customVoiceTariff?.name || '')
          );
        }

        // Always include newly created / cloned tariffs in the tables
        const appendCustom = (map, customObj) => {
          if (!customObj?.pricingStructureCode) return;
          const prods = customObj.associatedProductCodes?.length
            ? customObj.associatedProductCodes
            : [customObj.productCode].filter(Boolean);
          prods.forEach((p) => addToGroup(map, p, customObj.pricingStructureCode, customObj.name || ''));
        };
        if (customInternetTariff) appendCustom(inetByTariff, customInternetTariff);
        if (customVoiceTariff) appendCustom(voiceByTariff, customVoiceTariff);
        (createdTariffs.INTERNET || []).forEach((t) => appendCustom(inetByTariff, t));
        (createdTariffs.VOICE || []).forEach((t) => appendCustom(voiceByTariff, t));

        const buildRows = (domain, map, domainCodes) =>
          Array.from(map.entries())
            .filter(([tariffCode]) => !removedTariffs[`${domain}|${tariffCode}`])
            .map(([tariffCode, info]) => {
              const override = editedTariffs[`${domain}|${tariffCode}`];
              const available = Array.from(
                new Set([
                  ...info.productCodes,
                  ...(override?.associatedProductCodes || []),
                  ...domainCodes.map((d) => d.productCode)
                ])
              );
              const defaultSelected = override?.associatedProductCodes?.length
                ? override.associatedProductCodes
                : Array.from(info.productCodes);
              return {
                tariffCode,
                tariffName: override?.name || info.tariffName || '-',
                tariffBase: override?.tariffBase || '',
                effectiveDate: override?.effectiveDate || '',
                periodOfCancelation: override?.periodOfCancelation || '',
                isEdited: Boolean(override),
                availableProductCodes: available.length > 0 ? available : defaultSelected,
                defaultSelected: defaultSelected.length > 0 ? defaultSelected : available
              };
            });

        const inetRows = buildRows('INTERNET', inetByTariff, internetProductCodes);
        const voiceRows = buildRows('VOICE', voiceByTariff, voiceProductCodes);

        // Emit active tariff list whenever rows or product selections change
        const buildEnvelopeTariffs = (domain, rows) =>
          rows.map((r) => ({
            serviceDomain: domain,
            pricingStructureCode: r.tariffCode,
            name: r.tariffName,
            associatedProductCodes: tariffProductMap[`${domain}|${r.tariffCode}`] || r.defaultSelected,
            tariffBase: r.tariffBase || 'Standardtarif',
            effectiveDate: r.effectiveDate || '',
            isEdited: Boolean(r.isEdited)
          }));

        if (onTariffListChange) {
          const allTariffs = [
            ...buildEnvelopeTariffs('INTERNET', inetRows),
            ...buildEnvelopeTariffs('VOICE', voiceRows)
          ];
          const sig = JSON.stringify(allTariffs);
          if (lastTariffListSigRef.current !== sig) {
            lastTariffListSigRef.current = sig;
            setTimeout(() => onTariffListChange(allTariffs), 0);
          }
        }

        const handleDeleteTariff = (domain, tariffCode, selectedCode, onPick) => {
          setRemovedTariffs((prev) => ({ ...prev, [`${domain}|${tariffCode}`]: true }));
          if (stripV2(selectedCode).toUpperCase() === tariffCode.toUpperCase()) {
            onPick('', null);
          }
        };

        const handleCopyTariffName = (key, name) => {
          if (!name || name === '-') return;
          if (navigator?.clipboard?.writeText) {
            navigator.clipboard.writeText(name).catch(() => {});
          }
          setCopiedTariffKey(key);
          setTimeout(() => setCopiedTariffKey((curr) => (curr === key ? '' : curr)), 1500);
        };

        // Compute characteristic arrays for tariff_code_internet_ngn, tariff_code_internet_bitstream,
        // tariff_code_voice_ngn, tariff_code_voice_bitstream from the active rows & checked product codes
        const bitstreamCodesSet = new Set(
          [...internetProductCodes, ...voiceProductCodes]
            .filter((x) => x.network === 'BITSTREAM')
            .map((x) => x.productCode)
        );
        const isBitstreamProd = (p) => p === 'I1203' || p === 'VI203' || bitstreamCodesSet.has(p);

        const syncCharacteristicsNow = (nextMap = tariffProductMap, nextRemoved = removedTariffs) => {
          if (!onSyncTariffCharacteristics) return;
          const activeInet = inetRows.filter((r) => !nextRemoved[`INTERNET|${r.tariffCode}`]);
          const activeVoice = voiceRows.filter((r) => !nextRemoved[`VOICE|${r.tariffCode}`]);

          const getCodes = (domain, rows) => {
            const ngn = [];
            const bitstream = [];
            for (const r of rows) {
              const prods = nextMap[`${domain}|${r.tariffCode}`] || r.defaultSelected;
              for (const p of prods) {
                if (isBitstreamProd(p)) {
                  if (!bitstream.includes(r.tariffCode)) bitstream.push(r.tariffCode);
                } else {
                  if (!ngn.includes(r.tariffCode)) ngn.push(r.tariffCode);
                }
              }
            }
            return { ngn, bitstream };
          };

          const inetRes = getCodes('INTERNET', activeInet);
          const voiceRes = getCodes('VOICE', activeVoice);
          onSyncTariffCharacteristics({
            tariff_code_internet_ngn: inetRes.ngn,
            tariff_code_internet_bitstream: inetRes.bitstream,
            tariff_code_voice_ngn: voiceRes.ngn,
            tariff_code_voice_bitstream: voiceRes.bitstream
          });
        };

        const buildTariffPayload = (domain, tariffCode, selectedProds, domainCodes) => ({
          pricingStructureCode: tariffCode,
          associatedProductCodes: selectedProds,
          associatedNetworks: domainCodes.filter((d) => selectedProds.includes(d.productCode))
        });

        const toggleRowProduct = (domain, tariffCode, prodCode, defaultSelected, domainCodes, onPick) => {
          const mapKey = `${domain}|${tariffCode}`;
          const current = tariffProductMap[mapKey] || defaultSelected;
          const next = current.includes(prodCode)
            ? current.filter((c) => c !== prodCode)
            : [...current, prodCode];
          setTariffProductMap((prev) => ({ ...prev, [mapKey]: next }));
          onPick(tariffCode, buildTariffPayload(domain, tariffCode, next, domainCodes));
        };

        const renderMiniTariffTable = ({ domain, title, badgeBg, badgeColor, rows, selectedCode, domainCodes, onPick }) => (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--ds-border)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--ds-surface-subtle)',
                borderBottom: '1px solid var(--ds-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {title}
              </span>
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                {rows.length} Tariff(s)
              </span>
            </div>
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--ds-border)', textAlign: 'left', position: 'sticky', top: 0 }}>
                    <th style={{ padding: '7px 12px' }}>Tariff Code</th>
                    <th style={{ padding: '7px 12px' }}>Tariff Name</th>
                    <th style={{ padding: '7px 12px' }}>Product Code(s)</th>
                    <th style={{ padding: '7px 10px', width: '68px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '14px', textAlign: 'center', color: C.muted }}>
                        No tariffs loaded. Select an offer template in STEP 1.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const mapKey = `${domain}|${r.tariffCode}`;
                      const checkedProds = tariffProductMap[mapKey] || r.defaultSelected;
                      const isSelected = stripV2(selectedCode).toUpperCase() === r.tariffCode.toUpperCase();
                      return (
                        <tr
                          key={r.tariffCode}
                          onClick={() => onPick(r.tariffCode, buildTariffPayload(domain, r.tariffCode, checkedProds, domainCodes))}
                          style={{
                            borderBottom: '1px solid var(--ds-border)',
                            cursor: 'pointer',
                            background: isSelected ? badgeBg : '#ffffff'
                          }}
                        >
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: '800', color: badgeColor, whiteSpace: 'nowrap' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`pick-${title}`}
                                checked={isSelected}
                                onChange={() => onPick(r.tariffCode, buildTariffPayload(domain, r.tariffCode, checkedProds, domainCodes))}
                              />
                              <span>{r.tariffCode}</span>
                            </label>
                          </td>
                          <td style={{ padding: '8px 12px', color: C.text, fontWeight: '500' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                              <span>{r.tariffName}</span>
                              {r.tariffName && r.tariffName !== '-' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyTariffName(`${domain}|${r.tariffCode}`, r.tariffName);
                                  }}
                                  title="Copy Tariff Name"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: copiedTariffKey === `${domain}|${r.tariffCode}` ? '#047857' : C.muted,
                                    cursor: 'pointer',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    flexShrink: 0
                                  }}
                                >
                                  {copiedTariffKey === `${domain}|${r.tariffCode}` ? (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  ) : (
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '8px 12px' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {r.availableProductCodes.map((pCode) => {
                                const isChecked = checkedProds.includes(pCode);
                                return (
                                  <label
                                    key={pCode}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      color: isChecked ? C.text : C.muted
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const mapKey = `${domain}|${r.tariffCode}`;
                                        const current = tariffProductMap[mapKey] || r.defaultSelected;
                                        const next = current.includes(pCode)
                                          ? current.filter((c) => c !== pCode)
                                          : [...current, pCode];
                                        const nextMap = { ...tariffProductMap, [mapKey]: next };
                                        setTariffProductMap(nextMap);
                                        onPick(r.tariffCode, buildTariffPayload(domain, r.tariffCode, next, domainCodes));
                                        syncCharacteristicsNow(nextMap, removedTariffs);
                                      }}
                                    />
                                    <span>{pCode}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const refMatch = tariffs.find(
                                    (t) => stripV2(t.pricingStructureCode).toUpperCase() === r.tariffCode.toUpperCase()
                                  );
                                  setEditingRequest({
                                    domain,
                                    tariffCode: r.tariffCode,
                                    name: r.tariffName !== '-' ? r.tariffName : (refMatch?.name || ''),
                                    tariffBase: r.tariffBase || refMatch?.tariffBase || 'Standardtarif',
                                    effectiveDate: r.effectiveDate || refMatch?.effectiveDate || '26.10.2025',
                                    periodOfCancelation: r.periodOfCancelation || refMatch?.periodOfCancelation || '1',
                                    productCodes: checkedProds,
                                    nonce: Date.now()
                                  });
                                  onPick(r.tariffCode, buildTariffPayload(domain, r.tariffCode, checkedProds, domainCodes));
                                }}
                                title={`Edit ${r.tariffCode}`}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: badgeColor,
                                  cursor: 'pointer',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const nextRemoved = { ...removedTariffs, [`${domain}|${r.tariffCode}`]: true };
                                  handleDeleteTariff(domain, r.tariffCode, selectedCode, onPick);
                                  syncCharacteristicsNow(tariffProductMap, nextRemoved);
                                }}
                                title={`Remove ${r.tariffCode}`}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#dc2626',
                                  cursor: 'pointer',
                                  padding: '3px 5px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', alignItems: 'start' }}>
            {renderMiniTariffTable({
              domain: 'INTERNET',
              title: 'Internet Tariffs',
              badgeBg: '#dbeafe',
              badgeColor: '#1d4ed8',
              rows: inetRows,
              selectedCode: selectedInternetTariffCode,
              domainCodes: internetProductCodes,
              onPick: (code, payload) => onSelectInternetTariff(code, payload)
            })}
            {renderMiniTariffTable({
              domain: 'VOICE',
              title: 'Voice Tariffs',
              badgeBg: '#f3e8ff',
              badgeColor: '#7e22ce',
              rows: voiceRows,
              selectedCode: selectedVoiceTariffCode,
              domainCodes: voiceProductCodes,
              onPick: (code, payload) => onSelectVoiceTariff(code, payload)
            })}
          </div>
        );
      })()}

      {/* Two-Column Layout: Internet Tariff (Left) & Voice Tariff (Right) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '16px',
          alignItems: 'start'
        }}
      >
        <TariffColumn
          domain="INTERNET"
          title="Internet Tariff Selection"
          badgeColor="#1d4ed8"
          badgeBg="#dbeafe"
          defaultProductCode={internetProductCode || 'I1204'}
          domainProductCodes={
            internetProductCodes.length > 0
              ? internetProductCodes
              : [{ network: 'NGN', productCode: internetProductCode || 'I1204' }]
          }
          tariffs={internetTariffs}
          selectedCode={selectedInternetTariffCode}
          customTariff={customInternetTariff}
          editedTariff={editedTariffs[`INTERNET|${stripV2(selectedInternetTariffCode)}`] || null}
          editingRequest={editingRequest?.domain === 'INTERNET' ? editingRequest : null}
          onSaveEdit={(oldCode, updatedObj) => {
            const newCode = updatedObj.pricingStructureCode;
            setEditedTariffs((prev) => {
              const next = { ...prev };
              if (oldCode !== newCode) delete next[`INTERNET|${oldCode}`];
              next[`INTERNET|${newCode}`] = updatedObj;
              return next;
            });
            if (oldCode && oldCode !== newCode) {
              setRemovedTariffs((prev) => {
                const next = { ...prev, [`INTERNET|${oldCode}`]: true };
                delete next[`INTERNET|${newCode}`];
                return next;
              });
              setCreatedTariffs((prev) => ({
                ...prev,
                INTERNET: [
                  ...prev.INTERNET.filter(
                    (x) => x.pricingStructureCode !== oldCode && x.pricingStructureCode !== newCode
                  ),
                  updatedObj
                ]
              }));
            }
            setTariffProductMap((prev) => ({
              ...prev,
              [`INTERNET|${newCode}`]: updatedObj.associatedProductCodes || []
            }));
            if (onEditTariff) onEditTariff('INTERNET', oldCode, updatedObj);
          }}
          onApply={(code, obj) => {
            if (obj?.isCustom) {
              setCreatedTariffs((prev) => ({
                ...prev,
                INTERNET: [...prev.INTERNET.filter((x) => x.pricingStructureCode !== obj.pricingStructureCode), obj]
              }));
              setRemovedTariffs((prev) => {
                const copy = { ...prev };
                delete copy[`INTERNET|${obj.pricingStructureCode}`];
                return copy;
              });
            }
            onSelectInternetTariff(code, obj);
          }}
          onLoadServices={(prods, tariffCode) => {
            if (!onLoadTariffServices) return Promise.resolve(0);
            const tableProds = tariffProductMap[`INTERNET|${stripV2(tariffCode)}`];
            const allProds = Array.from(
              new Set([
                ...(tableProds || []),
                ...(prods || []),
                ...internetProductCodes.map((p) => p.productCode)
              ].filter(Boolean))
            );
            return onLoadTariffServices('INTERNET', allProds, tariffCode);
          }}
        />

        <TariffColumn
          domain="VOICE"
          title="Voice Tariff Selection"
          badgeColor="#7e22ce"
          badgeBg="#f3e8ff"
          defaultProductCode={voiceProductCode || 'VI204'}
          domainProductCodes={
            voiceProductCodes.length > 0
              ? voiceProductCodes
              : [{ network: 'NGN', productCode: voiceProductCode || 'VI204' }]
          }
          tariffs={voiceTariffs}
          selectedCode={selectedVoiceTariffCode}
          customTariff={customVoiceTariff}
          editedTariff={editedTariffs[`VOICE|${stripV2(selectedVoiceTariffCode)}`] || null}
          editingRequest={editingRequest?.domain === 'VOICE' ? editingRequest : null}
          onSaveEdit={(oldCode, updatedObj) => {
            const newCode = updatedObj.pricingStructureCode;
            setEditedTariffs((prev) => {
              const next = { ...prev };
              if (oldCode !== newCode) delete next[`VOICE|${oldCode}`];
              next[`VOICE|${newCode}`] = updatedObj;
              return next;
            });
            if (oldCode && oldCode !== newCode) {
              setRemovedTariffs((prev) => {
                const next = { ...prev, [`VOICE|${oldCode}`]: true };
                delete next[`VOICE|${newCode}`];
                return next;
              });
              setCreatedTariffs((prev) => ({
                ...prev,
                VOICE: [
                  ...prev.VOICE.filter(
                    (x) => x.pricingStructureCode !== oldCode && x.pricingStructureCode !== newCode
                  ),
                  updatedObj
                ]
              }));
            }
            setTariffProductMap((prev) => ({
              ...prev,
              [`VOICE|${newCode}`]: updatedObj.associatedProductCodes || []
            }));
            if (onEditTariff) onEditTariff('VOICE', oldCode, updatedObj);
          }}
          onApply={(code, obj) => {
            if (obj?.isCustom) {
              setCreatedTariffs((prev) => ({
                ...prev,
                VOICE: [...prev.VOICE.filter((x) => x.pricingStructureCode !== obj.pricingStructureCode), obj]
              }));
              setRemovedTariffs((prev) => {
                const copy = { ...prev };
                delete copy[`VOICE|${obj.pricingStructureCode}`];
                return copy;
              });
            }
            onSelectVoiceTariff(code, obj);
          }}
          onLoadServices={(prods, tariffCode) => {
            if (!onLoadTariffServices) return Promise.resolve(0);
            const tableProds = tariffProductMap[`VOICE|${stripV2(tariffCode)}`];
            const allProds = Array.from(
              new Set([
                ...(tableProds || []),
                ...(prods || []),
                ...voiceProductCodes.map((p) => p.productCode)
              ].filter(Boolean))
            );
            return onLoadTariffServices('VOICE', allProds, tariffCode);
          }}
        />
      </div>
    </div>
  );
}

function TariffColumn({
  domain,
  title,
  badgeColor,
  badgeBg,
  defaultProductCode,
  domainProductCodes = [],
  tariffs,
  selectedCode,
  customTariff,
  editedTariff = null,
  editingRequest = null,
  onSaveEdit,
  onApply,
  onLoadServices
}) {
  const [mode, setMode] = useState('select'); // 'select' | 'clone' | 'create' | 'edit'
  const [editingOriginalCode, setEditingOriginalCode] = useState('');
  const [cloneSourceKey, setCloneSourceKey] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftProductCode, setDraftProductCode] = useState(defaultProductCode);
  const [selectedProductCodes, setSelectedProductCodes] = useState(() =>
    domainProductCodes.map((p) => p.productCode)
  );
  const [draftName, setDraftName] = useState('');
  const [draftTariffBase, setDraftTariffBase] = useState('Standardtarif');
  const [draftCancelPeriod, setDraftCancelPeriod] = useState('1');
  const [draftEffectiveDate, setDraftEffectiveDate] = useState('26.10.2025');
  const [savedBanner, setSavedBanner] = useState('');
  const [loadingServices, setLoadingServices] = useState(false);

  const normalizedSelected = stripV2(selectedCode);

  useEffect(() => {
    setDraftProductCode(defaultProductCode);
  }, [defaultProductCode]);

  useEffect(() => {
    setSelectedProductCodes(domainProductCodes.map((p) => p.productCode));
  }, [JSON.stringify(domainProductCodes)]);

  useEffect(() => {
    if (!editingRequest) return;
    setMode('edit');
    setEditingOriginalCode(editingRequest.tariffCode || '');
    setDraftCode(editingRequest.tariffCode || '');
    setDraftName(editingRequest.name || '');
    setDraftTariffBase(editingRequest.tariffBase || 'Standardtarif');
    setDraftCancelPeriod(editingRequest.periodOfCancelation || '1');
    setDraftEffectiveDate(editingRequest.effectiveDate || '26.10.2025');
    if (Array.isArray(editingRequest.productCodes) && editingRequest.productCodes.length > 0) {
      setSelectedProductCodes(editingRequest.productCodes);
    }
    setSavedBanner('');
  }, [editingRequest?.nonce]);

  const toggleProductCode = (code) => {
    setSelectedProductCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const matchedExisting = tariffs.find(
    (t) => t.pricingStructureCode.toUpperCase() === normalizedSelected.toUpperCase()
  );

  const handleStartClone = (key) => {
    setCloneSourceKey(key);
    setSavedBanner('');
    const src = tariffs.find((t) => `${t.productCode}|${t.pricingStructureCode}` === key);
    if (src) {
      setDraftProductCode(src.productCode);
      setDraftCode(`${src.pricingStructureCode}_NEW`);
      setDraftName(`${src.name} (Clone)`);
      setDraftTariffBase(src.tariffBase || 'Standardtarif');
      setDraftEffectiveDate(src.effectiveDate || '26.10.2025');
    }
  };

  const handleSaveCustom = (isClone) => {
    const cleanCode = draftCode.trim().toUpperCase();
    if (!cleanCode) return;
    const src = isClone
      ? tariffs.find((t) => `${t.productCode}|${t.pricingStructureCode}` === cloneSourceKey)
      : null;

    const assocProducts =
      selectedProductCodes.length > 0
        ? selectedProductCodes
        : [draftProductCode.trim() || defaultProductCode];

    const payload = {
      serviceDomain: domain,
      productCode: assocProducts[0] || defaultProductCode,
      associatedProductCodes: assocProducts,
      associatedNetworks: domainProductCodes.filter((p) => assocProducts.includes(p.productCode)),
      pricingStructureCode: cleanCode,
      name: draftName.trim() || `${domain} Tariff ${cleanCode}`,
      tariffBase: draftTariffBase,
      periodOfCancelation: draftCancelPeriod,
      effectiveDate: draftEffectiveDate,
      vorlageProductCode: src ? src.productCode : null,
      vorlagePricingStructureCode: src ? src.pricingStructureCode : null,
      isCustom: true
    };
    onApply(cleanCode, payload);
    setSavedBanner(`${isClone ? 'Cloned' : 'Created'} ${cleanCode} → [${assocProducts.join(', ')}]`);
  };

  const activeDetails =
    editedTariff && stripV2(editedTariff.pricingStructureCode) === normalizedSelected
      ? editedTariff
      : (customTariff && stripV2(customTariff.pricingStructureCode) === normalizedSelected
          ? customTariff
          : matchedExisting);

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid var(--ds-border)',
        borderRadius: '10px',
        padding: '18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}
    >
      {/* Header + Mode Switch */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '4px',
              background: badgeBg,
              color: badgeColor
            }}
          >
            {domain}
          </span>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text }}>{title}</h4>
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          {[
            { id: 'select', label: 'Select' },
            { id: 'clone', label: 'Clone' },
            { id: 'create', label: 'Create New' }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setSavedBanner('');
                if (m.id === 'create') {
                  setDraftProductCode(defaultProductCode);
                  setDraftCode('');
                  setDraftName('');
                }
              }}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '700',
                borderRadius: '5px',
                cursor: 'pointer',
                border: `1px solid ${mode === m.id ? C.vodafoneRed : 'var(--ds-border)'}`,
                background: mode === m.id ? '#fef2f2' : '#fff',
                color: mode === m.id ? C.vodafoneRed : C.text
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode 1: Select Existing (selection driven by radio button in the table above) */}
      {mode === 'select' && selectedCode && !matchedExisting && !customTariff && (
        <div style={{ padding: '8px 10px', borderRadius: '6px', background: '#fffbeb', border: '1px solid #fde68a', fontSize: '12px', color: '#92400e' }}>
          Auto-populated from template: <strong>{selectedCode}</strong> (not in CCB reference list — you can keep it or create/clone a new one).
        </div>
      )}

      {/* Mode 2: Clone Tariff (Vorlage) */}
      {mode === 'clone' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <select
            value={cloneSourceKey}
            onChange={(e) => handleStartClone(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--ds-border)',
              fontSize: '12px',
              background: '#fff'
            }}
          >
            <option value="">-- Pick Source Tariff (Vorlage) to Clone --</option>
            {tariffs.map((t) => (
              <option key={`${t.productCode}|${t.pricingStructureCode}`} value={`${t.productCode}|${t.pricingStructureCode}`}>
                {t.productCode}/{t.pricingStructureCode} — {t.name}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted }}>
              Associate with {domain === 'INTERNET' ? 'Internet' : 'Voice'} Product Codes:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {domainProductCodes.map((p) => {
                const checked = selectedProductCodes.includes(p.productCode);
                return (
                  <label
                    key={`${p.network}-${p.productCode}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: `1px solid ${checked ? badgeColor : 'var(--ds-border)'}`,
                      background: checked ? badgeBg : '#fff',
                      color: checked ? badgeColor : C.muted
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProductCode(p.productCode)}
                    />
                    <span style={{ fontFamily: 'monospace' }}>{p.productCode}</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>({p.network})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <input
            type="text"
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            placeholder="New Tariff Code (e.g. IP534)"
            style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)', fontFamily: 'monospace', fontWeight: '700' }}
          />
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="New Tariff Name"
            style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)' }}
          />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleSaveCustom(true)}
              disabled={!draftCode.trim()}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                background: draftCode.trim() ? C.vodafoneRed : '#cbd5e1',
                color: '#fff',
                cursor: draftCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              Clone &amp; Apply Tariff
            </button>
            <button
              type="button"
              onClick={() => {
                setCloneSourceKey('');
                setDraftCode('');
                setDraftName('');
                setSavedBanner('');
                setMode('select');
              }}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid var(--ds-border-strong)',
                background: '#fff',
                color: C.text,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mode 3 & 4: Create New or Edit Existing Tariff */}
      {(mode === 'create' || mode === 'edit') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mode === 'edit' && (
            <div style={{ padding: '6px 10px', borderRadius: '6px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '11.5px', color: '#1e40af', fontWeight: '600' }}>
              Editing {editingOriginalCode} — matched services will remain associated.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: C.muted }}>
              Associate with {domain === 'INTERNET' ? 'Internet' : 'Voice'} Product Codes:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {domainProductCodes.map((p) => {
                const checked = selectedProductCodes.includes(p.productCode);
                return (
                  <label
                    key={`${p.network}-${p.productCode}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 9px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: `1px solid ${checked ? badgeColor : 'var(--ds-border)'}`,
                      background: checked ? badgeBg : '#fff',
                      color: checked ? badgeColor : C.muted
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProductCode(p.productCode)}
                    />
                    <span style={{ fontFamily: 'monospace' }}>{p.productCode}</span>
                    <span style={{ fontSize: '10px', opacity: 0.85 }}>({p.network})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <input
            type="text"
            value={draftCode}
            onChange={(e) => setDraftCode(e.target.value)}
            placeholder={domain === 'INTERNET' ? 'New Tariff Code (e.g. IP900)' : 'New Tariff Code (e.g. VP900)'}
            style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)', fontFamily: 'monospace', fontWeight: '700' }}
          />
          <input
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Tariff Name (e.g. PK Internet-Flat GZH 300 11/26)"
            style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <input
              type="text"
              value={draftTariffBase}
              onChange={(e) => setDraftTariffBase(e.target.value)}
              placeholder="Tariff Base"
              style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)' }}
            />
            <input
              type="text"
              value={draftCancelPeriod}
              onChange={(e) => setDraftCancelPeriod(e.target.value)}
              placeholder="Cancel Period"
              style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)' }}
            />
            <input
              type="text"
              value={draftEffectiveDate}
              onChange={(e) => setDraftEffectiveDate(e.target.value)}
              placeholder="Effective Date"
              style={{ padding: '7px 9px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--ds-border)' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                if (mode === 'edit') {
                  const cleanCode = draftCode.trim().toUpperCase();
                  if (!cleanCode) return;
                  const assocProducts =
                    selectedProductCodes.length > 0
                      ? selectedProductCodes
                      : [draftProductCode.trim() || defaultProductCode];
                  const updatedObj = {
                    serviceDomain: domain,
                    productCode: assocProducts[0] || defaultProductCode,
                    associatedProductCodes: assocProducts,
                    associatedNetworks: domainProductCodes.filter((p) => assocProducts.includes(p.productCode)),
                    pricingStructureCode: cleanCode,
                    name: draftName.trim() || `${domain} Tariff ${cleanCode}`,
                    tariffBase: draftTariffBase,
                    periodOfCancelation: draftCancelPeriod,
                    effectiveDate: draftEffectiveDate,
                    isEdited: true
                  };
                  if (onSaveEdit) onSaveEdit(editingOriginalCode, updatedObj);
                  setSavedBanner(`Saved changes to ${cleanCode} (matched services preserved)`);
                  setMode('select');
                } else {
                  handleSaveCustom(false);
                }
              }}
              disabled={!draftCode.trim()}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '6px',
                border: 'none',
                background: draftCode.trim() ? C.vodafoneRed : '#cbd5e1',
                color: '#fff',
                cursor: draftCode.trim() ? 'pointer' : 'not-allowed'
              }}
            >
              {mode === 'edit' ? 'Save Changes' : 'Create & Apply Tariff'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftCode('');
                setDraftName('');
                setSavedBanner('');
                setMode('select');
              }}
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: '1px solid var(--ds-border-strong)',
                background: '#fff',
                color: C.text,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {savedBanner && (
        <div style={{ padding: '7px 10px', borderRadius: '6px', background: '#ecfdf5', color: '#047857', fontSize: '12px', fontWeight: '600' }}>
          {savedBanner}
        </div>
      )}

      {/* Selected Tariff Summary Card */}
      {activeDetails && (
        <div
          style={{
            background: 'var(--ds-surface-subtle)',
            border: '1px solid var(--ds-border)',
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '13px', color: C.text }}>
              {(activeDetails.associatedProductCodes || [activeDetails.productCode]).join(', ')} / {activeDetails.pricingStructureCode}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', background: '#ecfdf5', color: '#047857' }}>
                {activeDetails.isCustom ? 'Custom / Cloned' : 'Active CCB Tariff'}
              </span>
              {onLoadServices && (
                <button
                  type="button"
                  disabled={loadingServices}
                  onClick={async () => {
                    setLoadingServices(true);
                    setSavedBanner('');
                    try {
                      const prods = activeDetails.associatedProductCodes || [activeDetails.productCode || defaultProductCode];
                      const count = await onLoadServices(prods, activeDetails.pricingStructureCode);
                      setSavedBanner(`Loaded ${count} ${domain} service(s) for ${activeDetails.pricingStructureCode}`);
                    } finally {
                      setLoadingServices(false);
                    }
                  }}
                  style={{
                    padding: '3px 9px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: `1px solid ${badgeColor}`,
                    background: '#ffffff',
                    color: badgeColor,
                    cursor: loadingServices ? 'wait' : 'pointer'
                  }}
                >
                  {loadingServices ? 'Loading...' : 'Load Services'}
                </button>
              )}
              {activeDetails.isCustom && (
                <button
                  type="button"
                  onClick={() => {
                    onApply('', null);
                    setDraftCode('');
                    setDraftName('');
                    setSavedBanner('');
                    setMode('select');
                  }}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#dc2626',
                    cursor: 'pointer'
                  }}
                >
                  Cancel New Tariff
                </button>
              )}
            </div>
          </div>
          <div style={{ fontWeight: '600', color: C.text }}>{activeDetails.name}</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: C.muted, fontSize: '11px' }}>
            <span>Base: <strong>{activeDetails.tariffBase || 'Standardtarif'}</strong></span>
            <span>Effective: <strong>{activeDetails.effectiveDate || '-'}</strong></span>
            {activeDetails.vorlagePricingStructureCode && (
              <span>Vorlage: <strong>{activeDetails.vorlageProductCode}/{activeDetails.vorlagePricingStructureCode}</strong></span>
            )}
            {activeDetails.ppmMapping?.articleName && (
              <span>PPM: <strong>{activeDetails.ppmMapping.articleName}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
