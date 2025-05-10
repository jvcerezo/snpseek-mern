import React, {useEffect} from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import Components and Pages
import Header from "./components/Header";
import AuthWatcher from './components/AuthWatcher'; 
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";          
import GeneLoci from "./pages/GeneLoci";
import Pipeline from "./pages/Pipeline";
import GenotypeSearch from "./pages/GenotypeSearch";
import AboutPage from "./pages/AboutPage";
import ProtectedRoute from "./components/ProtectedRoute";
import MyLists from "./pages/MyLists";
import PHGVisualizationPage from "./pages/PHGVisualization";

function App() {

  useEffect(() => {
    const handleMessage = (event) => {
      const allowedOrigins = ["http://localhost:8080"]; // Replace or add production Drupal origin

      if (!allowedOrigins.includes(event.origin)) return;
      if (event.data?.type === "auth" && event.data.token) {
        const jwt = event.data.token;

        // Save token to localStorage or context
        localStorage.setItem("token", jwt);

        // Optional: call your backend to verify token
        fetch("/api/auth/portal", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Login via iframe JWT successful", data);
            // You can update app state here if needed
          })
          .catch((err) => console.error("JWT auth failed", err));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Router>
      <AuthWatcher />

      <Header /> 
      {/* Header component for navigation */}
      <main>
        <Routes>
          {/* Route Definitions */}
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search-gene-loci" element={<GeneLoci />} />
          <Route path="/pipeline" element={<ProtectedRoute><Pipeline /></ProtectedRoute>} />
          <Route path="/search-genotype" element={<GenotypeSearch />} />
          <Route path="/phg-visualization" element={<ProtectedRoute><PHGVisualizationPage /></ProtectedRoute>} />
          <Route path="/my-lists" element={<ProtectedRoute><MyLists /></ProtectedRoute>} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;