import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Removed setAuthToken import
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile } from '../api';

const AuthContext = createContext(null);

// Replace with your actual Drupal site origin for security
// This must match the protocol, domain, and port of the Drupal site embedding your app
const DRUPAL_ORIGIN = 'http://localhost:8080'; // e.g., 'https://yourdrupaldomain.com'

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Initialize token state from localStorage on initial load - this is safe
    // as the useEffect will validate it or wait for a message if null.
    // This state is mostly for the AuthProvider's internal logic and components
    // consuming the context; the API might read directly from localStorage.
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    // Initial isAuthenticated guess based on presence of token in storage - will be refined by useEffect
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    // Add loading state, true initially while we check auth status (storage or message)
    const [isLoading, setIsLoading] = useState(true);

    // --- Use useCallback for logout for stability ---
    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser(); // Call API function (should clear token from localStorage and client)
        // Ensure localStorage is cleared here explicitly if apiLogoutUser doesn't guarantee it
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null); // Clear token state
        setIsAuthenticated(false);
        setIsLoading(false); // Ensure loading is false after logout
    }, []); // No dependencies needed for logout

    // --- New function to handle authentication with a given token ---
    // This function will be called by both the initial storage check and the message listener
    const authenticateWithToken = useCallback(async (authToken, source = 'storage') => {
        console.log(`Attempting authentication with token from ${source}...`);
        setIsLoading(true); // Start loading while authenticating

        try {
            // Store the token in localStorage - this is what your API interceptor reads
            localStorage.setItem('authToken', authToken);
            // Update the component's state
            setToken(authToken);

            // Attempt to fetch profile using the token (API interceptor reads from localStorage)
            const profileData = await fetchUserProfile();

            if (profileData) {
                setUser(profileData);
                setIsAuthenticated(true);
                console.log(`Authentication successful from ${source}.`, profileData);
                // setIsLoading(false); // Set in finally block
                return true; // Indicate success
            } else {
                 console.warn(`authenticateWithToken from ${source}: fetchUserProfile returned no data.`);
                 // If fetchUserProfile returns no data but doesn't throw, treat as auth failure
                 logout(); // Clean up state
                 return false; // Indicate failure
            }
        } catch (error) {
            console.error(`Authentication failed from ${source}.`, error);
            // Assuming API interceptor handles clearing token on 401 errors,
            // but we ensure state cleanup here too.
            logout(); // Ensure state cleanup
            return false; // Indicate failure
        } finally {
             setIsLoading(false); // Always set loading to false after attempt finishes
        }
    }, [logout, setToken, setUser, setIsAuthenticated]); // authenticateWithToken dependencies

    // --- Effect for initial load (storage check) and setting up message listener ---
    useEffect(() => {
        console.log("AuthContext Mount Effect: Initializing auth checks...");
        setIsLoading(true); // Ensure loading is true initially

        // --- Message Listener Setup ---
        const handleMessage = async (event) => {
            console.log("AuthContext Message Listener: Message received.", event);

            // Security checks: Verify origin
            if (event.origin !== DRUPAL_ORIGIN) {
                console.warn("AuthContext Message Listener: Message origin mismatch.", event.origin, "Expected:", DRUPAL_ORIGIN);
                return; // Ignore messages from unexpected origins
            }

            let messageData;
            try {
                // Assuming Drupal sends a JSON string
                messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                 console.log("AuthContext Message Listener: Parsed data:", messageData);

            } catch (e) {
                console.error("AuthContext Message Listener: Failed to parse message data as JSON.", event.data, e);
                return; // Ignore invalid data
            }

            // Check if the message has the expected authentication structure
            // Adjust 'type', 'payload', 'token', and 'email' keys based on what Drupal sends
            if (messageData && messageData.type === 'auth_token' && messageData.payload && messageData.payload.token && messageData.payload.email) {
                const { token: drupalToken, email } = messageData.payload; // Use payload property as it's common structure

                console.log("AuthContext Message Listener: Received auth data from Drupal.", { drupalToken, email });

                // Process the received token
                // Call authenticateWithToken with the received token from the message
                // This will store the token in localStorage, set state, fetch profile, handle errors, and set isLoading(false)
                await authenticateWithToken(drupalToken, 'message');

            } else {
                console.log("AuthContext Message Listener: Message does not contain expected 'auth_token' type or payload.");
                // Optionally handle other message types or ignore
            }
        };

        // Add event listener for messages from the parent window
        window.addEventListener('message', handleMessage);
        console.log("AuthContext Mount Effect: Message listener added.");


        // --- Initial Storage Check ---
        // This runs immediately on mount to handle direct visits or refreshes.
        // It happens AFTER the message listener is set up.
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            console.log("AuthContext Mount Effect: Token found in storage, attempting auth...");
            // Attempt to authenticate with the stored token.
            // authenticateWithToken handles setting isLoading(false) when done.
            // No need to set localStorage again if it's from storage, but harmless.
            authenticateWithToken(storedToken, 'storage');
        } else {
            console.log("AuthContext Mount Effect: No token found in storage. Waiting for potential iframe message...");
            // If no stored token, we are initially unauthenticated and stop the *initial* loading check.
            // Keep the message listener active. It will handle isLoading if a message arrives.
             setIsLoading(false); // Initial check finished, no token found. Now waiting for message.
        }

        // --- Cleanup ---
        // Remove the event listener when the component unmounts
        return () => {
            console.log("AuthContext Cleanup: Removing message listener.");
            window.removeEventListener('message', handleMessage);
        };

    }, [authenticateWithToken]); // Dependency: authenticateWithToken stable function reference

    // --- Original login function (for internal forms) ---
    // This function remains for cases where the user logs in directly within the React app.
    const login = async (credentials) => {
        console.log("AuthContext: Attempting login (internal)...");
        setIsLoading(true); // Login process is loading
        try {
            // Call your API login function
            // Assuming apiLoginUser successfully logs in and returns { token, user }
            const data = await apiLoginUser(credentials);

            // Use the authenticateWithToken function to process the received token
            // This will store the token in localStorage, set state, fetch profile, etc.
            await authenticateWithToken(data.token, 'login');
            // authenticateWithToken sets isLoading(false) on completion
            return data; // Return login response data if needed
        } catch (error) {
            console.error("AuthContext: Login failed.", error);
            // Ensure cleanup on failed login
            logout();
            throw error; // Re-throw error for calling components to handle (e.g., show error message)
        } finally {
            // authenticateWithToken handles setting isLoading(false) now
        }
    };

    // Log provider value changes for debugging
    console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user });

    return (
        // Provide all relevant states and functions through the context
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
       throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};