import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const MyJobsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch jobs posted by this employer
        const jobsResponse = await fetch(`http://localhost:8000/jobs?employerId=${user.id}`);
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);

        // Fetch all applications to count applicants per job
        const applicationsResponse = await fetch('http://localhost:8000/applications');
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Get application count for a specific job
  const getApplicationCount = (jobId) => {
    return applications.filter(app => app.jobId === jobId).length;
  };

  // Get pending application count for a specific job
  const getPendingApplicationCount = (jobId) => {
    return applications.filter(app => app.jobId === jobId && app.status === 'pending').length;
  };

  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const response = await fetch(`http://localhost:8000/jobs/${jobId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setJobs(jobs.filter(job => job.id !== jobId));
          alert('Job deleted successfully!');
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job');
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-lg text-gray-600">Loading your jobs...</div>
    </div>
  );

  if (jobs.length === 0) return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Posted Jobs</h1>
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Posted Yet</h3>
          <p className="text-gray-500 mb-6">Start posting jobs to find the perfect candidates!</p>
          <Link 
            to="/add-job" 
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Post Your First Job
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Posted Jobs</h1>
            <p className="text-gray-600">Manage your job postings and view applicants</p>
          </div>
          <Link 
            to="/add-job"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            + Post New Job
          </Link>
        </div>

        {/* Jobs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map(job => {
            const totalApplications = getApplicationCount(job.id);
            const pendingApplications = getPendingApplicationCount(job.id);
            
            return (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><i className="fas fa-map-marker-alt mr-2"></i>{job.location}</p>
                    <p><i className="fas fa-briefcase mr-2"></i>{job.type}</p>
                    {job.salary && <p><i className="fas fa-dollar-sign mr-2"></i>{job.salary}</p>}
                  </div>
                </div>

                {/* Applications Stats */}
                <div className="p-6 border-b border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-indigo-600">{totalApplications}</div>
                      <div className="text-sm text-gray-500">Total Applications</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{pendingApplications}</div>
                      <div className="text-sm text-gray-500">Pending Review</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6">
                  <div className="space-y-3">
                    {/* View Applicants Button */}
                    <Link
                      to={`/my-job/${job.id}`}
                      className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        totalApplications > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <i className="fas fa-users mr-2"></i>
                      {totalApplications > 0 ? `View ${totalApplications} Applicant${totalApplications !== 1 ? 's' : ''}` : 'No Applicants Yet'}
                      {pendingApplications > 0 && (
                        <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          {pendingApplications} pending
                        </span>
                      )}
                    </Link>

                    {/* Secondary Actions */}
                    <div className="flex space-x-2">
                      <Link
                        to={`/jobs/${job.id}`}
                        className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Job
                      </Link>
                      <Link
                        to={`/edit-job/${job.id}`}
                        className="flex-1 text-center px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Job Status */}
                <div className="px-6 pb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Posted: {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span className={`px-2 py-1 rounded-full ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyJobsPage;