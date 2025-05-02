import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash.debounce';

// Import necessary API functions
import {
    fetchUserLists,
    createListAPI,
    // deleteListAPI, updateListAPI, // Placeholders
    searchVarietiesAPI,
    searchContigsAPI,     // Used by SNP range input logic (fetching chromosomes)
    autocompleteLocusAPI, // Dedicated autocomplete for 'locus' type list
    resolveItemIdsAPI,    // Real API function for name resolution
    fetchReferenceGenomes,// Real function for fetching genome options
    fetchChromosomes,     // Needed for SNP list creation
    fetchChromosomeRange  // Needed for SNP list creation
} from '../api'; // Adjust path as necessary

import './MyLists.css'; // Ensure styles for component, modal, and react-select are included

// --- Helper Icons ---
const PlusIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const PencilIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);
const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const EmptyBoxIcon = ({ className = "w-12 h-12 text-[var(--phg-color-text-muted)]" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
);
// Simple spinner for indicating item name loading
const LoadingSpinnerIcon = ({ className = "w-4 h-4 animate-spin" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const AddToListIcon = ({ className = "w-5 h-5" }) => ( // Icon for Add Range button
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);
const RemoveFromListIcon = ({ className = "w-4 h-4" }) => ( // Icon for Remove Range button
     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


// --- Configuration for List Types and Autocomplete ---
// !! IMPORTANT: Adjust 'idField' and 'nameField' to match your actual API responses !!
const LIST_TYPES = [
    { key: 'variety', title: 'Variety', searchFn: searchVarietiesAPI, idField: '_id', nameField: 'name' },
    { key: 'snp', title: 'SNP (Ranges)', searchFn: null, idField: null, nameField: null },
    { key: 'locus', title: 'Locus', searchFn: autocompleteLocusAPI, idField: '_id', nameField: 'geneName' },
];

// --- Default empty form state ---
const defaultNewListData = { name: '', description: '', content: [], referenceGenome: '' };


// --- MyLists Component ---
const MyLists = () => {
    // --- State ---
    const [userLists, setUserLists] = useState([]);
    const [isLoadingLists, setIsLoadingLists] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [selectedType, setSelectedType] = useState(LIST_TYPES[0].key);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListData, setNewListData] = useState({ ...defaultNewListData });
    const [referenceGenomeOptions, setReferenceGenomeOptions] = useState([]);
    const [isLoadingRefGenomes, setIsLoadingRefGenomes] = useState(false);
    const [chromosomeOptions, setChromosomeOptions] = useState([]);
    const [isLoadingChromosomes, setIsLoadingChromosomes] = useState(false);
    const [modalSelectedChromosome, setModalSelectedChromosome] = useState('');
    const [modalChromosomeRange, setModalChromosomeRange] = useState({ minPosition: null, maxPosition: null });
    const [modalIsLoadingRange, setModalIsLoadingRange] = useState(false);
    const [modalRangeError, setModalRangeError] = useState('');
    const [modalSnpStart, setModalSnpStart] = useState('');
    const [modalSnpEnd, setModalSnpEnd] = useState('');
    const [resolvedNames, setResolvedNames] = useState({});
    const [fetchingItemIds, setFetchingItemIds] = useState(new Set());

    // --- Effect to Fetch User Lists ---
    useEffect(() => {
        const loadLists = async () => {
            setIsLoadingLists(true); setFetchError(null);
            try {
                const fetchedLists = await fetchUserLists();
                setUserLists(Array.isArray(fetchedLists) ? fetchedLists : []);
            } catch (error) { const errorMsg = error?.response?.data?.message || error?.message || "Failed to load lists."; setFetchError(errorMsg); toast.error(`Error loading lists: ${errorMsg}`); setUserLists([]); }
            finally { setIsLoadingLists(false); }
        };
        loadLists();
    }, []);

    // --- Effect to Fetch Reference Genomes ---
    useEffect(() => {
        const loadReferenceGenomes = async () => {
            if (referenceGenomeOptions.length > 0 || isLoadingRefGenomes) return;
            setIsLoadingRefGenomes(true);
            console.log("Fetching reference genomes for modal context...");
            try {
                const genomes = await fetchReferenceGenomes(); // Using real API call
                setReferenceGenomeOptions(Array.isArray(genomes) ? genomes : []);
                console.log("Loaded reference genomes:", genomes);
            } catch (error) { console.error("Error fetching reference genomes for modal:", error); toast.error("Could not load reference genomes."); setReferenceGenomeOptions([]); }
            finally { setIsLoadingRefGenomes(false); }
        };
        loadReferenceGenomes();
    }, [isLoadingRefGenomes, referenceGenomeOptions.length]);

    // --- Effect: Fetch names for items in VISIBLE lists ---
     useEffect(() => {
        if (isLoadingLists || userLists.length === 0) return;
        const listsToShow = userLists.filter(list => list.type === selectedType);
        if (listsToShow.length === 0) return;

        const idsToFetchNow = { varietyIds: new Set(), locusIds: new Set() };
        let needsFetch = false;

        listsToShow.forEach(list => {
            if ((list.type === 'variety' || list.type === 'locus') && list.content) {
                list.content.forEach(id => {
                    if (id && !resolvedNames[id] && !fetchingItemIds.has(id)) {
                         if(list.type === 'variety') idsToFetchNow.varietyIds.add(id);
                         if(list.type === 'locus') idsToFetchNow.locusIds.add(id);
                         needsFetch = true;
                    }
                });
            }
        });

        const payload = { varietyIds: Array.from(idsToFetchNow.varietyIds), locusIds: Array.from(idsToFetchNow.locusIds) };
        const allIdsBeingFetched = [...payload.varietyIds, ...payload.locusIds];

        if (needsFetch && allIdsBeingFetched.length > 0) {
             const fetchNames = async () => {
                 setFetchingItemIds(prev => new Set([...prev, ...allIdsBeingFetched]));
                 console.log(`Workspaceing names for ${allIdsBeingFetched.length} new IDs...`);
                 try {
                     // --- Using the REAL API function ---
                     const resolvedMap = await resolveItemIdsAPI(payload);
                     // --- --------------------------- ---
                     if (resolvedMap && typeof resolvedMap === 'object') {
                         setResolvedNames(prev => ({ ...prev, ...resolvedMap }));
                     } else { console.warn("Received unexpected format from resolveItemIdsAPI"); }
                 } catch (error) { console.error("Error resolving item names in component effect:", error); }
                 finally {
                     setFetchingItemIds(prev => { const next = new Set(prev); allIdsBeingFetched.forEach(id => next.delete(id)); return next; });
                 }
             };
             fetchNames();
        }
    }, [userLists, selectedType, isLoadingLists]);

    // --- Effect to Fetch Chromosomes for SNP modal ---
    useEffect(() => {
        if (!showCreateModal || newListData.type !== 'snp' || !newListData.referenceGenome) {
            setChromosomeOptions([]); setModalSelectedChromosome(''); return;
        }
        const loadChromosomes = async () => {
            setIsLoadingChromosomes(true); setModalSelectedChromosome('');
            try {
                const chroms = await fetchChromosomes(/* newListData.referenceGenome */);
                setChromosomeOptions(Array.isArray(chroms) ? chroms : []);
            } catch (error) { console.error("Error fetching chromosomes:", error); toast.error("Could not load chromosomes."); setChromosomeOptions([]); }
            finally { setIsLoadingChromosomes(false); }
        };
        loadChromosomes();
    }, [newListData.referenceGenome, newListData.type, showCreateModal]);

    // --- Effect to Fetch Chromosome Range for SNP modal ---
    useEffect(() => {
        if (!showCreateModal || newListData.type !== 'snp' || !newListData.referenceGenome || !modalSelectedChromosome) {
            setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalIsLoadingRange(false); return;
        }
        const getRange = async () => {
            setModalIsLoadingRange(true); setModalRangeError(''); setModalChromosomeRange({ minPosition: null, maxPosition: null });
            try {
                const rangeData = await fetchChromosomeRange(modalSelectedChromosome, newListData.referenceGenome);
                if (rangeData && rangeData.minPosition !== null && rangeData.maxPosition !== null) { setModalChromosomeRange(rangeData); }
                else { setModalRangeError(`No range data found.`); }
            } catch (error) { console.error("Error fetching chromosome range:", error); setModalRangeError('Failed to fetch range.'); }
            finally { setModalIsLoadingRange(false); }
        };
        getRange();
    }, [modalSelectedChromosome, newListData.referenceGenome, newListData.type, showCreateModal]);


    // --- Action Handlers ---
    const handleOpenCreateModal = () => { setNewListData({ ...defaultNewListData, type: selectedType }); setModalSelectedChromosome(''); setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalSnpStart(''); setModalSnpEnd(''); setShowCreateModal(true); };
    const handleCloseCreateModal = () => { if (!isSubmitting) setShowCreateModal(false); };
    const handleNewListDataChange = (e) => { setNewListData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleModalChromosomeChange = (e) => { setModalSelectedChromosome(e.target.value); setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalSnpStart(''); setModalSnpEnd(''); };
    const handleModalSnpStartChange = (e) => { setModalSnpStart(e.target.value); };
    const handleModalSnpEndChange = (e) => { setModalSnpEnd(e.target.value); };
    const handleAddRangeToList = () => {
        const fullRange = modalChromosomeRange; const chr = modalSelectedChromosome; const startInput = modalSnpStart.trim(); const endInput = modalSnpEnd.trim();
        if (!chr || fullRange.minPosition === null) { toast.error("Select chromosome and wait for range."); return; }
        if (startInput === '' || endInput === '') { toast.error("Enter Start and End positions."); return; }
        const startNum = parseInt(startInput, 10); const endNum = parseInt(endInput, 10);
        if (isNaN(startNum) || isNaN(endNum)) { toast.error("Positions must be numbers."); return; }
        if (startNum < 0) { toast.error("Start position cannot be negative."); return; }
        if (startNum > endNum) { toast.error("Start cannot be greater than End."); return; }
        if (startNum < fullRange.minPosition || endNum > fullRange.maxPosition) { toast.error(`Positions must be within available range (${fullRange.minPosition.toLocaleString()} - ${fullRange.maxPosition.toLocaleString()}).`); return; }
        const rangeString = `${chr}:${startNum}-${endNum}`;
        if (newListData.content.includes(rangeString)) { toast.warning(`Range already added.`); return; }
        setNewListData(prev => ({ ...prev, content: [...prev.content, rangeString] }));
        setModalSnpStart(''); setModalSnpEnd(''); toast.success(`Range added.`);
    };
     const handleRemoveRangeFromList = (rangeToRemove) => { setNewListData(prev => ({ ...prev, content: prev.content.filter(range => range !== rangeToRemove) })); };
    const handleCreateList = async (e) => {
        e.preventDefault(); setIsSubmitting(true);
        toast.promise(
             async () => {
                 if (!newListData.name || !newListData.type || newListData.content.length === 0 ) { throw new Error('List name and content are required.'); }
                 let contentPayload = newListData.type === 'snp' ? newListData.content : newListData.content.map(option => option.value);
                 const payload = { name: newListData.name.trim(), description: newListData.description.trim(), type: newListData.type, content: contentPayload };
                 const createdList = await createListAPI(payload);
                 return createdList;
             }, { loading: 'Creating list...', success: (createdList) => { setUserLists(prev => [createdList, ...prev]); setSelectedType(createdList.type); handleCloseCreateModal(); return `List "${createdList.name}" created.`; }, error: (err) => err?.response?.data?.message || err?.message || 'Failed to create list.', finally: () => { setIsSubmitting(false); }, }
         );
    };
    const handleUpdateList = async (listId, currentListData) => { toast.info("Edit functionality not yet implemented."); };
    const handleDeleteList = async (listId, listName) => { if (window.confirm(`Delete "${listName}"?`)) { toast.info("Delete functionality not yet implemented."); } };

    // --- Render Helper for List Cards ---
     const renderSingleList = (list) => {
         if (!list) return null; const listContent = list.content || [];
         return (
             <div key={list._id} className="phg-card my-list-card">
                 <div className="phg-card-header list-card-header">
                    <div className='list-title-group'>
                        <h3 className="phg-card-title list-title" title={list.name}>{list.name}</h3>
                        <span className="list-header-item-count">{listContent.length} Item{listContent.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="list-actions"> <button className="phg-button list-action-button" onClick={() => handleUpdateList(list._id, list)} disabled={isSubmitting} title="Edit List"><PencilIcon className="button-icon" /></button> <button className="phg-button list-action-button remove-item-button" onClick={() => handleDeleteList(list._id, list.name)} disabled={isSubmitting} title="Delete List"><TrashIcon className="button-icon" /></button> </div>
                 </div>
                 <div className="phg-card-content">
                     {list.description && <p className="list-description">{list.description}</p>}
                     <p className="list-type">Type: <span className="list-type-value">{list.type}</span></p>
                     <div className="item-list-container">
                         <ul className="item-list">
                             {listContent.length === 0 ? ( <li className="list-item-empty">No items in this list.</li> )
                              : ( listContent.slice(0, 10).map((itemId, index) => {
                                    let contentToShow = itemId; let isLoadingName = false; let nameFound = false;
                                    if ((list.type === 'variety' || list.type === 'locus') && itemId) {
                                        const resolvedName = resolvedNames[itemId];
                                        if (resolvedName) { contentToShow = resolvedName; nameFound = true; }
                                        else if (fetchingItemIds.has(itemId)) { isLoadingName = true; contentToShow = <LoadingSpinnerIcon />; }
                                    }
                                    const titleAttribute = list.type === 'snp' ? `Range: ${itemId}` : `ID: ${itemId}`;
                                    return ( <li key={`${list._id}-item-${index}`} className="list-item" title={titleAttribute}> <span className={`item-text ${isLoadingName ? 'item-text-loading' : ''}`}>{contentToShow}</span> </li> );
                                })
                             )}
                             {listContent.length > 10 && ( <li className="list-item-more">... and {listContent.length - 10} more</li> )}
                         </ul>
                     </div>
                 </div>
             </div>
         );
      };

    // --- Helper to Filter Lists by Selected Type ---
    const getFilteredLists = () => userLists.filter(list => list.type === selectedType);

    // --- Autocomplete Loader Function ---
    const loadAutocompleteOptions = async (inputValue, listTypeData, callback) => {
        const query = inputValue || "";
        try {
            let results = []; const referenceGenome = newListData.referenceGenome;
            if (listTypeData.key === 'locus' && !referenceGenome && !query) { callback([]); return; }
            switch (listTypeData.key) {
                case 'variety': results = await listTypeData.searchFn(query); break;
                case 'snp': results = []; break; // Not used by AsyncSelect
                case 'locus':
                    if (!referenceGenome && query) toast.error("Select Reference Genome for Locus search.");
                    results = await listTypeData.searchFn( query, referenceGenome || undefined ); break;
                default: results = [];
            }
            let options = [];
            if (listTypeData.key === 'snp') { options = []; } // SNP doesn't use this mapping
            else { options = results.map(item => ({ value: item[listTypeData.idField], label: item[listTypeData.nameField] })).filter(opt => opt.value && opt.label); }
            callback(options);
        } catch (error) { console.error(`Error fetching options for ${listTypeData.key}:`, error); callback([]); }
    };

    // --- Debounced Autocomplete Loader ---
    const debouncedLoadOptions = useCallback(debounce((inputValue, listTypeData, callback) => {
        loadAutocompleteOptions(inputValue, listTypeData, callback);
    } , 500), [newListData.type, newListData.referenceGenome] );

    // --- Main Component Render ---
    return (
        <div className="my-lists-container">
            <Toaster position="top-right" richColors theme="dark" />
            {/* Header */}
            <div className="my-lists-header">
                 <h1 className="phg-page-title">My Lists</h1>
                 <button className="phg-button phg-button-primary create-list-button" onClick={handleOpenCreateModal} disabled={isSubmitting || isLoadingLists}> <PlusIcon className="button-icon" /> Create New List </button>
            </div>
            {/* Loading/Error States */}
            {isLoadingLists && <div className="loading-indicator centered-message"><div className="spinner"></div><p>Loading your lists...</p></div>}
            {fetchError && !isLoadingLists && <div className="error-message fetch-error-message centered-message"><i className="fas fa-exclamation-triangle error-icon"></i><p>Error loading lists:</p><p><i>{fetchError}</i></p></div>}

            {/* Main Content Area */}
            {!isLoadingLists && !fetchError && (
                 <div className="lists-display-area">
                    {/* Tab Navigation */}
                    <div className="list-type-navigation">
                         {LIST_TYPES.map(typeInfo => {
                             const count = userLists.filter(list => list.type === typeInfo.key).length;
                             return ( <button key={typeInfo.key} className={`list-type-tab ${selectedType === typeInfo.key ? 'active' : ''}`} onClick={() => setSelectedType(typeInfo.key)} disabled={isSubmitting}> {typeInfo.title} <span className="tab-count">({count})</span> </button> );
                        })}
                    </div>
                    {/* Tab Content Area */}
                    <div className="list-tab-content">
                        {(() => {
                             const filteredLists = getFilteredLists();
                             if (userLists.length === 0) return <div className="no-lists-message centered-message"><EmptyBoxIcon /><p>You haven't created any lists yet.</p><button className="phg-button phg-button-secondary" onClick={handleOpenCreateModal}>Create Your First List</button></div>;
                             if (filteredLists.length === 0) { const currentTitle = LIST_TYPES.find(t => t.key === selectedType)?.title || 'selected'; return <div className="no-lists-message centered-message"><EmptyBoxIcon /><p>No {currentTitle} lists found.</p></div>; }
                             return <div className="lists-grid">{filteredLists.map(list => renderSingleList(list))}</div>;
                         })()}
                    </div>
                 </div>
            )}

            {/* Create List Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={handleCloseCreateModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New {LIST_TYPES.find(t => t.key === newListData.type)?.title || ''} List</h2>
                            <button onClick={handleCloseCreateModal} className="modal-close-button" aria-label="Close modal" disabled={isSubmitting}> <CloseIcon /> </button>
                        </div>
                        <form onSubmit={handleCreateList} className="modal-form">
                            {/* Name */}
                            <div className="form-group">
                                <label htmlFor="list-name">List Name <span className="required-indicator">*</span></label>
                                <input type="text" id="list-name" name="name" className="phg-input" value={newListData.name} onChange={handleNewListDataChange} required maxLength={100} disabled={isSubmitting} />
                            </div>
                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="list-description">Description</label>
                                <textarea id="list-description" name="description" rows={2} className="phg-input" value={newListData.description} onChange={handleNewListDataChange} maxLength={500} disabled={isSubmitting}></textarea>
                            </div>
                            {/* Reference Genome Context (Show for Locus OR SNP) */}
                            {(newListData.type === 'locus' || newListData.type === 'snp') && (
                                 <div className="form-group">
                                    <label htmlFor="list-referenceGenome">Reference Genome Context <span className="required-indicator">*</span></label>
                                    <select id="list-referenceGenome" name="referenceGenome" className="phg-input" value={newListData.referenceGenome || ''} onChange={handleNewListDataChange} required disabled={isSubmitting || isLoadingRefGenomes}>
                                         <option value="">-- Select Genome --</option>
                                         {referenceGenomeOptions.map(genome => ( <option key={genome} value={genome}>{genome}</option> ))}
                                    </select>
                                    {isLoadingRefGenomes && <small>Loading genomes...</small>}
                                    {!newListData.referenceGenome && <small className="error-text">Required for {newListData.type === 'locus' ? 'Locus search' : 'Chromosome selection'}.</small>}
                                 </div>
                            )}
                            {/* Content Input Area */}
                            <div className="form-group">
                                <label>List Content <span className="required-indicator">*</span></label>
                                {/* == VARIETY or LOCUS Autocomplete == */}
                                {(newListData.type === 'variety' || newListData.type === 'locus') && (
                                    <AsyncSelect
                                        defaultOptions={true} inputId={`list-content-${newListData.type}`} // More specific ID
                                        isMulti cacheOptions key={newListData.type + newListData.referenceGenome}
                                        loadOptions={(inputValue, callback) => { const typeData = LIST_TYPES.find(t => t.key === newListData.type); if (typeData) debouncedLoadOptions(inputValue, typeData, callback); else callback([]); }}
                                        value={newListData.content}
                                        onChange={(selectedOptions) => setNewListData(prev => ({ ...prev, content: selectedOptions || [] })) }
                                        placeholder={`Type to search & add ${newListData.type} items...`}
                                        isDisabled={isSubmitting || (newListData.type === 'locus' && !newListData.referenceGenome)}
                                        className="react-select-container" classNamePrefix="react-select" styles={{ /* Use styles from CSS */ }}
                                        noOptionsMessage={({ inputValue }) => { if (newListData.type === 'locus' && !newListData.referenceGenome && !inputValue) return 'Select Reference Genome first'; return !inputValue ? 'Default options loaded' : 'No results found'; }}
                                        loadingMessage={() => 'Loading...'}
                                    />
                                )}
                                 {/* == SNP (Range) Input Area == */}
                                {newListData.type === 'snp' && (
                                     <div className="snp-range-input-area">
                                        {/* Chromosome Selector */}
                                        <div className="form-group">
                                             <label htmlFor="modal-chromosome">Chromosome <span className="required-indicator">*</span></label>
                                             <select id="modal-chromosome" name="modalChromosome" className="phg-input" value={modalSelectedChromosome} onChange={handleModalChromosomeChange} required disabled={isSubmitting || !newListData.referenceGenome || isLoadingChromosomes}>
                                                 <option value="">-- Select Chromosome --</option>
                                                 {chromosomeOptions.map(chrom => ( <option key={chrom} value={chrom}>{chrom}</option> ))}
                                             </select>
                                             {isLoadingChromosomes && <small>Loading chromosomes...</small>}
                                             {!modalSelectedChromosome && newListData.referenceGenome && <small className="error-text">Selection required.</small>}
                                         </div>
                                         {/* Range Display */}
                                         <div className="range-display-modal">
                                             {modalIsLoadingRange && <small className='loading-text'>Loading available range...</small>}
                                             {modalRangeError && <small className="error-text">{modalRangeError}</small>}
                                             {modalChromosomeRange.minPosition !== null && !modalIsLoadingRange && !modalRangeError && ( <small className='info-text'>Available Range: {modalChromosomeRange.minPosition.toLocaleString()} - {modalChromosomeRange.maxPosition.toLocaleString()}</small> )}
                                         </div>
                                        {/* Start/End Position Inputs */}
                                        <div className="form-row snp-pos-inputs">
                                            <div className="form-group">
                                                <label htmlFor="modal-snp-start">Start Position <span className="required-indicator">*</span></label>
                                                <input type="number" id="modal-snp-start" name="modalSnpStart" className="phg-input" value={modalSnpStart} onChange={handleModalSnpStartChange} placeholder="e.g., 1" min={modalChromosomeRange.minPosition ?? 0} max={modalSnpEnd || (modalChromosomeRange.maxPosition ?? undefined)} required disabled={isSubmitting || !modalSelectedChromosome || modalIsLoadingRange || modalRangeError} />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="modal-snp-end">End Position <span className="required-indicator">*</span></label>
                                                <input type="number" id="modal-snp-end" name="modalSnpEnd" className="phg-input" value={modalSnpEnd} onChange={handleModalSnpEndChange} placeholder={`e.g., ${modalChromosomeRange.maxPosition?.toLocaleString() || '100000'}`} min={modalSnpStart || (modalChromosomeRange.minPosition ?? 0)} max={modalChromosomeRange.maxPosition ?? undefined} required disabled={isSubmitting || !modalSelectedChromosome || modalIsLoadingRange || modalRangeError} />
                                            </div>
                                        </div>
                                        {/* Add Range Button */}
                                        <button type="button" className="phg-button phg-button-secondary add-range-button" onClick={handleAddRangeToList} disabled={isSubmitting || modalIsLoadingRange || !modalSelectedChromosome || modalChromosomeRange.minPosition === null || !modalSnpStart || !modalSnpEnd} title="Add the specified Start/End range to the list below"> <AddToListIcon className="button-icon"/> Add Specified Range </button>
                                        {/* Display Current Ranges Added */}
                                        <div className="added-ranges-container item-list-container">
                                            <h4 className="item-list-title">Added Ranges ({newListData.content.length})</h4>
                                            <ul className="item-list added-ranges-list">
                                                {newListData.content.length === 0 ? ( <li className="list-item-empty">No ranges added yet.</li> )
                                                 : ( newListData.content.map((rangeStr, index) => (
                                                         <li key={index} className="list-item">
                                                             <span className="item-text">{rangeStr}</span>
                                                             <button type="button" onClick={() => handleRemoveRangeFromList(rangeStr)} className="phg-button remove-range-button" disabled={isSubmitting} title={`Remove ${rangeStr}`} aria-label={`Remove ${rangeStr}`}> <RemoveFromListIcon /> </button>
                                                         </li>
                                                     ))
                                                )}
                                            </ul>
                                        </div>
                                        <small>Select chromosome, enter start/end within available range, then Add.</small>
                                     </div>
                                )}
                            </div>
                            {/* Modal Actions */}
                            <div className="modal-actions">
                                <button type="button" className="phg-button phg-button-secondary" onClick={handleCloseCreateModal} disabled={isSubmitting}> Cancel </button>
                                <button type="submit" className="phg-button phg-button-primary" disabled={isSubmitting}> {isSubmitting ? 'Creating...' : 'Create List'} </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div> // End my-lists-container
    );
};

export default MyLists;