import mongoose from "mongoose";

const featureSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    geneName: { type: String, required: true, trim: true },
    referenceGenome: { type: String, required: true, trim: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    contig: { type: String, required: true, trim: true },
    strand: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
}, {
    timestamps: true
});

const Feature = mongoose.model("geneLoci", featureSchema, "geneLoci");
export default Feature;