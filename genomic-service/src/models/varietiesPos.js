import mongoose from "mongoose";

const varietiesPosSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    contig: { type: String, required: true, trim: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    positions: { type: Object, required: true },
    referenceId: { type: String, required: true, trim: true },
}, {
    timestamps: true
});

const VarietiesPos = mongoose.model("varietiesPos", varietiesPosSchema, "varietiesPos");
export default VarietiesPos;
