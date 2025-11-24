import React from 'react';
import { useLoaderData, Link } from 'react-router-dom';

const CompanyProfilePage = () => {
  const { company, jobs = [] } = useLoaderData() || {};

  if (!company) {
    return <div className="min-h-screen flex items-center justify-center">Company not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex gap-6 items-start">
            <img
              src={company.logo || 'https://placehold.co/80x80?text=Logo'}
              alt={company.name}
              className="w-20 h-20 rounded-md object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="text-sm text-gray-600 mt-2">{company.industry || ''} • {company.companySize || ''}</p>
              <p className="text-sm text-gray-500 mt-3">{company.description || 'No description available.'}</p>
              <div className="mt-3 text-sm text-gray-700">
                <div>Email: {company.contactEmail || 'N/A'}</div>
                <div>Phone: {company.contactPhone || 'N/A'}</div>
                {company.website && (
                  <div>Website: <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-600">{company.website}</a></div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Open Positions</h2>
            <span className="text-sm text-gray-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-gray-500">No jobs posted yet.</div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                  <div>
                    <Link to={`/jobs/${job.id}`} className="text-indigo-600 font-medium">{job.title}</Link>
                    <div className="text-sm text-gray-600">{job.location} • {job.type}</div>
                  </div>
                  <div className="text-sm text-gray-500">{job.salary || '—'}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export const companyLoader = async ({ params }) => {
  const base = 'http://localhost:8000';
  // try local JSON fallback if using static file in dev
  try {
    const cRes = await fetch(`${base}/companies/${params.id}`);
    if (cRes.ok) {
      const company = await cRes.json();
      const jobsRes = await fetch(`${base}/jobs?companyId=${company.id}`);
      const jobs = jobsRes.ok ? await jobsRes.json() : [];
      return { company, jobs };
    }
  } catch (err) {
    // fallback to local jobs.json if API not running
    // eslint-disable-next-line no-undef
  }

  // fallback: try importing static data (if your app uses jobs.json locally)
  try {
    // dynamic import to avoid bundling issues
    const data = await import('../jobs.json');
    const company = (data.companies || []).find((c) => String(c.id) === String(params.id));
    const jobs = (data.jobs || []).filter((j) => String(j.companyId) === String(params.id));
    if (company) return { company, jobs };
  } catch (err) {
    console.warn('company loader fallback failed', err);
  }

  throw new Response('Company not found', { status: 404 });
};

export default CompanyProfilePage;