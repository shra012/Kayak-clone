import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

const AuthInitializer = () => {
  const { getMe, isAuthenticated, user } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token && (!isAuthenticated || !user)) {
      getMe().catch(() => {
        localStorage.removeItem('authToken');
      });
    }
  }, [isAuthenticated, user]);

  return null;
};

export default AuthInitializer;
