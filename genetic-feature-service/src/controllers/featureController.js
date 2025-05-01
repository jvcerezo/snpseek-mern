import Feature from "../models/Feature.js";
import Trait from "../models/Traits.js"; 
import mongoose from "mongoose";

/**
 * @desc    Search features by text query in specified field with different match types
 * @route   GET /api/genetic-features/by-text-search?queryTerm=...&referenceGenome=...&searchMethod=...&searchField=... (Example Route)
 * @access  Public (or Protected)
 */
export const searchFeaturesByText = async (req, res) => {
    try {
        const {
            queryTerm,          // The actual text entered by the user
            referenceGenome,
            searchMethod,       // e.g., 'substring', 'whole-word', 'exact', 'regex'
            // searchField parameter determines which DB field to search
            // Frontend sends 'annotation' or 'geneName' based on selection
            searchField = 'geneName' // Default to geneName if not provided
        } = req.query;

        // --- Validation ---
        if (!queryTerm) {
            return res.status(400).json({ message: "Search term (queryTerm) is required" });
        }
        if (!referenceGenome) {
            return res.status(400).json({ message: "Reference genome is required" });
        }
        // Optional: Validate searchMethod and searchField values if needed
        const validSearchFields = ['geneName', 'annotation']; // Add more if needed (e.g., 'geneSymbol')
        const dbFieldToSearch = searchField === 'annotation' ? 'description' : 'geneName'; // Map 'annotation' to 'description' field
        // Use 'geneName' as default if searchField is invalid or missing
        if (!validSearchFields.includes(searchField) && searchField !== 'geneName') {
             console.warn(`Invalid searchField '${searchField}', defaulting to 'geneName'.`);
             // dbFieldToSearch remains 'geneName'
        }
        console.log(`CONTROLLER: Searching field "${dbFieldToSearch}" for term "${queryTerm}" using method "${searchMethod}"`);
        // --- End Validation ---

        // --- Build Query ---
        // Escape basic regex metacharacters for safety in most modes
        // For 'regex' mode, the user intends to use regex, so we don't escape that one.
        const escapedQueryTerm = (searchMethod !== 'regex')
            ? queryTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape most special chars
            : queryTerm; // Use raw input for user's regex

        let textQuery = {}; // This will hold the specific query for the text field

        // Construct the query based on the selected match type
        switch (searchMethod) {
            case "exact":
                // Case-insensitive exact match using regex anchors ^ (start) and $ (end)
                 try {
                     textQuery[dbFieldToSearch] = { $regex: new RegExp(`^${escapedQueryTerm}$`, "i") };
                 } catch(e) {
                     console.error("Error building exact match regex:", e);
                     return res.status(400).json({ message: "Invalid term for exact search." });
                 }
                break;
            case "whole-word":
                 // Case-insensitive whole word match using word boundaries \b
                 // Requires double backslash \\b in JavaScript string for RegExp constructor
                 try {
                     textQuery[dbFieldToSearch] = { $regex: new RegExp(`\\b${escapedQueryTerm}\\b`, "i") };
                 } catch(e) {
                      console.error("Error building whole word regex:", e);
                      return res.status(400).json({ message: "Invalid term for whole-word search." });
                 }
                break;
            case "regex":
                // WARNING: Directly using user input as regex is a potential security risk (ReDoS).
                // Consider sanitizing or validating the regex pattern string 'queryTerm' first in production.
                try {
                    // Use original queryTerm, make case-insensitive by default
                    textQuery[dbFieldToSearch] = { $regex: new RegExp(queryTerm, "i") };
                } catch (e) {
                    console.error("Invalid user-provided regex:", e);
                    return res.status(400).json({ message: "Invalid Regular Expression provided." });
                }
                break;
            case "substring":
            default: // Default to substring search (case-insensitive)
                 try {
                    textQuery[dbFieldToSearch] = { $regex: escapedQueryTerm, $options: "i" };
                 } catch(e) {
                     console.error("Error building substring regex:", e);
                     return res.status(400).json({ message: "Invalid term for substring search." });
                 }
                break;
        }

        // Combine text query with the required reference genome filter
        const finalQuery = {
            referenceGenome: referenceGenome,
            ...textQuery
         };
         // --- End Query Build ---

        console.log("CONTROLLER: Executing feature search with query:", JSON.stringify(finalQuery));

        // Execute query against the Feature collection
        // Select fields relevant to the results table displayed in GeneLoci.jsx
        const features = await Feature.find(finalQuery)
             .select("geneName geneSymbol referenceGenome contig start end strand description function _id") // Adjust fields as needed
             .limit(500); // Limit results to avoid overwhelming response

        console.log(`CONTROLLER: Found ${features.length} features matching text search.`);

        // Send features back (could be an empty array if no matches)
        res.status(200).json(features);

    } catch (error) {
        console.error("❌ Error searching features by text:", error);
        // Avoid sending detailed error info to client unless needed
        res.status(500).json({ message: "Server Error during feature search." });
    }
};

// export const getFeatureByGeneNameAndReferenceGenome = async (req, res) => {
//     try {
//         const { geneName, referenceGenome, searchType } = req.query;

//         // Validate required inputs
//         if (!geneName) {
//             return res.status(400).json({ error: "Gene name is required" });
//         }

//         if (!referenceGenome) {
//             return res.status(400).json({ error: "Reference genome is required" });
//         }

//         // Build the query based on search type
//         let query = { referenceGenome };
        
//         if (searchType === "whole-word") {
//             query.geneName = geneName;
//         } else if (searchType === "substring") {
//             query.geneName = { $regex: geneName, $options: "i" };
//         } else if (searchType === "exact") {
//             query.geneName = { $eq: geneName };
//         } else if (searchType === "regex") {
//             query.geneName = { $regex: new RegExp(geneName) };
//         } else {
//             // Default fallback to substring search
//             query.geneName = { $regex: geneName, $options: "i" };
//         }

//         // Query the database
//         const features = await Feature.find(query);

//         if (!features.length) {
//             return res.status(404).json({ error: "No features found" });
//         }

//         res.status(200).json(features);
//     } catch (error) {
//         console.error("❌ Error searching features:", error);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

/**
 * @desc Get all available traits from the Traits collection
 * @route GET /features/traits
 */
export const getAvailableTraits = async (req, res) => {
    try {
        const traits = await Trait.find({}, "traitName category description geneIds");

        if (!traits.length) {
            return res.status(404).json({ error: "No traits found" });
        }

        res.status(200).json(traits);
    } catch (error) {
        console.error("❌ Error fetching traits:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * @desc Get features associated with a selected trait and reference genome
 * @route GET /features/by-trait
 */
export const getFeaturesByTrait = async (req, res) => {
    try {
        const { traitName, referenceGenome } = req.query;

        // Validate required inputs
        if (!traitName) {
            return res.status(400).json({ error: "Trait name is required" });
        }

        if (!referenceGenome) {
            return res.status(400).json({ error: "Reference genome is required" });
        }

        // Find the trait by name
        const trait = await Trait.findOne({ traitName });

        if (!trait) {
            return res.status(404).json({ error: "Trait not found" });
        }

        // Ensure geneIds exist in the trait
        if (!trait.geneIds || trait.geneIds.length === 0) {
            return res.status(404).json({ error: "No associated genes found for this trait" });
        }

        console.log("🔍 Trait:", trait);
        console.log("🔍 Gene IDs to search for:", trait.geneIds);
        console.log("🔍 Reference Genome:", referenceGenome);

        // Build the query with both trait gene IDs and reference genome
        const query = {
            $and: [
                { referenceGenome },
                { $or: [
                    { _id: { $in: trait.geneIds } },
                    { id: { $in: trait.geneIds } }
                ]}
            ]
        };

        // Fetch gene features linked to this trait and reference genome
        const features = await Feature.find(query);

        if (features.length === 0) {
            return res.status(404).json({ 
                error: "No gene features found for the provided trait and reference genome" 
            });
        }

        res.status(200).json(features);

    } catch (error) {
        console.error("❌ Error fetching features by trait:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getReferenceGenomes = async (req, res) => {
    try {
      const referenceGenomes = await Feature.distinct("referenceGenome");
  
      // Ensure uniqueness (MongoDB's `.distinct()` should already do this)
      const uniqueGenomes = [...new Set(referenceGenomes.map(genome => genome.trim()))];
  
      if (!uniqueGenomes.length) {
        return res.status(404).json({ error: "No reference genomes found" });
      }
  
      res.status(200).json(uniqueGenomes);
    } catch (error) {
      console.error("❌ Error fetching reference genomes:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

/**
 * @desc Get detailed information for a specific gene by its name and reference genome
 * @route GET /features/details
 */
export const getGeneDetails = async (req, res) => {
    try {
        const { geneName, referenceGenome } = req.query;

        // 1. Validate required inputs
        if (!geneName) {
            return res.status(400).json({ message: "Gene name query parameter is required" });
        }
        if (!referenceGenome) {
            return res.status(400).json({ message: "Reference genome query parameter is required" });
        }

        console.log(`🔍 Fetching details for gene: ${geneName}, genome: ${referenceGenome}`);

        // 2. Query the database for an exact match on both fields
        // Use findOne as we expect a single unique result for details
        const feature = await Feature.findOne({
            geneName: geneName, // Exact match for geneName
            referenceGenome: referenceGenome // Exact match for referenceGenome
        });

        // 3. Handle response
        if (!feature) {
            // If no feature is found, return 404
            console.log(`❌ Gene details not found for: ${geneName} (${referenceGenome})`);
            return res.status(404).json({ message: "Gene details not found for the specified name and reference genome." });
        }

        // If feature is found, return it
        console.log(`✅ Found gene details for: ${geneName} (${referenceGenome})`);
        res.status(200).json(feature); // Send the full feature object

    } catch (error) {
        // 4. Handle potential errors
        console.error("❌ Error fetching gene details:", error);
        res.status(500).json({ message: "Internal Server Error while fetching gene details." });
    }
};
  
/**
 * @desc    Get Features that overlap a given genomic region
 * @route   GET /api/genetic-features/by-region?referenceGenome=...&chromosome=...&start=...&end=...
 * @access  Public (or Protected if needed)
 */
export const getFeaturesByRegion = async (req, res) => {
    const {
        referenceGenome,
        chromosome, // Optional filter ('contig')
        start,      // Required
        end         // Required
    } = req.query;

    console.log("CONTROLLER: Received request for features by region:", req.query);

    // --- Validation ---
    if (!referenceGenome || !start || !end) {
        return res.status(400).json({ message: "Reference Genome, Start position, and End position query parameters are required." });
    }
    const startPos = parseInt(start, 10);
    const endPos = parseInt(end, 10);
    if (isNaN(startPos) || isNaN(endPos) || startPos < 0 || startPos > endPos) {
         return res.status(400).json({ message: "Invalid Start/End position provided." });
    }
    // --- End Validation ---

    try {
        // Build the MongoDB query
        const query = {
            referenceGenome: referenceGenome, // Filter by reference genome
            // Add chromosome/contig filter if provided
            ...(chromosome && { contig: chromosome }),
            // Find features that OVERLAP the given range [startPos, endPos]
            // Feature starts before or at the query end AND Feature ends after or at the query start
            start: { $lte: endPos },   // Feature start <= Query end
            end: { $gte: startPos }      // Feature end >= Query start
        };

        console.log("CONTROLLER: Querying Features collection with:", JSON.stringify(query));

        // Execute query - select fields relevant for the results table
        const features = await Feature.find(query)
            .select("geneName geneSymbol referenceGenome contig start end strand description function _id") // Adjust fields as needed
            .limit(1000); // Add a sensible limit to prevent excessive results

        console.log(`CONTROLLER: Found ${features.length} features in region.`);

        res.status(200).json(features); // Return found features (or empty array)

    } catch (error) {
        console.error("❌ Error fetching features by region:", error);
        res.status(500).json({ message: "Server Error fetching features by region." });
    }
};

/**
 * @desc    Lookup multiple Feature (Locus) documents by their IDs
 * @route   GET /features/lookup
 * @access  Public or Private
 * @query   ids=id1,id2,id3... (comma-separated string of _id values)
 */
export const lookupFeaturesByIds = async (req, res) => {
    const { ids } = req.query;

    if (!ids) {
        return res.status(400).json({ message: "Query parameter 'ids' is required." });
    }

    const idArray = ids.split(',')
                       .map(id => id.trim())
                       .filter(id => mongoose.Types.ObjectId.isValid(id)); // Validate ObjectId format

    if (idArray.length === 0) {
        return res.status(200).json([]);
    }

    console.log(`FEATURE Controller: Looking up ${idArray.length} feature IDs.`);

    try {
        // Find features where standard MongoDB '_id' field matches
        // Adjust selected fields ('_id', 'geneName') if your display logic needs something else
        const results = await Feature.find({ _id: { $in: idArray } })
                                     .select('_id geneName') // Select standard ID and name
                                     .lean();

        console.log(`FEATURE Controller: Found ${results.length} matching features.`);
         // Returns array like [{ _id: '...', geneName: '...' }]
        res.status(200).json(results);

    } catch (error) {
        console.error("❌ Error looking up features by ID:", error);
        res.status(500).json({ message: 'Server error looking up features.' });
    }
};

/**
 * @desc    Autocomplete Features (Loci) by name/ID for list creation
 * @route   GET /features/autocomplete
 * @access  Public (or Private, as needed)
 * @query   queryTerm=searchString, referenceGenome=refGenomeName
 */
export const autocompleteFeatures = async (req, res) => {
    const { queryTerm, referenceGenome } = req.query;

    // --- Validation ---
    if (!queryTerm || queryTerm.trim().length < 2) {
        // Return empty for short/empty queries, including default load (queryTerm="")
        return res.status(200).json([]);
    }
    if (!referenceGenome) {
        // Autocomplete needs context
        return res.status(400).json({ message: "Reference genome is required for locus autocomplete." });
    }
    // --- End Validation ---

    try {
        const searchTerm = queryTerm.trim();
        // Escape regex special characters for safety
        const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedSearchTerm, 'i'); // Case-insensitive substring search

        // Build the query
        const query = {
            referenceGenome: referenceGenome,
            // Search in relevant fields - primarily geneName, maybe custom ID if useful
            // Adjust fields based on your Feature model and search needs
            $or: [
                { geneName: { $regex: regex } },
                // { id: { $regex: regex } } // Optional: search custom ID field too?
                // { description: { $regex: regex } } // Optional: search description?
            ]
        };

        console.log(`FEATURE Controller (Autocomplete): Searching Features with query:`, query);

        // Find features, select ONLY _id and geneName, limit results
        const results = await Feature.find(query)
                                     .select('_id geneName') // Select standard ID and display name
                                     .limit(20) // Limit autocomplete results
                                     .lean();

        console.log(`FEATURE Controller (Autocomplete): Found ${results.length} features for term "${searchTerm}".`);
        // Return array like [{ _id: "...", geneName: "..." }]
        res.status(200).json(results);

    } catch (error) {
        console.error(`❌ Error during feature autocomplete for term "${queryTerm}":`, error);
        res.status(500).json({ message: "Server error during feature autocomplete." });
    }
};