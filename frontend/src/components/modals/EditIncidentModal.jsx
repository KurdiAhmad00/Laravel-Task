import React, { useEffect, useState } from 'react';
import { incidentAPI } from '../../services/api';
import './EditIncidentModal.css';

const EditIncidentModal = ({ open, onClose, incidentId, onUpdated }) => {
    const [form, setForm] = useState({
        'description': '',
        'location_lat': '',
        'location_lng': '',
    });
    const [files, setFiles] = useState([]);
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting , setSubmitting] = useState(false);
    const [error, setError] = useState('');


    useEffect(() => {
        if (!open || !incidentId || typeof incidentId !== 'number' || incidentId <= 0) {
            return;
        }

        setFiles([]);
        setError('');

        const fetchIncident = async () => {
            setLoading(true);
            setError('');
            try {
                const { data } = await incidentAPI.getIncident(incidentId);
                setForm({
                    description: data.incident.description || '',
                    location_lat: data.incident.location_lat || '',
                    location_lng: data.incident.location_lng || '',
                });
                setExistingAttachments(data.incident.attachments || []);
            } catch (e) {
                setError(e.response?.data?.message || 'Failed to fetch incident');
            } finally {
                setLoading(false);
            }
        };
        fetchIncident();
    }, [open, incidentId]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const existingFilenames = existingAttachments.map(att => att.filename);
        const newFiles = selectedFiles.filter(file => 
            !existingFilenames.includes(file.name)
        );
        
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingAttachment = async (attachmentId) => {
        try {
            await incidentAPI.deleteAttachment(attachmentId);
            setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
        } catch (e) {
            setError('Failed to delete attachment');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await incidentAPI.updateIncident(incidentId, form);
            
            if (files.length > 0) {
                for (const file of files) {
                    await incidentAPI.uploadAttachment(incidentId, file);
                }
                setFiles([]);
            }
            
            onUpdated();
            onClose();
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to update incident');
        } finally {
            setSubmitting(false);
        }
    };
if (!open) return null;

return (
    <div className="edit-modal-overlay" onClick={onClose}>
        <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-header">
                <h2 className="edit-modal-title">Edit Incident</h2>
                <button className="edit-modal-close" onClick={onClose}>×</button>
            </div>

            {loading && (
                <div className="edit-modal-loading">
                    <div className="spinner"> </div>
                    <p>Loading incident details...</p>
                </div>
            )}
            {error && (
                <div className="edit-modal-error">
                    <p>{error}</p>
                </div>
            )}
            <form className="edit-modal-body" onSubmit={handleSubmit}>
                <div className="edit-modal-form-group">
                    <label htmlFor="description">Description</label>
                    <textarea id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                   rows={4}
                   required 
                />
                </div>

                <div className="edit-modal-form-row">
                    <div className="edit-modal-form-group">
                        <label htmlFor="location_lat">Latitude</label>
                        <input 
                        type="number"
                        id="location_lat"
                        name="location_lat"
                        value={form.location_lat}
                        onChange={handleChange}
                    />
                    </div>
                    <div className="edit-modal-form-group">
                        <label htmlFor="location_lng">Longitude</label>
                        <input 
                        type="number"
                        id="location_lng"
                        name="location_lng"
                        value={form.location_lng}
                        onChange={handleChange}
                        required
                    />
                    </div>
                </div>

                {/* Existing Attachments */}
                {existingAttachments.length > 0 && (
                    <div className="edit-modal-form-group">
                        <label>Current Attachments</label>
                        <div className="existing-attachments-list">
                            {existingAttachments.map((attachment) => (
                                <div key={attachment.id} className="existing-attachment-item">
                                    <div className="attachment-info">
                                        <span className="attachment-name">{attachment.filename}</span>
                                        <span className="attachment-size">({(attachment.size_bytes / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeExistingAttachment(attachment.id)}
                                        className="remove-attachment-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* New File Upload */}
                <div className="edit-modal-form-group">
                    <label htmlFor="attachments">Add New Attachments (Optional)</label>
                    <input
                        id="attachments"
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        onChange={handleFileChange}
                        className="file-input"
                    />
                    {files.length > 0 && (
                        <div className="file-list">
                            {files.map((file, index) => (
                                <div key={index} className="file-item">
                                    <span className="file-name">{file.name}</span>
                                    <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="remove-file-btn"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="edit-modal-footer">
                    <button type="button" className="edit-btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button type="submit" className="edit-btn-save" disabled={submitting}>
                        {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>

        </div>
    </div>
);
};

export default EditIncidentModal;