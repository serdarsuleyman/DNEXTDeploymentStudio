import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

const LOCAL_STORAGE_KEY = 'dnext_drafts_cache';

const TASK_TYPES = {
  new_sales_package: {
    label: 'New Sales Package',
    color: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.25)'
  }
};

function getLocalDrafts() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function deleteLocalDraft(draftId) {
  try {
    const list = getLocalDrafts().filter(d => d.id !== draftId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (e) {
    return [];
  }
}

export default function DraftsListView({
  onResumeDraft,
  onDraftsCountChange
}) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        let data = await res.json();
        let list = Array.isArray(data.drafts) ? data.drafts : [];

        // Check if there are local offline drafts that should be synced to SQLite
        const localList = getLocalDrafts();
        const serverIds = new Set(list.map(d => d.id));
        const unSynced = localList.filter(d => !serverIds.has(d.id));

        if (unSynced.length > 0) {
          for (const draftItem of unSynced) {
            await fetch('/api/drafts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(draftItem)
            }).catch(() => {});
          }
          // Fetch updated list from server
          try {
            const syncRes = await fetch('/api/drafts');
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              list = Array.isArray(syncData.drafts) ? syncData.drafts : list;
            }
          } catch (_) {}
        }

        setDrafts(list);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
        } catch (_) {}
        if (onDraftsCountChange) {
          onDraftsCountChange(list.length);
        }
      } else {
        // If /api/drafts returned 404 (e.g. backend server process not yet restarted to mount new router),
        // fallback gracefully to local drafts cache so UI stays seamless without crashing
        console.warn(`[DraftsListView] /api/drafts returned HTTP ${res.status}. Using local storage fallback.`);
        const localList = getLocalDrafts();
        setDrafts(localList);
        if (onDraftsCountChange) {
          onDraftsCountChange(localList.length);
        }
      }
    } catch (err) {
      console.warn('[DraftsListView] Network error fetching drafts, using local storage fallback:', err);
      const localList = getLocalDrafts();
      setDrafts(localList);
      if (onDraftsCountChange) {
        onDraftsCountChange(localList.length);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  const handleDiscard = async (draftId, draftName) => {
    if (!window.confirm(`Are you sure you want to discard draft "${draftName}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(draftId);
    try {
      await fetch(`/api/drafts/${encodeURIComponent(draftId)}`, {
        method: 'DELETE'
      }).catch(() => {});
      const updated = deleteLocalDraft(draftId);
      setDrafts(updated);
      if (onDraftsCountChange) {
        onDraftsCountChange(updated.length);
      }
    } catch (err) {
      console.warn('Failed to delete draft:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const q = searchQuery.toLowerCase().trim();
    return drafts.filter(d => {
      const name = (d.entity_name || '').toLowerCase();
      const id = (d.entity_id || d.id || '').toLowerCase();
      const port = (d.portfolio_id || '').toLowerCase();
      const tech = (d.technology || '').toLowerCase();
      const task = (d.task_type || '').toLowerCase();
      return name.includes(q) || id.includes(q) || port.includes(q) || tech.includes(q) || task.includes(q);
    });
  }, [drafts, searchQuery]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
      {/* ── Header Bar ── */}
      <div style={{
        background: '#ffffff',
        border: `1px solid ${C.cardBorder}`,
        borderRadius: '10px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ds-warn)'
          }}>
            <Icon name="edit" size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: C.text }}>
                In-Progress Drafts
              </h2>
              <span style={{
                background: 'rgba(245,158,11,0.12)',
                color: 'var(--ds-warn)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(245,158,11,0.25)'
              }}>
                {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: C.muted }}>
              Saved work-in-progress offerings before deployment. Drafts are kept separate from the live catalog.
            </p>
          </div>
        </div>

        {/* Search & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '220px' }}>
            <input
              type="text"
              placeholder="Filter drafts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 28px',
                fontSize: '12px',
                borderRadius: '6px',
                border: `1px solid ${C.cardBorder}`,
                background: 'var(--ds-surface-subtle)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none', display: 'flex' }}>
              <Icon name="search" size={13} />
            </span>
          </div>

          <button
            type="button"
            onClick={fetchDrafts}
            disabled={loading}
            style={{
              background: '#ffffff',
              border: `1px solid ${C.cardBorder}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ds-text-2)',
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="repeat" size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Table / Content ── */}
      {loading ? (
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '10px',
          padding: '48px',
          textAlign: 'center',
          color: C.muted,
          fontSize: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon name="clock" size={24} />
          <span>Loading saved drafts...</span>
        </div>
      ) : filteredDrafts.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: `1px dashed ${C.cardBorder}`,
          borderRadius: '10px',
          padding: '48px 24px',
          textAlign: 'center',
          color: C.muted,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--ds-surface-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ds-text-3)'
          }}>
            <Icon name="inbox" size={22} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>
            {searchQuery ? 'No drafts matching your search' : 'No In-Progress Drafts'}
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: C.muted, maxWidth: '420px', lineHeight: 1.5 }}>
            {searchQuery
              ? `No drafts matched "${searchQuery}". Clear your search query to see all drafts.`
              : 'When you create a new Sales Package and click "Save Draft", your in-progress work will be stored here so you can resume it at any time.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: `1px solid ${C.cardBorder}`,
          borderRadius: '10px',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: 'var(--ds-surface-subtle)', borderBottom: `1px solid ${C.cardBorder}`, textAlign: 'left', color: 'var(--ds-text-2)' }}>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '28%' }}>Offering Name & Code</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '16%' }}>Task Type</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '16%' }}>Portfolio Id</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '14%' }}>Technology & Speed</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '13%' }}>Characteristics</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '13%' }}>Last Saved</th>
                <th style={{ padding: '10px 16px', fontWeight: '700', width: '110px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrafts.map((d, idx) => {
                const formData = d.form_data || {};
                const specCharsCount = (formData.characteristics || []).length;
                const directCharsCount = (formData.productOfferingCharacteristic || []).length;

                return (
                  <tr
                    key={d.id || idx}
                    style={{
                      borderBottom: `1px solid ${C.cardBorder}`,
                      background: idx % 2 === 0 ? '#ffffff' : '#fafafa',
                      transition: 'background 0.1s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? '#ffffff' : '#fafafa'; }}
                  >
                    {/* Name & Code */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '700', color: C.text, fontSize: '13px' }}>
                          {d.entity_name}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          background: 'rgba(245,158,11,0.12)',
                          color: 'var(--ds-warn)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '700'
                        }}>
                          DRAFT
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: C.muted, fontFamily: 'var(--ds-font-mono)', marginTop: '2px' }}>
                        {d.entity_id}
                      </div>
                    </td>

                    {/* Task Type */}
                    <td style={{ padding: '12px 16px' }}>
                      {(() => {
                        const tt = d.task_type || 'new_sales_package';
                        const meta = TASK_TYPES[tt] || {
                          label: tt.replace(/_/g, ' '),
                          color: 'var(--ds-text)',
                          bg: 'var(--ds-surface-subtle)',
                          border: 'var(--ds-border-strong)'
                        };
                        return (
                          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: meta.color,
                              background: meta.bg,
                              border: `1px solid ${meta.border}`,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              whiteSpace: 'nowrap'
                            }}>
                              {meta.label}
                            </span>
                            <span style={{
                              fontSize: '10px',
                              color: C.muted,
                              fontFamily: 'var(--ds-font-mono)'
                            }}>
                              {tt}
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Portfolio Id */}
                    <td style={{ padding: '12px 16px' }}>
                      {d.portfolio_id ? (
                        <span style={{
                          fontSize: '11.5px',
                          fontFamily: 'var(--ds-font-mono)',
                          fontWeight: '600',
                          color: 'var(--ds-text)',
                          background: 'var(--ds-surface-subtle)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--ds-border-strong)'
                        }}>
                          {d.portfolio_id}
                        </span>
                      ) : (
                        <span style={{ color: C.muted, fontSize: '12px', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Technology & Speed */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: '600', color: C.text, fontSize: '12px' }}>
                        {d.technology || 'FIBRE'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ds-info)', marginTop: '2px' }}>
                        {d.speed || (formData.downstreamSpeed ? `${formData.downstreamSpeed} Mbps` : '-')}
                      </div>
                    </td>

                    {/* Characteristics configured */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: C.text }}>
                        <strong>{specCharsCount}</strong> spec {specCharsCount === 1 ? 'override' : 'overrides'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--ds-spec)', marginTop: '2px' }}>
                        <strong>{directCharsCount}</strong> direct {directCharsCount === 1 ? 'char' : 'chars'}
                      </div>
                    </td>

                    {/* Last Saved */}
                    <td style={{ padding: '12px 16px', color: C.muted, fontSize: '12px' }}>
                      {formatDate(d.updated_at || d.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => onResumeDraft && onResumeDraft(d)}
                          style={{
                            background: C.vodafoneRed,
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 1px 2px rgba(230,0,0,0.2)'
                          }}
                          title="Resume editing this draft"
                        >
                          <span>Resume</span>
                          <span>→</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDiscard(d.id, d.entity_name)}
                          disabled={deletingId === d.id}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ds-text-3)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            padding: '4px 6px',
                            borderRadius: '4px'
                          }}
                          title="Discard draft"
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-danger)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-3)'; }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
