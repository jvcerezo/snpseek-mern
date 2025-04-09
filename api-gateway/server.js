import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_BASE_URL = '/api';

// ✅ Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// ✅ Proxy authentication routes to Auth Service (4000)
app.use(
  `${API_BASE_URL}/auth`,
  proxy(process.env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/auth${req.url}`; 
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers['Content-Type'] = 'application/json';
      return proxyReqOpts;
    },
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      return bodyContent ? JSON.stringify(bodyContent) : '{}';
    },
  })
);

// ✅ Proxy other microservices
app.use(
  `${API_BASE_URL}/genomic`,
  proxy(process.env.GENETIC_FEATURE_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/genotype${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      return bodyContent ? JSON.stringify(bodyContent) : '{}';
    },
  })
);

app.use(
  `${API_BASE_URL}/genetic-features`,
  proxy(process.env.GENETIC_FEATURE_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/features${req.url}`;
    },
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
      return bodyContent ? JSON.stringify(bodyContent) : '{}';
    },
  })
);

app.use("/tables", proxy(process.env.TABLE_SERVICE_URL));
app.use("/varieties", proxy(process.env.VARIETY_SERVICE_URL));
app.use("/phenotypes", proxy(process.env.PHENOTYPE_SERVICE_URL));

// ✅ API Gateway status check
app.get("/", (req, res) => {
  res.send("API Gateway is Running...");
});

app.listen(PORT, () => console.log(`✅ API Gateway running on port ${PORT}`));
