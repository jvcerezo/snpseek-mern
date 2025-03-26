import Feature from "../models/Feature.js" ;

export const getFeatureByGeneNameAndReferenceGenome = async (req, res) => {
    try {
        const { geneName, referenceGenome } = req.query;

        // ✅ Validate required query parameters
        if (!geneName || !referenceGenome) {
            return res.status(400).json({ error: "geneName and referenceGenome are required" });
        }

        // ✅ Query database for the feature
        const feature = await Feature.findOne({ geneName, referenceGenome });

        if (!feature) {
            return res.status(404).json({ error: "Feature not found" });
        }

        res.status(200).json(feature);
    } catch (error) {
        console.error("❌ Error fetching feature:", error);
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
