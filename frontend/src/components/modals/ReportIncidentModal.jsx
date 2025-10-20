import React, { useEffect, useState } from 'react';
import './ReportIncidentModal.css';
import { categoriesAPI, incidentAPI } from '../../services/api';

const ReportIncidentModal = ({ open, onClose, onCreated }) => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category_id: '',
    priority: 'medium',
    location_lat: '',
    location_lng: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const { data } = await categoriesAPI.getAll();
        setCategories(Array.isArray(data) ? data : (data?.data || []));
      } catch (e) {
        // non-blocking
      }
    })();
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.description || !form.category_id || !form.priority) {
      setError('Please fill all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        location_lat: form.location_lat === '' ? null : form.location_lat,
        location_lng: form.location_lng === '' ? null : form.location_lng,
      };
      await incidentAPI.createIncident(payload);
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create incident');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3 className="modal-title">Report New Incident</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}

          <div className="form-row grid-2">
            <div className="select-wrapper">
              <label htmlFor="category_id">Category<span className="req">*</span></label>
              <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange} required>
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="select-wrapper">
              <label htmlFor="priority">Priority<span className="req">*</span></label>
              <select id="priority" name="priority" value={form.priority} onChange={handleChange} required>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="title">Title<span className="req">*</span></label>
            <input id="title" name="title" value={form.title} onChange={handleChange} maxLength={150} required />
          </div>

          <div className="form-row">
            <label htmlFor="description">Description<span className="req">*</span></label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={4} required />
          </div>

          <div className="form-row grid-2">
            <div>
              <label htmlFor="location_lat">Latitude</label>
              <input
                id="location_lat"
                name="location_lat"
                type="number"
                step="any"
                value={form.location_lat}
                onChange={handleChange}
                placeholder="e.g. -33.9249"
              />
            </div>
            <div>
              <label htmlFor="location_lng">Longitude</label>
              <input
                id="location_lng"
                name="location_lng"
                type="number"
                step="any"
                value={form.location_lng}
                onChange={handleChange}
                placeholder="e.g. 18.4241"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;


