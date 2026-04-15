import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  adminSignOut: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {},
  signOut: () => {},
  updateProfile: async () => {},
  adminSignIn: async () => {},
  adminSignOut: () => {},
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock authentication - replace with actual logic if needed
      const mockUser: User = {
        id: '1',
        email: email,
        name: 'Demo User'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (profileData: any) => {
    if (!user) return;
    
    try {
      // Mock profile update - replace with actual logic if needed
      const updatedUser = { ...user, ...profileData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Mock admin authentication - replace with actual logic if needed
      if (email === 'admin@zetech.ac.ke' && password === 'admin123') {
        const mockAdmin: User = {
          id: 'admin1',
          email: email,
          name: 'Admin User',
          role: 'admin'
        };
        setUser(mockAdmin);
        localStorage.setItem('adminUser', JSON.stringify(mockAdmin));
        localStorage.setItem('adminToken', 'demo-admin-token');
      } else {
        throw new Error('Invalid admin credentials');
      }
    } catch (error) {
      console.error('Admin sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminSignOut = () => {
    setUser(null);
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut, 
      updateProfile, 
      adminSignIn, 
      adminSignOut, 
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
