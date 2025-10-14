import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI, jobsAPI } from '../utils/api';

const MyApplicationsPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      const apps = await applicationsAPI.getByDeveloper(user.id);
      // Fetch job details for each application
      const jobs = await Promise.all(apps.map(app => jobsAPI.getById(app.jobId)));
      // Merge job info into applications
      const appsWithJobs = apps.map((app, idx) => ({
        ...app,
        job: jobs[idx]
      }));
      setApplications(appsWithJobs);
      setLoading(false);
    };
    fetchApplications();
  }, [user]);

  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Date not available';
    
    const date = new Date(timestamp);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Calculate time ago
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const applicationDate = new Date(timestamp);
    const diffInMs = now - applicationDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Recently applied';
    }
  };

  const handleWithdraw = async (appId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      await applicationsAPI.delete(appId);
      setApplications(applications.filter(app => app.id !== appId));
    }
  };

  if (loading) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading your applications...</div>
      </div>
    </div>
  );

  if (applications.length === 0) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Applications</h1>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
          <p className="text-gray-500 mb-6">You haven't applied to any jobs yet. Start exploring opportunities!</p>
          <a 
            href="/jobs" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Browse Jobs
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Applications</h1>
          <p className="text-gray-600">Track and manage your job applications</p>
          <div className="mt-4 text-sm text-gray-500">
            {applications.length} application{applications.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {/* Applications Grid */}
        <div className="space-y-6">
          {applications.map(app => (
            <div key={app.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              {/* Application Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {app.job?.title || 'Position No Longer Available'}
                    </h2>
                    <div className="text-gray-600 font-medium mb-1">
                      {app.job?.company?.name || 'Company Information Unavailable'}
                    </div>
                    {app.job?.location && (
                      <div className="text-sm text-gray-500">
                        {app.job.location}
                      </div>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                      app.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="p-6">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  {/* Application Date */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Applied</h4>
                    <p className="text-sm text-gray-600">{getTimeAgo(app.appliedAt)}</p>
                    <p className="text-xs text-gray-500">{formatDate(app.appliedAt)}</p>
                  </div>
                  
                  {/* Job Type */}
                  {app.job?.type && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Job Type</h4>
                      <p className="text-sm text-gray-600">{app.job.type}</p>
                    </div>
                  )}
                  
                  {/* Salary */}
                  {app.job?.salary && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Salary</h4>
                      <p className="text-sm font-semibold text-green-600">{app.job.salary}</p>
                    </div>
                  )}
                </div>

                {/* Cover Letter */}
                {app.coverLetter && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Cover Letter</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {app.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    Application ID: {app.id}
                  </div>
                  
                  <div className="flex space-x-3">
                    {app.job && (
                      <a 
                        href={`/jobs/${app.job.id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        View Job Details
                      </a>
                    )}
                    
                    <button
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      onClick={() => handleWithdraw(app.id)}
                    >
                      Withdraw Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <a 
            href="/jobs" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Browse More Jobs
          </a>
        </div>
      </div>
    </div>
  );
};

export default MyApplicationsPage;