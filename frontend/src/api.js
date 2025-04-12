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
        const response = await API.post("/auth/register", userData);
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
    const response = await API.post("/auth/login", { identifier, password });

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
        const response = await API.get("/auth/profile");
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
}

// ✅ Logout Helper
export const logoutUser = async () => {
    try {
        await API.post("/auth/logout"); // Optional: Call logout endpoint if your API has one
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
        const response = await API.get("/genetic-features/traits");
        return response.data;
    } catch (error) {
         throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Reference Genomes
export const fetchReferenceGenomes = async () => {
    try {
        // Gateway path: /api/genetic-features/reference-genomes
        const response = await API.get("/genetic-features/reference-genomes");
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
    }
};

// ✅ Fetch Features by Gene Name
export const fetchFeaturesByGeneName = async (geneName, referenceGenome, searchType) => {
    try {
        // Gateway path: /api/genetic-features/by-gene-name
        const response = await API.get("/genetic-features/by-gene-name", {
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
        const response = await API.get("/genetic-features/by-trait", {
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
        const response = await API.get("/genetic-features/details", {
            params: { geneName, referenceGenome }
        });
        return response.data;
    } catch (error) {
        throw formatErrorForThrowing(error);
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