// src/components/AuthWatcher.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path if needed

function AuthWatcher() {
  const { isAuthenticated, isLoading } = useAuth(); // Get auth state and loading status
  const navigate = useNavigate();
  const location = useLocation(); // Get current page location

  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (!isLoading) {
      // Define the paths where the user should NOT be if they are authenticated
      // Typically login, register, maybe the landing page '/'
      const authRestrictedPaths = ['/login', '/register', '/']; // Adjust as needed

      // If the user IS authenticated...
      if (isAuthenticated) {
        // ...and they are currently on a page they shouldn't be on when logged in...
        if (authRestrictedPaths.includes(location.pathname)) {
           console.log("AuthWatcher: User authenticated on restricted path, navigating to /dashboard");
           // ...redirect them to the main authenticated area (e.g., dashboard).
           navigate('/dashboard', { replace: true }); // Use replace to prevent back button to login
        }
      }
      // Optional: Add redirection for unauthenticated users trying protected routes
      // else {
      //    // If user is NOT authenticated and tries to access a protected route...
      //    // (You would need a list or logic for protected routes)
      //    // if (isProtectedRoute(location.pathname)) {
      //    //    console.log("AuthWatcher: User not authenticated on protected path, navigating to /login");
      //    //    navigate('/login', { replace: true, state: { from: location } });
      //    // }
      // }
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]); // Re-run effect if these change

  // This component does not render anything visual
  return null;
}

export default AuthWatcher;