import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const SavedJobsPage = () => {
  const { currentUser } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  const fetchData = async () => {
    const jobsRes = await fetch('http://localhost:8000/jobs');
    const jobsData = await jobsRes.json();
    setJobs(jobsData);

    const savedRes = await fetch('http://localhost:8000/savedJobs');
    const savedData = await savedRes.json();
    setSavedJobs(savedData);
  };

  useEffect(() => {
    fetchData();
    // Optionally, poll every 2 seconds for updates
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);


  // Filter saved jobs for the current developer
  const savedJobsForUser = savedJobs.filter(
    (sj) => sj.developerId === currentUser?.id
  );

  // Filter to only unique saved jobs per jobId for the current developer
  const uniqueSavedJobs = [];
  const seenJobIds = new Set();
  for (const savedJob of savedJobsForUser) {
    if (!seenJobIds.has(savedJob.jobId)) {
      uniqueSavedJobs.push(savedJob);
      seenJobIds.add(savedJob.jobId);
    }
  }

  const jobsForSaved = uniqueSavedJobs.map(
    (sj) => jobs.find((job) => job.id === sj.jobId)
  ).filter(Boolean);

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Saved Jobs</h2>
      <button
        className="mb-4 px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        onClick={fetchData}
      >
        Refresh
      </button>
      {jobsForSaved.length === 0 ? (
        <p>No saved jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobsForSaved.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 shadow">
              <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
              <p className="mb-2">{job.description}</p>
              <p className="text-sm text-gray-600 mb-1">Location: {job.location}</p>
              <p className="text-sm text-gray-600 mb-1">Salary: {job.salary}</p>
              <p className="text-sm text-gray-600 mb-1">Company: {job.company?.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedJobsPage;
