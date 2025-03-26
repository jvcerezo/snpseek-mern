import mongoose from 'mongoose';

const traitSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    traitName: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    geneIds: { type: [String], required: true },
}, {
    timestamps: true
});

const Trait = mongoose.model("trait", traitSchema);
export default Trait;
