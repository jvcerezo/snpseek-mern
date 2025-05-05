// controllers/genomicController.js
import Variety from "../models/varieties.js";
import VarietiesPos from "../models/varietiesPos.js";
import ReferenceGenome from "../models/referenceGenome.js";
import ReferenceGenomePos from "../models/referenceGenomePos.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const FEATURE_SERVICE_URL = process.env.GENETIC_FEATURE_SERVICE_URL || "http://localhost:5002"; // Default to local if not set
/**
 * @desc    Get distinct variety set names
 * @route   GET /genomic/variety-sets
 */
export const getVarietySets = async (req, res) => {
    try {
        console.log("CONTROLLER: Attempting Variety.distinct('varietySet')");
        const varietySetsRaw = await Variety.distinct("varietySet");
        console.log("CONTROLLER: Raw distinct variety sets from DB:", varietySetsRaw);

        const validSets = varietySetsRaw
            .filter(set => set && typeof set === 'string' && set.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted variety sets (${validSets.length}):`, validSets);
        res.status(200).json(validSets);

    } catch (error) {
        console.error("❌ Error fetching distinct variety sets:", error);
        res.status(500).json({ message: "Server Error fetching variety sets." });
    }
};

/**
 * @desc    Get distinct SNP set names
 * @route   GET /genomic/snp-sets
 */
export const getSnpSets = async (req, res) => {
    try {
        console.log("CONTROLLER: Attempting Variety.distinct('snpSet')");
        const snpSetsRaw = await Variety.distinct("snpSet");
        console.log("CONTROLLER: Raw distinct SNP sets from DB:", snpSetsRaw);

        const validSets = snpSetsRaw
            .filter(set => set && typeof set === 'string' && set.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted SNP sets (${validSets.length}):`, validSets);
        res.status(200).json(validSets);

    } catch (error) {
        console.error("❌ Error fetching distinct SNP sets:", error);
        res.status(500).json({ message: "Server Error fetching SNP sets." });
    }
};

/**
 * @desc    Get distinct variety subpopulation names
 * @route   GET /genomic/subpopulations
 */
export const getVarietySubpopulations = async (req, res) => {
    try {
        console.log("CONTROLLER: Attempting Variety.distinct('subpopulation')");
        const subpopulationsRaw = await Variety.distinct("subpopulation");
        console.log("CONTROLLER: Raw distinct subpopulations from DB:", subpopulationsRaw);

        const validSubpopulations = subpopulationsRaw
            .filter(sub => sub && typeof sub === 'string' && sub.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted subpopulations (${validSubpopulations.length}):`, validSubpopulations);
        res.status(200).json(validSubpopulations);

    } catch (error) {
        console.error("❌ Error fetching distinct variety subpopulations:", error);
        res.status(500).json({ message: "Server Error fetching subpopulations." });
    }
};

/**
 * @desc    Get distinct chromosome/contig names
 * @route   GET /genomic/chromosomes
 */
export const getChromosomes = async (req, res) => {
    try {
        console.log("CONTROLLER: Attempting VarietiesPos.distinct('contig')");
        const chromosomesRaw = await VarietiesPos.distinct("contig");
        console.log("CONTROLLER: Raw distinct chromosomes/contigs from DB:", chromosomesRaw);

        const validChromosomes = chromosomesRaw
            .filter(chr => chr && typeof chr === 'string' && chr.trim().length > 0)
            .sort((a, b) => {
                 const numA = parseInt(a.replace(/[^0-9]/g, ''), 10);
                 const numB = parseInt(b.replace(/[^0-9]/g, ''), 10);
                 if (!isNaN(numA) && !isNaN(numB)) {
                     return numA - numB;
                 }
                 return a.localeCompare(b);
            });

        console.log(`CONTROLLER: Filtered & sorted chromosomes (${validChromosomes.length}):`, validChromosomes);
        res.status(200).json(validChromosomes);

    } catch (error) {
        console.error("❌ Error fetching distinct chromosomes/contigs:", error);
        res.status(500).json({ message: "Server Error fetching chromosomes." });
    }
};

// --- Helper: getReferencePositionsAndAlleles (Modified for optional range) ---
// const getReferencePositionsAndAlleles = async (referenceIdStr, contig, startPos, endPos) => {
//     const refPosFilter = { referenceId: referenceIdStr };
//     // Only apply contig filter if a specific chromosome is provided
//     if (contig && typeof contig === 'string' && contig.trim() !== '') {
//         refPosFilter.contig = contig;
//     }
//     // Only apply position range filter if BOTH start and end are valid numbers
//     if (typeof startPos === 'number' && typeof endPos === 'number' && !isNaN(startPos) && !isNaN(endPos)) {
//         refPosFilter.start = { $lte: endPos };
//         refPosFilter.end = { $gte: startPos };
//         console.log(`HELPER (getRefPosAndAlleles): Applying range filter: ${startPos}-${endPos}`);
//     } else {
//          console.log("HELPER (getRefPosAndAlleles): No range filter applied.");
//     }

//     console.log("HELPER (getRefPosAndAlleles): Finding reference position docs matching:", refPosFilter);
//     const refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("positions start end"); // Removed contig select for now
//     console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} reference position document(s).`);

//     const includedPositions = new Set();
//     const referenceAlleleMap = new Map();

//     for (const doc of refPositionDocs) {
//         if (doc.positions && typeof doc.positions === 'object') {
//             for (const posStr in doc.positions) {
//                 const position = parseInt(posStr, 10);
//                 if (!isNaN(position)) {
//                     // If range was specified (startPos is not null), check bounds.
//                     // If no range was specified (startPos is null), include all positions found for matched docs.
//                     if (startPos === null || (position >= startPos && position <= endPos)) {
//                         includedPositions.add(position);
//                         referenceAlleleMap.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?');
//                     }
//                 }
//             }
//         }
//     }
//     const finalPositions = Array.from(includedPositions).sort((a, b) => a - b);
//     console.log(`HELPER (getRefPosAndAlleles): Returning ${finalPositions.length} positions and ${referenceAlleleMap.size} ref alleles.`);
//     return { positions: finalPositions, referenceAlleles: referenceAlleleMap };
// };

// --- End Helper ---


// /**
//  * @desc    Search for genotypes based on multiple criteria (Handles 'Any Chromosome')
//  * @route   POST /genomic/search
//  */
// export const searchGenotypes = async (req, res) => {
//     const {
//         referenceGenome: referenceGenomeName,
//         varietySet, snpSet, varietySubpopulation,
//         regionChromosome, // Can be ''
//         regionStart, regionEnd,
//         // Add other region types if needed: regionType, regionGeneLocus, snpList, locusList
//     } = req.body;

//     console.log("CONTROLLER: Received genotype search request criteria:", req.body);

//     // --- Adjusted Validation ---
//     if (!referenceGenomeName || !varietySet || !snpSet) {
//         return res.status(400).json({ message: "Reference Genome, Variety Set, and SNP Set are required." });
//     }

//     let startPos = null;
//     let endPos = null;
//     const specificChromosomeSearch = regionChromosome && typeof regionChromosome === 'string' && regionChromosome.trim() !== '';

//     if (specificChromosomeSearch) { // Validate start/end ONLY if a specific chromosome is chosen
//         if (regionStart === undefined || regionStart === '' || regionEnd === undefined || regionEnd === '') {
//              return res.status(400).json({ message: "Start Position and End Position are required when a specific Chromosome is selected." });
//         }
//         startPos = parseInt(regionStart, 10);
//         endPos = parseInt(regionEnd, 10);
//         if (isNaN(startPos) || isNaN(endPos) || startPos > endPos || startPos < 0) {
//              return res.status(400).json({ message: "Invalid Start/End position provided for chromosome search." });
//         }
//         console.log(`CONTROLLER: Specific chromosome search on ${regionChromosome} from ${startPos} to ${endPos}`);
//     } else {
//         console.log("CONTROLLER: No specific chromosome selected, searching across all contigs.");
//         // startPos and endPos remain null
//     }
//     // --- End Validation ---

//     try {
//         // --- Step 1: Find Reference Genome ID ---
//         const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
//         if (!refGenomeDoc) { return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` }); }
//         const referenceIdStr = refGenomeDoc._id.toString();
//         console.log(`CONTROLLER: Found referenceGenome ObjectId: ${referenceIdStr}`);

//         // --- Step 2: Get Reference Alleles (respecting range ONLY if specified) ---
//         const { positions: refPositionsInRange, referenceAlleles } = await getReferencePositionsAndAlleles(
//             referenceIdStr, regionChromosome, startPos, endPos
//         );
//         // If specific chromosome range search yields no ref positions, result is empty
//         if (specificChromosomeSearch && refPositionsInRange.length === 0) {
//              console.log("CONTROLLER: No reference positions found within the specified range for the selected chromosome.");
//              return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
//         }

//         // --- Step 3: Filter Varieties ---
//         const varietyFilter = { varietySet, snpSet };
//         if (varietySubpopulation) varietyFilter.subpopulation = varietySubpopulation;
//         console.log("CONTROLLER: Finding matching varieties with filter:", varietyFilter);
//         const matchingVarieties = await Variety.find(varietyFilter).select("_id id name accession subpopulation varietySet irisId").lean();
//         if (!matchingVarieties || matchingVarieties.length === 0) {
//              console.log("CONTROLLER: No varieties found matching criteria.");
//              // Return positions found in reference even if no varieties match? Or empty? Empty seems safer.
//              // return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: refPositionsInRange, varieties: [] });
//              return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });

//         }
//         const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString());
//         const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v]));
//         console.log(`CONTROLLER: Found ${matchingVarieties.length} matching varieties.`);

//         // --- Step 4: Fetch Variety Allele Data (Conditional Filters) ---
//         const varietyPosFilter = { referenceId: { $in: matchingVarietyObjectIdStrings } };
//         if (specificChromosomeSearch) { // Only filter by contig if provided
//              varietyPosFilter.contig = regionChromosome;
//         }
//         if (specificChromosomeSearch && startPos !== null && endPos !== null) { // Only filter by range if specific chromosome was chosen
//              varietyPosFilter.start = { $lte: endPos };
//              varietyPosFilter.end = { $gte: startPos };
//         }
//         console.log("CONTROLLER: Finding variety position data with filter:", varietyPosFilter);
//         const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId");
//         console.log(`CONTROLLER: Found ${varietyPositionDocs.length} relevant variety position document(s).`);


//         // --- Step 5: Aggregate ALL unique positions and build Allele Map ---
//         const allVarietyPositions = new Set();
//         const alleleMap = new Map(); // Map<varietyId_string, Map<position_number, allele_string>>
//         console.log("CONTROLLER: Building Allele Map...");

//         for (const doc of varietyPositionDocs) {
//             const varietyIdStr = doc.referenceId;
//             if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object' || !matchingVarietyIdMap.has(varietyIdStr)) continue;

//             if (!alleleMap.has(varietyIdStr)) alleleMap.set(varietyIdStr, new Map());
//             const varietyAlleleData = alleleMap.get(varietyIdStr);

//             for (const posStr in doc.positions) {
//                 const position = parseInt(posStr, 10);
//                 if (!isNaN(position)) {
//                     // If a range was specified (startPos is not null), only include positions within that range.
//                     // If no range (startPos is null - Any Chromosome), include all positions found for matched varieties.
//                     if (startPos === null || (position >= startPos && position <= endPos)) {
//                          allVarietyPositions.add(position);
//                          varietyAlleleData.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : 'ERR');
//                     }
//                 }
//             }
//         }
//         console.log(`CONTROLLER: Built allele map covering ${alleleMap.size} varieties and ${allVarietyPositions.size} unique positions.`);

//         // --- Step 6: Format Final Response ---
//         const finalPositions = Array.from(allVarietyPositions).sort((a, b) => a - b);

//         // If the search was for a specific range but no variety positions were found *within that range*
//         // (even if reference positions existed), return empty results for varieties.
//          if (specificChromosomeSearch && finalPositions.length === 0 && refPositionsInRange.length > 0) {
//              console.log("CONTROLLER: Reference positions found, but no variety positions match the specified range.");
//              // Include the reference row with its alleles in the specified range
//               const referenceGenomeRowData = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: {} };
//               for (const pos of refPositionsInRange) { referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; }
//              return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: refPositionsInRange, varieties: [referenceGenomeRowData] });
//          }
//           if (finalPositions.length === 0) {
//              console.log("CONTROLLER: No relevant positions found in reference or varieties for the given criteria.");
//              return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
//          }


//         const finalResults = {
//             referenceGenomeName: referenceGenomeName,
//             positions: finalPositions,
//             varieties: []
//         };

//         // Add Reference Row (using all final positions)
//         const referenceGenomeRowData = {
//             name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-',
//             subpop: '-', dataset: '-', mismatch: 0, alleles: {}
//         };
//         for (const pos of finalPositions) { referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; }
//         finalResults.varieties.push(referenceGenomeRowData);

//         // Add Variety Rows
//         for (const variety of matchingVarieties) {
//             const varietyIdStr = variety._id.toString();
//             const varietyAllelesData = alleleMap.get(varietyIdStr);
//             const formattedAlleles = {};
//             let mismatchCount = 0;

//             for (const pos of finalPositions) {
//                 const varAllele = varietyAllelesData?.get(pos);
//                 const refAllele = referenceAlleles.get(pos); // Get ref allele for this specific position
//                 formattedAlleles[pos] = varAllele ?? '-';
//                 // Mismatch Calculation
//                  if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
//                     // Basic mismatch check
//                     mismatchCount++;
//                  }
//             }
//              finalResults.varieties.push({
//                  name: variety.name, accession: variety.accession, assay: variety.irisId ?? 'N/A',
//                  subpop: variety.subpopulation, dataset: variety.varietySet,
//                  mismatch: mismatchCount, alleles: formattedAlleles
//              });
//         }
//         console.log(`CONTROLLER: Formatted ${finalResults.varieties.length} total rows for response.`);
//         res.status(200).json(finalResults);

//     } catch (error) {
//         console.error("❌ Error during genotype search:", error);
//         res.status(500).json({ message: "Server Error during genotype search." });
//     }
// };

/**
 * @desc    Get the min start and max end position for a specific chromosome/contig within a reference genome
 * @route   GET /genomic/chromosome-range?contig=<contig_name>&referenceGenome=<genome_name>
 */
export const getChromosomeRange = async (req, res) => {
    const { contig, referenceGenome: referenceGenomeName } = req.query;

    if (!contig || !referenceGenomeName) {
        return res.status(400).json({ message: "Contig (Chromosome) and Reference Genome query parameters are required." });
    }
    console.log(`CONTROLLER: Getting range for Contig: ${contig}, RefGenome: ${referenceGenomeName}`);
    try {
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id");
        if (!refGenomeDoc) { return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` }); }
        const referenceGenomeObjectId = refGenomeDoc._id; // Use ObjectId directly if possible in aggregation

        const rangeResult = await ReferenceGenomePos.aggregate([
            { $match: { referenceId: referenceGenomeObjectId.toString(), contig: contig } }, // Ensure referenceId is string if needed
            { $group: { _id: null, minPosition: { $min: "$start" }, maxPosition: { $max: "$end" } } }
        ]);

        if (!rangeResult || rangeResult.length === 0 || rangeResult[0].minPosition === null || rangeResult[0].maxPosition === null) {
            console.log(`CONTROLLER: No position data found for Contig: ${contig}, RefGenome: ${referenceGenomeName}`);
             return res.status(404).json({ message: `No position range data found for chromosome '${contig}' in reference genome '${referenceGenomeName}'.` });
        }
        const range = { minPosition: rangeResult[0].minPosition, maxPosition: rangeResult[0].maxPosition };
        console.log(`CONTROLLER: Found range for Contig ${contig}:`, range);
        res.status(200).json(range);

    } catch (error) {
        console.error(`❌ Error fetching chromosome range for ${contig}:`, error);
        res.status(500).json({ message: "Server Error fetching chromosome range." });
    }
};

// Add other controllers like getReferenceGenomes if they belong in this file
export const getReferenceGenomes = async (req, res) => {
     try {
         console.log("CONTROLLER: Attempting ReferenceGenome.find()");
         // Fetch name and maybe description or other identifiers?
         const genomes = await ReferenceGenome.find({}, "name description").sort({ name: 1 });
         console.log(`CONTROLLER: Found ${genomes.length} reference genomes.`);
         // Return just the names, or the full objects if needed for display
         const genomeNames = genomes.map(g => g.name);
         res.status(200).json(genomeNames);
         // Or: res.status(200).json(genomes);
     } catch (error) {
         console.error("❌ Error fetching reference genomes:", error);
         res.status(500).json({ message: "Server Error fetching reference genomes." });
     }
 };

/**
 * @desc    Get the CONSOLIDATED min start and max end position across ALL chromosomes/contigs for a reference genome
 * @route   GET /genomic/consolidated-range?referenceGenome=<genome_name>
 * @METHOD  Fetch all relevant position documents and calculate min/max in code.
 */
export const getConsolidatedChromosomeRange = async (req, res) => {
    const { referenceGenome: referenceGenomeName } = req.query;

    if (!referenceGenomeName) {
        return res.status(400).json({ message: "Reference Genome query parameter is required." });
    }
    console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Getting consolidated range for RefGenome: ${referenceGenomeName}`);

    try {
        // 1. Find the Reference Genome Document ID
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id");
        if (!refGenomeDoc) {
             console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Reference Genome '${referenceGenomeName}' not found.`);
            return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` });
        }
        const referenceGenomeIdString = refGenomeDoc._id.toString(); // Use String ID for matching
        console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Found RefGenome ID: ${referenceGenomeIdString}`);

        // 2. Fetch ALL ReferenceGenomePos documents for this reference genome
        //    Select only the 'start' and 'end' fields to minimize data transfer
        const positionDocs = await ReferenceGenomePos.find(
            { referenceId: referenceGenomeIdString }, // Match by the reference ID
            'start end' // Select only start and end fields
        ).lean(); // Use .lean() for performance if we only need plain JS objects

        console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Found ${positionDocs.length} position documents for RefGenome ID ${referenceGenomeIdString}.`);

        // 3. Check if any documents were found
        if (!positionDocs || positionDocs.length === 0) {
            console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): No position documents found for RefGenome: ${referenceGenomeName}`);
            // Return a consistent response indicating no data
            return res.status(200).json({ minPosition: null, maxPosition: null, message: `No position data found for reference genome '${referenceGenomeName}'.` });
        }

        // 4. Calculate min start and max end from the fetched documents
        let minStart = Infinity;
        let maxEnd = -Infinity;
        let validDataFound = false;

        for (const doc of positionDocs) {
            // Check if start and end are valid numbers in the current document
            const start = doc.start;
            const end = doc.end;

            if (typeof start === 'number' && !isNaN(start)) {
                minStart = Math.min(minStart, start);
                validDataFound = true; // Mark that we found at least one valid start/end
            }
            if (typeof end === 'number' && !isNaN(end)) {
                maxEnd = Math.max(maxEnd, end);
                 validDataFound = true; // Mark that we found at least one valid start/end
            }
        }

        // 5. Handle case where documents existed but none had valid numbers
        if (!validDataFound) {
             console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Documents found, but no valid numeric start/end positions for RefGenome: ${referenceGenomeName}`);
            return res.status(200).json({ minPosition: null, maxPosition: null, message: `Position documents found, but contain no valid numeric range data for '${referenceGenomeName}'.` });
        }

        // 6. Return the calculated range
        const range = { minPosition: minStart, maxPosition: maxEnd };
        console.log(`CONTROLLER (getConsolidatedRange - Fetch Method): Calculated consolidated range for RefGenome ${referenceGenomeName}:`, range);
        res.status(200).json(range);

    } catch (error) {
        console.error(`❌ Error fetching/calculating consolidated chromosome range for ${referenceGenomeName}:`, error);
        res.status(500).json({ message: "Server Error fetching consolidated chromosome range." });
    }
};

/**
 * @desc    Search distinct Contig names from VarietiesPos for autocomplete
 * @route   GET /genotype/contigs/search
 * @access  Public (usually)
 * @query   q=searchTerm, snpSet=setName (optional, if VarietiesPos has snpSet field)
 */
export const searchContigs = async (req, res) => {
    const { q: searchTerm, snpSet } = req.query;

    // Basic validation
    if (!searchTerm || searchTerm.trim().length < 1) { // Allow searching even on 1 character for contigs
        return res.status(200).json([]);
    }

    try {
        // --- Build Query for distinct ---
        const query = {
            // Match contig field containing the searchTerm (case-insensitive)
            contig: { $regex: searchTerm.trim(), $options: 'i' }
        };

        // ** Optional: Filter by snpSet **
        // If your VarietiesPos model has an 'snpSet' field you want to filter by:
        // if (snpSet) {
        //     query.snpSet = snpSet;
        // }
        // --- End Optional Filter ---

        console.log(`CONTROLLER: Searching distinct Contigs with query:`, query);

        // Use distinct() to find unique contig values matching the query
        const distinctContigs = await VarietiesPos.distinct("contig", query);

        // Limit the number of results returned for autocomplete
        const limit = 20;
        const results = distinctContigs.slice(0, limit);

        console.log(`CONTROLLER: Found ${results.length} distinct contigs matching "${searchTerm}" (limit ${limit}).`);

        // Distinct returns an array of strings directly
        res.status(200).json(results);

    } catch (error) {
        console.error(`❌ Error searching contigs for term "${searchTerm}":`, error);
        res.status(500).json({ message: 'Server error searching contigs.' });
    }
};

/**
 * @desc    Search Varieties by name for autocomplete OR return default list
 * @route   GET /genotype/varieties/search
 * @query   q=searchTerm (optional), varietySet=setName (optional - REMOVED based on prior step)
 */
export const searchVarietiesByName = async (req, res) => {
    // Use empty string default if 'q' is not provided
    const { q: searchTerm = "" } = req.query; // No varietySet filter needed
    const limit = 30; // Limit for both search and default list

    try {
        const query = {}; // Base query (potentially empty)

        let resultsPromise;

        if (searchTerm && searchTerm.trim().length >= 2) {
            // --- Search Logic ---
            query.name = { $regex: searchTerm.trim(), $options: 'i' };
            console.log(`CONTROLLER: Searching Varieties with query:`, query);
            resultsPromise = Variety.find(query)
                                    .select('_id name')
                                    .limit(limit)
                                    .sort({ name: 1 }) // Sort search results too
                                    .lean();
        } else {
            // --- Default List Logic (Empty or short search term) ---
            console.log(`CONTROLLER: Fetching default Variety list.`);
            resultsPromise = Variety.find(query) // Find all (or apply other base filters if needed)
                                    .select('_id name')
                                    .limit(limit)
                                    .sort({ name: 1 }) // Sort default list
                                    .lean();
        }

        const results = await resultsPromise;
        console.log(`CONTROLLER: Found <span class="math-inline">\{results\.length\} varieties for term "</span>{searchTerm || '(default)'}".`);
        res.status(200).json(results);

    } catch (error) {
        console.error(`❌ Error searching/fetching varieties for term "${searchTerm || '(default)'}":`, error);
        res.status(500).json({ message: 'Server error searching varieties.' });
    }
};

/**
 * @desc    Lookup multiple Variety documents by their IDs
 * @route   GET /genotype/varieties/lookup
 * @access  Public or Private (as needed)
 * @query   ids=id1,id2,id3... (comma-separated string of _id values)
 */
export const lookupVarietiesByIds = async (req, res) => {
    const { ids } = req.query;

    if (!ids) {
        return res.status(400).json({ message: "Query parameter 'ids' is required." });
    }

    // Split the comma-separated string into an array, trim whitespace, filter empty
    // Also filter for potentially valid MongoDB ObjectId format before querying
    const idArray = ids.split(',')
                       .map(id => id.trim())
                       .filter(id => mongoose.Types.ObjectId.isValid(id)); // Check if IDs are valid format

    if (idArray.length === 0) {
        // Return empty if no valid IDs provided after filtering
        return res.status(200).json([]);
    }

    console.log(`GENOMIC Controller: Looking up ${idArray.length} variety IDs.`);

    try {
        // Find varieties where _id is in the array
        const results = await Variety.find({ _id: { $in: idArray } })
                                     .select('_id name') // Select ID and name
                                     .lean();

        console.log(`GENOMIC Controller: Found ${results.length} matching varieties.`);
        // Returns array like [{ _id: '...', name: '...' }]
        res.status(200).json(results);

    } catch (error) {
        console.error("❌ Error looking up varieties by ID:", error);
        res.status(500).json({ message: 'Server error looking up varieties.' });
    }
};

/**
 * @desc    Search for genotypes based on multiple criteria
 * @route   POST /genotype/search (Adjust route if different in genomicRoutes.js)
 * @access  Public or Private (depending on your setup)
 * @body    Includes referenceGenome, varietySet, snpSet, regionType, and type-specific params
 */
export const searchGenotypes = async (req, res) => {
    const {
        referenceGenome: referenceGenomeName,
        varietySet,
        snpSet,
        varietySubpopulation,
        regionType = 'range', // Default to range if not provided
        regionChromosome,
        regionStart,
        regionEnd,
        regionGeneLocus, // Used when regionType is 'geneLocus' (_id string)
        snpList,         // Placeholder for future use
        locusList        // Placeholder for future use
    } = req.body;

    console.log("GENOMIC Controller: Received genotype search request:", req.body);

    // --- Base Validation ---
    if (!referenceGenomeName || !varietySet || !snpSet) {
        return res.status(400).json({ message: "Reference Genome, Variety Set, and SNP Set are required." });
    }

    let searchContig = '';          // Chromosome/Contig name to filter by
    let searchStartPos = null;      // Start position to filter by
    let searchEndPos = null;        // End position to filter by
    let isCoordBasedSearch = false; // Flag if search is based on specific coordinates

    try {
        // --- Determine Search Coordinates/Filters based on regionType ---
        if (regionType === 'range') {
            searchContig = regionChromosome || ''; // Use provided chromosome or empty string for all
            searchStartPos = (regionStart !== undefined && regionStart !== '') ? parseInt(regionStart, 10) : null;
            searchEndPos = (regionEnd !== undefined && regionEnd !== '') ? parseInt(regionEnd, 10) : null;

            // Validate start/end if provided
             if ((searchStartPos !== null && isNaN(searchStartPos)) || (searchEndPos !== null && isNaN(searchEndPos)) || (searchStartPos !== null && searchStartPos < 0) || (searchStartPos !== null && searchEndPos !== null && searchStartPos > searchEndPos)) {
                 return res.status(400).json({ message: "Invalid Start/End position provided for Range search." });
             }
             // If a specific chromosome is selected, start and end are mandatory for range type
             if(searchContig && (searchStartPos === null || searchEndPos === null)){
                  return res.status(400).json({ message: "Start Position and End Position are required when a specific Chromosome is selected for Range search." });
             }

            console.log(`CONTROLLER: Range Search on ${searchContig || 'All Chromosomes'} (Positions: ${searchStartPos ?? 'any'}-${searchEndPos ?? 'any'})`);
            // Mark if we have coordinates to filter positions later
            if (searchStartPos !== null && searchEndPos !== null) {
                 isCoordBasedSearch = true;
            }

        } else if (regionType === 'geneLocus') {
            const locusId = regionGeneLocus; // This is the _id string from frontend
            if (!locusId || !mongoose.Types.ObjectId.isValid(locusId)) { // Validate ObjectId format
                return res.status(400).json({ message: "A valid Gene Locus ID is required." });
            }
            console.log(`CONTROLLER: Gene Locus Search for ID "${locusId}" in genome "${referenceGenomeName}"`);

            // --- Call Feature Service to get coordinates ---
            const coordsUrl = `${FEATURE_SERVICE_URL}/features/coords-by-id`; // Use correct internal path
            console.log(`Calling Feature Service: ${coordsUrl}?id=${locusId}&referenceGenome=${referenceGenomeName}`);
            try {
                 const featureCoordsRes = await axios.get(coordsUrl, {
                     params: { id: locusId, referenceGenome: referenceGenomeName }
                 });

                 if (!featureCoordsRes.data || featureCoordsRes.data.contig == null || featureCoordsRes.data.start == null || featureCoordsRes.data.end == null) {
                      console.log(`CONTROLLER: Coordinates not found or incomplete from Feature Service for Locus ID "${locusId}".`);
                      return res.status(404).json({ message: `Coordinates for Locus ID '${locusId}' not found in reference genome '${referenceGenomeName}'.` });
                 }

                 searchContig = featureCoordsRes.data.contig;
                 searchStartPos = parseInt(featureCoordsRes.data.start, 10);
                 searchEndPos = parseInt(featureCoordsRes.data.end, 10);

                 if (isNaN(searchStartPos) || isNaN(searchEndPos)) { throw new Error(`Invalid coordinates received from Feature Service for Locus ID ${locusId}`); }

                 console.log(`CONTROLLER: Found coordinates for Locus ID ${locusId}: ${searchContig}:${searchStartPos}-${searchEndPos}`);
                 isCoordBasedSearch = true; // We now have specific coordinates

            } catch (featureError) {
                 console.error(`❌ Error calling Feature Service for coordinates:`, featureError.response?.data || featureError.message);
                 if (featureError.response?.status === 404) { return res.status(404).json({ message: `Locus ID '${locusId}' not found in reference genome '${referenceGenomeName}'.` }); }
                 return res.status(503).json({ message: 'Error communicating with Feature Service to get coordinates.' });
            }
            // --- End Feature Service call ---

        } else if (regionType === 'snpList') {
             console.warn("CONTROLLER: snpList search not implemented.");
             return res.status(501).json({ message: "Search by SNP List is not yet implemented." });
             // TODO: Parse snpList, find corresponding positions (might need ref genome pos data), set isCoordBasedSearch=true or handle differently
        } else if (regionType === 'locusList') {
             console.warn("CONTROLLER: locusList search not implemented.");
             return res.status(501).json({ message: "Search by Locus List is not yet implemented." });
             // TODO: Parse locusList, call Feature service for each locus's coords, potentially combine ranges, set isCoordBasedSearch=true or handle differently
        } else {
             return res.status(400).json({ message: `Invalid region type specified: ${regionType}` });
        }

        // ====================================================================
        // --- Proceed with Genotype Search using derived coordinates/filters ---
        // ====================================================================

        // 1. Find Reference Genome Document
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
        if (!refGenomeDoc) { return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` }); }
        const referenceIdStr = refGenomeDoc._id.toString();
        console.log(`CONTROLLER: Found referenceGenome ObjectId: ${referenceIdStr}`);

        // 2. Get Reference Alleles for the determined region
        const { positions: refPositionsInRange, referenceAlleles } = await getReferencePositionsAndAlleles(
            referenceIdStr, searchContig, searchStartPos, searchEndPos
        );
        // If the search was based on specific coords (range with chr or locus) and NO ref positions are found in that precise range, return empty
        if (isCoordBasedSearch && refPositionsInRange.length === 0) {
             console.log("CONTROLLER: No reference positions found within the specified coordinates.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
        }
        // If refPositionsInRange is empty BUT it wasn't a specific coordinate search (e.g. range search on 'Any Chromosome' without start/end, or maybe a future list search yielding no positions), allow proceeding to find variety data if any exists.

        // 3. Filter Varieties by dataset criteria
        const varietyFilter = { varietySet, snpSet };
        if (varietySubpopulation) varietyFilter.subpopulation = varietySubpopulation;
        const matchingVarieties = await Variety.find(varietyFilter).select("_id id name accession subpopulation varietySet irisId").lean();
        if (!matchingVarieties || matchingVarieties.length === 0) {
            console.log("CONTROLLER: No varieties found matching dataset criteria.");
            // Return ref positions even if no varieties match
            return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: refPositionsInRange, varieties: [ /* Only include reference row later if needed */ ] });
        }
        const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString());
        const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v]));
        console.log(`CONTROLLER: Found ${matchingVarieties.length} matching varieties.`);

        // 4. Fetch Relevant Variety Position Documents based on determined coordinates
        const varietyPosFilter = { referenceId: { $in: matchingVarietyObjectIdStrings } };
        if (searchContig) { varietyPosFilter.contig = searchContig; }
        if (searchStartPos !== null && searchEndPos !== null) {
             varietyPosFilter.start = { $lte: searchEndPos }; // Overlap query
             varietyPosFilter.end = { $gte: searchStartPos };
        }
        console.log("CONTROLLER: Finding variety position data with filter:", varietyPosFilter);
        const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId").lean();
        console.log(`CONTROLLER: Found ${varietyPositionDocs.length} relevant variety position document(s).`);

        // 5. Aggregate final positions and build Allele Map
        // Final positions will be the intersection of reference positions (if range-based) and variety positions found
        const finalPositionSet = new Set();
        const alleleMap = new Map(); // Map<varietyId_string, Map<position_number, allele_string>>
        console.log("CONTROLLER: Building Allele Map...");

        // Determine the set of positions to actually include in the output table
        // If we have reference positions for the range, only include variety positions that match those reference positions.
        // If we don't have specific reference positions (e.g., range search on 'Any' without start/end), include all found variety positions within the document filter.
        const referencePositionsSet = new Set(refPositionsInRange);
        const useReferencePositionsAsFilter = referencePositionsSet.size > 0;

        for (const doc of varietyPositionDocs) {
            const varietyIdStr = doc.referenceId;
            if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object' || !matchingVarietyIdMap.has(varietyIdStr)) continue;
            if (!alleleMap.has(varietyIdStr)) alleleMap.set(varietyIdStr, new Map());
            const varietyAlleleData = alleleMap.get(varietyIdStr);

            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position)) {
                    // Condition: Position must be within the searched range AND (if applicable) must exist in the reference genome for that range
                     if ((searchStartPos === null || (position >= searchStartPos && position <= searchEndPos)) &&
                         (!useReferencePositionsAsFilter || referencePositionsSet.has(position)) )
                     {
                         finalPositionSet.add(position); // Add to final set
                         varietyAlleleData.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?');
                     }
                }
            }
        }

        // Ensure reference positions (within range) are included even if no variety had data there
        refPositionsInRange.forEach(pos => finalPositionSet.add(pos));

        const finalPositions = Array.from(finalPositionSet).sort((a, b) => a - b);
        console.log(`CONTROLLER: Final positions for output: ${finalPositions.length}`);

        // 6. Format Final Response
        if (finalPositions.length === 0) {
             console.log("CONTROLLER: No relevant positions identified after filtering reference and varieties.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
        }

        const finalResults = {
            referenceGenomeName: referenceGenomeName,
            positions: finalPositions,
            varieties: []
        };

        // Add Reference Row (using ONLY final positions)
        const referenceGenomeRowData = {
            name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-',
            subpop: '-', dataset: '-', mismatch: 0, alleles: {}
        };
        for (const pos of finalPositions) {
            referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; // Get allele if exists for this pos
        }
        finalResults.varieties.push(referenceGenomeRowData);

        // Add Variety Rows (using ONLY final positions)
        for (const variety of matchingVarieties) {
            const varietyIdStr = variety._id.toString();
            const varietyAllelesData = alleleMap.get(varietyIdStr);
            const formattedAlleles = {};
            let mismatchCount = 0;
            for (const pos of finalPositions) {
                const varAllele = varietyAllelesData?.get(pos); // Allele from this variety
                const refAllele = referenceAlleles.get(pos); // Allele from reference map
                formattedAlleles[pos] = varAllele ?? '-';
                // Mismatch Calculation
                if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
                    mismatchCount++;
                }
            }
            finalResults.varieties.push({
                name: variety.name, accession: variety.accession, assay: variety.irisId ?? 'N/A',
                subpop: variety.subpopulation, dataset: variety.varietySet,
                mismatch: mismatchCount, alleles: formattedAlleles
            });
        }
        console.log(`CONTROLLER: Formatted ${finalResults.varieties.length} total rows for response.`);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error("❌ Error during genotype search:", error);
        res.status(500).json({ message: "Server Error during genotype search." });
    }
};

const getReferencePositionsAndAlleles = async (referenceIdStr, contig, startPos, endPos) => {
    const refPosFilter = { referenceId: referenceIdStr };
    if (contig && typeof contig === 'string' && contig.trim() !== '') {
        refPosFilter.contig = contig;
    }
    if (typeof startPos === 'number' && typeof endPos === 'number' && !isNaN(startPos) && !isNaN(endPos)) {
        // Find documents where the range overlaps the query range
        refPosFilter.start = { $lte: endPos };
        refPosFilter.end = { $gte: startPos };
        console.log(`HELPER (getRefPosAndAlleles): Applying range filter: ${contig || 'AllChr'}:${startPos}-${endPos}`);
    } else {
         console.log("HELPER (getRefPosAndAlleles): No strict range filter applied to position documents.");
    }

    console.log("HELPER (getRefPosAndAlleles): Finding reference position docs matching:", refPosFilter);
    // Select only necessary fields
    const refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("positions start end").lean();
    console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} reference position document(s).`);

    const includedPositions = new Set();
    const referenceAlleleMap = new Map(); // Map<position_number, allele_string>

    for (const doc of refPositionDocs) {
        if (doc.positions && typeof doc.positions === 'object') {
            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position)) {
                    // If a specific range was provided for filtering documents (startPos/endPos != null),
                    // ensure the individual position also falls within that specific range.
                    // If no specific range was provided (startPos/endPos == null), include all positions from matched documents.
                    if (startPos === null || (position >= startPos && position <= endPos)) {
                        includedPositions.add(position);
                        referenceAlleleMap.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?');
                    }
                }
            }
        }
    }
    const finalPositions = Array.from(includedPositions).sort((a, b) => a - b);
    console.log(`HELPER (getRefPosAndAlleles): Returning ${finalPositions.length} positions and ${referenceAlleleMap.size} ref alleles.`);
    return { positions: finalPositions, referenceAlleles: referenceAlleleMap };
};