import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyApplicationsPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user's applications
        const appsResponse = await fetch(`http://localhost:8000/applications?developerId=${user.id}`);
        const appsData = await appsResponse.json();
        setApplications(appsData);

        // Fetch job details for each application
        const jobIds = [...new Set(appsData.map(app => app.jobId))];
        const jobPromises = jobIds.map(id => 
          fetch(`http://localhost:8000/jobs/${id}`).then(res => res.json())
        );
        const jobsData = await Promise.all(jobPromises);
        
        // Create jobs map
        const jobsMap = {};
        jobsData.forEach(job => {
          if (job && job.id) jobsMap[job.id] = job;
        });
        setJobs(jobsMap);

      } catch (error) {
        console.error('Error fetching applications:', error);
        toast.error('Failed to load applications');
      }
      setLoading(false);
    };

    fetchApplications();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get time ago
  const getTimeAgo = (dateString) => {
    const now = new Date();
    const applicationDate = new Date(dateString);
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

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return styles[status] || styles.default;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
             My Applications
          </h1>
          <p className="text-gray-600">
            Track your job applications and their status • {applications.length} application{applications.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {/* Content */}
        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-6">
              Start applying to jobs to track your progress here.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/jobs" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Jobs
              </Link>
              <Link 
                to="/recommendations" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Recommendations
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {applications.map(application => {
              const job = jobs[application.jobId];
              
              return (
                <div 
                  key={application.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Application Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {job ? (
                            <Link 
                              to={`/jobs/${job.id}`}
                              className="hover:text-indigo-600 transition-colors"
                            >
                              {job.title}
                            </Link>
                          ) : (
                            <span className="text-gray-500">Job not found</span>
                          )}
                        </h3>
                        {job && (
                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <p><i className="fas fa-building mr-2"></i>{job.company?.name}</p>
                            <p><i className="fas fa-map-marker-alt mr-2"></i>{job.location}</p>
                            <p><i className="fas fa-briefcase mr-2"></i>{job.type}</p>
                            {job.salary && <p><i className="fas fa-dollar-sign mr-2"></i>{job.salary}</p>}
                          </div>
                        )}
                      </div>
                      
                      {/* Status Badge */}
                      <div className="text-right">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(application.status)}`}>
                          {application.status === 'pending' && '⏳'}
                          {application.status === 'accepted' && '✅'}
                          {application.status === 'rejected' && '❌'}
                          <span className="ml-1">
                            {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Unknown'}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Application Date */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mr-3">
                          <i className="fas fa-paper-plane mr-1"></i>
                          Applied
                        </span>
                        <span>{getTimeAgo(application.appliedAt)}</span>
                      </div>
                      
                      {/* Application ID */}
                      <span className="text-xs text-gray-400">
                        ID: {application.id}
                      </span>
                    </div>
                  </div>

                  {/* Application Details */}
                  <div className="p-6 border-b border-gray-100">
                    {/* Cover Letter Preview */}
                    {application.coverLetter && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          <i className="fas fa-file-text mr-1"></i>
                          Cover Letter:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <p className="text-sm text-gray-700 line-clamp-3">
                            {application.coverLetter}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Resume Link */}
                    {application.resume && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          <i className="fas fa-file-pdf mr-1"></i>
                          Resume Submitted:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <a
                            href={application.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          >
                             View Submitted Resume
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Job Skills (if available) */}
                    {job?.requiredSkills && job.requiredSkills.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Required Skills:</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.requiredSkills.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium"
                            >
                              {skill.name}
                            </span>
                          ))}
                          {job.requiredSkills.length > 4 && (
                            <span className="text-xs text-gray-500">
                              +{job.requiredSkills.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-6">
                    <div className="flex gap-3 mb-4">
                      {job && (
                        <Link
                          to={`/jobs/${job.id}`}
                          className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                        >
                           View Job Details
                        </Link>
                      )}
                      
                      {application.status === 'accepted' && (
                        <button className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg cursor-default">
                           Congratulations!
                        </button>
                      )}
                      
                      {application.status === 'rejected' && (
                        <button className="flex-1 bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg cursor-default">
                          💼 Keep Looking
                        </button>
                      )}
                    </div>

                    {/* Application Timeline */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Applied: {formatDate(application.appliedAt)}</span>
                        <span className={`font-medium ${
                          application.status === 'pending' ? 'text-yellow-600' :
                          application.status === 'accepted' ? 'text-green-600' :
                          application.status === 'rejected' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          Status: {application.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Call to Action */}
        {applications.length > 0 && (
          <div className="mt-12 bg-indigo-50 rounded-lg border border-indigo-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Keep Building Your Career</h3>
            <p className="text-indigo-700 mb-4">
              Continue applying to more positions that match your skills and goals.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/jobs" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Find More Jobs
              </Link>
              <Link 
                to="/recommendations" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                View Recommendations
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;