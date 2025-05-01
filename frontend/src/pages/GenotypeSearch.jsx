import React, { useState, useEffect } from 'react';
import {
    fetchVarietySets, fetchSnpSets, fetchVarietySubpopulations,
    fetchChromosomes, fetchReferenceGenomes, searchGenotypes,
    fetchChromosomeRange
} from '../api'; // Adjust path if necessary
import { useAuth } from '../context/AuthContext';
import { FaDownload, FaExclamationTriangle } from 'react-icons/fa';
import toast, { Toaster } from 'react-hot-toast';
import { saveAs } from 'file-saver'; // Ensure you have file-saver installed
import './GenotypeSearch.css'; // Ensure you link the updated CSS

// Helper component
const LoadingOption = ({ text = "Loading..." }) => (
    <option disabled value="">{text}</option>
);

const GenotypeSearch = () => {
    const { isAuthenticated } = useAuth();

    const [formData, setFormData] = useState({
        referenceGenome: '', varietySet: '', snpSet: '', varietySubpopulation: '',
        regionChromosome: '', // Empty string means "Any Chromosome"
        regionStart: '', regionEnd: '',
        // Removed other region types for simplicity based on last backend version
        // regionType: 'range', regionGeneLocus: '', snpList: '', locusList: '',
    });

    // State for search results
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState(null);

    // State for dropdown options
    const [referenceGenomeOptions, setReferenceGenomeOptions] = useState([]);
    const [varietySetOptions, setVarietySetOptions] = useState([]);
    const [snpSetOptions, setSnpSetOptions] = useState([]);
    const [subpopulationOptions, setSubpopulationOptions] = useState([]);
    const [chromosomeOptions, setChromosomeOptions] = useState([]);

    // State for loading dropdown options
    const [loadingOptions, setLoadingOptions] = useState({
        referenceGenomes: true, varietySets: true, snpSets: true, subpopulations: true, chromosomes: true,
    });
    const [optionsError, setOptionsError] = useState('');

    // State for Chromosome Range
    const [chromosomeRange, setChromosomeRange] = useState({ minPosition: null, maxPosition: null });
    const [loadingRange, setLoadingRange] = useState(false);
    const [rangeError, setRangeError] = useState('');


    // Fetch dropdown data on mount
    useEffect(() => {
        const loadDropdownData = async () => {
            setOptionsError('');
            setLoadingOptions({ referenceGenomes: true, varietySets: true, snpSets: true, subpopulations: true, chromosomes: true });
            try {
                const [refGenomeData, varietyData, snpData, subpopData, chromData] = await Promise.all([
                    fetchReferenceGenomes(), fetchVarietySets(), fetchSnpSets(),
                    fetchVarietySubpopulations(), fetchChromosomes()
                ]);
                setReferenceGenomeOptions(Array.isArray(refGenomeData) ? refGenomeData : []);
                setVarietySetOptions(Array.isArray(varietyData) ? varietyData : []);
                setSnpSetOptions(Array.isArray(snpData) ? snpData : []);
                setSubpopulationOptions(Array.isArray(subpopData) ? subpopData : []);
                setChromosomeOptions(Array.isArray(chromData) ? chromData : []);
            } catch (error) {
                setOptionsError(error?.message || "Could not load filter options. Please try refreshing.");
                setReferenceGenomeOptions([]); setVarietySetOptions([]); setSnpSetOptions([]);
                setSubpopulationOptions([]); setChromosomeOptions([]);
            } finally {
                 setLoadingOptions({ referenceGenomes: false, varietySets: false, snpSets: false, subpopulations: false, chromosomes: false });
            }
        };
        loadDropdownData();
    }, []);


    // Fetch Chromosome Range (only if chromosome selected)
    useEffect(() => {
        const getRange = async () => {
            // Only run if a specific chromosome AND reference genome are selected
            if (formData.referenceGenome && formData.regionChromosome) {
                setLoadingRange(true); setRangeError(''); setChromosomeRange({ minPosition: null, maxPosition: null });
                try {
                    const rangeData = await fetchChromosomeRange(formData.regionChromosome, formData.referenceGenome);
                    if (rangeData && rangeData.minPosition !== null && rangeData.maxPosition !== null) {
                         setChromosomeRange(rangeData);
                         setRangeError(''); // Clear previous error if success
                    } else {
                         setChromosomeRange({ minPosition: null, maxPosition: null });
                         setRangeError(`No range data found for ${formData.regionChromosome}.`);
                    }
                } catch (error) {
                     setChromosomeRange({ minPosition: null, maxPosition: null }); // Reset on error
                     setRangeError(`Failed to fetch range.`);
                     console.error("Range fetch error:", error);
                } finally { setLoadingRange(false); }
            } else {
                // Clear range info if no specific chromosome/genome is selected
                setChromosomeRange({ minPosition: null, maxPosition: null });
                setRangeError(''); setLoadingRange(false);
            }
        };
        // Use setTimeout to debounce slightly if needed, otherwise call directly
        // const timer = setTimeout(() => getRange(), 300); // Optional debounce
        // return () => clearTimeout(timer);
        getRange();
    }, [formData.regionChromosome, formData.referenceGenome]);


    // Input change handler
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // If chromosome changes, reset start/end and range info
        if (name === 'regionChromosome') {
            setFormData(prev => ({ ...prev, regionStart: '', regionEnd: '' }));
            setChromosomeRange({ minPosition: null, maxPosition: null });
            setRangeError('');
        }
         // If reference genome changes, reset chromosome related fields
         if (name === 'referenceGenome') {
             setFormData(prev => ({ ...prev, regionChromosome: '', regionStart: '', regionEnd: '' }));
             setChromosomeRange({ minPosition: null, maxPosition: null });
             setRangeError('');
             // TODO: Also potentially reload chromosome options if they depend on the reference genome
         }
    };

    // Form submit handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Basic core validation
        if (!formData.referenceGenome || !formData.varietySet || !formData.snpSet) {
             alert("Reference Genome, Variety Set, and SNP Set are required."); return;
        }
        // Conditional range validation
        const isRangeSearch = formData.regionChromosome !== ''; // True if a specific chromosome is selected
        if (isRangeSearch) {
            if (!formData.regionStart || !formData.regionEnd) { alert("Position Start and Position End are required when searching a specific Chromosome."); return; }
            const startPos = parseInt(formData.regionStart, 10);
            const endPos = parseInt(formData.regionEnd, 10);
            if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) { alert("Invalid Start/End position provided."); return; }
             // Optional client-side check against fetched range (backend also validates)
            if (chromosomeRange.minPosition !== null && startPos < chromosomeRange.minPosition) { alert(`Start Position must be >= ${chromosomeRange.minPosition.toLocaleString()}.`); return; }
            if (chromosomeRange.maxPosition !== null && endPos > chromosomeRange.maxPosition) { alert(`End Position must be <= ${chromosomeRange.maxPosition.toLocaleString()}.`); return; }
        }

        setLoading(true); setShowResults(true); setSearchResults(null);
        console.log('Submitting search with criteria:', formData);

        try {
            // Prepare payload - send all fields, backend handles empty chromosome
            const payload = { ...formData };
            const results = await searchGenotypes(payload);
            setSearchResults(results);
            console.log("Search successful, received results:", results);
             if (!results || !results.varieties || results.varieties.length === 0) {
                 toast.info("No matching genotypes found for the selected criteria."); // Use toast
             }
        } catch (error) {
            console.error("Genotype search failed:", error);
            setSearchResults(null);
            toast.error(`Search failed: ${error?.message || 'Unknown error'}`); // Use toast for errors
        } finally { setLoading(false); }
    };

    // Reset handler
    const handleReset = () => {
        setFormData({
            referenceGenome: '', varietySet: '', snpSet: '', varietySubpopulation: '',
            regionChromosome: '', regionStart: '', regionEnd: '',
            // Removed other region types: regionType: 'range', regionGeneLocus: '', snpList: '', locusList: '',
        });
        setShowResults(false); setSearchResults(null); setLoading(false);
        setOptionsError('');
        setChromosomeRange({ minPosition: null, maxPosition: null });
        setLoadingRange(false); setRangeError('');
    };

    // Helper function to render options
     const renderOptions = (optionsArray) => {
         if (!Array.isArray(optionsArray) || optionsArray.length === 0) return null;
         return optionsArray.map(option => (
             <option key={option} value={option}>{option}</option>
         ));
     };


    // Function to Generate and Download CSV
    const handleDownloadCsv = () => {
        // ... (Keep the CSV download logic from previous response, it's self-contained) ...
        if (!isAuthenticated) { alert("Please log in to download results."); return; }
        if (!searchResults || !searchResults.varieties || searchResults.varieties.length === 0) { alert("No results available to download."); return; }
        console.log("Generating CSV data...");
        const escapeCsvField = (field) => { /* ... */ }; // Keep escaping function
        try {
            const staticHeaders = ["VarietyName", "Accession", "Assay", "Subpop", "Dataset", "Mismatch"];
            const positionHeaders = searchResults.positions.map(pos => pos.toString());
            const headers = [...staticHeaders, ...positionHeaders];
            const csvHeader = headers.map(escapeCsvField).join(',');
            const csvRows = searchResults.varieties.map((variety, index) => {
                const isReferenceRow = index === 0;
                const referenceAlleleData = searchResults.varieties[0]?.alleles;
                const rowData = [ variety.name ?? 'N/A', isReferenceRow ? '-' : (variety.accession ?? 'N/A'), variety.assay ?? 'N/A', variety.subpop ?? 'N/A', variety.dataset ?? 'N/A', variety.mismatch ?? 'N/A' ];
                const alleleData = searchResults.positions.map(pos => variety.alleles?.[pos] ?? '-');
                return [...rowData, ...alleleData].map(escapeCsvField).join(',');
            });
            const csvString = `${csvHeader}\n${csvRows.join('\n')}`;
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const filename = `genotype_results_${searchResults.referenceGenomeName?.replace(/ /g, '_') || 'data'}_${new Date().toISOString().slice(0,10)}.csv`;
            saveAs(blob, filename); // Use file-saver
            console.log("CSV Download triggered.");
        } catch (error) { console.error("Failed to generate or download CSV:", error); alert("An error occurred while preparing the download."); }
    };

    // Determine if range inputs should be active
    const isRangeSearch = formData.regionChromosome !== '';

    return (
        <div className="page-wrapper">
            <Toaster position="bottom-right" richColors />
            <div className="genotype-search-container">
                <div className="search-card">
                    <h2>Search by Genotype</h2>

                    {optionsError && ( <div className="error-message options-error"> <FaExclamationTriangle /> <span>{optionsError}</span> </div> )}

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
                                        : ( <> <option value="">-- Select --</option> {renderOptions(referenceGenomeOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* --- Datasets --- */}
                         <div className="form-section">
                            <h3>Datasets</h3>
                             <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySet">Variety Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="varietySet" name="varietySet" value={formData.varietySet} onChange={handleInputChange} disabled={loadingOptions.varietySets || !!optionsError} required >
                                         {loadingOptions.varietySets ? ( <LoadingOption /> ) : optionsError && varietySetOptions.length === 0 ? ( <option value="" disabled>Error</option> ) : ( <> <option value="">-- Select --</option> {renderOptions(varietySetOptions)} </> )}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="snpSet">SNP Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="snpSet" name="snpSet" value={formData.snpSet} onChange={handleInputChange} disabled={loadingOptions.snpSets || !!optionsError} required >
                                          {loadingOptions.snpSets ? ( <LoadingOption /> ) : optionsError && snpSetOptions.length === 0 ? ( <option value="" disabled>Error</option> ) : ( <> <option value="">-- Select --</option> {renderOptions(snpSetOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* --- Varieties Filter --- */}
                        <div className="form-section">
                            <h3>Varieties (Optional Filter)</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySubpopulation">Subpopulation</label>
                                    <select id="varietySubpopulation" name="varietySubpopulation" value={formData.varietySubpopulation} onChange={handleInputChange} disabled={loadingOptions.subpopulations || !!optionsError} >
                                         {loadingOptions.subpopulations ? ( <LoadingOption /> ) : optionsError && subpopulationOptions.length === 0 ? ( <option value="" disabled>Error</option> ) : ( <> <option value="">Any Subpopulation</option> {renderOptions(subpopulationOptions)} </> )}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* --- Region Selection --- */}
                        <div className="form-section">
                            <h3>Region</h3>
                            <div className="form-row form-row-three-col">
                                 <div className="form-group">
                                    <label htmlFor="regionChromosome">Chromosome</label>
                                    <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange} disabled={loadingOptions.chromosomes || !!optionsError || !formData.referenceGenome} title={!formData.referenceGenome ? "Select Reference Genome first" : ""}>
                                         {loadingOptions.chromosomes ? ( <LoadingOption /> ) : optionsError && chromosomeOptions.length === 0 ? ( <option value="" disabled>Error</option> ) : ( <> <option value="">Any Chromosome</option> {renderOptions(chromosomeOptions)} </> )}
                                    </select>
                                </div>
                                <div className="form-group">
                                     <label htmlFor="regionStart">Position Start {isRangeSearch && <span className="required-indicator">*</span>}</label>
                                     <input id="regionStart" type="number" name="regionStart" value={formData.regionStart} onChange={handleInputChange} placeholder={isRangeSearch ? "e.g., 1" : "N/A"} required={isRangeSearch} disabled={!isRangeSearch} className={!isRangeSearch ? 'disabled-input' : ''} min="0"/>
                                </div>
                                <div className="form-group">
                                     <label htmlFor="regionEnd">Position End {isRangeSearch && <span className="required-indicator">*</span>}</label>
                                     <input id="regionEnd" type="number" name="regionEnd" value={formData.regionEnd} onChange={handleInputChange} placeholder={isRangeSearch ? "e.g., 50000" : "N/A"} required={isRangeSearch} disabled={!isRangeSearch} className={!isRangeSearch ? 'disabled-input' : ''} min={isRangeSearch ? (formData.regionStart || 0) : 0}/>
                                </div>
                            </div>
                            {/* Display Chromosome Range only when relevant */}
                            {isRangeSearch && (
                                <div className="form-row range-display">
                                     <div className="form-group"> {/* Use full width */}
                                        {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                        {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                        {chromosomeRange.minPosition !== null && !loadingRange && !rangeError && ( <span className="range-info"> Avail. Range for {formData.regionChromosome}: {chromosomeRange.minPosition.toLocaleString()} - {chromosomeRange.maxPosition.toLocaleString()} </span> )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="form-actions">
                            <button type="button" onClick={handleReset} className="secondary-btn" disabled={loading}>Reset</button>
                            <button type="submit" disabled={loading || Object.values(loadingOptions).some(Boolean) || (!!optionsError && (referenceGenomeOptions.length === 0 || varietySetOptions.length === 0 || snpSetOptions.length === 0))} className="primary-btn">
                                {loading ? ( <> <span className="spinner small-spinner"></span> Searching... </> ) : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>

                 {/* Results Area */}
                {showResults && (
                   <div className="results-card">
                         <div className="results-area-header">
                             <h3>Search Results {searchResults?.referenceGenomeName ? `for ${searchResults.referenceGenomeName}` : ''}</h3>
                             {!loading && searchResults?.varieties?.length > 0 && (
                                 <button className="secondary-btn download-btn" onClick={handleDownloadCsv} disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : "Download CSV"} >
                                     <FaDownload /> Download CSV
                                 </button>
                             )}
                         </div>
                         {loading ? (
                             <div className="loading-indicator"> <span className="spinner"></span> Loading results... </div>
                         ) : searchResults?.varieties?.length > 0 ? (
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
                                                    <td data-label="Variety">{isReferenceRow ? <strong>{variety.name} (Reference)</strong> : variety.name }</td>
                                                    <td data-label="Assay">{variety.assay ?? 'N/A'}</td>
                                                    <td data-label="Accession">{isReferenceRow ? '-' : (variety.accession ?? 'N/A')}</td>
                                                    <td data-label="Subpop">{variety.subpop ?? 'N/A'}</td>
                                                    <td data-label="Dataset">{variety.dataset ?? 'N/A'}</td>
                                                    <td data-label="Mismatch">{isReferenceRow ? '-' : (variety.mismatch ?? 'N/A')}</td>
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
            </div>
        </div>
    );
};

export default GenotypeSearch;