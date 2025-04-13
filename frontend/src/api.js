// frontend/api.js
import axios from "axios";

// Ensure your .env has REACT_APP_API_URL=http://localhost:8000 (or your gateway address)
const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

// --- Axios Interceptors ---

// Request Interceptor: Add Authorization header
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error("Axios request interceptor error:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor: Basic 401 check
API.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        console.error("Axios response interceptor error:", error.response || error.message);
        if (error.response && error.response.status === 401) {
            console.warn("Received 401 Unauthorized. Clearing token.");
            localStorage.removeItem('authToken');
            // Optional: Redirect to login or trigger logout state in your app
            // window.location.href = '/login';
        }
        // Important: Reject the promise so calling code's .catch() still runs
        return Promise.reject(error);
    }
);


// --- Helper to format errors consistently before throwing ---
const formatErrorForThrowing = (error) => {
    if (error.response) {
        // Server responded with a status code outside 2xx range
        return error.response.data || { message: `Request failed with status ${error.response.status}` };
    } else if (error.request) {
        // Request was made but no response received
        return { message: 'No response from server. Check API Gateway connection.' };
    } else {
        // Error setting up the request
        return { message: error.message || 'Error setting up API request.' };
    }
};


// --- API Functions (Paths updated to match gateway routes) ---

// ✅ Register User
export const registerUser = async (userData) => {
    try {
        // Gateway path: /api/auth/register
        const response = await API.post("/api/auth/register", userData);
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Login User
export const loginUser = async (credentials) => { // Expect an object like { identifier, password }
  const { identifier, password } = credentials; // Destructure for clarity
  if (!identifier || !password) {
     throw { message: "Username/Email and Password required in API call" };
  }
  try {
    // Send identifier and password in the request body
    const response = await API.post("/api/auth/login", { identifier, password });

    // Interceptor might handle token storage, but explicit is okay too
    if (response.data && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log("API: Token stored from login response.");
    } else {
        console.warn("API: Login response did not contain a token.");
    }
    // Return the full response data (which includes token and user object)
    return response.data;
  } catch (error) {
     // Clear token on login failure just in case
     localStorage.removeItem('authToken');
     // Throw the formatted error from interceptor/helper
     throw formatErrorForThrowing(error); // Use your error formatting helper
  }
};

export const fetchUserProfile = async () => {
    try {
        // Gateway path: /api/auth/profile
        const response = await API.get("/api/auth/profile");
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
}

// ✅ Logout Helper
export const logoutUser = async () => {
    try {
        await API.post("/api/auth/logout"); // Optional: Call logout endpoint if your API has one
        localStorage.removeItem('authToken'); // Clear token from local storage
        console.log("API: Token cleared on logout.");
    } catch (error) {
        console.error("API: Error during logout:", error);
    }
}

// ✅ Fetch Traits
export const fetchTraits = async () => {
    try {
        // Gateway path: /api/genetic-features/traits
        const response = await API.get("/api/genetic-features/traits");
        return response.data;
    } catch (error) {
         throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Reference Genomes
export const fetchReferenceGenomes = async () => {
    try {
        // Gateway path: /api/genetic-features/reference-genomes
        const response = await API.get("/api/genetic-features/reference-genomes");
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Features by Gene Name
export const fetchFeaturesByGeneName = async (geneName, referenceGenome, searchType) => {
    try {
        // Gateway path: /api/genetic-features/by-gene-name
        const response = await API.get("/api/genetic-features/by-gene-name", {
            params: { geneName, referenceGenome, searchType }
        });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Genes by Trait
export const fetchGenesByTrait = async (traitName, referenceGenome) => {
    try {
        // Gateway path: /api/genetic-features/by-trait
        const response = await API.get("/api/genetic-features/by-trait", {
             params: { traitName, referenceGenome }
        });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Gene Details by Name and Genome
export const fetchGeneDetailsByNameAndGenome = async (geneName, referenceGenome) => {
    if (!geneName || !referenceGenome) {
        throw { message: "Gene name and reference genome are required." }; // Basic validation
    }
    try {
        // Gateway path: /api/genetic-features/details
        const response = await API.get("/api/genetic-features/details", {
            params: { geneName, referenceGenome }
        });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Variety Sets (For Genotype Search Dropdown)
export const fetchVarietySets = async () => {
    try {
        // Gateway Path: /api/genomic/variety-sets -> Proxied to new Genomic Service
        const response = await API.get("/api/genomic/variety-sets");
        return response.data;
    } catch (error) {
        console.error("Error fetching variety sets:", error);
        throw formatErrorForThrowing(error); // Use your existing error helper
    }
};

// ✅ Fetch SNP Sets (For Genotype Search Dropdown)
export const fetchSnpSets = async () => {
    try {
        // Gateway Path: /api/genomic/snp-sets -> Proxied to new Genomic Service
        const response = await API.get("/api/genomic/snp-sets");
        return response.data;
    } catch (error) {
        console.error("Error fetching SNP sets:", error);
        throw formatErrorForThrowing(error); // Use your existing error helper
    }
};

// ✅ Fetch Variety Subpopulations (For Genotype Search Dropdown)
// Note: If general variety info comes from a different service, keep that separate.
// This function is specifically for the subpopulations used in the genotype search filter.
export const fetchVarietySubpopulations = async () => {
    try {
        // Gateway Path: /api/genomic/subpopulations -> Proxied to new Genomic Service
        const response = await API.get("/api/genomic/subpopulations");
        return response.data;
    } catch (error) {
        console.error("Error fetching variety subpopulations:", error);
        throw formatErrorForThrowing(error); // Use your existing error helper
    }
};

export const fetchChromosomes = async () => {
    try {
        // Path remains: /api/genetic-features/chromosomes -> Proxied to Genetic Features Service
        const response = await API.get("/api/genomic/chromosomes");
        return response.data;
    } catch (error) {
        console.error("Error fetching chromosomes:", error);
        throw formatErrorForThrowing(error);
    }
};

export const searchGenotypes = async (searchCriteria) => {
    try {
        // Calls the backend endpoint responsible for the complex genotype search
        // Assumes Gateway proxies /api/genomic/search -> Genomic Service /genomic/search
        // We use POST because the criteria object might be large/complex
        console.log("API: Sending genotype search criteria:", searchCriteria);
        const response = await API.post("/api/genomic/search", searchCriteria);
        console.log("API: Received genotype search results:", response.data);
        return response.data; // Expecting data structured for the table display
    } catch (error) {
        console.error("Error searching genotypes:", error);
        throw formatErrorForThrowing(error); // Rethrow for component handling
    }
};

// ✅ Fetch Chromosome Range (NEW FUNCTION)
export const fetchChromosomeRange = async (contig, referenceGenome) => {
    if (!contig || !referenceGenome) {
        // Don't make the call if params are missing
        console.warn("fetchChromosomeRange: Missing contig or referenceGenome");
        return null; // Or throw error? Returning null might be easier for useEffect
    }
    try {
        // Calls GET /api/genomic/chromosome-range?contig=...&referenceGenome=...
        // Assumes gateway proxies /api/genomic/* to Genomic service
        console.log(`API: Fetching range for chr=${contig}, ref=${referenceGenome}`);
        const response = await API.get("/api/genomic/chromosome-range", {
            params: { contig, referenceGenome } // Send as query parameters
        });
        console.log("API: Received chromosome range:", response.data);
        return response.data; // Expects { minPosition: number, maxPosition: number }
    } catch (error) {
        console.error(`Error fetching chromosome range for ${contig}:`, error);
        // Don't rethrow here, let the component handle null/error state
        // throw formatErrorForThrowing(error);
        return null; // Return null on error to clear range in component
    }
};


// --- API Functions for routes WITHOUT /api prefix ---

// ✅ Fetch Tables Data
export const fetchTablesData = async (params = {}) => {
    try {
        // Gateway path: /tables
        const response = await API.get("/tables", { params });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
}

// ✅ Fetch Varieties Data
export const fetchVarietiesData = async (params = {}) => {
    try {
        // Gateway path: /varieties
        const response = await API.get("/varieties", { params });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
}

// ✅ Fetch Phenotypes Data
export const fetchPhenotypesData = async (params = {}) => {
    try {
        // Gateway path: /phenotypes
        const response = await API.get("/phenotypes", { params });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
}