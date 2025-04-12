import React, { createContext, useState, useEffect, useContext, useCallback } from 'react'; // Added useCallback
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile } from '../api'; // Import your API functions

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null); // Start with null, let useEffect handle initial load
    const [isAuthenticated, setIsAuthenticated] = useState(false); // Start as false
    const [isLoading, setIsLoading] = useState(true); // Add loading state for initial check

    // Use useCallback for logout to stabilize its reference if passed in dependency arrays
    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser(); // Call API function (removes token from localStorage)
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
    }, []); // No dependencies needed for logout

    // Effect to validate token and fetch user data on initial mount
    useEffect(() => {
        const validateTokenAndFetchUser = async () => {
            console.log("AuthContext Mount Effect: Checking auth status...");
            setIsLoading(true); // Start loading
            const storedToken = localStorage.getItem('authToken');

            if (storedToken) {
                console.log("AuthContext Mount Effect: Token found in storage.");
                setToken(storedToken); // Set token state early (interceptor needs this)
                // Attempt to fetch profile to validate token and get user data
                try {
                    // fetchUserProfile uses the token via interceptor set above
                    const profileData = await fetchUserProfile();
                    if (profileData) {
                        setUser(profileData);
                        setIsAuthenticated(true);
                        console.log("AuthContext Mount Effect: Profile fetched successfully, user authenticated.", profileData);
                    } else {
                         // Should not happen if API returns data or error, but handle defensively
                         console.warn("AuthContext Mount Effect: fetchUserProfile returned unexpected data.");
                         logout(); // Log out if profile fetch is weird
                    }
                } catch (error) {
                    console.error("AuthContext Mount Effect: Invalid token or failed profile fetch.", error);
                    // If token is invalid/expired, fetchUserProfile should fail (e.g., 401)
                    // The interceptor might clear the token, but we ensure state cleanup here.
                    logout(); // Use logout function to clear everything
                }
            } else {
                console.log("AuthContext Mount Effect: No token found in storage.");
                // Ensure logged-out state if no token
                logout(); // Make sure state is clean
            }
            setIsLoading(false); // Done loading initial auth check
        };

        validateTokenAndFetchUser();
        // Run only once on component mount
    }, [logout]); // Include stable logout function reference

    // Login function remains largely the same
     const login = async (credentials) => {
         console.log("AuthContext: Attempting login...");
         try {
             const data = await apiLoginUser(credentials); // api.js handles token storage
             setToken(data.token);
             setUser(data.user);
             setIsAuthenticated(true);
             console.log("AuthContext: Login successful, state updated.", data.user);
             return data;
         } catch (error) {
              console.error("AuthContext: Login failed.", error);
              logout(); // Ensure cleanup on failed login
             throw error;
         }
     };

    // Log provider value changes for debugging
     console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user });

    return (
        // Include isLoading in the context if you want to show loading indicators elsewhere
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook (remains the same)
export const useAuth = () => {
    return useContext(AuthContext);
};