// GeneLoci.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
// Import API functions
import {
    fetchTraits,
    fetchReferenceGenomes,
    fetchFeaturesByGeneName,         // Used for Annotation and Gene Name search
    fetchGenesByTrait,               // Used for Trait search
    fetchGeneDetailsByNameAndGenome, // Used for Modal
    fetchChromosomeRange,            // Used for Region search range display
    fetchChromosomes,                // Used for Region chromosome dropdown
    fetchFeaturesByRegion,          // <-- Import NEW function for Region search results
    searchFeaturesByText
} from "../api"; // Adjust path if necessary
import { useAuth } from '../context/AuthContext'; // Keep useAuth for potential future use
import GeneDetailModal from '../components/GeneDetailModal'; // Adjust path if necessary
import "./GeneLoci.css"; // Adjust path if necessary
// Import Icons
import {
    FaSearchLocation, FaFilter, FaDatabase, FaSearch, FaTag, FaDna, FaSearchPlus,
    FaKeyboard, FaChevronDown, FaExclamationTriangle, FaEraser, FaChevronRight,
    FaChevronLeft, FaPoll, FaTable, FaInfoCircle, FaFolderOpen, FaMapMarkedAlt // Added FaMapMarkedAlt
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
    const { isAuthenticated } = useAuth(); // Get auth status (keep for future use)

    // --- State Variables ---
    const [searchBy, setSearchBy] = useState("geneName"); // Renamed, default search type

    // State for Annotation/Gene Name search
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMethod, setSearchMethod] = useState("substring");

    // State for Trait search
    const [traitsList, setTraitsList] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedTrait, setSelectedTrait] = useState("");
    const [loadingTraits, setLoadingTraits] = useState(false);
    const [traitDetails, setTraitDetails] = useState(null);

    // State specific to Region search
    const [regionData, setRegionData] = useState({ chromosome: '', start: '', end: '' });
    const [chromosomeOptions, setChromosomeOptions] = useState([]);

    // Reference Genome state
    const [referenceGenomes, setReferenceGenomes] = useState([]);
    const [referenceGenome, setReferenceGenome] = useState("");

    // Combined loading state for initial dropdown fetches
    const [loadingOptions, setLoadingOptions] = useState({
        referenceGenomes: true,
        chromosomes: false // Only true when region is selected
    });
    // State for dropdown loading errors
    const [optionsError, setOptionsError] = useState('');

    // State for Chromosome Range specific loading/error
    const [chromosomeRange, setChromosomeRange] = useState({ minPosition: null, maxPosition: null });
    const [loadingRange, setLoadingRange] = useState(false);
    const [rangeError, setRangeError] = useState('');

    // Results & UI state
    const [results, setResults] = useState([]); // Combined results state
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [errorMessage, setErrorMessage] = useState(""); // Search specific errors
    const [showResultsArea, setShowResultsArea] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGeneData, setSelectedGeneData] = useState(null);
    const [expandedSections, setExpandedSections] = useState({ queryDetails: true, resultsTable: true });


    // --- Data Fetching Effects ---
    // Fetch Reference Genomes
    useEffect(() => {
        const loadGenomes = async () => {
            setLoadingOptions(prev => ({ ...prev, referenceGenomes: true })); setErrorMessage(""); setOptionsError('');
            try {
                const genomes = await fetchReferenceGenomes(); setReferenceGenomes(genomes || []);
                if (genomes && genomes.length > 0) setReferenceGenome(genomes[0]);
            } catch (error) { setOptionsError("Could not load reference genomes."); console.error(error); }
            finally { setLoadingOptions(prev => ({ ...prev, referenceGenomes: false })); }
        };
        loadGenomes();
    }, []);

    // Fetch Traits
    useEffect(() => {
        if (searchBy === "trait") {
            const loadTraits = async () => {
                setLoadingTraits(true); setTraitsList([]); setErrorMessage(""); setOptionsError('');
                setSelectedCategory(""); setSelectedTrait(""); setTraitDetails(null);
                try { const traits = await fetchTraits(); setTraitsList(traits || []); }
                catch (error) { setOptionsError("Could not load traits list."); setTraitsList([]); console.error(error); }
                finally { setLoadingTraits(false); }
            };
            loadTraits();
        } else { setSelectedCategory(""); setSelectedTrait(""); setTraitDetails(null); setTraitsList([]); setLoadingTraits(false); }
    }, [searchBy]);

     // Fetch Chromosomes
     useEffect(() => {
        if (searchBy === "region") {
            const loadChromosomes = async () => {
                setLoadingOptions(prev => ({ ...prev, chromosomes: true })); setErrorMessage(""); setOptionsError(''); setChromosomeOptions([]);
                try { const chroms = await fetchChromosomes(); setChromosomeOptions(Array.isArray(chroms) ? chroms : []); }
                catch (error) { setOptionsError("Could not load chromosomes."); console.error(error); }
                finally { setLoadingOptions(prev => ({ ...prev, chromosomes: false })); }
            };
            loadChromosomes();
        } else { setRegionData(prev => ({ ...prev, chromosome: '' })); setChromosomeOptions([]); setLoadingOptions(prev => ({ ...prev, chromosomes: false })); }
    }, [searchBy]);

    // Fetch Chromosome Range
    useEffect(() => {
        const getRange = async () => {
            if (searchBy === 'region' && referenceGenome && regionData.chromosome) {
                setLoadingRange(true); setRangeError(''); setChromosomeRange({ minPosition: null, maxPosition: null });
                try {
                    const rangeData = await fetchChromosomeRange(regionData.chromosome, referenceGenome);
                    setChromosomeRange(rangeData || { minPosition: null, maxPosition: null });
                    if (!rangeData || rangeData.minPosition === null) setRangeError(`No range data found.`);
                } catch (error) { setRangeError(`Failed to fetch range.`); }
                finally { setLoadingRange(false); }
            } else { setChromosomeRange({ minPosition: null, maxPosition: null }); setRangeError(''); setLoadingRange(false); }
        };
        getRange();
    }, [regionData.chromosome, referenceGenome, searchBy]);


    // --- Derived State ---
    const traitCategories = useMemo(() => {
        if (!traitsList || traitsList.length === 0) return [];
        const categories = new Set(traitsList.map(trait => trait.category || 'Uncategorized'));
        return Array.from(categories).sort();
    }, [traitsList]);

    const filteredTraitNames = useMemo(() => {
        if (!selectedCategory || !traitsList || traitsList.length === 0) return [];
        return traitsList.filter(trait => (trait.category || 'Uncategorized') === selectedCategory).map(trait => trait.traitName).sort();
    }, [selectedCategory, traitsList]);


    // --- Event Handlers ---
    const handleReset = () => {
        setSearchBy("geneName"); setSearchQuery(""); setSearchMethod("substring");
        setSelectedCategory(""); setSelectedTrait(""); setTraitDetails(null);
        setRegionData({ chromosome: '', start: '', end: '' });
        setResults([]); setErrorMessage(""); setLoading(false); setLoadingDetails(false);
        setShowResultsArea(false); setIsModalOpen(false); setSelectedGeneData(null);
        setExpandedSections({ queryDetails: true, resultsTable: true });
        setChromosomeRange({ minPosition: null, maxPosition: null }); setLoadingRange(false); setRangeError('');
        setOptionsError('');
    };

    const handleCategoryChange = (e) => { setSelectedCategory(e.target.value); setSelectedTrait(""); setTraitDetails(null); };
    const handleTraitNameChange = (e) => { const tn = e.target.value; setSelectedTrait(tn); setTraitDetails(traitsList.find(t => t.traitName === tn) || null); };
    const handleQueryInputChange = (e) => { setSearchQuery(e.target.value); };
    const handleRegionInputChange = (e) => { const { name, value } = e.target; setRegionData(prev => ({ ...prev, [name]: value })); };
    const handleSearchMethodChange = (e) => { setSearchMethod(e.target.value); };

    // Main Search Handler - Updated API Calls
    const handleSearch = useCallback(async () => {
        let isValid = true; setErrorMessage("");
        let alertMessage = "";

        if (!referenceGenome) { setErrorMessage("Please select a Reference Genome."); isValid = false; }

        switch(searchBy) {
            case "annotation": case "geneName":
                if (!searchQuery.trim()) { alertMessage = `Please enter search term.`; isValid = false; break; }
                isValid = true; break;
            case "trait":
                if (!selectedCategory) { alertMessage = "Please select Trait Category."; isValid = false; break; }
                if (!selectedTrait) { alertMessage = "Please select Trait Name."; isValid = false; break; }
                isValid = true; break;
            case "region":
                let regionValid = false;
                if (!regionData.start || !regionData.end) { alertMessage = "Position Start and Position End are required for Region search."; break; }
                const startPos = parseInt(regionData.start, 10); const endPos = parseInt(regionData.end, 10);
                if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) { alertMessage = "Invalid Start/End position provided."; break; }
                if (regionData.chromosome) {
                    if (chromosomeRange.minPosition !== null && startPos < chromosomeRange.minPosition) { alertMessage = `Start must be >= ${chromosomeRange.minPosition.toLocaleString()}.`; break; }
                    if (chromosomeRange.maxPosition !== null && endPos > chromosomeRange.maxPosition) { alertMessage = `End must be <= ${chromosomeRange.maxPosition.toLocaleString()}.`; break; }
                }
                regionValid = true; isValid = regionValid; break;
            default: isValid = false; alertMessage = "Invalid search type.";
        }

        if (!isValid) { alert(alertMessage || errorMessage || "Validation failed."); return; }

        setLoading(true); setShowResultsArea(true); setResults([]);
        setExpandedSections(prev => ({ ...prev, queryDetails: true, resultsTable: true }));

        try {
             let fetchedResults = [];
             if (searchBy === "trait") {
                 fetchedResults = await fetchGenesByTrait(selectedTrait, referenceGenome);
             } else if (searchBy === "annotation" || searchBy === "geneName") {
                  // Pass searchMethod (renamed from searchType)
                  // Pass searchBy to indicate if querying 'annotation' or 'geneName' field
                  fetchedResults = await searchFeaturesByText(searchQuery, referenceGenome, searchMethod, searchBy);
              } else if (searchBy === "region") {
                   // Call the new API function for region search
                   fetchedResults = await fetchFeaturesByRegion(
                       referenceGenome,
                       regionData.chromosome,
                       regionData.start,
                       regionData.end
                   );
               }
             setResults(fetchedResults || []);
        } catch (error) {
            setErrorMessage(error?.message || "An error occurred during the search.");
            console.error("Search error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    // Update dependencies
    }, [referenceGenome, searchBy, searchQuery, searchMethod, selectedCategory, selectedTrait, traitsList, regionData, chromosomeRange]);


    // --- Modal Handlers ---
    const handleGeneClick = useCallback(async (geneItem) => {
        if (loadingDetails || !geneItem?.geneName || !geneItem?.referenceGenome) return;
        setLoadingDetails(true); setErrorMessage("");
        try {
            const detailedData = await fetchGeneDetailsByNameAndGenome(geneItem.geneName, geneItem.referenceGenome);
            if (detailedData) { setSelectedGeneData(detailedData); setIsModalOpen(true); }
            else { setErrorMessage(`Could not find complete details for ${geneItem.geneName}.`); setSelectedGeneData(null); setIsModalOpen(false); }
        } catch (error) { console.error("Error fetching gene details:", error); setErrorMessage(error.message || "Failed to load gene details."); setSelectedGeneData(null); setIsModalOpen(false); }
        finally { setLoadingDetails(false); }
    }, [loadingDetails]);

    const handleCloseModal = () => { setIsModalOpen(false); setSelectedGeneData(null); };
    const toggleSection = (section) => { setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })); };
    const handleKeyDown = (e) => { if (e.key === 'Enter' && (searchBy === 'annotation' || searchBy === 'geneName')) handleSearch(); };

    // Determine display data
    const displayResults = results;
    const hasResults = Array.isArray(displayResults) && displayResults.length > 0;


    // --- Helper function to render options ---
    const renderOptions = (optionsArray) => {
         if (!Array.isArray(optionsArray) || optionsArray.length === 0) return null;
         const firstItem = optionsArray[0];
         if (typeof firstItem === 'string') {
             return optionsArray.map(option => ( <option key={option} value={option}>{option}</option> ));
         } else if (typeof firstItem === 'object' && firstItem !== null) {
             const keyProp = firstItem._id || firstItem.id || 'value';
             const labelProp = firstItem.name || firstItem.label || keyProp;
             return optionsArray.map((option, index) => {
                  if (!option || typeof option !== 'object') return null;
                  const keyValue = option[keyProp] !== undefined ? option[keyProp] : `opt-${index}`;
                  const labelValue = option[labelProp] !== undefined ? option[labelProp] : '-- Invalid Option --';
                  const valueValue = labelValue; // Using label as value
                  return ( <option key={keyValue} value={valueValue}> {labelValue} </option> );
             });
         }
         return <option disabled>Invalid options data</option>;
    };

    // Calculate if search button should be disabled based on loading states
    const isSearchDisabled = loading || loadingOptions.referenceGenomes || loadingDetails || loadingTraits || loadingOptions.chromosomes || loadingRange;


    return (
        <div className={`gene-loci-container ${isModalOpen ? 'modal-open' : ''} ${loadingDetails ? 'details-loading' : ''}`}>
            <div className="content-wrapper">
                <h1 className="page-title"> <FaSearchLocation className="title-icon" /> Search by Gene Loci </h1>
                <div className="main-content-area">
                    {/* --- Search Form Card --- */}
                    <div className="search-form-card">
                        <div className="search-form">
                            <div className="form-header"><h2><FaFilter /> Query Parameters</h2></div>

                            {/* Reference Genome */}
                            <div className="form-group">
                                <label htmlFor="referenceGenomeSelect"> <FaDatabase /> Reference Genome <span className="required-indicator">*</span> </label>
                                <div className="select-wrapper">
                                    <select id="referenceGenomeSelect" name="referenceGenome" value={referenceGenome} onChange={(e) => setReferenceGenome(e.target.value)} disabled={loadingOptions.referenceGenomes || loading} className="styled-select" required >
                                        {loadingOptions.referenceGenomes ? ( <LoadingOption /> ) : referenceGenomes.length === 0 ? ( <LoadingOption text="No Genomes Available" /> ) : ( <> <option value="">-- Select Genome --</option> {referenceGenomes.map(g => (<option key={g} value={g}>{g}</option>))} </> )}
                                    </select>
                                    <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                </div>
                            </div>

                            {/* Search By Option */}
                            <div className="form-group">
                                <label htmlFor="searchBySelect"><FaSearch /> Search By</label>
                                <div className="select-wrapper">
                                   <select id="searchBySelect" value={searchBy} onChange={(e) => setSearchBy(e.target.value)} disabled={loading} className="styled-select">
                                        {/* Simplified Options */}
                                        <option value="annotation">Annotation</option>
                                        <option value="geneName">Gene Name/Symbol/Function</option>
                                        <option value="trait">Trait</option>
                                        <option value="region">Region</option>
                                   </select>
                                   <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                 </div>
                            </div>

                            {/* --- Conditional Inputs --- */}

                            {/* == ANNOTATION or GENE NAME INPUTS == */}
                            <FormInputSection isVisible={searchBy === 'annotation' || searchBy === 'geneName'}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="searchQueryInput"> <FaKeyboard /> Search Query <span className="required-indicator">*</span> </label>
                                        <input id="searchQueryInput" type="text" value={searchQuery} onChange={handleQueryInputChange} onKeyDown={handleKeyDown} placeholder={`Enter ${searchBy === 'annotation' ? 'annotation keyword' : 'gene name/symbol'}...`} className="search-input" disabled={loading} required />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="searchMethodSelect"><FaSearchPlus /> Match Type</label>
                                         <div className="select-wrapper">
                                            <select id="searchMethodSelect" value={searchMethod} onChange={handleSearchMethodChange} disabled={loading} className="styled-select"> <option value="substring">Substring</option> <option value="whole-word">Whole Word</option> <option value="exact">Exact Match</option> <option value="regex">Regular Expression</option> </select>
                                            <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                         </div>
                                    </div>
                                </div>
                            </FormInputSection>

                            {/* == TRAIT INPUTS == */}
                            <FormInputSection isVisible={searchBy === 'trait'}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="traitCategorySelect"> <FaFolderOpen /> Trait Category <span className="required-indicator">*</span> </label>
                                        <div className="select-wrapper">
                                            <select id="traitCategorySelect" value={selectedCategory} onChange={handleCategoryChange} disabled={loadingTraits || loading || traitsList.length === 0} className="styled-select" required={searchBy === 'trait'}>
                                                <option value="">-- Select Category --</option>
                                                {loadingTraits ? ( <LoadingOption text="Loading..." /> ) : ( traitCategories.length > 0 ? ( traitCategories.map((category) => ( <option key={category} value={category}> {category} </option> )) ) : ( <option disabled value="">No categories</option> ) )}
                                            </select>
                                             <i className="fas fa-chevron-down select-icon"><FaChevronDown/></i>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="traitNameSelect"> <FaTag /> Trait Name <span className="required-indicator">*</span> </label>
                                        <div className="select-wrapper">
                                            <select id="traitNameSelect" value={selectedTrait} onChange={handleTraitNameChange} disabled={!selectedCategory || loadingTraits || loading || filteredTraitNames.length === 0} className="styled-select" required={searchBy === 'trait'}>
                                                <option value="">-- Select Trait Name --</option>
                                                {selectedCategory && loadingTraits ? ( <LoadingOption text="Loading..." /> )
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

                             {/* == REGION INPUTS == */}
                            <FormInputSection isVisible={searchBy === 'region'}>
                                <>
                                    <div className="form-row form-row-three-col">
                                        <div className="form-group">
                                            <label htmlFor="regionChromosome">Chromosome</label>
                                            <select id="regionChromosome" name="chromosome" value={regionData.chromosome} onChange={handleRegionInputChange} disabled={loadingOptions.chromosomes || !!optionsError || loading} >
                                                {loadingOptions.chromosomes ? ( <LoadingOption text="Loading..." /> )
                                                : optionsError && chromosomeOptions.length === 0 ? ( <option value="" disabled>Error</option> ) // Simplified error
                                                : ( <> <option value="">Any Chromosome</option> {renderOptions(chromosomeOptions)} </> )}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionStart">Position Start <span className="required-indicator">*</span></label>
                                            <input id="regionStart" type="number" name="start" value={regionData.start} onChange={handleRegionInputChange} placeholder="e.g., 1" required min="0" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionEnd">Position End <span className="required-indicator">*</span></label>
                                            <input id="regionEnd" type="number" name="end" value={regionData.end} onChange={handleRegionInputChange} placeholder="e.g., 50000" required min="0" />
                                        </div>
                                    </div>
                                    {/* Display Chromosome Range */}
                                    <div className="form-row range-display">
                                        <div className="form-group">
                                           {regionData.chromosome && referenceGenome && ( <>
                                                    {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                                    {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                                    {chromosomeRange.minPosition !== null && chromosomeRange.maxPosition !== null && !loadingRange && !rangeError && (
                                                        <span className="range-info"> Avail. Range: {chromosomeRange.minPosition.toLocaleString()} - {chromosomeRange.maxPosition.toLocaleString()} </span>
                                                    )}
                                                </> )}
                                            {!(regionData.chromosome && referenceGenome) && <span>&nbsp;</span>}
                                        </div>
                                    </div>
                                </>
                            </FormInputSection>

                            {/* Removed SNP/Locus List Inputs */}

                            {/* Error Message Display */}
                            {errorMessage && ( <div className="error-message"> <FaExclamationTriangle /> <span>{errorMessage}</span> </div> )}

                            {/* Action Buttons */}
                            <div className="form-actions">
                                <button type="button" className="secondary-btn clear-btn" onClick={handleReset} disabled={loading || loadingDetails}> <FaEraser /> Clear Form </button>
                                <button type="button" className="primary-btn search-btn" onClick={handleSearch} disabled={isSearchDisabled}>
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
                                    <h2> <i className={`fas fa-chevron-${expandedSections.resultsTable ? 'down' : 'right'} collapse-icon`}><FaChevronRight/></i> <FaPoll /> Search Results </h2>
                                    {!loading && hasResults && ( <span className="results-count-badge"> {displayResults.length} result{displayResults.length !== 1 ? 's' : ''} found </span> )}
                                    {loadingDetails && ( <span className="details-loading-indicator"> <span className="spinner small-spinner"></span> Loading Details... </span> )}
                                </div>
                                {/* Results Content Container */}
                                <div className={`results-content-container ${expandedSections.resultsTable ? 'expanded' : 'collapsed'}`}>
                                     {loading ? ( <div className="loading-state"> <span className="spinner"></span> <span>Loading results...</span> </div> )
                                     : !hasResults ? ( <div className="no-results-state"> <FaInfoCircle className="no-results-icon" /> <h3>No Results</h3> <p>Try adjusting search parameters.</p> </div> )
                                     : ( <>
                                         {/* Query Summary (Always shown if results exist) */}
                                         <div className="query-details-subsection">
                                              <div className="subsection-header" onClick={() => toggleSection('queryDetails')} role="button" aria-expanded={expandedSections.queryDetails}>
                                                  <h3> <i className={`fas fa-chevron-${expandedSections.queryDetails ? 'down' : 'right'} collapse-icon small-icon`}> <FaChevronRight/> </i> <FaInfoCircle /> Query Summary </h3>
                                              </div>
                                              <div className={`details-content ${expandedSections.queryDetails ? 'expanded' : 'collapsed'}`}>
                                                  <p><strong>Genome:</strong> {referenceGenome || "N/A"}</p>
                                                  <p>
                                                      <strong>Searched By:</strong> {searchBy}
                                                      {searchBy === "trait" && ` (${selectedTrait || "N/A"})`}
                                                      {(searchBy === "annotation" || searchBy === "geneName") && searchQuery && ` ("${searchQuery}")`}
                                                      {(searchBy === "annotation" || searchBy === "geneName") && searchQuery && ` [${searchMethod}]`}
                                                      {searchBy === "region" && ` (${regionData.chromosome || 'Any Chr'}:${regionData.start || '*'}-${regionData.end || '*'})`}
                                                  </p>
                                                  {searchBy === "trait" && traitDetails?.description && ( <div className="trait-details-summary"> <p><strong>Trait Description:</strong> {traitDetails.description}</p> </div> )}
                                              </div>
                                         </div>
                                         {/* Results Table */}
                                         <div className="results-table-subsection">
                                             <div className="subsection-header static-header"> <h3> <FaTable /> {searchBy === "trait" ? "Associated Genes" : "Matching Features"} </h3> </div>
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
                                             {hasResults && displayResults.length > 10 && ( <div className="table-footer"> {/* ... */} </div> )}
                                         </div>
                                     </> )}
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