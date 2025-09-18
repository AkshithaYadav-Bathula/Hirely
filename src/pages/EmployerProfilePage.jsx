import React, { useState } from 'react';
import './EmployerProfilePage.css';
import S3FileUpload from '../components/S3FileUpload';

const EmployerProfilePage = () => {
  const [logoUrl, setLogoUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDesc, setCompanyDesc] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    // Save companyName, companyDesc, logoUrl to your backend or JSON server
  };

  return (
    <div className="employer-profile-card">
      <div className="employer-profile-title">Company Profile</div>
      <form onSubmit={handleUpdate}>
        {/* Company logo upload */}
        <S3FileUpload
          value={logoUrl}
          onChange={e => setLogoUrl(e.target.value)}
          name="companyLogo"
          fileType="image"
          folder="company_logos/"
          sizeLimit={5 * 1024 * 1024}
          accept="image/*"
          label="Company Logo"
        />

        {/* Company name */}
        <div>
          <label className="employer-profile-label">Company Name</label>
          <input
            type="text"
            className="employer-profile-input"
            placeholder="Enter your company name"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
        </div>

        {/* Company description */}
        <div>
          <label className="employer-profile-label">Company Description</label>
          <textarea
            className="employer-profile-textarea"
            rows={4}
            placeholder="Describe your company, mission, and work culture..."
            value={companyDesc}
            onChange={e => setCompanyDesc(e.target.value)}
          />
        </div>

        <button className="employer-profile-btn" type="submit">Update Profile</button>
      </form>
    </div>
  );
};

export default EmployerProfilePage;
