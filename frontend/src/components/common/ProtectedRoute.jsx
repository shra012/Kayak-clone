import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, requireAdmin = false, requireModerator = false }) => {
  const { isAuthenticated, isAdmin, isModerator } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isModerator()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

