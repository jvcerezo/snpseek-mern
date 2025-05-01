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

// // ✅ Fetch Features by Gene Name
// export const fetchFeaturesByGeneName = async (geneName, referenceGenome, searchType) => {
//     try {
//         // Gateway path: /api/genetic-features/by-gene-name
//         const response = await API.get("/api/genetic-features/by-gene-name", {
//             params: { geneName, referenceGenome, searchType }
//         });
//         return response.data;
//     } catch (error) {
//         throw formatErrorForThrowing(error);
//     }
// };

export const searchFeaturesByText = async (queryTerm, referenceGenome, searchMethod, searchField = 'geneName') => {
    try {
        // Calls the updated backend route
        const response = await API.get("/api/genetic-features/by-text-search", {
            params: { // Send all parameters
                queryTerm,
                referenceGenome,
                searchMethod, // 'substring', 'whole-word', etc.
                searchField   // 'annotation' or 'geneName'
             }
        });
        return response.data;
    } catch (error) {
        console.error(`Error searching features by ${searchField}:`, error);
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

/**
 * @desc Fetch gene features within a specific genomic region
 * @param {string} referenceGenome - The selected reference genome name
 * @param {string} chromosome - The selected chromosome/contig name (optional)
 * @param {string|number} start - The start position (required)
 * @param {string|number} end - The end position (required)
 * @returns {Promise<Array>} - Promise resolving to an array of feature objects
 */
export const fetchFeaturesByRegion = async (referenceGenome, chromosome, start, end) => {
    // Basic validation on frontend
    if (!referenceGenome || start === '' || start === null || end === '' || end === null ) {
         console.error("API fetchFeaturesByRegion: Missing required parameters", {referenceGenome, start, end});
         throw new Error("Reference Genome, Start position, and End position are required for region search.");
    }
    try {
        // Calls GET /api/genetic-features/by-region?referenceGenome=...&chromosome=...&start=...&end=...
        console.log(`API: Fetching features for region: ${referenceGenome}, ${chromosome || 'any chr'}, ${start}-${end}`);
        const response = await API.get("/api/genetic-features/by-region", { // Assuming endpoint under genetic-features
            params: { // Send parameters as query string
                referenceGenome,
                // Send chromosome only if it has a value (not empty string)
                chromosome: chromosome || undefined,
                start,
                end
             }
        });
        console.log("API: Received features by region:", response.data);
        return response.data || []; // Ensure array is returned
    } catch (error) {
        console.error("Error fetching features by region:", error);
        throw formatErrorForThrowing(error); // Use your error helper
    }
};

/**
 * Fetches the CONSOLIDATED min/max position range across ALL chromosomes for a reference genome.
 */
export const fetchConsolidatedChromosomeRange = async (referenceGenome) => {
    // This function correctly checks only for referenceGenome
    if (!referenceGenome) {
       console.warn("API (fetchConsolidatedChromosomeRange): Missing referenceGenome parameter."); // Corrected Message
       return { minPosition: null, maxPosition: null };
   }
   // If referenceGenome IS provided, this log should now execute correctly:
   console.log(`API: Fetching consolidated range for Genome: ${referenceGenome}`);
    try {
       const response = await API.get('/api/genomic/consolidated-range', {
           params: { referenceGenome } // Correctly passes only referenceGenome
       });
       console.log(`API: Received consolidated range for ${referenceGenome}:`, response.data);
       return {
           minPosition: response.data?.minPosition ?? null,
           maxPosition: response.data?.maxPosition ?? null
       };
   } catch (error) {
       console.error(`API Error fetching consolidated chromosome range for ${referenceGenome}:`, error.response?.data || error.message);
       return { minPosition: null, maxPosition: null };
   }
};

/**
 * Fetches all lists belonging to the authenticated user.
 * Assumes authentication token is handled by the apiClient setup (e.g., interceptors).
 * @returns {Promise<Array<object>>} A promise resolving to an array of user list objects.
 */
export const fetchUserLists = async () => {
    console.log("API: Fetching user lists from /lists/mine");
    try {
        // Make GET request to the specific route for user's lists
        const response = await API.get('/api/lists/mine');
        console.log("API: Received user lists data:", response.data);
        return response.data; // The backend should return the array of lists
    } catch (error) {
        console.error("API Error fetching user lists:", error.response?.data || error.message);
        // Re-throw the error so the component's catch block can handle it
        throw error;
    }
};

export const createListAPI = async (listData) => {
    console.log("API: Calling POST /lists with data:", listData);
    try {
        const response = await API.post('/api/lists/create-list', listData); // POST to base /lists route
        console.log("API: Received created list data:", response.data);
        return response.data;
    } catch (error) {
        console.error("API Error creating list:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * Searches for Varieties based on a query string and optional varietySet.
 * Assumes a backend endpoint exists at /api/genomic/varieties/search (proxied).
 * @param {string} query - The search term entered by the user.
 * @param {string} [varietySet] - Optional variety set context.
 * @returns {Promise<Array<object>>} Promise resolving to an array of variety objects (e.g., [{ _id: '...', name: '...' }]).
 */
export const searchVarietiesAPI = async (query, varietySet) => {
    if (!query || query.trim().length < 2) { // Don't search on empty or very short strings
        return [];
    }
    try {
        console.log(`API: Searching Varieties - q: ${query}, varietySet: ${varietySet}`);
        // Assumes GET /api/genomic/varieties/search?q=...&varietySet=...
        const response = await API.get("/api/genomic/varieties/search", {
            params: {
                q: query,
                // Only send varietySet if it has a value
                ...(varietySet && { varietySet: varietySet })
            }
        });
        // Ensure response.data is an array
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("API Error searching varieties:", error.response?.data || error.message);
        return []; // Return empty array on error for autocomplete
    }
};

/**
 * Searches for distinct Contig names from VarietiesPos collection.
 * Calls the backend endpoint at /api/genomic/contigs/search (proxied).
 * @param {string} query - The search term entered by the user.
 * @param {string} [snpSet] - Optional SNP set context (if backend supports it).
 * @returns {Promise<Array<string>>} Promise resolving to an array of matching contig strings.
 */
export const searchContigsAPI = async (query, snpSet) => { // Renamed function
    if (!query || query.trim().length < 1) { // Allow 1 char search
        return [];
    }
    try {
        console.log(`API: Searching Contigs - q: ${query}, snpSet: ${snpSet}`);
        // Call the NEW backend route via the gateway
        const response = await API.get("/api/genomic/contigs/search", {
             params: {
                 q: query,
                 ...(snpSet && { snpSet: snpSet }) // Only send if snpSet has value
             }
         });
         // Expecting an array of strings from the backend's distinct query
         return Array.isArray(response.data) ? response.data : [];

    } catch (error) {
        console.error("API Error searching contigs:", error.response?.data || error.message);
        return []; // Return empty array on error
    }
};

/**
 * Searches for Loci (Features) specifically for autocomplete suggestions.
 * @param {string} queryTerm - The search string.
 * @param {string} referenceGenome - The selected reference genome.
 * @returns {Promise<Array<object>>} Promise resolving to an array like [{ _id: '...', geneName: '...' }]
 */
export const autocompleteLocusAPI = async (queryTerm, referenceGenome) => {
    // Handle empty query for default options trigger from react-select
    const query = queryTerm || "";

    // Reference genome is required by the backend for this specific endpoint
    if (!referenceGenome) {
        console.warn("autocompleteLocusAPI: referenceGenome parameter is required.");
        return []; // Return empty array if required context is missing
    }
     // Don't search on very short strings UNLESS it's the default empty query
     if (query && query.trim().length < 2) {
        return [];
    }

    try {
        console.log(`API: Autocompleting Loci - q: ${query}, ref: ${referenceGenome}`);
        // Call the NEW backend route via the gateway
        const response = await API.get("/api/genetic-features/autocomplete", {
            params: {
                queryTerm: query, // Use 'queryTerm' as expected by controller
                referenceGenome
            }
        });
        // Expecting array like [{ _id: '...', geneName: '...' }]
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("API Error during locus autocomplete:", error.response?.data || error.message);
        return []; // Return empty array on error
    }
};

/**
 * Resolves multiple item IDs (variety, locus) to their display names
 * by calling the backend batch endpoint IN THE LIST SERVICE.
 * @param {object} idsByType - Object like { varietyIds: string[], locusIds: string[] }.
 * @returns {Promise<object>} A promise resolving to an object mapping ID to Name: { "id1": "Name1", ... }
 */
export const resolveItemIdsAPI = async (idsByType) => {
    // Prepare payload, ensuring arrays exist
    const payload = {
        varietyIds: idsByType.varietyIds || [],
        locusIds: idsByType.locusIds || [],
        // snpIds: [], // Excluded as we display contig names directly
    };

    // Don't make an unnecessary call if there are no IDs to resolve
    if (payload.varietyIds.length === 0 && payload.locusIds.length === 0) {
        console.log("API (resolveItemIdsAPI): No variety or locus IDs provided for resolution.");
        return {}; // Return empty map immediately
    }

    // --- Ensure this path matches your Gateway route to the List Service's resolveIds endpoint ---
    const apiUrl = '/api/lists/resolve-ids';
    // --- ----------------------------------------------------------------------------------- ---

    console.log(`API: Calling POST ${apiUrl} with payload:`, payload);
    try {
        const response = await API.post(apiUrl, payload);
        console.log("API: Received resolved names data:", response.data);

        // Expecting backend to return { resolved: { id: name, ... } }
        if (response.data && typeof response.data.resolved === 'object') {
            return response.data.resolved; // Return the map
        } else {
            console.warn("API (resolveItemIdsAPI): Received unexpected response format.", response.data);
            return {}; // Return empty map on unexpected format
        }
    } catch (error) {
        console.error("API Error resolving item IDs:", error.response?.data || error.message);
        // Don't throw here for name resolution; component will show IDs for failed items.
        return {}; // Return empty map on error
    }
};

export default API;