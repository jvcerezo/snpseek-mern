import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import { User, Mail, Lock } from "lucide-react";
import "./Register.css"; // Custom styles

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerUser({ username, email, password });
      alert("✅ Registration successful! Please log in.");
      navigate("/login");
    } catch (error) {
      alert(`❌ Registration failed: ${error.message}`);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2 className="register-title">Create an Account</h2>
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <User className="icon" />
            <input
              type="text"
              placeholder="Username"
              className="register-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Mail className="icon" />
            <input
              type="email"
              placeholder="Email"
              className="register-input"
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
              className="register-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="register-button" type="submit">Register</button>
        </form>
        <p className="login-text">
          Already have an account? <a href="/login" className="login-link">Log In</a>
        </p>
      </div>
    </div>
  );
}
