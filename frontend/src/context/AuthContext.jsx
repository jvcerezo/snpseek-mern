import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Make sure to import exchangeDrupalToken
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile, exchangeDrupalToken } from '../api';

const AuthContext = createContext(null);

const DRUPAL_ORIGIN = 'http://localhost:8080'; // Keep this for origin checks

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);
    const [drupalToken, setDrupalToken] = useState(null);
    const [isInitialDrupalLoad, setIsInitialDrupalLoad] = useState(false); // New state

    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser().catch(err => console.warn("AuthContext: apiLogoutUser failed during logout, proceeding.", err)); // Call API function
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setDrupalToken(null);
        setIsInitialDrupalLoad(false); // Reset on logout? Consider the desired behavior
    }, []);

    const authenticateWithToken = useCallback(async (appToken, source = 'storage', preloadedUser = null) => {
        console.log(`Attempting authentication with APP token from ${source}...`);
        setIsLoading(true);

        try {
            localStorage.setItem('authToken', appToken);
            setToken(appToken); // Update component state with the APP token

            let profileData = preloadedUser;

            if (!profileData) { // If no user data was preloaded (e.g., from SSO exchange), fetch it
                console.log(`authenticateWithToken from ${source}: Fetching user profile...`);
                profileData = await fetchUserProfile(); // Assumes fetchUserProfile uses the token from localStorage or context
            }

            if (profileData) {
                setUser(profileData);
                setIsAuthenticated(true);
                console.log(`Authentication successful from ${source}. User:`, profileData);
                return true;
            } else {
                console.warn(`authenticateWithToken from ${source}: No profile data available (either preloaded or fetched).`);
                logout(); // If profile can't be fetched or isn't provided, treat as failure
                return false;
            }
        } catch (error) {
            console.error(`Authentication failed from ${source}.`, error);
            logout();
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [logout]);


    useEffect(() => {
        console.log("AuthContext Mount Effect: Initializing auth checks and iframe detection...");
        setIsLoading(true);

        let initialDrupal = false;
        try {
            if (window.self !== window.top && document.referrer.startsWith('http://localhost:8080')) {
                initialDrupal = true;
                setIsInitialDrupalLoad(true); // Set the initial state
                console.log("AuthContext: Detected initial load within an iframe from localhost:8080.");
            } else {
                setIsInitialDrupalLoad(false);
                console.log("AuthContext: Not initial Drupal iframe load.");
            }
        } catch (e) {
            console.warn("AuthContext: Error detecting initial iframe environment.", e);
            setIsInitialDrupalLoad(false); // Default to false in case of error
        }

        const handleMessage = async (event) => {
            console.log("AuthContext Message Listener: Message received.", event);
            if (event.origin !== DRUPAL_ORIGIN) {
                console.warn("AuthContext Message Listener: Message origin mismatch.", event.origin, "Expected:", DRUPAL_ORIGIN);
                return;
            }

            let messageData;
            if (typeof event.data === 'string') {
                try {
                    messageData = JSON.parse(event.data);
                    console.log("AuthContext Message Listener: Parsed data (string):", messageData);
                } catch (e) {
                    console.warn("AuthContext Message Listener: Failed to parse message data string as JSON.", event.data, e);
                    return;
                }
            } else if (typeof event.data === 'object' && event.data !== null) {
                messageData = event.data;
                console.log("AuthContext Message Listener: Received data (object):", messageData);
            } else {
                console.warn("AuthContext Message Listener: Received message data is not a string or object.", event.data);
                return;
            }

            if (messageData && messageData.token) {
                const receivedDrupalToken = messageData.token;
                console.log("AuthContext Message Listener: Received Drupal token. Attempting exchange...");
                setDrupalToken(receivedDrupalToken);
                setIsLoading(true);

                try {
                    const { token: appToken, user: ssoUser } = await exchangeDrupalToken(receivedDrupalToken);

                    if (appToken && ssoUser) {
                        console.log("AuthContext Message Listener: Drupal token exchange successful. Received app token and user data.");
                        localStorage.setItem('authToken', appToken);
                        setToken(appToken);
                        setUser(ssoUser);
                        setIsAuthenticated(true);
                        console.log("AuthContext: User authenticated via Drupal SSO. User:", ssoUser);
                        setDrupalToken(null);
                        setIsInitialDrupalLoad(false); // Clear the initial flag after successful exchange
                    } else {
                        console.warn("AuthContext Message Listener: Drupal token exchange did not return app token or user data.");
                        logout();
                        setDrupalToken(null);
                        setIsInitialDrupalLoad(false); // Clear the initial flag on failure
                    }
                } catch (error) {
                    console.error("AuthContext Message Listener: Error during Drupal token exchange:", error);
                    logout();
                    setDrupalToken(null);
                    setIsInitialDrupalLoad(false); // Clear the initial flag on error
                } finally {
                    setIsLoading(false);
                }

            } else {
                console.log("AuthContext Message Listener: Message does not contain expected 'token' key.");
                setDrupalToken(null);
                setIsInitialDrupalLoad(false); // Clear the initial flag if no token
            }
        };

        window.addEventListener('message', handleMessage);
        console.log("AuthContext Mount Effect: Message listener added.");

        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            console.log("AuthContext Mount Effect: App token found in storage, attempting auth...");
            authenticateWithToken(storedToken, 'storage_init');
        } else if (!initialDrupal) {
            // Only set loading to false if it's not an initial Drupal load
            setIsLoading(false);
        }

        return () => {
            console.log("AuthContext Cleanup: Removing message listener.");
            window.removeEventListener('message', handleMessage);
        };
    }, [authenticateWithToken, logout]);

    console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user, token: token ? '***' : null, drupalToken, isInitialDrupalLoad });

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout, drupalToken, isInitialDrupalLoad }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};