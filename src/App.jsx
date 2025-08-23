// // // import {
// // //   Route,
// // //   createBrowserRouter,
// // //   createRoutesFromElements,
// // //   RouterProvider,
// // // } from 'react-router-dom';
// // // import MainLayout from './layouts/MainLayout';
// // // import HomePage from './pages/HomePage';
// // // import JobsPage from './pages/JobsPage';
// // // import NotFoundPage from './pages/NotFoundPage';
// // // import JobPage, { jobLoader } from './pages/JobPage';
// // // import AddJobPage from './pages/AddJobPage';
// // // import EditJobPage from './pages/EditJobPage';


// // // const App = () => {
// // //   // Add New Job
// // //   const addJob = async (newJob) => {
// // //     const res = await fetch('/api/jobs', {
// // //       method: 'POST',
// // //       headers: {
// // //         'Content-Type': 'application/json',
// // //       },
// // //       body: JSON.stringify(newJob),
// // //     });
// // //     return;
// // //   };

// // //   // Delete Job
// // //   const deleteJob = async (id) => {
// // //     const res = await fetch(`/api/jobs/${id}`, {
// // //       method: 'DELETE',
// // //     });
// // //     return;
// // //   };

// // //   // Update Job
// // //   const updateJob = async (job) => {
// // //     const res = await fetch(`/api/jobs/${job.id}`, {
// // //       method: 'PUT',
// // //       headers: {
// // //         'Content-Type': 'application/json',
// // //       },
// // //       body: JSON.stringify(job),
// // //     });
// // //     return;
// // //   };

// // //   const router = createBrowserRouter(
// // //     createRoutesFromElements(
// // //       //MainLayout wraps all pages (contains header/footer).
// // //       <Route path='/' element={<MainLayout />}>
// // //         <Route index element={<HomePage />} />
// // //         <Route path='/jobs' element={<JobsPage />} />
// // //         {/* /jobs/:id → Shows a specific job based on its ID. */}
// // //         <Route path='/add-job' element={<AddJobPage addJobSubmit={addJob} />} /> 

// // // {/* addJobSubmit={addJob} → Passing the addJob function to AddJobPage.

// // // deleteJob={deleteJob} → Passing deleteJob function to JobPage.

// // // updateJobSubmit={updateJob} → Passing updateJob function to EditJobPage. */}
// // //         <Route
// // //           path='/edit-job/:id'
// // //           element={<EditJobPage updateJobSubmit={updateJob} />}
// // //           loader={jobLoader}
// // //         />
// // //         <Route
// // //           path='/jobs/:id'
// // //           element={<JobPage deleteJob={deleteJob} />}
// // //           loader={jobLoader}
// // //         />
// // //         <Route path='*' element={<NotFoundPage />} />
// // //       </Route>
// // //     )
// // //   );

// // //   return <RouterProvider router={router} />;
// // // };
// // // export default App;
// // import {
// //   Route,
// //   createBrowserRouter,
// //   createRoutesFromElements,
// //   RouterProvider,
// // } from 'react-router-dom';
// // import { AuthProvider } from './context/AuthContext';
// // import ProtectedRoute from './components/ProtectedRoute'; // Wrapper for protecting routes based on roles
// // import MainLayout from './layouts/MainLayout';
// // import HomePage from './pages/HomePage';
// // import JobsPage from './pages/JobsPage';
// // import NotFoundPage from './pages/NotFoundPage';
// // import UnauthorizedPage from './pages/UnauthorizedPage';
// // import LoginPage from './pages/LoginPage';
// // import RegisterPage from './pages/RegisterPage';
// // import JobPage, { jobLoader } from './pages/JobPage'; // Job details + loader for fetching job data
// // import AddJobPage from './pages/AddJobPage';
// // import EditJobPage from './pages/EditJobPage';

// // const App = () => {
// //   // Add New Job — called by AddJobPage via prop addJobSubmit
// //   const addJob = async (newJob) => {
// //     const res = await fetch('/api/jobs', {
// //       method: 'POST',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify(newJob),
// //     });
// //     return;
// //   };

// //   // Delete Job — used by JobPage via prop deleteJob
// //   const deleteJob = async (id) => {
// //     const res = await fetch(`/api/jobs/${id}`, {
// //       method: 'DELETE',
// //     });
// //     return;
// //   };

// //   // Update Job
// //   // Update Job - used by EditJobPage via prop updateJobSubmit
// //   const updateJob = async (job) => {
// //     const res = await fetch(`/api/jobs/${job.id}`, {
// //       method: 'PUT',
// //       headers: {
// //         'Content-Type': 'application/json',
// //       },
// //       body: JSON.stringify(job),
// //     });
// //     return;
// //   };

// //   const router = createBrowserRouter(
// //     createRoutesFromElements(
// //         // Parent route: wraps all children with MainLayout (header/footer/etc.)
// //       <Route path='/' element={<MainLayout />}>
// //         {/* Public Routes */}
// //         <Route index element={<HomePage />} />
// //         <Route path='/jobs' element={<JobsPage />} />
// //         <Route path='/jobs/:id' element={<JobPage deleteJob={deleteJob} />} loader={jobLoader} />
// //         <Route path='/login' element={<LoginPage />} />
// //         <Route path='/register' element={<RegisterPage />} />
// //         <Route path='/unauthorized' element={<UnauthorizedPage />} />

// //         {/* Protected Routes - Employer Only */}
// //         <Route
// //           path='/add-job'
// //           element={
// //             <ProtectedRoute roles={['employer', 'admin']}>
// //               <AddJobPage addJobSubmit={addJob} />
// //             </ProtectedRoute>
// //           }
          
// //         />
// //         <Route
// //           path='/edit-job/:id'
// //           element={
// //             <ProtectedRoute roles={['employer', 'admin']}>
// //               <EditJobPage updateJobSubmit={updateJob} />
// //             </ProtectedRoute>
// //           }
// //           loader={jobLoader}
// //         />
// //         {/* Protected Routes - Employer Only */}
// //         <Route
// //           path='/jobs/:id'
// //           element={
// //             <ProtectedRoute roles={['employer', 'admin']}>
// //               <JobPage deleteJob={deleteJob} />
// //             </ProtectedRoute>
// //           }
// //           loader={jobLoader}
// //         />

// //         {/* Protected Routes - Developer Only */}
// //         <Route
// //           path='/my-applications'
// //           element={
// //             <ProtectedRoute roles={['developer']}>
// //               <div>My Applications Page</div>
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route
// //           path='/saved-jobs'
// //           element={
// //             <ProtectedRoute roles={['developer']}>
// //               <div>Saved Jobs Page</div>
// //             </ProtectedRoute>
// //           }
// //         />

// //         {/* Protected Routes - Employer Specific */}
// //         <Route
// //           path='/my-jobs'
// //           element={
// //             <ProtectedRoute roles={['employer']}>
// //               <div>My Posted Jobs Page</div>
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route
// //           path='/applications'
// //           element={
// //             <ProtectedRoute roles={['employer']}>
// //               <div>Job Applications Page</div>
// //             </ProtectedRoute>
// //           }
// //         />

// //         {/* Protected Routes - Admin Only */}
// //         <Route
// //           path='/admin'
// //           element={
// //             <ProtectedRoute roles={['admin']}>
// //               <div>Admin Dashboard</div>
// //             </ProtectedRoute>
// //           }
// //         />
// //         <Route
// //           path='/manage-users'
// //           element={
// //             <ProtectedRoute roles={['admin']}>
// //               <div>Manage Users Page</div>
// //             </ProtectedRoute>
// //           }
// //         />

// //         {/* Protected Routes - Any authenticated user */}
// //         <Route
// //           path='/profile'
// //           element={
// //             <ProtectedRoute>
// //               <div>User Profile Page</div>
// //             </ProtectedRoute>
// //           }
// //         />

// //         {/* Catch all route */}
// //         <Route path='*' element={<NotFoundPage />} />
// //       </Route>
// //     )
// //   );
// //   // Wrap all routes with AuthProvider so children can read auth/role from context
// //   return (
// //     <AuthProvider>
// //       <RouterProvider router={router} />
// //     </AuthProvider>
// //   );
// // };

// // export default App;
// import {
//   Route,
//   createBrowserRouter,
//   createRoutesFromElements,
//   RouterProvider,
// } from 'react-router-dom';
// import { AuthProvider } from './context/AuthContext';
// import ProtectedRoute from './components/ProtectedRoute';
// import MainLayout from './layouts/MainLayout';
// import HomePage from './pages/HomePage';
// import JobsPage from './pages/JobsPage';
// import NotFoundPage from './pages/NotFoundPage';
// import UnauthorizedPage from './pages/UnauthorizedPage';
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import JobPage, { jobLoader } from './pages/JobPage';
// import AddJobPage from './pages/AddJobPage';
// import EditJobPage from './pages/EditJobPage';

// const App = () => {
//   // Add New Job — called by AddJobPage via prop addJobSubmit
//   const addJob = async (newJob) => {
//     try {
//       const res = await fetch('/api/jobs', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(newJob),
//       });
      
//       if (!res.ok) {
//         throw new Error('Failed to add job');
//       }
      
//       return await res.json();
//     } catch (error) {
//       console.error('Error adding job:', error);
//       throw error;
//     }
//   };

//   // Delete Job — used by JobPage via prop deleteJob
//   const deleteJob = async (id) => {
//     try {
//       const res = await fetch(`/api/jobs/${id}`, {
//         method: 'DELETE',
//       });
      
//       if (!res.ok) {
//         throw new Error('Failed to delete job');
//       }
      
//       return true;
//     } catch (error) {
//       console.error('Error deleting job:', error);
//       throw error;
//     }
//   };

//   // Update Job - used by EditJobPage via prop updateJobSubmit
//   const updateJob = async (job) => {
//     try {
//       const res = await fetch(`/api/jobs/${job.id}`, {
//         method: 'PUT',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(job),
//       });
      
//       if (!res.ok) {
//         throw new Error('Failed to update job');
//       }
      
//       return await res.json();
//     } catch (error) {
//       console.error('Error updating job:', error);
//       throw error;
//     }
//   };

//   const router = createBrowserRouter(
//     createRoutesFromElements(
//       <Route path='/' element={<MainLayout />}>
//         {/* Public Routes */}
//         <Route index element={<HomePage />} />
//         <Route path='/jobs' element={<JobsPage />} />
//         <Route 
//           path='/jobs/:id' 
//           element={<JobPage deleteJob={deleteJob} />} 
//           loader={jobLoader} 
//         />
//         <Route path='/login' element={<LoginPage />} />
//         <Route path='/register' element={<RegisterPage />} />
//         <Route path='/unauthorized' element={<UnauthorizedPage />} />

//         {/* Protected Routes - Employer & Admin Only */}
//         <Route
//           path='/add-job'
//           element={
//             <ProtectedRoute roles={['employer', 'admin']}>
//               <AddJobPage addJobSubmit={addJob} />
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path='/edit-job/:id'
//           element={
//             <ProtectedRoute roles={['employer', 'admin']}>
//               <EditJobPage updateJobSubmit={updateJob} />
//             </ProtectedRoute>
//           }
//           loader={jobLoader}
//         />

//         {/* Protected Routes - Developer Only */}
//         <Route
//           path='/my-applications'
//           element={
//             <ProtectedRoute roles={['developer']}>
//               <div>My Applications Page</div>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path='/saved-jobs'
//           element={
//             <ProtectedRoute roles={['developer']}>
//               <div>Saved Jobs Page</div>
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Routes - Employer Specific */}
//         <Route
//           path='/my-jobs'
//           element={
//             <ProtectedRoute roles={['employer']}>
//               <div>My Posted Jobs Page</div>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path='/applications'
//           element={
//             <ProtectedRoute roles={['employer']}>
//               <div>Job Applications Page</div>
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Routes - Admin Only */}
//         <Route
//           path='/admin'
//           element={
//             <ProtectedRoute roles={['admin']}>
//               <div>Admin Dashboard</div>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path='/manage-users'
//           element={
//             <ProtectedRoute roles={['admin']}>
//               <div>Manage Users Page</div>
//             </ProtectedRoute>
//           }
//         />

//         {/* Protected Routes - Any authenticated user */}
//         <Route
//           path='/profile'
//           element={
//             <ProtectedRoute>
//               <div>User Profile Page</div>
//             </ProtectedRoute>
//           }
//         />

//         {/* Catch all route */}
//         <Route path='*' element={<NotFoundPage />} />
//       </Route>
//     )
//   );

//   return (
//     <AuthProvider>
//       <RouterProvider router={router} />
//     </AuthProvider>
//   );
// };

// export default App;
import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import JobPage, { jobLoader } from './pages/JobPage';
import AddJobPage from './pages/AddJobPage';
import EditJobPage from './pages/EditJobPage';

const App = () => {
  // Add New Job — called by AddJobPage via prop addJobSubmit
  const addJob = async (newJob) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });
      
      if (!res.ok) {
        throw new Error('Failed to add job');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error adding job:', error);
      throw error;
    }
  };

  // Delete Job — used by JobPage via prop deleteJob
  const deleteJob = async (id) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete job');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  // Update Job - used by EditJobPage via prop updateJobSubmit
  const updateJob = async (job) => {
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(job),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update job');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  };

  // Apply to Job - for developers to apply to jobs
  const applyToJob = async (jobId, applicationData) => {
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          jobId,
          ...applicationData,
          status: 'pending',
          appliedAt: new Date().toISOString()
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to submit application');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error applying to job:', error);
      throw error;
    }
  };

  // Save Job - for developers to save jobs for later
  const saveJob = async (jobId, developerId) => {
    try {
      const res = await fetch('/api/saved-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          jobId,
          developerId,
          savedAt: new Date().toISOString()
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to save job');
      }
      
      return await res.json();
    } catch (error) {
      console.error('Error saving job:', error);
      throw error;
    }
  };

  // Remove Saved Job
  const removeSavedJob = async (savedJobId) => {
    try {
      const res = await fetch(`/api/saved-jobs/${savedJobId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to remove saved job');
      }
      
      return true;
    } catch (error) {
      console.error('Error removing saved job:', error);
      throw error;
    }
  };

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path='/jobs' element={<JobsPage />} />
        <Route 
          path='/jobs/:id' 
          element={
            <JobPage 
              deleteJob={deleteJob} 
              applyToJob={applyToJob}
              saveJob={saveJob}
            />
          } 
          loader={jobLoader} 
        />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/unauthorized' element={<UnauthorizedPage />} />

        {/* Protected Routes - Employer & Admin Only */}
        <Route
          path='/add-job'
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <AddJobPage addJobSubmit={addJob} />
            </ProtectedRoute>
          }
        />
        <Route
          path='/edit-job/:id'
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <EditJobPage updateJobSubmit={updateJob} />
            </ProtectedRoute>
          }
          loader={jobLoader}
        />

        {/* Protected Routes - Developer Only */}
        <Route
          path='/my-applications'
          element={
            <ProtectedRoute roles={['developer']}>
              <div>My Applications Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path='/saved-jobs'
          element={
            <ProtectedRoute roles={['developer']}>
              <div>Saved Jobs Page</div>
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Employer Specific */}
        <Route
          path='/my-jobs'
          element={
            <ProtectedRoute roles={['employer']}>
              <div>My Posted Jobs Page</div>
            </ProtectedRoute>
          }
        />
        <Route
          path='/applications'
          element={
            <ProtectedRoute roles={['employer']}>
              <div>Job Applications Page</div>
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Admin Only */}
        <Route
          path='/admin'
          element={
            <ProtectedRoute roles={['admin']}>
              <div>Admin Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path='/manage-users'
          element={
            <ProtectedRoute roles={['admin']}>
              <div>Manage Users Page</div>
            </ProtectedRoute>
          }
        />

        {/* Protected Routes - Any authenticated user */}
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <div>User Profile Page</div>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path='*' element={<NotFoundPage />} />
      </Route>
    )
  );

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
