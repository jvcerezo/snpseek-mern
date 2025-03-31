import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL // ✅ Uses API Gateway
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
