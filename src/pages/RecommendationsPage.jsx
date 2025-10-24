import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const RecommendationsPage = () => {
  const { user } = useAuth();
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'developer') {
        setLoading(false);
        return;
      }

      try {
        // Fetch all active jobs
        const jobsResponse = await fetch('http://localhost:8000/jobs?status=active');
        const jobsData = await jobsResponse.json();
        setAllJobs(jobsData);

        // Get user skills
        const userSkillIds = user.skills || [];
        setUserSkills(userSkillIds);

        // Filter jobs based on skill matching
        const recommendations = jobsData.filter(job => {
          // Skip jobs where user has already applied
          // You can add application checking logic here
          
          // Check if job has required skills that match user skills
          if (job.requiredSkills && job.length > 0) {
            const hasMatchingSkills = job.requiredSkills.some(jobSkill => 
              userSkillIds.includes(jobSkill.id)
            );
            return hasMatchingSkills;
          }

          // Check if job has preferred skills that match user skills
          if (job.preferredSkills && job.preferredSkills.length > 0) {
            const hasMatchingPreferredSkills = job.preferredSkills.some(jobSkill => 
              userSkillIds.includes(jobSkill.id)
            );
            return hasMatchingPreferredSkills;
          }

          return false;
        });

        // Sort by best match (most matching skills first)
        const sortedRecommendations = recommendations.sort((a, b) => {
          const aMatchCount = getSkillMatchCount(a, userSkillIds);
          const bMatchCount = getSkillMatchCount(b, userSkillIds);
          return bMatchCount - aMatchCount;
        });

        setRecommendedJobs(sortedRecommendations);

      } catch (error) {
        console.error('Error fetching recommendations:', error);
      }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Calculate how many skills match between job and user
  const getSkillMatchCount = (job, userSkillIds) => {
    let matchCount = 0;
    
    if (job.requiredSkills) {
      matchCount += job.requiredSkills.filter(skill => 
        userSkillIds.includes(skill.id)
      ).length;
    }
    
    if (job.preferredSkills) {
      matchCount += job.preferredSkills.filter(skill => 
        userSkillIds.includes(skill.id)
      ).length;
    }
    
    return matchCount;
  };

  // Get matching skills for display
  const getMatchingSkills = (job) => {
    const matching = [];
    const userSkillIds = user.skills || [];
    
    if (job.requiredSkills) {
      job.requiredSkills.forEach(skill => {
        if (userSkillIds.includes(skill.id)) {
          matching.push({ ...skill, type: 'required' });
        }
      });
    }
    
    if (job.preferredSkills) {
      job.preferredSkills.forEach(skill => {
        if (userSkillIds.includes(skill.id)) {
          matching.push({ ...skill, type: 'preferred' });
        }
      });
    }
    
    return matching;
  };

  // Apply to job function
  const handleApplyToJob = async (jobId) => {
    setApplying(prev => ({ ...prev, [jobId]: true }));
    
    try {
      const applicationData = {
        jobId: jobId,
        developerId: user.id,
        coverLetter: `I am interested in this position as it matches my skills and experience.`,
        resume: user.resume || '',
        status: 'pending',
        appliedAt: new Date().toISOString()
      };

      const response = await fetch('http://localhost:8000/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: Date.now().toString(),
          ...applicationData
        }),
      });

      if (response.ok) {
        alert('Application submitted successfully!');
        // Remove the job from recommendations or mark as applied
        setRecommendedJobs(prev => 
          prev.filter(job => job.id !== jobId)
        );
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying to job:', error);
      alert('Failed to submit application. Please try again.');
    }
    
    setApplying(prev => ({ ...prev, [jobId]: false }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Finding jobs that match your skills...</div>
      </div>
    );
  }

  if (user?.role !== 'developer') {
    return (
      <div className="text-center text-gray-500 py-12">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p>Job recommendations are only available for developers.</p>
      </div>
    );
  }

  if (!user.skills || user.skills.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🎯 Job Recommendations</h1>
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">🛠️</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Add Skills to Get Recommendations</h3>
            <p className="text-gray-500 mb-6">
              Update your profile with your skills to see personalized job recommendations.
            </p>
            <Link 
              to="/profile" 
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Update Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Job Recommendations
          </h1>
          <p className="text-gray-600">
            Jobs that match your skills and interests • {recommendedJobs.length} recommendations found
          </p>
        </div>

        {/* User Skills Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">🛠️ Your </h2>
          <div className="flex flex-wrap gap-2">
            {user.skills?.map((skillId, index) => {
              // Find skill name from available skills
              const skillName = `Skill ${skillId}`; // You can improve this by fetching actual skill names
              return (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {skillName}
                </span>
              );
            })}
          </div>
        </div>

        {/* Recommendations */}
        {recommendedJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matching Jobs Found</h3>
            <p className="text-gray-500 mb-6">
              There are currently no jobs that match your skills. Check back later or update your skills.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/jobs" 
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse All Jobs
              </Link>
              <Link 
                to="/profile" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Update Skills
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {recommendedJobs.map(job => {
              const matchingSkills = getMatchingSkills(job);
              const matchCount = getSkillMatchCount(job, user.skills || []);
              
              return (
                <div 
                  key={job.id} 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Match Score Header */}
                  <div className="bg-green-50 border-b border-green-200 p-4 rounded-t-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {matchCount} Skill{matchCount !== 1 ? 's' : ''} Match
                        </span>
                        <span className="text-green-700 text-sm font-medium">
                          🎯 Recommended for you
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="p-6">
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
                          <p><i className="fas fa-building mr-2"></i>{job.company?.name}</p>
                          <p><i className="fas fa-map-marker-alt mr-2"></i>{job.location}</p>
                          <p><i className="fas fa-briefcase mr-2"></i>{job.type}</p>
                          {job.salary && <p><i className="fas fa-dollar-sign mr-2"></i>{job.salary}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          Posted {formatDate(job.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Matching Skills */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">✅ Your Matching Skills:</h4>
                      <div className="flex flex-wrap gap-2">
                        {matchingSkills.map((skill, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              skill.type === 'required' 
                                ? 'bg-red-100 text-red-800 border border-red-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {skill.name}
                            <span className="ml-1 text-xs">
                              {skill.type === 'required' ? '(Required)' : '(Preferred)'}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Job Description Preview */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {job.description}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApplyToJob(job.id)}
                        disabled={applying[job.id]}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {applying[job.id] ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Applying...
                          </>
                        ) : (
                          <>
                            ⚡ Quick Apply
                          </>
                        )}
                      </button>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                      >
                         View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Call to Action */}
        {recommendedJobs.length > 0 && (
          <div className="mt-12 bg-indigo-50 rounded-lg border border-indigo-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-indigo-900 mb-2">Want More Recommendations?</h3>
            <p className="text-indigo-700 mb-4">
              Add more skills to your profile to discover additional job opportunities.
            </p>
            <Link 
              to="/profile" 
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Update Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;