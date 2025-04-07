import mongoose from 'mongoose';

const varietySchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    irisId: { type: String, required: true, trim: true },
    subpopulation: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    snpSet: { type: String, required: true, trim: true },
    varietySet: { type: String, required: true, trim: true },
    accession: { type: String, required: true, trim: true },
}, {
    timestamps: true
});

const Variety = mongoose.model("varieties", varietySchema, "varieties");
export default Variety;