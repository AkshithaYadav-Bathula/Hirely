import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock users database (in real app, this would be in backend)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    company: null
  },
  {
    id: '2',
    email: 'employer@example.com',
    password: 'emp123',
    firstName: 'John',
    lastName: 'Employer',
    role: 'employer',
    company: 'Tech Corp'
  },
  {
    id: '3',
    email: 'dev@example.com',
    password: 'dev123',
    firstName: 'Jane',
    lastName: 'Developer',
    role: 'developer',
    company: null
  }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Get registered users from localStorage
  const getRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : MOCK_USERS;
  };

  // Save registered users to localStorage
  const saveRegisteredUsers = (users) => {
    localStorage.setItem('registeredUsers', JSON.stringify(users));
  };

  // Login function
  const login = async (email, password) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getRegisteredUsers();
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Don't store password in user object
        const userWithoutPassword = { ...foundUser };
        delete userWithoutPassword.password;
        
        setUser(userWithoutPassword);
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getRegisteredUsers();
      
      // Check if user already exists
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        company: userData.company || null,
        createdAt: new Date().toISOString()
      };

      // Add to users list
      const updatedUsers = [...users, newUser];
      saveRegisteredUsers(updatedUsers);

      // Login the user immediately after registration
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return user !== null;
  };

  // Get all registered users (admin only)
  const getAllUsers = () => {
    if (!hasRole('admin')) return [];
    return getRegisteredUsers().map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  };

  // Update user profile
  const updateProfile = async (updatedData) => {
    try {
      const users = getRegisteredUsers();
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedData };
        saveRegisteredUsers(users);
        
        // Update current user state
        const updatedUser = { ...users[userIndex] };
        delete updatedUser.password;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        return { success: true };
      }
      
      return { success: false, error: 'User not found' };
    } catch (error) {
      return { success: false, error: 'Profile update failed' };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    loading,
    getAllUsers,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};