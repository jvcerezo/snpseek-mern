import express from "express";
import { searchFeaturesByText, getAvailableTraits, getFeaturesByTrait, getReferenceGenomes, getGeneDetails, getFeaturesByRegion, lookupFeaturesByIds, autocompleteFeatures, getFeatureCoordinatesById, getBatchFeatureCoordinatesByIds  } from "../controllers/featureController.js";

const router = express.Router();

// ✅ Define the GET route to fetch by geneName and referenceGenome
router.get("/by-text-search", searchFeaturesByText);
router.get("/traits", getAvailableTraits);
router.get("/by-trait", getFeaturesByTrait);
router.get("/reference-genomes", getReferenceGenomes);
router.get("/details", getGeneDetails);
router.get("/by-region", getFeaturesByRegion);
router.get("/lookup", lookupFeaturesByIds);
router.get("/autocomplete", autocompleteFeatures);
router.get("/coords-by-id", getFeatureCoordinatesById);
router.post("/batch-coords-by-id", getBatchFeatureCoordinatesByIds);


export default router;
