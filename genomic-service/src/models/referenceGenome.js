import mongoose from "mongoose";

const referenceGenomeSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    snpSet: { type: String, required: true, trim: true },
    varietySet: { type: String, required: true, trim: true },
}, {
    timestamps: true
});

const ReferenceGenome = mongoose.model("referenceGenomes", referenceGenomeSchema, "referenceGenomes");
export default ReferenceGenome;