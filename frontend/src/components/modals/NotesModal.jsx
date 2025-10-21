import React, { useState, useEffect } from 'react';
import { incidentAPI } from '../../services/api';
import './NotesModal.css';

const NotesModal = ({ open, onClose, incidentId, onNoteAdded }) => {
  const [incident, setIncident] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Pagination state for notes
  const [currentPage, setCurrentPage] = useState(1);
  const notesPerPage = 3;

  useEffect(() => {
    if (open && incidentId) {
      loadIncident();
      setCurrentPage(1); // Reset to first page when modal opens
    } else {
      // Reset form when modal closes
      setIncident(null);
      setNotes([]);
      setNewNote('');
      setError('');
      setSubmitting(false);
      setCurrentPage(1);
    }
  }, [open, incidentId]);

  const loadIncident = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await incidentAPI.getIncident(incidentId);
      setIncident(data.incident);
      setNotes(data.incident.notes || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load incident details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await incidentAPI.addNote(incidentId, newNote.trim());
      setNewNote('');
      // Reload incident to get updated notes
      await loadIncident();
      onNoteAdded?.();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleString();
  };

  // Pagination calculations
  const totalPages = Math.ceil(notes.length / notesPerPage);
  const startIndex = (currentPage - 1) * notesPerPage;
  const endIndex = startIndex + notesPerPage;
  const currentNotes = notes.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Incident Notes</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading incident details...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadIncident} className="retry-btn">Try Again</button>
            </div>
          ) : incident ? (
            <>
              <div className="incident-info">
                <h3>Incident #{incident.id}</h3>
                <div className="incident-meta">
                  <div className="incident-field">
                    <strong>Title:</strong> {incident.title}
                  </div>
                  <div className="incident-field">
                    <strong>Status:</strong> 
                    <span className="current-status">{incident.status || 'New'}</span>
                  </div>
                  <div className="incident-field">
                    <strong>Priority:</strong> {incident.priority || 'Low'}
                  </div>
                </div>
              </div>

              <div className="notes-section">
                <h4>Existing Notes ({notes.length})</h4>
                
                {notes.length === 0 ? (
                  <div className="no-notes">
                    <p>No notes added yet. Be the first to add a note!</p>
                  </div>
                ) : (
                  <>
                    <div className="notes-list">
                      {currentNotes.map((note, index) => (
                        <div key={startIndex + index} className="note-item">
                          <div className="note-content">{note.body}</div>
                          <div className="note-meta">
                            <span className="note-date">{formatDate(note.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="notes-pagination">
                        <div className="pagination-info">
                          Showing {startIndex + 1} to {Math.min(endIndex, notes.length)} of {notes.length} notes
                        </div>
                        <div className="pagination-controls">
                          <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </button>
                          
                          <div className="pagination-pages">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <button
                                key={page}
                                className={`pagination-page ${page === currentPage ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            className="pagination-btn"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <form onSubmit={handleSubmit} className="add-note-form">
                <div className="form-group">
                  <label htmlFor="newNote">Add New Note</label>
                  <textarea
                    id="newNote"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter your note here..."
                    className="note-textarea"
                    rows={4}
                    required
                  />
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={submitting || !newNote.trim()}
                  >
                    {submitting ? 'Adding...' : 'Add Note'}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default NotesModal;
