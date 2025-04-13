// GenotypeSearch.js
import React, { useState, useEffect } from 'react';
// Import the API functions
import {
    fetchVarietySets,
    fetchSnpSets,
    fetchVarietySubpopulations,
    fetchChromosomes,
    fetchReferenceGenomes, // Added
    searchGenotypes,      // Added
    fetchChromosomeRange  // Added
} from '../api'; // Adjust path if necessary
import './GenotypeSearch.css'; // Ensure you link the updated CSS

// Helper component for loading indicators inside dropdowns
const LoadingOption = ({ text = "Loading..." }) => (
    <option disabled value="">{text}</option>
);

const GenotypeSearch = () => {
    // State for form inputs
    const [formData, setFormData] = useState({
        referenceGenome: '',
        varietySet: '',
        snpSet: '',
        varietySubpopulation: '',
        regionChromosome: '',
        regionStart: '', // Required by backend logic
        regionEnd: '',   // Required by backend logic
        regionGeneLocus: '',
    });

    // State for search results - Initialize matching expected structure
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false); // Loading for main search submit
    const [searchResults, setSearchResults] = useState(null); // Expecting { referenceGenomeName, positions: [], varieties: [] }

    // --- State for dropdown options ---
    const [referenceGenomeOptions, setReferenceGenomeOptions] = useState([]);
    const [varietySetOptions, setVarietySetOptions] = useState([]);
    const [snpSetOptions, setSnpSetOptions] = useState([]);
    const [subpopulationOptions, setSubpopulationOptions] = useState([]);
    const [chromosomeOptions, setChromosomeOptions] = useState([]);

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
            setLoadingOptions({ // Set all to true initially
                referenceGenomes: true, varietySets: true, snpSets: true, subpopulations: true, chromosomes: true,
            });
            console.log("GenotypeSearch: useEffect - Attempting to load ALL dropdown data...");
            try {
                // Fetch all concurrently
                const [refGenomeData, varietyData, snpData, subpopData, chromData] = await Promise.all([
                    fetchReferenceGenomes(),
                    fetchVarietySets(),
                    fetchSnpSets(),
                    fetchVarietySubpopulations(),
                    fetchChromosomes()
                ]);

                // --- Log Received Data ---
                console.log("GenotypeSearch: useEffect - Received Reference Genomes:", refGenomeData);
                console.log("GenotypeSearch: useEffect - Received Variety Sets:", varietyData);
                console.log("GenotypeSearch: useEffect - Received SNP Sets:", snpData);
                console.log("GenotypeSearch: useEffect - Received Subpopulations:", subpopData);
                console.log("GenotypeSearch: useEffect - Received Chromosomes:", chromData);
                // --- End Log ---

                // Set state
                setReferenceGenomeOptions(Array.isArray(refGenomeData) ? refGenomeData : []);
                setVarietySetOptions(Array.isArray(varietyData) ? varietyData : []);
                setSnpSetOptions(Array.isArray(snpData) ? snpData : []);
                setSubpopulationOptions(Array.isArray(subpopData) ? subpopData : []);
                setChromosomeOptions(Array.isArray(chromData) ? chromData : []);

            } catch (error) {
                console.error("GenotypeSearch: useEffect - Failed to load dropdown options:", error);
                const errorMsg = error?.message || "Could not load filter options. Please try refreshing.";
                setOptionsError(errorMsg);
                // Reset all on error
                setReferenceGenomeOptions([]);
                setVarietySetOptions([]);
                setSnpSetOptions([]);
                setSubpopulationOptions([]);
                setChromosomeOptions([]);
            } finally {
                 console.log("GenotypeSearch: useEffect - Finished loading dropdown data.");
                 // Set all loading states to false
                 setLoadingOptions({
                     referenceGenomes: false, varietySets: false, snpSets: false, subpopulations: false, chromosomes: false,
                 });
            }
        };

        loadDropdownData();
    }, []); // Run once on mount


    // --- useEffect for Chromosome Range Fetch ---
    useEffect(() => {
        const getRange = async () => {
            if (formData.referenceGenome && formData.regionChromosome) {
                setLoadingRange(true);
                setRangeError('');
                setChromosomeRange({ minPosition: null, maxPosition: null });
                try {
                    const rangeData = await fetchChromosomeRange(formData.regionChromosome, formData.referenceGenome);
                    if (rangeData && rangeData.minPosition !== null && rangeData.maxPosition !== null) {
                        setChromosomeRange(rangeData);
                    } else {
                        setRangeError(`No range data found for ${formData.regionChromosome} in ${formData.referenceGenome}.`);
                    }
                } catch (error) {
                    setRangeError(`Failed to fetch range for ${formData.regionChromosome}.`);
                } finally {
                    setLoadingRange(false);
                }
            } else {
                setChromosomeRange({ minPosition: null, maxPosition: null });
                setRangeError(''); setLoadingRange(false);
            }
        };
        getRange();
    }, [formData.regionChromosome, formData.referenceGenome]);


    // Input change handler with logs for debugging selection
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`handleInputChange: Field '${name}' changed to value '${value}' (Type: ${typeof value})`);
        setFormData((prev) => {
            const newState = { ...prev, [name]: value };
            return newState;
        });
    };

    // Form submit handler - Calls actual API
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation
        if (!formData.referenceGenome || !formData.varietySet || !formData.snpSet || !formData.regionStart || !formData.regionEnd) {
             alert("Reference Genome, Variety Set, SNP Set, Position Start, and Position End are required.");
             return;
        }
         if (chromosomeRange.minPosition !== null && parseInt(formData.regionStart, 10) < chromosomeRange.minPosition) {
             alert(`Position Start must be >= ${chromosomeRange.minPosition.toLocaleString()} for ${formData.regionChromosome}.`);
             return;
         }
         if (chromosomeRange.maxPosition !== null && parseInt(formData.regionEnd, 10) > chromosomeRange.maxPosition) {
              alert(`Position End must be <= ${chromosomeRange.maxPosition.toLocaleString()} for ${formData.regionChromosome}.`);
              return;
         }

        setLoading(true);
        setShowResults(true);
        setSearchResults(null);
        console.log('Submitting search with criteria:', formData);

        try {
            // --- Call the ACTUAL API function ---
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

    // Reset handler
    const handleReset = () => {
        setFormData({
            referenceGenome: '', varietySet: '', snpSet: '', varietySubpopulation: '',
            regionChromosome: '', regionStart: '', regionEnd: '', regionGeneLocus: '',
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

    // --- Log state before render ---
    // console.log("GenotypeSearch Rendering with formData:", formData); // Keep for debugging if needed

    return (
        <div className="page-wrapper">
            <div className="genotype-search-container">
                <div className="search-card">
                    <h2>Genotype Search Criteria</h2>

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
                        {/* --- END Reference Genome Dropdown --- */}

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

                        {/* Group Region */}
                        <div className="form-section">
                            <h3>Region</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regionChromosome">Chromosome</label>
                                    <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange} disabled={loadingOptions.chromosomes || !!optionsError} >
                                        {loadingOptions.chromosomes ? ( <LoadingOption text="Loading Chromosomes..." /> )
                                        : optionsError && chromosomeOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                        : ( <>
                                                <option value="">Any Chromosome</option>
                                                {renderOptions(chromosomeOptions)}
                                            </>
                                          )}
                                    </select>
                                </div>
                                <div className="form-group region-inputs">
                                    <label htmlFor="regionStart">Position Start <span className="required-indicator" title="Required">*</span></label>
                                    <input id="regionStart" type="number" name="regionStart" value={formData.regionStart} onChange={handleInputChange} placeholder="e.g., 1" required min="0" />
                                    <label htmlFor="regionEnd">Position End <span className="required-indicator" title="Required">*</span></label>
                                    <input id="regionEnd" type="number" name="regionEnd" value={formData.regionEnd} onChange={handleInputChange} placeholder="e.g., 50000" required min="0" />
                                </div>
                            </div>
                             {/* --- Display Chromosome Range --- */}
                            <div className="form-row range-display">
                                <div className="form-group">
                                   {formData.regionChromosome && formData.referenceGenome && (
                                        <>
                                            {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                            {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                            {chromosomeRange.minPosition !== null && chromosomeRange.maxPosition !== null && !loadingRange && !rangeError && (
                                                <span className="range-info">
                                                    Available range for {formData.regionChromosome}: {chromosomeRange.minPosition.toLocaleString()} - {chromosomeRange.maxPosition.toLocaleString()}
                                                </span>
                                            )}
                                        </>
                                    )}
                                    {!(formData.regionChromosome && formData.referenceGenome) && <span>&nbsp;</span>}
                                </div>
                            </div>
                             {/* --- End Display Chromosome Range --- */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regionGeneLocus">Gene Locus (Optional, e.g., LOC_Os...) </label>
                                    <input id="regionGeneLocus" type="text" name="regionGeneLocus" value={formData.regionGeneLocus} onChange={handleInputChange} placeholder="Enter Gene Locus ID" />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="form-actions">
                            <button type="button" onClick={handleReset} className="secondary-btn" disabled={loading}>Reset</button>
                            <button type="submit" disabled={loading || Object.values(loadingOptions).some(Boolean) || (!!optionsError && (referenceGenomeOptions.length === 0 || varietySetOptions.length === 0 || snpSetOptions.length === 0))} className="primary-btn">
                                {loading ? ( <> <span className="spinner"></span> Searching... </> ) : 'Search'}
                            </button>
                        </div>
                    </form>
                </div> {/* End search-card */}

                {/* --- Results Area --- */}
            {showResults && (
               <div className="results-card">
                     <h3>Search Results {searchResults?.referenceGenomeName ? `for ${searchResults.referenceGenomeName}` : ''}</h3>
                     {loading ? (
                         <div className="loading-indicator"> <span className="spinner"></span> Loading results... please wait. </div>
                     ) : searchResults && searchResults.varieties && searchResults.varieties.length > 0 ? (
                         <div className="results-table-container">
                             <table className="results-table">
                                 <thead>
                                     <tr>
                                         {/* Headers (keep as is from previous version) */}
                                         <th>{searchResults.referenceGenomeName || 'Variety'} Positions</th>
                                         <th>Assay</th>
                                         <th>Accession</th>
                                         <th>Subpop</th>
                                         <th>Dataset</th>
                                         <th>Mismatch</th>
                                         {searchResults.positions?.map(pos => (
                                             <th key={pos}>{pos.toLocaleString()}</th>
                                         ))}
                                     </tr>
                                 </thead>
                                 <tbody>
                                     {/* Map over varieties (includes reference row first) */}
                                     {searchResults.varieties.map((variety, index) => {
                                        // Determine if this is the reference row
                                        const isReferenceRow = index === 0;
                                        // Get the reference alleles (available only if results exist)
                                        const referenceAlleleData = searchResults.varieties[0]?.alleles;

                                        return (
                                            <tr
                                                key={variety.accession || `row-${index}`}
                                                // Add class for reference row styling
                                                className={isReferenceRow ? 'reference-genome-row' : 'variety-row'}
                                            >
                                                {/* Static Columns per Variety/Reference */}
                                                <td data-label="Variety/Accession">
                                                     {/* Display slightly differently for Reference row */}
                                                     {isReferenceRow ? `${variety.name} (-)` : variety.name } {/* Removed accession here for clarity, it's in next col */}
                                                 </td>
                                                <td data-label="Assay">{variety.assay ?? 'N/A'}</td>
                                                <td data-label="Accession">{isReferenceRow ? '-' : (variety.accession ?? 'N/A')}</td>
                                                <td data-label="Subpop">{variety.subpop ?? 'N/A'}</td>
                                                <td data-label="Dataset">{variety.dataset ?? 'N/A'}</td>
                                                <td data-label="Mismatch">{variety.mismatch ?? 'N/A'}</td>

                                                {/* Dynamic Position Columns per Variety */}
                                                {searchResults.positions?.map(pos => {
                                                    const varietyAllele = variety.alleles?.[pos];
                                                    const displayAllele = varietyAllele ?? '-';
                                                    let isMismatch = false;

                                                    // Determine mismatch ONLY for non-reference rows
                                                    if (!isReferenceRow && referenceAlleleData) {
                                                        const refAllele = referenceAlleleData[pos];
                                                        // Check if variety has an allele, ref has an allele, and they are different
                                                        if (displayAllele !== '-' && refAllele && refAllele !== '?' && displayAllele !== refAllele) {
                                                            // Basic mismatch check - considers 'A/T' different from 'A' or 'T'
                                                            isMismatch = true;
                                                        }
                                                    }

                                                    return (
                                                        <td key={`${variety.accession || index}-${pos}`} data-label={pos.toLocaleString()}>
                                                            {/* Add class to span if it's a mismatch */}
                                                            <span className={isMismatch ? 'allele-mismatch' : ''}>
                                                                {displayAllele}
                                                            </span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                     })}
                                 </tbody>
                             </table>
                         </div>
                     ) : !loading ? (
                         <div className="no-results"> No genotypes found matching your criteria. Please adjust search parameters or wait for data loading. </div>
                     ) : null }
                 </div> // End results-card
            )}
            </div> {/* End genotype-search-container */}
        </div> // End page-wrapper
    );
};

export default GenotypeSearch;