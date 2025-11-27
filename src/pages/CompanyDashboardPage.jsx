import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaUsers, 
  FaBriefcase, 
  FaChartLine, 
  FaDollarSign,
  FaBuilding,
  FaStar,
  FaProjectDiagram,
  FaUserTie,
  FaEye,
  FaEdit,
  FaPlus,
  FaArrowUp
} from 'react-icons/fa';
import { Link, useSearchParams } from 'react-router-dom';

const CompanyDashboardPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('companyId');
  const [dashboardData, setDashboardData] = useState({
    company: null,
    totalJobs: 0,
    activeJobs: 0,
    totalEmployees: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    analytics: null,
    jobs: [],
    employees: [],
    recentApplications: []
  });
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState(null);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || (user.role !== 'employer' && user.role !== 'company')) {

        setLoading(false);
        return;
      }

      try {
        // const companyId = user.companyId;
        const compId = user.role === 'company' ? user.id : user.companyId;
        
        // Fetch company data
        const [companyRes, jobsRes, usersRes, applicationsRes] = await Promise.all([
          fetch(`http://localhost:8000/companies/${compId}`),
          fetch(`http://localhost:8000/jobs?companyId=${compId}`),
          fetch(`http://localhost:8000/users`),
          fetch(`http://localhost:8000/applications`)
        ]);

        const company = await companyRes.json();
        const jobs = await jobsRes.json();
        const users = await usersRes.json();
        const applications = await applicationsRes.json();

        // Filter employees for this company
        const employees = users.filter(u => 
          String(u.companyId) === String(compId) && u.role === 'employer'
        );

        // Filter applications for company's jobs
        const jobIds = jobs.map(job => job.id);
        const companyApplications = applications.filter(app => 
          jobIds.includes(app.jobId)
        );

        // Calculate analytics
        const activeJobs = jobs.filter(job => job.status === 'active').length;
        const pendingApplications = companyApplications.filter(app => app.status === 'pending').length;
        const acceptedApplications = companyApplications.filter(app => app.status === 'accepted').length;

        // Sort applications by date for recent applications
        const recentApplications = companyApplications
          .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
          .slice(0, 5);

        setDashboardData({
          company,
          totalJobs: jobs.length,
          activeJobs,
          totalEmployees: employees.length,
          totalApplications: companyApplications.length,
          pendingApplications,
          acceptedApplications,
          analytics: company.analytics || null,
          jobs,
          employees,
          recentApplications
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
      
      setLoading(false);
    };

    const fetchCompanyData = async () => {
      if (companyId) {
        try {
          const response = await fetch(`http://localhost:8000/companies/${companyId}`);
          if (response.ok) {
            const company = await response.json();
            setCompanyData(company);
            setIsEditingCompany(true); // Set editing mode for company
          }
        } catch (error) {
          console.error('Error fetching company data:', error);
        }
      }
    };

    fetchDashboardData();
    fetchCompanyData();
  }, [user, companyId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const updatedCompanyData = {
        ...companyData,
        ...formData
      };

      const response = await fetch(`http://localhost:8000/companies/${companyData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompanyData),
      });

      if (response.ok) {
        const savedCompany = await response.json();
        setCompanyData(savedCompany);
        // Also update the main dashboard data
        setDashboardData(prev => ({
          ...prev,
          company: savedCompany
        }));
        alert('Company profile updated successfully!');
      } else {
        throw new Error('Failed to update company profile');
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'employer' && user.role !== 'company'))  {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">Only employers can access the company dashboard.</p>
        </div>
      </div>
    );
  }

  const { company, analytics } = dashboardData;

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Company Not Found</h2>
          <p className="text-gray-600">Unable to load company information.</p>
        </div>
      </div>
    );
  }

  if (companyId && companyData) {
    // Render company profile editing form instead of user profile
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center mb-8">
              <img
                src={companyData.logo || 'https://placehold.co/100x100?text=Logo'}
                alt={companyData.name}
                className="w-24 h-24 rounded-lg object-cover mr-6"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{companyData.name}</h1>
                <p className="text-gray-600">{companyData.industry}</p>
                <p className="text-sm text-gray-500">Company ID: {companyData.id}</p>
              </div>
            </div>
            
            {/* Company editing form - REPLACE THE EXISTING FORM */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.name || companyData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || companyData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry || companyData.industry || ''}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size
                  </label>
                  <input
                    type="text"
                    value={formData.companySize || companyData.companySize || ''}
                    onChange={(e) => handleInputChange('companySize', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={formData.foundedYear || companyData.foundedYear || ''}
                    onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headquarters
                  </label>
                  <input
                    type="text"
                    value={formData.headquarters || companyData.headquarters || ''}
                    onChange={(e) => handleInputChange('headquarters', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || companyData.website || ''}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail || companyData.contactEmail || ''}
                  onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex space-x-4">
                <button 
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <Link
                  to="/company-dashboard"
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={company.logo || 'https://placehold.co/60x60?text=Logo'}
                  alt={company.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  Good Afternoon, {company.name}!
                </h1>
                <p className="text-indigo-200 mt-1">
                  {company.industry} • {company.companySize} employees
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <Link
                to={`/company-dashboard?companyId=${company.id}`}  // ← CHANGED: Stay on company dashboard
                className="text-white hover:text-indigo-200 transition-colors flex items-center space-x-2"
              >
                <FaEdit />
                <span>Settings</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Overview Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaBuilding className="mr-3 text-indigo-600" />
              Company Overview
            </h2>
            <Link
              to={`/company/${company.id}`}  // ← CHANGED: Now goes to company profile instead of /profile
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <FaEye />
              <span>View Public Profile</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Company Name:</span>
                <span className="ml-2 text-gray-900">{company.name}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Company ID:</span>
                <span className="ml-2 text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                  {company.id}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Industry:</span>
                <span className="ml-2 text-gray-900">{company.industry}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Company Size:</span>
                <span className="ml-2 text-gray-900">{company.companySize}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Founded:</span>
                <span className="ml-2 text-gray-900">{company.foundedYear || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 font-medium">Location:</span>
                <span className="ml-2 text-gray-900">{company.headquarters || 'N/A'}</span>
              </div>
            </div>
            <div>
              <p className="text-gray-600 font-medium mb-2">Description:</p>
              <p className="text-gray-700 text-sm leading-relaxed">
                {company.description || 'No description available.'}
              </p>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employees */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">TOTAL EMPLOYEES</p>
                <p className="text-3xl font-bold mt-1">{dashboardData.totalEmployees}</p>
                <p className="text-blue-100 text-xs mt-1">👥 Active employees</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FaUsers className="text-2xl" />
              </div>
            </div>
          </div>

          {/* Total Jobs */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">TOTAL JOBS</p>
                <p className="text-3xl font-bold mt-1">{dashboardData.totalJobs}</p>
                <p className="text-purple-100 text-xs mt-1">📊 {dashboardData.activeJobs} active</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FaBriefcase className="text-2xl" />
              </div>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">MONTHLY REVENUE</p>
                <p className="text-3xl font-bold mt-1">
                  ₹{analytics?.monthlyRevenue ? (analytics.monthlyRevenue / 100000).toFixed(1) : '0'}L
                </p>
                <p className="text-green-100 text-xs mt-1">📈 {analytics?.monthlyGrowth || 0}% growth</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FaDollarSign className="text-2xl" />
              </div>
            </div>
          </div>

          {/* Active Projects */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">ACTIVE PROJECTS</p>
                <p className="text-3xl font-bold mt-1">{analytics?.activeProjects || 0}</p>
                <p className="text-orange-100 text-xs mt-1">🚀 In progress</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FaProjectDiagram className="text-2xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <FaArrowUp className="mr-3 text-indigo-600" />
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/add-job"
              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 text-white p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                  <FaPlus />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Add Employee</h3>
                  <p className="text-blue-600 text-sm">Create new employee account</p>
                </div>
              </div>
            </Link>

            <Link
              to={`/company-dashboard?companyId=${company.id}`}  // ← CHANGED: Stay on company dashboard
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 text-white p-2 rounded-lg group-hover:bg-purple-600 transition-colors">
                  <FaEdit />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900">Edit Profile</h3>
                  <p className="text-purple-600 text-sm">Update company information</p>
                </div>
              </div>
            </Link>

            <Link
              to="/my-jobs"
              className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 text-white p-2 rounded-lg group-hover:bg-green-600 transition-colors">
                  <FaChartLine />
                </div>
                <div>
                  <h3 className="font-semibold text-green-900">View Reports</h3>
                  <p className="text-green-600 text-sm">Analytics and statistics</p>
                </div>
              </div>
            </Link>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 group">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-500 text-white p-2 rounded-lg">
                  <FaUserTie />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Manage Employees</h3>
                  <p className="text-orange-600 text-sm">View and edit employees</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Applications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Applications</h3>
            <div className="space-y-3">
              {dashboardData.recentApplications.length > 0 ? (
                dashboardData.recentApplications.map(application => (
                  <div key={application.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Application #{application.id}</p>
                      <p className="text-sm text-gray-600">Job ID: {application.jobId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {application.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic">No recent applications</p>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Employees</h3>
            <div className="space-y-3">
              {dashboardData.employees.slice(0, 5).map(employee => (
                <div key={employee.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={employee.profilePhoto || 'https://placehold.co/40x40?text=User'}
                    alt={employee.firstName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                  </div>
                  <Link
                    to={`/developer/${employee.id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
              {dashboardData.employees.length === 0 && (
                <p className="text-gray-500 italic">No employees found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDashboardPage;