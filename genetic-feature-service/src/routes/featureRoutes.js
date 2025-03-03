import express from "express";
import { getFeatureByGeneNameAndGenome } from "../controllers/featureController.js";

const router = express.Router();

// ✅ Define the GET route to fetch by geneName and referenceGenome
router.get("/search", getFeatureByGeneNameAndGenome);

export default router;
