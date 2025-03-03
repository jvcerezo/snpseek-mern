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


