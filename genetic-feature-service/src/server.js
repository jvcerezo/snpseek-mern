import express from "express" ;
import dotenv from "dotenv" ;
import cors from "cors" ;
import connectDB from "./config/db.js" ;
import featureRoutes from "./routes/featureRoutes.js" ;

dotenv.config() ;
connectDB() ;

const app = express() ;

app.use(cors()) ;
app.use(express.json()) ;
app.use(express.urlencoded({ extended: true })) ;

app.use("/features", featureRoutes) ;

app.get("/", (req, res) => {
    res.send("Genetic Feature Service is Running...") ;
    });

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`✅ Genetic Feature Service running on port ${PORT}`)) ;