// API utility functions for consistent API handling

const API_BASE = '/api';

// Strapi Configuration

const apiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers:
        {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Strapi API request handler
const strapiApiRequest = async (url, options = {}) => {
  try {
    const response = await fetch(`${STRAPI_API_BASE}${url}`, {
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Strapi API Error: ${response.status} - ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    console.error('Strapi API Request failed:', error);
    throw error;
  }
};

// Jobs API (still uses local server)
export const jobsAPI = {
  // Get all jobs
  getAll: () => apiRequest('/jobs'),
  
  // Get limited jobs (for homepage)
  getRecent: (limit = 3) => apiRequest(`/jobs?_limit=${limit}`),
  
  // Get job by ID
  getById: (id) => apiRequest(`/jobs/${id}`),
  
  // Get jobs by employer
  getByEmployer: (employerId) => apiRequest(`/jobs?employerId=${employerId}`),
  
  // Create new job
  create: (jobData) => apiRequest('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData),
  }),
  
  // Update job
  update: (id, jobData) => apiRequest(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jobData),
  }),
  
  // Delete job
  delete: (id) => apiRequest(`/jobs/${id}`, {
    method: 'DELETE',
  }),
};

// Users API - ONLY STRAPI (NO FALLBACK)
export const usersAPI = {
  // Test connection
  testConnection: async () => {
    try {
      const response = await strapiApiRequest('/test1s');
      return {
        success: true,
        count: response.data ? response.data.length : 0,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Get all users from Strapi
  // getAll: async () => {
  //   try {
  //     const response = await strapiApiRequest('/test1s');
  //     return response.data || [];
  //   } catch (error) {
  //     console.error('Failed to fetch users from Strapi:', error);
  //     throw error; // Don't return empty array, throw error
  //   }
  // },
  getAll: async () => {
  const res = await strapiApiRequest('/test1s');
  return res.data || [];
},

  
  // Get user by ID from Strapi
  getById: async (id) => {
    try {
      const response = await strapiApiRequest(`/test1s/${id}`);
      return response.data || response;
    } catch (error) {
      console.error(`Failed to fetch user ${id} from Strapi:`, error);
      return null;
    }
  },
  
  // Get user by email from Strapi - CHECK userInfo FIELD PROPERLY
  // getByEmail: async (email) => {
  //   try {
  //     console.log('🔍 Searching for user by email in Strapi:', email);
      
  //     const response = await strapiApiRequest('/test1s');
  //     const users = response.data || [];
      
  //     console.log('📊 All users from Strapi:', users);
      
  //     // Search through users to find matching email
  //     const foundUser = users.find(user => {
  //       const userAttributes = user.attributes || {};
  //       const userInfo = userAttributes.userInfo || {};
        
  //       console.log('🔍 Checking user ID', user.id, ':', {
  //         directEmail: userAttributes.email,
  //         userInfoEmail: userInfo.email,
  //         firstName: userAttributes.firstName || userInfo.firstName,
  //         lastName: userAttributes.lastName || userInfo.lastName,
  //         hasUserInfo: !!userInfo,
  //         userInfoKeys: Object.keys(userInfo)
  //       });
        
  //       // Check multiple possible email locations
  //       return (
  //         userAttributes.email === email || 
  //         userInfo.email === email
  //       );
  //     });
      
  //     console.log('📊 Found user result:', foundUser);
  //     return foundUser || null;
      
  //   } catch (error) {
  //     console.error(`Failed to fetch user by email ${email} from Strapi:`, error);
  //     return null;
  //   }
  // },
  getByEmail: async (email) => {
  const all = await usersAPI.getAll();
  
  return all.find(u => {
    const info = u.attributes?.userInfo;
    return info?.email?.toLowerCase() === email.toLowerCase();
  }) || null;
},

  
  // Create new user in Strapi - INCLUDE REQUIRED userInfo FIELD
  // create: async (userData) => {
  //   try {
  //     console.log('🔄 Starting Strapi user creation...');
  //     console.log('📤 User data to send:', userData);
      
  //     // Create data structure with ALL the fields we need + required userInfo
  //     const strapiUserData = {
  //       // Core user fields (direct attributes)
  //       firstName: userData.firstName,
  //       lastName: userData.lastName,
  //       name: userData.name || `${userData.firstName} ${userData.lastName}`,
  //       email: userData.email,
  //       password: userData.password,
  //       role: userData.role,
  //       companyId: userData.companyId || null,
  //       position: userData.position || null,
  //       skills: userData.skills || [],
  //       isActive: true,
  //       createdAt: new Date().toISOString(),
  //       profilePhoto: userData.profilePhoto || '',
  //       resume: userData.resume || '',
  //       introVideo: userData.introVideo || '',
  //       companyLogo: userData.companyLogo || '',
  //       about: userData.about || '',
  //       savedJobs: userData.savedJobs || [],
  //       profileStatus: userData.profileStatus || 'draft',
  //       publishedAt: new Date().toISOString(),
  //       lastModified: new Date().toISOString(),
  //       draft: userData.draft || null,
  //       draftData: userData.draftData || null,
        
  //       // REQUIRED userInfo field (Strapi validation requires this)
  //       userInfo: {
  //         firstName: userData.firstName,
  //         lastName: userData.lastName,
  //         name: userData.name || `${userData.firstName} ${userData.lastName}`,
  //         email: userData.email,
  //         role: userData.role,
  //         skills: userData.skills || [],
  //         companyId: userData.companyId || null,
  //         position: userData.position || null,
  //         isActive: true,
  //         registeredAt: new Date().toISOString(),
  //         profilePhoto: userData.profilePhoto || '',
  //         about: userData.about || '',
  //         resume: userData.resume || '',
  //         introVideo: userData.introVideo || '',
  //         lastLoginAt: null,
  //         preferences: {
  //           emailNotifications: true,
  //           jobAlerts: true,
  //           profileVisibility: 'public'
  //         }
  //       }
  //     };

  //     console.log('📊 Sending to Strapi with userInfo:', JSON.stringify(strapiUserData, null, 2));

  //     const response = await strapiApiRequest('/test1s', {
  //       method: 'POST',
  //       body: JSON.stringify({ data: strapiUserData }),
  //     });
      
  //     console.log('✅ Strapi response:', response);
  //     return response.data || response;
  //   } catch (error) {
  //     console.error('❌ Error creating user in Strapi:', error);
  //     throw error;
  //   }
  // },
//   create: async (userData) => {
//   try {
//     const userInfo = {
//       name: `${userData.firstName} ${userData.lastName}`,
//       firstName: userData.firstName,
//       lastName: userData.lastName,

//       email: userData.email,
//       password: userData.password, // IMPORTANT ✔

//       role: userData.role,
//       skills: userData.skills || [],
//       companyId: userData.companyId || null,
//       position: userData.position || null,

//       isActive: true,
//       about: "",
//       resume: "",
//       introVideo: "",
//       profilePhoto: "",

//       registeredAt: new Date().toISOString(),
//       lastLoginAt: null,

//       preferences: {
//         emailNotifications: true,
//         jobAlerts: true,
//         profileVisibility: "public"
//       }
//     };

//     const payload = { data: { userInfo } };

//     const response = await strapiApiRequest('/test1s', {
//       method: 'POST',
//       body: JSON.stringify(payload)
//     });

//     return response.data;
//   } catch (error) {
//     console.error("User creation failed:", error);
//     throw error;
//   }
// },
create: async (userData) => {
  try {
    // Build userInfo object
    const userInfo = {
      name: `${userData.firstName} ${userData.lastName}`,
      firstName: userData.firstName,
      lastName: userData.lastName,

      email: userData.email,      // nested email
      password: userData.password,

      role: userData.role,
      skills: userData.skills || [],
      companyId: userData.companyId || null,
      position: userData.position || null,

      isActive: true,
      about: "",
      resume: "",
      introVideo: "",
      profilePhoto: "",

      registeredAt: new Date().toISOString(),
      lastLoginAt: null,

      preferences: {
        emailNotifications: true,
        jobAlerts: true,
        profileVisibility: "public"
      }
    };

    // TOP LEVEL email added here ✔
    const payload = { 
      data: { 
        email: userData.email,   // REQUIRED BY STRAPI
        userInfo: userInfo       // JSON nested data
      } 
    };

    const response = await strapiApiRequest('/test1s', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    return response.data;
  } catch (error) {
    console.error("User creation failed:", error);
    throw error;
  }
},



  
  // Update user in Strapi
  update: async (id, userData) => {
    try {
      const response = await strapiApiRequest(`/test1s/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ data: userData }),
      });
      return response.data || response;
    } catch (error) {
      console.error(`Failed to update user ${id} in Strapi:`, error);
      throw error;
    }
  },
  
  // Delete user from Strapi
  delete: async (id) => {
    try {
      await strapiApiRequest(`/test1s/${id}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error(`Failed to delete user ${id} from Strapi:`, error);
      throw error;
    }
  },
};

// Applications API (still uses local server)
export const applicationsAPI = {
  // Get all applications
  getAll: () => apiRequest('/applications'),
  
  // Get applications by developer
  getByDeveloper: (developerId) => apiRequest(`/applications?developerId=${developerId}`),
  
  // Get applications by job
  getByJob: (jobId) => apiRequest(`/applications?jobId=${jobId}`),
  
  // Get application by ID
  getById: (id) => apiRequest(`/applications/${id}`),
  
  // Create new application
  create: (applicationData) => apiRequest('/applications', {
    method: 'POST',
    body: JSON.stringify(applicationData),
  }),
  
  // Update application status
  updateStatus: (id, status) => apiRequest(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  
  // Delete application
  delete: (id) => apiRequest(`/applications/${id}`, {
    method: 'DELETE',
  }),
};

// Saved Jobs API (still uses local server)
export const savedJobsAPI = {
  // Get all saved jobs
  getAll: () => apiRequest('/savedJobs'),
  
  // Get saved jobs by developer
  getByDeveloper: (developerId) => apiRequest(`/savedJobs?developerId=${developerId}`),
  
  // Check if job is saved by developer
  isSaved: async (jobId, developerId) => {
    const savedJobs = await apiRequest(`/savedJobs?jobId=${jobId}&developerId=${developerId}`);
    return savedJobs.length > 0;
  },
  
  // Save a job
  save: (jobId, developerId) => apiRequest('/savedJobs', {
    method: 'POST',
    body: JSON.stringify({
      jobId,
      developerId,
      savedAt: new Date().toISOString(),
    }),
  }),
  
  // Remove saved job
  remove: async (jobId, developerId) => {
    const savedJobs = await apiRequest(`/savedJobs?jobId=${jobId}&developerId=${developerId}`);
    if (savedJobs.length > 0) {
      return apiRequest(`/savedJobs/${savedJobs[0].id}`, {
        method: 'DELETE',
      });
    }
  },
};

// Helper functions for common operations
export const helpers = {
  // Get job with application status for a developer
  getJobWithApplicationStatus: async (jobId, developerId) => {
    const [job, applications] = await Promise.all([
      jobsAPI.getById(jobId),
      applicationsAPI.getByJob(jobId),
    ]);
    
    const userApplication = applications.find(app => app.developerId === developerId);
    
    return {
      ...job,
      applicationStatus: userApplication ? userApplication.status : null,
      hasApplied: !!userApplication,
    };
  },
  
  // Get jobs with application counts (for employers)
  getJobsWithApplicationCounts: async (employerId) => {
    const [jobs, applications] = await Promise.all([
      jobsAPI.getByEmployer(employerId),
      applicationsAPI.getAll(),
    ]);
    
    return jobs.map(job => {
      const jobApplications = applications.filter(app => app.jobId === job.id);
      return {
        ...job,
        applicationCount: jobApplications.length,
        applications: jobApplications,
      };
    });
  },
  
  // Get developer's dashboard data
  getDeveloperDashboard: async (developerId) => {
    const [applications, savedJobs] = await Promise.all([
      applicationsAPI.getByDeveloper(developerId),
      savedJobsAPI.getByDeveloper(developerId),
    ]);
    
    const jobIds = [
      ...applications.map(app => app.jobId),
      ...savedJobs.map(saved => saved.jobId),
    ];
    
    const uniqueJobIds = [...new Set(jobIds)];
    const jobs = await Promise.all(uniqueJobIds.map(id => jobsAPI.getById(id)));
    
    return {
      applications: applications.map(app => ({
        ...app,
        job: jobs.find(job => job.id === app.jobId),
      })),
      savedJobs: savedJobs.map(saved => ({
        ...saved,
        job: jobs.find(job => job.id === saved.jobId),
      })),
    };
  },
};

export default {
  jobs: jobsAPI,
  users: usersAPI,
  applications: applicationsAPI,
  savedJobs: savedJobsAPI,
  helpers,
};