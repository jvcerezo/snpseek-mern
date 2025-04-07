import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import GeneLoci from "./pages/GeneLoci";
import Pipeline from "./pages/Pipeline";
import GenotypeSearch from "./pages/GenotypeSearch";
import AboutPage from "./pages/AboutPage";
import QCMetricsPage from "./pages/QCMetricsPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search-gene-loci" element={<GeneLoci />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/search-genotype" element={<GenotypeSearch />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/qc-metrics" element={<QCMetricsPage />} />
        {/* Add other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
