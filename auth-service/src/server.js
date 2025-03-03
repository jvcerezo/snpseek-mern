import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Fix: Ensure Express properly handles JSON requests
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Register Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auth Service is Running...");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ Auth Service running on port ${PORT}`));
