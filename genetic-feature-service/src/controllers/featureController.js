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
 * @desc    Autocomplete Features (Loci) by name/ID OR return default list
 * @route   GET /features/autocomplete
 * @query   queryTerm=searchString (optional), referenceGenome=refGenomeName
 */
export const autocompleteFeatures = async (req, res) => {
    // Use empty string default if 'queryTerm' is not provided
    const { queryTerm = "", referenceGenome } = req.query;
    const limit = 30; // Limit for both search and default list

    // --- Validation ---
    // Reference genome is always required for this endpoint
    if (!referenceGenome) {
        return res.status(400).json({ message: "Reference genome is required for locus autocomplete." });
    }
    // --- End Validation ---

    try {
         const query = {
              referenceGenome: referenceGenome, // Always filter by reference genome
         };
         let resultsPromise;

        // Only apply text search if queryTerm is provided and long enough
        if (queryTerm && queryTerm.trim().length >= 2) {
            // --- Search Logic ---
             const searchTerm = queryTerm.trim();
             const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             const regex = new RegExp(escapedSearchTerm, 'i');
             query.$or = [ { geneName: { $regex: regex } } ]; // Search geneName
             console.log(`FEATURE Controller (Autocomplete): Searching Features with query:`, query);
             resultsPromise = Feature.find(query)
                                     .select('_id geneName') // Use _id and geneName
                                     .limit(limit)
                                     .sort({ geneName: 1 }) // Sort results
                                     .lean();
        } else {
             // --- Default List Logic (Empty or short search term) ---
             console.log(`FEATURE Controller (Autocomplete): Fetching default Locus list for genome ${referenceGenome}.`);
              resultsPromise = Feature.find(query) // Just filter by referenceGenome
                                     .select('_id geneName')
                                     .limit(limit)
                                     .sort({ geneName: 1 }) // Sort default list
                                     .lean();
        }

        const results = await resultsPromise;
        console.log(`FEATURE Controller (Autocomplete): Found <span class="math-inline">\{results\.length\} features for term "</span>{queryTerm || '(default)'}".`);
        // Return array like [{ _id: "...", geneName: "..." }]
        res.status(200).json(results);

    } catch (error) {
        console.error(`❌ Error during feature autocomplete for term "${queryTerm || '(default)'}":`, error);
        res.status(500).json({ message: "Server error during feature autocomplete." });
    }
};

/**
 * @desc    Get coordinates (contig, start, end) for a specific feature by its _id and reference genome
 * @route   GET /features/coords-by-id  (Example internal route)
 * @access  Internal/Private
 * @query   id=featureObjectId, referenceGenome=refGenomeName
 */
export const getFeatureCoordinatesById = async (req, res) => {
    const { id: featureId, referenceGenome } = req.query;

    // 1. Validate input
    if (!featureId || !mongoose.Types.ObjectId.isValid(featureId)) {
        return res.status(400).json({ message: "Valid Feature ID ('id') query parameter is required." });
    }
    if (!referenceGenome) {
        return res.status(400).json({ message: "Reference genome query parameter is required." });
    }

    console.log(`FEATURE Controller: Fetching coordinates for ID: ${featureId}, genome: ${referenceGenome}`);

    try {
        // 2. Query by standard _id and referenceGenome, selecting only coordinates
        const feature = await Feature.findOne(
            {
                _id: featureId, // Use standard MongoDB ObjectId
                referenceGenome: referenceGenome
            },
            'contig start end geneName' // Select necessary fields + geneName for confirmation
        ).lean(); // Use lean for performance

        // 3. Handle response
        if (!feature) {
            console.log(`❌ Feature coordinates not found for ID: ${featureId} (${referenceGenome})`);
            return res.status(404).json({ message: "Feature not found for the specified ID and reference genome." });
        }

        // Validate that coordinates exist and are numbers
        if (feature.contig == null || feature.start == null || feature.end == null || isNaN(Number(feature.start)) || isNaN(Number(feature.end))) {
             console.error(`❌ Invalid coordinate data found for Feature ID: ${featureId}`, feature);
             return res.status(500).json({ message: "Feature found, but coordinate data is missing or invalid." });
        }

        console.log(`✅ Found coordinates for ${feature.geneName} (${featureId}): ${feature.contig}:${feature.start}-${feature.end}`);
        // Send only the necessary coordinate data
        res.status(200).json({
            contig: feature.contig,
            start: feature.start,
            end: feature.end
        });

    } catch (error) {
        console.error("❌ Error fetching feature coordinates by ID:", error);
        res.status(500).json({ message: "Internal Server Error while fetching feature coordinates." });
    }
};

/**
 * @desc    Get coordinates (contig, start, end) for multiple feature IDs
 * @route   POST /api/genetic-features/batch-coords-by-id (Example Route - Adjust in your featureRoutes.js)
 * @access  Internal/Private (Typically called by other services)
 * @body    { ids: ["id1_string", "id2_string", ...], referenceGenome: "genomeName" }
 */
export const getBatchFeatureCoordinatesByIds = async (req, res) => {
    const { ids, referenceGenome } = req.body;

    // --- 1. Log Input ---
    console.log(`FEATURE Controller (Batch): Received request body:`, JSON.stringify(req.body));

    // --- 2. Validate Input ---
    if (!referenceGenome) {
        console.log("FEATURE Controller (Batch): Validation failed - Missing referenceGenome.");
        return res.status(400).json({ message: "Request body must include 'referenceGenome'." });
    }
    if (!Array.isArray(ids) || ids.length === 0) {
        console.log("FEATURE Controller (Batch): Validation failed - Missing or empty 'ids' array.");
        return res.status(400).json({ message: "Request body must include a non-empty 'ids' array." });
    }

    // Filter for valid ObjectIds and convert
    const requestedIdStrings = ids.map(id => String(id)); // Keep original strings
    const validObjectIds = requestedIdStrings
        .map(id => id.trim()) // Trim whitespace
        .filter(id => {
            const isValid = mongoose.Types.ObjectId.isValid(id);
            if (!isValid) {
                console.warn(`FEATURE Controller (Batch): Invalid ObjectId format skipped: ${id}`);
            }
            return isValid;
        }) // Check validity
        .map(id => new mongoose.Types.ObjectId(id)); // Convert to ObjectId type

    console.log(`FEATURE Controller (Batch): Processing ${validObjectIds.length} valid ObjectIds.`);
    console.log(`FEATURE Controller (Batch): Valid ObjectIds to query:`, validObjectIds.map(id => id.toString()));


    if (validObjectIds.length === 0) {
        console.log("FEATURE Controller (Batch): No valid ObjectIds after filtering.");
        // Return empty success, all original requested IDs as failed
        return res.status(200).json({ success: [], failed: requestedIdStrings });
    }

    try {
        // --- 3. Database Query ---
        const query = {
            _id: { $in: validObjectIds },       // Use standard MongoDB _id
            referenceGenome: referenceGenome // Filter by genome name
        };
        console.log(`FEATURE Controller (Batch): Executing DB query:`, JSON.stringify(query));

        // Find features matching the valid IDs and the reference genome
        const features = await Feature.find(query)
            .select('_id contig start end geneName') // Select necessary fields + geneName for context
            .lean(); // Use lean for performance

        // *** Log the raw results from the database query ***
        console.log(`FEATURE Controller (Batch): Found ${features.length} features in DB.`);
        // Optional: Log the actual data found (can be large)
        // console.log(`FEATURE Controller (Batch): Features data from DB:`, JSON.stringify(features));


        // --- 4. Process Results ---
        const successResults = [];
        const foundIds = new Set(); // Keep track of IDs found in the DB

        for (const feature of features) {
            const featureIdStr = feature._id.toString();
            foundIds.add(featureIdStr); // Mark this ID as found

            // Validate coordinates for each found feature
            const startNum = Number(feature.start);
            const endNum = Number(feature.end);
            if (feature.contig != null && // Check contig exists
                !isNaN(startNum) && !isNaN(endNum) && // Check start/end are numbers
                startNum >= 0 && // Check start isn't negative
                startNum <= endNum) // Check start <= end
            {
                 // Coordinates seem valid, add to success list
                 successResults.push({
                     id: featureIdStr, // Return the ID as string
                     contig: feature.contig,
                     start: startNum,
                     end: endNum
                 });
            } else {
                 // Log if coordinates are missing or invalid for a found feature
                 console.warn(`FEATURE Controller (Batch): Invalid/missing coordinates for found feature ID ${featureIdStr} (${feature.geneName}). Contig: ${feature.contig}, Start: ${feature.start}, End: ${feature.end}`);
                 // This ID was found but is invalid, so it will end up in the 'failed' list below
            }
        }

        // Determine which requested IDs were not found in DB OR had invalid coords
        const failedIds = requestedIdStrings.filter(idStr => {
             // Check if the original string ID corresponds to a valid ObjectId format AND wasn't successfully processed
             const isValidObjectId = mongoose.Types.ObjectId.isValid(idStr);
             // Failed if it's a valid ObjectId but not in the set of successfully found/processed IDs
             return isValidObjectId && !foundIds.has(idStr);
             // Note: IDs that were invalid format from the start are implicitly 'failed' as they weren't queried
             // If you want to explicitly include *all* original non-valid format IDs in failed list:
             // return !foundIds.has(idStr); // This includes initially invalid format IDs too
        });

         console.log(`FEATURE Controller (Batch): Lookup Summary - Success: ${successResults.length}, Failed/Not Found/Invalid Coords: ${failedIds.length}`);

        // --- 5. Handle No Valid Coordinates Found ---
        if (successResults.length === 0) {
            // This means either no features were found matching the IDs/genome,
            // OR all features found had invalid coordinates.
            console.log(`FEATURE Controller (Batch): No features with valid coordinates found for the request.`);
            // Return 404 status because the specific requested resources (with valid coords) were not found
            return res.status(404).json({ message: 'Coordinates for provided Locus IDs not found or invalid.' });
        }

        // --- 6. Format and Send Success Response ---
        res.status(200).json({
            success: successResults,
            failed: failedIds
        });

    } catch (error) {
        // --- 7. Handle Unexpected Errors ---
        console.error("❌ Error during batch feature coordinate lookup:", error);
        res.status(500).json({ message: "Server Error during batch coordinate lookup." });
    }
};