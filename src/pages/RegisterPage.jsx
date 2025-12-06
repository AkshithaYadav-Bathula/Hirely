import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import SkillsDropdown from '../components/SkillsDropdown';
import { validateEmail } from '../utils/validateEmail';
import { usersAPI } from '../utils/api';

const RegisterPage = () => {
  const [emailError, setEmailError] = useState('');
  const [companies, setCompanies] = useState([]);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const [accountType, setAccountType] = useState('user'); // 'user' or 'company'
  
  const [formData, setFormData] = useState({
    // Common fields
    email: '',
    password: '',
    confirmPassword: '',
    
    // User-specific fields
    firstName: '',
    lastName: '',
    role: 'developer', // developer or employer
    companyId: '', // for employers joining existing company
    position: '', // for employers
    skills: [], // for developers
    
    // Company-specific fields
    companyName: '',
    companyEmail: '',
    companyPassword: '',
    confirmCompanyPassword: '',
    headquarters: '',
    contactPhone: '',
    website: '',
    industry: '',
    companySize: '1-10',
    description: '',
    linkedin: '',
    twitter: '',
    facebook: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Add useEffect to monitor skills changes
  useEffect(() => {
    console.log('👀 Skills state changed:', formData.skills);
    console.log('👀 Skills type:', typeof formData.skills, Array.isArray(formData.skills));
  }, [formData.skills]);

  // Fetch companies when employer is selected
  useEffect(() => {
    if (accountType === 'user' && formData.role === 'employer') {
      fetchCompanies();
    }
  }, [accountType, formData.role]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('http://localhost:8000/companies');
      const data = await res.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'email' || name === 'companyEmail') {
      setEmailError('');
    }
    
    // Handle company selection
    if (name === 'companyId') {
      if (value === 'new') {
        setShowNewCompanyForm(true);
        setFormData({ ...formData, companyId: '' });
      } else {
        setShowNewCompanyForm(false);
        setFormData({ ...formData, companyId: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSkillsChange = (skills) => {
    console.log('🎯 Skills selected in handleSkillsChange:', skills);
    console.log('🎯 Skills type:', typeof skills, Array.isArray(skills));
    console.log('🎯 Skills length:', skills?.length);
    console.log('🎯 Raw skills data:', JSON.stringify(skills));
    
    setFormData(prev => {
      const updated = { 
        ...prev, 
        skills: Array.isArray(skills) ? skills : [] 
      };
      console.log('🔄 Updated formData.skills:', updated.skills);
      console.log('🔄 Full updated formData:', updated);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Add debugging for skills validation
    console.log('📋 Form data before validation:', formData);
    console.log('🎯 Selected skills:', formData.skills);
    console.log('🔢 Skills length:', formData.skills?.length || 0);
    console.log('🔢 Skills array check:', Array.isArray(formData.skills));

    // Validation based on account type
    if (accountType === 'company') {
      // Company registration validation (still uses local server)
      if (!validateEmail(formData.companyEmail)) {
        setEmailError('Please enter a valid company email address');
        toast.error('Please enter a valid company email address');
        return;
      }

      if (formData.companyPassword !== formData.confirmCompanyPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.companyPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // Check if company email already exists (local server for companies)
      try {
        const res = await fetch('http://localhost:8000/companies');
        const companies = await res.json();
        const emailExists = companies.some(
          c => c.email?.toLowerCase() === formData.companyEmail.toLowerCase()
        );
        
        if (emailExists) {
          setEmailError('Company email already exists');
          toast.error('Company email already exists');
          return;
        }
      } catch (err) {
        toast.error('Could not validate email');
        return;
      }

      setLoading(true);

      // Create company (still uses local server)
      const newCompany = {
        id: `c${Date.now()}`,
        name: formData.companyName,
        email: formData.companyEmail,
        password: formData.companyPassword,
        description: formData.description || '',
        logo: '',
        website: formData.website || '',
        industry: formData.industry || '',
        sector: '',
        companySize: formData.companySize,
        numberOfEmployees: 0,
        foundedYear: new Date().getFullYear(),
        headquarters: formData.headquarters || '',
        contactEmail: formData.companyEmail,
        contactPhone: formData.contactPhone || '',
        socialLinks: {
          linkedin: formData.linkedin || '',
          twitter: formData.twitter || '',
          facebook: formData.facebook || ''
        },
        benefits: [],
        culture: '',
        createdAt: new Date().toISOString(),
        isActive: true
      };

      try {
        const response = await fetch('http://localhost:8000/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCompany)
        });

        if (response.ok) {
          toast.success('Company registered successfully! Please login.');
          navigate('/login');
        } else {
          throw new Error('Failed to register company');
        }
      } catch (error) {
        console.error('Registration error:', error);
        toast.error('Registration failed. Please try again.');
      }

      setLoading(false);

    } else {
      // USER REGISTRATION - NOW USES ONLY STRAPI
      if (!validateEmail(formData.email)) {
        setEmailError('Please enter a valid email address');
        toast.error('Please enter a valid email address');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      // For employers, require company selection or new company
      if (formData.role === 'employer' && !formData.companyId && !showNewCompanyForm) {
        toast.error('Please select a company or register a new one');
        return;
      }

      // For developers, require at least one skill
      if (formData.role === 'developer') {
        console.log('🔍 Validating developer skills...');
        console.log('🔍 formData.skills:', formData.skills);
        console.log('🔍 formData.skills type:', typeof formData.skills);
        console.log('🔍 formData.skills Array.isArray:', Array.isArray(formData.skills));
        console.log('🔍 formData.skills length:', formData.skills?.length);
        
        const skillsArray = Array.isArray(formData.skills) ? formData.skills : [];
        console.log('🔍 skillsArray after conversion:', skillsArray);
        console.log('🔍 skillsArray length:', skillsArray.length);
        
        if (skillsArray.length === 0) {
          console.log('❌ Skills validation failed - no skills selected');
          toast.error('Please select at least one skill');
          setLoading(false);
          return;
        }
        
        console.log('✅ Skills validation passed');
      }

      setLoading(true);

      // Check if user email already exists - USE ONLY STRAPI
      try {
        console.log('🔍 Checking if email exists in Strapi:', formData.email);
        
        // const existingUser = await usersAPI.getByEmail(formData.email);
        // In RegisterPage.jsx - Line ~189
        const existingUser = await usersAPI.getByEmail(formData.email);
        console.log('📊 Existing user check result:', existingUser);
        
        if (existingUser) {
          console.log('❌ Email already exists in Strapi');
          setEmailError('Email already exists');
          toast.error('Email already exists');
          setLoading(false);
          return;
        }
        
        console.log('✅ Email is available for registration');
        
      } catch (err) {
        console.error('❌ Email validation error:', err);
        toast.error('Could not validate email with server');
        setLoading(false);
        return;
      }

      // If employer is registering new company (still uses local server for companies)
      let companyId = formData.companyId;
      
      if (formData.role === 'employer' && showNewCompanyForm) {
        const newCompany = {
          id: `c${Date.now()}`,
          name: formData.companyName,
          email: formData.companyEmail || formData.email,
          password: formData.password,
          description: formData.description || '',
          logo: '',
          website: formData.website || '',
          industry: formData.industry || '',
          sector: '',
          companySize: formData.companySize,
          numberOfEmployees: 1,
          foundedYear: new Date().getFullYear(),
          headquarters: formData.headquarters || '',
          contactEmail: formData.companyEmail || formData.email,
          contactPhone: formData.contactPhone || '',
          socialLinks: {
            linkedin: formData.linkedin || '',
            twitter: formData.twitter || '',
            facebook: formData.facebook || ''
          },
          benefits: [],
          culture: '',
          createdAt: new Date().toISOString(),
          isActive: true
        };

        try {
          const response = await fetch('http://localhost:8000/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newCompany)
          });

          if (response.ok) {
            const createdCompany = await response.json();
            companyId = createdCompany.id;
          } else {
            throw new Error('Failed to create company');
          }
        } catch (error) {
          console.error('Company creation error:', error);
          toast.error('Failed to create company');
          setLoading(false);
          return;
        }
      }

      // Register user - USES STRAPI (via AuthContext)
      const userData = {
        ...formData,
        companyId: formData.role === 'employer' ? companyId : null,
        // Ensure skills is always an array
        skills: Array.isArray(formData.skills) ? formData.skills : []
      };

      console.log('📤 Sending user data to registration:', userData);
      const result = await register(userData);

      if (result.success) {
        toast.success('Registration successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Registration failed');
      }

      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* Account Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I want to register as:
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
                    Register your organization
                  </div>
                </button>
              </div>
            </div>

            {/* COMPANY REGISTRATION FORM */}
            {accountType === 'company' ? (
              <>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Company Information
                  </h3>

                  {/* Company Name */}
                  <div className="mb-4">
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter company name"
                    />
                  </div>

                  {/* Company Email */}
                  <div className="mb-4">
                    <label htmlFor="companyEmail" className="block text-sm font-medium text-gray-700">
                      Company Email *
                    </label>
                    <input
                      id="companyEmail"
                      name="companyEmail"
                      type="email"
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
                      className={`mt-1 block w-full px-3 py-2 border ${
                        emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="company@example.com"
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>

                  {/* Company Password */}
                  <div className="mb-4">
                    <label htmlFor="companyPassword" className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <input
                      id="companyPassword"
                      name="companyPassword"
                      type="password"
                      required
                      value={formData.companyPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  {/* Confirm Company Password */}
                  <div className="mb-4">
                    <label htmlFor="confirmCompanyPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password *
                    </label>
                    <input
                      id="confirmCompanyPassword"
                      name="confirmCompanyPassword"
                      type="password"
                      required
                      value={formData.confirmCompanyPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Headquarters */}
                  <div className="mb-4">
                    <label htmlFor="headquarters" className="block text-sm font-medium text-gray-700">
                      Headquarters Location *
                    </label>
                    <input
                      id="headquarters"
                      name="headquarters"
                      type="text"
                      required
                      value={formData.headquarters}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Contact Phone */}
                  <div className="mb-4">
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  {/* Website */}
                  <div className="mb-4">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="https://www.example.com"
                    />
                  </div>

                  {/* Industry */}
                  <div className="mb-4">
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                      Industry
                    </label>
                    <select
                      id="industry"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Industry</option>
                      <option value="Technology">Technology</option>
                      <option value="Finance">Finance</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Marketing">Marketing & Advertising</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Company Size */}
                  <div className="mb-4">
                    <label htmlFor="companySize" className="block text-sm font-medium text-gray-700">
                      Company Size
                    </label>
                    <select
                      id="companySize"
                      name="companySize"
                      value={formData.companySize}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="1-10">1-10 employees</option>
                      <option value="11-50">11-50 employees</option>
                      <option value="51-200">51-200 employees</option>
                      <option value="201-500">201-500 employees</option>
                      <option value="500+">500+ employees</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Company Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Brief description of your company"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Social Media Links (Optional)
                    </label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">🔗</span>
                        <input
                          name="linkedin"
                          type="url"
                          value={formData.linkedin}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="LinkedIn URL"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-blue-400">🐦</span>
                        <input
                          name="twitter"
                          type="url"
                          value={formData.twitter}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Twitter URL"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-blue-700">📘</span>
                        <input
                          name="facebook"
                          type="url"
                          value={formData.facebook}
                          onChange={handleChange}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Facebook URL"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* USER REGISTRATION FORM */}
                <div className="border-t pt-6">
                  
                  {/* Role Selection */}
                  <div className="mb-4">
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      I am a *
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="developer">Job Seeker/Developer</option>
                      <option value="employer">Employer/Recruiter</option>
                    </select>
                  </div>

                  {/* First Name */}
                  <div className="mb-4">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="mb-4">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
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
                      className={`mt-1 block w-full px-3 py-2 border ${
                        emailError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                      } rounded-md focus:ring-indigo-500 focus:border-indigo-500`}
                      placeholder="you@example.com"
                    />
                    {emailError && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>

                  {/* Employer-specific: Company Selection */}
                  {formData.role === 'employer' && (
                    <>
                      <div className="mb-4">
                        <label htmlFor="companyId" className="block text-sm font-medium text-gray-700">
                          Select Company *
                        </label>
                        <select
                          id="companyId"
                          name="companyId"
                          value={formData.companyId || ''}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">-- Select a Company --</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                          <option value="new">➕ Register New Company</option>
                        </select>
                      </div>

                      {/* Show new company form if "Register New Company" is selected */}
                      {showNewCompanyForm && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">
                            New Company Details
                          </h4>
                          
                          <div className="space-y-3">
                            <input
                              name="companyName"
                              type="text"
                              required
                              value={formData.companyName}
                              onChange={handleChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Company Name *"
                            />
                            
                            <input
                              name="headquarters"
                              type="text"
                              value={formData.headquarters}
                              onChange={handleChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Headquarters Location"
                            />
                            
                            <input
                              name="website"
                              type="url"
                              value={formData.website}
                              onChange={handleChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Company Website"
                            />
                            
                            <select
                              name="industry"
                              value={formData.industry}
                              onChange={handleChange}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              <option value="">Select Industry</option>
                              <option value="Technology">Technology</option>
                              <option value="Finance">Finance</option>
                              <option value="Healthcare">Healthcare</option>
                              <option value="Education">Education</option>
                              <option value="E-commerce">E-commerce</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="mb-4">
                        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                          Your Position/Role *
                        </label>
                        <input
                          id="position"
                          name="position"
                          type="text"
                          required
                          value={formData.position}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="e.g., HR Manager, Recruiter"
                        />
                      </div>
                    </>
                  )}

                  {/* Developer-specific: Skills */}
                  {formData.role === 'developer' && (
                    <div className="mb-4">
                      <SkillsDropdown
                        selectedSkills={formData.skills}
                        onSkillsChange={handleSkillsChange}
                        maxSkills={5}
                      />
                    </div>
                  )}

                  {/* Password */}
                  <div className="mb-4">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Minimum 6 characters"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Debug Info for Developer Role - REMOVE LATER */}
            {formData.role === 'developer' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-sm font-medium text-yellow-800">Debug Info:</h4>
                <div className="text-xs text-yellow-700 mt-2">
                  <p><strong>Skills State:</strong> {JSON.stringify(formData.skills)}</p>
                  <p><strong>Skills Length:</strong> {formData.skills?.length || 0}</p>
                  <p><strong>Is Array:</strong> {Array.isArray(formData.skills).toString()}</p>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🧪 Current form state:', formData);
                      console.log('🧪 Skills specifically:', formData.skills);
                    }}
                    className="mt-2 px-3 py-1 bg-yellow-200 text-yellow-800 rounded text-xs"
                  >
                    Log Current State
                  </button>
                </div>
              </div>
            )}

            {/* Manual Test Button - TEMPORARY */}
            {formData.role === 'developer' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800">🧪 Test Skills Function:</h4>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🧪 Manually setting skills to Redux...');
                      const testSkills = ["7"]; // Assuming Redux has ID 7
                      handleSkillsChange(testSkills);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    Set Redux Skill
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🧪 Manually setting multiple skills...');
                      const testSkills = ["1", "2"]; // JavaScript and React
                      handleSkillsChange(testSkills);
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                  >
                    Set JS + React
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      console.log('🧪 Clearing skills...');
                      handleSkillsChange([]);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded text-xs"
                  >
                    Clear Skills
                  </button>
                </div>
              </div>
            )}

            {/* Debug: Check Existing Emails - TEMPORARY */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-800">🔍 Debug: Check Existing Emails</h4>
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('🔍 Fetching all users from Strapi...');
                    const allUsers = await usersAPI.getAll();
                    console.log('📊 All users in Strapi:', allUsers);
                    
                    // const emails = allUsers.map(user => {
                    //   const userAttributes = user.attributes || user;
                    //   return userAttributes.email;
                    // });
                    const emails = allUsers.map(user => user.attributes?.userInfo?.email);

                    
                    console.log('📧 All emails in Strapi:', emails);
                    toast.info(`Found ${emails.length} users in Strapi. Check console for emails.`);
                    
                    // Check specific email
                    const testEmail = formData.email;
                    if (testEmail) {
                      console.log(`🔍 Checking specific email: ${testEmail}`);
                      const existingUser = await usersAPI.getByEmail(testEmail);
                      console.log('📊 User check result:', existingUser);
                      
                      if (existingUser) {
                        const userAttributes = existingUser.attributes || existingUser;
                        toast.error(`Email ${testEmail} already exists! User: ${userAttributes.firstName} ${userAttributes.lastName}`);
                      } else {
                        toast.success(`Email ${testEmail} is available!`);
                      }
                    }
                    
                  } catch (error) {
                    console.error('❌ Error checking emails:', error);
                    toast.error('Failed to check emails');
                  }
                }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-xs"
              >
                Check Existing Emails
              </button>
            </div>

            {/* Enhanced Debug: Check Strapi API Structure - TEMPORARY */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <h4 className="text-sm font-medium text-gray-800">🔍 Enhanced Debug: Check Strapi Structure</h4>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      console.log('🔍 Testing direct Strapi API call...');
                      
                      // Test direct API call
                      const response = await fetch('http://3.6.11.114/api/test1s', {
                        headers: {
                          'Authorization': `Bearer 9d4865bb56226b5815f3e9cfd52bc377b8eb2fdc2b86f573b75edea4a62a61254ed373945e5dc1a047c4a09c24d91b1d650615a452c1147996f53a690b416bd6f3cdd00b50652c811816d4dc53c58b42a041c956f994877adb54df9d03b8da2ca5c4bf687e86cc843462da733472981932fa511a249a65ee49a5f43fa4077d8e`,
                        },
                      });
                      
                      const rawData = await response.json();
                      console.log('📊 Raw Strapi API Response:', rawData);
                      console.log('📊 Response structure:', {
                        data: rawData.data,
                        meta: rawData.meta,
                        keys: Object.keys(rawData),
                      });
                      
                      if (rawData.data && rawData.data.length > 0) {
                        console.log('📊 First user structure:', rawData.data[0]);
                        console.log('📊 First user keys:', Object.keys(rawData.data[0]));
                        console.log('📊 First user attributes:', rawData.data[0].attributes);
                      }
                      
                      toast.info(`Raw API returned ${rawData.data?.length || 0} users. Check console for structure.`);
                      
                    } catch (error) {
                      console.error('❌ Direct API call failed:', error);
                      toast.error('Direct API call failed');
                    }
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs"
                >
                  Test Direct API
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      console.log('🔍 Testing usersAPI.getAll()...');
                      const allUsers = await usersAPI.getAll();
                      console.log('📊 usersAPI.getAll() result:', allUsers);
                      
                      if (allUsers && allUsers.length > 0) {
                        console.log('📊 First user from usersAPI:', allUsers[0]);
                        console.log('📊 First user keys:', Object.keys(allUsers[0]));
                      }
                      
                      toast.info(`usersAPI returned ${allUsers?.length || 0} users. Check console.`);
                      
                    } catch (error) {
                      console.error('❌ usersAPI.getAll() failed:', error);
                      toast.error('usersAPI failed');
                    }
                  }}
                  className="px-3 py-1 bg-green-500 text-white rounded text-xs"
                >
                  Test usersAPI
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    const testEmail = formData.email || 'dev@example.com';
                    try {
                      console.log(`🔍 Testing email check for: ${testEmail}`);
                      
                      // Test email check
                      const existingUser = await usersAPI.getByEmail(testEmail);
                      console.log('📊 Email check result:', existingUser);
                      
                      if (existingUser) {
                        console.log('📊 User found - ID:', existingUser.id);
                        console.log('📊 User attributes:', existingUser.attributes);
                        console.log('📊 Full user object keys:', Object.keys(existingUser));
                        
                        const userAttributes = existingUser.attributes || existingUser;
                        console.log('📊 User attributes keys:', Object.keys(userAttributes));
                        console.log('📊 User email from attributes:', userAttributes.email);
                        
                        toast.info(`Found user ${existingUser.id}. Check console for details.`);
                      } else {
                        toast.success(`Email ${testEmail} is available!`);
                      }
                      
                    } catch (error) {
                      console.error('❌ Email check failed:', error);
                      toast.error('Email check failed');
                    }
                  }}
                  className="px-3 py-1 bg-purple-500 text-white rounded text-xs"
                >
                  Test Email Check
                </button>
              </div>
            </div>

            {/* Test userInfo Creation - TEMPORARY */}
            <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
              <h4 className="text-sm font-medium text-purple-800">🧪 Test User Creation:</h4>
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log('🧪 Testing user creation with required userInfo...');
                    
                    const testUser = {
                      firstName: "TestUser",
                      lastName: "WithInfo",
                      email: "testinfo@example.com",
                      password: "test123",
                      role: "developer",
                      skills: ["1", "2"],
                      isActive: true
                    };
                    
                    console.log('📤 Creating test user with userInfo:', testUser);
                    const result = await usersAPI.create(testUser);
                    console.log('✅ Test user with userInfo created:', result);
                    
                    toast.success('Test user with userInfo created! Check Strapi.');
                    
                  } catch (error) {
                    console.error('❌ Test user creation failed:', error);
                    toast.error(`Test failed: ${error.message}`);
                  }
                }}
                className="px-3 py-1 bg-purple-500 text-white rounded text-xs"
              >
                Test userInfo Creation
              </button>
            </div>

            {/* Submit Button */}
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
                    Creating account...
                  </span>
                ) : (
                  `Create ${accountType === 'company' ? 'Company' : 'Account'}`
                )}
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;