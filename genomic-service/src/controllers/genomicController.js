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
const getReferencePositionsAndAlleles = async (referenceIdStr, contig, startPos, endPos) => {
    const refPosFilter = { referenceId: referenceIdStr };
    // Only apply contig filter if a specific chromosome is provided
    if (contig && typeof contig === 'string' && contig.trim() !== '') {
        refPosFilter.contig = contig;
    }
    // Only apply position range filter if BOTH start and end are valid numbers
    if (typeof startPos === 'number' && typeof endPos === 'number' && !isNaN(startPos) && !isNaN(endPos)) {
        refPosFilter.start = { $lte: endPos };
        refPosFilter.end = { $gte: startPos };
        console.log(`HELPER (getRefPosAndAlleles): Applying range filter: ${startPos}-${endPos}`);
    } else {
         console.log("HELPER (getRefPosAndAlleles): No range filter applied.");
    }

    console.log("HELPER (getRefPosAndAlleles): Finding reference position docs matching:", refPosFilter);
    const refPositionDocs = await ReferenceGenomePos.find(refPosFilter).select("positions start end"); // Removed contig select for now
    console.log(`HELPER (getRefPosAndAlleles): Found ${refPositionDocs.length} reference position document(s).`);

    const includedPositions = new Set();
    const referenceAlleleMap = new Map();

    for (const doc of refPositionDocs) {
        if (doc.positions && typeof doc.positions === 'object') {
            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position)) {
                    // If range was specified (startPos is not null), check bounds.
                    // If no range was specified (startPos is null), include all positions found for matched docs.
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
// --- End Helper ---


/**
 * @desc    Search for genotypes based on multiple criteria (Handles 'Any Chromosome')
 * @route   POST /genomic/search
 */
export const searchGenotypes = async (req, res) => {
    const {
        referenceGenome: referenceGenomeName,
        varietySet, snpSet, varietySubpopulation,
        regionChromosome, // Can be ''
        regionStart, regionEnd,
        // Add other region types if needed: regionType, regionGeneLocus, snpList, locusList
    } = req.body;

    console.log("CONTROLLER: Received genotype search request criteria:", req.body);

    // --- Adjusted Validation ---
    if (!referenceGenomeName || !varietySet || !snpSet) {
        return res.status(400).json({ message: "Reference Genome, Variety Set, and SNP Set are required." });
    }

    let startPos = null;
    let endPos = null;
    const specificChromosomeSearch = regionChromosome && typeof regionChromosome === 'string' && regionChromosome.trim() !== '';

    if (specificChromosomeSearch) { // Validate start/end ONLY if a specific chromosome is chosen
        if (regionStart === undefined || regionStart === '' || regionEnd === undefined || regionEnd === '') {
             return res.status(400).json({ message: "Start Position and End Position are required when a specific Chromosome is selected." });
        }
        startPos = parseInt(regionStart, 10);
        endPos = parseInt(regionEnd, 10);
        if (isNaN(startPos) || isNaN(endPos) || startPos > endPos || startPos < 0) {
             return res.status(400).json({ message: "Invalid Start/End position provided for chromosome search." });
        }
        console.log(`CONTROLLER: Specific chromosome search on ${regionChromosome} from ${startPos} to ${endPos}`);
    } else {
        console.log("CONTROLLER: No specific chromosome selected, searching across all contigs.");
        // startPos and endPos remain null
    }
    // --- End Validation ---

    try {
        // --- Step 1: Find Reference Genome ID ---
        const refGenomeDoc = await ReferenceGenome.findOne({ name: referenceGenomeName }).select("_id id");
        if (!refGenomeDoc) { return res.status(404).json({ message: `Reference Genome '${referenceGenomeName}' not found.` }); }
        const referenceIdStr = refGenomeDoc._id.toString();
        console.log(`CONTROLLER: Found referenceGenome ObjectId: ${referenceIdStr}`);

        // --- Step 2: Get Reference Alleles (respecting range ONLY if specified) ---
        const { positions: refPositionsInRange, referenceAlleles } = await getReferencePositionsAndAlleles(
            referenceIdStr, regionChromosome, startPos, endPos
        );
        // If specific chromosome range search yields no ref positions, result is empty
        if (specificChromosomeSearch && refPositionsInRange.length === 0) {
             console.log("CONTROLLER: No reference positions found within the specified range for the selected chromosome.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
        }

        // --- Step 3: Filter Varieties ---
        const varietyFilter = { varietySet, snpSet };
        if (varietySubpopulation) varietyFilter.subpopulation = varietySubpopulation;
        console.log("CONTROLLER: Finding matching varieties with filter:", varietyFilter);
        const matchingVarieties = await Variety.find(varietyFilter).select("_id id name accession subpopulation varietySet irisId").lean();
        if (!matchingVarieties || matchingVarieties.length === 0) {
             console.log("CONTROLLER: No varieties found matching criteria.");
             // Return positions found in reference even if no varieties match? Or empty? Empty seems safer.
             // return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: refPositionsInRange, varieties: [] });
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });

        }
        const matchingVarietyObjectIdStrings = matchingVarieties.map(v => v._id.toString());
        const matchingVarietyIdMap = new Map(matchingVarieties.map(v => [v._id.toString(), v]));
        console.log(`CONTROLLER: Found ${matchingVarieties.length} matching varieties.`);

        // --- Step 4: Fetch Variety Allele Data (Conditional Filters) ---
        const varietyPosFilter = { referenceId: { $in: matchingVarietyObjectIdStrings } };
        if (specificChromosomeSearch) { // Only filter by contig if provided
             varietyPosFilter.contig = regionChromosome;
        }
        if (specificChromosomeSearch && startPos !== null && endPos !== null) { // Only filter by range if specific chromosome was chosen
             varietyPosFilter.start = { $lte: endPos };
             varietyPosFilter.end = { $gte: startPos };
        }
        console.log("CONTROLLER: Finding variety position data with filter:", varietyPosFilter);
        const varietyPositionDocs = await VarietiesPos.find(varietyPosFilter).select("positions referenceId");
        console.log(`CONTROLLER: Found ${varietyPositionDocs.length} relevant variety position document(s).`);


        // --- Step 5: Aggregate ALL unique positions and build Allele Map ---
        const allVarietyPositions = new Set();
        const alleleMap = new Map(); // Map<varietyId_string, Map<position_number, allele_string>>
        console.log("CONTROLLER: Building Allele Map...");

        for (const doc of varietyPositionDocs) {
            const varietyIdStr = doc.referenceId;
            if (!varietyIdStr || !doc.positions || typeof doc.positions !== 'object' || !matchingVarietyIdMap.has(varietyIdStr)) continue;

            if (!alleleMap.has(varietyIdStr)) alleleMap.set(varietyIdStr, new Map());
            const varietyAlleleData = alleleMap.get(varietyIdStr);

            for (const posStr in doc.positions) {
                const position = parseInt(posStr, 10);
                if (!isNaN(position)) {
                    // If a range was specified (startPos is not null), only include positions within that range.
                    // If no range (startPos is null - Any Chromosome), include all positions found for matched varieties.
                    if (startPos === null || (position >= startPos && position <= endPos)) {
                         allVarietyPositions.add(position);
                         varietyAlleleData.set(position, typeof doc.positions[posStr] === 'string' ? doc.positions[posStr] : 'ERR');
                    }
                }
            }
        }
        console.log(`CONTROLLER: Built allele map covering ${alleleMap.size} varieties and ${allVarietyPositions.size} unique positions.`);

        // --- Step 6: Format Final Response ---
        const finalPositions = Array.from(allVarietyPositions).sort((a, b) => a - b);

        // If the search was for a specific range but no variety positions were found *within that range*
        // (even if reference positions existed), return empty results for varieties.
         if (specificChromosomeSearch && finalPositions.length === 0 && refPositionsInRange.length > 0) {
             console.log("CONTROLLER: Reference positions found, but no variety positions match the specified range.");
             // Include the reference row with its alleles in the specified range
              const referenceGenomeRowData = { name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-', subpop: '-', dataset: '-', mismatch: 0, alleles: {} };
              for (const pos of refPositionsInRange) { referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; }
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: refPositionsInRange, varieties: [referenceGenomeRowData] });
         }
          if (finalPositions.length === 0) {
             console.log("CONTROLLER: No relevant positions found in reference or varieties for the given criteria.");
             return res.status(200).json({ referenceGenomeName: referenceGenomeName, positions: [], varieties: [] });
         }


        const finalResults = {
            referenceGenomeName: referenceGenomeName,
            positions: finalPositions,
            varieties: []
        };

        // Add Reference Row (using all final positions)
        const referenceGenomeRowData = {
            name: referenceGenomeName, assay: 'Reference', accession: refGenomeDoc.id || '-',
            subpop: '-', dataset: '-', mismatch: 0, alleles: {}
        };
        for (const pos of finalPositions) { referenceGenomeRowData.alleles[pos] = referenceAlleles.get(pos) ?? '?'; }
        finalResults.varieties.push(referenceGenomeRowData);

        // Add Variety Rows
        for (const variety of matchingVarieties) {
            const varietyIdStr = variety._id.toString();
            const varietyAllelesData = alleleMap.get(varietyIdStr);
            const formattedAlleles = {};
            let mismatchCount = 0;

            for (const pos of finalPositions) {
                const varAllele = varietyAllelesData?.get(pos);
                const refAllele = referenceAlleles.get(pos); // Get ref allele for this specific position
                formattedAlleles[pos] = varAllele ?? '-';
                // Mismatch Calculation
                 if (varAllele && varAllele !== '-' && refAllele && refAllele !== '?' && varAllele !== refAllele) {
                    // Basic mismatch check
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
