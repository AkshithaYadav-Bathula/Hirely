// import { NavLink } from 'react-router-dom';
// import logo from '../assets/images/logo.png';

// const Navbar = () => {
//   const linkClass = ({ isActive }) =>
//     isActive
//       ? 'bg-black text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
//       : 'text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2';

//   return (
//     <nav className='bg-indigo-700 border-b border-indigo-500'>
//       <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
//         <div className='flex h-20 items-center justify-between'>
//           <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
//             <NavLink className='flex flex-shrink-0 items-center mr-4' to='/'>
//               <img className='h-10 w-auto' src={logo} alt='React Jobs' />
//               <span className='hidden md:block text-white text-2xl font-bold ml-2'>
//                 React Jobs
//               </span>
//             </NavLink>
//             <div className='md:ml-auto'>
//               <div className='flex space-x-2'>
//                 <NavLink to='/' className={linkClass}>
//                   Home
//                 </NavLink>
//                 <NavLink to='/jobs' className={linkClass}>
//                   Jobs
//                 </NavLink>
//                 <NavLink to='/add-job' className={linkClass}>
//                   Add Job
//                 </NavLink>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };
// export default Navbar;
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/images/logo.png';

const Navbar = () => {
  const { user, logout, isAuthenticated, hasRole } = useAuth();

  const linkClass = ({ isActive }) =>
    isActive
      ? 'bg-black text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
      : 'text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2';

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className='bg-indigo-700 border-b border-indigo-500'>
      <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
        <div className='flex h-20 items-center justify-between'>
          <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
            <NavLink className='flex flex-shrink-0 items-center mr-4' to='/'>
              <img className='h-10 w-auto' src={logo} alt='React Jobs' />
              <span className='hidden md:block text-white text-2xl font-bold ml-2'>
                React Jobs
              </span>
            </NavLink>
            
            <div className='md:ml-auto flex items-center space-x-4'>
              <div className='flex space-x-2'>
                {/* Public routes - available to everyone */}
                <NavLink to='/' className={linkClass}>
                  Home
                </NavLink>
                <NavLink to='/jobs' className={linkClass}>
                  Jobs
                </NavLink>

                {/* Routes based on authentication and roles */}
                {isAuthenticated() ? (
                  <>
                    {/* Developer-specific routes */}
                    {hasRole('developer') && (
                      <>
                        <NavLink to='/my-applications' className={linkClass}>
                          My Applications
                        </NavLink>
                        <NavLink to='/saved-jobs' className={linkClass}>
                          Saved Jobs
                        </NavLink>
                      </>
                    )}

                    {/* Employer-specific routes */}
                    {hasRole('employer') && (
                      <>
                        <NavLink to='/add-job' className={linkClass}>
                          Post Job
                        </NavLink>
                        <NavLink to='/my-jobs' className={linkClass}>
                          My Jobs
                        </NavLink>
                        <NavLink to='/applications' className={linkClass}>
                          Applications
                        </NavLink>
                      </>
                    )}

                    {/* Admin-specific routes */}
                    {hasRole('admin') && (
                      <>
                        <NavLink to='/admin' className={linkClass}>
                          Admin Panel
                        </NavLink>
                        <NavLink to='/manage-users' className={linkClass}>
                          Manage Users
                        </NavLink>
                        <NavLink to='/add-job' className={linkClass}>
                          Add Job
                        </NavLink>
                      </>
                    )}

                    {/* User menu */}
                    <div className='relative flex items-center space-x-2'>
                      <span className='text-white text-sm'>
                        Hi, {user?.firstName}
                      </span>
                      <span className='text-indigo-200 text-xs'>
                        ({user?.role})
                      </span>
                      <NavLink to='/profile' className={linkClass}>
                        Profile
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className='text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
                      >
                        Logout
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Authentication routes for non-logged-in users */}
                    <NavLink to='/login' className={linkClass}>
                      Login
                    </NavLink>
                    <NavLink to='/register' className={linkClass}>
                      Register
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;