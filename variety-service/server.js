import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Variety Service Connected to DB"))
    .catch(err => console.log(err));

const VarietySchema = new mongoose.Schema({
    name: String,
    species: String
});
const Variety = mongoose.model("Variety", VarietySchema);

app.post("/varieties", async (req, res) => {
    const variety = new Variety(req.body);
    await variety.save();
    res.status(201).json(variety);
});

app.get("/varieties/:id", async (req, res) => {
    const variety = await Variety.findById(req.params.id);
    res.json(variety);
});

app.listen(5004, () => console.log("Variety Service running on port 5004"));
