// middleware/authMiddleware.js (for the List Service)

/**
 * Middleware to protect routes by checking for user identification
 * provided by the API Gateway via the 'X-User-Id' header.
 *
 * Assumes the API Gateway has already verified the user's JWT token.
 */
export const protect = (req, res, next) => {
    // Express automatically converts header names to lowercase
    const userId = req.headers['x-user-id'];

    if (!userId) {
        // If the header is missing, it means the request likely didn't
        // pass authentication at the gateway or the gateway is misconfigured.
        console.warn("List Service Protect Middleware: Missing 'X-User-Id' header.");
        return res.status(401).json({ message: 'Unauthorized: User identification missing.' });
    }

    // Attach the user ID to the request object for downstream controllers/services
    // Create a simple user object compatible with how controllers expect it (req.user.id)
    req.user = {
        id: userId
    };

    console.log(`List Service Protect Middleware: User identified via header - ID: ${req.user.id}`);

    // Proceed to the next middleware or route handler
    next();
};

// You can add other middleware exports here if needed in the future, e.g.:
// export const adminOnly = (req, res, next) => { ... };