import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import AsyncSelect from 'react-select/async';
import debounce from 'lodash.debounce';

// Import necessary API functions
import {
    fetchUserLists,
    createListAPI,
    updateListAPI,          // Function for updating
    deleteListAPI,          // Function for deleting
    searchVarietiesAPI,
    searchContigsAPI,
    autocompleteLocusAPI,
    resolveItemIdsAPI,      // Real function for name resolution
    fetchReferenceGenomes,  // Real function for fetching genome options
    fetchChromosomes,
    fetchChromosomeRange
} from '../api'; // Adjust path as necessary

import './MyLists.css'; // Ensure styles for component, modal, and react-select are included

// --- Helper Icons ---
const PlusIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> );
const TrashIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg> );
const PencilIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg> );
const CloseIcon = ({ className = "w-6 h-6" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> );
const EmptyBoxIcon = ({ className = "w-12 h-12 text-[var(--phg-color-text-muted)]" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg> );
const LoadingSpinnerIcon = ({ className = "w-4 h-4 animate-spin" }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> );
const AddToListIcon = ({ className = "w-5 h-5" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const RemoveFromListIcon = ({ className = "w-4 h-4" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const ChevronDownIcon = ({ className = "w-4 h-4 inline-block ml-1" }) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>);


// --- Configuration for List Types ---
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
    const [modalMode, setModalMode] = useState('create');
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({ ...defaultNewListData });
    const [editingListId, setEditingListId] = useState(null);
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
    const [showSnpAddRangeControls, setShowSnpAddRangeControls] = useState(false);
    const [resolvedNames, setResolvedNames] = useState({});
    const [fetchingItemIds, setFetchingItemIds] = useState(new Set());

    // --- Effect to Fetch User Lists ---
    useEffect(() => {
        const loadLists = async () => {
            setIsLoadingLists(true); setFetchError(null);
            try { const fetchedLists = await fetchUserLists(); setUserLists(Array.isArray(fetchedLists) ? fetchedLists : []); }
            catch (error) { const errorMsg = error?.response?.data?.message || error?.message || "Failed to load lists."; setFetchError(errorMsg); toast.error(`Error loading lists: ${errorMsg}`); setUserLists([]); }
            finally { setIsLoadingLists(false); }
        };
        loadLists();
    }, []);

    // --- Effect to Fetch Reference Genomes ---
    useEffect(() => {
        const loadReferenceGenomes = async () => {
            if (referenceGenomeOptions.length > 0 || isLoadingRefGenomes) return; setIsLoadingRefGenomes(true);
            try { const genomes = await fetchReferenceGenomes(); setReferenceGenomeOptions(Array.isArray(genomes) ? genomes : []); }
            catch (error) { console.error("Error fetching reference genomes for modal:", error); toast.error("Could not load reference genomes."); setReferenceGenomeOptions([]); }
            finally { setIsLoadingRefGenomes(false); }
        };
        loadReferenceGenomes();
    }, [isLoadingRefGenomes, referenceGenomeOptions.length]);

    // --- Effect: Fetch names for items in VISIBLE lists ---
     useEffect(() => {
        if (isLoadingLists || userLists.length === 0) return;
        const listsToShow = userLists.filter(list => list.type === selectedType); if (listsToShow.length === 0) return;
        const idsToFetchNow = { varietyIds: new Set(), locusIds: new Set() }; let needsFetch = false;
        listsToShow.forEach(list => { if ((list.type === 'variety' || list.type === 'locus') && list.content) { list.content.forEach(id => { if (id && !resolvedNames[id] && !fetchingItemIds.has(id)) { if(list.type === 'variety') idsToFetchNow.varietyIds.add(id); if(list.type === 'locus') idsToFetchNow.locusIds.add(id); needsFetch = true; } }); } });
        const payload = { varietyIds: Array.from(idsToFetchNow.varietyIds), locusIds: Array.from(idsToFetchNow.locusIds) }; const allIdsBeingFetched = [...payload.varietyIds, ...payload.locusIds];
        if (needsFetch && allIdsBeingFetched.length > 0) {
             const fetchNames = async () => {
                 setFetchingItemIds(prev => new Set([...prev, ...allIdsBeingFetched])); console.log(`Workspaceing names for ${allIdsBeingFetched.length} new IDs...`);
                 try { const resolvedMap = await resolveItemIdsAPI(payload); if (resolvedMap && typeof resolvedMap === 'object') { setResolvedNames(prev => ({ ...prev, ...resolvedMap })); } else { console.warn("Received unexpected format from resolveItemIdsAPI"); } }
                 catch (error) { console.error("Error resolving item names:", error); }
                 finally { setFetchingItemIds(prev => { const next = new Set(prev); allIdsBeingFetched.forEach(id => next.delete(id)); return next; }); }
             };
             fetchNames();
        }
    }, [userLists, selectedType, isLoadingLists]);

    // --- Effect to Fetch Chromosomes for SNP modal ---
    useEffect(() => {
        if (!showModal || modalData.type !== 'snp' || !modalData.referenceGenome) { setChromosomeOptions([]); setModalSelectedChromosome(''); return; }
        const loadChromosomes = async () => {
            setIsLoadingChromosomes(true); setModalSelectedChromosome('');
            try { const chroms = await fetchChromosomes(); setChromosomeOptions(Array.isArray(chroms) ? chroms : []); }
            catch (error) { console.error("Error fetching chromosomes:", error); toast.error("Could not load chromosomes."); setChromosomeOptions([]); }
            finally { setIsLoadingChromosomes(false); }
        };
        loadChromosomes();
    }, [modalData.referenceGenome, modalData.type, showModal]);

    // --- Effect to Fetch Chromosome Range for SNP modal ---
    useEffect(() => {
        if (!showModal || modalData.type !== 'snp' || !modalData.referenceGenome || !modalSelectedChromosome) { setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalIsLoadingRange(false); return; }
        const getRange = async () => {
            setModalIsLoadingRange(true); setModalRangeError(''); setModalChromosomeRange({ minPosition: null, maxPosition: null });
            try { const rangeData = await fetchChromosomeRange(modalSelectedChromosome, modalData.referenceGenome); if (rangeData && rangeData.minPosition !== null && rangeData.maxPosition !== null) { setModalChromosomeRange(rangeData); } else { setModalRangeError(`No range data found.`); } }
            catch (error) { console.error("Error fetching chromosome range:", error); setModalRangeError('Failed to fetch range.'); }
            finally { setModalIsLoadingRange(false); }
        };
        getRange();
    }, [modalSelectedChromosome, modalData.referenceGenome, modalData.type, showModal]);


    // --- Action Handlers ---
    const handleOpenCreateModal = () => { setModalMode('create'); setEditingListId(null); const type = selectedType; setModalData({ ...defaultNewListData, type: type }); setModalSelectedChromosome(''); setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalSnpStart(''); setModalSnpEnd(''); setShowSnpAddRangeControls(type === 'snp'); setShowModal(true); };
    const handleOpenEditModal = (listToEdit) => { setModalMode('edit'); setEditingListId(listToEdit._id); let initialContent = []; if (listToEdit.type === 'snp') { initialContent = [...(listToEdit.content || [])]; } else if (listToEdit.content?.length > 0) { initialContent = listToEdit.content.map(id => ({ value: id, label: resolvedNames[id] || id })); } setModalData({ name: listToEdit.name || '', description: listToEdit.description || '', type: listToEdit.type, content: initialContent, referenceGenome: listToEdit.referenceGenome || '' }); setModalSelectedChromosome(''); setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalSnpStart(''); setModalSnpEnd(''); setShowSnpAddRangeControls(false); setShowModal(true); };
    const handleCloseModal = () => { if (!isSubmitting) { setShowModal(false); setEditingListId(null); } };
    const handleModalDataChange = (e) => { setModalData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleModalChromosomeChange = (e) => { setModalSelectedChromosome(e.target.value); setModalChromosomeRange({ minPosition: null, maxPosition: null }); setModalRangeError(''); setModalSnpStart(''); setModalSnpEnd(''); };
    const handleModalSnpStartChange = (e) => { setModalSnpStart(e.target.value); };
    const handleModalSnpEndChange = (e) => { setModalSnpEnd(e.target.value); };
    const handleAddRangeToList = () => {
        const fullRange = modalChromosomeRange; const chr = modalSelectedChromosome; const startInput = modalSnpStart.trim(); const endInput = modalSnpEnd.trim();
        if (!chr || fullRange.minPosition === null) { toast.error("Select chromosome and wait for range."); return; }
        if (startInput === '' || endInput === '') { toast.error("Enter Start and End positions."); return; }
        const startNum = parseInt(startInput, 10); const endNum = parseInt(endInput, 10);
        if (isNaN(startNum) || isNaN(endNum) || startNum < 0 || startNum > endNum || startNum < fullRange.minPosition || endNum > fullRange.maxPosition) { toast.error(`Invalid range. Must be within ${fullRange.minPosition.toLocaleString()}-${fullRange.maxPosition.toLocaleString()}.`); return; }
        const rangeString = `${chr}:${startNum}-${endNum}`;
        if (modalData.content.includes(rangeString)) { toast.warning(`Range already added.`); return; }
        setModalData(prev => ({ ...prev, content: [...prev.content, rangeString] }));
        setModalSnpStart(''); setModalSnpEnd(''); setModalSelectedChromosome(''); toast.success(`Range added.`);
    };
    const handleRemoveRangeFromList = (rangeToRemove) => { setModalData(prev => ({ ...prev, content: prev.content.filter(range => range !== rangeToRemove) })); };
    const handleSubmitModal = async (e) => { e.preventDefault(); if (modalMode === 'create') await handleCreateSubmit(); else if (modalMode === 'edit') await handleUpdateSubmit(); };
    const handleCreateSubmit = async () => {
         setIsSubmitting(true);
         toast.promise(
             async () => { if (!modalData.name || !modalData.type || modalData.content.length === 0 ) { throw new Error('List name and content are required.'); } let contentPayload = modalData.type === 'snp' ? modalData.content : modalData.content.map(option => option.value); const payload = { name: modalData.name.trim(), description: modalData.description.trim(), type: modalData.type, content: contentPayload }; const createdList = await createListAPI(payload); return createdList; },
             { loading: 'Creating list...', success: (createdList) => { setUserLists(prev => [createdList, ...prev]); setSelectedType(createdList.type); handleCloseModal(); return `List "${createdList.name}" created.`; }, error: (err) => err?.response?.data?.message || err?.message || 'Failed to create list.', finally: () => { setIsSubmitting(false); }, }
         );
    };
    const handleUpdateSubmit = async () => {
        if (!editingListId) return; setIsSubmitting(true);
        toast.promise(
             async () => { if (!modalData.name || modalData.content.length === 0 ) { throw new Error('List name and content are required.'); } let contentPayload = modalData.type === 'snp' ? modalData.content : modalData.content.map(option => option.value); const updatePayload = { name: modalData.name.trim(), description: modalData.description.trim(), content: contentPayload }; const updatedList = await updateListAPI(editingListId, updatePayload); return updatedList; },
             { loading: 'Updating list...', success: (updatedList) => { setUserLists(prevLists => prevLists.map(list => list._id === editingListId ? updatedList : list )); handleCloseModal(); return `List "${updatedList.name}" updated.`; }, error: (err) => err?.response?.data?.message || err?.message || 'Failed to update list.', finally: () => { setIsSubmitting(false); }, }
        );
    };
    // Delete Handler (Implemented)
    const handleDeleteList = async (listId, listName) => {
        if (!window.confirm(`Are you sure you want to delete the list "${listName}"? This action cannot be undone.`)) { return; }
        setIsSubmitting(true);
        toast.promise(
             async () => { await deleteListAPI(listId); return { listId, listName }; },
             { loading: `Deleting list "${listName}"...`, success: (data) => { setUserLists(prevLists => prevLists.filter(list => list._id !== data.listId)); return `List "${data.listName}" deleted.`; }, error: (err) => err?.response?.data?.message || err?.message || 'Failed to delete list.', finally: () => { setIsSubmitting(false); }, }
         );
    };

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
                    <div className="list-actions">
                        <button className="phg-button list-action-button" onClick={() => handleOpenEditModal(list)} disabled={isSubmitting} title="Edit List"><PencilIcon className="button-icon" /></button>
                        <button className="phg-button list-action-button remove-item-button" onClick={() => handleDeleteList(list._id, list.name)} disabled={isSubmitting} title="Delete List"><TrashIcon className="button-icon" /></button>
                    </div>
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

    // --- Helper to Filter Lists ---
    const getFilteredLists = () => userLists.filter(list => list.type === selectedType);

    // --- Autocomplete Loader Function ---
    const loadAutocompleteOptions = async (inputValue, listTypeData, callback) => {
        const query = inputValue || "";
        try {
            let results = []; const referenceGenome = modalData.referenceGenome;
            if (listTypeData.key === 'locus' && !referenceGenome && !query) { callback([]); return; }
            switch (listTypeData.key) {
                case 'variety': results = await listTypeData.searchFn(query); break;
                case 'snp': results = []; break;
                case 'locus':
                    if (!referenceGenome && query) toast.error("Select Reference Genome for Locus search.");
                    results = await listTypeData.searchFn( query, referenceGenome || undefined ); break;
                default: results = [];
            }
            let options = [];
            if (listTypeData.key === 'snp') { options = []; }
            else { options = results.map(item => ({ value: item[listTypeData.idField], label: item[listTypeData.nameField] })).filter(opt => opt.value && opt.label); }
            callback(options);
        } catch (error) { console.error(`Error fetching options for ${listTypeData.key}:`, error); callback([]); }
    };

    // --- Debounced Autocomplete Loader ---
    const debouncedLoadOptions = useCallback(debounce((inputValue, listTypeData, callback) => {
        loadAutocompleteOptions(inputValue, listTypeData, callback);
    } , 500), [modalData.type, modalData.referenceGenome] );

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

            {/* Create/Edit List Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{modalMode === 'edit' ? 'Edit' : 'Create New'} {LIST_TYPES.find(t => t.key === modalData.type)?.title || ''} List</h2>
                            <button onClick={handleCloseModal} className="modal-close-button" aria-label="Close modal" disabled={isSubmitting}> <CloseIcon /> </button>
                        </div>
                        <form onSubmit={handleSubmitModal} className="modal-form">
                            {/* Name */}
                            <div className="form-group">
                                <label htmlFor="list-name">List Name <span className="required-indicator">*</span></label>
                                <input type="text" id="list-name" name="name" className="phg-input" value={modalData.name} onChange={handleModalDataChange} required maxLength={100} disabled={isSubmitting} />
                            </div>
                            {/* Description */}
                            <div className="form-group">
                                <label htmlFor="list-description">Description</label>
                                <textarea id="list-description" name="description" rows={2} className="phg-input" value={modalData.description} onChange={handleModalDataChange} maxLength={500} disabled={isSubmitting}></textarea>
                            </div>
                            {/* Type Display (Readonly) */}
                             <div className="form-group">
                                <label>List Type</label>
                                <input type="text" className="phg-input" value={LIST_TYPES.find(t => t.key === modalData.type)?.title || modalData.type} readOnly disabled style={{ fontStyle: 'italic', backgroundColor: 'var(--phg-color-background-disabled)' }}/>
                             </div>
                            {/* Reference Genome Context (Show for Locus OR SNP) */}
                            {(modalData.type === 'locus' || modalData.type === 'snp') && (
                                 <div className="form-group">
                                    <label htmlFor="list-referenceGenome">Reference Genome Context <span className="required-indicator">*</span></label>
                                    <select id="list-referenceGenome" name="referenceGenome" className="phg-input" value={modalData.referenceGenome || ''} onChange={handleModalDataChange} required disabled={isSubmitting || isLoadingRefGenomes}>
                                         <option value="">-- Select Genome --</option>
                                         {referenceGenomeOptions.map(genome => ( <option key={genome} value={genome}>{genome}</option> ))}
                                    </select>
                                    {isLoadingRefGenomes && <small>Loading genomes...</small>}
                                    {!modalData.referenceGenome && <small className="error-text">Required for {modalData.type === 'locus' ? 'Locus search' : 'Chromosome selection'}.</small>}
                                 </div>
                            )}
                            {/* Content Input Area */}
                            <div className="form-group">
                                <label>List Content <span className="required-indicator">*</span></label>
                                {/* == VARIETY or LOCUS Autocomplete == */}
                                {(modalData.type === 'variety' || modalData.type === 'locus') && (
                                    <AsyncSelect
                                        defaultOptions={true} inputId={`list-content-${modalData.type}`}
                                        isMulti cacheOptions key={modalData.type + modalData.referenceGenome}
                                        loadOptions={(inputValue, callback) => { const typeData = LIST_TYPES.find(t => t.key === modalData.type); if (typeData) debouncedLoadOptions(inputValue, typeData, callback); else callback([]); }}
                                        value={modalData.content}
                                        onChange={(selectedOptions) => setModalData(prev => ({ ...prev, content: selectedOptions || [] })) }
                                        placeholder={`Type to search & add ${modalData.type} items...`}
                                        isDisabled={isSubmitting || (modalData.type === 'locus' && !modalData.referenceGenome)}
                                        className="react-select-container" classNamePrefix="react-select" styles={{ /* Use styles from CSS */ }}
                                        noOptionsMessage={({ inputValue }) => { if (modalData.type === 'locus' && !modalData.referenceGenome && !inputValue) return 'Select Reference Genome first'; return !inputValue ? 'Default options loaded' : 'No results found'; }}
                                        loadingMessage={() => 'Loading...'}
                                    />
                                )}
                                 {/* == SNP (Range) Input Area == */}
                                {modalData.type === 'snp' && (
                                     <div className="snp-range-input-area">
                                        {/* Button to show Add Range controls only in Edit mode */}
                                        {modalMode === 'edit' && !showSnpAddRangeControls && (
                                            <button type="button" className="phg-button phg-button-secondary show-add-range-button" onClick={() => setShowSnpAddRangeControls(true)} disabled={isSubmitting} style={{marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5em'}}>
                                               Show Controls to Add New Range <ChevronDownIcon />
                                            </button>
                                        )}
                                        {/* Conditionally render Add Range controls */}
                                        {showSnpAddRangeControls && (
                                            <div className="add-range-controls">
                                                <div className="form-group">
                                                    <label htmlFor="modal-chromosome">Chromosome <span className="required-indicator">*</span></label>
                                                    <select id="modal-chromosome" name="modalChromosome" className="phg-input" value={modalSelectedChromosome} onChange={handleModalChromosomeChange} disabled={isSubmitting || !modalData.referenceGenome || isLoadingChromosomes}> <option value="">-- Select Chromosome --</option> {chromosomeOptions.map(chrom => ( <option key={chrom} value={chrom}>{chrom}</option> ))} </select>
                                                    {isLoadingChromosomes && <small>Loading chromosomes...</small>}
                                                    {!modalSelectedChromosome && modalData.referenceGenome && <small className="error-text">Selection required to add new range.</small>}
                                                </div>
                                                <div className="range-display-modal">
                                                    {modalIsLoadingRange && <small className='loading-text'>Loading available range...</small>}
                                                    {modalRangeError && <small className="error-text">{modalRangeError}</small>}
                                                    {modalChromosomeRange.minPosition !== null && !modalIsLoadingRange && !modalRangeError && ( <small className='info-text'>Available Range: {modalChromosomeRange.minPosition.toLocaleString()} - {modalChromosomeRange.maxPosition.toLocaleString()}</small> )}
                                                </div>
                                                <div className="form-row snp-pos-inputs">
                                                    <div className="form-group">
                                                        <label htmlFor="modal-snp-start">Start <span className="required-indicator">*</span></label>
                                                        <input type="number" id="modal-snp-start" name="modalSnpStart" className="phg-input" value={modalSnpStart} onChange={handleModalSnpStartChange} min={modalChromosomeRange.minPosition ?? 0} max={modalSnpEnd || (modalChromosomeRange.maxPosition ?? undefined)} disabled={isSubmitting || !modalSelectedChromosome || modalIsLoadingRange || modalRangeError} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label htmlFor="modal-snp-end">End <span className="required-indicator">*</span></label>
                                                        <input type="number" id="modal-snp-end" name="modalSnpEnd" className="phg-input" value={modalSnpEnd} onChange={handleModalSnpEndChange} min={modalSnpStart || (modalChromosomeRange.minPosition ?? 0)} max={modalChromosomeRange.maxPosition ?? undefined} disabled={isSubmitting || !modalSelectedChromosome || modalIsLoadingRange || modalRangeError} />
                                                    </div>
                                                </div>
                                                <button type="button" className="phg-button phg-button-secondary add-range-button" onClick={handleAddRangeToList} disabled={isSubmitting || modalIsLoadingRange || !modalSelectedChromosome || modalChromosomeRange.minPosition === null || !modalSnpStart || !modalSnpEnd} title="Add the specified Start/End range to the list below"> <AddToListIcon className="button-icon"/> Add Specified Range </button>
                                                <hr className="snp-controls-divider" />
                                            </div>
                                        )}
                                        {/* Added Ranges List (Always Visible for SNP) */}
                                        <div className="added-ranges-container item-list-container" style={{ marginTop: showSnpAddRangeControls ? '1rem' : '0' }}>
                                            <h4 className="item-list-title"> {modalMode === 'edit' ? 'Current Ranges in List' : 'Added Ranges'} ({modalData.content.length}) </h4>
                                            <ul className="item-list added-ranges-list">
                                                {modalData.content.length === 0 ? ( <li className="list-item-empty">No ranges {modalMode === 'edit' ? 'currently in list' : 'added yet'}.</li> )
                                                 : ( modalData.content.map((rangeStr, index) => ( <li key={index} className="list-item"> <span className="item-text">{rangeStr}</span> <button type="button" onClick={() => handleRemoveRangeFromList(rangeStr)} className="phg-button remove-range-button" disabled={isSubmitting} title={`Remove ${rangeStr}`}> <RemoveFromListIcon /> </button> </li> )) )}
                                            </ul>
                                        </div>
                                        {/* Helper Text */}
                                        <small className="modal-help-text">
                                            {modalMode === 'edit' ? 'Use the red minus buttons above to remove ranges. Click "Save Changes" when done.' : 'Select chromosome, enter start/end, then click "Add Specified Range".'}
                                            {modalMode === 'edit' && !showSnpAddRangeControls && ' To add new ranges, click the button above.'}
                                        </small>
                                     </div>
                                )}
                            </div>
                            {/* Modal Actions */}
                            <div className="modal-actions">
                                <button type="button" className="phg-button phg-button-secondary" onClick={handleCloseModal} disabled={isSubmitting}> Cancel </button>
                                <button type="submit" className="phg-button phg-button-primary" disabled={isSubmitting}> {isSubmitting ? (modalMode === 'edit' ? 'Saving...' : 'Creating...') : (modalMode === 'edit' ? 'Save Changes' : 'Create List')} </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div> // End my-lists-container
    );
};

export default MyLists;