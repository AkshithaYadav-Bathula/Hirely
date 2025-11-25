// import { useState } from 'react';
// import { FaMapMarker, FaBuilding } from 'react-icons/fa';
// import { Link } from 'react-router-dom';

// const JobListing = ({ job }) => {
//   const [showFullDescription, setShowFullDescription] = useState(false);

//   let description = job.description || '';
//   if (!showFullDescription) {
//     description = description.substring(0, 90) + (job.description?.length > 90 ? '...' : '');
//   }

//   const companyId = job.company?.id ?? job.companyId;

//   return (
//     <div className='bg-white rounded-xl shadow-md relative hover:shadow-lg transition-shadow duration-300'>
//       <div className='p-4'>
//         <div className='mb-6'>
//           <div className='text-gray-600 my-2'>{job.type}</div>
//           <h3 className='text-xl font-bold'>{job.title}</h3>
//         </div>

//         <div className='mb-5'>{description}</div>

//         <button
//           onClick={() => setShowFullDescription((prevState) => !prevState)}
//           className='text-indigo-500 mb-5 hover:text-indigo-600'
//         >
//           {showFullDescription ? 'Less' : 'More'}
//         </button>

//         <h3 className='text-indigo-500 mb-2'>{job.salary} / Year</h3>

//         <div className='border border-gray-100 mb-5'></div>

//         <div className='flex flex-col lg:flex-row justify-between mb-4'>
//           <div className='text-orange-700 mb-3'>
//             <FaMapMarker className='inline text-lg mb-1 mr-1' />
//             {job.location}
//           </div>
//           <Link
//             to={`/jobs/${job.id}`}
//             className='h-[36px] bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-center text-sm'
//           >
//             Read More
//           </Link>
//         </div>

//         {/* Company section with improved styling */}
//       {/* Company section */}
//         {companyId && job.company?.name && (
//           <div className='border-t border-gray-100 pt-4 mt-4'>
//             <div className='flex items-center justify-between'>
//               <div className='flex items-center space-x-2'>
//                 <FaBuilding className='text-gray-500 text-sm' />
//                 <span className='text-gray-700 font-medium text-sm'>
//                   {job.company.name}
//                 </span>
//               </div>
//               <Link
//                 to={`/company/${companyId}`}
//                 className='text-indigo-500 hover:text-indigo-600 text-sm font-medium transition-colors'
//               >
//                 View Company →
//               </Link>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default JobListing;
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
    <div className='bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100'>
      <div className='p-6'>
        {/* Header Section */}
        <div className='mb-4'>
          <span className='inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-3'>
            {job.type}
          </span>
          <h3 className='text-2xl font-bold text-gray-800 mb-2'>{job.title}</h3>
        </div>

        {/* Description */}
        <div className='mb-4'>
          <p className='text-gray-600 leading-relaxed'>{description}</p>
          <button
            onClick={() => setShowFullDescription((prevState) => !prevState)}
            className='text-indigo-500 text-sm font-medium hover:text-indigo-700 mt-2'
          >
            {showFullDescription ? '← Show Less' : 'Read More →'}
          </button>
        </div>

        {/* Salary */}
        <div className='mb-5'>
          <span className='text-xl font-bold text-indigo-600'>{job.salary}</span>
          <span className='text-gray-500 text-sm ml-1'>/ Year</span>
        </div>

        <div className='border-t border-gray-200 my-5'></div>

        {/* Company Info Card */}
        {companyId && job.company?.name && (
          <div className='mb-5'>
            <div className='bg-gray-50 rounded-lg p-4 border border-gray-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='bg-indigo-100 p-2 rounded-lg'>
                    <FaBuilding className='text-indigo-600 text-lg' />
                  </div>
                  <div>
                    <p className='text-xs text-gray-500 mb-1'>Company</p>
                    <p className='text-base font-semibold text-gray-800'>{job.company.name}</p>
                  </div>
                </div>
                <Link
                  to={`/company/${companyId}`}
                  className='text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1'
                >
                  View
                  <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Location & Action */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center text-orange-600'>
            <FaMapMarker className='mr-2' />
            <span className='font-medium'>{job.location}</span>
          </div>
          <Link
            to={`/jobs/${job.id}`}
            className='bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors duration-300'
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default JobListing;