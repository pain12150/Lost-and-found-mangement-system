import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle, ArrowUpRight, ArrowDownLeft, ShieldCheck, Mail, Phone, Info, X, User } from 'lucide-react';

export default function ClaimsDashboard({ currentUser, onOpenAuth, showToast }) {
  const [tab, setTab] = useState('received'); // 'received' or 'made'
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [processingClaimId, setProcessingClaimId] = useState(null);

  const fetchClaims = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/claims?user_id=${currentUser.id}&role=${tab}`);
      const data = await response.json();
      if (response.ok) {
        setClaims(data);
      } else {
        showToast(data.error || 'Failed to load claims', 'error');
      }
    } catch (err) {
      showToast('Error loading claims from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [tab, currentUser]);

  const handleResolveClaim = async (claimId, status) => {
    if (!currentUser) return;
    setProcessingClaimId(claimId);
    try {
      const response = await fetch(`/api/claims/${claimId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          user_id: currentUser.id
        })
      });
      const data = await response.json();

      if (response.ok) {
        showToast(`Claim successfully ${status === 'approved' ? 'approved and resolved!' : 'rejected.'}`, 'success');
        setSelectedClaim(null);
        fetchClaims();
      } else {
        showToast(data.error || 'Failed to resolve claim', 'error');
      }
    } catch (err) {
      showToast('Error resolving claim', 'error');
    } finally {
      setProcessingClaimId(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center' }}>
        <ShieldCheck size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
        <h2>Claims Center</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Please sign in to check the status of your claims and review claims made on items you reported.
        </p>
        <button className="btn btn-primary" onClick={onOpenAuth} style={{ width: '100%' }}>
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={26} className="text-indigo" />
        Claims & Verification Center
      </h2>

      {/* Tabs */}
      <div className="glass-panel" style={{ padding: '0.35rem', display: 'flex', gap: '0.25rem', marginBottom: '2rem', maxWidth: '380px' }}>
        <button
          onClick={() => { setTab('received'); setSelectedClaim(null); }}
          className="btn"
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: tab === 'received' ? 'var(--bg-secondary)' : 'transparent',
            color: tab === 'received' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: '1px solid ' + (tab === 'received' ? 'var(--border-glass)' : 'transparent')
          }}
        >
          <ArrowDownLeft size={16} style={{ color: 'var(--accent-primary)' }} />
          <span>Claims I Received</span>
        </button>
        <button
          onClick={() => { setTab('made'); setSelectedClaim(null); }}
          className="btn"
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            fontSize: '0.85rem',
            background: tab === 'made' ? 'var(--bg-secondary)' : 'transparent',
            color: tab === 'made' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: '1px solid ' + (tab === 'made' ? 'var(--border-glass)' : 'transparent')
          }}
        >
          <ArrowUpRight size={16} style={{ color: 'var(--accent-success)' }} />
          <span>Claims I Made</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <div style={{ animation: 'spin 1s linear infinite', border: '3px solid var(--border-glass)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 1rem auto' }}></div>
          Loading claims history...
        </div>
      ) : claims.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <Info size={40} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No claims found</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            {tab === 'received' 
              ? "When other students submit ownership proofs for found items you reported, they'll appear here."
              : "When you claim items reported by other students, you can track their verification status here."}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selectedClaim ? '1.2fr 1.8fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Claims List */}
          <div className="claims-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {claims.map(claim => (
              <div 
                key={claim.id} 
                className={`glass-panel ${selectedClaim && selectedClaim.id === claim.id ? 'border-glass-active' : ''}`}
                style={{
                  padding: '1.25rem',
                  cursor: 'pointer',
                  borderLeft: '4px solid ' + (
                    claim.status === 'approved' ? 'var(--accent-success)' :
                    claim.status === 'rejected' ? 'var(--accent-error)' : 'var(--accent-warning)'
                  )
                }}
                onClick={() => setSelectedClaim(claim)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{claim.item_title}</h4>
                  <span className={`badge badge-${claim.status}`} style={{ fontSize: '0.65rem' }}>{claim.status}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', display: '-webkit-box', WebkitLineClamp: '1', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {claim.proof_description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span>
                    {tab === 'received' 
                      ? `Claimant: ${claim.claimant_name} (${claim.claimant_student_id})` 
                      : `Reporter: ${claim.reporter_name} (${claim.reporter_student_id})`}
                  </span>
                  <span>
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Claim Detail Side panel */}
          {selectedClaim && (
            <div className="glass-panel" style={{ padding: '1.5rem', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.15rem' }}>Verification Details</h3>
                <button className="modal-close" onClick={() => setSelectedClaim(null)}>
                  <X size={16} />
                </button>
              </div>

              {/* Item reference */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>ITEM DETAILS</span>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'rgba(15,20,32,0.4)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-glass)' }}>
                  {selectedClaim.item_image_url && (
                    <img src={selectedClaim.item_image_url} alt={selectedClaim.item_title} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedClaim.item_title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Item Status: <span className={`badge badge-${selectedClaim.item_status}`} style={{ fontSize: '0.6rem', padding: '1px 6px' }}>{selectedClaim.item_status}</span></div>
                  </div>
                </div>
              </div>

              {/* Verification Proof comparing description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>CLAIMANT'S VERIFICATION PROOF</span>
                <div style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.15)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {selectedClaim.proof_description}
                </div>
              </div>

              {/* Claimant Contact Details */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  {tab === 'received' ? "CLAIMANT'S DETAILS" : "REPORTER'S DETAILS"}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} className="text-indigo" />
                    <span>ID: {tab === 'received' ? selectedClaim.claimant_student_id : selectedClaim.reporter_student_id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} className="text-indigo" />
                    <span>{tab === 'received' ? selectedClaim.claimant_email : selectedClaim.reporter_email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} className="text-indigo" />
                    <span>{selectedClaim.contact_info}</span>
                  </div>
                </div>
              </div>

              {/* Verification Status Banner / Control Buttons */}
              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1rem' }}>
                {selectedClaim.status === 'pending' ? (
                  tab === 'received' ? (
                    selectedClaim.item_status === 'resolved' ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                        This item has already been resolved with another claim.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button 
                          onClick={() => handleResolveClaim(selectedClaim.id, 'rejected')}
                          className="btn btn-danger" 
                          disabled={processingClaimId !== null}
                          style={{ padding: '0.5rem' }}
                        >
                          <XCircle size={16} />
                          <span>Reject Claim</span>
                        </button>
                        <button 
                          onClick={() => handleResolveClaim(selectedClaim.id, 'approved')}
                          className="btn btn-success" 
                          disabled={processingClaimId !== null}
                          style={{ padding: '0.5rem' }}
                        >
                          <CheckCircle size={16} />
                          <span>Approve Claim</span>
                        </button>
                      </div>
                    )
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-warning)', fontSize: '0.85rem', fontWeight: 500 }}>
                      <ShieldAlert size={16} />
                      <span>Pending review by the reporter. You will be notified of updates.</span>
                    </div>
                  )
                ) : selectedClaim.status === 'approved' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-success)', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(16,185,129,0.05)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <CheckCircle size={18} />
                    <span>Claim Approved and Ownership Verified!</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-error)', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(244,63,94,0.05)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(244,63,94,0.2)' }}>
                    <XCircle size={18} />
                    <span>Claim Rejected/Closed.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
