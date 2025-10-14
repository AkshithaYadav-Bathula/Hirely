import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const MyJobApplicantsPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/src/jobs.json');
      const data = await res.json();
      const foundJob = data.jobs.find(j => j.id === id);
      setJob(foundJob);
      const jobApplications = (data.applications || []).filter(app => app.jobId === id);
      setApplicants(jobApplications);
      setDevelopers(data.users || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

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

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!job) return <div className="text-center text-gray-500">Job not found.</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          <i className="fas fa-users mr-2"></i>
          Applicants for: {job.title}
        </h2>
        <p className="text-gray-600">
          Total Applications: {applicants.length}
        </p>
      </div>

      {applicants.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <i className="fas fa-inbox text-6xl mb-4 block"></i>
          <p className="text-lg">No applications yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applicants.map(app => {
            const dev = developers.find(d => d.id === app.developerId);
            return (
              <div key={app.id} className="bg-white shadow-lg rounded-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                {/* Header with timestamp */}
                <div className="border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800">
                        {dev ? `${dev.firstName} ${dev.lastName}` : `Developer ID: ${app.developerId}`}
                      </h3>
                      {dev && (
                        <p className="text-blue-600 text-sm mt-1">
                          <i className="fas fa-envelope mr-1"></i>
                          {dev.email}
                        </p>
                      )}
                    </div>
                    
                    {/* Timestamp */}
                    <div className="text-right">
                      <div className="text-sm text-green-600 font-medium">
                        <i className="fas fa-clock mr-1"></i>
                        {getTimeAgo(app.appliedAt)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDate(app.appliedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Application details */}
                {app.coverLetter && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700 text-sm block mb-2">
                      <i className="fas fa-file-text mr-1"></i>
                      Cover Letter:
                    </span>
                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-2 rounded">
                      {app.coverLetter}
                    </p>
                  </div>
                )}
                
                {dev && dev.skills && dev.skills.length > 0 && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700 text-sm block mb-2">
                      <i className="fas fa-code mr-1"></i>
                      Skills:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {dev.skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {app.resume && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-700 text-sm">
                      <i className="fas fa-file-pdf mr-1"></i>
                      Resume:
                    </span>
                    <a 
                      href={app.resume} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800 ml-2 text-sm underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      <i className="fas fa-check-circle mr-1"></i>
                      Application Received
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <i className="fas fa-user mr-1"></i>
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyJobApplicantsPage;
