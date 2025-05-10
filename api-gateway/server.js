import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken'; // <-- Import jsonwebtoken: npm install jsonwebtoken

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_BASE_URL = '/api';

// --- JWT Secret Check ---
if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is not defined in your .env file. Authentication middleware will fail.");
    // You might want to exit in production if the secret is missing:
    // if (process.env.NODE_ENV === 'production') { process.exit(1); }
}

// ✅ Enable CORS and JSON parsing
app.use(cors()); // Consider configuring allowed origins for production
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // Or restrict to localhost:port
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("X-Frame-Options", "ALLOWALL"); // ✅ This allows iframe embedding
    next();
});

// --- Authentication Middleware ---
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expecting "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Ensure JWT_SECRET is loaded before verifying
    const secret = process.env.JWT_SECRET;
    if (!secret) {
         console.error("FATAL: JWT_SECRET is missing for token verification.");
         return res.status(500).json({ message: "Internal Server Error: Auth configuration missing" });
    }

    jwt.verify(token, secret, (err, decoded) => { // 'decoded' contains the payload if verification succeeds
        if (err) {
            console.error('JWT Verification Error:', err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Unauthorized: Token expired' });
            }
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }
        // Optional: Attach decoded payload to the request if needed downstream or by decorators
        req.user = decoded;
        console.log(`Token verified. User ID: ${req.user.id}`); // Log user ID for debugging
        next(); // Token is valid, proceed
    });
};


// --- Proxy Routes ---

// PUBLIC: Authentication routes (NO verifyToken middleware)
app.use(
    `${API_BASE_URL}/auth`, // Path: /api/auth/...
    proxy(process.env.AUTH_SERVICE_URL, {
        proxyReqPathResolver: (req) => {
            return `/auth${req.url}`; // To Auth Service: /auth/...
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers['Content-Type'] = 'application/json';
            return proxyReqOpts;
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            // Consider verifying if downstream really needs '{}' for empty body
            return bodyContent ? JSON.stringify(bodyContent) : '{}';
        },
        proxyErrorHandler: (err, res, next) => {
            console.error('Proxy Error (Auth Service):', err);
            res.status(503).json({ message: 'Auth service unavailable' }); // Send specific error
        }
    })
);

app.use(
    `${API_BASE_URL}/genomic`, // Path: /api/genomic/...
    proxy(process.env.GENOMIC_SERVICE_URL, { 
        proxyReqPathResolver: (req) => {
            return `/genotype${req.url}`; // To Service: /genotype/...
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";
            // Optional: Forward user info if needed by downstream service
            // if (req.user) proxyReqOpts.headers['X-User-Id'] = req.user.id;
            return proxyReqOpts;
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            return bodyContent ? JSON.stringify(bodyContent) : '{}';
        },
        proxyErrorHandler: (err, res, next) => {
            console.error('Proxy Error (Genomic Service):', err);
            res.status(503).json({ message: 'Genomic service unavailable' });
        }
    })
);

app.use(
    `${API_BASE_URL}/genetic-features`, // Path: /api/genetic-features/...
    proxy(process.env.GENETIC_FEATURE_SERVICE_URL, {
        proxyReqPathResolver: (req) => {
            return `/features${req.url}`; // To Service: /features/...
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";
            // if (req.user) proxyReqOpts.headers['X-User-Id'] = req.user.id;
            return proxyReqOpts;
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            return bodyContent ? JSON.stringify(bodyContent) : '{}';
        },
        proxyErrorHandler: (err, res, next) => {
            console.error('Proxy Error (Genetic Feature Service):', err);
            res.status(503).json({ message: 'Genetic Feature service unavailable' });
        }
    })
);

app.use(
    `${API_BASE_URL}/lists`, // Path: /api/lists/...
    verifyToken, // Apply authentication middleware FIRST
    proxy(process.env.LIST_SERVICE_URL, {
        proxyReqPathResolver: (req) => {
            return `/mylists${req.url}`; // To Service: /lists/...
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";

            // --- UNCOMMENT AND VERIFY THIS SECTION ---
            if (srcReq.user && srcReq.user.id) {
                // Add the custom header for the downstream service
                proxyReqOpts.headers['X-User-Id'] = srcReq.user.id;
                console.log(`Gateway: Forwarding to List Service WITH X-User-Id: ${srcReq.user.id}`);
            } else {
                // Log if verifyToken ran but didn't attach user.id as expected
                console.warn("Gateway: proxyReqOptDecorator - srcReq.user or srcReq.user.id is missing after verifyToken.");
            }
            // --- END SECTION ---

            // Optional: Remove original Authorization header?
            // delete proxyReqOpts.headers['authorization'];

            return proxyReqOpts;
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            return bodyContent ? JSON.stringify(bodyContent) : '{}';
        },
        proxyErrorHandler: (err, res, next) => {
            console.error('Proxy Error (List Service):', err);
            // Check for ECONNREFUSED specifically
            if (err.code === 'ECONNREFUSED') {
                 res.status(503).json({ message: 'List service is unavailable or connection refused.' });
            } else {
                // Handle other proxy errors
                 res.status(502).json({ message: 'Bad Gateway: Error communicating with List Service.' });
            }
        }
    })
);

app.use(
    `${API_BASE_URL}/PHG`, // Path: /api/phg/...
    verifyToken, // Apply authentication middleware FIRST
    proxy(process.env.PHG_SERVICE_URL, {
        proxyReqPathResolver: (req) => {
            return `/PHG${req.url}`; // To Service: /phg/...
        },
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
            proxyReqOpts.headers["Content-Type"] = "application/json";

            // --- UNCOMMENT AND VERIFY THIS SECTION ---
            if (srcReq.user && srcReq.user.id) {
                // Add the custom header for the downstream service
                proxyReqOpts.headers['X-User-Id'] = srcReq.user.id;
                console.log(`Gateway: Forwarding to PHG Service WITH X-User-Id: ${srcReq.user.id}`);
            } else {
                // Log if verifyToken ran but didn't attach user.id as expected
                console.warn("Gateway: proxyReqOptDecorator - srcReq.user or srcReq.user.id is missing after verifyToken.");
            }
            // --- END SECTION ---

            // Optional: Remove original Authorization header?
            // delete proxyReqOpts.headers['authorization'];

            return proxyReqOpts;
        },
        proxyReqBodyDecorator: (bodyContent, srcReq) => {
            return bodyContent ? JSON.stringify(bodyContent) : '{}';
        },
        proxyErrorHandler: (err, res, next) => {
            console.error('Proxy Error (PGF Service):', err);
            // Check for ECONNREFUSED specifically
            if (err.code === 'ECONNREFUSED') {
                 res.status(503).json({ message: 'PHG service is unavailable or connection refused.' });
            } else {
                // Handle other proxy errors
                 res.status(502).json({ message: 'Bad Gateway: Error communicating with PHG Service.' });
            }
        }
    })
);

// ✅ API Gateway status check (remains public)
app.get("/", (req, res) => {
    res.send("API Gateway is Running...");
});

// --- Basic Error Handler (Add AFTER all routes/proxies) ---
// Catches errors passed via next() from proxyErrorHandlers or other middleware
app.use((err, req, res, next) => {
    console.error("Unhandled Gateway Error:", err);
    // Avoid sending detailed error stacks to client in production
    res.status(err.status || 500).json({
         message: err.message || "An unexpected error occurred on the gateway."
    });
});

app.listen(PORT, '0.0.0.0', () => console.log(`✅ API Gateway running on port ${PORT}`));