import Feature from "../models/Feature.js";
import Trait from "../models/Traits.js"; 

export const getFeatureByGeneNameAndReferenceGenome = async (req, res) => {
    try {
        const { geneName, referenceGenome = "Japonica Nipponbare", searchType = "substring" } = req.query;

        if (!geneName) {
            return res.status(400).json({ error: "geneName is required" });
        }

        let query = { referenceGenome };
        if (searchType === "whole-word") {
            query.geneName = geneName;
        } else if (searchType === "substring") {
            query.geneName = { $regex: geneName, $options: "i" };
        } else if (searchType === "exact") {
            query.geneName = { $eq: geneName };
        } else if (searchType === "regex") {
            query.geneName = { $regex: new RegExp(geneName) };
        } else {
            // Default fallback
            query.geneName = { $regex: geneName, $options: "i" };
        }

        const features = await Feature.find(query);

        if (!features.length) {
            return res.status(404).json({ error: "No features found" });
        }

        res.status(200).json(features);
    } catch (error) {
        console.error("❌ Error searching features:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * @desc Get all available traits from the Traits collection
 * @route GET /features/traits
 */
export const getAvailableTraits = async (req, res) => {
    try {
        const traits = await Trait.find({}, "traitName category description geneIds");

        if (!traits.length) {
            return res.status(404).json({ error: "No traits found" });
        }

        res.status(200).json(traits);
    } catch (error) {
        console.error("❌ Error fetching traits:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

/**
 * @desc Get features associated with a selected trait
 * @route GET /features/by-trait
 */
export const getFeaturesByTrait = async (req, res) => {
    try {
        const { traitName } = req.query;

        if (!traitName) {
            return res.status(400).json({ error: "Trait name is required" });
        }

        // Find the trait by name
        const trait = await Trait.findOne({ traitName });

        if (!trait) {
            return res.status(404).json({ error: "Trait not found" });
        }

        // Fetch gene features linked to this trait
        const features = await Feature.find({ id: { $in: trait.geneIds } });

        res.status(200).json(features);
    } catch (error) {
        console.error("❌ Error fetching features by trait:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getReferenceGenomes = async (req, res) => {
    try {
      const referenceGenomes = await Feature.distinct("referenceGenome");
  
      // Ensure uniqueness (MongoDB's `.distinct()` should already do this)
      const uniqueGenomes = [...new Set(referenceGenomes.map(genome => genome.trim()))];
  
      if (!uniqueGenomes.length) {
        return res.status(404).json({ error: "No reference genomes found" });
      }
  
      res.status(200).json(uniqueGenomes);
    } catch (error) {
      console.error("❌ Error fetching reference genomes:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
  
  


