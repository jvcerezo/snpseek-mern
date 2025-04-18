import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// --- Helper Function ---
// Selects user fields to return to the client (omits password)
const getUserData = (user) => {
    if (!user) return null;
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

// --- Controller Functions ---

// Register a new user
export const register = async (req, res) => {
    console.log("Register endpoint hit with data:", req.body);
    // Destructure all expected fields from the request body
    const { username, firstName, lastName, middleName, email, password } = req.body;

    // Basic backend validation (complementary to frontend validation)
    if (!username || !firstName || !lastName || !email || !password) {
        console.log("❌ Missing required fields");
        return res.status(400).json({ message: "Missing required fields: username, firstName, lastName, email, password" });
    }

    try {
        // Check if email exists
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            console.log(`❌ Email already in use: ${email}`);
            return res.status(400).json({ message: "Email already in use" });
        }

        // Optional: Check if username exists (Consider adding unique index to schema too)
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            console.log(`❌ Username already taken: ${username}`);
            return res.status(400).json({ message: "Username already taken" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10); // Generate salt
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user with all fields
        const newUser = new User({
            username: username.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            middleName: middleName?.trim(), // Handle optional middleName
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            // Role defaults to 'GUEST' as per schema
        });

        await newUser.save();

        console.log("✅ User registered successfully:", newUser._id, newUser.email);

        // Return only essential data, excluding password
        return res.status(201).json({
            message: "User registered successfully!",
            user: getUserData(newUser) // Return created user data (optional)
        });

    } catch (error) {
        console.error("❌ Server error during registration:", error);
        // Handle potential Mongoose validation errors more specifically if needed
        if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Login user
export const login = async (req, res) => {
  console.log("Login endpoint hit with data:", req.body);
  // Accept 'identifier' which can be email or username
  const { identifier, password } = req.body;

  if (!identifier || !password) {
      return res.status(400).json({ message: "Username/Email and password are required" });
  }

  try {
      let user = null;
      let queryField = '';
      let queryValue = '';

      // Determine if identifier is likely an email or username
      if (identifier.includes('@')) {
          queryField = 'email';
          queryValue = identifier.trim().toLowerCase();
          console.log(`Attempting login with email: ${queryValue}`);
      } else {
          queryField = 'username';
          queryValue = identifier.trim();
           console.log(`Attempting login with username: ${queryValue}`);
      }

      // Find user by email or username
      user = await User.findOne({ [queryField]: queryValue });

      if (!user) {
          console.log(`Login attempt failed: No user found for ${queryField} ${queryValue}`);
          // Return generic message for security
          return res.status(401).json({ message: "Invalid credentials" });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
          console.log(`Login attempt failed: Incorrect password for ${queryField} ${queryValue}`);
          // Return generic message
          return res.status(401).json({ message: "Invalid credentials" });
      }

      // --- Token Generation (remains the same) ---
      const payload = {
          id: user._id,
          role: user.role
      };
      const secret = process.env.JWT_SECRET;
      const options = { expiresIn: "1h" };

      if (!secret) {
           console.error("FATAL: JWT_SECRET is not defined during login.");
           return res.status(500).json({ message: "Server configuration error" });
      }
      const token = jwt.sign(payload, secret, options);
      // --- End Token Generation ---


      console.log(`✅ User logged in successfully: ${user.email} (ID: ${user._id})`);

      // Return token and user details (excluding password)
      res.status(200).json({
           message: "Login successful",
           token,
           user: getUserData(user) // Use helper function
      });

  } catch (error) {
      console.error("❌ Server error during login:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export const logout = async (req, res) => {
    try {
        // The authMiddleware already verified the token is valid.
        // Optional: Log the logout event.
        const userId = req.user?.id; // Get user ID from token payload (added by middleware)
        console.log(`✅ User logged out: ${userId}`);

        // Optional Advanced: Implement server-side token invalidation here
        // e.g., add token JTI (jwt id) or signature to a blocklist (Redis, DB)
        // const jti = req.user?.jti; // If you include 'jti' in your JWT payload
        // if (jti) { await addToBlocklist(jti); }

        // For basic logout, just acknowledging is enough as client removes token.
        res.status(200).json({ message: "Logout successful" });

    } catch (error) {
        console.error("❌ Server error during logout:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get Logged-in User Profile
export const getProfile = async (req, res) => {
    try {
        // User ID is attached to req.user by the authMiddleware
        const userId = req.user?.id;
        if (!userId) {
            // This should technically not happen if middleware is working, but good practice
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await User.findById(userId); //.select("-password"); // Exclude password explicitly

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ Profile retrieved for user: ${userId}`);
        res.status(200).json(getUserData(user)); // Use helper to format output

    } catch (error) {
        console.error("❌ Server error fetching profile:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};


// Update Logged-in User Profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Fields allowed for update (explicitly exclude password and role changes here)
        const { firstName, lastName, middleName, username, email } = req.body;

        // Basic validation
        if (!firstName && !lastName && !username && !email && !middleName) {
             return res.status(400).json({ message: "No update data provided." });
        }

        const updateData = {};
        if (firstName) updateData.firstName = firstName.trim();
        if (lastName) updateData.lastName = lastName.trim();
        if (middleName !== undefined) updateData.middleName = middleName.trim(); // Allow clearing middle name
        if (username) updateData.username = username.trim();
        if (email) updateData.email = email.trim().toLowerCase();


        // If username or email is being updated, check for uniqueness
        if (updateData.username) {
            const existingUser = await User.findOne({ username: updateData.username, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Username already taken." });
            }
        }
         if (updateData.email) {
            const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use by another account." });
            }
        }


        // Find user and update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true } // Return updated doc, run schema validators
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        console.log(`✅ Profile updated for user: ${userId}`);
        res.status(200).json({
            message: "Profile updated successfully",
            user: getUserData(updatedUser) // Return updated user data
        });

    } catch (error) {
        console.error("❌ Server error updating profile:", error);
         if (error.name === 'ValidationError') {
             return res.status(400).json({ message: "Validation Error", errors: error.errors });
        }
        // Handle potential duplicate key errors if unique checks fail concurrently (rare)
        if (error.code === 11000) {
             return res.status(400).json({ message: "Username or Email conflict occurred." });
        }
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};