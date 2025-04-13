import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Adjust path to your AuthContext

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); // Get auth status and loading state
  const location = useLocation(); // Get the current location user tried to access

  // Show loading indicator while initial auth check is running
  if (isLoading) {
    // Optional: Replace with a more sophisticated spinner/skeleton component
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <div>Loading Authentication...</div>
            {/* Or your spinner component */}
        </div>
    );
  }

  // If not loading and user is not authenticated
  if (!isAuthenticated) {
    console.log(`ProtectedRoute: User not authenticated. Redirecting from ${location.pathname} to /login.`);
    // Redirect to the login page
    // Pass the current location in state so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If not loading and user is authenticated, render the child component
  return children;
};

export default ProtectedRoute;