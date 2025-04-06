import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import "./Register.css";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Refs for input fields
  const usernameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await registerUser({ username, email, password });
      navigate("/login");
    } catch (error) {
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="background-pattern"></div>
      <div className="register-container">
        <div className="register-card">
          <div className="card-decoration"></div>
          
          <div className="register-header">
            <div className="logo-container">
              <div className="logo-circle">
                <i className="fas fa-dna logo-icon"></i>
              </div>
              <h1 className="logo-text">SNP-MERN</h1>
            </div>
            <h2 className="register-title">Create Your Account</h2>
            <p className="register-subtitle">Join our genomic research platform</p>
          </div>
          
          <form onSubmit={handleRegister} className="register-form">
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            <div className="floating-input">
              <div className="input-container">
                <User className="input-icon" size={18} />
                <input
                  id="username"
                  type="text"
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  ref={usernameRef}
                />
                <label htmlFor="username">Username</label>
              </div>
            </div>
            
            <div className="floating-input">
              <div className="input-container">
                <Mail className="input-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  ref={emailRef}
                />
                <label htmlFor="email">Email</label>
              </div>
            </div>
            
            <div className="floating-input">
              <div className="input-container">
                <Lock className="input-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  ref={passwordRef}
                />
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="password-strength">
                <div className={`strength-bar ${password.length > 0 ? 'active' : ''} ${password.length > 5 ? 'medium' : ''} ${password.length > 8 ? 'strong' : ''}`}></div>
                <span className="strength-text">
                  {password.length === 0 ? '' : 
                   password.length < 6 ? 'Weak' : 
                   password.length < 9 ? 'Medium' : 'Strong'}
                </span>
              </div>
            </div>
            
            <button className="register-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span> Creating account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Register Now
                </>
              )}
            </button>
          </form>
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="social-login">
            <button className="social-button google">
              <i className="fab fa-google"></i> Continue with Google
            </button>
            <button className="social-button github">
              <i className="fab fa-github"></i> Continue with GitHub
            </button>
          </div>
          
          <div className="register-footer">
            <p className="login-text">
              Already have an account?{' '}
              <a href="/login" className="login-link">
                <i className="fas fa-sign-in-alt">Log In</i>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}