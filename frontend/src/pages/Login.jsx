import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { Lock, User } from "lucide-react";
import "./Login.css"; // Custom styles

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginUser({ email, password });
      localStorage.setItem("token", data.token);
      alert("✅ Login successful!");
      navigate("/dashboard");
    } catch (error) {
      alert(`❌ Login failed: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">SNP-MERN Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User className="icon" />
            <input
              type="email"
              placeholder="Email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock className="icon" />
            <input
              type="password"
              placeholder="Password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="login-button" type="submit">Login</button>
        </form>
        <p className="signup-text">
          Don't have an account? <a href="/register" className="signup-link">Sign Up</a>
        </p>
      </div>
    </div>
  );
}
