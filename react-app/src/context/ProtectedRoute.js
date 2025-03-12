import { useAuth } from "./AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { authUser, loading } = useAuth();

  if (loading) return <div>로딩 중...</div>;

  return authUser ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
