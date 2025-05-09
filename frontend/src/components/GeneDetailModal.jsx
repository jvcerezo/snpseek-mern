// src/components/GeneDetailModal.js
import React, { useEffect, useMemo } from 'react'; // Added useMemo
// Import Icon if needed
import { FaExternalLinkAlt } from 'react-icons/fa';
import './GeneDetailModal.css'; // We'll add styles here

const GeneDetailModal = ({ geneData, onClose }) => {
  // Prevent modal closing when clicking inside the content
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  // Handle Escape key press to close modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);


  // --- Construct JBrowse URL ---
  const jbrowseUrl = useMemo(() => {
    if (!geneData || !geneData.contig || geneData.start == null || geneData.end == null) {
        // Don't generate URL if essential data is missing
        return null;
    }

    // --- Configuration (Needs Adjustment Based on Reference Genome) ---
    // TODO: Make baseURL and tracks dynamic based on geneData.referenceGenome
    const jbrowseBaseUrl = "https://snp-seek.irri.org/jbrowse/"; // Example Base URL
    // Example tracks - THESE ARE LIKELY SPECIFIC TO ONE GENOME (e.g., MSU7)
    const defaultTracks = "DNA,msu7gff,msu7snpsv2,msu7indelsv2";
    // --- End Configuration ---

    const contig = encodeURIComponent(geneData.contig); // Ensure contig is URL-safe
    const start = geneData.start;
    const end = geneData.end;

    // Construct the URL (add 1 to start for JBrowse 1-based coords if needed, check target instance)
    // Assuming start/end are 0-based or 1-based consistent with JBrowse instance
    const location = `${contig}:${start}..${end}`;

    // Add highlight parameter if desired
    const highlight = ""; // Example: `${contig}:${start}..${end}`; // Optional highlight

    return `${jbrowseBaseUrl}?loc=${location}&tracks=${defaultTracks}${highlight ? `&highlight=${highlight}` : ''}`;

  }, [geneData]); // Recalculate only when geneData changes


  if (!geneData) return null; // Don't render if no gene data

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-gene" onClick={handleContentClick}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <i className="fas fa-times"></i> {/* Or use FaTimes */}
        </button>

        <h2 className="modal-title">
           <i className="fas fa-dna"></i> Gene Details: {geneData.geneName}
        </h2>

        {/* --- Gene Details Section --- */}
        <div className="modal-body modal-section">
           <div className="detail-item"> <span className="detail-label">Gene Symbol:</span> <span className="detail-value">{geneData.geneSymbol || 'N/A'}</span> </div>
           <div className="detail-item"> <span className="detail-label">Reference Genome:</span> <span className="detail-value">{geneData.referenceGenome || 'N/A'}</span> </div>
           <div className="detail-item"> <span className="detail-label">Contig:</span> <span className="detail-value">{geneData.contig || 'N/A'}</span> </div>
           <div className="detail-item"> <span className="detail-label">Location Start:</span> <span className="detail-value">{geneData.start?.toLocaleString() ?? 'N/A'}</span> </div>
           <div className="detail-item"> <span className="detail-label">Location End:</span> <span className="detail-value">{geneData.end?.toLocaleString() ?? 'N/A'}</span> </div>
           <div className="detail-item"> <span className="detail-label">Strand:</span> <span className="detail-value"> <span className={`strand-badge ${geneData.strand === '+' ? 'positive' : 'negative'}`}> {geneData.strand || 'N/A'} </span> </span> </div>
           <div className="detail-item description-item"> <span className="detail-label">Description:</span> <p className="detail-value description-text">{geneData.description || 'No description available.'}</p> </div>
           {geneData.function && ( <div className="detail-item description-item"> <span className="detail-label">Function:</span> <p className="detail-value description-text">{geneData.function}</p> </div> )}
        </div>

        {/* --- JBrowse Iframe Section --- */}
        <div className="modal-section jbrowse-section">
            <h3 className="section-title">Genome Browser View</h3>
            {jbrowseUrl ? (
                 <div className="iframe-container">
                    <iframe
                        src={jbrowseUrl}
                        width="100%"
                        height="600" // Adjust height as needed
                        title={`JBrowse view for ${geneData.geneName}`}
                        frameBorder="0"
                    >
                        Loading JBrowse...
                    </iframe>
                    <a href={jbrowseUrl} target="_blank" rel="noopener noreferrer" className="external-link-btn">
                        Open in Full JBrowse <FaExternalLinkAlt size="0.8em" />
                    </a>
                 </div>
            ) : (
                <p className="jbrowse-unavailable">Genome browser view unavailable (missing location data).</p>
            )}
             <p className="modal-note jbrowse-note">
                Note: JBrowse tracks and base URL might need adjustment based on the selected Reference Genome. Feature highlighting may depend on JBrowse setup.
             </p>
        </div>


        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
             Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneDetailModal;