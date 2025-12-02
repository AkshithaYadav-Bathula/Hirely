import { createContext, useContext, useState, useEffect } from 'react';
import { usersAPI } from '../utils/api';

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

          // For companies, still check local server
          if (userData.role === 'company') {
            const response = await fetch(`http://localhost:8000/companies/${userData.id}`);
            if (response.ok) {
              const fetched = await response.json();
              const safe = { ...fetched };
              if (safe.password) delete safe.password;
              if (safe.companyPassword) delete safe.companyPassword;
              if (!safe.role && userData.role) safe.role = userData.role;
              setUser(safe);
            } else {
              sessionStorage.removeItem('currentUser');
            }
          } else {
            // For users, check ONLY Strapi (NO FALLBACK)
            try {
              const strapiUser = await usersAPI.getById(userData.id);
              if (strapiUser) {
                // const userAttributes = strapiUser.attributes || strapiUser;
                // const safeUser = {
                //   id: strapiUser.id,
                //   email: userAttributes.email,
                //   firstName: userAttributes.firstName,
                //   lastName: userAttributes.lastName,
                //   name: userAttributes.name,
                //   role: userAttributes.role,
                //   companyId: userAttributes.companyId,
                //   skills: userAttributes.skills || [],
                //   position: userAttributes.position,
                //   isActive: userAttributes.isActive,
                //   profilePhoto: userAttributes.profilePhoto,
                //   about: userAttributes.about,
                //   resume: userAttributes.resume,
                //   introVideo: userAttributes.introVideo
                // };
                const info = strapiUser.attributes?.userInfo || {};

                const safeUser = {
                  id: strapiUser.id,
                  email: info.email,
                  firstName: info.firstName,
                  lastName: info.lastName,
                  name: info.name,
                  role: info.role,
                  companyId: info.companyId,
                  skills: info.skills || [],
                  position: info.position,
                  isActive: info.isActive,
                  profilePhoto: info.profilePhoto || '',
                  about: info.about || '',
                  resume: info.resume || '',
                  introVideo: info.introVideo || ''
                };

                setUser(safeUser);
                console.log('✅ Restored user session from Strapi:', safeUser);
              } else {
                console.log('❌ User not found in Strapi, clearing session');
                sessionStorage.removeItem('currentUser');
              }
            } catch (error) {
              console.error('Error restoring user session from Strapi:', error);
              sessionStorage.removeItem('currentUser');
            }
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

  // Login function - ONLY STRAPI FOR USERS (NO FALLBACK)
  const login = async (email, password, accountType = 'user') => {
    try {
      setLoading(true);
      
      if (accountType === 'company') {
        // Company login - still use local server
        const companiesRes = await fetch('http://localhost:8000/companies');
        if (companiesRes.ok) {
          const companies = await companiesRes.json();
          const foundCompany = companies.find(c => 
            c.email === email && c.password === password
          );
          
          if (foundCompany) {
            const companySafe = { 
              ...foundCompany, 
              role: 'company'
            };
            delete companySafe.password;
            delete companySafe.companyPassword;
            
            console.log('✅ Company Login Success:', companySafe);
            setUser(companySafe);
            sessionStorage.setItem('currentUser', JSON.stringify(companySafe));
            return { success: true };
          }
        }
        
        return { success: false, error: 'Invalid company credentials' };
      } else {
        // User login - USE ONLY STRAPI (NO FALLBACK)
        console.log('🔍 Attempting user login with Strapi API for:', email);
        
        try {
          const strapiUser = await usersAPI.getByEmail(email);
          
          if (strapiUser) {
            console.log('👤 Found user in Strapi:', strapiUser);
            
            // Handle Strapi data structure - check both direct attributes and userInfo
            // const userAttributes = strapiUser.attributes || strapiUser;
            // const userInfo = userAttributes.userInfo || {};
            
            // Get user data from direct attributes first, fallback to userInfo
            // const userData = {
            //   email: userAttributes.email || userInfo.email,
            //   firstName: userAttributes.firstName || userInfo.firstName,
            //   lastName: userAttributes.lastName || userInfo.lastName,
            //   name: userAttributes.name || userInfo.name || `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim(),
            //   role: userAttributes.role || userInfo.role,
            //   password: userAttributes.password || userInfo.password,
            //   skills: userAttributes.skills || userInfo.skills || [],
            //   companyId: userAttributes.companyId || userInfo.companyId,
            //   position: userAttributes.position || userInfo.position,
            //   isActive: userAttributes.isActive !== false && userInfo.isActive !== false
            // };
            const info = strapiUser.attributes?.userInfo || {};

const userData = {
  email: info.email,
  firstName: info.firstName,
  lastName: info.lastName,
  name: info.name,
  role: info.role,
  password: info.password,
  skills: info.skills || [],
  companyId: info.companyId,
  position: info.position,
  isActive: info.isActive
};

            console.log('📊 Extracted user data:', userData);
            // console.log('📊 Direct attributes:', {
            //   email: userAttributes.email,
            //   firstName: userAttributes.firstName,
            //   lastName: userAttributes.lastName
            // });
            // console.log('📊 UserInfo data:', {
            //   email: userInfo.email,
            //   firstName: userInfo.firstName,
            //   lastName: userInfo.lastName
            // });
            
            if (userData.password === password && userData.isActive) {
              const safeUser = {
                id: strapiUser.id,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                name: userData.name,
                role: userData.role,
                companyId: userData.companyId,
                skills: userData.skills,
                position: userData.position,
                isActive: userData.isActive,
                profilePhoto: info.profilePhoto || '',
                about: info.about || '',
                resume: info.resume || '',
                introVideo: info.introVideo || ''
              };
              
              setUser(safeUser);
              sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
              console.log('✅ Strapi User Login Success:', safeUser);
              return { success: true };
            } else {
              console.log('❌ Invalid password or inactive user');
              return { success: false, error: 'Invalid email or password' };
            }
          } else {
            console.log('❌ User not found in Strapi');
            return { success: false, error: 'Invalid email or password' };
          }
        } catch (error) {
          console.error('❌ Strapi login failed:', error);
          return { success: false, error: 'Login failed. Please try again.' };
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  // Register function - ONLY STRAPI FOR USERS
  const register = async (userData) => {
    try {
      setLoading(true);
      
      console.log('🔄 Starting user registration with Strapi for:', userData.email);
      
      // Check if email already exists in Strapi
      const existingUser = await usersAPI.getByEmail(userData.email);
      if (existingUser) {
        console.log('❌ Email already exists in Strapi');
        return { success: false, error: 'User with this email already exists' };
      }
      
      // Prepare user data for Strapi
      // const strapiUserData = {
      //   email: userData.email,
      //   password: userData.password, // In production, hash this
      //   firstName: userData.firstName,
      //   lastName: userData.lastName,
      //   name: `${userData.firstName} ${userData.lastName}`,
      //   role: userData.role,
      //   companyId: userData.companyId || null,
      //   position: userData.position || null,
      //   skills: userData.role === 'developer' ? userData.skills || [] : [],
      //   isActive: true,
      //   createdAt: new Date().toISOString(),
      //   profilePhoto: '',
      //   resume: '',
      //   introVideo: '',
      //   companyLogo: '',
      //   about: '',
      //   savedJobs: [],
      //   profileStatus: 'draft',
      //   publishedAt: null,
      //   lastModified: new Date().toISOString(),
      //   draft: null,
      //   draftData: null
      // };

      // console.log('📤 Creating user in Strapi:', strapiUserData);
      
      // Create user in Strapi
      // const createdUser = await usersAPI.create(strapiUserData);
      const strapiUserData = {
  userInfo: {
    name: `${userData.firstName} ${userData.lastName}`,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    role: userData.role,
    skills: userData.role === 'developer' ? userData.skills || [] : [],
    companyId: userData.companyId || null,
    position: userData.position || null,
    isActive: true,
    profilePhoto: '',
    about: '',
    resume: '',
    introVideo: '',
    registeredAt: new Date().toISOString(),
    preferences: {
      jobAlerts: true,
      profileVisibility: "public",
      emailNotifications: true
    }
  }
};

const createdUser = await usersAPI.create(strapiUserData.userInfo);

      if (createdUser) {
        const userAttributes = createdUser.attributes || createdUser;
        const safeUser = {
          id: createdUser.id,
          email: userAttributes.email,
          firstName: userAttributes.firstName,
          lastName: userAttributes.lastName,
          name: userAttributes.name,
          role: userAttributes.role,
          companyId: userAttributes.companyId,
          skills: userAttributes.skills || [],
          position: userAttributes.position,
          isActive: userAttributes.isActive
        };
        
        setUser(safeUser);
        sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
        console.log('✅ User created successfully in Strapi:', safeUser);
        return { success: true };
      } else {
        throw new Error('Failed to create user in Strapi');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { success: false, error: error.message || 'Registration failed. Please try again.' };
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

  // Get all users - ONLY FROM STRAPI
  const getAllUsers = async () => {
    if (!hasRole('admin')) return [];
    
    try {
      const strapiUsers = await usersAPI.getAll();
      console.log('📋 Fetched all users from Strapi:', strapiUsers.length);
      
      return strapiUsers.map(user => ({
        ...(user.attributes || user),
        id: user.id,
        source: 'strapi'
      }));
    } catch (error) {
      console.error('Failed to fetch users from Strapi:', error);
      return [];
    }
  };

  // Update profile - USE STRAPI FOR USERS
  const updateProfile = async (updatedData) => {
    if (!user) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      if (user.role === 'company') {
        // Update company in local server
        const endpoint = `http://localhost:8000/companies/${user.id}`;
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
          return { success: true };
        } else {
          throw new Error('Failed to update company profile');
        }
      } else {
        // Update user in Strapi
        console.log('📝 Updating user profile in Strapi:', updatedData);
        
        // const updatedUser = await usersAPI.update(user.id, updatedData);
        const updatedUser = await usersAPI.update(user.id, {
  userInfo: updatedData
});

        if (updatedUser) {
          const userAttributes = updatedUser.attributes || updatedUser;
          const safeUser = {
            ...user,
            ...userAttributes,
            id: updatedUser.id || user.id
          };
          
          setUser(safeUser);
          sessionStorage.setItem('currentUser', JSON.stringify(safeUser));
          console.log('✅ User profile updated in Strapi:', safeUser);
          return { success: true };
        } else {
          throw new Error('Failed to update user profile');
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message || 'Profile update failed' };
    }
  };

  const getSkills = async () => {
    try {
      console.log('🔍 Fetching skills from localhost:8000...');
      
      // Fetch from localhost:8000 (your main backend)
      const response = await fetch('http://localhost:8000/api/skills');
      
      if (response.ok) {
        const skillsData = await response.json();
        console.log('📊 Skills from localhost:8000:', skillsData);
        
        // Handle different response structures
        if (skillsData.skills && Array.isArray(skillsData.skills)) {
          return skillsData.skills;
        } else if (Array.isArray(skillsData)) {
          return skillsData;
        } else if (skillsData.data && Array.isArray(skillsData.data)) {
          return skillsData.data;
        }
        
        return [];
      }
      
      throw new Error(`localhost:8000 skills API failed: ${response.status}`);
      
    } catch (error) {
      console.error('Failed to fetch skills from localhost:8000:', error);
      
      // Static fallback skills
      return [
        { id: "1", name: "JavaScript", category: "Programming Language" },
        { id: "2", name: "React", category: "Frontend Framework" },
        { id: "3", name: "Node.js", category: "Backend Technology" },
        { id: "4", name: "Python", category: "Programming Language" },
        { id: "5", name: "Java", category: "Programming Language" },
        { id: "6", name: "SQL", category: "Database" },
        { id: "7", name: "Redux", category: "State Management" },
        { id: "8", name: "CSS", category: "Styling" },
        { id: "9", name: "HTML", category: "Markup Language" },
        { id: "10", name: "TypeScript", category: "Programming Language" }
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