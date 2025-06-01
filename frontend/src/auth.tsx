// this file handles login and logout logic, interacting with backend API
import * as React from "react";
import { createApiUrl } from "./config/api";

export interface AuthContext {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register : (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  user: string | null;
}

interface AuthResponse {
  message : string;
  data : {
    id : string;
    username : string;
  }
}

const AuthContext = React.createContext<AuthContext | null>(null);

const key = "tanstack.auth.user";

function getStoredUser() {
  return localStorage.getItem(key);
}

function setStoredUser(user: string | null) {
  if (user) {
    localStorage.setItem(key, user);
  } else {
    localStorage.removeItem(key);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<string | null>(getStoredUser());
  const isAuthenticated = !!user;

  const logout = React.useCallback(async () => {
    setStoredUser(null);
    setUser(null);
  }, []);

  const login = React.useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(createApiUrl('/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
  
      if (!response.ok) {
        console.log("Login failed: ", data);
        // Return error message from server if available, or fallback message
        return {
          success: false,
          error: data.message || data.error || 'Login failed. Please try again.',
        };
      }
      
      const authData: AuthResponse = data;
      console.log("Login successful: ", authData);
    
      setStoredUser(authData.data.id);
      setUser(authData.data.id);
  
      return {
        success: true
      };
  
    } catch (error) {
      console.error("Error logging in: ", error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  }, []);

  const register = React.useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(createApiUrl('/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
  
      if (!response.ok) {
        console.log("Registration failed: ", data);
        // Return error message from server if available, or fallback message
        return {
          success: false,
          error: data.message || data.error || 'Registration failed. Please try again.',
        };
      }
      
      console.log("Registration successful: ", data);
    
      return {
        success: true
      };
  
    }
    catch (error) {
      console.error("Error registering: ", error);
      return {
        success: false,
        error: 'Network error occurred. Please try again.',
      };
    }
  }, []);

  React.useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
