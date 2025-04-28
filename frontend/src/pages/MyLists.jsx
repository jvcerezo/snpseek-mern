import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner'; // Assuming sonner is used for notifications

import './MyLists.css';

const initialListsData = {
  variety: ['IR64', 'Azucena', 'Nipponbare', '93-11'],
  snp: ['snp12345', 'snp_chr1_1000', 'rs56789'],
  locus: ['LOC_Os01g01010', 'LOC_Os04g59090', 'Sub1A'],
};

// --- Helper Icons (Inline SVG) ---
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


// --- MyLists Component ---
const MyLists = () => {
    const [lists, setLists] = useState(initialListsData);
    const [newItemInputs, setNewItemInputs] = useState({
        variety: '',
        snp: '',
        locus: '',
    });
    const [isLoading, setIsLoading] = useState(false); // For simulated API calls

    // --- Handlers ---

    const handleInputChange = (listType, value) => {
        setNewItemInputs(prev => ({ ...prev, [listType]: value }));
    };

    const handleAddItem = (listType) => {
        const newItem = newItemInputs[listType].trim();
        if (!newItem) {
            toast.warning(`Please enter a value for ${listType}.`);
            return;
        }

        // Basic validation: Check if item already exists (case-insensitive)
        if (lists[listType].some(item => item.toLowerCase() === newItem.toLowerCase())) {
            toast.warning(`"${newItem}" already exists in the ${listType} list.`);
            return;
        }

        // Simulate API call to add item
        setIsLoading(true);
        console.log(`Simulating add item: ${newItem} to ${listType}`);
        setTimeout(() => {
            setLists(prevLists => ({
                ...prevLists,
                [listType]: [...prevLists[listType], newItem],
            }));
            setNewItemInputs(prev => ({ ...prev, [listType]: '' })); // Clear input
            toast.success(`"${newItem}" added to ${listType} list.`);
            setIsLoading(false);
        }, 500); // Simulate network delay
    };

    const handleRemoveItem = (listType, itemToRemove) => {
        // Simulate API call to remove item
        setIsLoading(true);
        console.log(`Simulating remove item: ${itemToRemove} from ${listType}`);
        setTimeout(() => {
            setLists(prevLists => ({
                ...prevLists,
                [listType]: prevLists[listType].filter(item => item !== itemToRemove),
            }));
            toast.success(`"${itemToRemove}" removed from ${listType} list.`);
            setIsLoading(false);
        }, 500); // Simulate network delay
    };

    // Handle Enter key press in input fields
    const handleInputKeyPress = (e, listType) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent default form submission if wrapped in form
            handleAddItem(listType);
        }
    };

    // --- Render Helper ---
    const renderListSection = (listType, title) => (
        <div className="phg-card my-list-card"> {/* Use theme card style */}
            <div className="phg-card-header">
                <h2 className="phg-card-title">{title} List</h2>
            </div>
            <div className="phg-card-content">
                {/* Add Item Form */}
                <div className="add-item-form">
                    <input
                        type="text"
                        className="phg-input add-item-input" // Use theme input style
                        placeholder={`Add new ${title}...`}
                        value={newItemInputs[listType]}
                        onChange={(e) => handleInputChange(listType, e.target.value)}
                        onKeyPress={(e) => handleInputKeyPress(e, listType)}
                        disabled={isLoading}
                        aria-label={`Add new ${title}`}
                    />
                    <button
                        className="phg-button phg-button-primary add-item-button" // Use theme button style
                        onClick={() => handleAddItem(listType)}
                        disabled={isLoading || !newItemInputs[listType].trim()}
                        aria-label={`Add ${title}`}
                    >
                        <PlusIcon className="button-icon" />
                        Add
                    </button>
                </div>

                {/* List Items */}
                <ul className="item-list">
                    {lists[listType].length === 0 ? (
                        <li className="list-item-empty">No items in this list yet.</li>
                    ) : (
                        lists[listType].map((item, index) => (
                            <li key={`${listType}-${index}-${item}`} className="list-item">
                                <span className="item-text">{item}</span>
                                <button
                                    className="phg-button remove-item-button"
                                    onClick={() => handleRemoveItem(listType, item)}
                                    disabled={isLoading}
                                    aria-label={`Remove ${item}`}
                                >
                                    <TrashIcon className="button-icon" />
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );

    // --- Main Render ---
    return (
        <div className="my-lists-container">
            <Toaster position="top-right" richColors theme="dark" />
            <h1 className="phg-page-title">My Lists</h1>

            <div className="lists-grid">
                {renderListSection('variety', 'Variety')}
                {renderListSection('snp', 'SNP')}
                {renderListSection('locus', 'Locus')}
            </div>
             {/* Add some spacing at the bottom */}
             <div style={{ height: '2rem' }}></div>
        </div>
    );
};

export default MyLists;
