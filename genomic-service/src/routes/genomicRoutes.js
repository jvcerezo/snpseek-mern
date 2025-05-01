// routes/genomicRoutes.js
import express from "express";
import {
    getVarietySets,
    getSnpSets,
    getVarietySubpopulations,
    getChromosomes,
    searchGenotypes,
    getChromosomeRange,
    getConsolidatedChromosomeRange,
    searchContigs,
    searchVarietiesByName,
    lookupVarietiesByIds
    // Import other controllers like searchGenotypesController when ready
} from "../controllers/genomicController.js"; // Adjust path if needed

const router = express.Router();

// Routes for fetching dropdown options
router.get("/variety-sets", getVarietySets);
router.get("/snp-sets", getSnpSets);
router.get("/subpopulations", getVarietySubpopulations);
router.get("/chromosomes", getChromosomes);
router.get("/chromosome-range", getChromosomeRange);
router.post("/search", searchGenotypes);
router.get("/consolidated-range", getConsolidatedChromosomeRange);
router.get("/contigs/search", searchContigs);
router.get("/varieties/search", searchVarietiesByName);
router.get("/varieties/lookup", lookupVarietiesByIds);



// router.post("/search", searchGenotypesController); // Example using POST if complex criteria

export default router;