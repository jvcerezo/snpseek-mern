// GenotypeSearch.js
import React, { useState, useEffect } from 'react';
// Import the API functions
import {
    fetchVarietySets,
    fetchSnpSets,
    fetchVarietySubpopulations,
    fetchChromosomes,
    fetchReferenceGenomes,
    searchGenotypes,
    fetchChromosomeRange
    // TODO: Import function to fetch Gene Locus options if changing input to dropdown
    // import { fetchGeneLociList } from '../api';
} from '../api'; // Adjust path if necessary
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { FaDownload } from 'react-icons/fa'; // <-- Import FaDownload
import './GenotypeSearch.css'; // Ensure you link the updated CSS

// Helper component for loading indicators inside dropdowns
const LoadingOption = ({ text = "Loading..." }) => (
    <option disabled value="">{text}</option>
);

const GenotypeSearch = () => {
    const { isAuthenticated } = useAuth(); // Get auth status

    // State for controlling which region input UI is shown
    const [regionInputType, setRegionInputType] = useState('range'); // Default to 'range'

    // State for form inputs - includes all possible region fields
    const [formData, setFormData] = useState({
        referenceGenome: '',
        varietySet: '',
        snpSet: '',
        varietySubpopulation: '',
        // Region fields
        regionType: 'range', // Store the selected type for submission
        regionChromosome: '',
        regionStart: '',
        regionEnd: '',
        regionGeneLocus: '', // Input for Gene Locus ID
        snpList: '',         // Input for SNP List
        locusList: '',       // Input for Locus List
    });

    // State for search results
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false); // Loading for main search submit
    const [searchResults, setSearchResults] = useState(null); // Expecting { referenceGenomeName, positions: [], varieties: [] }

    // --- State for dropdown options ---
    const [referenceGenomeOptions, setReferenceGenomeOptions] = useState([]);
    const [varietySetOptions, setVarietySetOptions] = useState([]);
    const [snpSetOptions, setSnpSetOptions] = useState([]);
    const [subpopulationOptions, setSubpopulationOptions] = useState([]);
    const [chromosomeOptions, setChromosomeOptions] = useState([]);
    // TODO: Add state for Gene Locus dropdown options if implemented
    // const [geneLocusOptions, setGeneLocusOptions] = useState([]);
    // const [loadingGeneLoci, setLoadingGeneLoci] = useState(false);

    // State for loading dropdown options
    const [loadingOptions, setLoadingOptions] = useState({
        referenceGenomes: true,
        varietySets: true,
        snpSets: true,
        subpopulations: true,
        chromosomes: true,
    });
    // State for dropdown loading errors
    const [optionsError, setOptionsError] = useState('');

    // --- State for Chromosome Range ---
    const [chromosomeRange, setChromosomeRange] = useState({ minPosition: null, maxPosition: null });
    const [loadingRange, setLoadingRange] = useState(false);
    const [rangeError, setRangeError] = useState('');
    // --- End Chromosome Range State ---


    // --- Fetch dropdown data on component mount ---
    useEffect(() => {
        const loadDropdownData = async () => {
            setOptionsError('');
            setLoadingOptions(prev => ({ ...prev, referenceGenomes: true, varietySets: true, snpSets: true, subpopulations: true, chromosomes: true }));
            console.log("GenotypeSearch: useEffect - Loading dropdown data...");
            try {
                const [refGenomeData, varietyData, snpData, subpopData, chromData] = await Promise.all([
                    fetchReferenceGenomes(), fetchVarietySets(), fetchSnpSets(),
                    fetchVarietySubpopulations(), fetchChromosomes()
                ]);
                console.log("GenotypeSearch: useEffect - Received Dropdown Data");
                setReferenceGenomeOptions(Array.isArray(refGenomeData) ? refGenomeData : []);
                setVarietySetOptions(Array.isArray(varietyData) ? varietyData : []);
                setSnpSetOptions(Array.isArray(snpData) ? snpData : []);
                setSubpopulationOptions(Array.isArray(subpopData) ? subpopData : []);
                setChromosomeOptions(Array.isArray(chromData) ? chromData : []);
            } catch (error) {
                console.error("GenotypeSearch: useEffect - Failed to load dropdown options:", error);
                setOptionsError(error?.message || "Could not load filter options. Please try refreshing.");
                setReferenceGenomeOptions([]); setVarietySetOptions([]); setSnpSetOptions([]);
                setSubpopulationOptions([]); setChromosomeOptions([]);
            } finally {
                 console.log("GenotypeSearch: useEffect - Finished loading dropdown data.");
                 setLoadingOptions(prev => ({ ...prev, referenceGenomes: false, varietySets: false, snpSets: false, subpopulations: false, chromosomes: false }));
            }
        };
        loadDropdownData();
    }, []); // Run once on mount


    // --- useEffect for Chromosome Range Fetch ---
    useEffect(() => {
        const getRange = async () => {
            if (regionInputType === 'range' && formData.referenceGenome && formData.regionChromosome) {
                setLoadingRange(true); setRangeError(''); setChromosomeRange({ minPosition: null, maxPosition: null });
                try {
                    const rangeData = await fetchChromosomeRange(formData.regionChromosome, formData.referenceGenome);
                    setChromosomeRange(rangeData || { minPosition: null, maxPosition: null });
                    if (!rangeData || rangeData.minPosition === null) setRangeError(`No range data found for ${formData.regionChromosome}.`);
                } catch (error) { setRangeError(`Failed to fetch range.`); }
                finally { setLoadingRange(false); }
            } else {
                setChromosomeRange({ minPosition: null, maxPosition: null });
                setRangeError(''); setLoadingRange(false);
            }
        };
        getRange();
    }, [formData.regionChromosome, formData.referenceGenome, regionInputType]);


    // Input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler for changing the main region input type dropdown
     const handleRegionTypeChange = (e) => {
        const newType = e.target.value;
        setRegionInputType(newType); // Update display control state
        setFormData(prev => ({ // Update formData state
            ...prev,
            regionType: newType, // Store the selected type
            // Clear fields not relevant to the new type
            regionChromosome: newType === 'range' ? prev.regionChromosome : '', // Only keep chromosome for range
            regionStart: newType === 'range' ? prev.regionStart : '',
            regionEnd: newType === 'range' ? prev.regionEnd : '',
            regionGeneLocus: newType === 'geneLocus' ? prev.regionGeneLocus : '',
            snpList: newType === 'snpList' ? prev.snpList : '',
            locusList: newType === 'locusList' ? prev.locusList : '',
        }));
        // Clear range info if type is no longer 'range'
        if (newType !== 'range') {
            setChromosomeRange({ minPosition: null, maxPosition: null });
            setRangeError(''); setLoadingRange(false);
        }
    };


    // Form submit handler - Calls actual API
    const handleSubmit = async (e) => {
        e.preventDefault();
        // --- Validation based on regionType ---
        if (!formData.referenceGenome || !formData.varietySet || !formData.snpSet) {
             alert("Reference Genome, Variety Set, and SNP Set are required."); return;
        }
        let regionValid = false;
        let alertMessage = "";
        switch (formData.regionType) {
            case 'range':
                if (!formData.regionStart || !formData.regionEnd) { alertMessage = "Position Start and Position End are required when searching by Range."; break; }
                const startPos = parseInt(formData.regionStart, 10);
                const endPos = parseInt(formData.regionEnd, 10);
                if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) { alertMessage = "Invalid Start/End position provided for Range search."; break; }
                if (formData.regionChromosome) {
                    if (chromosomeRange.minPosition !== null && startPos < chromosomeRange.minPosition) { alertMessage = `Position Start must be >= ${chromosomeRange.minPosition.toLocaleString()}.`; break; }
                    if (chromosomeRange.maxPosition !== null && endPos > chromosomeRange.maxPosition) { alertMessage = `Position End must be <= ${chromosomeRange.maxPosition.toLocaleString()}.`; break; }
                }
                regionValid = true;
                break;
            case 'geneLocus':
                if (!formData.regionGeneLocus.trim()) { alertMessage = "Gene Locus ID is required."; break; }
                regionValid = true;
                break;
            case 'snpList':
                if (!isAuthenticated) { alertMessage = "Login required for SNP list search."; break; }
                if (!formData.snpList.trim()) { alertMessage = "SNP List cannot be empty."; break; }
                 regionValid = true;
                break;
            case 'locusList':
                 if (!isAuthenticated) { alertMessage = "Login required for Locus list search."; break; }
                 if (!formData.locusList.trim()) { alertMessage = "Locus List cannot be empty."; break; }
                  regionValid = true;
                 break;
            default:
                alertMessage = "Invalid Region Type selected.";
        }

        if (!regionValid) {
            alert(alertMessage);
            return;
        }
        // --- End Validation ---

        setLoading(true);
        setShowResults(true);
        setSearchResults(null);
        console.log('Submitting search with criteria:', formData);

        try {
            const results = await searchGenotypes(formData);
            setSearchResults(results);
            console.log("Search successful, received results:", results);
        } catch (error) {
            console.error("Genotype search failed:", error);
            setSearchResults(null);
            alert(`Search failed: ${error?.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Reset handler - Includes new fields
    const handleReset = () => {
        setRegionInputType('range');
        setFormData({
            referenceGenome: '', varietySet: '', snpSet: '', varietySubpopulation: '',
            regionType: 'range', regionChromosome: '', regionStart: '', regionEnd: '',
            regionGeneLocus: '', snpList: '', locusList: '',
        });
        setShowResults(false); setSearchResults(null); setLoading(false);
        setOptionsError('');
        setChromosomeRange({ minPosition: null, maxPosition: null });
        setLoadingRange(false); setRangeError('');
    };

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

    // --- Function to Generate and Download CSV ---
    const handleDownloadCsv = () => {
        if (!isAuthenticated) { alert("Please log in to download results."); return; }
        if (!searchResults || !searchResults.varieties || searchResults.varieties.length === 0) { alert("No results available to download."); return; }
        console.log("Generating CSV data...");
        const escapeCsvField = (field) => {
            const stringField = String(field ?? '');
            if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
                const escapedField = stringField.replace(/"/g, '""');
                return `"${escapedField}"`;
            }
            return stringField;
        };
        try {
            const staticHeaders = ["VarietyName", "Accession", "Assay", "Subpop", "Dataset", "Mismatch"];
            const positionHeaders = searchResults.positions.map(pos => pos.toString());
            const headers = [...staticHeaders, ...positionHeaders];
            const csvHeader = headers.map(escapeCsvField).join(',');
            const csvRows = searchResults.varieties.map((variety, index) => {
                const isReferenceRow = index === 0;
                const rowData = [
                    variety.name ?? 'N/A',
                    isReferenceRow ? '-' : (variety.accession ?? 'N/A'),
                    variety.assay ?? 'N/A',
                    variety.subpop ?? 'N/A',
                    variety.dataset ?? 'N/A',
                    variety.mismatch ?? 'N/A'
                ];
                const alleleData = searchResults.positions.map(pos => variety.alleles?.[pos] ?? '-');
                return [...rowData, ...alleleData].map(escapeCsvField).join(',');
            });
            const csvString = `${csvHeader}\n${csvRows.join('\n')}`;
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const filename = `genotype_results_${searchResults.referenceGenomeName?.replace(/ /g, '_') || 'data'}_${new Date().toISOString().slice(0,10)}.csv`;
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log("CSV Download triggered.");
        } catch (error) {
            console.error("Failed to generate or download CSV:", error);
            alert("An error occurred while preparing the download.");
        }
    };
    // --- End Download CSV Function ---

    return (
        <div className="page-wrapper">
            <div className="genotype-search-container">
                <div className="search-card">
                    <h2>Search by Genotype</h2>

                    {optionsError && (
                        <div className="error-message options-error">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{optionsError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="genotype-form">

                        {/* --- Reference Genome Dropdown --- */}
                         <div className="form-section">
                            <h3>Reference Genome</h3>
                             <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="referenceGenome">Select Reference Genome <span className="required-indicator" title="Required">*</span></label>
                                    <select id="referenceGenome" name="referenceGenome" value={formData.referenceGenome} onChange={handleInputChange} disabled={loadingOptions.referenceGenomes || !!optionsError} required >
                                        {loadingOptions.referenceGenomes ? ( <LoadingOption text="Loading Genomes..." /> )
                                        : optionsError && referenceGenomeOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                        : ( <> <option value="">-- Select Reference Genome --</option> {renderOptions(referenceGenomeOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Group Datasets */}
                        <div className="form-section">
                            <h3>Datasets</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySet">Variety Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="varietySet" name="varietySet" value={formData.varietySet} onChange={handleInputChange} disabled={loadingOptions.varietySets || !!optionsError} required >
                                        {loadingOptions.varietySets ? ( <LoadingOption text="Loading Variety Sets..." /> )
                                        : optionsError && varietySetOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                        : ( <> <option value="">Select Variety Set</option> {renderOptions(varietySetOptions)} </> )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="snpSet">SNP Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="snpSet" name="snpSet" value={formData.snpSet} onChange={handleInputChange} disabled={loadingOptions.snpSets || !!optionsError} required >
                                        {loadingOptions.snpSets ? ( <LoadingOption text="Loading SNP Sets..." /> )
                                        : optionsError && snpSetOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                        : ( <> <option value="">Select SNP Set</option> {renderOptions(snpSetOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Group Varieties */}
                        <div className="form-section">
                            <h3>Varieties (Optional Filter)</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySubpopulation">Subpopulation</label>
                                    <select id="varietySubpopulation" name="varietySubpopulation" value={formData.varietySubpopulation} onChange={handleInputChange} disabled={loadingOptions.subpopulations || !!optionsError} >
                                        {loadingOptions.subpopulations ? ( <LoadingOption text="Loading Subpopulations..." /> )
                                        : optionsError && subpopulationOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                        : ( <> <option value="">Any Subpopulation</option> {renderOptions(subpopulationOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* --- MODIFIED Group Region --- */}
                        <div className="form-section">
                            <h3>Region</h3>
                            {/* Region Type Selection */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regionInputTypeSelect">Search Region By</label>
                                    <select
                                        id="regionInputTypeSelect"
                                        name="regionType" // Matches formData.regionType via handleInputChange now
                                        value={formData.regionType} // Controlled by formData state
                                        onChange={handleRegionTypeChange} // Use specific handler to also clear fields
                                        disabled={loading}
                                        className="styled-select"
                                    >
                                        <option value="range">Range (Chromosome + Position)</option>
                                        <option value="geneLocus">Gene Locus ID</option>
                                        <option value="snpList" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required for SNP list search" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>
                                            SNP List { !isAuthenticated ? '(Login Required)' : ''}
                                        </option>
                                         <option value="locusList" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required for Locus list search" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>
                                            Locus List { !isAuthenticated ? '(Login Required)' : ''}
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Conditional Inputs based on regionInputType state */}

                            {/* == RANGE INPUTS == */}
                            {regionInputType === 'range' && (
                                <>
                                    <div className="form-row form-row-three-col"> {/* USE 3-COL CLASS */}
                                        <div className="form-group">
                                            <label htmlFor="regionChromosome">Chromosome</label>
                                            <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange} disabled={loadingOptions.chromosomes || !!optionsError} >
                                                {loadingOptions.chromosomes ? ( <LoadingOption text="Loading Chromosomes..." /> )
                                                : optionsError && chromosomeOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                                : ( <> <option value="">Any Chromosome</option> {renderOptions(chromosomeOptions)} </> )}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionStart">Position Start <span className="required-indicator" title="Required">*</span></label>
                                            <input id="regionStart" type="number" name="regionStart" value={formData.regionStart} onChange={handleInputChange} placeholder="e.g., 1" required min="0" />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionEnd">Position End <span className="required-indicator" title="Required">*</span></label>
                                            <input id="regionEnd" type="number" name="regionEnd" value={formData.regionEnd} onChange={handleInputChange} placeholder="e.g., 50000" required min="0" />
                                        </div>
                                    </div>
                                    {/* Display Chromosome Range */}
                                    <div className="form-row range-display">
                                        <div className="form-group">
                                           {formData.regionChromosome && formData.referenceGenome && ( <>
                                                    {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                                    {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                                    {chromosomeRange.minPosition !== null && chromosomeRange.maxPosition !== null && !loadingRange && !rangeError && (
                                                        <span className="range-info">
                                                            Avail. Range: {chromosomeRange.minPosition.toLocaleString()} - {chromosomeRange.maxPosition.toLocaleString()}
                                                        </span>
                                                    )}
                                                </> )}
                                            {!(formData.regionChromosome && formData.referenceGenome) && <span>&nbsp;</span>}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* == GENE LOCUS INPUT == */}
                            {regionInputType === 'geneLocus' && (
                                <div className="form-row">
                                    <div className="form-group"> {/* Takes full width */}
                                        <label htmlFor="regionGeneLocus">Gene Locus ID <span className="required-indicator" title="Required">*</span></label>
                                        <input
                                            id="regionGeneLocus" type="text" name="regionGeneLocus"
                                            value={formData.regionGeneLocus} onChange={handleInputChange}
                                            placeholder="Enter Gene Locus ID (e.g., LOC_Os...)" required
                                            className="search-input"
                                        />
                                    </div>
                                </div>
                            )}

                             {/* == SNP LIST INPUT == */}
                             {regionInputType === 'snpList' && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="snpList">SNP List (one per line) <span className="required-indicator" title="Required">*</span></label>
                                        <textarea
                                            id="snpList" name="snpList" rows="5"
                                            placeholder="Enter SNP IDs, one per line (e.g., snp123)"
                                            value={formData.snpList} onChange={handleInputChange}
                                            disabled={!isAuthenticated} required
                                            className={!isAuthenticated ? 'disabled-textarea' : ''}
                                        ></textarea>
                                        {!isAuthenticated && <p className="auth-required-note">Note: Login required to use SNP list search.</p>}
                                    </div>
                                </div>
                             )}

                             {/* == LOCUS LIST INPUT == */}
                             {regionInputType === 'locusList' && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="locusList">Locus List (one per line) <span className="required-indicator" title="Required">*</span></label>
                                        <textarea
                                            id="locusList" name="locusList" rows="5"
                                            placeholder="Enter Locus IDs, one per line (e.g., LOC_Os...)"
                                            value={formData.locusList} onChange={handleInputChange}
                                            disabled={!isAuthenticated} required
                                            className={!isAuthenticated ? 'disabled-textarea' : ''}
                                        ></textarea>
                                        {!isAuthenticated && <p className="auth-required-note">Note: Login required to use Locus list search.</p>}
                                    </div>
                                </div>
                             )}

                        </div>
                        {/* --- END MODIFIED Group Region --- */}


                        {/* Actions */}
                        <div className="form-actions">
                            <button type="button" onClick={handleReset} className="secondary-btn" disabled={loading}>Reset</button>
                            <button type="submit" disabled={loading || Object.values(loadingOptions).some(Boolean) || (!!optionsError && (referenceGenomeOptions.length === 0 || varietySetOptions.length === 0 || snpSetOptions.length === 0))} className="primary-btn">
                                {loading ? ( <> <span className="spinner"></span> Searching... </> ) : 'Search'}
                            </button>
                        </div>
                    </form>
                </div> {/* End search-card */}

                 {/* Results Area */}
                {showResults && (
                   <div className="results-card">
                         {/* Modified Results Header */}
                         <div className="results-area-header">
                             <h3>Search Results {searchResults?.referenceGenomeName ? `for ${searchResults.referenceGenomeName}` : ''}</h3>
                             {/* Conditionally render download button */}
                             {!loading && searchResults && searchResults.varieties && searchResults.varieties.length > 0 && (
                                 <button
                                     className="secondary-btn download-btn"
                                     onClick={handleDownloadCsv}
                                     disabled={!isAuthenticated}
                                     title={!isAuthenticated ? "Login required to download results" : "Download results as CSV"}
                                 >
                                     <FaDownload /> Download CSV
                                 </button>
                             )}
                         </div>
                         {/* End Modified Results Header */}

                         {loading ? (
                             <div className="loading-indicator"> <span className="spinner"></span> Loading results... please wait. </div>
                         ) : searchResults && searchResults.varieties && searchResults.varieties.length > 0 ? (
                             <div className="results-table-container">
                                 <table className="results-table">
                                     <thead>
                                         <tr>
                                             <th>{searchResults.referenceGenomeName || 'Variety'} Positions</th>
                                             <th>Assay</th><th>Accession</th><th>Subpop</th>
                                             <th>Dataset</th><th>Mismatch</th>
                                             {searchResults.positions?.map(pos => ( <th key={pos}>{pos.toLocaleString()}</th> ))}
                                         </tr>
                                     </thead>
                                     <tbody>
                                         {searchResults.varieties.map((variety, index) => {
                                            const isReferenceRow = index === 0;
                                            const referenceAlleleData = searchResults.varieties[0]?.alleles;
                                            return (
                                                <tr key={variety.accession || `row-${index}`} className={isReferenceRow ? 'reference-genome-row' : 'variety-row'} >
                                                    <td data-label="Variety/Accession">{isReferenceRow ? `${variety.name} (-)` : variety.name }</td>
                                                    <td data-label="Assay">{variety.assay ?? 'N/A'}</td>
                                                    <td data-label="Accession">{isReferenceRow ? '-' : (variety.accession ?? 'N/A')}</td>
                                                    <td data-label="Subpop">{variety.subpop ?? 'N/A'}</td>
                                                    <td data-label="Dataset">{variety.dataset ?? 'N/A'}</td>
                                                    <td data-label="Mismatch">{variety.mismatch ?? 'N/A'}</td>
                                                    {searchResults.positions?.map(pos => {
                                                        const varietyAllele = variety.alleles?.[pos];
                                                        const displayAllele = varietyAllele ?? '-';
                                                        let isMismatch = false;
                                                        if (!isReferenceRow && referenceAlleleData) {
                                                            const refAllele = referenceAlleleData[pos];
                                                            if (displayAllele !== '-' && refAllele && refAllele !== '?' && displayAllele !== refAllele) { isMismatch = true; }
                                                        }
                                                        return ( <td key={`${variety.accession || index}-${pos}`} data-label={pos.toLocaleString()}> <span className={isMismatch ? 'allele-mismatch' : ''}>{displayAllele}</span> </td> );
                                                    })}
                                                </tr>
                                            );
                                         })}
                                     </tbody>
                                 </table>
                             </div>
                         ) : !loading ? (
                             <div className="no-results"> No genotypes found matching criteria. Please adjust search parameters. </div>
                         ) : null }
                     </div>
                )}
            </div> {/* End genotype-search-container */}
        </div> // End page-wrapper
    );
};

export default GenotypeSearch;