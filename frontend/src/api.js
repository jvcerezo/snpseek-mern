import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL 
});

// ✅ Register User
export const registerUser = async (userData) => {
  try {
    const response = await API.post("/auth/register", userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Login User
export const loginUser = async (userData) => {
  try {
    const response = await API.post("/auth/login", userData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// ✅ Fetch Traits
export const fetchTraits = async () => {
  try {
    const response = await API.get("/genetic-features/traits");
    return response.data;
  } catch (error) {
    console.error("Error fetching traits:", error);
    return [];
  }
};

// ✅ Fetch Reference Genomes
export const fetchReferenceGenomes = async () => {
  try {
    const response = await API.get("/genetic-features/reference-genomes");
    return response.data;
  } catch (error) {
    console.error("Error fetching reference genomes:", error);
    return [];
  }
};

// ✅ Fetch Features by Gene Name
export const fetchFeaturesByGeneName = async (geneName, referenceGenome, searchType) => {
  try {
    const response = await API.get("/genetic-features/by-gene-name", {
      params: { geneName, referenceGenome, searchType }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching features:", error);
    return [];
  }
};

// ✅ Fetch Genes by Trait
export const fetchGenesByTrait = async (traitName, referenceGenome) => {
  try {
    const response = await API.get("/genetic-features/by-trait", { params: { traitName, referenceGenome } });
    return response.data; 
  } catch (error) {
    console.error("❌ Error fetching genes by trait:", error);
    return [];
  }
};

