import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Phenotype Service Connected to DB"))
    .catch(err => console.log(err));

const PhenotypeSchema = new mongoose.Schema({
    varietyId: String,
    trait: String,
    value: String
});
const Phenotype = mongoose.model("Phenotype", PhenotypeSchema);

app.post("/phenotypes", async (req, res) => {
    const phenotype = new Phenotype(req.body);
    await phenotype.save();
    res.status(201).json(phenotype);
});

app.get("/phenotypes/:id", async (req, res) => {
    const phenotype = await Phenotype.findById(req.params.id);
    res.json(phenotype);
});

app.listen(5005, () => console.log("Phenotype Service running on port 5005"));
