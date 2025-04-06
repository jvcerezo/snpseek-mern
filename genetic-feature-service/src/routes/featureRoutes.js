import express from "express";
import { getFeatureByGeneNameAndReferenceGenome, getAvailableTraits, getFeaturesByTrait, getReferenceGenomes, getGeneDetails } from "../controllers/featureController.js";

const router = express.Router();

// ✅ Define the GET route to fetch by geneName and referenceGenome
router.get("/by-gene-name", getFeatureByGeneNameAndReferenceGenome);
router.get("/traits", getAvailableTraits);
router.get("/by-trait", getFeaturesByTrait);
router.get("/reference-genomes", getReferenceGenomes);
router.get("/details", getGeneDetails);


export default router;
