import express from "express";
import { getFeatureByGeneNameAndReferenceGenome, getAvailableTraits, getFeaturesByTrait } from "../controllers/featureController.js";

const router = express.Router();

// ✅ Define the GET route to fetch by geneName and referenceGenome
router.get("/search", getFeatureByGeneNameAndReferenceGenome);
router.get("/traits", getAvailableTraits);
router.get("/by-trait", getFeaturesByTrait);

export default router;
