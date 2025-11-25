import { useState } from 'react';
import { FaMapMarker, FaBuilding } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const JobListing = ({ job }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  let description = job.description || '';
  if (!showFullDescription) {
    description = description.substring(0, 90) + (job.description?.length > 90 ? '...' : '');
  }

  const companyId = job.company?.id ?? job.companyId;

  return (
    <div className='bg-white rounded-xl shadow-md relative hover:shadow-lg transition-shadow duration-300'>
      <div className='p-4'>
        <div className='mb-6'>
          <div className='text-gray-600 my-2'>{job.type}</div>
          <h3 className='text-xl font-bold'>{job.title}</h3>
        </div>

        <div className='mb-5'>{description}</div>

        <button
          onClick={() => setShowFullDescription((prevState) => !prevState)}
          className='text-indigo-500 mb-5 hover:text-indigo-600'
        >
          {showFullDescription ? 'Less' : 'More'}
        </button>

        <h3 className='text-indigo-500 mb-2'>{job.salary} / Year</h3>

        <div className='border border-gray-100 mb-5'></div>

        <div className='flex flex-col lg:flex-row justify-between mb-4'>
          <div className='text-orange-700 mb-3'>
            <FaMapMarker className='inline text-lg mb-1 mr-1' />
            {job.location}
          </div>
          <Link
            to={`/jobs/${job.id}`}
            className='h-[36px] bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-center text-sm'
          >
            Read More
          </Link>
        </div>

        {/* Company section with improved styling */}
        {companyId && job.company?.name && (
          <div className='border-t border-gray-100 pt-4 mt-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <FaBuilding className='text-gray-500 text-sm' />
                <span className='text-gray-700 font-medium text-sm'>
                  {job.company.name}
                </span>
              </div>
              <Link
                to={`/company/${companyId}`}
                className='group relative inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:from-indigo-50 hover:to-indigo-100 hover:border-indigo-300 hover:text-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              >
                <FaBuilding className='mr-2 text-xs group-hover:text-indigo-600' />
                View Company
                <div className='absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 opacity-0 group-hover:opacity-5 transition-opacity duration-300'></div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobListing;
