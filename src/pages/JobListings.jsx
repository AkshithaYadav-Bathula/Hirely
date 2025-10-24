import { useState, useEffect } from 'react';
import JobListing from '../components/JobListing';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext'; // ✅ Only import useAuth, not AuthContext

const JobListings = ({ isHome = false }) => {
  const { user } = useAuth(); // ✅ Use the hook to get user
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      const apiUrl = isHome 
        ? 'http://localhost:8000/jobs?_limit=3' 
        : 'http://localhost:8000/jobs';
      
      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        setJobs(data);
        setFilteredJobs(data);
      } catch (error) {
        console.log('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [isHome]);

  // Filter jobs based on type and search query
  useEffect(() => {
    let filtered = jobs;

    // Filter by type
    if (selectedType !== 'All') {
      filtered = filtered.filter(job => job.type === selectedType);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [selectedType, searchQuery, jobs]);

  const jobTypes = ['All', 'Full-Time', 'Part-Time', 'Remote', 'Internship'];

  return (
    <section className='bg-blue-50 px-4 py-10'>
      <div className='container-xl lg:container m-auto'>
        <h2 className='text-3xl font-bold text-indigo-500 mb-6 text-center'>
          {isHome ? 'Recent Jobs' : 'Browse Jobs'}
        </h2>

        {!isHome && (
          <div className='mb-6 space-y-4'>
            {/* Search Bar */}
            <div>
              <input
                type='text'
                placeholder='Search jobs by title, description, or location...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
            </div>

            {/* Filter Buttons */}
            <div className='flex flex-wrap gap-2 justify-center'>
              {jobTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedType === type
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-indigo-500 border border-indigo-500 hover:bg-indigo-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className='text-center text-gray-600'>
              Showing {filteredJobs.length} of {jobs.length} jobs
            </div>
          </div>
        )}

        {loading ? (
          <Spinner loading={loading} />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <JobListing key={job.id} job={job} />
              ))
            ) : (
              <div className='col-span-3 text-center py-10'>
                <p className='text-gray-600 text-lg'>No jobs found matching your criteria</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default JobListings;