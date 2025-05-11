import express from "express";
import { register, login, getProfile, updateProfile, logout, loginWithDrupalSso } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js"; // Import the middleware

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/portal", loginWithDrupalSso); // Drupal SSO login

// Protected routes (require valid token)
router.get("/profile", authMiddleware, getProfile); // Protect GET /profile

router.post("/logout", authMiddleware, logout); // Protect POST /logout
// Optional: Add route for password change if needed
// router.put("/change-password", authMiddleware, changePassword);

export default router;