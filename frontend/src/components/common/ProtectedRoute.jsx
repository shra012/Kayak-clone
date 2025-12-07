import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireModerator = false,
  requireOwner = false 
}) => {
  const { isAuthenticated, isAdmin, isModerator, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isModerator()) {
    return <Navigate to="/" replace />;
  }

  if (requireOwner && user?.profileType !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

