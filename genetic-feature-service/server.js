import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Genetic Feature Service Connected to DB"))
    .catch(err => console.log(err));

const FeatureSchema = new mongoose.Schema({
    genomeId: String,
    name: String,
    type: String
});
const Feature = mongoose.model("Feature", FeatureSchema);

app.post("/features", async (req, res) => {
    const feature = new Feature(req.body);
    await feature.save();
    res.status(201).json(feature);
});

app.get("/features/:id", async (req, res) => {
    const feature = await Feature.findById(req.params.id);
    res.json(feature);
});

app.listen(5002, () => console.log("Genetic Feature Service running on port 5002"));
