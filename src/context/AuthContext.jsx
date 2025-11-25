import { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = sessionStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);

          // Resolve endpoint by role so company sessions are loaded correctly
          let endpoint = 'http://localhost:8000/users';
          if (userData.role === 'company') {
            endpoint = 'http://localhost:8000/companies';
          }

          const response = await fetch(`${endpoint}/${userData.id}`);
          if (response.ok) {
            const fetched = await response.json();
            // Remove sensitive fields and keep role
            const safe = { ...fetched };
            if (safe.password) delete safe.password;
            if (safe.companyPassword) delete safe.companyPassword;
            // Ensure role remains set for company/employer
            if (!safe.role && userData.role) safe.role = userData.role;
            setUser(safe);
          } else {
            sessionStorage.removeItem('currentUser');
          }
        } else {
          // Support company sessions saved directly to localStorage
          const storedCompany = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('company') || 'null') : null;
          if (storedCompany) {
            const companySafe = { ...storedCompany, role: 'company' };
            if (companySafe.password) delete companySafe.password;
            if (companySafe.companyPassword) delete companySafe.companyPassword;

            setUser(companySafe);
            // Keep sessionStorage in sync for the rest of the app
            sessionStorage.setItem('currentUser', JSON.stringify(companySafe));
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        sessionStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password, accountType = 'user') => {
    try {
      setLoading(true);
      
      if (accountType === 'company') {
        // ✅ COMPANY LOGIN - Check companies collection
        const companiesRes = await fetch('http://localhost:8000/companies');
        if (companiesRes.ok) {
          const companies = await companiesRes.json();
          const foundCompany = companies.find(c => 
            c.email === email && c.password === password
          );
          
          if (foundCompany) {
            const companySafe = { 
              ...foundCompany, 
              role: 'company' // ✅ FIXED: Set role to 'company'
            };
            delete companySafe.password;
            delete companySafe.companyPassword;
            
            console.log('✅ Company Login Success:', companySafe);
            setUser(companySafe);
            sessionStorage.setItem('currentUser', JSON.stringify(companySafe));
            localStorage.setItem('company', JSON.stringify(companySafe));
            return { success: true };
          }
        }
        
        return { success: false, error: 'Invalid company credentials' };
      } else {
        // ✅ USER LOGIN - Check users collection
        const usersRes = await fetch('http://localhost:8000/users');
        if (!usersRes.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const users = await usersRes.json();
        const foundUser = users.find(u => u.email === email && u.password === password && u.isActive);
        
        if (foundUser) {
          const userWithoutPassword = { ...foundUser };
          delete userWithoutPassword.password;
          
          console.log('✅ User Login Success:', userWithoutPassword);
          setUser(userWithoutPassword);
          sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          return { success: true };
        }

        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8000/users');
      const users = await response.json();
      
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        return { success: false, error: 'User with this email already exists' };
      }

      const newUser = {
        id: Date.now().toString(),
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        companyId: userData.companyId || null,
        skills: userData.role === 'developer' ? userData.skills || [] : undefined,
        position: userData.position || undefined,
        createdAt: new Date().toISOString(),
        isActive: true,
        profilePhoto: '',
        resume: '',
        introVideo: '',
        companyLogo: '',
        about: '',
        draft: null
      };

      if (userData.role !== 'developer') {
        delete newUser.skills;
      }

      const createResponse = await fetch('http://localhost:8000/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create user');
      }

      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      setUser(userWithoutPassword);
      sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('company');
    localStorage.removeItem('accountType');
  };

  const hasRole = (role) => {
    return user && user.role === role;
  };

  const hasAnyRole = (roles) => {
    return user && roles.includes(user.role);
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const updateUser = (updatedUserData) => {
    const updatedUser = { ...user, ...updatedUserData };
    setUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const getAllUsers = async () => {
    if (!hasRole('admin')) return [];
    
    try {
      const response = await fetch('http://localhost:8000/users');
      if (response.ok) {
        const users = await response.json();
        return users.map(user => {
          const { password, ...userWithoutPassword } = user;
          return userWithoutPassword;
        });
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    
    return [];
  };

  const updateProfile = async (updatedData) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      // Determine endpoint based on role
      const endpoint = user.role === 'company' 
        ? `http://localhost:8000/companies/${user.id}`
        : `http://localhost:8000/users/${user.id}`;

      const updatedUser = {
        ...user,
        ...updatedData,
        id: user.id,
        email: user.email,
        role: user.role
      };

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        const savedUser = await response.json();
        const userWithoutPassword = { ...savedUser };
        delete userWithoutPassword.password;
        delete userWithoutPassword.companyPassword;
        
        setUser(userWithoutPassword);
        sessionStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        if (user.role === 'company') {
          localStorage.setItem('company', JSON.stringify(userWithoutPassword));
        }
        
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  const getSkills = async () => {
    try {
      const response = await fetch('http://localhost:8000/skills');
      if (response.ok) {
        const data = await response.json();
        return data.skills || data;
      }
      
      return [
        { id: 1, name: "JavaScript", category: "Programming Language" },
        { id: 2, name: "React", category: "Frontend Framework" },
        { id: 3, name: "Node.js", category: "Backend Technology" },
        { id: 4, name: "Python", category: "Programming Language" },
        { id: 5, name: "Java", category: "Programming Language" },
        { id: 6, name: "SQL", category: "Database" }
      ];
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      return [
        { id: 1, name: "JavaScript", category: "Programming Language" },
        { id: 2, name: "React", category: "Frontend Framework" },
        { id: 3, name: "Node.js", category: "Backend Technology" },
        { id: 4, name: "Python", category: "Programming Language" },
        { id: 5, name: "Java", category: "Programming Language" },
        { id: 6, name: "SQL", category: "Database" }
      ];
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
    updateUser,
    loading,
    getAllUsers,
    updateProfile,
    getSkills
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};