import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api"; // Adjust path if necessary
// Import Fa icons from react-icons
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaUserPlus, FaSignInAlt, FaGoogle, FaGithub, FaDna, FaAddressCard, FaCheckCircle, FaArrowRight } from 'react-icons/fa';
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

    // Ensure it always returns the object
    return { score, text, className };
};


export default function RegisterPage() {
    // --- State Variables ---
    // Ensure initial state is correct
    const [username, setUsername] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [middleName, setMiddleName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    // Verify this initial state in your local file
    const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: '', className: '' });
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const navigate = useNavigate();

    // Update password strength when password changes
    useEffect(() => {
        // Ensure calculateStrength returns a valid object
        const strength = calculateStrength(password);
        if (strength) { // Check just in case calculateStrength was modified
             setPasswordStrength(strength);
        } else {
             // Fallback if calculateStrength somehow returns undefined/null
             setPasswordStrength({ score: 0, text: '', className: '' });
             console.error("calculateStrength returned unexpected value");
        }
    }, [password]);

    // Clear error when inputs change
    useEffect(() => {
        if (username || firstName || lastName || email || password) {
            setError('');
        }
    }, [username, firstName, lastName, email, password]);

    const handleRegister = async (e) => {
        e.preventDefault();
        // Validation
        if (!username || !firstName || !lastName || !email || !password) { setError("Username, First Name, Last Name, Email, and Password are required."); return; }
        if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }

        setIsLoading(true); setError(""); setRegistrationSuccess(false);
        try {
            const response = await registerUser({ username, firstName, lastName, middleName, email, password });
            console.log("Registration successful:", response);
            setRegistrationSuccess(true);
            setUsername(""); setFirstName(""); setLastName(""); setMiddleName(""); setEmail(""); setPassword("");
        } catch (err) {
            const errorMessage = err?.message || "Registration failed. Please check details or try again.";
            setError(errorMessage); console.error("Registration Error:", err); setRegistrationSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

     // Placeholder handlers for social login
     const handleSocialLogin = (provider) => {
         setError(''); setRegistrationSuccess(false);
         console.log(`Attempting sign up with ${provider}...`);
         setError(`Social sign up with ${provider} is not yet implemented.`);
     }

    return (
        <div className="register-page">
             <div className="background-shapes"> <div className="shape shape-1"></div> <div className="shape shape-2"></div> <div className="shape shape-3"></div> </div>
            <div className="register-container">
                <div className="register-card">
                    <div className="register-header"> <div className="logo-container"> <h2 className="logo-text">Create your Account</h2> <p className="register-subtitle">Join our genomic research platform</p> </div> </div>

                    {/* --- Conditional Rendering: Form OR Success --- */}
                    {!registrationSuccess ? (
                        <>
                            <form onSubmit={handleRegister} className="register-form">
                                {error && ( <div className="error-message register-error"> <FaExclamationCircle /> <span>{error}</span> </div> )}

                                {/* Username Input */}
                                <div className="input-group floating"> <div className="input-wrapper"> <span className="input-icon-prefix"><FaUser /></span> <input id="register-username" type="text" placeholder=" " value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} required /> <label htmlFor="register-username">Username</label> </div> </div>
                                {/* First Name Input */}
                                <div className="input-group floating"> <div className="input-wrapper"> <span className="input-icon-prefix"><FaAddressCard /></span> <input id="register-firstName" type="text" placeholder=" " value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} required /> <label htmlFor="register-firstName">First Name</label> </div> </div>
                                {/* Last Name Input */}
                                <div className="input-group floating"> <div className="input-wrapper"> <span className="input-icon-prefix"><FaAddressCard /></span> <input id="register-lastName" type="text" placeholder=" " value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} required /> <label htmlFor="register-lastName">Last Name</label> </div> </div>
                                {/* Middle Name Input */}
                                <div className="input-group floating"> <div className="input-wrapper"> <span className="input-icon-prefix"><FaAddressCard /></span> <input id="register-middleName" type="text" placeholder=" " value={middleName} onChange={(e) => setMiddleName(e.target.value)} disabled={isLoading} /> <label htmlFor="register-middleName">Middle Name (Optional)</label> </div> </div>
                                {/* Email Input */}
                                <div className="input-group floating"> <div className="input-wrapper"> <span className="input-icon-prefix"><FaEnvelope /></span> <input id="register-email" type="email" placeholder=" " value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} required /> <label htmlFor="register-email">Email Address</label> </div> </div>
                                {/* Password Input */}
                                <div className="input-group floating">
                                    <div className="input-wrapper">
                                        <span className="input-icon-prefix"><FaLock /></span>
                                        <input id="register-password" type={showPassword ? "text" : "password"} placeholder=" " value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} required aria-describedby="password-strength-indicator" />
                                        <label htmlFor="register-password">Password</label>
                                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}> {showPassword ? <FaEyeSlash /> : <FaEye />} </button>
                                    </div>
                                    {/* Password Strength Indicator (with Safeguards) */}
                                    <div id="password-strength-indicator" className="password-strength" aria-live="polite">
                                        {/* Use optional chaining (?.) and nullish coalescing (?? '') */}
                                        <div className={`strength-bar ${passwordStrength?.className ?? ''}`}></div>
                                        <span className={`strength-text ${passwordStrength?.className ?? ''}`}>{passwordStrength?.text ?? ''}</span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button className="primary-btn register-button" type="submit" disabled={isLoading}> {isLoading ? ( <> <span className="spinner small-spinner"></span> Creating Account... </> ) : ( <> <FaUserPlus className="btn-icon" /> Register Now </> )} </button>
                            </form>

                            {/* Divider and Social Login */}
                            <div className="divider"> <span>OR</span> </div>
                            <div className="social-login"> <button type="button" className="secondary-btn social-button google" onClick={() => handleSocialLogin('Google')} disabled={isLoading} > <FaGoogle className="btn-icon social-icon" /> Sign Up with Google </button> <button type="button" className="secondary-btn social-button github" onClick={() => handleSocialLogin('GitHub')} disabled={isLoading} > <FaGithub className="btn-icon social-icon" /> Sign Up with GitHub </button> </div>

                            {/* Footer Link to Login */}
                            <div className="register-footer"> <p className="login-text"> Already have an account?{' '} <Link to="/login" className="login-link"> <FaSignInAlt /> Log In Here </Link> </p> </div>
                        </>
                    ) : (
                        // --- Success Message ---
                        <div className="registration-success-message">
                            <FaCheckCircle className="success-icon" />
                            <h3>Registration Successful!</h3>
                            <p>Your account has been created.</p>
                            <p>You can now log in using your credentials.</p>
                            <Link to="/login" className="primary-btn go-to-login-btn"> Go to Login <FaArrowRight style={{ marginLeft: '8px' }}/> </Link>
                        </div>
                    )}
                    {/* --- End Conditional Rendering --- */}

                </div> {/* End register-card */}
            </div> {/* End register-container */}
        </div> // End register-page
    );
}