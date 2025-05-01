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
 * @desc    Create a new list for the authenticated user
 * @route   POST /api/lists
 * @access  Private
 * @body    { name: string, description: string, type: string, content: string[], snpSet: string, varietySet: string }
 */
export const createList = async (req, res) => {
    // Extract data from request body - now expecting description, snpSet, varietySet too
    const { name, description, type, content, snpSet, varietySet } = req.body;

    // Get user ID from authenticated user (set by 'protect' middleware)
    const userId = req.user.id;

    // --- Validation based on 'required: true' in the model ---
    // Check for all required fields from the model (excluding the custom 'id' and userId)
    if (!name || !description || !type || !content || !snpSet || !varietySet) {
        return res.status(400).json({ message: 'Missing required fields: name, description, type, content, snpSet, and varietySet are required.' });
    }

    // Validate 'type'
    const allowedTypes = ['variety', 'snp', 'locus']; // Keep enum logic for robustness
    if (!allowedTypes.includes(type.toLowerCase())) {
         return res.status(400).json({ message: `Invalid list type. Allowed types are: ${allowedTypes.join(', ')}.` });
    }

    // Validate 'content' is a non-empty array of strings
    if (!Array.isArray(content) || content.length === 0 || !content.every(item => typeof item === 'string')) {
         return res.status(400).json({ message: 'Content must be a non-empty array of strings.' });
    }
    // Trim content items and remove any empty ones resulting from trimming
    const trimmedContent = content.map(item => item.trim()).filter(item => item.length > 0);
    if (trimmedContent.length === 0) {
         return res.status(400).json({ message: 'Content cannot be empty after trimming whitespace.' });
    }

    console.log(`CONTROLLER: Attempting to create list "${name}" for user ${userId}`);

    try {
        // Create new list object using the 'List' model
        // We don't provide '_id' or the custom 'id', Mongoose/MongoDB handles '_id'
        const newList = new List({
            name: name.trim(),
            description: description.trim(), // Now required
            type: type.toLowerCase(),
            content: trimmedContent,
            snpSet: snpSet.trim(),           // Now required
            varietySet: varietySet.trim(),   // Now required
            userId: userId,                  // Link to the logged-in user
        });

        // Save the new list to the database
        const createdList = await newList.save();

        console.log(`CONTROLLER: Successfully created list ID: ${createdList._id}`);
        // Send back the created list object (which will include the generated _id)
        res.status(201).json(createdList);

    } catch (error) {
        console.error(`❌ Error creating list "${name}" for user ${userId}:`, error);
        // Handle potential validation errors from Mongoose or other DB errors
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