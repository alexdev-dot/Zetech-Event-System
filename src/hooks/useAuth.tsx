import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  adminNumber: string;
  name?: string;
  role?: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (adminNumber: string, password: string) => Promise<void>;
  signUp: (firstName: string, lastName: string, admissionNumber: string, campus: string, password: string) => Promise<void>;
  createStudentAccount: (firstName: string, lastName: string, admissionNumber: string, password: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  adminSignIn: (email: string, password: string) => Promise<void>;
  adminSignOut: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async (adminNumber: string, password: string) => {},
  signUp: async (firstName: string, lastName: string, admissionNumber: string, campus: string, password: string) => {},
  createStudentAccount: async (firstName: string, lastName: string, admissionNumber: string, password: string) => {},
  signOut: () => {},
  updateProfile: async () => {},
  adminSignIn: async (email: string, password: string) => {},
  adminSignOut: () => {},
  isAdmin: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Initialize user state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedAdminUser = localStorage.getItem('adminUser');
    
    if (storedAdminUser) {
      const adminUser = JSON.parse(storedAdminUser);
      setUser(adminUser);
    } else if (storedUser) {
      const regularUser = JSON.parse(storedUser);
      setUser(regularUser);
    }
  }, []);

  const signIn = async (adminNumber: string, password: string) => {
    setLoading(true);
    try {
      // Check userCredentials first (for newly created accounts)
      const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      const user = users.find((u: any) => u.adminNumber === adminNumber);
      
      if (user && credentials[adminNumber] === password) {
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return;
      }
      
      // Check registered users (legacy)
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const registeredUser = registeredUsers.find((u: any) => u.adminNumber === adminNumber);
      
      if (registeredUser && password.length >= 6) {
        const userObj: User = {
          id: registeredUser.id,
          email: `${registeredUser.adminNumber}@zetech.ac.ke`,
          adminNumber: registeredUser.adminNumber,
          name: registeredUser.name
        };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return;
      }
      
      // Check default student database (fallback)
      const validStudents = [
        { adminNumber: 'BSIT-001-2024', name: 'John Kamau', id: 'student1' },
        { adminNumber: 'BSCS-002-2024', name: 'Mary Wanjiku', id: 'student2' },
        { adminNumber: 'BBIT-003-2024', name: 'David Ochieng', id: 'student3' },
        { adminNumber: 'BSCM-004-2024', name: 'Grace Njeri', id: 'student4' },
        { adminNumber: 'BCOM-005-2024', name: 'Peter Mwangi', id: 'student5' },
        { adminNumber: 'BSIT-006-2024', name: 'Sarah Atieno', id: 'student6' },
        { adminNumber: 'BENG-007-2024', name: 'Michael Kinyua', id: 'student7' },
        { adminNumber: 'BSCS-008-2024', name: 'Esther Muthoni', id: 'student8' }
      ];
      
      const student = validStudents.find(s => s.adminNumber === adminNumber);
      
      if (student && password.length >= 6) {
        const userObj: User = {
          id: student.id,
          email: `${student.adminNumber}@zetech.ac.ke`,
          adminNumber: student.adminNumber,
          name: student.name
        };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
      } else {
        throw new Error('Invalid admission number or password');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (firstName: string, lastName: string, admissionNumber: string, campus: string, password: string) => {
    setLoading(true);
    try {
      // Get existing registered users
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      
      // Check if admission number already exists
      const existingUser = registeredUsers.find((u: any) => u.adminNumber === admissionNumber);
      if (existingUser) {
        throw new Error('A student with this admission number is already registered');
      }
      
      // Validate admission number format
      // Accept formats: BSIT-001-2024 OR DCS-01-0161/2025
      const admissionRegex1 = /^[A-Z]{4}-\d{3}-\d{4}$/; // Format: BSIT-001-2024
      const admissionRegex2 = /^[A-Z]{3}-\d{2}-\d{4}\/\d{4}$/; // Format: DCS-01-0161/2025
      
      if (!admissionRegex1.test(admissionNumber) && !admissionRegex2.test(admissionNumber)) {
        throw new Error('Invalid admission number format. Use formats: BSIT-001-2024 or DCS-01-0161/2025');
      }
      
      // Create new user
      const newUser = {
        id: `student-${Date.now()}`,
        firstName,
        lastName,
        adminNumber: admissionNumber,
        campus,
        password,
        email: `${admissionNumber}@zetech.ac.ke`,
        createdAt: new Date().toISOString()
      };
      
      // Save to localStorage
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
      
      // Auto-login after successful registration
      const user: User = {
        id: newUser.id,
        email: newUser.email,
        adminNumber: newUser.adminNumber,
        name: `${firstName} ${lastName}`
      };
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createStudentAccount = async (firstName: string, lastName: string, admissionNumber: string, password: string) => {
    setLoading(true);
    try {
      // Check if admission number already exists
      const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
      if (existingUsers.some((u: any) => u.adminNumber === admissionNumber)) {
        throw new Error('This admission number is already registered');
      }

      // Create new student account with flexible admission number validation
      // Any admission number format is accepted - no strict validation
      const user: User = {
        id: Date.now().toString(),
        email: `${admissionNumber.toLowerCase()}@zetech.ac.ke`,
        adminNumber: admissionNumber,
        name: `${firstName} ${lastName}`,
        role: 'user'
      };

      // Store user in users array
      existingUsers.push(user);
      localStorage.setItem('users', JSON.stringify(existingUsers));
      
      // Store user credentials for login
      const credentials = JSON.parse(localStorage.getItem('userCredentials') || '{}');
      credentials[admissionNumber] = password;
      localStorage.setItem('userCredentials', JSON.stringify(credentials));
      
      console.log('Student account created successfully:', user);
      
    } catch (error) {
      console.error('Create student account error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminToken');
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
          adminNumber: 'ADMIN001',
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
      signUp,
      createStudentAccount,
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
