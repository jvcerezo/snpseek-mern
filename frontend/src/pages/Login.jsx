import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// import { loginUser } from "../api"; // <-- 1. REMOVED THIS IMPORT
import { useAuth } from "../context/AuthContext"; // <-- 2. IMPORTED useAuth (adjust path if necessary)
// Import Fa icons from react-icons
import { FaUser, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaSignInAlt, FaUserPlus, FaGoogle, FaGithub, FaDna } from 'react-icons/fa';
import "./Login.css"; // Adjust path if necessary

export default function Login() {
    // State for identifier (can be username or email) and password
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate(); // Keep for other potential navigation (like to /register)
    const { login } = useAuth(); // <-- 3. GET the login function from context

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setIsLoading(true);
        setError("");
        try {
            // Basic validation client-side
            if (!identifier || !password) {
                throw new Error("Username/Email and password are required.");
            }
            await login({ identifier, password }); // <-- 4. CALL context's login function
            console.log("Login component: Context login successful. Waiting for navigation effect...");


        } catch (err) {
             // Use err.message provided by the api.js error handling (passed through context)
            setError(err?.message || "Login failed. Please check credentials.");
            console.error("Login component error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder handlers for social login (remains the same)
    const handleSocialLogin = (provider) => {
        setError(''); // Clear previous errors
        console.log(`Attempting login with ${provider}...`);
        // TODO: Implement actual social login flow
        setError(`Social login with ${provider} is not yet implemented.`);
    }

    return (
        <div className="login-page">
             {/* Optional decorative background */}
             <div className="background-shapes">
                  <div className="shape shape-1"></div>
                  <div className="shape shape-2"></div>
             </div>

            <div className="login-container">
                <div className="login-card">
                     {/* <div className="card-decoration"></div> */}

                    <div className="login-header">
                        <div className="logo-container">
                           {/* <FaDna size={30} className="header-icon"/> */}
                           <h2 className="logo-text">Welcome!</h2>
                           <p className="login-subtitle">Login to access your dashboard</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        {error && (
                            <div className="error-message login-error">
                                <FaExclamationCircle />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Identifier (Username or Email) Input */}
                        <div className="input-group floating">
                            <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaUser /></span>
                                <input
                                    id="login-identifier"
                                    type="text"
                                    placeholder=" "
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-invalid={!!error}
                                />
                                <label htmlFor="login-identifier">Username or Email</label>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="input-group floating">
                             <div className="input-wrapper">
                                <span className="input-icon-prefix"><FaLock /></span>
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder=" "
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-invalid={!!error}
                                />
                                <label htmlFor="login-password">Password</label>
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
                        </div>

                         {/* Optional: Remember Me / Forgot Password */}
                         <div className="login-options">
                             {/* <label className="remember-me">
                                 <input type="checkbox" disabled={isLoading} /> Remember Me
                             </label> */}
                             <Link to="/forgot-password" className="forgot-password-link">Forgot Password?</Link>
                         </div>


                        <button className="primary-btn login-button" type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <span className="spinner small-spinner"></span> Logging in...
                                </>
                            ) : (
                                <>
                                    <FaSignInAlt className="btn-icon" /> Login
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
                            <FaGoogle className="btn-icon social-icon" /> Continue with Google
                        </button>
                        <button
                            type="button"
                            className="secondary-btn social-button github"
                            onClick={() => handleSocialLogin('GitHub')}
                            disabled={isLoading}
                          >
                            <FaGithub className="btn-icon social-icon" /> Continue with GitHub
                        </button>
                    </div>

                    {/* Footer Link to Register */}
                    <div className="login-footer">
                        <p className="signup-text">
                            Don't have an account?{' '}
                            <Link to="/register" className="signup-link">
                                <FaUserPlus /> Sign Up Here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}