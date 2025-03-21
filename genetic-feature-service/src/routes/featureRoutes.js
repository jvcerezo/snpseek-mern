import express from "express";
import { getFeatureByGeneNameAndReferenceGenome } from "../controllers/featureController.js";

const router = express.Router();

// ✅ Define the GET route to fetch by geneName and referenceGenome
router.get("/search", getFeatureByGeneNameAndReferenceGenome);

export default router;
