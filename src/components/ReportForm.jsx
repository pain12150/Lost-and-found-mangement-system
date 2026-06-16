import React, { useState } from 'react';
import { ClipboardList, MapPin, Calendar, Camera, ChevronRight, ChevronLeft, Send, LogIn, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORIES = ['Electronics & Laptops', 'Valuables & Wallets', 'Jewelry', 'Keys & Dorm Access', 'Books & Stationery', 'Clothing & Sports Gear', 'Other'];

export default function ReportForm({ currentUser, onOpenAuth, onViewChange, showToast }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState('lost'); // 'lost' or 'found'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics & Laptops');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  
  // Image handling
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <div className="glass-panel" style={{ maxWidth: '500px', margin: '4rem auto', padding: '3rem 2rem', textAlign: 'center' }}>
        <ClipboardList size={48} style={{ color: 'var(--accent-primary)', marginBottom: '1.5rem' }} />
        <h2>Report an Item</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 2rem 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Please sign in to report a lost or found campus item. Student authentication helps ensure secure ownership transfers.
        </p>
        <button className="btn btn-primary" onClick={onOpenAuth} style={{ width: '100%' }}>
          <LogIn size={18} />
          <span>Sign In to Continue</span>
        </button>
      </div>
    );
  }

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size must be less than 5MB', 'error');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1 && !title.trim()) {
      showToast('Please enter an item title', 'error');
      return;
    }
    if (step === 2 && !description.trim()) {
      showToast('Please enter an item description', 'error');
      return;
    }
    if (step === 3 && (!location.trim() || !date)) {
      showToast('Please specify campus location and date', 'error');
      return;
    }
    setStep(step + 1);
  };

  const handlePrev = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append('user_id', currentUser.id);
    formData.append('type', type);
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('location', location);
    formData.append('date_lost_found', date);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();

      if (response.ok) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 }
        });
        showToast(
          type === 'lost' 
            ? 'Campus lost item reported successfully! We will check for matches.' 
            : 'Campus found item listed successfully!', 
          'success'
        );
        onViewChange('dashboard');
      } else {
        showToast(data.error || 'Failed to submit report', 'error');
      }
    } catch (err) {
      showToast('Error connecting to server', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2.5rem 2rem' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <Sparkles size={24} className="text-indigo" />
        Report {type === 'lost' ? 'Lost' : 'Found'} Campus Item
      </h2>

      {/* Progress Wizard Header */}
      <div className="steps-indicator">
        <div className={`step-node ${step >= 1 ? 'completed' : ''} ${step === 1 ? 'active' : ''}`}>1</div>
        <div className={`step-node ${step >= 2 ? 'completed' : ''} ${step === 2 ? 'active' : ''}`}>2</div>
        <div className={`step-node ${step >= 3 ? 'completed' : ''} ${step === 3 ? 'active' : ''}`}>3</div>
        <div className={`step-node ${step >= 4 ? 'completed' : ''} ${step === 4 ? 'active' : ''}`}>4</div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="step-content animate-slide-up">
            <div className="form-group">
              <label>Report Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => setType('lost')}
                  className={`btn ${type === 'lost' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '48px' }}
                >
                  I Lost Something
                </button>
                <button
                  type="button"
                  onClick={() => setType('found')}
                  className={`btn ${type === 'found' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ height: '48px' }}
                >
                  I Found Something
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label htmlFor="item-title">Item Name / Title</label>
              <input
                id="item-title"
                type="text"
                className="form-control"
                placeholder="e.g. Casio fx-991EX Calculator, Chemistry Lab Journal, Dorm Access Keys"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>
        )}

        {/* STEP 2: Category & Description */}
        {step === 2 && (
          <div className="step-content">
            <div className="form-group">
              <label htmlFor="item-category">Category</label>
              <select
                id="item-category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="item-desc">Description</label>
              <textarea
                id="item-desc"
                className="form-control"
                rows={5}
                placeholder="Specify unique details (e.g. cover stickers, hand-written names on textbooks, keychains, lockscreen wallpapers, bag brand) to help students identify it..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
          </div>
        )}

        {/* STEP 3: Location & Time */}
        {step === 3 && (
          <div className="step-content">
            <div className="form-group">
              <label htmlFor="item-loc">Where was it {type === 'lost' ? 'lost' : 'found'} on campus?</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="item-loc"
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '35px' }}
                  placeholder="e.g. Central Library Table 4, Block-A Cafeteria, Science Lab 3, Dorm Hostel A"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="item-date">When was it {type === 'lost' ? 'lost' : 'found'}?</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="item-date"
                  type="date"
                  className="form-control"
                  style={{ paddingLeft: '35px' }}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Photo upload & Submit */}
        {step === 4 && (
          <div className="step-content">
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label>Upload Item Image (Optional)</label>
              <div style={{ marginTop: '0.5rem' }}>
                {imagePreview ? (
                  <div style={{ position: 'relative', width: '100%', maxHeight: '200px', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', padding: '0.25rem', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={16} style={{ transform: 'rotate(45deg)' }} />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="file-upload" className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem', cursor: 'pointer', borderStyle: 'dashed', borderColor: 'var(--border-glass)' }}>
                    <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Click to select an image</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PNG, JPG or WEBP (Max 5MB)</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
            
            {/* Confirmation summary */}
            <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(99,102,241,0.02)', border: '1px solid rgba(99,102,241,0.1)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Report Summary:</div>
              <div>• <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{type}</span></div>
              <div>• <strong>Title:</strong> {title}</div>
              <div>• <strong>Category:</strong> {category}</div>
              <div>• <strong>Campus Location:</strong> {location}</div>
              <div>• <strong>Date:</strong> {date}</div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
          {step > 1 ? (
            <button type="button" onClick={handlePrev} className="btn btn-secondary" disabled={submitting}>
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div></div> // Spacing placeholder
          )}

          {step < 4 ? (
            <button type="button" onClick={handleNext} className="btn btn-primary">
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ background: 'linear-gradient(135deg, var(--accent-success) 0%, var(--accent-primary) 100%)' }}>
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
