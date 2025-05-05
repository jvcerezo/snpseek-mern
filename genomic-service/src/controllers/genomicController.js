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
const LIST_SERVICE_URL_INTERNAL = process.env.LIST_SERVICE_URL_INTERNAL || "http://localhost:5003"; // Default to local if not set
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
 * Fetches reference positions and alleles based on coordinates, specific positions, OR SNP IDs.
 * @param {string} referenceIdStr - ObjectId string of the reference genome.
 * @param {string | null} [contig] - Optional contig/chromosome name (used for coordinate search).
 * @param {number | null} [startPos] - Optional start position (used for coordinate search).
 * @param {number | null} [endPos] - Optional end position (used for coordinate search).
 * @param {string[]} [snpIdList] - Optional list of SNP IDs to find positions for.
 * @param {Array<{chr: string, pos: number}>} [specificPositions] - Optional list of specific {chr, pos} objects.
 * @returns {Promise<{positions: number[], referenceAlleles: Map<number, string>}>}
 */
const getReferencePositionsAndAlleles = async (referenceIdStr, contig = null, startPos = null, endPos = null, snpIdList = null, specificPositions = null) => {
    const includedPositions = new Set();
    const referenceAlleleMap = new Map();
    let refPositionDocs = [];
    let finalQueryPositions = [];

    try {
        if (specificPositions && Array.isArray(specificPositions) && specificPositions.length > 0) {
            // --- Specific Positions List Mode ---
            console.log(`HELPER (getRefPosAndAlleles): Finding refAlleles for ${specificPositions.length} specific positions.`);
            finalQueryPositions = specificPositions.map(p => p.pos).sort((a, b) => a - b);
            // Query logic assumes individual docs per position/SNP - ADJUST SCHEMA/FIELDS
            const orClauses = specificPositions.map(p => ({ contig: p.chr, position: p.pos }));
            const refPosFilter = { referenceId: referenceIdStr, $or: orClauses };
            refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("position refAllele contig").lean();
            console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} ref doc(s) matching specific positions.`);
            for (const doc of refPositionDocs) { if (doc.position != null && doc.refAllele != null) { const position = parseInt(doc.position, 10); if(!isNaN(position)){ referenceAlleleMap.set(position, typeof doc.refAllele === 'string' ? doc.refAllele : '?'); } } }
            finalQueryPositions.forEach(pos => { if (!referenceAlleleMap.has(pos)) { referenceAlleleMap.set(pos, '?'); } });

        } else if (snpIdList && Array.isArray(snpIdList) && snpIdList.length > 0) {
            // --- SNP List Based Search ---
            console.log(`HELPER (getRefPosAndAlleles): Finding positions for ${snpIdList.length} specific SNP IDs.`);
            const refPosFilter = { referenceId: referenceIdStr, snpIdentifier: { $in: snpIdList } }; // Adjust field name
            refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("position refAllele snpIdentifier contig").lean(); // Adjust fields
            console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} ref doc(s) matching SNP IDs.`);
            for (const doc of refPositionDocs) { if (doc.position != null && doc.refAllele != null) { const position = parseInt(doc.position, 10); if(!isNaN(position)){ includedPositions.add(position); referenceAlleleMap.set(position, typeof doc.refAllele === 'string' ? doc.refAllele : '?'); } } }
            finalQueryPositions = Array.from(includedPositions).sort((a, b) => a - b);

        } else {
            // --- Coordinate Based Search ---
            const refPosFilter = { referenceId: referenceIdStr }; if (contig) { refPosFilter.contig = contig; }
            if (startPos !== null && endPos !== null) { refPosFilter.start = { $lte: endPos }; refPosFilter.end = { $gte: startPos }; console.log(`HELPER (getRefPosAndAlleles): Applying coordinate range filter: ${contig || 'AllChr'}:${startPos}-${endPos}`);}
            else { console.log("HELPER (getRefPosAndAlleles): No strict coordinate range filter applied."); }
            console.log("HELPER (getRefPosAndAlleles): Finding reference position docs matching:", refPosFilter);
            refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("positions").lean(); console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} ref doc(s) for coord search.`);
            for (const doc of refPositionDocs) { if (doc.positions && typeof doc.positions === 'object') { for (const posStr in doc.positions) { const position = parseInt(posStr, 10); if (!isNaN(position)) { if (startPos === null || (position >= startPos && position <= endPos)) { includedPositions.add(position); referenceAlleleMap.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?'); } } } } }
            finalQueryPositions = Array.from(includedPositions).sort((a, b) => a - b);
        }
    } catch (dbError) {
        console.error("HELPER (getRefPosAndAlleles): Database error:", dbError);
        return { positions: [], referenceAlleles: new Map() };
    }
    console.log(`HELPER (getRefPosAndAlleles): Returning ${finalQueryPositions.length} unique positions.`);
    return { positions: finalQueryPositions, referenceAlleles: referenceAlleleMap };
};

/**
 * @desc    Search genotypes for PUBLIC region types (range, geneLocus)
 * @route   POST /genotype/search/public
 * @access  Public
 */
export const searchGenotypesPublic = async (req, res) => {
    // --- 1. Extract and Validate Input ---
    const {
        referenceGenome: referenceGenomeName,
        varietySet,
        snpSet,
        varietySubpopulation, // Includes "", "ALL", or specific subpop
        regionType = 'range',
        regionChromosome,
        regionStart,
        regionEnd,
        regionGeneLocus
        // selectedVarietyListId is ignored here
    } = req.body;

    console.log("CONTROLLER (Public): Received request:", req.body);

    if (regionType !== 'range' && regionType !== 'geneLocus') {
        return res.status(400).json({ message: `Invalid regionType '${regionType}' provided for public search.` });
    }
    if (!referenceGenomeName || !varietySet || !snpSet) {
        return res.status(400).json({ message: "Reference Genome, Variety Set, and SNP Set are required." });
    }

    // Initialize variables
    let positionsToUse = [];
    let referenceAllelesMap = new Map();
    let searchContigForVarPos = '';
    let searchStartPosForVarPos = null;
    let searchEndPosForVarPos = null;
    let isSpecificCoordSearch = false; // To know if empty results in a specific range are truly empty

    try {
        // --- 2. Find Reference Genome Document ---
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
        if (!refGenomeDoc) {
             console.log(`CONTROLLER (Public): Reference Genome '${referenceGenomeName}' not found.`);
             return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` });
        }
        const referenceIdStr = refGenomeDoc._id.toString();
        console.log(`CONTROLLER (Public): Found referenceGenome ObjectId: ${referenceIdStr}`);

        // --- 3. Determine Target Positions and Reference Alleles ---
        if (regionType === 'range') {
            searchContigForVarPos = regionChromosome || '';
            searchStartPosForVarPos = (regionStart !== undefined && regionStart !== '') ? parseInt(regionStart, 10) : null;
            searchEndPosForVarPos = (regionEnd !== undefined && regionEnd !== '') ? parseInt(regionEnd, 10) : null;

            // Validate range parameters
            if ((searchStartPosForVarPos !== null && isNaN(searchStartPosForVarPos)) || (searchEndPosForVarPos !== null && isNaN(searchEndPosForVarPos)) || (searchStartPosForVarPos !== null && searchStartPosForVarPos < 0) || (searchStartPosForVarPos !== null && searchEndPosForVarPos !== null && searchStartPosForVarPos > searchEndPosForVarPos)) {
                return res.status(400).json({ message: "Invalid Start/End position provided for Range search." });
            }
            if(searchContigForVarPos && (searchStartPosForVarPos === null || searchEndPosForVarPos === null)){
                 return res.status(400).json({ message: "Start Position and End Position are required when a specific Chromosome is selected for Range search." });
            }
            console.log(`CONTROLLER (Public): Range Search on ${searchContigForVarPos || 'All Chr'} (${searchStartPosForVarPos ?? 'any'}-${searchEndPosForVarPos ?? 'any'})`);

            // Call helper with coordinates
            const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(
                referenceIdStr, searchContigForVarPos, searchStartPosForVarPos, searchEndPosForVarPos
            );
            positionsToUse = positions;
            referenceAllelesMap = referenceAlleles;

            // Flag if it was a search within specific bounds
            if (searchContigForVarPos && searchStartPosForVarPos !== null && searchEndPosForVarPos !== null) {
                 isSpecificCoordSearch = true;
            }
            // Variables for VarietiesPos query were set above

        } else if (regionType === 'geneLocus') {
            const locusId = regionGeneLocus;
            if (!locusId || !mongoose.Types.ObjectId.isValid(locusId)) {
                return res.status(400).json({ message: "A valid Gene Locus ID is required." });
            }
            console.log(`CONTROLLER (Public): Gene Locus Search for ID "${locusId}"`);
            let locusContig, locusStart, locusEnd;

            // Call Feature Service for coordinates
            try {
                const coordsUrl = `${FEATURE_SERVICE_URL}/features/coords-by-id`;
                console.log(`CONTROLLER (Public): Calling Feature Service: ${coordsUrl}?id=${locusId}&referenceGenome=${referenceGenomeName}`);
                const featureCoordsRes = await axios.get(coordsUrl, { params: { id: locusId, referenceGenome: referenceGenomeName } });

                if (!featureCoordsRes.data || featureCoordsRes.data.contig == null || featureCoordsRes.data.start == null || featureCoordsRes.data.end == null) {
                     console.log(`CONTROLLER (Public): Coordinates not found or incomplete from Feature Service for Locus ID "${locusId}".`);
                     return res.status(404).json({ message: `Coordinates for Locus ID '${locusId}' not found in reference genome '${referenceGenomeName}'.` });
                }
                locusContig = featureCoordsRes.data.contig;
                locusStart = parseInt(featureCoordsRes.data.start, 10);
                locusEnd = parseInt(featureCoordsRes.data.end, 10);

                if (isNaN(locusStart) || isNaN(locusEnd)) { throw new Error(`Invalid coordinates received from Feature Service for Locus ID ${locusId}`); }
                console.log(`CONTROLLER (Public): Found coordinates for Locus ID ${locusId}: ${locusContig}:${locusStart}-${locusEnd}`);
            } catch (featureError) {
                 console.error(`❌ Error calling Feature Service for coordinates:`, featureError.response?.data || featureError.message);
                 return res.status(503).json({ message: 'Error communicating with Feature Service to get coordinates.' });
            }

            // Call helper with fetched coordinates
            const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(
                referenceIdStr, locusContig, locusStart, locusEnd
            );
            positionsToUse = positions;
            referenceAllelesMap = referenceAlleles;
            isSpecificCoordSearch = true; // Locus search is always specific
            // Set vars for VarietiesPos query
            searchContigForVarPos = locusContig; searchStartPosForVarPos = locusStart; searchEndPosForVarPos = locusEnd;
        }

        // --- 4. Handle No Positions Found ---
        if (isSpecificCoordSearch && (!positionsToUse || positionsToUse.length === 0)) {
            console.log("CONTROLLER (Public): No reference positions identified for the specific coordinate search criteria.");
            // Return completely empty results if specific range/locus yielded nothing
            return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
        }
        if (!positionsToUse || positionsToUse.length === 0) {
             console.log("CONTROLLER (Public): No reference positions identified for the broad search criteria.");
             // Return just the reference row header if no positions found in broad search
             const refRow = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: {} };
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [refRow] });
        }
        console.log(`CONTROLLER (Public): Identified ${positionsToUse.length} positions to use for search.`);

        // ====================================================================
        // --- COMMON STEPS: Filter Varieties & Proceed ---
        // ====================================================================

        // --- 5. Filter Varieties ---
        const varietyFilter = { varietySet, snpSet }; // Base required filters
        // Apply subpopulation filter (handling "ALL" and "")
        if (varietySubpopulation && varietySubpopulation !== "ALL" && varietySubpopulation !== "") {
            varietyFilter.subpopulation = varietySubpopulation;
            console.log(`CONTROLLER (Public): Applying filter for specific subpopulation: ${varietySubpopulation}`);
        } else {
            console.log(`CONTROLLER (Public): No specific subpopulation filter applied (Value: '${varietySubpopulation || ""}')`);
        }
        // selectedVarietyListId is ignored in public controller

        console.log("CONTROLLER (Public): Finding matching varieties with final filter:", varietyFilter);
        const matchingVarieties = await Variety.find(varietyFilter)
            .select("_id id name accession subpopulation varietySet irisId") // Select fields needed later
            .lean();

        // Handle No Varieties Found after filtering
        if (!matchingVarieties || matchingVarieties.length === 0) {
            console.log("CONTROLLER (Public): No varieties found matching dataset criteria.");
            // Still return the reference row with the identified positions' alleles
            const refRowAlleles = {};
            positionsToUse.forEach(pos => { refRowAlleles[pos] = referenceAllelesMap.get(pos) ?? '?' });
            const refRow = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: refRowAlleles };
            return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: positionsToUse, varieties: [refRow] });
        }
        const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString());
        const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v]));
        console.log(`CONTROLLER (Public): Found ${matchingVarieties.length} matching varieties.`);


        // --- 6. Fetch Relevant Variety Position Data ---
        // Filter VarietiesPos docs by the varieties found AND the coordinates determined earlier
        const varietyPosFilter = { referenceId: { $in: matchingVarietyObjectIdStrings } };
        if (searchContigForVarPos) {
            varietyPosFilter.contig = searchContigForVarPos;
        }
        if (searchStartPosForVarPos !== null && searchEndPosForVarPos !== null) {
             varietyPosFilter.start = { $lte: searchEndPosForVarPos }; // Overlap query
             varietyPosFilter.end = { $gte: searchStartPosForVarPos };
        }
        console.log("CONTROLLER (Public): Finding variety position data with filter:", varietyPosFilter);
        const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId").lean(); // Select only needed fields
        console.log(`CONTROLLER (Public): Found ${varietyPositionDocs.length} relevant variety position document(s).`);


        // --- 7. Aggregate Allele Map ---
        const finalPositionsSet = new Set(positionsToUse); // Use only positions identified in step 3/4
        const alleleMap = new Map(); // Map<varietyId_string, Map<position_number, allele_string>>
        console.log(`CONTROLLER (Public): Building Allele Map for ${finalPositionsSet.size} target positions...`);

        for (const doc of varietyPositionDocs) {
            const varietyIdStr = doc.referenceId;
            // Skip if doc doesn't match one of our varieties or has no positions
            if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object' || !matchingVarietyIdMap.has(varietyIdStr)) continue;

            if (!alleleMap.has(varietyIdStr)) {
                 alleleMap.set(varietyIdStr, new Map());
            }
            const varietyAlleleData = alleleMap.get(varietyIdStr);

            // Extract alleles only for the target positions
            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position) && finalPositionsSet.has(position)) { // Filter using the target positions
                    varietyAlleleData.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?');
                }
            }
        }


        // --- 8. Format Final Response ---
        const finalPositions = positionsToUse; // Use the sorted array determined earlier
        console.log(`CONTROLLER (Public): Formatting final response for ${finalPositions.length} positions.`);

        const finalResults = {
            referenceGenomeName: referenceGenomeName,
            positions: finalPositions,
            varieties: []
        };

        // Create and Add Reference Row
        const referenceGenomeRowData = {
            name: referenceGenomeName,
            assay: 'Reference',
            accession: refGenomeDoc.id || '-', // Use 'id' if available, else '-'
            subpop: '-',
            dataset: '-',
            mismatch: 0,
            alleles: {}
        };
        for (const pos of finalPositions) {
            // Populate alleles from the map generated in step 3/4
            referenceGenomeRowData.alleles[pos] = referenceAllelesMap.get(pos) ?? '?';
        }
        finalResults.varieties.push(referenceGenomeRowData);

        // Create and Add Variety Rows
        for (const variety of matchingVarieties) {
            const varietyIdStr = variety._id.toString();
            const varietyAllelesData = alleleMap.get(varietyIdStr); // Get map for this variety
            const formattedAlleles = {};
            let mismatchCount = 0;

            // Populate alleles for all final positions
            for (const pos of finalPositions) {
                const varAllele = varietyAllelesData?.get(pos); // Allele from this variety's map (if found)
                const refAllele = referenceAllelesMap.get(pos); // Allele from reference map
                formattedAlleles[pos] = varAllele ?? '-'; // Default to '-' if variety has no data for this pos

                // Calculate Mismatch
                if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
                    mismatchCount++;
                }
            }

            finalResults.varieties.push({
                name: variety.name,
                accession: variety.accession,
                assay: variety.irisId ?? 'N/A', // Use irisId for assay? Or another field?
                subpop: variety.subpopulation,
                dataset: variety.varietySet,
                mismatch: mismatchCount,
                alleles: formattedAlleles
            });
        }
        console.log(`CONTROLLER (Public): Formatted ${finalResults.varieties.length} total rows.`);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error("❌ Error during public genotype search:", error);
         if (error.response) { // Axios error from internal call (e.g., Feature Service)
             res.status(error.response.status || 503).json({ message: error.response.data?.message || 'Error during internal service communication.' });
         } else { // Other errors (DB, validation logic, etc.)
             res.status(error.status || 500).json({ message: error.message || "Server Error during public genotype search." });
         }
    }
};

/**
 * @desc    Search genotypes for ANY region type, applying private filters (like variety list)
 * when provided. Handles 'snpList' and 'locusList' region types which require auth.
 * @route   POST /genotype/search/private
 * @access  Private (Requires valid JWT via 'protect' middleware)
 */
export const searchGenotypesPrivate = async (req, res) => {
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log("--- ENTERING searchGenotypesPrivate Controller ---");
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    // --- 1. Authentication & Input Extraction ---
    if (!req.user || !req.user.id) {
        console.error("CONTROLLER (Private): Middleware check failed - req.user not set! Ensure 'protect' middleware runs correctly before this controller.");
        return res.status(500).json({ message: "Internal Server Error: User context not available." });
    }
    const userId = req.user.id; // User ID is confirmed by protect middleware

    const {
        referenceGenome: referenceGenomeName,
        varietySet,
        snpSet,
        varietySubpopulation,
        selectedVarietyListId, // <-- Variety list filter ID
        regionType,            // Can be 'range', 'geneLocus', 'snpList', 'locusList'
        regionChromosome,
        regionStart,
        regionEnd,
        regionGeneLocus,
        snpList: listIdForRegion, // ID if regionType is 'snpList'
        locusList                // Text if regionType is 'locusList'
    } = req.body;

    console.log(`CONTROLLER (Private): User ${userId} | Request Body:`, req.body);

    // --- 2. Base Parameter Validation ---
    if (!referenceGenomeName || !varietySet || !snpSet) {
        return res.status(400).json({ message: "Reference Genome, Variety Set, and SNP Set are required." });
    }
     if (selectedVarietyListId && !mongoose.Types.ObjectId.isValid(selectedVarietyListId)) {
          return res.status(400).json({ message: "Invalid format for selected Variety List ID." });
     }
     // *** The faulty strict regionType check that caused the error HAS BEEN REMOVED ***

    // Initialize variables
    let positionsToUse = [];
    let referenceAllelesMap = new Map();
    let searchContigForVarPos = '';
    let searchStartPosForVarPos = null;
    let searchEndPosForVarPos = null;
    let varietyObjectIdsFromList = null;
    let isSpecificCoordSearch = false;

    try {
        console.log(`CONTROLLER (Private): User ${userId}, RegionType ${regionType}. Entering main TRY block.`);

        // --- 3. Find Reference Genome Document ---
        console.log(`CONTROLLER (Private): Finding reference genome '${referenceGenomeName}'...`);
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
        if (!refGenomeDoc) {
             console.log(`CONTROLLER (Private): Reference Genome '${referenceGenomeName}' not found.`);
             return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` });
        }
        const referenceIdStr = refGenomeDoc._id.toString();
        console.log(`CONTROLLER (Private): Found referenceGenome ObjectId: ${referenceIdStr}`);

        // --- 4. Determine Target Positions and Reference Alleles (based on regionType) ---
        console.log(`CONTROLLER (Private): Processing regionType '${regionType}'...`);
        if (regionType === 'range') {
            searchContigForVarPos = regionChromosome || '';
            searchStartPosForVarPos = (regionStart !== undefined && regionStart !== '') ? parseInt(regionStart, 10) : null;
            searchEndPosForVarPos = (regionEnd !== undefined && regionEnd !== '') ? parseInt(regionEnd, 10) : null;
            // Validation for range type
            if ((searchStartPosForVarPos !== null && isNaN(searchStartPosForVarPos)) || (searchEndPosForVarPos !== null && isNaN(searchEndPosForVarPos)) || (searchStartPosForVarPos !== null && searchStartPosForVarPos < 0) || (searchStartPosForVarPos !== null && searchEndPosForVarPos !== null && searchStartPosForVarPos > searchEndPosForVarPos)) { return res.status(400).json({ message: "Invalid Start/End position." }); }
            if(searchContigForVarPos && (searchStartPosForVarPos === null || searchEndPosForVarPos === null)){ return res.status(400).json({ message: "Start/End Position required with Chromosome." }); }
            console.log(`CONTROLLER (Private): Range Search on ${searchContigForVarPos || 'All Chr'}:${searchStartPosForVarPos ?? 'any'}-${searchEndPosForVarPos ?? 'any'}`);
            // Call helper with coordinates
            const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(referenceIdStr, searchContigForVarPos, searchStartPosForVarPos, searchEndPosForVarPos);
            positionsToUse = positions; referenceAllelesMap = referenceAlleles;
            if (searchContigForVarPos && searchStartPosForVarPos !== null && searchEndPosForVarPos !== null) { isSpecificCoordSearch = true; }
            // search*ForVarPos are already set

        } else if (regionType === 'geneLocus') {
            const locusId = regionGeneLocus;
            if (!locusId || !mongoose.Types.ObjectId.isValid(locusId)) { return res.status(400).json({ message: "A valid Gene Locus ID is required." }); }
             console.log(`CONTROLLER (Private): Processing Region Type 'geneLocus' for ID "${locusId}"`);
            let locusContig, locusStart, locusEnd;
            // Get Coordinates from Feature Service
            try {
                const coordsUrl = `${FEATURE_SERVICE_URL}/features/coords-by-id`;
                 console.log(`CONTROLLER (Private): Calling Feature Service: ${coordsUrl}?id=${locusId}&referenceGenome=${referenceGenomeName}`);
                const featureCoordsRes = await axios.get(coordsUrl, { params: { id: locusId, referenceGenome: referenceGenomeName } });
                if (!featureCoordsRes.data || featureCoordsRes.data.contig == null || featureCoordsRes.data.start == null || featureCoordsRes.data.end == null) { return res.status(404).json({ message: `Coordinates for Locus ID '${locusId}' not found.` }); }
                locusContig = featureCoordsRes.data.contig; locusStart = parseInt(featureCoordsRes.data.start, 10); locusEnd = parseInt(featureCoordsRes.data.end, 10); if (isNaN(locusStart) || isNaN(locusEnd)) { throw new Error(`Invalid coordinates received.`); }
                 console.log(`CONTROLLER (Private): Found coordinates: ${locusContig}:${locusStart}-${locusEnd}`);
            } catch (featureError) { console.error(`❌ Error calling Feature Service:`, featureError.response?.data || featureError.message); return res.status(503).json({ message: 'Error getting locus coordinates.' }); }
            // Call helper
            const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(referenceIdStr, locusContig, locusStart, locusEnd);
            positionsToUse = positions; referenceAllelesMap = referenceAlleles; isSpecificCoordSearch = true;
            searchContigForVarPos = locusContig; searchStartPosForVarPos = locusStart; searchEndPosForVarPos = locusEnd; // Set vars

        } else if (regionType === 'snpList') {
             if (!listIdForRegion || !mongoose.Types.ObjectId.isValid(listIdForRegion)) { return res.status(400).json({ message: "A valid List ID is required for 'snpList' region type." }); }
             console.log(`CONTROLLER (Private): Processing Region Type 'snpList' (List ID: "${listIdForRegion}")`);
             // Fetch List Content
             let regionListDoc;
             try {
                const listServiceUrl = `${LIST_SERVICE_URL_INTERNAL}/api/lists/internal/${listIdForRegion}`; console.log(`CONTROLLER (Private): Calling List Service for region list at: ${listServiceUrl}`);
                const listResponse = await axios.get(listServiceUrl, { headers: { 'Authorization': req.headers.authorization } }); regionListDoc = listResponse.data;
                if (regionListDoc.userId?.toString() !== userId) { return res.status(403).json({ message: 'Forbidden: Region list ownership mismatch.' }); } if (!Array.isArray(regionListDoc.content) || regionListDoc.content.length === 0) { return res.status(400).json({ message: `List ('${regionListDoc.name}') content is empty.` }); }
             } catch (listError) { console.error(`❌ Error calling List Service for region list:`, listError.response?.data || listError.message); const status = listError.response?.status; const message = listError.response?.data?.message; if (status === 404) { return res.status(404).json({ message: message || `Region List ID ${listIdForRegion} not found.` }); } if (status === 403) { return res.status(403).json({ message: message || 'Forbidden: Could not access region list.' }); } if (status === 401) { return res.status(401).json({ message: message || 'Unauthorized by List Service.' }); } return res.status(503).json({ message: message || 'Error communicating with List Service.' }); }

             // Determine Content Format and Extract Parameters/Positions
             const firstItem = regionListDoc.content[0];
             if (typeof firstItem === 'string' && firstItem.includes(':') && firstItem.includes('-')) { // Format 1: Region String
                 console.log(`CONTROLLER (Private): Detected Region String format in list ${listIdForRegion}.`); if (regionListDoc.content.length > 1) { console.warn(`CONTROLLER (Private): Using only first item from region-formatted list: ${firstItem}`); }
                 const regionString = firstItem; const chrMatch = regionString.match(/^([^:]+):/); const rangeMatch = regionString.match(/:(\d+)-(\d+)$/); if (!chrMatch || !rangeMatch) { return res.status(400).json({ message: `Invalid region format: '${regionString}'.` }); } const listChr = chrMatch[1]; const listStart = parseInt(rangeMatch[1], 10); const listEnd = parseInt(rangeMatch[2], 10); if (!listChr || isNaN(listStart) || isNaN(listEnd) || listStart < 0 || listStart > listEnd) { return res.status(400).json({ message: `Invalid coordinates in region string '${regionString}'.` }); }
                 console.log(`CONTROLLER (Private): Using region from list: ${listChr}:${listStart}-${listEnd}`); const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(referenceIdStr, listChr, listStart, listEnd); positionsToUse = positions; referenceAllelesMap = referenceAlleles; searchContigForVarPos = listChr; searchStartPosForVarPos = listStart; searchEndPosForVarPos = listEnd;
             } else if (typeof firstItem === 'string' && /\s+/.test(firstItem)) { // Format 2: Chr Pos Strings
                  console.log(`CONTROLLER (Private): Detected Chr+Pos format in list ${listIdForRegion}.`); const specificPositions = []; let parseError = false; for (const item of regionListDoc.content) { const parts = item.trim().split(/\s+/); if (parts.length !== 2) { parseError = true; break; } const chr = parts[0]; const pos = parseInt(parts[1], 10); if (!chr || isNaN(pos) || pos < 0) { parseError = true; break; } specificPositions.push({ chr, pos }); } if (parseError || specificPositions.length === 0) { return res.status(400).json({ message: `List '${regionListDoc.name}' contains invalid 'chr pos' items.` }); }
                  console.log(`CONTROLLER (Private): Parsed ${specificPositions.length} specific Chr/Pos pairs.`); const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(referenceIdStr, null, null, null, null, specificPositions); positionsToUse = positions; referenceAllelesMap = referenceAlleles; searchContigForVarPos = ''; searchStartPosForVarPos = null; searchEndPosForVarPos = null;
             } else { return res.status(400).json({ message: `List '${regionListDoc.name}' has unrecognized content format.` }); }

        } else if (regionType === 'locusList') {
             const locusIdsFromText = locusList?.split('\n').map(l => l.trim()).filter(l => l) ?? []; if (locusIdsFromText.length === 0) { return res.status(400).json({ message: "Locus list text cannot be empty." }); } console.log(`CONTROLLER (Private): Processing Region Type 'locusList' for ${locusIdsFromText.length} loci`); let combinedRefPositions = new Set(); let combinedRefAlleles = new Map();
             try { /* ... call feature service, call helper, combine results ... */
                  const batchCoordsUrl = `${FEATURE_SERVICE_URL}/features/batch-coords-by-id`; console.log(`CONTROLLER (Private): Calling Feature Service (Batch): ${batchCoordsUrl} for ${locusIdsFromText.length} IDs`); const batchCoordsRes = await axios.post(batchCoordsUrl, { ids: locusIdsFromText, referenceGenome: referenceGenomeName }); const coords = batchCoordsRes.data?.success ?? []; if (coords.length === 0) { return res.status(404).json({ message: `Coordinates for Locus IDs not found.` }); }
                  console.log(`CONTROLLER (Private): Fetching reference positions for ${coords.length} locus coordinate ranges.`); for (const locCoord of coords) { const fetchedContig = locCoord.contig; const fetchedStart = parseInt(locCoord.start, 10); const fetchedEnd = parseInt(locCoord.end, 10); if (!fetchedContig || isNaN(fetchedStart) || isNaN(fetchedEnd) || fetchedStart < 0 || fetchedStart > fetchedEnd) { console.warn(`CONTROLLER (Private): Skipping invalid coords from Feature Service:`, locCoord); continue; } const { positions, referenceAlleles } = await getReferencePositionsAndAlleles(referenceIdStr, fetchedContig, fetchedStart, fetchedEnd); positions.forEach(p => combinedRefPositions.add(p)); referenceAlleles.forEach((allele, pos) => combinedRefAlleles.set(pos, allele)); } positionsToUse = Array.from(combinedRefPositions).sort((a, b) => a - b); referenceAllelesMap = combinedRefAlleles;
             } catch (batchFeatureError) { console.error(`❌ Error calling Feature Service (Batch):`, batchFeatureError.response?.data || batchFeatureError.message); return res.status(503).json({ message: batchFeatureError.response?.data?.message || 'Error getting batch coordinates.' }); }
             searchContigForVarPos = ''; searchStartPosForVarPos = null; searchEndPosForVarPos = null; // No single coordinate range
        } else {
             // Handle potential invalid regionType if it somehow gets here
             console.error(`CONTROLLER (Private): Reached end of regionType check with unexpected type: ${regionType}`);
             return res.status(400).json({ message: `Unsupported region type '${regionType}' in private search.` });
        }

        // --- 5. Handle No Positions Found ---
        if (!positionsToUse || positionsToUse.length === 0) {
            console.log("CONTROLLER (Private): No relevant positions identified for the search criteria.");
             const refRow = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: {} };
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [refRow] });
        }
        console.log(`CONTROLLER (Private): Identified ${positionsToUse.length} positions to use.`);


        // ====================================================================
        // --- COMMON STEPS: Filter Varieties & Proceed ---
        // ====================================================================

        // --- 6. Fetch Variety List Filter Content (If Applied) ---
        varietyObjectIdsFromList = null; // Reset before checking
        if (selectedVarietyListId && mongoose.Types.ObjectId.isValid(selectedVarietyListId)) {
             console.log(`CONTROLLER (Private): Applying filter using variety list ID: ${selectedVarietyListId}`);
             try {
                 const varListServiceUrl = `${LIST_SERVICE_URL_INTERNAL}/mylists/internal/${selectedVarietyListId}`;
                 console.log(`CONTROLLER (Private): Calling List Service for variety list at: ${varListServiceUrl}`);
                 const varListResponse = await axios.get(varListServiceUrl, { headers: { 'Authorization': req.headers.authorization } }); // Forward token
                 const varietyList = varListResponse.data;
                 // Validate ownership and type
                 if (varietyList.userId?.toString() !== userId) { return res.status(403).json({ message: 'Forbidden: Variety list ownership mismatch.' }); }
                 if (varietyList.type !== 'variety') { return res.status(400).json({ message: `List '${varietyList.name}' is not a variety list.` }); }
                 if (!Array.isArray(varietyList.content) || varietyList.content.length === 0) { return res.status(400).json({ message: `Selected Variety List ('${varietyList.name}') is empty.` }); }

                 // Extract and validate ObjectIDs from content
                 varietyObjectIdsFromList = varietyList.content
                     .map(idStr => mongoose.Types.ObjectId.isValid(idStr) ? new mongoose.Types.ObjectId(idStr) : null)
                     .filter(id => id !== null);

                 if (varietyObjectIdsFromList.length === 0) { return res.status(400).json({ message: `Selected Variety List ('${varietyList.name}') contains no valid variety IDs.` }); }
                 console.log(`CONTROLLER (Private): Filtering for ${varietyObjectIdsFromList.length} varieties from list ${selectedVarietyListId}.`);

             } catch (varListError) {
                 console.error(`❌ Error calling List Service for variety list:`, varListError.response?.data || varListError.message);
                 const status = varListError.response?.status; const message = varListError.response?.data?.message;
                 if (status === 404) { return res.status(404).json({ message: message || `Variety List ID ${selectedVarietyListId} not found.` }); }
                 if (status === 403) { return res.status(403).json({ message: message || 'Forbidden: Could not access variety list.' }); }
                 if (status === 401) { return res.status(401).json({ message: message || 'Unauthorized by List Service.' }); }
                 return res.status(503).json({ message: message || 'Error fetching variety list details.' });
             }
        } else {
             console.log(`CONTROLLER (Private): No variety list filter applied.`);
        }


        // --- 7. Filter Varieties ---
        const varietyFilter = { varietySet, snpSet }; // Base required filters
        // Apply subpopulation filter (handling "ALL" and "")
        if (varietySubpopulation && varietySubpopulation !== "ALL" && varietySubpopulation !== "") {
            varietyFilter.subpopulation = varietySubpopulation;
            console.log(`CONTROLLER (Private): Applying filter for specific subpopulation: ${varietySubpopulation}`);
        } else {
            console.log(`CONTROLLER (Private): No specific subpopulation filter applied (Value: '${varietySubpopulation || ""}')`);
        }
        // Apply variety list filter (if IDs were successfully obtained)
        if (varietyObjectIdsFromList?.length > 0) {
             varietyFilter._id = { $in: varietyObjectIdsFromList }; // Filter by the array of ObjectIds
             console.log(`CONTROLLER (Private): Applying filter for specific variety list.`);
        }

        console.log("CONTROLLER (Private): Finding matching varieties with final filter:", varietyFilter);
        const matchingVarieties = await Variety.find(varietyFilter)
            .select("_id id name accession subpopulation varietySet irisId") // Ensure _id is selected
            .lean();

        // Handle No Varieties Found after filtering
        if (!matchingVarieties || matchingVarieties.length === 0) {
            console.log("CONTROLLER (Private): No varieties found matching ALL criteria.");
            const refRowAlleles = {}; positionsToUse.forEach(pos => { refRowAlleles[pos] = referenceAllelesMap.get(pos) ?? '?' });
            const refRow = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: refRowAlleles };
            return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: positionsToUse, varieties: [refRow] });
        }
        const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString()); // Still need strings for map key
        const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v]));
        console.log(`CONTROLLER (Private): Found ${matchingVarieties.length} matching varieties after all filters.`);


        // --- 8. Fetch Relevant Variety Position Documents ---
         const varietyPosFilter = { referenceId: { $in: matchingVarietyObjectIdStrings } }; // Use the filtered variety IDs
         // Apply coordinate filters ONLY if they were determined (i.e., from region string list format or geneLocus type)
         if (searchContigForVarPos) { varietyPosFilter.contig = searchContigForVarPos; }
         if (searchStartPosForVarPos !== null && searchEndPosForVarPos !== null) { varietyPosFilter.start = { $lte: searchEndPosForVarPos }; varietyPosFilter.end = { $gte: searchStartPosForVarPos }; }
         console.log("CONTROLLER (Private): Finding variety position data with filter:", varietyPosFilter);
         const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId").lean();
         console.log(`CONTROLLER (Private): Found ${varietyPositionDocs.length} relevant variety position document(s).`);


        // --- 9. Aggregate Allele Map ---
         const finalPositionsSet = new Set(positionsToUse); const alleleMap = new Map();
         console.log(`CONTROLLER (Private): Building Allele Map for ${finalPositionsSet.size} target positions...`);
         for (const doc of varietyPositionDocs) {
             const varietyIdStr = doc.referenceId; if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object' || !matchingVarietyIdMap.has(varietyIdStr)) continue;
             if (!alleleMap.has(varietyIdStr)) alleleMap.set(varietyIdStr, new Map());
             const varietyAlleleData = alleleMap.get(varietyIdStr);
             for (const posStr in doc.positions) { const position = parseInt(posStr, 10); if (!isNaN(position) && finalPositionsSet.has(position)) { varietyAlleleData.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?'); } }
         }


        // --- 10. Format Final Response ---
         const finalPositions = positionsToUse; // Use the sorted array determined earlier
         console.log(`CONTROLLER (Private): Formatting final response for ${finalPositions.length} positions.`);
         const finalResults = {
             referenceGenomeName: referenceGenomeName,
             positions: finalPositions,
             varieties: []
         };
         // Add Reference Row
         const referenceGenomeRowData = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: {} };
         for (const pos of finalPositions) {
             referenceGenomeRowData.alleles[pos] = referenceAllelesMap.get(pos) ?? '?'; // Use map from earlier step
         }
         finalResults.varieties.push(referenceGenomeRowData);
         // Add Filtered Variety Rows
         for (const variety of matchingVarieties) {
             const varietyIdStr = variety._id.toString();
             const varietyAllelesData = alleleMap.get(varietyIdStr); // Get this variety's allele map
             const formattedAlleles = {};
             let mismatchCount = 0;
             // Iterate through all final positions to build allele object and calculate mismatch
             for (const pos of finalPositions) {
                 const varAllele = varietyAllelesData?.get(pos); // Allele from this variety's map (if found)
                 const refAllele = referenceAllelesMap.get(pos); // Allele from reference map
                 formattedAlleles[pos] = varAllele ?? '-'; // Default to '-' if variety has no data
                 // Calculate Mismatch
                 if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
                     mismatchCount++;
                 }
             }
             // Add the row for this variety
             finalResults.varieties.push({
                 name: variety.name,
                 accession: variety.accession,
                 assay: variety.irisId ?? 'N/A', // Use irisId for assay?
                 subpop: variety.subpopulation,
                 dataset: variety.varietySet,
                 mismatch: mismatchCount,
                 alleles: formattedAlleles
             });
         }
        console.log(`CONTROLLER (Private): Formatted ${finalResults.varieties.length} total rows.`);
        res.status(200).json(finalResults);

    } catch (error) {
        // --- Overall Error Handling ---
        console.error(`❌ Error during private genotype search for user ${userId}:`, error);
         if (error.response) { // Axios error from internal calls
             console.error("Axios error status:", error.response.status);
             console.error("Axios error data:", error.response.data);
             res.status(error.response.status || 503).json({ message: error.response.data?.message || 'Error during internal service communication.' });
         } else { // Other errors (DB, validation, processing, etc.)
             res.status(error.status || 500).json({ message: error.message || "Server Error during private genotype search." });
         }
    }
};