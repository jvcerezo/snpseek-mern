import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import listRoutes from "./routes/listRoutes.js";
import connectDB from "./config/db.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/mylists", listRoutes);

app.get("/", (req, res) => {
  res.send("List Service is Running...");
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`✅ List Service running on port ${PORT}`));
