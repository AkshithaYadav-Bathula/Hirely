import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit, FaUsers, FaEye } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const CompanyDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const storedCompany = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('company') || 'null') : null;
  const company = storedCompany ?? (user && user.companyId ? null : null);

  const [jobs, setJobs] = useState([]);
  const [applicationsByJob, setApplicationsByJob] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [employees, setEmployees] = useState([]); // <-- NEW
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState(null);

  useEffect(() => {
    if (!company?.id) {
      setLoading(false);
      return;
    }

    const base = 'http://localhost:8000';

    const fetchData = async () => {
      setLoading(true);
      try {
        const [jobsRes, usersRes] = await Promise.all([
          fetch(`${base}/jobs?companyId=${encodeURIComponent(company.id)}`),
          fetch(`${base}/users`)
        ]);
        const jobsData = jobsRes.ok ? await jobsRes.json() : [];
        const usersData = usersRes.ok ? await usersRes.json() : [];

        // build users map (id -> user)
        const map = {};
        (usersData || []).forEach((u) => { map[String(u.id)] = u; });
        setUsersMap(map);

        // employees that belong to this company (users with companyId === company.id)
        const compEmployees = (usersData || []).filter(u => String(u.companyId) === String(company.id));
        setEmployees(compEmployees); // <-- NEW

        // fetch applications for all jobs in single request
        let apps = [];
        if (jobsData.length > 0) {
          const qs = jobsData.map((j) => `jobId=${encodeURIComponent(j.id)}`).join('&');
          const appsRes = await fetch(`${base}/applications?${qs}`);
          apps = appsRes.ok ? await appsRes.json() : [];
        }

        const byJob = {};
        apps.forEach((a) => {
          const jId = String(a.jobId);
          if (!byJob[jId]) byJob[jId] = [];
          byJob[jId].push(a);
        });

        setApplicationsByJob(byJob);
        setJobs(jobsData);
      } catch (err) {
        console.error('Company dashboard load error', err);
        toast.error('Failed to load company dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  const canManage = (job) => {
    // allow if logged-in company (localStorage) and company.id matches the job's companyId
    const acctType = typeof window !== 'undefined' ? localStorage.getItem('accountType') : null;
    return acctType === 'company' && company && String(company.id) === String(job.companyId);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job?')) return;
    try {
      const res = await fetch(`http://localhost:8000/jobs/${jobId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setJobs((prev) => prev.filter((j) => String(j.id) !== String(jobId)));
      toast.success('Job deleted');
    } catch (err) {
      console.error('Delete job error', err);
      toast.error('Failed to delete job');
    }
  };

  const openApplicants = (jobId) => {
    setExpandedJob((prev) => (prev === jobId ? null : jobId));
  };

  if (!company?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Company not signed in</h2>
          <p className="mb-4">Sign in as a company to view and manage your jobs.</p>
          <Link to="/login" className="inline-block bg-indigo-600 text-white px-4 py-2 rounded">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{company.name} — Dashboard</h1>
            <p className="text-sm text-gray-600">
              {jobs.length} job{jobs.length !== 1 ? 's' : ''} posted • {employees.length} employee{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/add-job" className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
              <FaEdit /> Post Job
            </Link>
            <button
              className="bg-gray-200 px-4 py-2 rounded"
              onClick={() => {
                localStorage.removeItem('company');
                localStorage.removeItem('accountType');
                navigate('/');
                toast.info('Signed out');
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center p-6">Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded p-6 text-center">No jobs posted yet.</div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const apps = applicationsByJob[String(job.id)] || [];
              const poster = usersMap[String(job.employerId)] || null;
              return (
                <div key={job.id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <Link to={`/jobs/${job.id}`} className="text-lg font-semibold text-indigo-600">{job.title}</Link>
                    <div className="text-sm text-gray-600">
                      Posted by: {poster ? `${poster.firstName || poster.name || ''} ${poster.lastName || ''}` : '—'}
                      {' • '}
                      {job.location || '—'}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">{job.description?.slice(0, 160)}{job.description?.length > 160 ? '…' : ''}</div>
                  </div>

                  <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Applicants</div>
                      <div className="text-lg font-bold">{apps.length}</div>
                    </div>

                    <button
                      onClick={() => openApplicants(job.id)}
                      className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-2 rounded"
                      title="View applicants"
                    >
                      <FaUsers /> View
                    </button>

                    {canManage(job) && (
                      <>
                        <Link to={`/edit-job/${job.id}`} className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-2 rounded">
                          <FaEdit /> Edit
                        </Link>
                        <button onClick={() => handleDelete(job.id)} className="flex items-center gap-2 bg-red-100 text-red-700 px-3 py-2 rounded">
                          <FaTrash /> Delete
                        </button>
                      </>
                    )}
                  </div>

                  {/* expanded applicants list */}
                  {expandedJob === job.id && (
                    <div className="mt-3 bg-gray-50 border-t pt-3 w-full">
                      {apps.length === 0 ? (
                        <div className="text-sm text-gray-600 p-3">No applicants yet.</div>
                      ) : (
                        <div className="space-y-2 p-3">
                          {apps.map((a) => {
                            const dev = usersMap[String(a.developerId)] || { firstName: a.developerId, email: a.email };
                            return (
                              <div key={a.id} className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <div className="font-medium">{dev.firstName ? `${dev.firstName} ${dev.lastName || ''}` : dev.email}</div>
                                  <div className="text-xs text-gray-500">Applied: {new Date(a.appliedAt).toLocaleString() || '—'}</div>
                                </div>
                                <div className="flex gap-2">
                                  <Link to={`/developer/${a.developerId}`} className="text-indigo-600 hover:underline flex items-center gap-2"><FaEye/> Profile</Link>
                                  <Link to={`/applications/${a.id}`} className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">View Application</Link>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Employees panel (NEW) */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Employees ({employees.length})</h2>
          {employees.length === 0 ? (
            <div className="bg-white p-4 rounded">No employees associated with this company.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {employees.map(emp => (
                <div key={emp.id} className="bg-white p-4 rounded shadow flex items-center gap-4">
                  <img src={emp.profilePhoto || 'https://placehold.co/60x60?text=Profile'} alt={emp.firstName} className="w-12 h-12 rounded-full object-cover border" onError={(e)=>e.target.src='https://placehold.co/60x60?text=Profile'} />
                  <div>
                    <div className="font-medium">{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.email}</div>
                    <div className="text-xs text-gray-500">{emp.position || emp.role}</div>
                  </div>
                  <div className="ml-auto">
                    <Link to={`/developer/${emp.id}`} className="text-indigo-600 hover:underline text-sm">View</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CompanyDashboardPage;