import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function ProtectedRoute({ children, roles }) {
    const { token, role } = useAuth();

    if (!token) {
        return <Navigate to="/" replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default ProtectedRoute;