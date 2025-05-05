import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Middleware to protect routes by verifying a JWT token
 * from the Authorization: Bearer header.
 */
export const protect = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    let token;

    // Check for Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET; // Ensure JWT_SECRET is available in List Service env

            if (!secret) {
                 console.error("FATAL: JWT_SECRET is not defined in List Service protect middleware.");
                 // Don't expose internal config errors directly
                 return res.status(500).json({ message: "Internal Server Error" });
             }

            // Verify the token received from the calling service (e.g., Genomic Service)
            const decodedPayload = jwt.verify(token, secret);

            // Attach decoded payload (ensure it contains 'id') to req.user
            req.user = decodedPayload;

            console.log(`List Service Protect Middleware: Token verified for user ID ${req.user.id}`);
            next(); // Proceed only if token is valid

        } catch (error) {
            console.error("List Service Protect Middleware Error:", error.message);
             if (error.name === 'TokenExpiredError') { return res.status(401).json({ message: "Access Denied: Token expired" }); }
             if (error.name === 'JsonWebTokenError') { return res.status(401).json({ message: "Access Denied: Invalid token signature/format" }); }
             // Do not expose internal errors like missing secret directly
             return res.status(401).json({ message: "Unauthorized" }); // Generic catch-all for verification errors
        }
    } else {
         // No token or invalid format
         console.warn("List Service Protect Middleware: Missing or invalid Bearer token header.");
         return res.status(401).json({ message: "Unauthorized: Token missing or invalid format" });
    }
};

// Make sure this 'protect' middleware is applied to the '/internal/:id' route
// in the List Service's listRoutes.js file.