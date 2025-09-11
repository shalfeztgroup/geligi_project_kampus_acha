import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCurrentUser, setToken } from '../store/slices/authSlice';
import { RootState } from '../store';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(setToken(token));
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  const value = {
    isAuthenticated,
    loading,
    user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
