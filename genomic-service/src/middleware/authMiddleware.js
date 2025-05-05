import jwt from 'jsonwebtoken';

export const protect = async (req, res, next) => {
    const authHeader = req.header("Authorization");
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET; // Make sure JWT_SECRET is available

            if (!secret) {
                 console.error("FATAL: JWT_SECRET is not defined in protect middleware.");
                 return res.status(500).json({ message: "Internal Server Error: Auth configuration missing" });
             }

            const decodedPayload = jwt.verify(token, secret);

            // Attach decoded payload (ensure it contains 'id')
            req.user = decodedPayload;

            console.log(`Protect Middleware (Genomic Service): Token verified for user ID ${req.user.id}`);
            next(); // Proceed only if token is valid

        } catch (error) {
            console.error("Protect Middleware (Genomic Service) Error:", error.message);
             if (error.name === 'TokenExpiredError') { return res.status(401).json({ message: "Access Denied: Token expired" }); }
             if (error.name === 'JsonWebTokenError') { return res.status(401).json({ message: "Access Denied: Invalid token" }); }
             return res.status(401).json({ message: "Not authorized" }); // Catch-all for verification errors
        }
    } else {
         // No token or invalid format
         console.warn("Protect Middleware (Genomic Service): Missing or invalid Bearer token header.");
         return res.status(401).json({ message: "Access Denied: No token provided or invalid format" });
    }
};