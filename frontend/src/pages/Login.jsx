import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background-pattern"></div>
      <div className="login-container">
        <div className="login-card">
          <div className="card-decoration"></div>
          
          <div className="login-header">
            <div className="logo-container">
              <div className="logo-circle">
                <i className="fas fa-dna logo-icon"></i>
              </div>
              <h1 className="logo-text">SNP-MERN</h1>
            </div>
            <h2 className="login-title">Login to Your Account</h2>
            <p className="login-subtitle">Access your genomic research dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            {error && (
              <div className="error-message">
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
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
            </div>
            
            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span> Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i> Login
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
          
          <div className="login-footer">
            <p className="signup-text">
              Don't have an account?{' '}
              <a href="/register" className="signup-link">
                <i className="fas fa-user-plus">Sign Up</i>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}