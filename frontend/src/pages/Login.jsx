import React, { useState } from "react"; // Added React import
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import { loginUser } from "../api"; // Adjust path if necessary
// Import Fa icons from react-icons
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaSignInAlt, FaUserPlus, FaGoogle, FaGithub, FaDna } from 'react-icons/fa';
import "./Login.css"; // Adjust path if necessary

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault(); // Prevent default form submission
        setIsLoading(true);
        setError("");
        try {
            // Basic validation client-side (optional, backend should always validate)
            if (!email || !password) {
                throw new Error("Email and password are required.");
            }
            const data = await loginUser({ email, password });
            // Assuming loginUser throws error on failure from api.js
            localStorage.setItem("token", data.token); // Store the token
            // TODO: Store user info if needed (e.g., in state management)
            navigate("/dashboard"); // Navigate to dashboard on success
        } catch (err) {
             // Use err.message provided by the api.js error handling
            setError(err.message || "Login failed. Please check credentials.");
            console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Placeholder handlers for social login
    const handleSocialLogin = (provider) => {
        setError(''); // Clear previous errors
        console.log(`Attempting login with ${provider}...`);
        // TODO: Implement actual social login flow (e.g., using Firebase Auth, Passport.js strategy, OAuth library)
        setError(`Social login with ${provider} is not yet implemented.`);
    }

    return (
        <div className="login-page">
            {/* Optional decorative background */}
            <div className="background-shapes">
                 {/* Add some abstract shapes if desired */}
                 <div className="shape shape-1"></div>
                 <div className="shape shape-2"></div>
            </div>

            <div className="login-container">
                <div className="login-card">
                    {/* Optional subtle decoration */}
                     {/* <div className="card-decoration"></div> */}

                    <div className="login-header">
                        <div className="logo-container">
                             {/* Consistent logo style */}
                            <Link to="/" className="logo-link" aria-label="Homepage">
                                <FaDna className="logo-icon" />
                                <span className="logo-text">SNP-App</span>
                            </Link>
                        </div>
                        <h2 className="login-title">Welcome Back</h2>
                        <p className="login-subtitle">Login to access your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        {error && (
                            // Use themed error message style
                            <div className="error-message login-error">
                                <FaExclamationCircle />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="input-group floating"> {/* Use common input-group */}
                            <div className="input-wrapper"> {/* Wrapper for icon/input/button */}
                                <span className="input-icon-prefix"><FaEnvelope /></span>
                                <input
                                    id="login-email" // Unique ID
                                    type="email"
                                    placeholder=" " // Needed for floating label
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    aria-required="true"
                                    aria-invalid={!!error} // Indicate invalid if error exists
                                />
                                <label htmlFor="login-email">Email Address</label>
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
                                    type="button" // Important: Not submit
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    disabled={isLoading}
                                >
                                    {/* Toggle icon based on state */}
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
                         {/* Use secondary-btn style */}
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
                            {/* Use Link component */}
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