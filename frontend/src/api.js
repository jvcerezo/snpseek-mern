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

export const fetchGeneDetailsByNameAndGenome = async (geneName, referenceGenome) => {
  try {
      // Ensure parameters are provided
      if (!geneName || !referenceGenome) {
          throw new Error("Gene name and reference genome are required to fetch details.");
      }
      console.log(`Workspaceing details for gene: ${geneName}, genome: ${referenceGenome}`); // Debug log
      // Define the endpoint and parameters for fetching specific gene details
      // Adjust '/genetic-features/details' to your actual backend endpoint
      const response = await API.get("/genetic-features/details", {
          params: { geneName, referenceGenome }
      });
      // Log the response for debugging
      console.log("Received gene details:", response.data);

      // Expecting a single gene object with full details, including start/end
      // If the backend might return an array (e.g., multiple matches?), handle it appropriately.
      if (Array.isArray(response.data) && response.data.length > 0) {
           console.warn("Received multiple results for gene details, returning the first one.");
           return response.data[0]; // Return the first match if array is returned
      } else if (!Array.isArray(response.data) && response.data) {
           return response.data; // Return the single object
      } else {
           throw new Error("Gene details not found or invalid response format."); // Handle case where no data is returned
      }
  } catch (error) {
      console.error(`Error fetching details for gene ${geneName} (${referenceGenome}):`, error.response || error);
      // Re-throw the error so the component can handle it (e.g., show error message)
      throw error.response ? error.response.data : { message: error.message || "Could not fetch gene details." };
  }
};

