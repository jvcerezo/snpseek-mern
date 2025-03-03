import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Genomic Service Connected to DB"))
    .catch(err => console.log(err));

const GenomicSchema = new mongoose.Schema({
    sequence: String,
    metadata: Object
});
const Genomic = mongoose.model("Genomic", GenomicSchema);

app.post("/genomes", async (req, res) => {
    const genome = new Genomic(req.body);
    await genome.save();
    res.status(201).json(genome);
});

app.get("/genomes/:id", async (req, res) => {
    const genome = await Genomic.findById(req.params.id);
    res.json(genome);
});

app.listen(5001, () => console.log("Genomic Service running on port 5001"));
