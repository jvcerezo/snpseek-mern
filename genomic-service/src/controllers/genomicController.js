// controllers/genomicController.js
import Variety from "../models/varieties.js";
import VarietiesPos from "../models/varietiesPos.js";
import ReferenceGenome from "../models/referenceGenome.js";
import ReferenceGenomePos from "../models/referenceGenomePos.js";

/**
 * @desc    Get distinct variety set names
 * @route   GET /genomic/variety-sets
 */
export const getVarietySets = async (req, res) => {
    try {
        console.log("CONTROLLER: Attempting Variety.distinct('varietySet')"); // Log start
        const varietySetsRaw = await Variety.distinct("varietySet"); // Get raw result
        console.log("CONTROLLER: Raw distinct variety sets from DB:", varietySetsRaw); // Log raw result

        const validSets = varietySetsRaw
            .filter(set => set && typeof set === 'string' && set.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted variety sets (${validSets.length}):`, validSets); // Log final result
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
        console.log("CONTROLLER: Attempting Variety.distinct('snpSet')"); // Log start
        const snpSetsRaw = await Variety.distinct("snpSet");
        console.log("CONTROLLER: Raw distinct SNP sets from DB:", snpSetsRaw); // Log raw result

        const validSets = snpSetsRaw
            .filter(set => set && typeof set === 'string' && set.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted SNP sets (${validSets.length}):`, validSets); // Log final result
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
        console.log("CONTROLLER: Attempting Variety.distinct('subpopulation')"); // Log start
        const subpopulationsRaw = await Variety.distinct("subpopulation");
        console.log("CONTROLLER: Raw distinct subpopulations from DB:", subpopulationsRaw); // Log raw result

        const validSubpopulations = subpopulationsRaw
            .filter(sub => sub && typeof sub === 'string' && sub.trim().length > 0)
            .sort();

        console.log(`CONTROLLER: Filtered & sorted subpopulations (${validSubpopulations.length}):`, validSubpopulations); // Log final result
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
        console.log("CONTROLLER: Attempting VarietiesPos.distinct('contig')"); // Log start
        const chromosomesRaw = await VarietiesPos.distinct("contig");
        console.log("CONTROLLER: Raw distinct chromosomes/contigs from DB:", chromosomesRaw); // Log raw result

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

        console.log(`CONTROLLER: Filtered & sorted chromosomes (${validChromosomes.length}):`, validChromosomes); // Log final result
        res.status(200).json(validChromosomes);

    } catch (error) {
        console.error("❌ Error fetching distinct chromosomes/contigs:", error);
        res.status(500).json({ message: "Server Error fetching chromosomes." });
    }
};

// --- Helper: getReferencePositionsAndAllelesInRange ---
// Assumed working correctly based on feedback (returns { positions: number[], referenceAlleles: Map<number, string> })
const getReferencePositionsAndAllelesInRange = async (referenceIdStr, contig, startPos, endPos) => {
    const refPosFilter = { referenceId: referenceIdStr };
    if (contig) refPosFilter.contig = contig;
    refPosFilter.start = { $lte: endPos }; refPosFilter.end = { $gte: startPos };
    console.log("HELPER (getRefPosAndAlleles): Finding reference position docs matching:", refPosFilter);
    const refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("positions");
    console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} reference position document(s).`);
    const includedPositions = new Set();
    const referenceAlleleMap = new Map();
    for (const doc of refPositionDocs) {
        if (doc.positions && typeof doc.positions === 'object') {
            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position) && position >= startPos && position <= endPos) {
                    includedPositions.add(position);
                    referenceAlleleMap.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : '?');
                }
            }
        }
    }
    const finalPositions = Array.from(includedPositions).sort((a, b) => a - b);
    console.log(`HELPER (getRefPosAndAlleles): Returning ${finalPositions.length} positions and ${referenceAlleleMap.size} ref alleles.`);
    return { positions: finalPositions, referenceAlleles: referenceAlleleMap };
};
// --- End Helper ---

/**
 * @desc    Search for genotypes based on multiple criteria (Displays irisId as Assay)
 * @route   POST /genomic/search
 * @access  Public (or Protected)
 */
export const searchGenotypes = async (req, res) => {
    const {
        referenceGenome: referenceGenomeName,
        varietySet, snpSet, varietySubpopulation,
        regionChromosome, regionStart, regionEnd,
    } = req.body;

    console.log("CONTROLLER: Received genotype search request criteria:", req.body);

    // --- Validation ---
    if (!referenceGenomeName || !varietySet || !snpSet || !regionStart || !regionEnd) { return res.status(400).json({ message: "Reference Genome, Variety Set, SNP Set, Start Position, and End Position are required." }); }
    const startPos = parseInt(regionStart, 10);
    const endPos = parseInt(regionEnd, 10);
    if (isNaN(startPos) || isNaN(endPos) || startPos > endPos || startPos < 0) { return res.status(400).json({ message: "Invalid Start/End position provided." }); }
    // --- End Validation ---

    try {
        // --- Step 1: Find Reference Genome ID ---
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
        if (!refGenomeDoc) { return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` }); }
        const referenceIdStr = refGenomeDoc._id.toString();
        console.log(`CONTROLLER: Found referenceGenome ObjectId: ${refGenomeDoc._id}`);

        // --- Step 2: Determine Target Positions AND Get Reference Alleles ---
        const { positions: finalPositions, referenceAlleles } = await getReferencePositionsAndAllelesInRange(
            referenceIdStr, regionChromosome, startPos, endPos
        );
        if (finalPositions.length === 0) {
             console.log("CONTROLLER: No reference positions found within the specified required range.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
        }
        console.log(`CONTROLLER: Target positions determined (${finalPositions.length})`);
        const targetPositionsSet = new Set(finalPositions);

        // --- Step 3: Filter Varieties (Include irisId) ---
        const varietyFilter = { varietySet, snpSet };
        if (varietySubpopulation) varietyFilter.subpopulation = varietySubpopulation;
        console.log("CONTROLLER: Finding matching varieties with filter:", varietyFilter);
        // MODIFICATION: Added 'irisId' to the select statement
        const matchingVarieties = await Variety.find(varietyFilter)
            .select("_id id name accession subpopulation varietySet irisId") // <-- Added irisId
            .lean();
        if (!matchingVarieties || matchingVarieties.length === 0) {
             console.log("CONTROLLER: No varieties found matching criteria.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: finalPositions, varieties: [] });
        }
        const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString()); // Use _id string
        const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v])); // Key map by _id string
        console.log(`CONTROLLER: Found ${matchingVarieties.length} matching varieties.`);


        // --- Step 4: Fetch Variety Allele Data (Query uses Variety _ids in referenceId field) ---
        const varietyPosFilter = {
            referenceId: { $in: matchingVarietyObjectIdStrings } // Filter by the Array of Variety _ID strings
        };
        if (regionChromosome) varietyPosFilter.contig = regionChromosome;
        const minPos = finalPositions[0];
        const maxPos = finalPositions[finalPositions.length - 1];
        varietyPosFilter.start = { $lte: maxPos };
        varietyPosFilter.end = { $gte: minPos };
        console.log("CONTROLLER: Finding variety position data with filter (using Variety _IDs in referenceId):", varietyPosFilter);
        const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId");
        console.log(`CONTROLLER: Found ${varietyPositionDocs.length} relevant variety position document(s).`);


        // --- Step 5: Build Allele Map ---
        // Map structure: Map<varietyId_string (from doc.referenceId), Map<position_number, allele_string>>
        const alleleMap = new Map();
        console.log("CONTROLLER: Building Allele Map...");
        for (const doc of varietyPositionDocs) {
            const varietyIdStr = doc.referenceId; // This is the Variety._id string from the doc
            if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object') continue;
            // Ensure this doc belongs to a variety we originally filtered
            if (matchingVarietyIdMap.has(varietyIdStr)) {
                 if (!alleleMap.has(varietyIdStr)) alleleMap.set(varietyIdStr, new Map());
                 const varietyAlleleData = alleleMap.get(varietyIdStr);
                 for (const posStr in doc.positions) {
                     const position = parseInt(posStr, 10);
                     if (!isNaN(position) && targetPositionsSet.has(position)) {
                          if (typeof doc.positions[posStr] === 'string') {
                             varietyAlleleData.set(position, doc.positions[posStr]);
                          } else { varietyAlleleData.set(position, 'ERR'); }
                     }
                 }
             }
        }
        console.log(`CONTROLLER: Built allele map covering ${alleleMap.size} varieties.`);


        // --- Step 6: Format Final Response (Assign irisId to assay, calculate mismatch) ---
        const finalResults = {
            referenceGenomeName: referenceGenomeName,
            positions: finalPositions,
            varieties: []
        };
        // Add Reference Row
        const referenceGenomeRowData = {
            name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-',
            subpop: '-', dataset: '-', mismatch: 0, alleles: {}
        };
        for (const pos of finalPositions) { referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; }
        finalResults.varieties.push(referenceGenomeRowData);

        // Add Variety Rows
        for (const variety of matchingVarieties) { // Iterate original variety docs from Step 3
            const varietyIdStr = variety._id.toString(); // Key for alleleMap lookup
            const varietyAllelesData = alleleMap.get(varietyIdStr);
            const formattedAlleles = {};
            let mismatchCount = 0;

            for (const pos of finalPositions) {
                const varAllele = varietyAllelesData?.get(pos);
                const refAllele = referenceAlleles.get(pos);
                formattedAlleles[pos] = varAllele ?? '-';
                // Mismatch Calculation
                 if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
                    if (varAllele.includes('/') || refAllele.includes('/')) { if (varAllele !== refAllele) mismatchCount++; }
                    else if (varAllele !== refAllele) { mismatchCount++; }
                 }
            }

            finalResults.varieties.push({
                 name: variety.name,
                 accession: variety.accession,
                 assay: variety.irisId ?? 'N/A', // <-- MODIFICATION: Use irisId here
                 subpop: variety.subpopulation,
                 dataset: variety.varietySet,
                 mismatch: mismatchCount, // Use calculated count
                 alleles: formattedAlleles
             });
        }
        console.log(`CONTROLLER: Formatted ${finalResults.varieties.length} total rows for response.`);
        res.status(200).json(finalResults);

    } catch (error) {
        console.error("❌ Error during genotype search:", error);
        res.status(500).json({ message: "Server Error during genotype search." });
    }
};

/**
 * @desc    Get the min start and max end position for a specific chromosome/contig within a reference genome
 * @route   GET /genomic/chromosome-range?contig=<contig_name>&referenceGenome=<genome_name>
 * @access  Public (or Protected)
 */
export const getChromosomeRange = async (req, res) => {
    const { contig, referenceGenome: referenceGenomeName } = req.query;

    if (!contig || !referenceGenomeName) {
        return res.status(400).json({ message: "Contig (Chromosome) and Reference Genome query parameters are required." });
    }

    console.log(`CONTROLLER: Getting range for Contig: ${contig}, RefGenome: ${referenceGenomeName}`);

    try {
        // 1. Find the Reference Genome ID
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id");
        if (!refGenomeDoc) {
            return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` });
        }
        const referenceGenomeObjectId = refGenomeDoc._id;

        // 2. Use Aggregation pipeline to find Min Start and Max End efficiently
        const rangeResult = await ReferenceGenomePos.aggregate([
            {
                $match: {
                    referenceId: referenceGenomeObjectId.toString(), // Match the reference genome
                    contig: contig             // Match the specific chromosome/contig
                }
            },
            {
                $group: {
                    _id: null, // Group all matching documents together
                    minPosition: { $min: "$start" }, // Find the minimum value of the 'start' field
                    maxPosition: { $max: "$end" }    // Find the maximum value of the 'end' field
                }
            }
        ]);

        if (!rangeResult || rangeResult.length === 0 || rangeResult[0].minPosition === null || rangeResult[0].maxPosition === null) {
            console.log(`CONTROLLER: No position data found for Contig: ${contig}, RefGenome: ${referenceGenomeName}`);
            // Return nulls or a specific message if no data found for that contig/refGenome combo
            return res.status(404).json({ message: `No position range data found for chromosome '${contig}' in reference genome '${referenceGenomeName}'.` });
            // Alternatively, send 200 with nulls:
            // return res.status(200).json({ minPosition: null, maxPosition: null });
        }

        const range = {
            minPosition: rangeResult[0].minPosition,
            maxPosition: rangeResult[0].maxPosition
        };
        console.log(`CONTROLLER: Found range for Contig ${contig}:`, range);
        res.status(200).json(range);

    } catch (error) {
        console.error(`❌ Error fetching chromosome range for ${contig}:`, error);
        res.status(500).json({ message: "Server Error fetching chromosome range." });
    }
};