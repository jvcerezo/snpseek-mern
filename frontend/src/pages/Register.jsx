import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api"; // Adjust path if necessary
// Import Fa icons from react-icons
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaUserPlus, FaSignInAlt, FaGoogle, FaGithub, FaDna, FaAddressCard } from 'react-icons/fa'; // Added FaAddressCard
import "./Register.css"; // Adjust path if necessary

// Helper function for password strength (basic example)
const calculateStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, text: '', className: '' };

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++; // Uppercase
    if (/[a-z]/.test(password)) score++; // Lowercase
    if (/[0-9]/.test(password)) score++; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) score++; // Symbols

    let text = 'Weak';
    let className = 'weak';
    if (score >= 5) { text = 'Strong'; className = 'strong'; }
    else if (score >= 3) { text = 'Medium'; className = 'medium'; }
    // else weak

    return { score, text, className };
};


export default function RegisterPage() {
    // --- State Variables ---
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");   // <-- Added
    const [lastName, setLastName] = useState("");     // <-- Added
    const [middleName, setMiddleName] = useState(""); // <-- Added
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', className: '' });
    const navigate = useNavigate();

    // Update password strength when password changes
    useEffect(() => {
        setPasswordStrength(calculateStrength(password));
    }, [password]);

    const handleRegister = async (e) => {
        e.preventDefault();
        // Basic client-side validation - include new required fields
        if (!username || !firstName || !lastName || !email || !password) { // <-- Added firstName, lastName check
            setError("Username, First Name, Last Name, Email, and Password are required.");
            return;
        }
        if (password.length < 8) {
             setError("Password must be at least 8 characters long.");
             return;
        }
         // Add more validation if needed (e.g., email format)

        setIsLoading(true);
        setError("");
        try {
            // Include all fields required by the schema in the payload
            await registerUser({
                username,
                firstName, // <-- Added
                lastName,  // <-- Added
                middleName, // <-- Added (optional, send even if empty)
                email,
                password
            });
            // Optionally show a success message before redirecting
            // alert("Registration successful! Please login.");
            navigate("/login"); // Redirect to login page after successful registration
        } catch (err) {
            // Use the formatted error message from api.js if available
            const errorMessage = err?.message || "Registration failed. Please check your details and try again.";
            setError(errorMessage);
            console.error("Registration Error:", err);
        } finally {
            setIsLoading(false);
        }
    };

     // Placeholder handlers for social login
     const handleSocialLogin = (provider) => {
         setError(''); // Clear previous errors
         console.log(`Attempting sign up with ${provider}...`);
         // TODO: Implement actual social login flow
         setError(`Social sign up with ${provider} is not yet implemented.`);
     }

    return (
        <div className="register-page">
             {/* Optional decorative background */}
              <div className="background-shapes">
                  <div className="shape shape-1"></div>
                  <div className="shape shape-2"></div>
                  <div className="shape shape-3"></div>
             </div>

            <div className="register-container">
                <div className="register-card">
                    {/* <div className="card-decoration"></div> */}

                    <div className="register-header">
                        <div className="logo-container">
                        {/* Optional: Add a logo icon if desired */}
                        {/* <FaDna size={30} className="header-icon"/> */}
                        <h2 className="logo-text">Create your Account</h2>
                        <p className="register-subtitle">Join our genomic research platform</p>
                        </div>
                    </div>

                    <form onSubmit={handleRegister} className="register-form">
                        {error && (
                            // Use themed error message style
                            <div className="error-message register-error">
                                <FaExclamationCircle />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Username Input */}
                        <div className="input-group floating">
                            <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaUser /></span>
                                <input
                                    id="register-username"
                                    type="text"
                                    placeholder=" " // Needed for floating label
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-invalid={!!error && error.toLowerCase().includes('username')}
                                />
                                <label htmlFor="register-username">Username</label>
                            </div>
                        </div>

                         {/* First Name Input */} {/* <-- ADDED */}
                         <div className="input-group floating">
                            <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaAddressCard /></span>
                                <input
                                    id="register-firstName"
                                    type="text"
                                    placeholder=" "
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-invalid={!!error && error.toLowerCase().includes('first name')}
                                />
                                <label htmlFor="register-firstName">First Name</label>
                            </div>
                        </div>

                         {/* Last Name Input */} {/* <-- ADDED */}
                         <div className="input-group floating">
                             <div className="input-wrapper">
                                 <span className="input-icon-prefix"><FaAddressCard /></span> {/* Reuse icon or choose another */}
                                 <input
                                     id="register-lastName"
                                     type="text"
                                     placeholder=" "
                                     value={lastName}
                                     onChange={(e) => setLastName(e.target.value)}
                                     disabled={isLoading}
                                     required
                                     aria-required="true"
                                     aria-invalid={!!error && error.toLowerCase().includes('last name')}
                                 />
                                 <label htmlFor="register-lastName">Last Name</label>
                             </div>
                         </div>

                         {/* Middle Name Input (Optional) */} {/* <-- ADDED */}
                         <div className="input-group floating">
                             <div className="input-wrapper">
                                 <span className="input-icon-prefix"><FaAddressCard /></span> {/* Reuse icon */}
                                 <input
                                     id="register-middleName"
                                     type="text"
                                     placeholder=" "
                                     value={middleName}
                                     onChange={(e) => setMiddleName(e.target.value)}
                                     disabled={isLoading}
                                     // Not required
                                 />
                                 <label htmlFor="register-middleName">Middle Name (Optional)</label>
                             </div>
                         </div>

                        {/* Email Input */}
                        <div className="input-group floating">
                            <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaEnvelope /></span>
                                <input
                                    id="register-email"
                                    type="email"
                                    placeholder=" "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                     aria-invalid={!!error && error.toLowerCase().includes('email')}
                                />
                                <label htmlFor="register-email">Email Address</label>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="input-group floating">
                            <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaLock /></span>
                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-describedby="password-strength-indicator" // Link to strength indicator
                                    aria-invalid={!!error && error.toLowerCase().includes('password')}
                                />
                                <label htmlFor="register-password">Password</label>
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={isLoading}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                             {/* Password Strength Indicator */}
                             <div id="password-strength-indicator" className="password-strength" aria-live="polite">
                                 <div className={`strength-bar ${passwordStrength.className}`}></div>
                                 <span className="strength-text">{passwordStrength.text}</span>
                             </div>
                        </div>

                         {/* TODO: Add Confirm Password Field if desired */}
                         {/*
                         <div className="input-group floating">
                             ... confirm password input ...
                         </div>
                         */}


                        <button className="primary-btn register-button" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner small-spinner"></span> Creating Account...
                                </>
                            ) : (
                                <>
                                    <FaUserPlus className="btn-icon" /> Register Now
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="divider">
                        <span>OR</span>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="social-login">
                        <button
                            type="button"
                            className="secondary-btn social-button google"
                            onClick={() => handleSocialLogin('Google')}
                            disabled={isLoading}
                         >
                            <FaGoogle className="btn-icon social-icon" /> Sign Up with Google
                        </button>
                        <button
                            type="button"
                            className="secondary-btn social-button github"
                            onClick={() => handleSocialLogin('GitHub')}
                            disabled={isLoading}
                         >
                            <FaGithub className="btn-icon social-icon" /> Sign Up with GitHub
                        </button>
                    </div>

                    {/* Footer Link to Login */}
                    <div className="register-footer">
                        <p className="login-text">
                            Already have an account?{' '}
                            <Link to="/login" className="login-link">
                                <FaSignInAlt /> Log In Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}