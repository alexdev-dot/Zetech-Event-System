import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api";

interface User {
  id: string | number;
  email: string;
  adminNumber: string;
  name?: string;
  role?: 'user' | 'admin' | 'club_leader';
  club?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (admissionNumber: string, password: string) => Promise<void>;
  createStudentAccount: (firstName: string, lastName: string, email: string, admissionNumber: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  adminSignOut: () => void;
  isAdmin: () => boolean;
  isClubLeader: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {},
  createStudentAccount: async () => {},
  signOut: () => {},
  updateProfile: async () => {},
  adminSignIn: async () => {},
  adminSignOut: () => {},
  isAdmin: () => false,
  isClubLeader: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: verify stored token with server, never trust localStorage blindly
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth.me()
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        } else {
          clearSession();
        }
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
  };

  const signIn = async (admissionNumber: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.auth.login(admissionNumber, password);
      if (response.user && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const createStudentAccount = async (
    firstName: string,
    lastName: string,
    email: string,
    admissionNumber: string,
    password: string
  ) => {
    setLoading(true);
    try {
      const response = await api.auth.register({ firstName, lastName, email, admissionNumber, password });
      // Auto-login after successful registration
      if (response.user && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const adminSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.auth.adminLogin(email, password);
      if (response.user && response.token) {
        localStorage.setItem('authToken', response.token);
        setUser(response.user);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    clearSession();
  };

  const adminSignOut = () => {
    clearSession();
  };

  const updateProfile = async (profileData: any) => {
    if (!user) return;
    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
  };

  const isAdmin = () => user?.role === 'admin';
  const isClubLeader = () => user?.role === 'club_leader';

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      createStudentAccount,
      signOut,
      updateProfile,
      adminSignIn,
      adminSignOut,
      isAdmin,
      isClubLeader,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
