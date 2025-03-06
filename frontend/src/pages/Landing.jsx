import { motion } from "framer-motion";
import { useState } from "react";
import "./Landing.css";

export default function LandingPage() {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const features = [
    "Powerful SNP Search Tools",
    "Comprehensive Genomic Data",
    "Seamless Integration for Researchers",
  ];

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <header className="hero">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
          Welcome to SNP-Seek
        </motion.h1>
        <p>Your gateway to advanced genomic research.</p>
        <button className="cta-button">Get Started</button>
      </header>

      {/* Carousel Section */}
      <section className="carousel">
        <motion.div
          key={carouselIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2>{features[carouselIndex]}</h2>
        </motion.div>
        <button onClick={() => setCarouselIndex((carouselIndex + 1) % features.length)}>
          Next
        </button>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Why Choose SNP-Seek?</h2>
        <ul>
          {features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
