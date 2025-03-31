import Feature from "../models/Feature.js";
import Trait from "../models/Traits.js"; 

export const getFeatureByGeneNameAndReferenceGenome = async (req, res) => {
    try {
        const { geneName, referenceGenome, searchType } = req.query;

        // Validate required inputs
        if (!geneName) {
            return res.status(400).json({ error: "Gene name is required" });
        }

        if (!referenceGenome) {
            return res.status(400).json({ error: "Reference genome is required" });
        }

        // Build the query based on search type
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
            // Default fallback to substring search
            query.geneName = { $regex: geneName, $options: "i" };
        }

        // Query the database
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
 * @desc Get features associated with a selected trait and reference genome
 * @route GET /features/by-trait
 */
export const getFeaturesByTrait = async (req, res) => {
    try {
        const { traitName, referenceGenome } = req.query;

        // Validate required inputs
        if (!traitName) {
            return res.status(400).json({ error: "Trait name is required" });
        }

        if (!referenceGenome) {
            return res.status(400).json({ error: "Reference genome is required" });
        }

        // Find the trait by name
        const trait = await Trait.findOne({ traitName });

        if (!trait) {
            return res.status(404).json({ error: "Trait not found" });
        }

        // Ensure geneIds exist in the trait
        if (!trait.geneIds || trait.geneIds.length === 0) {
            return res.status(404).json({ error: "No associated genes found for this trait" });
        }

        console.log("🔍 Trait:", trait);
        console.log("🔍 Gene IDs to search for:", trait.geneIds);
        console.log("🔍 Reference Genome:", referenceGenome);

        // Build the query with both trait gene IDs and reference genome
        const query = {
            $and: [
                { referenceGenome },
                { $or: [
                    { _id: { $in: trait.geneIds } },
                    { id: { $in: trait.geneIds } }
                ]}
            ]
        };

        // Fetch gene features linked to this trait and reference genome
        const features = await Feature.find(query);

        if (features.length === 0) {
            return res.status(404).json({ 
                error: "No gene features found for the provided trait and reference genome" 
            });
        }

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
  
  


