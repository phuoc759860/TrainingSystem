import { Navigate } from "react-router-dom";

// FIX: previously this only checked that a token existed, so e.g. a
// Student could type /roles or /users into the address bar and see the
// full page shell (the API calls would fail, but the UI wouldn't).
// Passing a `roles` array now redirects anyone whose role isn't in the
// list back to the dashboard.
function ProtectedRoute({ children, roles }) {

    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (roles && roles.length > 0) {
        const userRole = localStorage.getItem("role");

        if (!roles.includes(userRole)) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;