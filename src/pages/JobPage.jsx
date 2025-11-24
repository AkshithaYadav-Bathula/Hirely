import { useParams, useLoaderData, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaMapMarker } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

const JobPage = ({ deleteJob, applyToJob, saveJob }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const job = useLoaderData();
  const { user, hasAnyRole } = useAuth();

  const [coverLetter, setCoverLetter] = useState('');
  const [applied, setApplied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingUserCheck, setLoadingUserCheck] = useState(true);

  useEffect(() => {
    const checkSaved = async () => {
      setLoadingUserCheck(true);
      if (!user || !job) {
        setSaved(false);
        setLoadingUserCheck(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:8000/users/${user.id}`);
        if (!res.ok) {
          setSaved(false);
          setLoadingUserCheck(false);
          return;
        }
        const userData = await res.json();
        const savedJobs = userData.savedJobs || [];
        setSaved(savedJobs.includes(job.id));
      } catch (err) {
        console.error('checkSaved error', err);
        setSaved(false);
      } finally {
        setLoadingUserCheck(false);
      }
    };
    checkSaved();
  }, [user, job]);

  const canManageJob = () => {
    if (!user || typeof hasAnyRole !== 'function') return false;
    return hasAnyRole(['admin', 'employer']);
  };

  const onDeleteClick = async (jobId) => {
    if (!canManageJob()) {
      toast.error('You do not have permission to delete this job');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this listing?');
    if (!confirmed) return;

    try {
      if (typeof deleteJob === 'function') {
        await deleteJob(jobId);
      } else {
        // fallback: call API directly
        await fetch(`http://localhost:8000/jobs/${jobId}`, { method: 'DELETE' });
      }
      toast.success('Job deleted successfully');
      navigate('/jobs');
    } catch (err) {
      console.error('delete job error', err);
      toast.error('Failed to delete job');
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to apply');
      return;
    }
    try {
      if (typeof applyToJob === 'function') {
        await applyToJob(job.id, { developerId: user.id, coverLetter, resume: '' });
      } else {
        // fallback: create application via API
        await fetch('http://localhost:8000/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: job.id,
            developerId: user.id,
            coverLetter,
            status: 'pending',
            appliedAt: new Date().toISOString()
          })
        });
      }
      setApplied(true);
      toast.success('Application submitted');
    } catch (err) {
      console.error('apply error', err);
      toast.error('Failed to apply');
    }
  };

  const handleSaveJob = async () => {
    if (!user) {
      toast.error('Please login to save jobs');
      return;
    }
    if (saved) {
      toast.info('Job already saved');
      return;
    }

    try {
      const userRes = await fetch(`http://localhost:8000/users/${user.id}`);
      if (!userRes.ok) throw new Error('Failed to fetch user');
      const userData = await userRes.json();
      const savedJobs = userData.savedJobs || [];
      if (!savedJobs.includes(job.id)) {
        const updatedSavedJobs = [...savedJobs, job.id];
        await fetch(`http://localhost:8000/users/${user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ savedJobs: updatedSavedJobs })
        });
        setSaved(true);
        toast.success('Job saved successfully');
      }
    } catch (err) {
      console.error('save job error', err);
      toast.error('Failed to save job');
    }
  };

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading job...</div>
      </div>
    );
  }

  return (
    <>
      <section>
        <div className="container m-auto py-6 px-6">
          <Link to="/jobs" className="text-indigo-500 hover:text-indigo-600 flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Job Listings
          </Link>
        </div>
      </section>

      <section className="bg-indigo-50">
        <div className="container m-auto py-10 px-6">
          <div className="grid grid-cols-1 md:grid-cols-70/30 w-full gap-6">
            <main>
              <div className="bg-white p-6 rounded-lg shadow-md text-center md:text-left">
                <div className="text-gray-500 mb-4">{job.type ?? '—'}</div>
                <h1 className="text-3xl font-bold mb-4">{job.title ?? 'Untitled'}</h1>
                <div className="text-gray-500 mb-4 flex align-middle justify-center md:justify-start">
                  <FaMapMarker className="text-orange-700 mr-1" />
                  <p className="text-orange-700">{job.location ?? 'Remote'}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                <h3 className="text-indigo-800 text-lg font-bold mb-6">Job Description</h3>
                <p className="mb-4">{job.description ?? 'No description provided.'}</p>

                <h3 className="text-indigo-800 text-lg font-bold mb-2">Salary</h3>
                <p className="mb-4">{job.salary ?? 'Not specified'} / Year</p>
              </div>
            </main>

            <aside>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-6">Company Info</h3>

                <h2 className="text-2xl">{job.company?.name ?? 'Unknown Company'}</h2>
                <p className="my-2">{job.company?.description ?? 'No description available'}</p>

                <hr className="my-4" />

                <h3 className="text-xl">Contact Email:</h3>
                <p className="my-2 bg-indigo-100 p-2 font-bold">{job.company?.contactEmail ?? 'N/A'}</p>

                <h3 className="text-xl">Contact Phone:</h3>
                <p className="my-2 bg-indigo-100 p-2 font-bold">{job.company?.contactPhone ?? 'N/A'}</p>
              </div>

              {canManageJob() && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                  <h3 className="text-xl font-bold mb-6">Manage Job</h3>
                  <Link
                    to={`/edit-job/${job.id}`}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
                  >
                    Edit Job
                  </Link>
                  <button
                    onClick={() => onDeleteClick(job.id)}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4 block"
                  >
                    Delete Job
                  </button>
                </div>
              )}

              {user && hasAnyRole && hasAnyRole(['developer']) && (
                <div className="bg-white p-6 rounded-lg shadow-md mt-6">
                  <h3 className="text-xl font-bold mb-6">Apply for this Job</h3>
                  {!applied ? (
                    <form onSubmit={handleApply}>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Write your cover letter"
                        required
                        className="w-full p-2 border rounded-md"
                      />
                      <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white text-center font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline mt-4"
                      >
                        Apply Now
                      </button>
                    </form>
                  ) : (
                    <div className="text-green-600 font-bold">You have applied to this job.</div>
                  )}

                  <button
                    className={`mt-4 w-full font-bold py-2 px-4 rounded-full transition-colors ${
                      saved || loadingUserCheck ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    onClick={handleSaveJob}
                    disabled={saved || loadingUserCheck}
                  >
                    {saved ? 'Saved' : 'Save Job'}
                  </button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};

// loader used by react-router route for this page
const jobLoader = async ({ params }) => {
  const base = 'http://localhost:8000';
  const res = await fetch(`${base}/jobs/${params.id}`);
  if (!res.ok) {
    // let router handle 404 / errors
    throw new Response('Job not found', { status: res.status });
  }
  const data = await res.json();

  // If job references company by id, fetch and attach company object
  if (data && data.companyId) {
    try {
      const compRes = await fetch(`${base}/companies/${data.companyId}`);
      if (compRes.ok) {
        const company = await compRes.json();
        return { ...data, company };
      }
    } catch (err) {
      console.warn('Failed to fetch company for job', err);
    }
  }

  // ensure company exists to avoid undefined property access
  return {
    ...data,
    company: data.company ?? { name: 'Unknown', description: '', contactEmail: '', contactPhone: '' }
  };
};

export { JobPage as default, jobLoader };