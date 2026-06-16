import React, { useState, useEffect } from 'react';
import { Search, Tag, MapPin, Calendar, User, Eye, CheckCircle2, ShieldCheck, HelpCircle, X, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = ['All', 'Electronics & Laptops', 'Valuables & Wallets', 'Jewelry', 'Keys & Dorm Access', 'Books & Stationery', 'Clothing & Sports Gear', 'Other'];

export default function Dashboard({ currentUser, onOpenAuth, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All'); // 'All', 'lost', 'found'
  const [selectedStatus, setSelectedStatus] = useState('open'); // 'All', 'open', 'resolved'

  // Modals state
  const [selectedItem, setSelectedItem] = useState(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimProof, setClaimProof] = useState('');
  const [claimContact, setClaimContact] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedType !== 'All') params.append('type', selectedType);
      if (selectedStatus !== 'All') params.append('status', selectedStatus);

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        setItems(data);
      } else {
        showToast(data.error || 'Failed to load items', 'error');
      }
    } catch (err) {
      showToast('Error connecting to database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchTerm, selectedCategory, selectedType, selectedStatus]);

  // Dynamic placeholders based on category
  const getCategoryGradient = (category) => {
    switch (category) {
      case 'Electronics & Laptops':
        return 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
      case 'Valuables & Wallets':
        return 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
      case 'Jewelry':
        return 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
      case 'Keys & Dorm Access':
        return 'linear-gradient(135deg, #dc2626 0%, #f43f5e 100%)';
      case 'Books & Stationery':
        return 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)';
      case 'Clothing & Sports Gear':
        return 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)';
      default:
        return 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
    }
  };

  // Submit Claim
  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Please sign in to submit a claim', 'error');
      onOpenAuth();
      return;
    }
    if (!claimProof || !claimContact) {
      showToast('Please fill out all claim details', 'error');
      return;
    }

    setSubmittingClaim(true);
    try {
      const response = await fetch(`/api/items/${selectedItem.id}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimant_id: currentUser.id,
          proof_description: claimProof,
          contact_info: claimContact
        })
      });
      const data = await response.json();

      if (response.ok) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        showToast('Claim verification submitted successfully!', 'success');
        setShowClaimModal(false);
        setSelectedItem(null);
        setClaimProof('');
        setClaimContact('');
        fetchItems(); // Reload dashboard
      } else {
        showToast(data.error || 'Failed to submit claim', 'error');
      }
    } catch (err) {
      showToast('Error submitting claim', 'error');
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <section className="hero">
        <h1>CampusTrace Portal</h1>
        <p>Reuniting students with lost textbooks, calculators, bags, and dorm keys across campus.</p>
        
        {/* Statistics Cards */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <div className="glass-panel" style={{ padding: '1rem 2rem', minWidth: '150px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
              {items.filter(i => i.status === 'open').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Reports</div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem 2rem', minWidth: '150px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-success)' }}>
              {items.filter(i => i.status === 'resolved').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Items Reunited</div>
          </div>
        </div>
      </section>

      {/* Filter Options */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div className="filter-bar">
          {/* Search bar */}
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="form-control"
              placeholder="Search items by keyword, classroom, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              className="form-control"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              <option value="All">All Types</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
          </div>

          {/* Status Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              <option value="All">All Statuses</option>
              <option value="open">Open Reports</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Category horizontal scrolling bar */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginTop: '1rem' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn"
              style={{
                padding: '0.4rem 1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                background: selectedCategory === cat ? 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)' : 'var(--bg-secondary)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: '1px solid ' + (selectedCategory === cat ? 'transparent' : 'var(--border-glass)')
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Feed Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <div style={{ animation: 'spin 1s linear infinite', border: '3px solid var(--border-glass)', borderTop: '3px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', margin: '0 auto 1rem auto' }}></div>
          Loading items database...
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
          <h3>No items found matching your filters</h3>
          <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>Try broadening your search or report a new item.</p>
        </div>
      ) : (
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card glass-panel">
              {/* Image cover */}
              <div className="item-card-image">
                <span className={`badge item-card-badge badge-${item.type}`}>{item.type}</span>
                <span className={`badge item-card-status badge-${item.status}`}>{item.status}</span>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.title} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: getCategoryGradient(item.category),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}>
                    <Tag size={32} style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '0 0.5rem' }}>
                      {item.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Body details */}
              <div className="item-card-content">
                <h3 className="item-card-title">{item.title}</h3>
                <p className="item-card-desc">{item.description}</p>
                
                <div className="item-card-details">
                  <span>
                    <MapPin size={12} />
                    {item.location}
                  </span>
                  <span>
                    <Calendar size={12} />
                    {item.date_lost_found}
                  </span>
                </div>

                <button 
                  onClick={() => setSelectedItem(item)}
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '1.25rem', padding: '0.6rem' }}
                >
                  <Eye size={16} />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Details Modal */}
      {selectedItem && !showClaimModal && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ textTransform: 'capitalize' }}>
                <span className={`badge badge-${selectedItem.type}`} style={{ marginRight: '0.75rem' }}>{selectedItem.type}</span>
                {selectedItem.title}
              </h3>
              <button className="modal-close" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              {selectedItem.image_url && (
                <div style={{ width: '100%', maxHeight: '300px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', marginBottom: '1.5rem', border: '1px solid var(--border-glass)' }}>
                  <img src={selectedItem.image_url} alt={selectedItem.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              )}

              {/* Specifications list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <MapPin size={16} className="text-indigo" style={{ minWidth: '16px' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CAMPUS LOCATION</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', wordBreak: 'break-word' }}>{selectedItem.location}</div>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Calendar size={16} className="text-indigo" style={{ minWidth: '16px' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATE</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedItem.date_lost_found}</div>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Tag size={16} className="text-indigo" style={{ minWidth: '16px' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CATEGORY</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{selectedItem.category}</div>
                  </div>
                </div>
                <div className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <User size={16} className="text-indigo" style={{ minWidth: '16px' }} />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>REPORTED BY</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {selectedItem.reporter_name} ({selectedItem.reporter_student_id})
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Description</h4>
                <p style={{ color: 'var(--text-primary)', lineHeight: '1.5', background: 'rgba(15,20,32,0.4)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-glass)', fontSize: '0.95rem' }}>
                  {selectedItem.description}
                </p>
              </div>

              {/* Status Section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--border-radius-sm)', background: 'rgba(99,102,241,0.03)', border: '1px dashed rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <span className={`badge badge-${selectedItem.status}`} style={{ fontSize: '0.7rem' }}>{selectedItem.status}</span>
                </div>
                {selectedItem.status === 'resolved' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} />
                    <span>Reunited</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedItem(null)}>Close</button>
              {selectedItem.status === 'open' && (
                currentUser && currentUser.id === selectedItem.user_id ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>You reported this item</span>
                ) : (
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      if (!currentUser) {
                        showToast(selectedItem.type === 'lost' ? 'Please sign in to report finding this item' : 'Please sign in to submit a claim', 'error');
                        onOpenAuth();
                      } else {
                        setShowClaimModal(true);
                      }
                    }}
                  >
                    <ExternalLink size={16} />
                    <span>{selectedItem.type === 'lost' ? 'I Found This Item' : 'Claim this Item'}</span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Claim / Found Form Modal */}
      {showClaimModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowClaimModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{selectedItem.type === 'lost' ? 'Report Found: ' + selectedItem.title : 'Claim Ownership: ' + selectedItem.title}</h3>
              <button className="modal-close" onClick={() => setShowClaimModal(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleClaimSubmit}>
              <div className="modal-body">
                {selectedItem.type === 'lost' ? (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: '0.85rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--accent-success)', lineHeight: '1.4' }}>
                    <strong>Recovery Note:</strong> Please describe where you found this item, where it is kept now (e.g. at library desk, hostel reception, canteen counter), or if you have it with you.
                  </div>
                ) : (
                  <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.85rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem', color: 'var(--accent-warning)', lineHeight: '1.4' }}>
                    <strong>Security Note:</strong> Please describe unique details (e.g. laptop stickers, phone wallpaper, notebook topics, keys keychains) to help the reporter verify your ownership.
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="claim-proof">
                    {selectedItem.type === 'lost' ? 'Recovery Details / Location' : 'Verification Proof / Descriptions'}
                  </label>
                  <textarea
                    id="claim-proof"
                    className="form-control"
                    rows={4}
                    placeholder={
                      selectedItem.type === 'lost' 
                        ? "Where did you find it? Where is it currently kept? (e.g., 'Handed over to canteen manager', 'Kept at library desk')" 
                        : "Provide specific details (e.g. details of documents inside, scratch markings, stickers, specific files on drives, passcode code, roommate's name)..."
                    }
                    value={claimProof}
                    onChange={(e) => setClaimProof(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="claim-contact">Your Contact Information</label>
                  <input
                    id="claim-contact"
                    type="text"
                    className="form-control"
                    placeholder="Phone number, email, or social handle"
                    value={claimContact}
                    onChange={(e) => setClaimContact(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowClaimModal(false)} disabled={submittingClaim}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingClaim}>
                  {submittingClaim ? 'Submitting...' : (selectedItem.type === 'lost' ? 'Submit Recovery Alert' : 'Submit Claim')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
