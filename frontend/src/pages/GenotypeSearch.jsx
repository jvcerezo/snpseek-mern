import React, { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async'; // Import AsyncSelect for async dropdowns
import debounce from 'lodash.debounce'; // Import debounce for search input

// Import the API functions
import {
    fetchVarietySets,
    fetchSnpSets,
    fetchVarietySubpopulations,
    fetchChromosomes,
    fetchReferenceGenomes,
    fetchChromosomeRange,
    fetchConsolidatedChromosomeRange,
    autocompleteLocusAPI,
    fetchUserLists,
    searchGenotypesPublic,
    searchGenotypesPrivate
    // <-- IMPORT THE NEW FUNCTION
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

const UserListLoadingOption = ({ text = "Loading Lists..." }) => (
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
        regionChromosome: '', // Empty string means "Any Chromosome"
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
    const [selectedLocusOption, setSelectedLocusOption] = useState(null); // State for selected Gene Locus options
    const [userSnpLists, setUserSnpLists] = useState([]);
    const [loadingUserLists, setLoadingUserLists] = useState(false);
    const [userListsError, setUserListsError] = useState('');

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
    // Combined state for both specific and consolidated range
    const [displayedRange, setDisplayedRange] = useState({ minPosition: null, maxPosition: null });
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

    useEffect(() => {
        const loadUserSnpLists = async () => {
            // Only fetch if authenticated and the SNP List region type is selected
            if (isAuthenticated && regionInputType === 'snpList') {
                console.log("GenotypeSearch: useEffect - Loading user SNP lists...");
                setLoadingUserLists(true);
                setUserListsError('');
                setUserSnpLists([]); // Clear previous lists
                 // Also clear the selected list ID from formData when re-fetching
                setFormData(prev => ({ ...prev, snpList: '' }));
                try {
                    const allUserLists = await fetchUserLists();
                    // Filter for lists of type 'snp'
                    const snpLists = allUserLists.filter(list => list.type === 'snp');
                    setUserSnpLists(snpLists);
                    console.log(`GenotypeSearch: useEffect - Found ${snpLists.length} user SNP lists.`);
                } catch (error) {
                    console.error("GenotypeSearch: useEffect - Failed to load user SNP lists:", error);
                    setUserListsError(error?.response?.data?.message || error?.message || "Could not load your SNP lists.");
                    setUserSnpLists([]);
                } finally {
                    setLoadingUserLists(false);
                }
            } else {
                 // Clear lists if not authenticated or not the right region type
                 // Might not be strictly necessary depending on UX preference
                 // setUserSnpLists([]);
                 // setUserListsError('');
            }
        };

        loadUserSnpLists();
        // Dependencies: run when authentication status changes OR region type changes
    }, [isAuthenticated, regionInputType]);


    // --- MODIFIED useEffect for Chromosome Range Fetch ---
    useEffect(() => {
        const getRange = async () => {
            if (regionInputType === 'range' && formData.referenceGenome) {
                setLoadingRange(true); setRangeError('');
                setDisplayedRange({ minPosition: null, maxPosition: null });
                try {
                    let rangeData;
                    if (formData.regionChromosome) {
                        console.log(`EFFECT: Fetching specific range for ${formData.regionChromosome}`);
                        rangeData = await fetchChromosomeRange(formData.regionChromosome, formData.referenceGenome);
                        if (!rangeData || rangeData.minPosition === null || rangeData.maxPosition === null) {
                            setRangeError(`No range data found for ${formData.regionChromosome}.`);
                        }
                    } else {
                        console.log("EFFECT: Fetching consolidated range for all chromosomes");
                        rangeData = await fetchConsolidatedChromosomeRange(formData.referenceGenome);
                        if (!rangeData || rangeData.minPosition === null || rangeData.maxPosition === null) {
                            setRangeError(`No consolidated range data found for ${formData.referenceGenome}.`);
                        }
                    }
                    setDisplayedRange(rangeData || { minPosition: null, maxPosition: null });
                } catch (error) {
                    console.error("EFFECT: Error fetching range data", error);
                    setRangeError(`Failed to fetch range data.`);
                    setDisplayedRange({ minPosition: null, maxPosition: null });
                } finally {
                    setLoadingRange(false);
                }
            } else {
                setDisplayedRange({ minPosition: null, maxPosition: null });
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

    const loadLocusOptions = async (inputValue, callback) => {
        const query = inputValue || ""; // Handle empty query for default options

        // Don't proceed if reference genome isn't selected
        if (!formData.referenceGenome) {
            // You might optionally want a message here via callback({ options: [], message: "..." })
            // but react-select's noOptionsMessage prop handles it too.
            callback([]); // Return empty options
            return;
        }
        // Don't call API for very short input unless loading default options
        // Allow empty query `""` to pass for defaultOptions={true}
        if (query && query.trim().length < 2) {
             callback([]);
             return;
        }

        try {
            console.log(`GENOTYPE SEARCH: Autocompleting Loci - q: ${query}, ref: ${formData.referenceGenome}`);
            const results = await autocompleteLocusAPI(query, formData.referenceGenome);

            // !! Verify idField ('_id') and nameField ('geneName') match your Feature API response !!
            const options = results.map(item => ({
                value: item._id,    // Assuming API returns MongoDB _id as value
                label: item.geneName // Assuming API returns geneName as label
            })).filter(opt => opt.value && opt.label); // Ensure valid options

            callback(options); // Pass formatted options back to AsyncSelect

        } catch (error) {
            console.error(`Error fetching locus autocomplete options:`, error);
            callback([]); // Return empty array on error
        }
    };

    // Debounced version to limit API calls while typing
    const debouncedLoadLocusOptions = useCallback(
        debounce((inputValue, callback) => {
            loadLocusOptions(inputValue, callback);
        } , 500), // 500ms debounce delay
        [formData.referenceGenome] // Recreate debounce function only if reference genome changes
    );

    // Handler for changing the main region input type dropdown
     const handleRegionTypeChange = (e) => {
        const newType = e.target.value;
        setRegionInputType(newType); // Update display control state
        setFormData(prev => ({ // Update formData state
            ...prev,
            regionType: newType, // Store the selected type
            // Clear fields not relevant to the new type
            // Keep chromosome only if new type is range, otherwise clear it
             regionChromosome: newType === 'range' ? prev.regionChromosome : '',
             regionStart: newType === 'range' ? prev.regionStart : '',
             regionEnd: newType === 'range' ? prev.regionEnd : '',
             regionGeneLocus: newType === 'geneLocus' ? prev.regionGeneLocus : '',
             snpList: newType === 'snpList' ? prev.snpList : '',
             locusList: newType === 'locusList' ? prev.locusList : '',
        }));
        // Clear range info manually if type is no longer 'range'
         if (newType !== 'range') {
             setDisplayedRange({ minPosition: null, maxPosition: null });
             setRangeError('');
             setLoadingRange(false);
         }

         if (newType !== 'geneLocus') {
             setSelectedLocusOption(null); // Clear selected locus options when switching away from gene locus
         }

         if (newType !== 'snpList') {
            setUserListsError('');
       }
    };


    // Form submit handler - Calls actual API
    const handleSubmit = async (e) => {
        e.preventDefault();

        // --- Validation (remains the same - checks based on regionType) ---
        if (!formData.referenceGenome || !formData.varietySet || !formData.snpSet) {
            alert("Reference Genome, Variety Set, and SNP Set are required."); return;
        }
        let regionValid = false;
        let alertMessage = "";
        let requiresAuth = false; // Flag for private search types

        switch (formData.regionType) {
            case 'range':
                // ... (range validation logic) ...
                 if (!formData.regionStart || !formData.regionEnd) { alertMessage = "Position Start and Position End are required when searching by Range."; break; }
                 const startPos = parseInt(formData.regionStart, 10); const endPos = parseInt(formData.regionEnd, 10);
                 if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) { alertMessage = "Invalid Start/End position provided for Range search."; break; }
                 if (formData.regionChromosome && displayedRange.minPosition !== null && !rangeError) {
                     if (startPos < displayedRange.minPosition) { alertMessage = `Start must be >= ${displayedRange.minPosition.toLocaleString()}.`; break; }
                     if (endPos > displayedRange.maxPosition) { alertMessage = `End must be <= ${displayedRange.maxPosition.toLocaleString()}.`; break; }
                 }
                regionValid = true;
                break;
            case 'geneLocus':
                if (!formData.regionGeneLocus) { alertMessage = "Gene Locus must be selected."; break; }
                regionValid = true;
                break;
            case 'snpList':
                 requiresAuth = true; // Mark as needing auth
                 // Frontend check (optional but good UX, backend enforces it)
                 if (!isAuthenticated) { alertMessage = "Login required for SNP list search."; break; }
                 if (!formData.snpList) { alertMessage = "Please select one of your SNP Lists."; break; }
                 if (loadingUserLists) { alertMessage = "Still loading your SNP lists, please wait."; break; }
                 if (userListsError) { alertMessage = "Could not load SNP lists, cannot proceed."; break; }
                 if (userSnpLists.length === 0 && !loadingUserLists && !userListsError) { alertMessage = "You have no SNP lists available."; break;}
                 regionValid = true;
                 break;
            case 'locusList':
                 requiresAuth = true; // Mark as needing auth
                 // Frontend check (optional but good UX)
                 if (!isAuthenticated) { alertMessage = "Login required for Locus list search."; break; }
                 if (!formData.locusList.trim()) { alertMessage = "Locus List cannot be empty."; break; }
                 regionValid = true;
                 break;
            default:
                alertMessage = "Invalid Region Type selected.";
        }

        if (!regionValid) {
            alert(alertMessage);
            return; // Stop submission if validation fails
        }
        // --- End Validation ---

        setLoading(true);
        setShowResults(true);
        setSearchResults(null);
        console.log('Submitting search with criteria:', formData);

        try {
            let results;
            // ** Choose API call based on regionType **
            if (requiresAuth) {
                 // Double-check auth status just before calling (robustness)
                 if (!isAuthenticated) {
                     throw new Error("Authentication is required for this search type."); // Throw error to be caught below
                 }
                 console.log("Calling PRIVATE search API");
                 results = await searchGenotypesPrivate(formData); // Call private function
            } else { // 'range' or 'geneLocus'
                 console.log("Calling PUBLIC search API");
                 results = await searchGenotypesPublic(formData); // Call public function
            }
            setSearchResults(results);
            console.log("Search successful, received results:", results);
        } catch (error) {
            console.error("Genotype search failed:", error);
            setSearchResults(null);
            // Use the error message from the API response if available
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
        setOptionsError(''); setSelectedLocusOption(null);
        setDisplayedRange({ minPosition: null, maxPosition: null });
        setLoadingRange(false); setRangeError('');
        // Reset user list state as well
        setUserSnpLists([]); setLoadingUserLists(false); setUserListsError('');
    };

    // --- Helper function to render options ---
     const renderOptions = (optionsArray) => {
         if (!Array.isArray(optionsArray) || optionsArray.length === 0) return null;
         const firstItem = optionsArray[0];
         if (typeof firstItem === 'string') {
             return optionsArray.map(option => ( <option key={option} value={option}>{option}</option> ));
         } else if (typeof firstItem === 'object' && firstItem !== null) {
             // Attempt to find a unique key and a display label
             const keyProp = firstItem._id || firstItem.id || 'value'; // Prefer _id, then id, fallback to 'value'
             const labelProp = firstItem.name || firstItem.label || keyProp; // Prefer name, then label, fallback to keyProp
             return optionsArray.map((option, index) => {
                  if (!option || typeof option !== 'object') return null;
                  const keyValue = option[keyProp] !== undefined ? option[keyProp] : `opt-${index}`; // Generate fallback key if needed
                  const labelValue = option[labelProp] !== undefined ? option[labelProp] : '-- Invalid Option --';
                  // Usually, the value submitted should be the identifier (like name or id), not necessarily the label if they differ
                  // Here, we are using the label as the value, which works if labels are unique identifiers
                  // If the backend expects an ID, you might need to adjust this logic or how options are structured
                  const valueValue = labelValue;
                  return ( <option key={keyValue} value={valueValue}> {labelValue} </option> );
             });
         }
         return <option disabled>Invalid options data</option>;
     };

     const renderUserListOptions = (lists) => {
        if (!Array.isArray(lists)) return null;
        return lists.map(list => (
            <option key={list._id} value={list._id}>
                {list.name} ({list.content.length} items)
            </option>
        ));
    };

    // --- Function to Generate and Download CSV ---
     const handleDownloadCsv = () => {
         if (!isAuthenticated) { alert("Please log in to download results."); return; }
         if (!searchResults || !searchResults.varieties || searchResults.varieties.length === 0) { alert("No results available to download."); return; }
         console.log("Generating CSV data...");
         const escapeCsvField = (field) => {
             const stringField = String(field ?? ''); // Ensure it's a string, handle null/undefined
             if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
                 // If the field contains a comma, newline, or double quote, enclose it in double quotes
                 // and escape any existing double quotes within the field by doubling them
                 const escapedField = stringField.replace(/"/g, '""');
                 return `"${escapedField}"`;
             }
             return stringField;
         };
         try {
             // Define headers: Static columns + dynamic position columns
             const staticHeaders = ["VarietyName", "Accession", "Assay", "Subpop", "Dataset", "Mismatch"];
             // Ensure positions are strings for headers
             const positionHeaders = searchResults.positions.map(pos => pos.toString());
             const headers = [...staticHeaders, ...positionHeaders];

             // Prepare CSV header row
             const csvHeader = headers.map(escapeCsvField).join(',');

             // Prepare data rows
             const csvRows = searchResults.varieties.map((variety, index) => {
                 const isReferenceRow = index === 0;
                 const rowData = [
                     variety.name ?? 'N/A',
                     isReferenceRow ? '-' : (variety.accession ?? 'N/A'), // No accession for reference row typically
                     variety.assay ?? 'N/A',
                     variety.subpop ?? 'N/A',
                     variety.dataset ?? 'N/A',
                     variety.mismatch ?? 'N/A' // Mismatch count
                 ];

                 // Get allele data for each position, defaulting to '-' if missing
                 const alleleData = searchResults.positions.map(pos => variety.alleles?.[pos] ?? '-');

                 // Combine static and allele data, escape each field, and join into a CSV row string
                 return [...rowData, ...alleleData].map(escapeCsvField).join(',');
             });

             // Combine header and rows
             const csvString = `${csvHeader}\n${csvRows.join('\n')}`;

             // Create Blob and trigger download
             const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
             const url = URL.createObjectURL(blob);
             const link = document.createElement("a");
             link.setAttribute("href", url);
             // Generate a filename
             const filename = `genotype_results_${searchResults.referenceGenomeName?.replace(/ /g, '_') || 'data'}_${new Date().toISOString().slice(0,10)}.csv`;
             link.setAttribute("download", filename);
             link.style.visibility = 'hidden';
             document.body.appendChild(link);
             link.click(); // Simulate click to trigger download
             document.body.removeChild(link); // Clean up the link element
             URL.revokeObjectURL(url); // Free up memory
             console.log("CSV Download triggered.");
         } catch (error) {
             console.error("Failed to generate or download CSV:", error);
             alert("An error occurred while preparing the download.");
         }
     };

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
                                         name="regionType" // Matches formData.regionType
                                         value={formData.regionType} // Controlled by formData state
                                         onChange={handleRegionTypeChange} // Use specific handler to also clear fields
                                         disabled={loading} // Disable while main search is loading
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
                                            {/* Note: value="" corresponds to "Any Chromosome" */}
                                            <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange} disabled={loadingOptions.chromosomes || !!optionsError || !formData.referenceGenome} >
                                                {loadingOptions.chromosomes ? ( <LoadingOption text="Loading Chromosomes..." /> )
                                                : optionsError && chromosomeOptions.length === 0 ? ( <option value="" disabled>Error loading</option> )
                                                : ( <>
                                                        <option value="">Any Chromosome</option>
                                                        {renderOptions(chromosomeOptions)}
                                                    </>
                                                  )}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionStart">Position Start <span className="required-indicator" title="Required">*</span></label>
                                            <input id="regionStart" type="number" name="regionStart" value={formData.regionStart} onChange={handleInputChange} placeholder="e.g., 1" required min="0" disabled={!formData.referenceGenome}/>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="regionEnd">Position End <span className="required-indicator" title="Required">*</span></label>
                                            <input id="regionEnd" type="number" name="regionEnd" value={formData.regionEnd} onChange={handleInputChange} placeholder="e.g., 50000" required min="0" disabled={!formData.referenceGenome} />
                                        </div>
                                    </div>
                                    {/* MODIFIED: Display Chromosome Range */}
                                    <div className="form-row range-display">
                                        <div className="form-group">
                                           {/* Show info only if type is range AND genome is selected */}
                                            {regionInputType === 'range' && formData.referenceGenome && (
                                                <>
                                                    {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                                    {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                                    {/* Check if range data exists and no error/loading */}
                                                    {displayedRange.minPosition !== null && displayedRange.maxPosition !== null && !loadingRange && !rangeError && (
                                                        <span className="range-info">
                                                            {/* Dynamically change label based on whether a specific chromosome is selected */}
                                                            {formData.regionChromosome ? 'Avail. Range:' : 'Consolidated Range (All Chromosomes):'}
                                                             {' '}{displayedRange.minPosition.toLocaleString()} - {displayedRange.maxPosition.toLocaleString()}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            {/* Placeholder if no range info is applicable/available */}
                                            {!(regionInputType === 'range' && formData.referenceGenome) && <span>&nbsp;</span>}
                                        </div>
                                    </div>
                                </>
                            )}

                             {/* == GENE LOCUS INPUT == */}
                             {regionInputType === 'geneLocus' && (
                                <div className="form-row">
                                    <div className="form-group"> {/* Takes full width */}
                                        <label htmlFor="regionGeneLocus">Gene Locus ID <span className="required-indicator" title="Required">*</span></label>
                                        <AsyncSelect
                                            inputId='regionGeneLocus' // Links label to the input inside react-select
                                            isMulti={false} // We want single selection
                                            cacheOptions // Caches results for same input value
                                            defaultOptions={true} // Load default options on focus/mount
                                            loadOptions={debouncedLoadLocusOptions} // Use the debounced loader
                                            value={selectedLocusOption} // Controlled component using dedicated state
                                            onChange={(selectedOption) => {
                                                // Update both states when an option is selected/cleared
                                                setSelectedLocusOption(selectedOption);
                                                setFormData(prev => ({
                                                    ...prev,
                                                    regionGeneLocus: selectedOption ? selectedOption.value : '' // Update formData with the ID only
                                                }));
                                            }}
                                            placeholder="Type to search for Locus ID/Name..."
                                            isDisabled={loading || !formData.referenceGenome} // Also disable if no reference genome
                                            className="react-select-container" // For specific container styling (add to CSS)
                                            classNamePrefix="react-select"    // Prefix for styling inner elements (add to CSS)
                                            styles={{ /* Add custom styles here or use CSS */ }}
                                            // Provide informative messages
                                            noOptionsMessage={({ inputValue }) => {
                                                if (!formData.referenceGenome) return 'Select Reference Genome first';
                                                return !inputValue ? 'Default options loaded' : 'No results found';
                                            }}
                                            loadingMessage={() => 'Loading...'}
                                        />
                                        {/* Helper text */}
                                        {!formData.referenceGenome && <small className="error-text">Reference Genome selection required to search.</small>}
                                    </div>
                                </div>
                            )}

                              {/* == SNP LIST INPUT == */}
                              {regionInputType === 'snpList' && ( <div className="form-row"> <div className="form-group">
                                  {/* Check Authentication First */}
                                  {!isAuthenticated ? (
                                      <p className="auth-required-note">Note: Login required to use SNP list search.</p>
                                  ) : (
                                      <>
                                          <label htmlFor="snpListSelect">Select Your SNP List <span className="required-indicator" title="Required">*</span></label>
                                          <select
                                              id="snpListSelect"
                                              name="snpList" // This name should match the key in formData
                                              value={formData.snpList} // Controlled component using the ID stored in formData
                                              onChange={handleInputChange} // Use standard handler
                                              disabled={loadingUserLists || !!userListsError || !formData.referenceGenome}
                                              required
                                              className="styled-select" // Add styling as needed
                                          >
                                              {/* Handle loading state */}
                                              {loadingUserLists && <UserListLoadingOption text="Loading Your Lists..." />}

                                              {/* Handle error state */}
                                              {!loadingUserLists && userListsError && <option value="" disabled>Error: {userListsError}</option>}

                                              {/* Handle success state */}
                                              {!loadingUserLists && !userListsError && (
                                                  <>
                                                      <option value="">-- Select Your SNP List --</option>
                                                      {userSnpLists.length > 0 ? (
                                                          renderUserListOptions(userSnpLists)
                                                      ) : (
                                                          <option value="" disabled>No SNP lists found</option>
                                                      )}
                                                  </>
                                              )}
                                          </select>
                                          {!formData.referenceGenome && <small className="error-text">Reference Genome selection required.</small>}
                                      </>
                                  )}
                              </div> </div> )}

                              {/* == LOCUS LIST INPUT == */}
                              {regionInputType === 'locusList' && (
                                 <div className="form-row">
                                     <div className="form-group">
                                         <label htmlFor="locusList">Locus List (one per line) <span className="required-indicator" title="Required">*</span></label>
                                         <textarea
                                             id="locusList" name="locusList" rows="5"
                                             placeholder="Enter Locus IDs, one per line (e.g., LOC_Os...)"
                                             value={formData.locusList} onChange={handleInputChange}
                                             disabled={!isAuthenticated || !formData.referenceGenome} // Also disable if no genome
                                             required
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
                              {/* Disable submit if options are loading, there was an options error preventing core selections, or main search is loading */}
                              <button type="submit" disabled={loading || loadingOptions.referenceGenomes || loadingOptions.varietySets || loadingOptions.snpSets || (!!optionsError && (referenceGenomeOptions.length === 0 || varietySetOptions.length === 0 || snpSetOptions.length === 0))} className="primary-btn">
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
                                                {/* Header row for variety info and positions */}
                                               <th>{searchResults.referenceGenomeName || 'Variety'} Positions</th>
                                               <th>Assay</th>
                                               <th>Accession</th>
                                               <th>Subpop</th>
                                               <th>Dataset</th>
                                               <th>Mismatch</th>
                                               {/* Dynamic headers for each position found */}
                                               {searchResults.positions?.map(pos => ( <th key={pos}>{pos.toLocaleString()}</th> ))}
                                           </tr>
                                       </thead>
                                       <tbody>
                                           {searchResults.varieties.map((variety, index) => {
                                               const isReferenceRow = index === 0; // First row is assumed to be the reference
                                               const referenceAlleleData = searchResults.varieties[0]?.alleles; // Get reference alleles for mismatch comparison

                                               return (
                                                   <tr key={variety.accession || `row-${index}`} className={isReferenceRow ? 'reference-genome-row' : 'variety-row'} >
                                                        {/* Variety Info Columns */}
                                                       <td data-label="Variety/Accession">{isReferenceRow ? `${variety.name} (-)` : variety.name }</td>
                                                       <td data-label="Assay">{variety.assay ?? 'N/A'}</td>
                                                       <td data-label="Accession">{isReferenceRow ? '-' : (variety.accession ?? 'N/A')}</td>
                                                       <td data-label="Subpop">{variety.subpop ?? 'N/A'}</td>
                                                       <td data-label="Dataset">{variety.dataset ?? 'N/A'}</td>
                                                       <td data-label="Mismatch">{variety.mismatch ?? 'N/A'}</td>

                                                       {/* Allele Data Columns */}
                                                       {searchResults.positions?.map(pos => {
                                                           const varietyAllele = variety.alleles?.[pos];
                                                           const displayAllele = varietyAllele ?? '-'; // Display '-' if allele is missing for this position
                                                           let isMismatch = false;

                                                            // Calculate mismatch only for non-reference rows against the reference row
                                                           if (!isReferenceRow && referenceAlleleData) {
                                                               const refAllele = referenceAlleleData[pos];
                                                               // Check if allele exists, is not missing ('-'), reference allele exists, is not unknown ('?'), and they differ
                                                               if (displayAllele !== '-' && refAllele && refAllele !== '?' && displayAllele !== refAllele) {
                                                                    isMismatch = true;
                                                               }
                                                           }
                                                           // Apply mismatch class if needed
                                                           return (
                                                                <td key={`${variety.accession || index}-${pos}`} data-label={pos.toLocaleString()}>
                                                                    <span className={isMismatch ? 'allele-mismatch' : ''}>{displayAllele}</span>
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
                               // Display message if search completed with no results
                               <div className="no-results"> No genotypes found matching criteria. Please adjust search parameters. </div>
                           ) : null /* Don't render anything else while loading */ }
                       </div>
                 )}

            </div> {/* End genotype-search-container */}
        </div> // End page-wrapper
    );
};

export default GenotypeSearch;