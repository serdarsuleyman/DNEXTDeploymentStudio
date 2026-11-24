import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import { C } from '../../styles/theme';

export default function ReviewAndPublishEnvelopeModal({
  isOpen,
  onClose,
  envelope,
  formData = {},
  onSuccess
}) {
  const [packages, setPackages] = useState([]);
  const [selectedPackageId, setSelectedPackageId] = useState('demo_deployment');
  const [isCreatingNewPackage, setIsCreatingNewPackage] = useState(false);
  const [newPackageData, setNewPackageData] = useState({
    id: '',
    name: '',
    description: ''
  });

  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'messages' | 'envelopeJson'
  const [selectedMessageIndex, setSelectedMessageIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Fetch available deployment packages
  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setPublishResult(null);

    fetch('/api/dnext-deployment-package')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => {
        const pkgs = Array.isArray(data) ? data : [];
        setPackages(pkgs);
        // Default to demo_deployment if available
        const hasDemo = pkgs.some(p => p.id === 'demo_deployment');
        if (hasDemo) {
          setSelectedPackageId('demo_deployment');
        } else if (pkgs.length > 0) {
          setSelectedPackageId(pkgs[0].id);
        } else {
          setSelectedPackageId('demo_deployment');
        }
      })
      .catch(err => {
        console.warn('Failed to load packages, using fallback demo_deployment:', err.message);
        setSelectedPackageId('demo_deployment');
      });
  }, [isOpen]);

  if (!isOpen || !envelope) return null;

  const messages = envelope.messages || [];
  const selectedMessage = messages[selectedMessageIndex] || messages[0] || null;

  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const targetFolderDisplay = isCreatingNewPackage
    ? `tmf_packages/${newPackageData.id || 'custom_package'}`
    : (selectedPkg?.file_path || `tmf_packages/${selectedPackageId || 'demo_deployment'}`);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(typeof text === 'string' ? text : JSON.stringify(text, null, 2));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    const payload = {
      deploymentPackageId: isCreatingNewPackage ? newPackageData.id.trim() : selectedPackageId,
      envelope
    };

    if (isCreatingNewPackage) {
      if (!newPackageData.id.trim() || !newPackageData.name.trim()) {
        setError('Please provide both Package ID and Package Name for the new package.');
        setIsPublishing(false);
        return;
      }
      payload.newPackage = {
        id: newPackageData.id.trim(),
        name: newPackageData.name.trim(),
        description: newPackageData.description || 'Custom created deployment package',
        type: 'Custom',
        file_path: `tmf_packages/${newPackageData.id.trim()}`
      };
    }

    let data = null;
    try {
      const res = await fetch('/api/sales-package/publish-envelope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (!res.ok) {
          throw new Error(text || `Server returned HTTP ${res.status}`);
        }
        try {
          data = JSON.parse(text);
        } catch {
          data = { message: text };
        }
      }

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Failed to publish envelope (HTTP ${res.status})`);
      }

      setPublishResult(data);
    } catch (err) {
      console.error('[PublishModal] error:', err);
      setError(err.message || 'An unexpected error occurred during publish.');
      return;
    } finally {
      setIsPublishing(false);
    }

    if (data && onSuccess) {
      try {
        onSuccess(data);
      } catch (cbErr) {
        console.warn('[PublishModal] onSuccess callback error:', cbErr);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--ds-border-strong)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ds-surface-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(230,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.vodafoneRed
            }}>
              <Icon name="package" size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: C.text }}>
                  Review & Publish Synchronous Envelope
                </h2>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'var(--ds-info-soft)',
                  color: 'var(--ds-info)',
                  fontFamily: 'var(--ds-font-mono)'
                }}>
                  {messages.length} Sub-Entities
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: C.muted }}>
                Generate TMF 620 POST payloads and register items under the chosen deployment package.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: isPublishing ? 'not-allowed' : 'pointer',
              color: C.muted,
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'var(--ds-danger-soft)',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '13px',
              color: 'var(--ds-danger)'
            }}>
              <Icon name="alert" size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {publishResult && (
            <div style={{
              background: 'var(--ds-ok-soft)',
              border: '1px solid #86efac',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--ds-ok)', fontWeight: '700', fontSize: '14px' }}>
                <Icon name="check" size={20} />
                <span>{publishResult.message || 'Deployment Items Created Successfully!'}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ds-text)' }}>
                Target Folder: <code style={{ fontWeight: '700', color: 'var(--ds-info)' }}>{publishResult.packageDir}</code>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                {(publishResult.items || []).map((item, idx) => (
                  <div key={item.id || idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--ds-border)',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: item.type === 'ProductOffering' ? 'var(--ds-spec-soft)' : 'var(--ds-info-soft)',
                        color: item.type === 'ProductOffering' ? 'var(--ds-spec)' : 'var(--ds-info)'
                      }}>
                        {item.type}
                      </span>
                      <strong style={{ color: C.text }}>{item.id}</strong>
                    </div>
                    <code style={{ fontSize: '11px', color: C.muted }}>{item.filePath}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deployment Package Selection Section */}
          {!publishResult && (
            <div style={{
              background: 'var(--ds-surface-subtle)',
              border: '1px solid var(--ds-border)',
              borderRadius: '10px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: C.text, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="folder" size={14} />
                    Target Deployment Package:
                  </label>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: C.muted }}>
                    Choose the deployment package where files and registry items will be registered.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCreatingNewPackage(!isCreatingNewPackage)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: C.vodafoneRed,
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  {isCreatingNewPackage ? '← Select Existing Package' : '+ Create New Package'}
                </button>
              </div>

              {!isCreatingNewPackage ? (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    value={selectedPackageId}
                    onChange={(e) => setSelectedPackageId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      border: '1px solid var(--ds-border-strong)',
                      background: '#ffffff',
                      color: C.text,
                      outline: 'none'
                    }}
                  >
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name || pkg.id} ({pkg.id}) — {pkg.file_path || 'tmf_packages/' + pkg.id}
                      </option>
                    ))}
                    {!packages.some(p => p.id === 'demo_deployment') && (
                      <option value="demo_deployment">
                        Demo Deployment Package (demo_deployment) — tmf_packages/demo_deployment [Target]
                      </option>
                    )}
                  </select>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: C.text }}>Package ID *</span>
                    <input
                      type="text"
                      placeholder="e.g. demo_deployment_v2"
                      value={newPackageData.id}
                      onChange={(e) => setNewPackageData(prev => ({ ...prev, id: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--ds-border-strong)',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: C.text }}>Package Name *</span>
                    <input
                      type="text"
                      placeholder="e.g. Commercial Bundles Demo"
                      value={newPackageData.name}
                      onChange={(e) => setNewPackageData(prev => ({ ...prev, name: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--ds-border-strong)',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                        marginTop: '4px'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Destination folder note */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '11px',
                color: 'var(--ds-text-2)',
                background: '#ffffff',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px dashed var(--ds-border)'
              }}>
                <Icon name="info" size={14} />
                <span>
                  Files will be created inside: <code style={{ fontWeight: '700', color: 'var(--ds-info)' }}>{targetFolderDisplay}</code>
                </span>
              </div>
            </div>
          )}

          {/* Synchronous POST Envelope Inspector */}
          <div style={{
            border: '1px solid var(--ds-border)',
            borderRadius: '10px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Inspector Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: 'var(--ds-surface-2)',
              borderBottom: '1px solid var(--ds-border)',
              padding: '4px 8px',
              gap: '4px'
            }}>
              {[
                { id: 'pipeline', label: '1. Synchronous Pipeline', icon: 'zap' },
                { id: 'messages', label: '2. Sub-Entity POST Payloads', icon: 'file' },
                { id: 'envelopeJson', label: '3. Full Envelope JSON', icon: 'layers' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: activeTab === tab.id ? '700' : '600',
                    color: activeTab === tab.id ? C.vodafoneRed : 'var(--ds-text-2)',
                    background: activeTab === tab.id ? '#ffffff' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: activeTab === tab.id ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  <Icon name={tab.icon} size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENT 1: PIPELINE */}
            {activeTab === 'pipeline' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: C.muted }}>
                  The synchronous envelope executes the following POST operations in sequential order to guarantee referential integrity in DNEXT:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.entityId || idx}
                      onClick={() => {
                        setSelectedMessageIndex(idx);
                        setActiveTab('messages');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: '#ffffff',
                        border: '1px solid var(--ds-border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'var(--ds-surface-3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: C.text
                        }}>
                          {msg.order || idx + 1}
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#047857',
                          color: '#ffffff',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          {msg.method || 'POST'}
                        </span>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '13px', color: C.text }}>{msg.entityName || msg.entityId}</strong>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '1px 6px',
                              borderRadius: '3px',
                              background: msg.entityType === 'ProductOffering' 
                                ? 'var(--ds-spec-soft)' 
                                : (msg.subType === 'sub_price_components' || /_(bw|in|va|vt)$/i.test(msg.entityId || ''))
                                  ? 'rgba(245, 158, 11, 0.12)' 
                                  : 'var(--ds-info-soft)',
                              color: msg.entityType === 'ProductOffering' 
                                ? 'var(--ds-spec)' 
                                : (msg.subType === 'sub_price_components' || /_(bw|in|va|vt)$/i.test(msg.entityId || ''))
                                  ? '#b45309' 
                                  : 'var(--ds-info)'
                            }}>
                              {msg.subType === 'sub_price_components' || /_(bw|in|va|vt)$/i.test(msg.entityId || '')
                                ? `Simple POP (${(msg.entityId || '').match(/_(bw|in|va|vt)$/i)?.[1]?.toUpperCase() || 'Atomic'})`
                                : msg.subType === 'bundle_pops' || msg.body?.isBundle
                                  ? 'Bundle POP'
                                  : msg.entityType}
                            </span>
                          </div>
                          <code style={{ fontSize: '11px', color: C.muted }}>{msg.endpoint}</code>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--ds-info)', fontWeight: '600' }}>
                          Inspect Payload →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: SUB-ENTITY MESSAGES */}
            {activeTab === 'messages' && selectedMessage && (
              <div style={{ display: 'flex', minHeight: '320px' }}>
                {/* Message selection sidebar */}
                <div style={{
                  width: '240px',
                  maxHeight: '460px',
                  overflowY: 'auto',
                  borderRight: '1px solid var(--ds-border)',
                  background: 'var(--ds-surface-subtle)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: C.muted, textTransform: 'uppercase', padding: '4px' }}>
                    Envelope Messages ({messages.length})
                  </div>
                  {messages.map((m, idx) => (
                    <button
                      key={m.entityId || idx}
                      type="button"
                      onClick={() => setSelectedMessageIndex(idx)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '2px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: selectedMessageIndex === idx ? '1px solid var(--ds-border-strong)' : '1px solid transparent',
                        background: selectedMessageIndex === idx ? '#ffffff' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: '800',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          background: '#047857',
                          color: '#ffffff',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          POST
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: selectedMessageIndex === idx ? '700' : '500',
                          color: C.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {m.entityId}
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: C.muted }}>
                        {m.entityType}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Message Payload Viewer */}
                <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflowX: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: '#047857',
                          color: '#ffffff',
                          fontFamily: 'var(--ds-font-mono)'
                        }}>
                          POST
                        </span>
                        <code style={{ fontSize: '12px', fontWeight: '700', color: C.text }}>
                          {selectedMessage.endpoint}
                        </code>
                      </div>
                      <div style={{ fontSize: '11px', color: C.muted, marginTop: '2px' }}>
                        Target Entity: <strong>{selectedMessage.entityId}</strong> ({selectedMessage.entityType})
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(selectedMessage.body, 'message')}
                      style={{
                        background: '#ffffff',
                        border: '1px solid var(--ds-border-strong)',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        color: C.text,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon name={copiedKey === 'message' ? 'check' : 'clipboard'} size={13} />
                      <span>{copiedKey === 'message' ? 'Copied!' : 'Copy Body'}</span>
                    </button>
                  </div>

                  <pre style={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '8px',
                    background: '#1e293b',
                    color: '#f8fafc',
                    fontFamily: 'var(--ds-font-mono)',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    maxHeight: '320px',
                    overflowY: 'auto'
                  }}>
                    {JSON.stringify(selectedMessage.body, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: FULL ENVELOPE JSON */}
            {activeTab === 'envelopeJson' && (
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: C.muted }}>
                    Complete Synchronous Deployment Envelope payload sent to backend:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(envelope, 'envelope')}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--ds-border-strong)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: C.text,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Icon name={copiedKey === 'envelope' ? 'check' : 'clipboard'} size={13} />
                    <span>{copiedKey === 'envelope' ? 'Copied!' : 'Copy Envelope JSON'}</span>
                  </button>
                </div>

                <pre style={{
                  margin: 0,
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#1e293b',
                  color: '#f8fafc',
                  fontFamily: 'var(--ds-font-mono)',
                  fontSize: '11px',
                  lineHeight: '1.5',
                  maxHeight: '340px',
                  overflowY: 'auto'
                }}>
                  {JSON.stringify(envelope, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--ds-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--ds-surface-subtle)'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            style={{
              background: '#ffffff',
              border: '1px solid var(--ds-border-strong)',
              borderRadius: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'var(--ds-text-2)',
              cursor: isPublishing ? 'not-allowed' : 'pointer'
            }}
          >
            {publishResult ? 'Close' : 'Cancel'}
          </button>

          {!publishResult ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              style={{
                background: C.vodafoneRed,
                border: 'none',
                borderRadius: '6px',
                padding: '8px 22px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: isPublishing ? 'wait' : 'pointer',
                boxShadow: '0 2px 4px rgba(230,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isPublishing ? 0.75 : 1
              }}
            >
              {isPublishing ? (
                <>
                  <Icon name="refresh" size={14} />
                  <span>Publishing Files...</span>
                </>
              ) : (
                <>
                  <Icon name="rocket" size={15} />
                  <span>Publish to {isCreatingNewPackage ? (newPackageData.id || 'New Package') : selectedPackageId}</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#047857',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 22px',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Icon name="check" size={15} />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
