import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { loginUser, registerUser } from '../api/auth'; // Import your API calls

// Define the user type
interface User {
  name: string;
  email: string;
  role: 'admin' | 'student' | 'parent' | 'teacher';
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => Promise<void>;
  logout: () => void;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  // Check if the user is already logged in (e.g., on page refresh)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await loginUser(email, password);
      const { user, token } = response;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw new Error('Invalid Credentials');
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string, role: 'student' | 'parent' | 'teacher') => {
    try {
      const response = await registerUser({ name, email, password, role });
      const { user, token } = response;
      setUser(user);
      setToken(token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      throw new Error('Registration failed');
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};