import React from 'react';
import { C } from '../../styles/theme';

/**
 * Reusable Bundled POPs Table component for Sales Package Detail Views.
 * Aligns columns across read-only view and editing templates.
 * 
 * In read-only mode (isEditMode = false):
 * - Displays static badges, tag chips, and formatted currency.
 * 
 * In editable mode (isEditMode = true):
 * - Provides inline inputs for POP Name, Variant, Monthly Total, Bandwidth Service ID,
 *   NGN Packet Code, Bitstream Packet Code, Internet Tariff Code, Voice Tariff Code,
 *   plus Duplicate and Delete action buttons.
 */
export default function BundledPopsTable({
  pops = [],
  selectedPopId = '',
  onSelectPop = () => {},
  isEditMode = false,
  onUpdatePop = () => {},
  onDuplicatePop = null,
  onDeletePop = null,
  maxHeight = '320px',
  internetTariffOptions = [],
  voiceTariffOptions = [],
  bandwidthServiceOptions = [],
  aawPacketIdOptions = [],
  plainColumns = false
}) {
  const plainInputStyle = {
    border: 'none',
    background: 'transparent',
    borderRadius: 0,
    outline: 'none',
    padding: '2px 0',
    fontSize: '12px',
    fontWeight: '400',
    color: 'var(--ds-text)'
  };
  const plainSelectStyle = {
    border: 'none',
    background: 'transparent',
    borderRadius: 0,
    outline: 'none',
    padding: '2px 0',
    fontSize: '12px',
    fontWeight: '400',
    color: 'var(--ds-text)',
    cursor: 'pointer'
  };
  return (
    <div style={{
      overflowX: 'auto',
      overflowY: 'auto',
      maxHeight,
      border: `1px solid ${C?.cardBorder || 'var(--ds-border)'}`,
      borderRadius: '6px'
    }}>
      <table style={{
        width: '100%',
        minWidth: isEditMode ? (plainColumns ? '880px' : '1060px') : '820px',
        borderCollapse: 'collapse',
        fontSize: '12px',
        textAlign: 'left'
      }}>
        <thead style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: '#f8fafc',
          borderBottom: `1px solid ${C?.cardBorder || 'var(--ds-border)'}`
        }}>
          <tr style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px', textTransform: 'uppercase' }}>
            <th style={{ padding: '8px 10px', width: '32px', textAlign: 'center' }}></th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? (plainColumns ? '90px' : '240px') : '180px' }}>
              {isEditMode ? (plainColumns ? 'Variant' : 'Bundle POP Name & Variant') : 'Bundle POP Name'}
            </th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '105px' : '90px' }}>Monthly Total</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '90px' : '80px' }}>Play Type</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '110px' : '100px' }}>Bandwidth Service ID</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '145px' : '120px' }}>AAW Paket Id</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '100px' : '90px' }}>NGN Packet Code</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '100px' : '90px' }}>Bitstream Packet Code</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '100px' : '90px' }}>Internet Tariff Code</th>
            <th style={{ padding: '8px 12px', minWidth: isEditMode ? '100px' : '90px' }}>Voice Tariff Code</th>
            {isEditMode && (
              <th style={{ padding: '8px 12px', textAlign: 'right', minWidth: '105px' }}>Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {pops.length === 0 ? (
            <tr>
              <td
                colSpan={isEditMode ? 11 : 10}
                style={{ padding: '24px', textAlign: 'center', color: C?.muted || 'var(--ds-text-3)', fontStyle: 'italic' }}
              >
                {isEditMode
                  ? 'No Bundled POPs defined yet. Click + Add Basic Variant or + Add Comfort Variant above.'
                  : 'No pricing variants attached to this offering.'}
              </td>
            </tr>
          ) : (
            pops.map((pop, pIdx) => {
              const isComfort = (pop.connectionVariant || pop.connectionType) === 'comfort';
              const isSelected = selectedPopId ? String(selectedPopId) === String(pop.id) : pIdx === 0;

              // Price extraction
              const priceVal = pop.totalPrice !== undefined && pop.totalPrice !== null ? pop.totalPrice : pop.price;
              const formattedPrice = priceVal !== undefined && priceVal !== null && priceVal !== '' && !isNaN(priceVal)
                ? `€${Number(priceVal).toFixed(2)}`
                : '-';

              // Play Type extraction
              const rawPlayType = pop.playType || (pop.raw ? (pop.raw.prodSpecCharValueUse?.find(c => (c.name || '').toLowerCase() === 'play_type')?.productSpecCharacteristicValue?.[0]?.value) : null);
              const playTypeVal = (rawPlayType && rawPlayType !== '-')
                ? String(rawPlayType)
                : (String(pop.id || pop.name || '').includes('_pt1_') ? '1' : '2');
              const isPlay1 = playTypeVal === '1' || playTypeVal.toLowerCase().includes('1');

              // Bandwidth Service ID extraction
              const bandwidthServiceId = pop.bandwidthServiceId ||
                pop.svcBw ||
                (pop.serviceInternetNgn && pop.serviceInternetNgn !== '-' ? pop.serviceInternetNgn.split(',')[1]?.trim() : null) ||
                (pop.serviceInternetBitstream && pop.serviceInternetBitstream !== '-' ? pop.serviceInternetBitstream.split(',')[1]?.trim() : null) ||
                '';

              // PSM NGN Code extraction
              const psmNgn = pop.psmNgn ||
                pop.psmInternetNgn ||
                pop.ngn?.salesPacketCode ||
                pop.psmVoiceNgn ||
                '';

              // PSM Bitstream Code extraction
              const psmBitstream = pop.psmBitstream ||
                pop.psmInternetBitstream ||
                pop.bitstream?.salesPacketCode ||
                pop.psmVoiceBitstream ||
                '';

              // Internet Tariff Code extraction
              const tariffInternet = pop.tariffInternet ||
                pop.tariffInternetBitstream ||
                pop.tariffInternetNgn ||
                pop.bitstream?.internet?.tariffCode ||
                pop.ngn?.internet?.tariffCode ||
                '';

              // Voice Tariff Code extraction
              const tariffVoice = pop.tariffVoice ||
                pop.tariffVoiceBitstream ||
                pop.tariffVoiceNgn ||
                pop.bitstream?.voice?.tariffCode ||
                pop.ngn?.voice?.tariffCode ||
                '';

              return (
                <tr
                  key={pop.id || pIdx}
                  onClick={() => onSelectPop(pop.id)}
                  style={{
                    borderBottom: `1px solid ${C?.cardBorder || 'var(--ds-border)'}`,
                    background: isSelected ? 'var(--ds-info-soft)' : (pIdx % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)'),
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'rgba(2,132,199,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = pIdx % 2 === 0 ? '#ffffff' : 'var(--ds-surface-subtle)';
                  }}
                  title={isEditMode ? "Click to select and view this POP's decomposition below" : "Click to view this POP's decomposition below"}
                >
                  {/* Selection Radio */}
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <input
                      type="radio"
                      name={isEditMode ? "selectedBundledPopRadioEdit" : "selectedBundledPopRadioView"}
                      checked={isSelected}
                      onChange={() => onSelectPop(pop.id)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: '#2563eb', cursor: 'pointer', width: '15px', height: '15px' }}
                      title="Select this POP"
                    />
                  </td>

                  {/* Bundle POP Name & Variant */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                          value={pop.connectionVariant || (isComfort ? 'comfort' : 'basic')}
                          onChange={(e) => onUpdatePop(pop.id, 'connectionVariant', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? plainSelectStyle : {
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: `1px solid ${isComfort ? '#d8b4fe' : '#bfdbfe'}`,
                            background: isComfort ? 'var(--ds-spec-soft)' : 'var(--ds-info-soft)',
                            color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)',
                            cursor: 'pointer'
                          }}
                          title="Change connection variant"
                        >
                          <option value="basic">Basic</option>
                          <option value="comfort">Comfort</option>
                        </select>
                        {!plainColumns && (
                          <input
                            type="text"
                            value={pop.name || pop.id || ''}
                            onChange={(e) => onUpdatePop(pop.id, 'name', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={() => onSelectPop(pop.id)}
                            style={{
                              flex: 1,
                              minWidth: '150px',
                              padding: '4px 8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)',
                              border: '1px solid var(--ds-border-strong)',
                              borderRadius: '4px',
                              background: '#ffffff'
                            }}
                            placeholder="Bundle POP Name / ID"
                          />
                        )}
                      </div>
                    ) : (
                      <span style={{ fontWeight: '700', color: isComfort ? 'var(--ds-spec)' : 'var(--ds-info)' }}>
                        {pop.name || pop.id}
                      </span>
                    )}
                  </td>

                  {/* Monthly Total */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={plainColumns ? { fontSize: '12px', color: 'var(--ds-text)' } : { fontSize: '12px', fontWeight: '800', color: 'var(--ds-warn)' }}>€</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={priceVal !== undefined && priceVal !== null ? priceVal : ''}
                          onChange={(e) => onUpdatePop(pop.id, 'price', e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? { ...plainInputStyle, width: '72px' } : {
                            width: '72px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            color: 'var(--ds-warn)',
                            border: '1px solid var(--ds-border-strong)',
                            borderRadius: '4px',
                            background: '#ffffff'
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    ) : (
                      <span style={{ fontWeight: '800', color: 'var(--ds-warn)' }}>
                        {formattedPrice}
                      </span>
                    )}
                  </td>

                  {/* Play Type */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <select
                        value={isPlay1 ? '1' : '2'}
                        onChange={(e) => onUpdatePop(pop.id, 'playType', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => onSelectPop(pop.id)}
                        style={plainColumns ? plainSelectStyle : {
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${isPlay1 ? 'var(--ds-border-strong)' : '#d8b4fe'}`,
                          background: isPlay1 ? 'var(--ds-surface-2)' : 'var(--ds-spec-soft)',
                          color: isPlay1 ? 'var(--ds-text-2)' : 'var(--ds-spec)',
                          cursor: 'pointer'
                        }}
                        title="Change Play Type (1-Play / 2-Play)"
                      >
                        <option value="2">2-Play</option>
                        <option value="1">1-Play</option>
                      </select>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700',
                        background: isPlay1 ? 'var(--ds-surface-2)' : 'var(--ds-spec-soft)',
                        color: isPlay1 ? 'var(--ds-text-2)' : 'var(--ds-spec)',
                        border: `1px solid ${isPlay1 ? 'var(--ds-border-strong)' : '#d8b4fe'}`
                      }}>
                        {isPlay1 ? '1-Play' : '2-Play'}
                      </span>
                    )}
                  </td>

                  {/* Bandwidth Service ID */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={bandwidthServiceId === '-' ? '' : bandwidthServiceId}
                          onChange={(e) => onUpdatePop(pop.id, 'bandwidthServiceId', e.target.value)}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? { ...plainInputStyle, width: '72px', textTransform: 'uppercase' } : {
                            width: '72px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: 'var(--ds-warn)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '4px',
                            background: 'var(--ds-surface-2)',
                            textTransform: 'uppercase'
                          }}
                          placeholder="V018V"
                        />
                        {bandwidthServiceOptions.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                onSelectPop(pop.id);
                                onUpdatePop(pop.id, 'bandwidthServiceId', e.target.value);
                              }
                            }}
                            title="Select from STEP 3 Internet Services (_bw)"
                            style={plainColumns ? { ...plainSelectStyle, width: '20px', color: 'var(--ds-text-3)' } : {
                              width: '22px',
                              padding: '3px 0',
                              fontSize: '11px',
                              border: '1px solid rgba(245, 158, 11, 0.4)',
                              borderRadius: '4px',
                              background: '#fffbeb',
                              color: 'var(--ds-warn)',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">▾</option>
                            {bandwidthServiceOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>
                                {opt.code}{opt.name ? ` — ${opt.name}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      bandwidthServiceId && bandwidthServiceId !== '-' ? (
                        <code style={{
                          fontFamily: 'var(--ds-font-mono)',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--ds-warn)',
                          background: 'var(--ds-surface-2)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {bandwidthServiceId}
                        </code>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* AAW Paket Id */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (() => {
                      const currentAawPkt = pop.aawPacketId || pop.packetId || '';
                      const opts = currentAawPkt && !aawPacketIdOptions.includes(currentAawPkt)
                        ? [currentAawPkt, ...aawPacketIdOptions]
                        : aawPacketIdOptions;
                      return (
                        <select
                          value={currentAawPkt}
                          onChange={(e) => {
                            onSelectPop(pop.id);
                            onUpdatePop(pop.id, 'aawPacketId', e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? { ...plainSelectStyle, maxWidth: '150px' } : {
                            fontSize: '11px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            padding: '4px 6px',
                            borderRadius: '4px',
                            border: '1px solid var(--ds-border-strong)',
                            background: '#ffffff',
                            color: 'var(--ds-text)',
                            cursor: 'pointer',
                            maxWidth: '150px'
                          }}
                          title="Associate with selected AAW Paket Id"
                        >
                          <option value="">— Select —</option>
                          {opts.map((pktId) => (
                            <option key={pktId} value={pktId}>
                              {pktId}
                            </option>
                          ))}
                        </select>
                      );
                    })() : (
                      (pop.aawPacketId || pop.packetId) ? (
                        <span style={{ fontFamily: 'var(--ds-font-mono)', fontSize: '12px', fontWeight: '600', color: 'var(--ds-text)' }}>
                          {pop.aawPacketId || pop.packetId}
                        </span>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* NGN Packet Code */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={psmNgn === '-' ? '' : psmNgn}
                        onChange={(e) => onUpdatePop(pop.id, 'psmNgn', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => onSelectPop(pop.id)}
                        style={plainColumns ? { ...plainInputStyle, width: '75px', textTransform: 'uppercase' } : {
                          width: '75px',
                          padding: '4px 6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)',
                          color: 'var(--ds-info)',
                          border: '1px solid rgba(2, 132, 199, 0.4)',
                          borderRadius: '4px',
                          background: 'rgba(2, 132, 199, 0.04)',
                          textTransform: 'uppercase'
                        }}
                        placeholder="PI216"
                      />
                    ) : (
                      psmNgn && psmNgn !== '-' ? (
                        <code style={{
                          background: 'rgba(2,132,199,0.08)',
                          color: 'var(--ds-info)',
                          border: '1px solid rgba(2,132,199,0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {psmNgn}
                        </code>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* Bitstream Packet Code */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={psmBitstream === '-' ? '' : psmBitstream}
                        onChange={(e) => onUpdatePop(pop.id, 'psmBitstream', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => onSelectPop(pop.id)}
                        style={plainColumns ? { ...plainInputStyle, width: '75px', textTransform: 'uppercase' } : {
                          width: '75px',
                          padding: '4px 6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)',
                          color: 'var(--ds-spec)',
                          border: '1px solid rgba(124, 58, 237, 0.4)',
                          borderRadius: '4px',
                          background: 'rgba(124, 58, 237, 0.04)',
                          textTransform: 'uppercase'
                        }}
                        placeholder="PR403"
                      />
                    ) : (
                      psmBitstream && psmBitstream !== '-' ? (
                        <code style={{
                          background: 'rgba(124,58,237,0.08)',
                          color: 'var(--ds-spec)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {psmBitstream}
                        </code>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* Internet Tariff Code */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={tariffInternet === '-' ? '' : tariffInternet}
                          onChange={(e) => onUpdatePop(pop.id, 'tariffInternet', e.target.value)}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? { ...plainInputStyle, width: '72px', textTransform: 'uppercase' } : {
                            width: '72px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: '#2563eb',
                            border: '1px solid rgba(59, 130, 246, 0.4)',
                            borderRadius: '4px',
                            background: 'rgba(59, 130, 246, 0.04)',
                            textTransform: 'uppercase'
                          }}
                          placeholder="IP077"
                        />
                        {internetTariffOptions.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                onSelectPop(pop.id);
                                onUpdatePop(pop.id, 'tariffInternet', e.target.value);
                              }
                            }}
                            title="Select from STEP 3 Internet Tariffs"
                            style={plainColumns ? { ...plainSelectStyle, width: '20px', color: 'var(--ds-text-3)' } : {
                              width: '22px',
                              padding: '3px 0',
                              fontSize: '11px',
                              border: '1px solid rgba(59, 130, 246, 0.4)',
                              borderRadius: '4px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">▾</option>
                            {internetTariffOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>
                                {opt.code}{opt.name ? ` — ${opt.name}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      tariffInternet && tariffInternet !== '-' ? (
                        <code style={{
                          background: 'rgba(59,130,246,0.08)',
                          color: '#2563eb',
                          border: '1px solid rgba(59,130,246,0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {tariffInternet}
                        </code>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* Voice Tariff Code */}
                  <td style={{ padding: '8px 12px' }}>
                    {isEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={tariffVoice === '-' ? '' : tariffVoice}
                          onChange={(e) => onUpdatePop(pop.id, 'tariffVoice', e.target.value)}
                          onFocus={() => onSelectPop(pop.id)}
                          style={plainColumns ? { ...plainInputStyle, width: '72px', textTransform: 'uppercase' } : {
                            width: '72px',
                            padding: '4px 6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            fontFamily: 'var(--ds-font-mono)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.04)',
                            textTransform: 'uppercase'
                          }}
                          placeholder="VP077"
                        />
                        {voiceTariffOptions.length > 0 && (
                          <select
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                onSelectPop(pop.id);
                                onUpdatePop(pop.id, 'tariffVoice', e.target.value);
                              }
                            }}
                            title="Select from STEP 3 Voice Tariffs"
                            style={plainColumns ? { ...plainSelectStyle, width: '20px', color: 'var(--ds-text-3)' } : {
                              width: '22px',
                              padding: '3px 0',
                              fontSize: '11px',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              borderRadius: '4px',
                              background: '#ecfdf5',
                              color: '#059669',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">▾</option>
                            {voiceTariffOptions.map((opt) => (
                              <option key={opt.code} value={opt.code}>
                                {opt.code}{opt.name ? ` — ${opt.name}` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ) : (
                      tariffVoice && tariffVoice !== '-' ? (
                        <code style={{
                          background: 'rgba(16,185,129,0.08)',
                          color: '#059669',
                          border: '1px solid rgba(16,185,129,0.2)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '700',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {tariffVoice}
                        </code>
                      ) : (
                        <span style={{ color: C?.muted || 'var(--ds-text-3)', fontSize: '11px' }}>-</span>
                      )
                    )}
                  </td>

                  {/* Actions Column (Edit Mode) */}
                  {isEditMode && (
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {onDuplicatePop && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicatePop(pop.id);
                            }}
                            title="Duplicate this POP"
                            style={{
                              background: 'var(--ds-surface-2)',
                              border: '1px solid var(--ds-border-strong)',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              color: 'var(--ds-text-2)'
                            }}
                          >
                            Duplicate
                          </button>
                        )}
                        {onDeletePop && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePop(pop.id);
                            }}
                            title="Delete this POP"
                            style={{
                              background: 'var(--ds-danger-soft)',
                              border: '1px solid #fca5a5',
                              borderRadius: '4px',
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: '700',
                              cursor: 'pointer',
                              color: 'var(--ds-danger)'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <datalist id="bundled-pops-internet-tariffs">
        {internetTariffOptions.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name ? `${opt.code} — ${opt.name}` : opt.code}
          </option>
        ))}
      </datalist>
      <datalist id="bundled-pops-voice-tariffs">
        {voiceTariffOptions.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name ? `${opt.code} — ${opt.name}` : opt.code}
          </option>
        ))}
      </datalist>
    </div>
  );
}
