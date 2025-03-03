import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Table Service Connected to DB"))
    .catch(err => console.log(err));

const TableSchema = new mongoose.Schema({
    name: String,
    data: Array
});
const Table = mongoose.model("Table", TableSchema);

app.post("/tables", async (req, res) => {
    const table = new Table(req.body);
    await table.save();
    res.status(201).json(table);
});

app.get("/tables/:id", async (req, res) => {
    const table = await Table.findById(req.params.id);
    res.json(table);
});

app.listen(5003, () => console.log("Table Service running on port 5003"));
