import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Ensure these imports are correct based on your api.js file
// We are assuming your API functions handle reading/writing token to localStorage
// and that your API client (e.g., Axios) has an interceptor that reads localStorage.
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile } from '../api';

const AuthContext = createContext(null);

// !!! IMPORTANT !!!
// This must match the EXACT origin sent by Drupal in postMessage.
// You showed 'https://snpseek-mern.vercel.app/' in the postMessage call,
// but ensure this matches the actual origin of the Drupal site if different.
const DRUPAL_ORIGIN = 'http://localhost:8080'; // e.g., 'https://yourdrupaldomain.com'

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Initialize token state from localStorage on initial load.
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    // Initial isAuthenticated guess based on presence of token in storage - refined by useEffect
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    // Add loading state, true initially while we check auth status (storage or message)
    const [isLoading, setIsLoading] = useState(true);

    // --- Use useCallback for logout for stability ---
    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser(); // Call API function (should clear token server-side and from localStorage)
        localStorage.removeItem('authToken'); // Explicitly ensure localStorage is cleared
        setUser(null);
        setToken(null); // Clear token state
        setIsAuthenticated(false);
        setIsLoading(false); // Ensure loading is false after logout
    }, []);

    // --- Function to handle authentication with a given token ---
    const authenticateWithToken = useCallback(async (authToken, source = 'storage') => {
        console.log(`Attempting authentication with token from ${source}...`);
        setIsLoading(true);

        try {
            // Store the token in localStorage - ASSUMING YOUR API INTERCEPTOR READS THIS.
            localStorage.setItem('authToken', authToken);
            setToken(authToken); // Update component state

            // Attempt to fetch profile - API interceptor should read from localStorage
            const profileData = await fetchUserProfile();

            if (profileData) {
                setUser(profileData);
                setIsAuthenticated(true);
                console.log(`Authentication successful from ${source}. User:`, profileData);
                return true;
            } else {
                 console.warn(`authenticateWithToken from ${source}: fetchUserProfile returned no data.`);
                 logout();
                 return false;
            }
        } catch (error) {
            console.error(`Authentication failed from ${source}.`, error);
            logout();
            return false;
        } finally {
             setIsLoading(false); // Always set loading to false after attempt finishes
        }
    }, [logout, setToken, setUser, setIsAuthenticated]);

    // --- Effect for initial load (storage check) and setting up message listener ---
    useEffect(() => {
        console.log("AuthContext Mount Effect: Initializing auth checks...");
        setIsLoading(true);

        // --- Message Listener Setup ---
        const handleMessage = async (event) => {
            console.log("AuthContext Message Listener: Message received.", event);

            // *** SECURITY CHECK ***
            // Verify the origin. Use the *targetOrigin* specified in Drupal's postMessage call.
            // This is the origin of the iframe (your React app).
            // If Drupal is sending the message TO 'https://snpseek-mern.vercel.app/',
            // then the *origin of the message itself* will be Drupal's origin.
            // So the check `event.origin !== DRUPAL_ORIGIN` is correct, where DRUPAL_ORIGIN is Drupal's domain.
            if (event.origin !== DRUPAL_ORIGIN) {
                console.warn("AuthContext Message Listener: Message origin mismatch.", event.origin, "Expected:", DRUPAL_ORIGIN);
                return; // Ignore messages from unexpected origins
            }

            let messageData;
            // Check if event.data is likely a JSON string or an object
            if (typeof event.data === 'string') {
                 try {
                     messageData = JSON.parse(event.data);
                      console.log("AuthContext Message Listener: Parsed data (string):", messageData);
                 } catch (e) {
                      console.warn("AuthContext Message Listener: Failed to parse message data string as JSON.", event.data, e);
                      // If it's just a string token being sent directly? Unlikely but possible.
                      // If (typeof event.data === 'string' && event.data.length > 50) { // Basic token heuristic
                      //     messageData = { token: event.data };
                      // } else {
                          return; // Ignore unparseable strings or short strings
                      // }
                 }
            } else if (typeof event.data === 'object' && event.data !== null) {
                 messageData = event.data;
                 console.log("AuthContext Message Listener: Received data (object):", messageData);
            } else {
                 console.warn("AuthContext Message Listener: Received message data is not a string or object.", event.data);
                 return; // Ignore data that isn't a string or object
            }


            // *** Validate Message Structure (Matching Drupal's Code) ***
            // Drupal sends: { token: data.token }
            // We check if messageData is an object and has a 'token' property with a value.
            if (messageData && messageData.token) {
                 // Extract the token directly from the message data
                const drupalToken = messageData.token; // Using drupalToken variable name for clarity

                console.log("AuthContext Message Listener: Received valid auth token from Drupal."); // Don't log token value directly

                // Process the received token using the centralized function
                await authenticateWithToken(drupalToken, 'message');

            } else {
                console.log("AuthContext Message Listener: Message does not contain expected 'token' key.");
                // Optionally handle other valid message types here if needed
            }
        };

        window.addEventListener('message', handleMessage);
        console.log("AuthContext Mount Effect: Message listener added.");

        // --- Initial Storage Check ---
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            console.log("AuthContext Mount Effect: Token found in storage, attempting auth...");
            authenticateWithToken(storedToken, 'storage');
        } else {
             console.log("AuthContext Mount Effect: No token found in storage. Leaving unauthenticated state. Waiting for potential iframe message...");
             setIsLoading(false);
        }

        return () => {
            console.log("AuthContext Cleanup: Removing message listener.");
            window.removeEventListener('message', handleMessage);
        };

    }, [authenticateWithToken]);

    // --- Original login function (for internal forms) ---
    const login = async (credentials) => {
        console.log("AuthContext: Attempting login (internal)...");
        setIsLoading(true);
        try {
            const data = await apiLoginUser(credentials);
            await authenticateWithToken(data.token, 'internal_login');
            return data;
        } catch (error) {
            console.error("AuthContext: Internal login failed.", error);
            logout();
            throw error;
        } finally {
            // authenticateWithToken handles setting isLoading(false)
        }
    };

    console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user, token: token ? '***' : null });

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom hook ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
       throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};