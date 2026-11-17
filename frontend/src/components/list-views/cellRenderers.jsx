import React, { useState } from 'react';
import Icon from '../ui/Icon';

/*
 * Shared cell markup for characteristic-heavy list views (Sales Packages, Options).
 *
 * Design rule: colour only expresses STATE (lifecycle, validity). Data values are
 * neutral and differentiated by typography — monospace for codes, tabular numerals
 * for numbers. Styles live in index.css (.ds-code, .ds-speed, .ds-price, .ds-validity).
 */

export const Empty = () => <span className="ds-cell-empty">–</span>;

/* Split a consolidated JSONPath result ("A, B, C") into distinct values. */
export function splitValues(raw) {
  if (raw === null || raw === undefined) return [];
  const parts = Array.isArray(raw) ? raw : String(raw).split(',');
  return [...new Set(parts.map(s => String(s).trim()).filter(Boolean))];
}

function copy(e, value) {
  e.stopPropagation();
  if (navigator.clipboard) navigator.clipboard.writeText(value).catch(() => {});
}

/* Neutral code chip with a short type label, e.g. [INT | VFI_DSL_250]. Click copies the value. */
export function CodeChip({ label, value, compact = false }) {
  return (
    <span
      className={`ds-code${compact ? ' ds-code--compact' : ''}`}
      onClick={(e) => copy(e, value)}
      onDoubleClick={(e) => e.stopPropagation()}
      title={`${value} — click to copy`}
    >
      {label && <span className="ds-code__k">{label}</span>}
      <span className="ds-code__v">{value}</span>
    </span>
  );
}

/*
 * Multi-value code list with on-demand interactive expansion.
 * When collapsed: shows first chip + interactive "+N" badge.
 * Clicking "+N" smoothly expands all chips with an inline collapse button.
 */
export function CodeList({ label, values, compact = false }) {
  const [expanded, setExpanded] = useState(false);
  if (!values || values.length === 0) return <Empty />;
  if (values.length === 1) {
    return <CodeChip label={label} value={values[0]} compact={compact} />;
  }
  const [first, ...rest] = values;

  return (
    <span
      className={`ds-code-list${expanded ? ' is-expanded' : ''}${compact ? ' ds-code-list--compact' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {expanded ? (
        <span className="ds-code-list__all">
          <span className="ds-code-list__chips">
            {values.map((v, i) => (
              <CodeChip key={i} label={label} value={v} compact={compact} />
            ))}
          </span>
          <button
            type="button"
            className="ds-more ds-more--collapse"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            title="Collapse list"
            aria-expanded="true"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m18 15-6-6-6 6" />
            </svg>
            <span>Hide</span>
          </button>
        </span>
      ) : (
        <>
          <CodeChip label={label} value={first} compact={compact} />
          <button
            type="button"
            className="ds-more ds-more--expand"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            title={`Click to expand all ${values.length} values:\n${values.join('\n')}`}
            aria-expanded="false"
          >
            +{rest.length}
          </button>
        </>
      )}
    </span>
  );
}

/* Combined internet + voice tariff codes (stacked). */
export function TariffCodes({ internet = [], voice = [], compact = false }) {
  if (internet.length === 0 && voice.length === 0) return <Empty />;
  return (
    <div className="ds-code-stack">
      {internet.length > 0 && <CodeList label="INT" values={internet} compact={compact} />}
      {voice.length > 0 && <CodeList label="VOI" values={voice} compact={compact} />}
    </div>
  );
}

const fmtMbit = (n) => (n >= 1000 ? `${(n / 1000).toLocaleString('de-DE')} Gbit/s` : `${n.toLocaleString('de-DE')} Mbit/s`);

/*
 * Broadband speed meter. `profile` comes from extractSpeedProfile():
 *   { numericDown, numericUp, download, upload, tech }
 * Displays download and upload bandwidth with the exact same clean format.
 */
export function SpeedCell({ profile, compact = false }) {
  if (!profile || !profile.numericDown) return <Empty />;
  const { numericDown, numericUp, tech } = profile;
  const pct = Math.max(6, Math.min(100, Math.round((Math.log10(numericDown) / 3) * 100))); // log scale up to 1 Gbit/s
  const tip = numericUp
    ? `${fmtMbit(numericDown)} down / ${fmtMbit(numericUp)} up`
    : `${fmtMbit(numericDown)} down`;

  return (
    <div className={`ds-speed${compact ? ' ds-speed--compact' : ''}`} title={tip}>
      <div className="ds-speed__line">
        <span className="ds-speed__down">{fmtMbit(numericDown)} ↓</span>
        {numericUp ? (
          <span className="ds-speed__up">{fmtMbit(numericUp)} ↑</span>
        ) : null}
        {tech && !compact && <span className="ds-speed__tech">{tech}</span>}
      </div>
      {!compact && <div className="ds-speed__bar"><i style={{ width: `${pct}%` }} /></div>}
    </div>
  );
}

/* Parse "49.99", "49,99 €", "EUR 49.99" → number (or null). */
export function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;
  const first = splitValues(raw)[0];
  if (!first) return null;
  const cleaned = first.replace(/eur|€/gi, '').trim().replace(/\s/g, '');
  // "1.234,56" (de) → 1234.56 ; "1234.56" (en) stays
  const normalised = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  const n = parseFloat(normalised);
  return Number.isFinite(n) ? n : null;
}

/* Right-aligned price in German format with a muted period suffix. */
export function PriceCell({ raw, period = '/Mon.', compact = false }) {
  const amount = parseAmount(raw);
  if (amount === null) {
    const txt = splitValues(raw)[0];
    return txt ? <span className="ds-price">{txt}</span> : <Empty />;
  }
  return (
    <span className={`ds-price${compact ? ' ds-price--compact' : ''}`} title={String(raw)}>
      <b>{amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</b>
      {period && <small>{period}</small>}
    </span>
  );
}

const fmtDate = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const toDate = (raw) => {
  if (!raw) return null;
  const d = new Date(String(splitValues(raw)[0] || raw));
  return Number.isNaN(d.getTime()) ? null : d;
};
const daysBetween = (a, b) => Math.ceil((b - a) / 86400000);

/* Validity state for a start/end pair: 'active' | 'upcoming' | 'expired' | 'unknown'. */
export function validityState(startRaw, endRaw, now = new Date()) {
  const start = toDate(startRaw);
  const end = toDate(endRaw);
  if (start && start > now) return { state: 'upcoming', start, end, hint: `Starts in ${daysBetween(now, start)} days` };
  if (end && end < now) return { state: 'expired', start, end, hint: `Expired ${daysBetween(end, now)} days ago` };
  if (start || end) return { state: 'active', start, end, hint: end ? `Ends in ${daysBetween(now, end)} days` : 'No end date' };
  return { state: 'unknown', start, end, hint: 'No validity period' };
}

/* Combined validity: "01.07.2026 → open" with a state dot. */
export function ValidityCell({ startRaw, endRaw, compact = false }) {
  const v = validityState(startRaw, endRaw);
  if (v.state === 'unknown') return <Empty />;
  const label = v.state === 'upcoming'
    ? `ab ${fmtDate(v.start)}`
    : `${v.start ? fmtDate(v.start) : '…'} → ${v.end ? fmtDate(v.end) : 'open'}`;
  return (
    <span className={`ds-validity${compact ? ' ds-validity--compact' : ''}`} title={v.hint}>
      <span className={`ds-validity__dot is-${v.state}`} />
      <span>{label}</span>
    </span>
  );
}

/* Single date (start or end column) — plain German date; state dot only on the end date. */
export function DateCell({ raw, kind = 'start', compact = false }) {
  const d = toDate(raw);
  if (!d) return kind === 'end' ? <span className="ds-cell-empty">open</span> : <Empty />;
  const now = new Date();
  let state = null;
  if (kind === 'start' && d > now) state = 'upcoming';
  if (kind === 'end') state = d < now ? 'expired' : 'active';
  return (
    <span className={`ds-validity${compact ? ' ds-validity--compact' : ''}`} title={String(raw)}>
      {state && <span className={`ds-validity__dot is-${state}`} />}
      <span>{fmtDate(d)}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Product specification, version, lifecycle                          */
/* ------------------------------------------------------------------ */

/*
 * Product specification reference: plain text with a dashed underline (no badge).
 * Clicking filters the list by this specification; the version is a muted mono suffix.
 */
export function SpecLink({ spec, onFilter, compact = false }) {
  if (!spec) return <Empty />;
  const name = spec.name || spec.id;
  if (!name) return <Empty />;
  const version = spec.version !== undefined && spec.version !== null && spec.version !== '' ? `v${spec.version}` : null;
  const clickable = Boolean(onFilter);
  return (
    <span className={`ds-spec${compact ? ' ds-spec--compact' : ''}`}>
      <span
        className={`ds-spec__name${clickable ? ' is-clickable' : ''}`}
        onClick={clickable ? (e) => { e.stopPropagation(); onFilter(name); } : undefined}
        onDoubleClick={(e) => e.stopPropagation()}
        title={clickable ? `Filter by specification: ${name}${version ? ` (${version})` : ''}` : name}
      >
        {name}
      </span>
      {version && !compact && <span className="ds-spec__ver">{version}</span>}
      {clickable && !compact && (
        <svg className="ds-spec__filter" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />
        </svg>
      )}
    </span>
  );
}

/*
 * Version: neutral mono "v3". On a parent row with older versions it becomes a toggle
 * showing the version count; child (older) rows are muted.
 */
export function VersionCell({ version, totalVersions = 1, isExpanded = false, onToggle, isParent = true }) {
  const label = `v${version ?? '0'}`;
  if (isParent && totalVersions > 1 && onToggle) {
    return (
      <button
        type="button"
        className={`ds-version ds-version--toggle${isExpanded ? ' is-open' : ''}`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onDoubleClick={(e) => e.stopPropagation()}
        title={isExpanded ? 'Collapse older versions' : `Show all ${totalVersions} versions`}
        aria-expanded={isExpanded}
      >
        <span className="ds-version__num">{label}</span>
        <span className="ds-version__count">{totalVersions}</span>
        <svg className="ds-version__chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    );
  }
  return (
    <span className={`ds-version${isParent ? '' : ' ds-version--old'}`} title={isParent ? 'Current version' : 'Older version'}>
      <span className="ds-version__num">{label}</span>
    </span>
  );
}

/*
 * Uniform, neutral lifecycle status pill.
 * Design rule: Lifecycle status is neutral metadata styled consistently across all list views
 * without value-based color differentiation.
 */
export function lifecycleTone() {
  return 'neutral';
}

export function LifecyclePill({ status, compact = false, isChild = false }) {
  if (!status) return <Empty />;
  return (
    <span
      className={`ds-lifecycle${compact ? ' ds-lifecycle--compact' : ''}${isChild ? ' ds-lifecycle--child' : ''}`}
      title={`Lifecycle: ${status}`}
    >
      <span>{status}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Entity Type & Charge Type badge                                    */
/* ------------------------------------------------------------------ */

const TYPE_CONFIG = {
  Category: { label: 'Category', icon: 'folder' },
  ProductOffering: { label: 'Product Offering', icon: 'package' },
  ProductOfferingPrice: { label: 'Offering Price', icon: 'tag' },
  ProductSpecification: { label: 'Specification', icon: 'clipboard' },
  // Offering subtypes
  offering: { label: 'Offering', icon: 'package' },
  bundle: { label: 'Bundle Offer', icon: 'layers' },
  hardware: { label: 'Hardware', icon: 'cpu' },
  // Charge types
  recurring: { label: 'Recurring', icon: 'refresh' },
  onetime: { label: 'One-Time', icon: 'zap' },
  bundle_pop: { label: 'Bundle Price', icon: 'layers' }
};

/*
 * Neutral entity type badge with line icon (Lucide-style).
 * Replaces loud tinted badges across catalog, spec, and price list views.
 */
export function EntityTypeBadge({ type, label, icon, isChild = false, compact = false }) {
  const cfg = (type && TYPE_CONFIG[type]) || {};
  const displayLabel = label || cfg.label || type || '–';
  const displayIcon = icon || cfg.icon || 'file';

  return (
    <span
      className={`ds-type${compact ? ' ds-type--compact' : ''}${isChild ? ' ds-type--child' : ''}`}
      title={displayLabel}
    >
      <Icon name={displayIcon} size={compact || isChild ? 12 : 13} />
      <span>{displayLabel}</span>
    </span>
  );
}
