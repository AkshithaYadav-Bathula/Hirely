import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applicationsAPI } from '../utils/applicationsAPI';

const MyJobApplicantsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [developers, setDevelopers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch job details
        const jobResponse = await fetch(`http://localhost:8000/jobs/${id}`);
        const jobData = await jobResponse.json();
        setJob(jobData);

        // Fetch applications for this job
        const applications = await applicationsAPI.getByJobId(id);
        setApplicants(applications);

        // Fetch developer details for each application
        const developerPromises = applications.map(app => 
          applicationsAPI.getDeveloper(app.developerId)
        );
        const developerData = await Promise.all(developerPromises);
        
        // Create a map of developers by ID
        const developerMap = {};
        developerData.forEach(dev => {
          if (dev) developerMap[dev.id] = dev;
        });
        setDevelopers(developerMap);

      } catch (error) {
        console.error('Error fetching data:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // Handle application status update
  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await applicationsAPI.updateStatus(applicationId, status);
      
      // Update local state
      setApplicants(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status } : app
        )
      );

      alert(`Application ${status} successfully!`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update application status');
    }
  };

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

  // Open developer profile modal
  const openDeveloperProfile = (developerId) => {
    const developer = developers[developerId];
    if (developer) {
      setSelectedDeveloper(developer);
      setShowProfileModal(true);
    }
  };

  // Developer Profile Modal Component
  const DeveloperProfileModal = ({ developer, onClose }) => {
    if (!developer) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {developer.name || `${developer.firstName} ${developer.lastName}`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {/* Profile Photo and Basic Info */}
            <div className="flex items-start space-x-6 mb-6">
              <img
                src={developer.profilePhoto || 'https://placehold.co/120x120?text=Profile'}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200"
                onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=Profile'; }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {developer.name || `${developer.firstName} ${developer.lastName}`}
                </h3>
                <p className="text-gray-600 mb-2">{developer.email}</p>
                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Developer
                </span>
              </div>
            </div>

            {/* Skills */}
            {developer.skills && developer.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🛠️ Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {developer.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {typeof skill === 'object' ? skill.name : skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Section */}
            {developer.about && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">About</h4>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: developer.about }}
                />
              </div>
            )}

            {/* Resume */}
            {developer.resume && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">📄 Resume</h4>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Resume Document</span>
                    <div className="space-x-2">
                      <a
                        href={developer.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        🔍 View Resume
                      </a>
                      <a
                        href={developer.resume.split('?')[0]}
                        download
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        📥 Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Introduction Video */}
            {developer.introVideo && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">🎥 Introduction Video</h4>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <video
                    src={developer.introVideo}
                    controls
                    className="w-full max-w-md rounded-lg"
                  />
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">📧 Contact Information</h4>
              <p className="text-blue-800">
                <strong>Email:</strong> {developer.email}
              </p>
              <p className="text-blue-800 text-sm mt-1">
                <strong>Member since:</strong> {formatDate(developer.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-lg text-gray-600">Loading applicants...</div>
    </div>
  );

  if (!job) return (
    <div className="text-center text-gray-500 py-12">
      <h2 className="text-2xl font-bold mb-4">Job not found</h2>
      <Link to="/my-jobs" className="text-indigo-600 hover:text-indigo-800">
        ← Back to My Jobs
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link to="/my-jobs" className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          ← Back to My Jobs
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          <i className="fas fa-users mr-3 text-indigo-600"></i>
          Applicants for: {job.title}
        </h1>
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Company:</span>
              <span className="ml-2 text-gray-600">{job.company?.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Location:</span>
              <span className="ml-2 text-gray-600">{job.location}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Applications:</span>
              <span className="ml-2 text-indigo-600 font-semibold">{applicants.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Applicants List */}
      {applicants.length === 0 ? (
        <div className="text-center text-gray-400 py-16 bg-white rounded-lg border border-gray-200">
          <i className="fas fa-inbox text-6xl mb-4 block text-gray-300"></i>
          <h3 className="text-xl font-semibold mb-2">No applications yet</h3>
          <p className="text-gray-500">When developers apply to this job, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applicants.map(app => {
            const developer = developers[app.developerId];
            return (
              <div key={app.id} className="bg-white shadow-lg rounded-lg border border-gray-200 hover:shadow-xl transition-shadow">
                {/* Application Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Profile Photo */}
                      <img
                        src={developer?.profilePhoto || 'https://placehold.co/60x60?text=Profile'}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-indigo-400 transition-colors"
                        onClick={() => openDeveloperProfile(app.developerId)}
                        onError={(e) => { e.target.src = 'https://placehold.co/60x60?text=Profile'; }}
                      />
                      
                      {/* Developer Info */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">
                          {developer ? 
                            (developer.name || `${developer.firstName} ${developer.lastName}`) : 
                            `Developer ID: ${app.developerId}`
                          }
                        </h3>
                        {developer && (
                          <p className="text-indigo-600 text-sm mb-2">
                            <i className="fas fa-envelope mr-1"></i>
                            {developer.email}
                          </p>
                        )}
                        
                        {/* Skills Preview */}
                        {developer?.skills && developer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {developer.skills.slice(0, 3).map((skill, index) => (
                              <span 
                                key={index}
                                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {typeof skill === 'object' ? skill.name : skill}
                              </span>
                            ))}
                            {developer.skills.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{developer.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status and Actions */}
                    <div className="text-right">
                      <div className="mb-3">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          app.status === 'accepted' ? 'bg-green-100 text-green-800 border border-green-200' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}>
                          {app.status?.charAt(0).toUpperCase() + app.status?.slice(1) || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Action Buttons */}
                      {app.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    {/* Application Date */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">Applied</h4>
                      <p className="text-sm text-green-600 font-medium">{getTimeAgo(app.appliedAt)}</p>
                      <p className="text-xs text-gray-500">{formatDate(app.appliedAt)}</p>
                    </div>
                    
                    {/* Quick Actions */}
                    <div className="text-right">
                      <button
                        onClick={() => openDeveloperProfile(app.developerId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        👤 View Full Profile
                      </button>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  {app.coverLetter && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        <i className="fas fa-file-text mr-1"></i>
                        Cover Letter:
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                          {app.coverLetter}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Resume Link */}
                  {developer?.resume && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-gray-700">
                        <i className="fas fa-file-pdf mr-1"></i>
                        Resume Available
                      </span>
                      <div className="space-x-2">
                        <a
                          href={developer.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                        >
                          📄 View Resume
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Developer Profile Modal */}
      {showProfileModal && selectedDeveloper && (
        <DeveloperProfileModal
          developer={selectedDeveloper}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedDeveloper(null);
          }}
        />
      )}
    </div>
  );
};

export default MyJobApplicantsPage;
