import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>로딩 중...</div>;

  return user ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
