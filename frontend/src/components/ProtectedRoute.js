import { Navigate,Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user } = useAuth();
    if (!user || !user.role) {
        console.log("Redirecting to / because user is missing or has no role");
        return <Navigate to="/" replace />

    }
    
    

    return <Outlet />;
};

export default ProtectedRoute;