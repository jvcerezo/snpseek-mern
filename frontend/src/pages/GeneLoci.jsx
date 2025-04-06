import React, { useState, useEffect, useCallback } from "react";
import {
  fetchTraits,
  fetchReferenceGenomes,
  fetchFeaturesByGeneName,
  fetchGenesByTrait,
  fetchGeneDetailsByNameAndGenome // <-- Import the new API function
} from "../api"; // Adjust path if necessary
import GeneDetailModal from '../components/GeneDetailModal'; // Adjust path if necessary
import "./GeneLoci.css"; // Adjust path if necessary

// Helper component for loading indicators inside dropdowns
const LoadingOption = ({ text = "Loading..." }) => (
  <option disabled value="">{text}</option>
);

// Helper component for cleaner conditional rendering in form
const FormInputSection = ({ isVisible, children }) => {
    return isVisible ? <>{children}</> : null;
};

const GeneLoci = () => {
  // --- State Variables ---
  const [selectedGeneOption, setSelectedGeneOption] = useState("Gene name/symbol/function");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedGeneName, setSelectedGeneName] = useState("");
  const [searchType, setSearchType] = useState("substring");

  const [traitsList, setTraitsList] = useState([]);
  const [loadingTraits, setLoadingTraits] = useState(false);

  const [referenceGenomes, setReferenceGenomes] = useState([]);
  const [referenceGenome, setReferenceGenome] = useState("");
  const [loadingGenomes, setLoadingGenomes] = useState(true);

  const [searchResults, setSearchResults] = useState([]);
  const [genesByTrait, setGenesByTrait] = useState([]);
  const [traitDetails, setTraitDetails] = useState(null);

  const [loading, setLoading] = useState(false); // For main search action
  const [loadingDetails, setLoadingDetails] = useState(false); // <-- State for loading gene details
  const [errorMessage, setErrorMessage] = useState("");
  const [showResultsArea, setShowResultsArea] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGeneData, setSelectedGeneData] = useState(null);

  const [expandedSections, setExpandedSections] = useState({
    queryDetails: false,
    resultsTable: true,
  });

  // --- Data Fetching Effects ---
  useEffect(() => {
    const loadGenomes = async () => {
      setLoadingGenomes(true);
      setErrorMessage(""); // Clear previous errors
      try {
        const genomes = await fetchReferenceGenomes();
        setReferenceGenomes(genomes);
        if (genomes && genomes.length > 0) {
          setReferenceGenome(genomes[0]);
        }
      } catch (error) {
        console.error("Failed to fetch reference genomes:", error);
        setErrorMessage("Could not load reference genomes. Please refresh.");
      } finally {
        setLoadingGenomes(false);
      }
    };
    loadGenomes();
  }, []);

  useEffect(() => {
    if (selectedGeneOption === "Traits") {
      const loadTraits = async () => {
        setLoadingTraits(true);
        setTraitsList([]);
        setErrorMessage(""); // Clear previous errors
        try {
          const traits = await fetchTraits();
          setTraitsList(traits);
        } catch (error) {
          console.error("Failed to fetch traits:", error);
          setErrorMessage("Could not load traits list.");
        } finally {
          setLoadingTraits(false);
        }
      };
      loadTraits();
    } else {
      setSelectedTrait("");
      setTraitDetails(null);
      setTraitsList([]);
    }
  }, [selectedGeneOption]);

  // --- Event Handlers ---
  const handleReset = () => {
    setSelectedGeneOption("Gene name/symbol/function");
    setSelectedTrait("");
    setSelectedGeneName("");
    setSearchType("substring");
    setSearchResults([]);
    setGenesByTrait([]);
    setTraitDetails(null);
    setErrorMessage("");
    setLoading(false);
    setLoadingDetails(false); // Reset details loading
    setShowResultsArea(false);
    setIsModalOpen(false); // Close modal if open
    setSelectedGeneData(null);
    setExpandedSections({ queryDetails: false, resultsTable: true });
     // Optionally reset reference genome
     // setReferenceGenome(referenceGenomes.length > 0 ? referenceGenomes[0] : "");
  };

  const handleSearch = useCallback(async () => {
    // Basic Validation
    let isValid = true;
    if (!referenceGenome) {
      setErrorMessage("Please select a Reference Genome.");
      isValid = false;
    } else if (selectedGeneOption === "Traits" && !selectedTrait) {
      setErrorMessage("Please select a Trait.");
      isValid = false;
    } else {
      const isGeneNameSearch = ["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedGeneOption);
      if (isGeneNameSearch && !selectedGeneName.trim()) {
          setErrorMessage(`Please enter a value for '${selectedGeneOption}'.`);
          isValid = false;
      }
      // Add validation for other types if needed
    }

    if (!isValid) return;

    setLoading(true);
    setErrorMessage("");
    setShowResultsArea(true);
    setSearchResults([]);
    setGenesByTrait([]);
    setTraitDetails(null);
    setExpandedSections(prev => ({ ...prev, resultsTable: true, queryDetails: false }));

    try {
      // Fetching logic remains the same as before
      if (selectedGeneOption === "Traits") {
        const genesForTrait = await fetchGenesByTrait(selectedTrait, referenceGenome);
        setGenesByTrait(genesForTrait);
        const fetchedTraitDetails = traitsList.find((trait) => trait.traitName === selectedTrait);
        setTraitDetails(fetchedTraitDetails);
         // If you want to fetch *full* details for *all* genes found by trait immediately, do it here.
         // Otherwise, details are fetched on click via handleGeneClick.
      } else {
         const results = await fetchFeaturesByGeneName(selectedGeneName, referenceGenome, searchType);
         setSearchResults(results);
      }
    } catch (error) {
      setErrorMessage("An error occurred during the search. Please try again.");
      console.error("Search error:", error);
      setSearchResults([]);
      setGenesByTrait([]);
    } finally {
      setLoading(false);
    }
  }, [referenceGenome, selectedGeneOption, selectedTrait, selectedGeneName, searchType, traitsList]);

  // --- MODAL TRIGGER: Fetch details THEN open modal ---
  const handleGeneClick = useCallback(async (geneItem) => {
    // Prevent fetching if already loading details
    if (loadingDetails) return;

    setLoadingDetails(true);
    setErrorMessage(""); // Clear previous errors
    console.log(`Workspaceing details for: ${geneItem.geneName} (${geneItem.referenceGenome})`);

    try {
      // Use the new API function to get full details
      const detailedData = await fetchGeneDetailsByNameAndGenome(
        geneItem.geneName,
        geneItem.referenceGenome
      );
      // Ensure we received data
      if (detailedData) {
        setSelectedGeneData(detailedData); // Use the detailed data
        setIsModalOpen(true); // Open the modal
      } else {
         // Handle case where backend confirms not found, even if listed in results
         setErrorMessage(`Could not find complete details for ${geneItem.geneName}.`);
         setSelectedGeneData(null);
         setIsModalOpen(false);
      }
    } catch (error) {
      // Handle errors from the fetchGeneDetails function
      console.error("Error fetching gene details:", error);
      setErrorMessage(error.message || "Failed to load gene details. Please try again.");
      setSelectedGeneData(null); // Clear any potentially stale data
      setIsModalOpen(false);
    } finally {
      setLoadingDetails(false); // Stop loading indicator
    }
  }, [loadingDetails]); // Dependency: loadingDetails to prevent concurrent fetches

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGeneData(null);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Determine display data
  const displayResults = selectedGeneOption === "Traits" ? genesByTrait : searchResults;
  const hasResults = displayResults && displayResults.length > 0;

  // --- JSX ---
  return (
    // Add 'details-loading' class to container when fetching details for cursor change etc.
    <div className={`gene-loci-container ${isModalOpen ? 'modal-open' : ''} ${loadingDetails ? 'details-loading' : ''}`}>
      <div className="content-wrapper">
        <h1 className="page-title">
          <i className="fas fa-search-location title-icon"></i>
          Search Gene Loci
        </h1>

        <div className="main-content-area">
          {/* --- Search Form Card --- */}
          <div className="search-form-card">
            <div className="search-form">
              <div className="form-header">
                <h2><i className="fas fa-filter"></i> Query Parameters</h2>
              </div>

              {/* Reference Genome */}
              <div className="form-group">
                <label htmlFor="referenceGenomeSelect">
                  <i className="fas fa-database"></i> Reference Genome
                  <span className="required-indicator" title="Required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    id="referenceGenomeSelect"
                    value={referenceGenome}
                    onChange={(e) => setReferenceGenome(e.target.value)}
                    disabled={loadingGenomes || loading} // Disable during initial load or search
                    className="styled-select"
                  >
                    {loadingGenomes ? (
                       <LoadingOption text="Loading Genomes..." />
                     ) : referenceGenomes.length === 0 ? (
                       <LoadingOption text="No Genomes Available" />
                     ) : (
                       <>
                         <option value="">-- Select Genome --</option>
                         {referenceGenomes.map((genome) => (
                           <option key={genome} value={genome}>{genome}</option>
                         ))}
                       </>
                     )}
                  </select>
                  <i className="fas fa-chevron-down select-icon"></i>
                </div>
              </div>

              {/* Search By Option */}
              <div className="form-group">
                <label htmlFor="searchBySelect"><i className="fas fa-search"></i> Search By</label>
                 <div className="select-wrapper">
                   <select
                     id="searchBySelect"
                     value={selectedGeneOption}
                     onChange={(e) => setSelectedGeneOption(e.target.value)}
                     disabled={loading} // Disable during search
                     className="styled-select"
                   >
                      <option value="Gene name/symbol/function">Gene Name/Symbol/Function</option>
                      <option value="GO Term">GO Term</option>
                      <option value="Contig and Region">Contig and Region</option>
                      <option value="Sequence">Sequence</option>
                      <option value="SNP positions list">SNP Positions List</option>
                      <option value="Gene set">Gene Set</option>
                      <option value="Traits">Traits</option>
                   </select>
                   <i className="fas fa-chevron-down select-icon"></i>
                 </div>
              </div>

             {/* Conditional Input: Traits */}
             <FormInputSection isVisible={selectedGeneOption === 'Traits'}>
                <div className="form-group">
                    <label htmlFor="traitSelect">
                        <i className="fas fa-tag"></i> Select Trait
                        <span className="required-indicator" title="Required">*</span>
                    </label>
                    <div className="select-wrapper">
                        <select
                            id="traitSelect"
                            value={selectedTrait}
                            onChange={(e) => setSelectedTrait(e.target.value)}
                            disabled={loadingTraits || loading} // Disable during trait load or search
                            className="styled-select"
                        >
                            {loadingTraits ? ( <LoadingOption text="Loading Traits..." /> ) : (
                                <>
                                    <option value="">-- Select Trait --</option>
                                    {traitsList.length > 0 ? (
                                        traitsList.map((trait) => (
                                            <option key={trait.traitName} value={trait.traitName}>
                                                {trait.traitName} ({trait.category || 'Uncategorized'})
                                            </option>
                                        ))
                                    ) : ( <option disabled>No traits loaded</option> )}
                                </>
                            )}
                        </select>
                         <i className="fas fa-chevron-down select-icon"></i>
                    </div>
                </div>
             </FormInputSection>

              {/* Conditional Input: Gene Name / Other Text Inputs */}
             <FormInputSection isVisible={!["Traits", "Contig and Region", "SNP positions list"].includes(selectedGeneOption)}>
                <div className="form-group">
                     <label htmlFor="geneNameInput">
                       <i className="fas fa-dna"></i>
                       {/* Dynamic label */}
                       { selectedGeneOption === "GO Term" ? "Enter GO Term" :
                        selectedGeneOption === "Sequence" ? "Enter Sequence" :
                        selectedGeneOption === "Gene set" ? "Enter Gene Set Name/ID" :
                        "Gene Name / Symbol / Function" }
                       <span className="required-indicator" title="Required">*</span>
                     </label>
                     <div className="input-with-icon">
                         <input
                             id="geneNameInput"
                             type="text"
                             value={selectedGeneName}
                             onChange={(e) => setSelectedGeneName(e.target.value)}
                             onKeyDown={handleKeyDown}
                             placeholder={`Enter ${selectedGeneOption}...`}
                             className="search-input"
                             disabled={loading} // Disable during search
                             aria-required="true"
                         />
                          <i className="fas fa-keyboard input-icon"></i>
                     </div>
                 </div>

                 {/* Search Type (only relevant for some text-based searches) */}
                 <FormInputSection isVisible={selectedGeneOption === "Gene name/symbol/function"}>
                     <div className="form-group">
                         <label htmlFor="searchTypeSelect"><i className="fas fa-search-plus"></i> Match Type</label>
                          <div className="select-wrapper">
                             <select
                                 id="searchTypeSelect"
                                 value={searchType}
                                 onChange={(e) => setSearchType(e.target.value)}
                                 disabled={loading} // Disable during search
                                 className="styled-select"
                             >
                                 <option value="substring">Substring</option>
                                 <option value="whole-word">Whole Word</option>
                                 <option value="exact">Exact Match</option>
                                 <option value="regex">Regular Expression</option>
                             </select>
                             <i className="fas fa-chevron-down select-icon"></i>
                          </div>
                     </div>
                 </FormInputSection>
             </FormInputSection>

              {/* Add placeholders/inputs for other search types here */}

              {/* Error Message Display */}
              {errorMessage && (
                <div className="error-message">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="form-actions">
                 <button
                    type="button"
                    className="secondary-btn clear-btn"
                    onClick={handleReset}
                    disabled={loading || loadingDetails} // Disable if main search or details fetch is running
                 >
                     <i className="fas fa-eraser"></i> Clear Form
                 </button>
                <button
                  type="button"
                  className="primary-btn search-btn"
                  onClick={handleSearch}
                  disabled={loading || loadingGenomes || loadingDetails} // Disable if loading genomes, searching, or fetching details
                >
                  {loading ? ( <> <span className="spinner small-spinner"></span> Searching... </> )
                   : ( <> <i className="fas fa-search"></i> Search </> )}
                </button>
              </div>
            </div>
          </div> {/* End search-form-card */}

          {/* --- Results Card --- */}
          {showResultsArea && (
            <div className="results-card">
              <div className="results-section">
                 <div
                    className="results-area-header"
                    onClick={() => toggleSection('resultsTable')}
                    role="button"
                    aria-expanded={expandedSections.resultsTable}
                 >
                    <h2>
                      <i className={`fas fa-chevron-${expandedSections.resultsTable ? 'down' : 'right'} collapse-icon`}></i>
                      <i className="fas fa-poll results-icon"></i> Search Results
                    </h2>
                    {/* Show count only when not loading main search and results exist */}
                    {!loading && hasResults && (
                        <span className="results-count-badge">
                            {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found
                        </span>
                    )}
                    {/* Show loading indicator for details fetch here if desired */}
                    {loadingDetails && (
                        <span className="details-loading-indicator">
                            <span className="spinner small-spinner"></span> Loading Details...
                        </span>
                    )}
                 </div>

                  {/* Collapsible Content Container */}
                  <div className={`results-content-container ${expandedSections.resultsTable ? 'expanded' : 'collapsed'}`}>
                      {loading ? ( // Loading state for main search
                          <div className="loading-state"> <span className="spinner"></span> <span>Loading results...</span> </div>
                      ) : !hasResults ? ( // No results state
                          <div className="no-results-state"> <i className="fas fa-info-circle no-results-icon"></i> <h3>No Results</h3> <p>Try adjusting search parameters.</p> </div>
                      ) : (
                          <>
                              {/* Query Details Sub-section */}
                              <div className="query-details-subsection">
                                 <div
                                    className="subsection-header"
                                    onClick={() => toggleSection('queryDetails')}
                                    role="button"
                                    aria-expanded={expandedSections.queryDetails}
                                 >
                                     <h3> <i className={`fas fa-chevron-${expandedSections.queryDetails ? 'down' : 'right'} collapse-icon small-icon`}></i> <i className="fas fa-info-circle"></i> Query Summary </h3>
                                 </div>
                                 <div className={`details-content ${expandedSections.queryDetails ? 'expanded' : 'collapsed'}`}>
                                     <p><strong>Genome:</strong> {referenceGenome || "N/A"}</p>
                                     <p><strong>Searched By:</strong> {selectedGeneOption}
                                       {selectedGeneOption === "Traits" && ` (${selectedTrait || "N/A"})`}
                                       {selectedGeneOption !== "Traits" && selectedGeneName && ` ("${selectedGeneName}")`}
                                       {(selectedGeneOption === "Gene name/symbol/function" && !selectedGeneName) && ` (No term entered)`}
                                       {selectedGeneOption === "Gene name/symbol/function" && selectedGeneName && ` [${searchType}]`}
                                     </p>
                                     {selectedGeneOption === "Traits" && traitDetails && (
                                         <div className="trait-details-summary"> <p><strong>Trait Description:</strong> {traitDetails.description || "N/A"}</p> </div>
                                     )}
                                 </div>
                              </div>

                              {/* Results Table Sub-section */}
                              <div className="results-table-subsection">
                                  <div className="subsection-header static-header">
                                     <h3> <i className="fas fa-table"></i> {selectedGeneOption === "Traits" ? "Associated Genes" : "Matching Features"} </h3>
                                  </div>
                                  <div className="table-responsive-wrapper">
                                      <table className="results-table">
                                          <thead>
                                              <tr>
                                                  <th>Gene</th><th>Reference</th><th>Location</th><th>Strand</th><th>Description / Function</th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {displayResults.map((item) => (
                                                  <tr key={item._id || item.geneName}>
                                                      <td data-label="Gene:">
                                                         <div className="gene-cell">
                                                            <span
                                                               className={`gene-name clickable ${loadingDetails ? 'disabled' : ''}`} // Disable click visual/logic while loading details
                                                               onClick={() => !loadingDetails && handleGeneClick(item)} // Prevent click when loading
                                                               role="button"
                                                               tabIndex={loadingDetails ? -1 : 0} // Remove from tab order when loading
                                                               onKeyDown={(e) => { if (!loadingDetails && (e.key === 'Enter' || e.key === ' ')) handleGeneClick(item);}}
                                                               aria-disabled={loadingDetails}
                                                             >
                                                               {item.geneName}
                                                             </span>
                                                            {item.geneSymbol && ( <span className="gene-symbol">({item.geneSymbol})</span> )}
                                                          </div>
                                                      </td>
                                                      <td data-label="Reference:">{item.referenceGenome}</td>
                                                      <td data-label="Location:">{item.contig || 'N/A'}</td>
                                                      <td data-label="Strand:"> <span className={`strand-badge ${item.strand === '+' ? 'positive' : 'negative'}`}> {item.strand || '?'} </span> </td>
                                                      <td data-label="Description:">
                                                          <div className="description-cell">
                                                             {item.description || "No description"}
                                                             {item.function && ( <div className="gene-function-summary"> <strong>Function:</strong> {item.function} </div> )}
                                                          </div>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                  </div>

                                  {/* Basic Pagination Placeholder */}
                                  {hasResults && displayResults.length > 10 && (
                                      <div className="table-footer">
                                          <div className="pagination-controls">
                                              <button className="pagination-btn" disabled> <i className="fas fa-chevron-left"></i> Prev </button>
                                              <span className="page-info">Page 1 of 1</span>
                                              <button className="pagination-btn" disabled> Next <i className="fas fa-chevron-right"></i> </button>
                                          </div>
                                          <div className="results-per-page">
                                              <label htmlFor="resultsPerPage">Show:</label>
                                              <select id="resultsPerPage" className="page-select" disabled> <option>10</option> <option>25</option> <option>50</option> </select>
                                              <span> per page</span>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </>
                      )}
                  </div> {/* End results-content-container */}
              </div> {/* End results-section */}
            </div> // End results-card
          )}
        </div> {/* End main-content-area */}
      </div> {/* End content-wrapper */}

      {/* --- Render Modal --- */}
      {isModalOpen && (
        <GeneDetailModal
          geneData={selectedGeneData}
          onClose={handleCloseModal}
        />
      )}

    </div> // End gene-loci-container
  );
};

export default GeneLoci;