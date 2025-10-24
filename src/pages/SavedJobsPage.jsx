import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const SavedJobsPage = () => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState({});
  const [appliedJobs, setAppliedJobs] = useState([]);

  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (!user || !user.savedJobs) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all jobs
        const jobsResponse = await fetch('http://localhost:8000/jobs');
        const allJobs = await jobsResponse.json();

        // Filter jobs that user has saved
        const userSavedJobs = allJobs.filter((job) =>
          user.savedJobs.includes(job.id)
        );
        setSavedJobs(userSavedJobs);

        // Check which jobs user has already applied to
        const applicationsResponse = await fetch(
          `http://localhost:8000/applications?developerId=${user.id}`
        );
        const applications = await applicationsResponse.json();
        const appliedJobIds = applications.map((app) => app.jobId);
        setAppliedJobs(appliedJobIds);
      } catch (error) {
        console.error('Error fetching saved jobs:', error);
        toast.error('Failed to load saved jobs');
      }
      setLoading(false);
    };

    fetchSavedJobs();
  }, [user]);

  // Remove job from saved list
  const handleUnsaveJob = async (jobId) => {
    try {
      const updatedSavedJobs = user.savedJobs.filter((id) => id !== jobId);

      await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedJobs: updatedSavedJobs }),
      });

      // Update local state
      setSavedJobs((prev) => prev.filter((job) => job.id !== jobId));

      // Update user context if needed
      toast.success('Job removed from saved list');
    } catch (error) {
      console.error('Error removing saved job:', error);
      toast.error('Failed to remove job from saved list');
    }
  };

  // Apply to job
  const handleApplyToJob = async (job) => {
    setApplying((prev) => ({ ...prev, [job.id]: true }));

    try {
      const applicationData = {
        id: Date.now().toString(),
        jobId: job.id,
        developerId: user.id,
        coverLetter: `I am interested in the ${job.title} position at ${job.company.name}. I believe my skills and experience make me a great fit for this role.`,
        resume: user.resume || '',
        status: 'pending',
        appliedAt: new Date().toISOString(),
      };

      const response = await fetch('http://localhost:8000/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        setAppliedJobs((prev) => [...prev, job.id]);
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      toast.error('Failed to submit application. Please try again.');
    }

    setApplying((prev) => ({ ...prev, [job.id]: false }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if user has already applied to this job
  const hasApplied = (jobId) => {
    return appliedJobs.includes(jobId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading saved jobs...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
             Saved Jobs
          </h1>
          <p className="text-gray-600">
            Jobs you've saved for later • {savedJobs.length} job
            {savedJobs.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Content */}
        {savedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📂</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Saved Jobs
            </h3>
            <p className="text-gray-500 mb-6">
              Save jobs that interest you to review and apply to them later.
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
            {savedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Job Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {job.title}
                        </Link>
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p>
                          <i className="fas fa-building mr-2"></i>
                          {job.company?.name}
                        </p>
                        <p>
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {job.location}
                        </p>
                        <p>
                          <i className="fas fa-briefcase mr-2"></i>
                          {job.type}
                        </p>
                        {job.salary && (
                          <p>
                            <i className="fas fa-dollar-sign mr-2"></i>
                            {job.salary}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* ✅ PROFESSIONAL: Replace unprofessional icon with professional button */}
                    <div className="text-right">
                      <button
                        onClick={() => handleUnsaveJob(job.id)}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 transition-all duration-200 text-sm font-medium"
                        title="Remove from saved jobs"
                      >
                        <i className="fas fa-bookmark-slash mr-2"></i>
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Saved Date */}
                  <div className="text-xs text-gray-500 mb-3">
                    <i className="fas fa-bookmark mr-1 text-indigo-500"></i>
                    Saved • Posted {formatDate(job.createdAt)}
                  </div>
                </div>

                {/* Job Description */}
                <div className="p-6 border-b border-gray-100">
                  <p className="text-sm text-gray-700 line-clamp-3 mb-4">
                    {job.description}
                  </p>

                  {/* Skills (if available) */}
                  {job.requiredSkills && job.requiredSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Required Skills:
                      </h4>
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

                  {/* Preferred Skills (if available) */}
                  {job.preferredSkills && job.preferredSkills.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Preferred Skills:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {job.preferredSkills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {job.preferredSkills.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{job.preferredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-6">
                  <div className="flex gap-3">
                    {hasApplied(job.id) ? (
                      <button
                        disabled
                        className="flex-1 bg-gray-300 text-gray-600 font-semibold py-2 px-4 rounded-lg cursor-not-allowed flex items-center justify-center"
                      >
                         Applied
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApplyToJob(job)}
                        disabled={applying[job.id]}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {applying[job.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Applying...
                          </>
                        ) : (
                          <> Quick Apply</>
                        )}
                      </button>
                    )}

                    <Link
                      to={`/jobs/${job.id}`}
                      className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                    >
                       View Details
                    </Link>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500">
                    <span>Status: {job.status}</span>
                    <span>Job ID: {job.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Call to Action */}
        {savedJobs.length > 0 && (
          <div className="mt-12 bg-indigo-50 rounded-lg border border-indigo-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">
              Looking for More Opportunities?
            </h3>
            <p className="text-indigo-700 mb-4">
              Discover more jobs that match your skills and interests.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/jobs"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              >
                Browse All Jobs
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

export default SavedJobsPage;
