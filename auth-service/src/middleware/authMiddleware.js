import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    const authHeader = req.header("Authorization");

    // Check if header exists and follows 'Bearer <token>' format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("Auth Middleware: No token or invalid format");
        // Send 401 if no token or wrong format
        return res.status(401).json({ message: "Access Denied: No token provided or invalid format" });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
         console.log("Auth Middleware: Token missing after Bearer prefix");
         return res.status(401).json({ message: "Access Denied: Token missing" });
    }

    // Verify token
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("FATAL: JWT_SECRET is not defined in auth middleware.");
            return res.status(500).json({ message: "Internal Server Error: Auth configuration missing" });
        }

        const decodedPayload = jwt.verify(token, secret);

        // Attach decoded payload (e.g., { id: userId, role: userRole }) to request object
        req.user = decodedPayload;

        console.log(`Auth Middleware: Token verified for user ID ${req.user.id}`);
        next(); // Proceed to the next middleware or route handler

    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        if (error.name === 'TokenExpiredError') {
             return res.status(401).json({ message: "Access Denied: Token expired" });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Access Denied: Invalid token" });
        }
        // Handle other potential errors during verification
        return res.status(400).json({ message: "Token validation failed" }); // Generic error for other JWT issues
    }
};

export default authMiddleware;