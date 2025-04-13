// GeneLoci.js
import React, { useState, useEffect, useCallback, useMemo } from "react";
// Import API functions
import {
    fetchTraits,
    fetchReferenceGenomes,
    fetchFeaturesByGeneName,
    fetchGenesByTrait,
    fetchGeneDetailsByNameAndGenome
    // Import other needed API functions like searchBySnpList etc. when implemented
} from "../api"; // Adjust path if necessary
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import GeneDetailModal from '../components/GeneDetailModal'; // Adjust path if necessary
import "./GeneLoci.css"; // Adjust path if necessary
// Import Icons if not globally available via Font Awesome CSS
import {
    FaSearchLocation, FaFilter, FaDatabase, FaSearch, FaTag, FaDna, FaSearchPlus,
    FaKeyboard, FaChevronDown, FaExclamationTriangle, FaEraser, FaChevronRight,
    FaChevronLeft, FaPoll, FaTable, FaInfoCircle, FaFolderOpen
} from 'react-icons/fa';


// Helper component for loading indicators inside dropdowns
const LoadingOption = ({ text = "Loading..." }) => (
    <option disabled value="">{text}</option>
);

// Helper component for cleaner conditional rendering in form
const FormInputSection = ({ isVisible, children }) => {
    return isVisible ? <>{children}</> : null;
};

const GeneLoci = () => {
    const { isAuthenticated } = useAuth(); // Get auth status

    // --- State Variables ---
    const [selectedSearchByOption, setSelectedSearchByOption] = useState("Gene name/symbol/function");

    // States for different input types
    const [searchInputValue, setSearchInputValue] = useState("");
    const [searchType, setSearchType] = useState("substring");

    const [traitsList, setTraitsList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTrait, setSelectedTrait] = useState("");
    const [loadingTraits, setLoadingTraits] = useState(false);
    const [traitDetails, setTraitDetails] = useState(null); // Still needed for Trait Description

    const [snpListInput, setSnpListInput] = useState("");
    const [locusListInput, setLocusListInput] = useState("");

    // Reference Genome state
    const [referenceGenomes, setReferenceGenomes] = useState([]);
    const [referenceGenome, setReferenceGenome] = useState("");
    const [loadingGenomes, setLoadingGenomes] = useState(true);

    // Results state
    const [searchResults, setSearchResults] = useState([]);
    const [genesByTrait, setGenesByTrait] = useState([]);

    // General UI state
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showResultsArea, setShowResultsArea] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGeneData, setSelectedGeneData] = useState(null);
    const [expandedSections, setExpandedSections] = useState({ queryDetails: true, resultsTable: true }); // Keep summary open by default


    // --- Data Fetching Effects ---
    // Fetch Reference Genomes on Mount
    useEffect(() => {
        const loadGenomes = async () => {
            setLoadingGenomes(true); setErrorMessage("");
            try {
                const genomes = await fetchReferenceGenomes();
                setReferenceGenomes(genomes || []);
                if (genomes && genomes.length > 0) setReferenceGenome(genomes[0]);
            } catch (error) { setErrorMessage("Could not load reference genomes."); console.error(error); }
            finally { setLoadingGenomes(false); }
        };
        loadGenomes();
    }, []);

    // Fetch Full Traits List only when 'Traits' option is selected
    useEffect(() => {
        if (selectedSearchByOption === "Traits") {
            const loadTraits = async () => {
                setLoadingTraits(true); setTraitsList([]); setErrorMessage("");
                setSelectedCategory(""); setSelectedTrait(""); setTraitDetails(null);
                try {
                    const traits = await fetchTraits();
                    setTraitsList(traits || []);
                } catch (error) { setErrorMessage("Could not load traits list."); setTraitsList([]); console.error(error); }
                finally { setLoadingTraits(false); }
            };
            loadTraits();
        } else {
            // Clear trait state if switching away
            setSelectedCategory(""); setSelectedTrait(""); setTraitDetails(null); setTraitsList([]);
        }
    }, [selectedSearchByOption]); // Dependency: selectedSearchByOption


    // --- Derived State for Trait Dropdowns (Memoized) ---
    const traitCategories = useMemo(() => {
        if (!traitsList || traitsList.length === 0) return [];
        const categories = new Set(traitsList.map(trait => trait.category || 'Uncategorized'));
        return Array.from(categories).sort();
    }, [traitsList]);

    const filteredTraitNames = useMemo(() => {
        if (!selectedCategory || !traitsList || traitsList.length === 0) return [];
        return traitsList
            .filter(trait => (trait.category || 'Uncategorized') === selectedCategory)
            .map(trait => trait.traitName) // Extract just the names
            .sort();
    }, [selectedCategory, traitsList]);


    // --- Event Handlers ---
    const handleReset = () => {
        setSelectedSearchByOption("Gene name/symbol/function");
        setSelectedCategory("");
        setSelectedTrait("");
        setSearchInputValue("");
        setSnpListInput("");
        setLocusListInput("");
        setSearchType("substring");
        setSearchResults([]);
        setGenesByTrait([]);
        setTraitDetails(null);
        setErrorMessage("");
        setLoading(false);
        setLoadingDetails(false);
        setShowResultsArea(false);
        setIsModalOpen(false);
        setSelectedGeneData(null);
        setExpandedSections({ queryDetails: true, resultsTable: true }); // Keep open
        // Optionally reset reference genome
        // setReferenceGenome(referenceGenomes.length > 0 ? referenceGenomes[0] : "");
    };

     // Handler for category selection
     const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
        setSelectedTrait(""); // Reset trait name when category changes
        setTraitDetails(null); // Clear details as well
     };

    // Handler for trait name selection
    const handleTraitNameChange = (e) => {
        const traitName = e.target.value;
        setSelectedTrait(traitName);
         // Find and set details for the selected trait immediately (optional display in form)
        const detail = traitsList.find(t => t.traitName === traitName);
        setTraitDetails(detail || null);
    };

    // Update search input value
    const handleSearchInputChange = (e) => { setSearchInputValue(e.target.value); };
    // Update SNP list input
    const handleSnpListChange = (e) => { setSnpListInput(e.target.value); };
    // Update Locus list input
    const handleLocusListChange = (e) => { setLocusListInput(e.target.value); };


    // Main Search Handler
    const handleSearch = useCallback(async () => {
        let isValid = true;
        let currentSearchTerm = "";
        setErrorMessage(""); // Clear previous errors before validation

        if (!referenceGenome) { setErrorMessage("Please select a Reference Genome."); isValid = false; }

        // Validation based on selected search type
        switch(selectedSearchByOption) {
            case "Traits":
                if (!selectedCategory) { setErrorMessage("Please select a Trait Category."); isValid = false; }
                else if (!selectedTrait) { setErrorMessage("Please select a Trait Name."); isValid = false; }
                break;
            case "Gene name/symbol/function":
            case "GO Term":
            case "Sequence": // Add validation for sequence format if needed
            case "Gene set":
                currentSearchTerm = searchInputValue.trim();
                if (!currentSearchTerm) { setErrorMessage(`Please enter a value for '${selectedSearchByOption}'.`); isValid = false; }
                break;
            case "SNP positions list":
                 if (!isAuthenticated) { setErrorMessage("Login required for SNP list search."); isValid = false; break; }
                 currentSearchTerm = snpListInput.trim();
                 if (!currentSearchTerm) { setErrorMessage("SNP List cannot be empty."); isValid = false; }
                 // TODO: Add validation for SNP list format if needed
                 break;
            case "Locus list":
                 if (!isAuthenticated) { setErrorMessage("Login required for Locus list search."); isValid = false; break; }
                 currentSearchTerm = locusListInput.trim();
                 if (!currentSearchTerm) { setErrorMessage("Locus List cannot be empty."); isValid = false; }
                  // TODO: Add validation for Locus list format if needed
                   break;
            case "Contig and Region": // Explicitly handle this case if kept in dropdown
                 setErrorMessage("Search by Contig and Region is not implemented in this search form."); isValid = false;
                 break;
            default:
                isValid = false;
                setErrorMessage("Invalid search type selected.");
        }


        if (!isValid) return;

        setLoading(true); setShowResultsArea(true);
        setSearchResults([]); setGenesByTrait([]); // Clear previous results specific to type
        // Keep traitDetails if already set
        setExpandedSections(prev => ({ ...prev, queryDetails: true, resultsTable: true })); // Keep sections open

        try {
            // Fetch logic based on selected option
             if (selectedSearchByOption === "Traits") {
                 const genesForTrait = await fetchGenesByTrait(selectedTrait, referenceGenome);
                 setGenesByTrait(genesForTrait);
                 // Trait details already set by handleTraitNameChange
             } else if (["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedSearchByOption)) {
                  const results = await fetchFeaturesByGeneName(currentSearchTerm, referenceGenome, searchType);
                  setSearchResults(results);
              } else if (selectedSearchByOption === "SNP positions list") {
                  console.warn("API call for SNP List search not implemented yet.");
                  // const results = await searchBySnpList(currentSearchTerm, referenceGenome);
                  setSearchResults([]); // Placeholder
              } else if (selectedSearchByOption === "Locus list") {
                   console.warn("API call for Locus List search not implemented yet.");
                   // const results = await searchByLocusList(currentSearchTerm, referenceGenome);
                   setSearchResults([]); // Placeholder
               }
            // Handle other cases if needed
        } catch (error) {
            setErrorMessage(error?.message || "An error occurred during the search.");
            console.error("Search error:", error);
            setSearchResults([]); setGenesByTrait([]);
        } finally {
            setLoading(false);
        }
    // Update dependencies for useCallback
    }, [referenceGenome, selectedSearchByOption, selectedCategory, selectedTrait, searchInputValue, searchType, traitsList, isAuthenticated, snpListInput, locusListInput]);


    // --- Modal Trigger Handler ---
    const handleGeneClick = useCallback(async (geneItem) => {
        if (loadingDetails || !geneItem?.geneName || !geneItem?.referenceGenome) return; // Add checks
        setLoadingDetails(true); setErrorMessage("");
        console.log(`Workspaceing details for: ${geneItem.geneName} (${geneItem.referenceGenome})`);
        try {
            const detailedData = await fetchGeneDetailsByNameAndGenome(geneItem.geneName, geneItem.referenceGenome);
            if (detailedData) { setSelectedGeneData(detailedData); setIsModalOpen(true); }
            else { setErrorMessage(`Could not find complete details for ${geneItem.geneName}.`); setSelectedGeneData(null); setIsModalOpen(false); }
        } catch (error) {
            console.error("Error fetching gene details:", error);
            setErrorMessage(error.message || "Failed to load gene details.");
            setSelectedGeneData(null); setIsModalOpen(false);
        } finally { setLoadingDetails(false); }
    }, [loadingDetails]);

    // Modal Close Handler
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedGeneData(null); };
    // Section Toggle Handler
    const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };
    // Enter Key Handler
    const handleKeyDown = (e) => { if (e.key === 'Enter' && ["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedSearchByOption)) handleSearch(); }; // Only trigger search on Enter for text inputs

    // Determine display data
    const displayResults = selectedSearchByOption === "Traits" ? genesByTrait : searchResults;
    const hasResults = Array.isArray(displayResults) && displayResults.length > 0;

    return (
        <div className={`gene-loci-container ${isModalOpen ? 'modal-open' : ''} ${loadingDetails ? 'details-loading' : ''}`}>
            <div className="content-wrapper">
                <h1 className="page-title"> <FaSearchLocation className="title-icon" /> Search Gene Features </h1>
                <div className="main-content-area">
                    {/* --- Search Form Card --- */}
                    <div className="search-form-card">
                        <div className="search-form">
                            <div className="form-header"><h2><FaFilter /> Query Parameters</h2></div>

                            {/* Reference Genome */}
                            <div className="form-group">
                                <label htmlFor="referenceGenomeSelect"> <FaDatabase /> Reference Genome <span className="required-indicator" title="Required">*</span> </label>
                                <div className="select-wrapper">
                                    <select id="referenceGenomeSelect" value={referenceGenome} onChange={(e) => setReferenceGenome(e.target.value)} disabled={loadingGenomes || loading} className="styled-select" required >
                                        {loadingGenomes ? ( <LoadingOption /> ) : referenceGenomes.length === 0 ? ( <LoadingOption text="No Genomes Available" /> ) : ( <> <option value="">-- Select Genome --</option> {referenceGenomes.map(g => (<option key={g} value={g}>{g}</option>))} </> )}
                                    </select>
                                    <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                </div>
                            </div>

                            {/* Search By Option */}
                            <div className="form-group">
                                <label htmlFor="searchBySelect"><FaSearch /> Search By</label>
                                <div className="select-wrapper">
                                   <select id="searchBySelect" value={selectedSearchByOption} onChange={(e) => setSelectedSearchByOption(e.target.value)} disabled={loading} className="styled-select">
                                        <option value="Gene name/symbol/function">Gene Name/Symbol/Function</option>
                                        <option value="GO Term">GO Term</option>
                                        {/* <option value="Contig and Region">Contig and Region</option> */}
                                        <option value="Sequence">Sequence</option>
                                        <option value="Traits">Traits</option>
                                        <option value="Gene set">Gene Set</option>
                                        <option value="SNP positions list" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>SNP Positions List { !isAuthenticated ? '(Login Required)' : ''}</option>
                                        <option value="Locus list" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>Locus List { !isAuthenticated ? '(Login Required)' : ''}</option>
                                   </select>
                                   <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                 </div>
                            </div>

                            {/* Conditional Input: Traits */}
                            <FormInputSection isVisible={selectedSearchByOption === 'Traits'}>
                                <div className="form-row"> {/* Using form-row for side-by-side layout */}
                                    <div className="form-group">
                                        <label htmlFor="traitCategorySelect"> <FaFolderOpen /> Trait Category <span className="required-indicator" title="Required">*</span> </label>
                                        <div className="select-wrapper">
                                            <select id="traitCategorySelect" value={selectedCategory} onChange={handleCategoryChange} disabled={loadingTraits || loading || traitsList.length === 0} className="styled-select" required={selectedSearchByOption === 'Traits'}>
                                                <option value="">-- Select Category --</option>
                                                {loadingTraits ? ( <LoadingOption text="Loading Categories..." /> ) : (
                                                    traitCategories.length > 0 ? ( traitCategories.map((category) => ( <option key={category} value={category}> {category} </option> )) )
                                                    : ( <option disabled value="">No categories found</option> )
                                                )}
                                            </select>
                                             <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="traitNameSelect"> <FaTag /> Trait Name <span className="required-indicator" title="Required">*</span> </label>
                                        <div className="select-wrapper">
                                            <select id="traitNameSelect" value={selectedTrait} onChange={handleTraitNameChange} disabled={!selectedCategory || loadingTraits || loading || filteredTraitNames.length === 0} className="styled-select" required={selectedSearchByOption === 'Traits'}>
                                                <option value="">-- Select Trait Name --</option>
                                                {selectedCategory && loadingTraits ? ( <LoadingOption text="Loading Traits..." /> )
                                                 : selectedCategory && filteredTraitNames.length > 0 ? ( filteredTraitNames.map((traitName) => ( <option key={traitName} value={traitName}> {traitName} </option> )) )
                                                 : selectedCategory ? ( <option disabled value="">No traits in category</option> )
                                                 : ( <option disabled value="">Select category first</option> )}
                                            </select>
                                             <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                        </div>
                                        {traitDetails?.description && <small className="trait-description-preview">Desc: {traitDetails.description.substring(0, 50)}...</small>}
                                    </div>
                                </div>
                             </FormInputSection>

                             {/* Conditional Input: Gene Name / Other Text Inputs */}
                             <FormInputSection isVisible={["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedSearchByOption)}>
                                <div className="form-group"> {/* Full width */}
                                     <label htmlFor="searchInput"> <FaDna /> {selectedSearchByOption === "GO Term" ? "Enter GO Term" : selectedSearchByOption === "Sequence" ? "Enter Sequence" : selectedSearchByOption === "Gene set" ? "Enter Gene Set Name/ID" : "Gene Name / Symbol / Function" } <span className="required-indicator" title="Required">*</span> </label>
                                     <div className="input-with-icon">
                                         <input id="searchInput" type={selectedSearchByOption === "Sequence" ? "textarea" : "text"} rows={selectedSearchByOption === "Sequence" ? 3 : undefined} value={searchInputValue} onChange={handleSearchInputChange} onKeyDown={handleKeyDown} placeholder={`Enter ${selectedSearchByOption}...`} className="search-input" disabled={loading} aria-required="true" required={["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedSearchByOption)}/>
                                          <i className="fas fa-keyboard input-icon"><FaKeyboard/></i>
                                     </div>
                                 </div>
                                 {/* Match Type for Gene Name Search */}
                                 <FormInputSection isVisible={selectedSearchByOption === "Gene name/symbol/function"}>
                                     <div className="form-group">
                                         <label htmlFor="searchTypeSelect"><FaSearchPlus /> Match Type</label>
                                          <div className="select-wrapper">
                                             <select id="searchTypeSelect" value={searchType} onChange={(e) => setSearchType(e.target.value)} disabled={loading} className="styled-select"> <option value="substring">Substring</option> <option value="whole-word">Whole Word</option> <option value="exact">Exact Match</option> <option value="regex">Regular Expression</option> </select>
                                             <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                          </div>
                                     </div>
                                 </FormInputSection>
                             </FormInputSection>

                            {/* Conditional Input: SNP List */}
                            <FormInputSection isVisible={selectedSearchByOption === 'SNP positions list'}>
                                <div className="form-group">
                                    <label htmlFor="snpList">SNP List (one per line) <span className="required-indicator" title="Required">*</span></label>
                                    <textarea id="snpList" name="snpList" rows="5" placeholder="Enter SNP IDs..." value={snpListInput} onChange={handleSnpListChange} disabled={!isAuthenticated || loading} required className={!isAuthenticated ? 'disabled-textarea' : ''}></textarea>
                                    {!isAuthenticated && <p className="auth-required-note">Note: Login required.</p>}
                                </div>
                            </FormInputSection>

                            {/* Conditional Input: Locus List */}
                            <FormInputSection isVisible={selectedSearchByOption === 'Locus list'}>
                                <div className="form-group">
                                    <label htmlFor="locusList">Locus List (one per line) <span className="required-indicator" title="Required">*</span></label>
                                    <textarea id="locusList" name="locusList" rows="5" placeholder="Enter Locus IDs (e.g., LOC_Os...)" value={locusListInput} onChange={handleLocusListChange} disabled={!isAuthenticated || loading} required className={!isAuthenticated ? 'disabled-textarea' : ''}></textarea>
                                    {!isAuthenticated && <p className="auth-required-note">Note: Login required.</p>}
                                </div>
                            </FormInputSection>

                            {/* Error Message Display */}
                            {errorMessage && ( <div className="error-message"> <FaExclamationTriangle /> <span>{errorMessage}</span> </div> )}

                            {/* Action Buttons */}
                            <div className="form-actions">
                                <button type="button" className="secondary-btn clear-btn" onClick={handleReset} disabled={loading || loadingDetails}> <FaEraser /> Clear Form </button>
                                <button type="button" className="primary-btn search-btn" onClick={handleSearch} disabled={loading || loadingGenomes || loadingDetails || loadingTraits}>
                                    {loading ? ( <> <span className="spinner small-spinner"></span> Searching... </> ) : ( <> <FaSearch /> Search </> )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- Results Card --- */}
                    {showResultsArea && (
                        <div className="results-card">
                            <div className="results-section">
                                {/* Results Header */}
                                <div className="results-area-header" onClick={() => toggleSection('resultsTable')} role="button" aria-expanded={expandedSections.resultsTable}>
                                    <h2> <i className={`fas fa-chevron-${expandedSections.resultsTable ? 'down' : 'right'} collapse-icon`}> <FaChevronRight/> </i> <FaPoll /> Search Results </h2>
                                    {!loading && hasResults && ( <span className="results-count-badge"> {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found </span> )}
                                    {loadingDetails && ( <span className="details-loading-indicator"> <span className="spinner small-spinner"></span> Loading Details... </span> )}
                                </div>
                                {/* Results Content Container */}
                                <div className={`results-content-container ${expandedSections.resultsTable ? 'expanded' : 'collapsed'}`}>
                                     {loading ? ( <div className="loading-state"> <span className="spinner"></span> <span>Loading results...</span> </div> )
                                     : !hasResults ? ( <div className="no-results-state"> <FaInfoCircle className="no-results-icon" /> <h3>No Results</h3> <p>Try adjusting search parameters.</p> </div> )
                                     : ( // HAS RESULTS
                                         <>
                                             {/* --- Query Summary (NOW ALWAYS SHOWN if results exist) --- */}
                                             <div className="query-details-subsection">
                                                  <div className="subsection-header" onClick={() => toggleSection('queryDetails')} role="button" aria-expanded={expandedSections.queryDetails}>
                                                      <h3> <i className={`fas fa-chevron-${expandedSections.queryDetails ? 'down' : 'right'} collapse-icon small-icon`}> <FaChevronRight/> </i> <FaInfoCircle /> Query Summary </h3>
                                                  </div>
                                                  <div className={`details-content ${expandedSections.queryDetails ? 'expanded' : 'collapsed'}`}>
                                                      <p><strong>Genome:</strong> {referenceGenome || "N/A"}</p>
                                                      <p>
                                                          <strong>Searched By:</strong> {selectedSearchByOption}
                                                          {/* Display specific term/trait/list type */}
                                                          {selectedSearchByOption === "Traits" && ` (${selectedTrait || "N/A"})`}
                                                          {["Gene name/symbol/function", "GO Term", "Sequence", "Gene set"].includes(selectedSearchByOption) && searchInputValue && ` ("${searchInputValue}")`}
                                                          {selectedSearchByOption === "SNP positions list" && ` (SNP List Provided)`}
                                                          {selectedSearchByOption === "Locus list" && ` (Locus List Provided)`}
                                                          {/* Add Match type if applicable */}
                                                          {(selectedSearchByOption === "Gene name/symbol/function" && searchInputValue) && ` [${searchType}]`}
                                                      </p>
                                                      {/* Only show trait description if it was a trait search */}
                                                      {selectedSearchByOption === "Traits" && traitDetails?.description && (
                                                          <div className="trait-details-summary"> <p><strong>Trait Description:</strong> {traitDetails.description}</p> </div>
                                                      )}
                                                  </div>
                                             </div>
                                             {/* --- End Query Summary --- */}

                                             {/* Results Table Sub-section */}
                                             <div className="results-table-subsection">
                                                 <div className="subsection-header static-header"> <h3> <FaTable /> {selectedSearchByOption === "Traits" ? "Associated Genes" : "Matching Features"} </h3> </div>
                                                 <div className="table-responsive-wrapper">
                                                     <table className="results-table">
                                                         <thead> <tr> <th>Gene</th><th>Reference</th><th>Location</th><th>Strand</th><th>Description / Function</th> </tr> </thead>
                                                         <tbody>
                                                             {displayResults.map((item) => (
                                                                 <tr key={item._id || item.geneName}>
                                                                     <td data-label="Gene:"> <div className="gene-cell"> <span className={`gene-name clickable ${loadingDetails ? 'disabled' : ''}`} onClick={() => !loadingDetails && handleGeneClick(item)} role="button" tabIndex={loadingDetails ? -1 : 0} onKeyDown={(e) => { if (!loadingDetails && (e.key === 'Enter' || e.key === ' ')) handleGeneClick(item);}} aria-disabled={loadingDetails}> {item.geneName} </span> {item.geneSymbol && ( <span className="gene-symbol">({item.geneSymbol})</span> )} </div> </td>
                                                                     <td data-label="Reference:">{item.referenceGenome}</td>
                                                                     <td data-label="Location:">{item.contig || 'N/A'}</td>
                                                                     <td data-label="Strand:"> <span className={`strand-badge ${item.strand === '+' ? 'positive' : 'negative'}`}> {item.strand || '?'} </span> </td>
                                                                     <td data-label="Description:"> <div className="description-cell"> {item.description || "No description"} {item.function && ( <div className="gene-function-summary"> <strong>Function:</strong> {item.function} </div> )} </div> </td>
                                                                 </tr>
                                                             ))}
                                                         </tbody>
                                                     </table>
                                                 </div>
                                                 {/* Pagination Placeholder */}
                                                 {hasResults && displayResults.length > 10 && ( <div className="table-footer"> {/* Pagination Controls */} </div> )}
                                             </div>
                                         </>
                                     )}
                                </div>
                            </div>
                        </div>
                    )}
                </div> {/* End main-content-area */}
            </div> {/* End content-wrapper */}

            {/* --- Render Modal --- */}
            {isModalOpen && ( <GeneDetailModal geneData={selectedGeneData} onClose={handleCloseModal} /> )}
        </div> // End gene-loci-container
    );
};

export default GeneLoci;