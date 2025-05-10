import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Ensure these imports are correct based on your api.js file
// We are assuming your API functions handle reading/writing token to localStorage
// and that your API client (e.g., Axios) has an interceptor that reads localStorage.
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile } from '../api';

const AuthContext = createContext(null);

// !!! IMPORTANT !!!
// Replace with your actual Drupal site origin for security.
// This must match the protocol, domain, and port of the Drupal site embedding your app.
// Example: 'https://yourdrupaldomain.com' or 'http://localhost:8080'
const DRUPAL_ORIGIN = 'http://localhost:8080'; // Replace with your actual Drupal origin

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Initialize token state from localStorage on initial load.
    // This state reflects what's *currently known* in the component;
    // the API might read directly from localStorage via interceptor.
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    // Initial isAuthenticated guess based on presence of token in storage - will be refined by useEffect
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    // Add loading state, true initially while we check auth status (storage or message)
    const [isLoading, setIsLoading] = useState(true);

    // --- Use useCallback for logout for stability ---
    // This function clears authentication state both locally and via API call (e.g., clearing cookies/localStorage).
    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser(); // Call API function (should clear token server-side and from localStorage)
        // Ensure localStorage is cleared here explicitly if apiLogoutUser doesn't guarantee it
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null); // Clear token state
        setIsAuthenticated(false);
        setIsLoading(false); // Ensure loading is false after logout
    }, []); // No dependencies needed for logout

    // --- Function to handle authentication with a given token ---
    // This is the core logic for validating a token and setting authenticated state.
    // Called by initial storage check, iframe message listener, and internal login.
    const authenticateWithToken = useCallback(async (authToken, source = 'storage') => {
        console.log(`Attempting authentication with token from ${source}...`);
        setIsLoading(true); // Start loading while authenticating

        try {
            // Store the token in localStorage - ASSUMING YOUR API INTERCEPTOR READS THIS.
            // This makes the token available for your API client for subsequent requests.
            localStorage.setItem('authToken', authToken);
            // Update the component's state to reflect the current token
            setToken(authToken); // This state update makes 'token' available via useAuth

            // Attempt to fetch profile using the token.
            // Your API client's interceptor should automatically read from localStorage here.
            const profileData = await fetchUserProfile();

            if (profileData) {
                setUser(profileData);
                setIsAuthenticated(true);
                console.log(`Authentication successful from ${source}. User:`, profileData);
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
            logout(); // Ensure state cleanup (clears localStorage, state)
            return false; // Indicate failure
        } finally {
             setIsLoading(false); // Always set loading to false after attempt finishes (success or failure)
        }
    }, [logout, setToken, setUser, setIsAuthenticated]); // Dependencies for useCallback

    // --- Effect for initial load (storage check) and setting up message listener ---
    useEffect(() => {
        console.log("AuthContext Mount Effect: Initializing auth checks...");
        // Start loading initially. This will be set to false once the initial check/wait is done.
        setIsLoading(true);

        // --- Message Listener Setup ---
        // This function handles messages received from the parent window (Drupal).
        const handleMessage = async (event) => {
            console.log("AuthContext Message Listener: Message received.", event);

            // *** SECURITY CHECK ***
            // Verify the origin of the message to prevent cross-site scripting attacks.
            // Only process messages from your trusted Drupal domain.
            if (event.origin !== DRUPAL_ORIGIN) {
                console.warn("AuthContext Message Listener: Message origin mismatch.", event.origin, "Expected:", DRUPAL_ORIGIN);
                return; // Ignore messages from unexpected origins
            }

            let messageData;
            try {
                // Assuming Drupal sends a JSON string as event.data
                messageData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
                 console.log("AuthContext Message Listener: Parsed data:", messageData);

            } catch (e) {
                console.error("AuthContext Message Listener: Failed to parse message data as JSON.", event.data, e);
                return; // Ignore invalid data that isn't valid JSON
            }

            // *** Validate Message Structure ***
            // Check if the message has the expected authentication structure:
            // Assuming structure is { type: 'auth_token', payload: { drupalToken: '...', email: '...' } }
            // Adjust 'type', 'payload', 'drupalToken', and 'email' keys based on what Drupal *actually* sends.
            if (messageData && messageData.type === 'auth_token' && messageData.payload && messageData.payload.drupalToken && messageData.payload.email) {

                // Correctly extract drupalToken and email from the payload
                const { drupalToken, email } = messageData.payload;

                console.log("AuthContext Message Listener: Received valid auth data from Drupal.", { drupalToken, email });

                // Process the received token using the centralized function
                // This will store the token in localStorage, update state, fetch profile, handle errors, and set isLoading(false).
                await authenticateWithToken(drupalToken, 'message');

            } else {
                console.log("AuthContext Message Listener: Message does not contain expected 'auth_token' type, payload, or required keys (drupalToken, email). Ignoring message.");
                // Optionally handle other valid message types here if needed
            }
        };

        // Add event listener for messages from the parent window.
        // This listener is active as soon as the component mounts.
        window.addEventListener('message', handleMessage);
        console.log("AuthContext Mount Effect: Message listener added.");


        // --- Initial Storage Check ---
        // This runs immediately after setting up the message listener.
        // It handles cases where the user has a token from a previous session (direct access or refresh).
        const storedToken = localStorage.getItem('authToken');

        if (storedToken) {
            console.log("AuthContext Mount Effect: Token found in storage, attempting auth...");
            // Attempt to authenticate with the stored token.
            // authenticateWithToken handles setting isLoading(false) when done.
            // No need to set localStorage again if it's from storage, but calling authenticateWithToken
            // ensures the profile is fetched and state is correctly set up.
            authenticateWithToken(storedToken, 'storage');
        } else {
             console.log("AuthContext Mount Effect: No token found in storage. Leaving unauthenticated state. Waiting for potential iframe message...");
             // If no stored token, we are initially unauthenticated.
             // Set isLoading to false for the *initial* check completion.
             // The app renders unauthenticated, but the message listener is active.
             // If a message arrives, authenticateWithToken will temporarily set isLoading back to true.
             setIsLoading(false);
        }

        // --- Cleanup ---
        // Remove the event listener when the component unmounts to prevent memory leaks.
        return () => {
            console.log("AuthContext Cleanup: Removing message listener.");
            window.removeEventListener('message', handleMessage);
        };

    }, [authenticateWithToken]); // Dependency: authenticateWithToken is a stable callback function reference

    // --- Original login function (for internal forms) ---
    // This function remains for cases where the user logs in directly within the React app (not via iframe message).
    const login = async (credentials) => {
        console.log("AuthContext: Attempting login (internal)...");
        setIsLoading(true); // Indicate that a login process is in progress
        try {
            // Call your API login function (e.g., sending username/password)
            // Assuming apiLoginUser successfully logs in and returns { token, user } or similar
            const data = await apiLoginUser(credentials);

            // Use the authenticateWithToken function to process the received token.
            // This ensures the token is stored in localStorage, state is updated,
            // profile is fetched, and isLoading is managed consistently.
            // We pass the token received from the internal login API call.
            await authenticateWithToken(data.token, 'internal_login');

            // authenticateWithToken sets isLoading(false) on completion
            return data; // Return login response data if needed by calling component
        } catch (error) {
            console.error("AuthContext: Internal login failed.", error);
            // Ensure cleanup on failed login attempt
            logout(); // Clears state and localStorage
            throw error; // Re-throw error for calling components to handle (e.g., display error message)
        } finally {
            // authenticateWithToken handles setting isLoading(false) now
            // No need to set it here directly anymore
        }
    };

    // Log provider value changes for debugging purposes
    console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user, token: token ? '***' : null }); // Log token presence, not value

    return (
        // Provide the authentication state and functions to the rest of the application via context.
        // Include isLoading so components can show loading indicators.
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
            {/* Render children components wrapped by the provider */}
            {children}
        </AuthContext.Provider>
    );
};

// --- Custom hook to easily consume the AuthContext ---
// This hook makes it easy for any component within the AuthProvider's tree
// to access the authentication state and functions.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
       // This error helps developers know if they've used the hook outside the provider
       throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};