import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
    id: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    varietySet: { type: String, required: true, trim: true },
    snpSet: { type: String, required: true, trim: true },
    userId: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    content: {type: [String], required: true, trim: true},
}, {
    timestamps: true
});

const List = mongoose.model("lists", listSchema, "lists");
export default List;
