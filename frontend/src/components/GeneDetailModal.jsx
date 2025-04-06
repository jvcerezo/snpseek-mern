// src/components/GeneDetailModal.js
import React from 'react';
import './GeneDetailModal.css'; // Adjust path if necessary

const GeneDetailModal = ({ geneData, onClose }) => {
  // Prevent modal closing when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Handle Escape key press to close modal
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Cleanup listener on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);


  if (!geneData) return null; // Don't render if no gene data

  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div className="modal-content" onClick={handleContentClick}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <i className="fas fa-times"></i>
        </button>

        <h2 className="modal-title">
           <i className="fas fa-dna"></i> Gene Details: {geneData.geneName}
        </h2>

        <div className="modal-body">
           <div className="detail-item">
              <span className="detail-label">Gene Symbol:</span>
              <span className="detail-value">{geneData.geneSymbol || 'N/A'}</span>
           </div>
           <div className="detail-item">
              <span className="detail-label">Reference Genome:</span>
              <span className="detail-value">{geneData.referenceGenome || 'N/A'}</span>
           </div>
           <div className="detail-item">
              <span className="detail-label">Contig:</span>
              <span className="detail-value">{geneData.contig || 'N/A'}</span>
           </div>
           <div className="detail-item">
              <span className="detail-label">Location Start:</span>
              {/* Display Start/End if available (check for null/undefined) */}
              <span className="detail-value">{geneData.start !== null && geneData.start !== undefined ? geneData.start.toLocaleString() : 'N/A'}</span>
           </div>
           <div className="detail-item">
              <span className="detail-label">Location End:</span>
              <span className="detail-value">{geneData.end !== null && geneData.end !== undefined ? geneData.end.toLocaleString() : 'N/A'}</span>
           </div>
           <div className="detail-item">
              <span className="detail-label">Strand:</span>
              <span className="detail-value">
                <span className={`strand-badge ${geneData.strand === '+' ? 'positive' : 'negative'}`}>
                    {geneData.strand || 'N/A'}
                </span>
              </span>
           </div>
           <div className="detail-item description-item">
              <span className="detail-label">Description:</span>
              <p className="detail-value description-text">{geneData.description || 'No description available.'}</p>
           </div>
           {/* Add other details like function if available */}
           {geneData.function && (
              <div className="detail-item description-item">
                <span className="detail-label">Function:</span>
                <p className="detail-value description-text">{geneData.function}</p>
              </div>
           )}
        </div>

         {/* Remove note about missing data if details are always fetched now */}
        {/* {(geneData.start === undefined || geneData.end === undefined) && ( ... )} */}

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
             Close
          </button>
          {/* Optional: Add a button to link to an external browser like JBrowse */}
        </div>
      </div>
    </div>
  );
};

export default GeneDetailModal;