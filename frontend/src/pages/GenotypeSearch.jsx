import React, { useState, useEffect, useCallback } from 'react';
import AsyncSelect from 'react-select/async'; // Import AsyncSelect for async dropdowns
import debounce from 'lodash.debounce'; // Import debounce for search input

// Import the API functions (using separate public/private endpoints)
import {
    fetchVarietySets,
    fetchSnpSets,
    fetchVarietySubpopulations,
    fetchChromosomes,
    fetchReferenceGenomes,
    fetchChromosomeRange,
    fetchConsolidatedChromosomeRange,
    autocompleteLocusAPI,
    fetchUserLists, // To get SNP and Variety lists
    searchGenotypesPublic,  // Public search endpoint
    searchGenotypesPrivate // Private search endpoint
} from '../api'; // Adjust path if necessary
import { useAuth } from '../context/AuthContext'; // Import useAuth hook
import { FaDownload } from 'react-icons/fa'; // Import FaDownload for download button
import './GenotypeSearch.css'; // Ensure you link the updated CSS
import { set } from 'mongoose';

// Helper component for loading indicators inside dropdowns
const LoadingOption = ({ text = "Loading..." }) => (
    <option disabled value="">{text}</option>
);

// Helper for user list dropdowns
const UserListLoadingOption = ({ text = "Loading Lists..." }) => (
    <option disabled value="">{text}</option>
);


const GenotypeSearch = () => {
    const { isAuthenticated } = useAuth(); // Get auth status

    // State for controlling which region input UI is shown
    const [regionInputType, setRegionInputType] = useState('range'); // Default to 'range'

    // State for form inputs - includes all possible fields
    const [formData, setFormData] = useState({
        referenceGenome: '',
        varietySet: '',
        snpSet: '',
        varietySubpopulation: '',
        selectedVarietyListId: '', // <--- ADDED for variety list filter
        // Region fields
        regionType: 'range', // Store the selected type for submission
        regionChromosome: '', // Empty string means "Any Chromosome"
        regionStart: '',
        regionEnd: '',
        regionGeneLocus: '', // Holds selected Locus ID from AsyncSelect
        snpList: '',         // Holds selected SNP List ID
        selectedLocusListId: '', // Holds selected Locus List ID
    });

    // State for search results
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false); // Loading for main search submit
    const [searchResults, setSearchResults] = useState(null); // Expecting { referenceGenomeName, positions: [], varieties: [] }

    // --- State for standard dropdown options ---
    const [referenceGenomeOptions, setReferenceGenomeOptions] = useState([]);
    const [varietySetOptions, setVarietySetOptions] = useState([]);
    const [snpSetOptions, setSnpSetOptions] = useState([]);
    const [subpopulationOptions, setSubpopulationOptions] = useState([]);
    const [chromosomeOptions, setChromosomeOptions] = useState([]);

    // --- State for specific input components ---
    const [selectedLocusOption, setSelectedLocusOption] = useState(null); // For AsyncSelect display

    // --- State for user lists ---
    const [userSnpLists, setUserSnpLists] = useState([]);
    const [userVarietyLists, setUserVarietyLists] = useState([]); // <-- ADDED state for variety lists
    const [userLocusLists, setUserLocusLists] = useState([]); // <-- ADDED state for locus lists
    const [loadingUserLists, setLoadingUserLists] = useState(false); // Combined loading state
    const [userListsFetchError, setUserListsFetchError] = useState(''); // Combined error state

    // --- State for dropdown loading status ---
    const [loadingOptions, setLoadingOptions] = useState({
        referenceGenomes: true,
        varietySets: true,
        snpSets: true,
        subpopulations: true,
        chromosomes: true,
    });
    const [optionsError, setOptionsError] = useState(''); // Error for standard dropdowns

    // --- State for Chromosome Range display ---
    const [displayedRange, setDisplayedRange] = useState({ minPosition: null, maxPosition: null });
    const [loadingRange, setLoadingRange] = useState(false);
    const [rangeError, setRangeError] = useState('');


    // --- Effect to fetch standard dropdown data on component mount ---
    useEffect(() => {
        const loadDropdownData = async () => {
            setOptionsError('');
            setLoadingOptions({ referenceGenomes: true, varietySets: true, snpSets: true, subpopulations: true, chromosomes: true });
            console.log("GenotypeSearch: useEffect - Loading standard dropdown data...");
            try {
                const [refGenomeData, varietyData, snpData, subpopData, chromData] = await Promise.all([
                    fetchReferenceGenomes(), fetchVarietySets(), fetchSnpSets(),
                    fetchVarietySubpopulations(), fetchChromosomes()
                ]);
                console.log("GenotypeSearch: useEffect - Received standard dropdown data");
                setReferenceGenomeOptions(Array.isArray(refGenomeData) ? refGenomeData : []);
                setVarietySetOptions(Array.isArray(varietyData) ? varietyData : []);
                setSnpSetOptions(Array.isArray(snpData) ? snpData : []);
                setSubpopulationOptions(Array.isArray(subpopData) ? subpopData : []);
                setChromosomeOptions(Array.isArray(chromData) ? chromData : []);
            } catch (error) {
                console.error("GenotypeSearch: useEffect - Failed to load standard dropdown options:", error);
                setOptionsError(error?.message || "Could not load filter options. Please try refreshing.");
                // Reset options on error
                setReferenceGenomeOptions([]); setVarietySetOptions([]); setSnpSetOptions([]);
                setSubpopulationOptions([]); setChromosomeOptions([]);
            } finally {
                 console.log("GenotypeSearch: useEffect - Finished loading standard dropdown data.");
                 setLoadingOptions({ referenceGenomes: false, varietySets: false, snpSets: false, subpopulations: false, chromosomes: false });
            }
        };
        loadDropdownData();
    }, []); // Run once on mount


    // --- Effect to fetch User Lists (SNP and Variety) when authentication status changes ---
    useEffect(() => {
        const loadUserLists = async () => {
            if (isAuthenticated) {
                console.log("GenotypeSearch: useEffect - Authenticated, loading user lists...");
                setLoadingUserLists(true);
                setUserListsFetchError('');
                setUserSnpLists([]); // Clear previous
                setUserVarietyLists([]); // Clear previous
                setUserLocusLists([]); // Clear previous
                 setFormData(prev => ({
                    ...prev,
                    snpList: '',
                    selectedVarietyListId: '' // <-- Clear variety list selection too
                 }));
                try {
                    const allUserLists = await fetchUserLists();
                    // Filter lists by type
                    const snpLists = allUserLists.filter(list => list.type === 'snp');
                    const varietyLists = allUserLists.filter(list => list.type === 'variety');
                    const locusLists = allUserLists.filter(list => list.type === 'locus'); // <-- ADDED for locus lists
                    setUserSnpLists(snpLists);
                    setUserVarietyLists(varietyLists); // Set variety lists state
                    setUserLocusLists(locusLists); // <-- Set locus lists state
                    console.log(`GenotypeSearch: useEffect - Found ${snpLists.length} SNP lists and ${varietyLists.length} Variety lists.`);
                } catch (error) {
                    console.error("GenotypeSearch: useEffect - Failed to load user lists:", error);
                    setUserListsFetchError(error?.response?.data?.message || error?.message || "Could not load your lists.");
                    setUserSnpLists([]);
                    setUserVarietyLists([]);
                } finally {
                    setLoadingUserLists(false);
                }
            } else {
                 // Clear lists and selections if user logs out or is not authenticated initially
                 console.log("GenotypeSearch: useEffect - Not authenticated, clearing user lists.");
                 setUserSnpLists([]);
                 setUserVarietyLists([]);
                 setUserListsFetchError('');
                 setLoadingUserLists(false);
                 setFormData(prev => ({
                    ...prev,
                    snpList: '',
                    selectedVarietyListId: '', // <-- Clear variety list selection too
                    selectedLocusListId: '' // <-- Clear locus list selection too
                 }));
            }
        };
        loadUserLists();
        // Dependency: Run when authentication status changes
    }, [isAuthenticated]);


    // --- Effect for Chromosome Range Fetch ---
    useEffect(() => {
        const getRange = async () => {
            if (regionInputType === 'range' && formData.referenceGenome) {
                setLoadingRange(true); setRangeError('');
                setDisplayedRange({ minPosition: null, maxPosition: null });
                try {
                    let rangeData;
                    if (formData.regionChromosome) { // Specific chromosome selected
                        console.log(`EFFECT: Fetching specific range for ${formData.regionChromosome}`);
                        rangeData = await fetchChromosomeRange(formData.regionChromosome, formData.referenceGenome);
                        if (!rangeData || rangeData.minPosition === null || rangeData.maxPosition === null) {
                            setRangeError(`No range data found for ${formData.regionChromosome}.`);
                        }
                    } else { // "Any Chromosome" selected
                        console.log("EFFECT: Fetching consolidated range for all chromosomes");
                        rangeData = await fetchConsolidatedChromosomeRange(formData.referenceGenome);
                        if (!rangeData || rangeData.minPosition === null || rangeData.maxPosition === null) {
                            setRangeError(`No consolidated range data found for ${formData.referenceGenome}.`);
                        }
                    }
                    setDisplayedRange(rangeData || { minPosition: null, maxPosition: null }); // Set fetched range or defaults
                } catch (error) {
                    console.error("EFFECT: Error fetching range data", error);
                    setRangeError(`Failed to fetch range data.`);
                    setDisplayedRange({ minPosition: null, maxPosition: null });
                } finally {
                    setLoadingRange(false);
                }
            } else {
                // Clear range info if not applicable
                setDisplayedRange({ minPosition: null, maxPosition: null });
                setRangeError(''); setLoadingRange(false);
            }
        };
        getRange();
        // Dependencies: run when type, genome, or specific chromosome changes
    }, [formData.regionChromosome, formData.referenceGenome, regionInputType]);


    // --- Input change handler for standard inputs/selects ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => {
            const newState = { ...prev, [name]: value };

            // ** Add Conditional Clearing Logic **
            // If Subpopulation is selected (and not empty), clear Variety List selection
            if (name === 'varietySubpopulation' && value !== '') {
                console.log("Subpopulation selected, clearing Variety List filter.");
                newState.selectedVarietyListId = '';
            }
            // If Variety List is selected (and not empty), clear Subpopulation selection
            else if (name === 'selectedVarietyListId' && value !== '') {
                console.log("Variety List selected, clearing Subpopulation filter.");
                newState.varietySubpopulation = '';
            }

            return newState;
        });
    };


    // --- AsyncSelect loader for Gene Locus ---
    const loadLocusOptions = async (inputValue, callback) => {
        const query = inputValue || "";
        if (!formData.referenceGenome) {
            callback([]); return; // Need genome context
        }
        // Allow empty query for default options, but require length otherwise
        if (query && query.trim().length < 2) {
            callback([]); return;
        }
        try {
            console.log(`Autocompleting Loci - q: ${query}, ref: ${formData.referenceGenome}`);
            const results = await autocompleteLocusAPI(query, formData.referenceGenome);
            // Map API results to { value, label } format for react-select
            const options = results.map(item => ({
                value: item._id,     // Use MongoDB _id as the value
                label: item.geneName // Use geneName as the display label
            })).filter(opt => opt.value && opt.label); // Basic validation
            callback(options);
        } catch (error) {
            console.error(`Error fetching locus autocomplete options:`, error);
            callback([]); // Return empty on error
        }
    };

    // Debounced version for Gene Locus AsyncSelect to limit API calls
    const debouncedLoadLocusOptions = useCallback(
        debounce((inputValue, callback) => {
            loadLocusOptions(inputValue, callback);
        } , 500), // 500ms delay
        [formData.referenceGenome] // Recreate if reference genome changes
    );


    // --- Handler for changing the main region input type dropdown ---
     const handleRegionTypeChange = (e) => {
        const newType = e.target.value;
        console.log(`Region type changed to: ${newType}`);
        setRegionInputType(newType); // Update display control state
        // Update formData, clearing irrelevant fields
        setFormData(prev => ({
            ...prev,
            regionType: newType,
            regionChromosome: newType === 'range' ? prev.regionChromosome : '',
            regionStart: newType === 'range' ? prev.regionStart : '',
            regionEnd: newType === 'range' ? prev.regionEnd : '',
            // Clear locus selection display if switching away
            regionGeneLocus: newType === 'geneLocus' ? (selectedLocusOption ? selectedLocusOption.value : '') : '',
            // Clear list selection if switching away
            snpList: newType === 'snpList' ? prev.snpList : '',
            selectedLocusListId: newType === 'locusList' ? prev.selectedLocusListId : '', // Clear locus list selection
            // Keep selectedVarietyListId as it's independent of region type
        }));
        // Clear dependent UI elements
        if (newType !== 'range') {
             setDisplayedRange({ minPosition: null, maxPosition: null });
             setRangeError(''); setLoadingRange(false);
        }
        if (newType !== 'geneLocus') {
            setSelectedLocusOption(null); // Clear AsyncSelect display
        }
        if (newType !== 'snpList') {
             setUserListsFetchError(''); // Keep general error potentially
        }

        if (newType !== 'locusList') {
            // Clear potential errors related to Locus list fetching if switching away
             setUserListsFetchError(''); // Keep general error potentially
        }
    };


    // --- Form submit handler ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // --- Input Validation ---
        let isValid = true;
        let alertMessage = "";
        let requiresAuth = false; // Flag for search types/filters needing login

        // Base validation
        if (!formData.referenceGenome || !formData.varietySet || !formData.snpSet) {
            isValid = false;
            alertMessage = "Reference Genome, Variety Set, and SNP Set are required.";
        }

        // Region-specific validation (only if base validation passes)
        if (isValid) {
            switch (formData.regionType) {
                case 'range':
                    if (!formData.regionStart || !formData.regionEnd) { isValid = false; alertMessage = "Position Start and Position End are required for Range search."; break; }
                    const startPos = parseInt(formData.regionStart, 10); const endPos = parseInt(formData.regionEnd, 10);
                    if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) { isValid = false; alertMessage = "Invalid Start/End position provided for Range search."; break; }
                    // Optional boundary check using displayedRange (only if specific chr selected)
                    if (formData.regionChromosome && displayedRange.minPosition !== null && !rangeError) {
                        if (startPos < displayedRange.minPosition || endPos > displayedRange.maxPosition) { isValid = false; alertMessage = `Position out of range for ${formData.regionChromosome} (${displayedRange.minPosition?.toLocaleString()}-${displayedRange.maxPosition?.toLocaleString()}).`; break; }
                    }
                    break; // Valid range
                case 'geneLocus':
                    if (!formData.regionGeneLocus) { isValid = false; alertMessage = "Gene Locus must be selected."; break; }
                    break; // Valid gene locus selected
                case 'snpList':
                    requiresAuth = true; // Mark as needing auth
                    if (!isAuthenticated) { isValid = false; alertMessage = "Login required for SNP list search."; break; }
                    if (!formData.snpList) { isValid = false; alertMessage = "Please select one of your SNP Lists."; break; }
                    // Optional: Add checks for loading/error state of lists
                    if (loadingUserLists) { isValid = false; alertMessage = "Still loading your lists, please wait."; break; }
                    if (userListsFetchError) { isValid = false; alertMessage = "Could not load lists due to an error, cannot proceed."; break; }
                    // Check if user has lists of this type, preventing submission if none exist
                    if (userSnpLists.length === 0 && !loadingUserLists && !userListsFetchError) { isValid = false; alertMessage = "You have no SNP lists available to select."; break; }
                    break; // Valid SNP list selected
                case 'locusList':
                    requiresAuth = true;
                    if (!isAuthenticated) { isValid = false; alertMessage = "Login required for Locus list search."; break; }
                    // *** VALIDATION: Check if a locus list ID is selected ***
                    if (!formData.selectedLocusListId) { // Check the dropdown selection
                        isValid = false; alertMessage = "Please select one of your Locus Lists."; break;
                    }
                    // Optional checks if list selected
                    if (loadingUserLists) { isValid = false; alertMessage = "Still loading lists..."; break; }
                    if (userListsFetchError) { isValid = false; alertMessage = "Could not load lists."; break; }
                    if (userLocusLists.length === 0 && !loadingUserLists && !userListsFetchError) { isValid = false; alertMessage = "No Locus lists available."; break;}
                    break;
                default:
                    isValid = false;
                    alertMessage = "Invalid Region Type selected.";
            }
        }

        // Determine if overall search requires authentication
        // (It's required if the regionType needs it OR if the optional variety list filter is selected)
        if (!!formData.selectedVarietyListId) { // Check if a variety list ID is selected
            requiresAuth = true;
            if (!isAuthenticated) { // If variety list selected but not logged in
                isValid = false; // Mark as invalid
                alertMessage = "Login is required when filtering by a Variety List.";
            } else if (isValid && loadingUserLists) { // Check if lists are still loading
                 isValid = false; alertMessage = "Still loading your lists, please wait.";
            } else if (isValid && userListsFetchError) { // Check for list loading errors
                 isValid = false; alertMessage = "Could not load lists due to an error, cannot apply variety list filter.";
            } else if (isValid && userVarietyLists.length === 0 && !loadingUserLists && !userListsFetchError) { // Check if user actually has variety lists
                 isValid = false; alertMessage = "You have no Variety lists available to filter by.";
            }
        }


        // --- Stop Submission if Invalid ---
        if (!isValid) {
            alert(alertMessage || "Please check your inputs."); // Show the specific error or a generic message
            return;
        }

        // --- Proceed with API Call ---
        setLoading(true);
        setShowResults(true);
        setSearchResults(null); // Clear previous results
        console.log('Submitting search with criteria:', formData);
        console.log(`Search requires authentication: ${requiresAuth}`); // Log decision

        try {
            let results;
            // ** Call correct API endpoint based on authentication requirement **
            if (requiresAuth) {
                 console.log("Calling PRIVATE search API (/search/private)");
                 // Frontend already confirmed isAuthenticated if requiresAuth is true
                 results = await searchGenotypesPrivate(formData); // Pass the entire formData
            } else { // Public search ('range' or 'geneLocus' WITHOUT variety list filter)
                 console.log("Calling PUBLIC search API (/search/public)");
                 // Pass formData; the public backend controller will ignore selectedVarietyListId if present
                 results = await searchGenotypesPublic(formData);
            }

            // Process successful results
            setSearchResults(results);
            console.log("Search successful, received results:", results);

        } catch (error) {
            // Handle API call errors
            console.error("Genotype search failed:", error);
            setSearchResults(null); // Clear results on error
            // Display error message from API response (via formatErrorForThrowing) or a generic one
            alert(`Search failed: ${error?.message || 'Unknown error during search.'}`);
            // NOTE: The api.js interceptor automatically handles token clearing on 401 errors
        } finally {
            // Ensure loading indicator stops regardless of success or failure
            setLoading(false);
        }
    };

    // --- Reset handler ---
    const handleReset = () => {
        console.log("Resetting form...");
        setRegionInputType('range');
        setFormData({
            referenceGenome: '',
            varietySet: '',
            snpSet: '',
            varietySubpopulation: '',
            selectedVarietyListId: '', // <-- Reset new field
            regionType: 'range',
            regionChromosome: '',
            regionStart: '',
            regionEnd: '',
            regionGeneLocus: '',
            snpList: '',
            selectedLocusListId: '', // <-- Reset new field
        });
        setShowResults(false);
        setSearchResults(null);
        setLoading(false);
        setOptionsError('');
        setSelectedLocusOption(null); // Reset AsyncSelect display
        // Reset range display state
        setDisplayedRange({ minPosition: null, maxPosition: null });
        setLoadingRange(false);
        setRangeError('');
        // Reset user list fetch error state
        setUserListsFetchError('');
        // User lists themselves (userSnpLists, userVarietyLists) don't need resetting here,
        // they are tied to the isAuthenticated state via useEffect.
    };


    // --- Helper function to render standard dropdown options ---
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
                 const valueValue = labelValue; // Submit the label as value for these simple dropdowns
                 return ( <option key={keyValue} value={valueValue}> {labelValue} </option> );
            });
        }
        return <option disabled>Invalid options data</option>;
     };

     // --- Helper function to render User List options ---
     const renderUserListOptions = (lists) => {
         if (!Array.isArray(lists)) return null;
         return lists.map(list => (
             <option key={list._id} value={list._id}>
                 {list.name} ({list.content?.length ?? 0} items) {/* Safely access length */}
             </option>
         ));
     };


    // --- Function to Generate and Download CSV ---
     const handleDownloadCsv = () => {
        if (!isAuthenticated) {
             alert("Please log in to download results."); return;
        }
        if (!searchResults || !searchResults.positions || !searchResults.varieties || searchResults.varieties.length === 0) {
             alert("No results available to download."); return;
        }
        console.log("Generating CSV data...");
        const escapeCsvField = (field) => { /* ... Csv escaping logic ... */
            const stringField = String(field ?? '');
            if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
                const escapedField = stringField.replace(/"/g, '""'); return `"${escapedField}"`;
            } return stringField;
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
                    variety.assay ?? 'N/A', variety.subpop ?? 'N/A', variety.dataset ?? 'N/A',
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
            link.style.visibility = 'hidden'; document.body.appendChild(link);
            link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
            console.log("CSV Download triggered.");
        } catch (error) {
            console.error("Failed to generate or download CSV:", error);
            alert("An error occurred while preparing the download.");
        }
     };

    // --- Component Render ---
    return (
        <div className="page-wrapper">
            <div className="genotype-search-container">
                <div className="search-card">
                    <h2>Search by Genotype</h2>
                    {/* Display error if standard dropdown options failed to load */}
                    {optionsError && (
                        <div className="error-message options-error">
                            <i className="fas fa-exclamation-triangle"></i> <span>{optionsError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="genotype-form">

                        {/* Section 1: Reference Genome */}
                        <div className="form-section">
                            <h3>Reference Genome</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="referenceGenome">Select Reference Genome <span className="required-indicator" title="Required">*</span></label>
                                    <select id="referenceGenome" name="referenceGenome" value={formData.referenceGenome} onChange={handleInputChange} disabled={loadingOptions.referenceGenomes || !!optionsError} required>
                                        {loadingOptions.referenceGenomes ? <LoadingOption text="Loading..." /> : optionsError && referenceGenomeOptions.length === 0 ? <option value="" disabled>Error</option> : <> <option value="">-- Select --</option> {renderOptions(referenceGenomeOptions)} </>}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Datasets */}
                        <div className="form-section">
                            <h3>Datasets</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySet">Variety Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="varietySet" name="varietySet" value={formData.varietySet} onChange={handleInputChange} disabled={loadingOptions.varietySets || !!optionsError} required>
                                        {loadingOptions.varietySets ? <LoadingOption text="Loading..." /> : optionsError && varietySetOptions.length === 0 ? <option value="" disabled>Error</option> : <> <option value="">-- Select --</option> {renderOptions(varietySetOptions)} </>}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="snpSet">SNP Set <span className="required-indicator" title="Required">*</span></label>
                                    <select id="snpSet" name="snpSet" value={formData.snpSet} onChange={handleInputChange} disabled={loadingOptions.snpSets || !!optionsError} required>
                                        {loadingOptions.snpSets ? <LoadingOption text="Loading..." /> : optionsError && snpSetOptions.length === 0 ? <option value="" disabled>Error</option> : <> <option value="">-- Select --</option> {renderOptions(snpSetOptions)} </>}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Varieties (Optional Filters) - Includes new dropdown */}
                        <div className="form-section">
                            <h3>Varieties (Optional Filters)</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="varietySubpopulation">Subpopulation</label>
                                    <select id="varietySubpopulation" name="varietySubpopulation" value={formData.varietySubpopulation} onChange={handleInputChange} disabled={loadingOptions.subpopulations || !!optionsError}>
                                        {/* 1. Default Placeholder Option */}
                                        <option value="">Select Subpopulation</option>

                                        {/* 2. Explicit "All" Option */}
                                        <option value="ALL">All Subpopulations</option>

                                        {/* 3. Dynamic Options (Conditional Rendering) */}
                                        {loadingOptions.subpopulations && <LoadingOption text="Loading..." />}
                                        {!loadingOptions.subpopulations && optionsError && subpopulationOptions.length === 0 && <option value="" disabled>Error loading</option>}
                                        {!loadingOptions.subpopulations && !optionsError && renderOptions(subpopulationOptions)}

                                    </select>
                                </div>
                                {/* --- New Variety List Filter Dropdown --- */}
                                <div className="form-group">
                                     <label htmlFor="varietyListSelect">
                                         Filter by Variety List
                                         {!isAuthenticated && <span className="auth-required-note"> (Login Required)</span>}
                                     </label>
                                     <select
                                         id="varietyListSelect"
                                         name="selectedVarietyListId" // State key
                                         value={formData.selectedVarietyListId} // Control value
                                         onChange={handleInputChange} // Update state
                                         disabled={!isAuthenticated || loadingUserLists || !!userListsFetchError} // Disable logic
                                         className="styled-select"
                                     >
                                         <option value="">-- Select Variety List (Optional) --</option>
                                         {isAuthenticated && loadingUserLists && <UserListLoadingOption text="Loading Lists..." />}
                                         {isAuthenticated && !loadingUserLists && userListsFetchError && <option value="" disabled>Error: {userListsFetchError}</option>}
                                         {isAuthenticated && !loadingUserLists && !userListsFetchError && userVarietyLists.length === 0 && <option value="" disabled>No variety lists found</option>}
                                         {isAuthenticated && !loadingUserLists && !userListsFetchError && userVarietyLists.length > 0 && renderUserListOptions(userVarietyLists)}
                                         {!isAuthenticated && <option value="" disabled>Please log in</option>}
                                     </select>
                                </div>
                                {/* --- End New Dropdown --- */}
                            </div>
                        </div>

                        {/* Section 4: Region */}
                        <div className="form-section">
                            <h3>Region</h3>
                            {/* Region Type Selector */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="regionInputTypeSelect">Search Region By</label>
                                    <select id="regionInputTypeSelect" name="regionType" value={formData.regionType} onChange={handleRegionTypeChange} disabled={loading} className="styled-select">
                                        <option value="range">Range (Chromosome + Position)</option>
                                        <option value="geneLocus">Gene Locus ID</option>
                                        <option value="snpList" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>SNP List { !isAuthenticated ? '(Login Required)' : ''}</option>
                                        <option value="locusList" disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : ""} style={!isAuthenticated ? { color: 'var(--text-muted)', fontStyle: 'italic' } : {}}>Locus List { !isAuthenticated ? '(Login Required)' : ''}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Conditional Inputs based on regionInputType */}
                            {regionInputType === 'range' && ( /* ... Range Inputs & Display ... */ <>
                                 <div className="form-row form-row-three-col">
                                     <div className="form-group">
                                        <label htmlFor="regionChromosome">Chromosome</label>
                                        <select id="regionChromosome" name="regionChromosome" value={formData.regionChromosome} onChange={handleInputChange} disabled={loadingOptions.chromosomes || !!optionsError || !formData.referenceGenome} >
                                             {loadingOptions.chromosomes ? <LoadingOption text="Loading..." /> : optionsError && chromosomeOptions.length === 0 ? <option value="" disabled>Error</option> : <> <option value="">Any Chromosome</option> {renderOptions(chromosomeOptions)} </> }
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
                                 <div className="form-row range-display"> <div className="form-group">
                                      {regionInputType === 'range' && formData.referenceGenome && (<>
                                          {loadingRange && ( <span className="range-info loading">Loading range...</span> )}
                                          {rangeError && !loadingRange && ( <span className="range-info error">{rangeError}</span> )}
                                          {displayedRange.minPosition !== null && displayedRange.maxPosition !== null && !loadingRange && !rangeError && (
                                              <span className="range-info">{formData.regionChromosome ? 'Avail. Range:' : 'Consolidated Range:'} {' '}{displayedRange.minPosition.toLocaleString()} - {displayedRange.maxPosition.toLocaleString()}</span> )}
                                      </>)}
                                      {!(regionInputType === 'range' && formData.referenceGenome) && <span>&nbsp;</span>}
                                  </div> </div>
                             </>)}

                            {regionInputType === 'geneLocus' && ( /* ... Gene Locus AsyncSelect ... */ <div className="form-row"> <div className="form-group">
                                <label htmlFor="regionGeneLocus">Gene Locus ID <span className="required-indicator" title="Required">*</span></label>
                                <AsyncSelect inputId='regionGeneLocus' isMulti={false} cacheOptions defaultOptions={true} loadOptions={debouncedLoadLocusOptions} value={selectedLocusOption} onChange={(selectedOption) => { setSelectedLocusOption(selectedOption); setFormData(prev => ({ ...prev, regionGeneLocus: selectedOption ? selectedOption.value : '' })); }} placeholder="Type to search..." isDisabled={loading || !formData.referenceGenome} className="react-select-container" classNamePrefix="react-select" noOptionsMessage={({ inputValue }) => !formData.referenceGenome ? 'Select Genome' : !inputValue ? 'Start typing...' : 'No results'} loadingMessage={() => 'Loading...'} />
                                {!formData.referenceGenome && <small className="error-text">Ref Genome required.</small>}
                              </div> </div>)}

                            {regionInputType === 'snpList' && ( /* ... SNP List Dropdown ... */ <div className="form-row"> <div className="form-group">
                                  {!isAuthenticated ? ( <p className="auth-required-note">Login required.</p> ) : ( <>
                                      <label htmlFor="snpListSelect">Select Your SNP List <span className="required-indicator" title="Required">*</span></label>
                                      <select id="snpListSelect" name="snpList" value={formData.snpList} onChange={handleInputChange} disabled={loadingUserLists || !!userListsFetchError || !formData.referenceGenome} required className="styled-select">
                                          {loadingUserLists && <UserListLoadingOption text="Loading..." />}
                                          {!loadingUserLists && userListsFetchError && <option value="" disabled>Error: {userListsFetchError}</option>}
                                          {!loadingUserLists && !userListsFetchError && (<>
                                               <option value="">-- Select --</option>
                                               {userSnpLists.length > 0 ? renderUserListOptions(userSnpLists) : <option value="" disabled>No SNP lists found</option> }
                                           </>)}
                                      </select>
                                      {!formData.referenceGenome && <small className="error-text">Ref Genome required.</small>}
                                  </> )}
                              </div> </div>)}

                              {regionInputType === 'locusList' && (
                                 <div className="form-row">
                                     <div className="form-group">
                                         {/* Check Authentication First */}
                                         {!isAuthenticated ? (
                                             <p className="auth-required-note">Note: Login required to use saved Locus Lists.</p>
                                         ) : (
                                             <>
                                                 <label htmlFor="locusListSelect">
                                                     Select Your Locus List <span className="required-indicator" title="Required">*</span>
                                                 </label>
                                                 <select
                                                     id="locusListSelect"
                                                     name="selectedLocusListId" // State key to update
                                                     value={formData.selectedLocusListId} // Controlled by state
                                                     onChange={handleInputChange} // Update state
                                                     disabled={!isAuthenticated || loadingUserLists || !!userListsFetchError || !formData.referenceGenome}
                                                     required // Make selection required for this region type
                                                     className="styled-select"
                                                 >
                                                     {/* Default Option */}
                                                     <option value="">-- Select Your Locus List --</option>

                                                     {/* Conditional Options */}
                                                     {loadingUserLists && <UserListLoadingOption text="Loading Lists..." />}
                                                     {!loadingUserLists && userListsFetchError && <option value="" disabled>Error: {userListsFetchError}</option>}
                                                     {!loadingUserLists && !userListsFetchError && userLocusLists.length === 0 && <option value="" disabled>No locus lists found</option>}
                                                     {/* Render options if loaded successfully */}
                                                     {!loadingUserLists && !userListsFetchError && userLocusLists.length > 0 && (
                                                         renderUserListOptions(userLocusLists) // Reuse helper
                                                     )}
                                                     {/* Fallback if somehow disabled but shouldn't be */}
                                                     {!isAuthenticated && <option value="" disabled>Please log in</option>}
                                                 </select>
                                                  {!formData.referenceGenome && <small className="error-text">Reference Genome selection required.</small>}
                                             </>
                                         )}
                                     </div>
                                 </div>
                             )}
                        </div>

                        {/* Section 5: Actions */}
                        <div className="form-actions">
                            <button type="button" onClick={handleReset} className="secondary-btn" disabled={loading}>Reset</button>
                            <button type="submit" disabled={loading || loadingOptions.referenceGenomes || loadingOptions.varietySets || loadingOptions.snpSets || (!!optionsError && (!formData.referenceGenome || !formData.varietySet || !formData.snpSet))} className="primary-btn">
                                {loading ? ( <> <span className="spinner"></span> Searching... </> ) : 'Search'}
                            </button>
                        </div>
                    </form>
                </div> {/* End search-card */}

                {/* Section 6: Results Area */}
                {showResults && (
                    <div className="results-card">
                        <div className="results-area-header">
                            <h3>Search Results {searchResults?.referenceGenomeName ? `for ${searchResults.referenceGenomeName}` : ''}</h3>
                            {!loading && searchResults?.positions && searchResults.varieties?.length > 0 && (
                                <button className="secondary-btn download-btn" onClick={handleDownloadCsv} disabled={!isAuthenticated} title={!isAuthenticated ? "Login required" : "Download CSV"}>
                                    <FaDownload /> Download CSV
                                </button>
                            )}
                        </div>
                        {loading ? ( <div className="loading-indicator"> <span className="spinner"></span> Loading results...</div> )
                        : searchResults?.positions && searchResults.varieties?.length > 0 ? ( <div className="results-table-container"> <table className="results-table">
                            <thead><tr>
                                <th>{searchResults.referenceGenomeName || 'Variety'} Positions</th>
                                <th>Assay</th><th>Accession</th><th>Subpop</th><th>Dataset</th><th>Mismatch</th>
                                {searchResults.positions.map(pos => ( <th key={pos}>{pos.toLocaleString()}</th> ))}
                            </tr></thead>
                            <tbody>{searchResults.varieties.map((variety, index) => {
                                 const isReferenceRow = index === 0; const refAlleles = searchResults.varieties[0]?.alleles;
                                 return ( <tr key={variety.accession || `row-${index}`} className={isReferenceRow ? 'reference-genome-row' : 'variety-row'}>
                                     <td data-label="Variety/Accession">{isReferenceRow ? `${variety.name} (-)` : variety.name }</td>
                                     <td data-label="Assay">{variety.assay ?? 'N/A'}</td>
                                     <td data-label="Accession">{isReferenceRow ? '-' : (variety.accession ?? 'N/A')}</td>
                                     <td data-label="Subpop">{variety.subpop ?? 'N/A'}</td>
                                     <td data-label="Dataset">{variety.dataset ?? 'N/A'}</td>
                                     <td data-label="Mismatch">{variety.mismatch ?? 'N/A'}</td>
                                     {searchResults.positions.map(pos => {
                                         const varAllele = variety.alleles?.[pos]; const displayAllele = varAllele ?? '-'; let isMismatch = false;
                                         if (!isReferenceRow && refAlleles) { const refAllele = refAlleles[pos]; if (displayAllele !== '-' && refAllele && refAllele !== '?' && displayAllele !== refAllele) { isMismatch = true; } }
                                         return ( <td key={`${variety.accession || index}-${pos}`} data-label={pos.toLocaleString()}><span className={isMismatch ? 'allele-mismatch' : ''}>{displayAllele}</span></td> );
                                     })}
                                 </tr>);
                             })}</tbody>
                        </table></div> )
                        : !loading ? ( <div className="no-results"> No genotypes found matching criteria.</div> )
                        : null }
                    </div>
                )}

            </div> {/* End genotype-search-container */}
        </div> // End page-wrapper
    );
};

export default GenotypeSearch;