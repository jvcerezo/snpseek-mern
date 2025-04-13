import express from "express" ;
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import genomicRoutes from "./routes/genomicRoutes.js";

dotenv.config() ;
connectDB() ;

const app = express() ;

app.use(cors()) ;
app.use(express.json()) ;
app.use(express.urlencoded({ extended: true })) ;

app.use("/genotype", genomicRoutes) ;

app.get("/", (req, res) => {
    res.send("Genomic Service is Running...") ;
}) ;

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Genomic Service running on port ${PORT}`)) ;