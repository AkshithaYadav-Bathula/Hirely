import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { validateEmail } from '../utils/validateEmail';

const LoginPage = () => {
  const [accountType, setAccountType] = useState('user'); // 'user' or 'company'
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyEmail: '',
    companyPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination or default to home
  const from = location.state?.from?.pathname || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (e.target.name === 'email' || e.target.name === 'companyEmail') {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (accountType === 'company') {
      // Company Login
      if (!formData.companyEmail || !formData.companyPassword) {
        toast.error('Please fill in all fields');
        return;
      }
      
      if (!validateEmail(formData.companyEmail)) {
        setEmailError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }

      setLoading(true);

      // Pass 'company' as third parameter to indicate company login
      const result = await login(formData.companyEmail, formData.companyPassword, 'company');
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/company-dashboard'); // Navigate to company dashboard
      } else {
        toast.error(result.error || 'Invalid company credentials');
      }
      
      setLoading(false);

    } else {
      // User Login
      if (!formData.email || !formData.password) {
        toast.error('Please fill in all fields');
        return;
      }
      
      if (!validateEmail(formData.email)) {
        setEmailError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }

      setLoading(true);

      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Login failed');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* Account Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sign in as:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAccountType('user')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  accountType === 'user'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">👤</div>
                <div className="font-medium">Individual User</div>
                <div className="text-xs text-gray-500 mt-1">
                  Job Seeker or Employer
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAccountType('company')}
                className={`p-4 border-2 rounded-lg text-center transition-all ${
                  accountType === 'company'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-2xl mb-2">🏢</div>
                <div className="font-medium">Company</div>
                <div className="text-xs text-gray-500 mt-1">
                  Organization Account
                </div>
              </button>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</h3>
            <div className="text-xs text-blue-700 space-y-1">
              {accountType === 'user' ? (
                <>
                  <p><strong>Admin:</strong> admin@example.com / admin123</p>
                  <p><strong>Employer:</strong> employer@example.com / emp123</p>
                  <p><strong>Developer:</strong> dev@example.com / dev123</p>
                </>
              ) : (
                <>
                  <p><strong>NewTek Solutions:</strong> admin@newteksolutions.com / newtek@2024</p>
                  <p><strong>L4G Solutions:</strong> l4g@gmail.com / l4g123</p>
                  <p><strong>Veneer Solutions:</strong> admin@veneer.com / veneer@2024</p>
                </>
              )}
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {accountType === 'company' ? (
              <>
                {/* Company Email */}
                <div>
                  <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                    Company Email
                  </label>
                  <input
                    id="companyEmail"
                    name="companyEmail"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.companyEmail}
                    onChange={handleChange}
                    onBlur={() => {
                      if (!validateEmail(formData.companyEmail)) {
                        setEmailError('Please enter a valid email address');
                      } else {
                        setEmailError('');
                      }
                    }}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                      emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="company@example.com"
                  />
                  {emailError && (
                    <div className='mt-1 text-red-600 text-sm flex items-center'>
                      {emailError}
                    </div>
                  )}
                </div>

                {/* Company Password */}
                <div>
                  <label htmlFor="companyPassword" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="companyPassword"
                    name="companyPassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.companyPassword}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter company password"
                  />
                </div>
              </>
            ) : (
              <>
                {/* User Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => {
                      if (!validateEmail(formData.email)) {
                        setEmailError('Please enter a valid email address');
                      } else {
                        setEmailError('');
                      }
                    }}
                    className={`mt-1 appearance-none block w-full px-3 py-2 border ${
                      emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    } rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                    placeholder="Enter your email"
                  />
                  {emailError && (
                    <div className='mt-1 text-red-600 text-sm flex items-center'>
                      {emailError}
                    </div>
                  )}
                </div>

                {/* User Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                  />
                </div>
              </>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  `Sign in as ${accountType === 'company' ? 'Company' : 'User'}`
                )}
              </button>
            </div>
          </form>

          {/* Additional Links */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {accountType === 'company' ? "Don't have a company account?" : 'Need an account?'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create new {accountType === 'company' ? 'company' : 'account'}
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
