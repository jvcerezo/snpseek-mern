import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
// Make sure to import exchangeDrupalToken
import { loginUser as apiLoginUser, logoutUser as apiLogoutUser, fetchUserProfile, exchangeDrupalToken } from '../api';

const AuthContext = createContext(null);

const DRUPAL_ORIGIN = 'http://localhost:8080';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('authToken'));
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);

    const logout = useCallback(() => {
        console.log("AuthContext: Running logout function");
        apiLogoutUser().catch(err => console.warn("AuthContext: apiLogoutUser failed during logout, proceeding.", err)); // Call API function
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
        setIsLoading(false);
    }, []);

    // This function now primarily handles setting auth state AFTER a token (app token) is validated or acquired
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
    }, [logout]); // Removed setToken, setUser, setIsAuthenticated from dependencies as they are part of this function's closure


    // --- Effect for initial load (storage check) and setting up message listener ---
    useEffect(() => {
        console.log("AuthContext Mount Effect: Initializing auth checks...");
        setIsLoading(true);

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
                const drupalToken = messageData.token;
                console.log("AuthContext Message Listener: Received Drupal token. Attempting exchange...");
                setIsLoading(true); // Set loading before async operation

                try {
                    // NEW: Call the API to exchange Drupal token for your app's token and user data
                    const { token: appToken, user: ssoUser } = await exchangeDrupalToken(drupalToken);

                    if (appToken && ssoUser) {
                        console.log("AuthContext Message Listener: Drupal token exchange successful. Received app token and user data.");
                        // Now use the received appToken and ssoUser to authenticate the user in this app
                        // We can directly set the state here as we have both token and user
                        localStorage.setItem('authToken', appToken);
                        setToken(appToken);
                        setUser(ssoUser);
                        setIsAuthenticated(true);
                        console.log("AuthContext: User authenticated via Drupal SSO. User:", ssoUser);
                    } else {
                        console.warn("AuthContext Message Listener: Drupal token exchange did not return app token or user data.");
                        logout(); // Or handle more gracefully
                    }
                } catch (error) {
                    console.error("AuthContext Message Listener: Error during Drupal token exchange:", error);
                    logout(); // Logout if exchange fails
                } finally {
                    setIsLoading(false); // Ensure loading is set to false
                }

            } else {
                console.log("AuthContext Message Listener: Message does not contain expected 'token' key.");
            }
        };

        window.addEventListener('message', handleMessage);
        console.log("AuthContext Mount Effect: Message listener added.");

        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            console.log("AuthContext Mount Effect: App token found in storage, attempting auth...");
            // This will use the stored appToken to fetch the user profile
            authenticateWithToken(storedToken, 'storage_init');
        } else {
            console.log("AuthContext Mount Effect: No app token found in storage. Waiting for potential iframe message...");
            setIsLoading(false);
        }

        return () => {
            console.log("AuthContext Cleanup: Removing message listener.");
            window.removeEventListener('message', handleMessage);
        };
    }, [authenticateWithToken, logout]); // Added logout to dependency array

    const login = async (credentials) => {
        console.log("AuthContext: Attempting login (internal)...");
        setIsLoading(true);
        try {
            const data = await apiLoginUser(credentials); // data should be { token: appToken, user: userObject }
            if (data.token && data.user) {
                // Pass the user object directly to authenticateWithToken if API returns it
                await authenticateWithToken(data.token, 'internal_login', data.user);
            } else if (data.token) { // Fallback if only token is returned
                await authenticateWithToken(data.token, 'internal_login');
            } else {
                throw new Error("Login response did not include a token.");
            }
            return data;
        } catch (error) {
            console.error("AuthContext: Internal login failed.", error);
            logout();
            throw error;
        }
        // setIsLoading(false) is handled by authenticateWithToken
    };

    console.log("AuthProvider rendering with value:", { isAuthenticated, isLoading, user, token: token ? '***' : null });

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
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