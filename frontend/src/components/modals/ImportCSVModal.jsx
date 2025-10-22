import React, { useState } from 'react';
import { importCSVAPI } from '../../services/api';
import './ImportCSVModal.css';

const ImportCSVModal = ({ isOpen, onClose, onImportComplete}) => {
    const [csvFile, setCsvFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ success: 0, errors: 0 });

    const handleFilechange = (e) => {
        const file = e.target.files[0];
        if (file){
            if (file.type === 'text/csv' || file.name.endsWith('.csv')){
                setCsvFile(file);
                setError(null);
            } else {
                setError('Please upload a CSV file');
                setCsvFile(null);
            }
        }
    }

    const handleImport = async () => {
        if (!csvFile){
            setError('Please select a CSV file');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await importCSVAPI.importCSV(csvFile);
            const data = response.data;
            
            setResults(data.results);
            setSuccess(`Import Complete! ${data.results.success} incidents imported!`);
            
            if (data.results.errors > 0){
                setError(` ${data.results.errors} rows has errors, check details below`);
            }

            //notify parent component of success
            if (onImportComplete){
                onImportComplete(data.results);
            }
        } catch (error) {
            setError(`Failed to import CSV: ${error.message}`);
            console.error('Import CSV Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCsvFile(null);
        setError(null);
        setSuccess(null);
        setResults({ success: 0, errors: 0 });
        onClose();
    };
    const handleRetry = () => {
        setCsvFile(null);
        setError(null);
        setSuccess(null);
        setResults({ success: 0, errors: 0 });
    };

    if (!isOpen) return null;

    return (
        <div className="CSVModal-overlay">
            <div className="CSVModal-import">
                <div className="CSVModal-header">
                    <h2>Import Incidents from CSV file</h2>
                    <button className="CSVModal-close" onClick={handleClose}>×</button>
                </div>
                <div className="CSVModal-body">

                    {/*File Selection*/}
                    <div className="CSVModal-file-selection">
                        <label htmlFor="csv-file" className="CSVModal-file-label">
                            <div className="CSVModal-file-inputarea">
                                <span className="CSVModal-file-icon">📁</span>
                                <span className="CSVModal-file-text">
                                    {csvFile ? csvFile.name : 'Click to select CSV file'}
                                </span>
                            </div>
                            <input 
                            id="csv-file"
                            type="file"
                            accept=".csv"
                            onChange={handleFilechange}
                            className="CSVModal-file-input"
                            />
                        </label>
                    </div>

                    {/*CSV FORMAT INFO*/}
                    <div className="CSVModal-format-info">
                        <h4> CSV Format Requirements</h4>
                        <p><code>title,description,category_id,latitude,longitude,citizen_username,priority,status</code></p>
                        <small>"Street light broken","Light not working",1,40.7128,-74.0060,"john_doe","high","new"</small>
                    </div>

                    {/*Error Display*/}
                    {error &&(
                        <div className="CSVModal-error-message">
                            <span className="CSVModal-error-icon">❌</span>
                            {error}
                        </div>
                    )}

                    {/*Success Display*/}
                    {success &&(
                        <div className="CSVModal-success-message">
                            <span className="CSVModal-success-icon">✅</span>
                            {success}
                        </div>
                    )}
                    {/*Results Summary*/}
                    {(results.success > 0|| results.errors > 0) &&(
                        <div className="CSVModal-results-summary">
                            <h4>Import Results:</h4>
                            <div className="CSVModal-results-stats">
                                <div className="CSVModal-stat-success">
                                    <span className="CSVModal-stat-number">{results.success}</span>
                                    <span className="CSVModal-stat-label">Successfully Imported</span>
                                </div>
                                <div className="CSVModal-stat-errors">
                                    <span className="CSVModal-stat-number">{results.errors}</span>
                                    <span className="CSVModal-stat-label">Errors</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/*Error Details*/}
                    {results.error_details && results.error_details.length> 0 &&(
                        <div className="CSVModal-error-details">
                            <h4>Error Details:</h4>
                            <div className="CSVModal-error-list">
                                {results.error_details.map((error, index) =>(
                                    <div key={index} className="CSVModal-error-item">
                                        <span className="CSVModal-error-row">{error.row}</span>
                                        <span className="CSVModal-error-message">{error.error}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {/*Footer*/}
                <div className="CSVModal-footer">
                    <button className="CSVModal-close-button" onClick={handleClose}>Close</button>
                    {results.success > 0 || results.errors > 0 ? (
                        <button className="CSVModal-import-button" onClick={handleRetry}>
                        Import Another File
                    </button>
                    ) : (
                        <button className="CSVModal-import-button"
                         onClick={handleImport}
                         disabled={!csvFile || loading}
                         >
                            {loading ? "Importing..." : "Import CSV"}
                        </button>
                    )}
                    
                </div>

                
            </div>
        </div>
    );
};

export default ImportCSVModal;