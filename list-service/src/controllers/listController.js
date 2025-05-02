import List from '../models/List.js';
import mongoose from 'mongoose';
import axios from 'axios'; // Import axios
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables
const GENOMIC_SERVICE_URL = process.env.GENOMIC_SERVICE_URL_INTERNAL || process.env.GENOMIC_SERVICE_URL || 'http://localhost:5002'; // Example default
const GENETIC_FEATURE_SERVICE_URL = process.env.GENETIC_FEATURE_SERVICE_URL_INTERNAL || process.env.GENETIC_FEATURE_SERVICE_URL || 'http://localhost:5001'; // Example default

/**
 * @desc    Get all lists belonging to the authenticated user
 * @route   GET /api/lists/mine
 * @access  Private (requires user to be logged in)
 */
export const getMyLists = async (req, res) => {
    // Assuming auth middleware adds user info to req.user
    if (!req.user || !req.user.id) {
        // This check might be redundant if auth middleware already handles it
        return res.status(401).json({ message: 'Not authorized, no user data found.' });
    }

    const userId = req.user.id; // Get user ID from the request object
    console.log(`CONTROLLER: Fetching lists for user ID: ${userId}`);

    try {
        // Find all lists where the userId field matches the logged-in user's ID
        // Sort by creation date descending (newest first) - optional
        const lists = await List.find({ userId: userId }).sort({ createdAt: -1 });

        if (!lists) {
             // find() returns [] if no documents match, not null/undefined usually.
             // So, checking for empty array is more appropriate.
             console.log(`CONTROLLER: No lists found for user ID: ${userId}`);
             return res.status(200).json([]); // Return empty array if none found
        }

        console.log(`CONTROLLER: Found ${lists.length} lists for user ID: ${userId}`);
        res.status(200).json(lists); // Send the array of lists

    } catch (error) {
        console.error(`❌ Error fetching lists for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error fetching lists.' });
    }
};

/**
 * @desc    Create a new list for the authenticated user (Simplified)
 * @route   POST /api/lists
 * @access  Private
 * @body    { name: string, type: string, content: string[], description?: string } // Updated body expectation
 */
export const createList = async (req, res) => {
    // Extract data - NO LONGER expecting snpSet or varietySet
    const { name, description, type, content } = req.body;
    const userId = req.user.id;

    // --- Simplified Validation ---
    // Only name, type, content are strictly required now
    if (!name || !type || !content) {
        // Updated error message
        return res.status(400).json({ message: 'Missing required fields: name, type, and content are required.' });
    }
    const allowedTypes = ['variety', 'snp', 'locus'];
    if (!allowedTypes.includes(type.toLowerCase())) {
         return res.status(400).json({ message: `Invalid list type. Allowed types are: ${allowedTypes.join(', ')}.` });
    }
    if (!Array.isArray(content) || content.length === 0 || !content.every(item => typeof item === 'string')) {
         return res.status(400).json({ message: 'Content must be a non-empty array of strings.' });
    }
    const trimmedContent = content.map(item => item.trim()).filter(item => item.length > 0);
    if (trimmedContent.length === 0) {
         return res.status(400).json({ message: 'Content cannot be empty after trimming whitespace.' });
    }
    // --- End Validation ---

    console.log(`CONTROLLER: Attempting to create list "${name}" (type: ${type}) for user ${userId}`);

    try {
        const newList = new List({
            name: name.trim(),
            description: description ? description.trim() : '', // Handle optional description
            type: type.toLowerCase(),
            content: trimmedContent,
            userId: userId,
        });

        const createdList = await newList.save();
        console.log(`CONTROLLER: Successfully created list ID: ${createdList._id}`);
        res.status(201).json(createdList);

    } catch (error) {
        console.error(`❌ Error creating list "${name}" for user ${userId}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation failed.", errors: messages });
        }
        res.status(500).json({ message: 'Server error creating list.' });
    }
};

/**
 * @desc    Resolve multiple IDs (Variety, Locus) to names by calling other services.
 * @route   POST /resolve-ids (relative to List Service base, e.g. /api/lists/resolve-ids via gateway)
 * @access  Private (inherits from router)
 * @body    { varietyIds: string[], locusIds: string[] }
 * @returns { resolved: { [id: string]: string } }
 */
export const resolveIds = async (req, res) => {
    const { varietyIds = [], locusIds = [] } = req.body;

    if (!Array.isArray(varietyIds) || !Array.isArray(locusIds)) {
        return res.status(400).json({ message: 'Invalid input: IDs must be provided in arrays.' });
    }

    const uniqueVarietyIds = [...new Set(varietyIds.filter(id => id))];
    const uniqueLocusIds = [...new Set(locusIds.filter(id => id))];

    console.log(`LIST SERVICE Controller: Resolving IDs - Varieties: ${uniqueVarietyIds.length}, Loci: ${uniqueLocusIds.length}`);

    if (uniqueVarietyIds.length === 0 && uniqueLocusIds.length === 0) {
        return res.status(200).json({ resolved: {} }); // Nothing to resolve
    }

    try {
        const promises = [];
        const resolvedMap = {};

        // --- Call Genomic Service for Varieties ---
        if (uniqueVarietyIds.length > 0) {
            const varietyLookupUrl = `${GENOMIC_SERVICE_URL}/genotype/varieties/lookup`; // Use correct path
            console.log(`Calling Genomic Service: ${varietyLookupUrl}?ids=${uniqueVarietyIds.join(',')}`);
            promises.push(
                axios.get(varietyLookupUrl, { params: { ids: uniqueVarietyIds.join(',') } })
                     .then(response => {
                        // Expecting array like [{ _id: '...', name: '...' }]
                        if (Array.isArray(response.data)) {
                            response.data.forEach(v => {
                                if(v._id && v.name) resolvedMap[v._id.toString()] = v.name; // Use _id as key
                            });
                        }
                     })
                     .catch(err => console.error("Error calling Genomic Service (Varieties):", err.message)) // Log error but don't fail all
            );
        }

        // --- Call Genetic Features Service for Loci ---
        if (uniqueLocusIds.length > 0) {
            const locusLookupUrl = `${GENETIC_FEATURE_SERVICE_URL}/features/lookup`; // Use correct path
             console.log(`Calling Feature Service: ${locusLookupUrl}?ids=${uniqueLocusIds.join(',')}`);
            promises.push(
                 axios.get(locusLookupUrl, { params: { ids: uniqueLocusIds.join(',') } })
                      .then(response => {
                          // Expecting array like [{ _id: '...', geneName: '...' }] (assuming we use _id now)
                          if (Array.isArray(response.data)) {
                              response.data.forEach(l => {
                                   // Use _id as key, geneName as value
                                   if(l._id && l.geneName) resolvedMap[l._id.toString()] = l.geneName;
                              });
                          }
                      })
                      .catch(err => console.error("Error calling Feature Service (Loci):", err.message)) // Log error
            );
        }

        // --- Wait for all calls to settle ---
        await Promise.allSettled(promises); // Use allSettled to proceed even if one service fails

        console.log(`LIST SERVICE Controller: Aggregated ${Object.keys(resolvedMap).length} resolved names.`);
        res.status(200).json({ resolved: resolvedMap });

    } catch (error) { // Catch errors from Promise.allSettled or other setup issues
        console.error("❌ Error during ID resolution aggregation:", error);
        res.status(500).json({ message: 'Server error resolving item IDs.' });
    }
};

/**
 * @desc    Update a list belonging to the authenticated user
 * @route   PUT /api/lists/:id  (Example route via Gateway -> /mylists/:id in List Service)
 * @access  Private
 * @body    { name: string, description?: string, content: string[] } // Type is generally not updated
 */
export const updateList = async (req, res) => {
    const listId = req.params.id;
    const userId = req.user.id; // From protect middleware

    // Extract updatable fields from request body
    const { name, description, content } = req.body;

    // --- Basic Validation ---
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        return res.status(400).json({ message: 'Invalid list ID format.' });
    }
    // Check required fields for update (name and content are likely always needed)
    if (!name || !content) {
        return res.status(400).json({ message: 'Missing required fields: name and content are required.' });
    }
     // Validate 'content' is a non-empty array of strings (basic check)
     if (!Array.isArray(content) || content.length === 0 || !content.every(item => typeof item === 'string')) {
        return res.status(400).json({ message: 'Content must be a non-empty array of strings.' });
    }
    // Trim content items and remove any empty ones resulting from trimming
    const trimmedContent = content.map(item => item.trim()).filter(item => item.length > 0);
    if (trimmedContent.length === 0) {
         return res.status(400).json({ message: 'Content cannot be empty after trimming whitespace.' });
    }
    // --- End Validation ---

    console.log(`CONTROLLER: Attempting to update list ID: ${listId} for user ${userId}`);

    try {
        // Find the list by ID
        const list = await List.findById(listId);

        // Check if list exists
        if (!list) {
            console.log(`CONTROLLER: List not found for update: ${listId}`);
            return res.status(404).json({ message: 'List not found.' });
        }

        // Check ownership
        if (list.userId.toString() !== userId.toString()) {
            console.warn(`CONTROLLER: User ${userId} attempted to update list ${listId} owned by ${list.userId}.`);
            return res.status(403).json({ message: 'Forbidden: You do not own this list.' });
        }

        // Update the list fields
        list.name = name.trim();
        list.description = description ? description.trim() : list.description; // Keep old if new is not provided
        list.content = trimmedContent;
        // list.type = type; // Generally, don't allow changing the type
        // Do NOT update userId or timestamps manually

        // Save the updated list
        const updatedList = await list.save();

        console.log(`CONTROLLER: Successfully updated list ID: ${listId}`);
        res.status(200).json(updatedList); // Send back the updated list

    } catch (error) {
        console.error(`❌ Error updating list ${listId} for user ${userId}:`, error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: "Validation failed.", errors: messages });
        }
        res.status(500).json({ message: 'Server error updating list.' });
    }
};

/**
 * @desc    Delete a list belonging to the authenticated user
 * @route   DELETE /:id  (Relative to List Service base path, e.g., /api/lists/:id via gateway)
 * @access  Private
 */
export const deleteList = async (req, res) => {
    const listId = req.params.id;
    const userId = req.user.id; // From protect middleware

    // Validate if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(listId)) {
        console.log(`CONTROLLER: Invalid list ID format for delete: ${listId}`);
        return res.status(400).json({ message: 'Invalid list ID format.' });
    }

    console.log(`CONTROLLER: Attempting to delete list ID: ${listId} for user ${userId}`);

    try {
        // Find the list by ID first
        const list = await List.findById(listId);

        // Check if the list exists
        if (!list) {
            console.log(`CONTROLLER: List not found for delete: ${listId}`);
            // You could return 404, or maybe 200 if you want deletion to be idempotent
            // Returning 404 is usually clearer if the resource genuinely doesn't exist
            return res.status(404).json({ message: 'List not found.' });
        }

        // Check if the list belongs to the requesting user
        if (list.userId.toString() !== userId.toString()) {
            console.warn(`CONTROLLER: User ${userId} attempted to delete list ${listId} owned by ${list.userId}.`);
            // Return 403 Forbidden - user is logged in, but doesn't own this specific list
            return res.status(403).json({ message: 'Forbidden: You do not own this list.' });
        }

        // If checks pass, proceed with deletion using the instance method
        await list.deleteOne();
        // Or: await List.findByIdAndDelete(listId);

        console.log(`CONTROLLER: Successfully deleted list ID: ${listId}`);
        // Send success response
        res.status(200).json({ message: 'List deleted successfully.' });

    } catch (error) {
        console.error(`❌ Error deleting list ${listId} for user ${userId}:`, error);
        res.status(500).json({ message: 'Server error deleting list.' });
    }
};