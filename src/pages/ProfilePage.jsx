import React, { useState, useEffect, useRef } from 'react';
import { useLoaderData, Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './ProfilePage.css';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ IMPROVED: Draft Status Component with better visibility
const DraftStatusIndicator = ({ isDraft, isEditing, lastSaved, onPublish, onSaveDraft, saving }) => {
  if (!isEditing) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      background: 'white',
      border: `3px solid ${isDraft ? '#f59e0b' : '#10b981'}`,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      minWidth: '320px',
      maxWidth: '400px'
    }}>
      {/* Status Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: isDraft ? '#f59e0b' : '#10b981',
          animation: isDraft ? 'pulse 2s infinite' : 'none'
        }}></div>
        <span style={{
          fontWeight: 'bold',
          color: isDraft ? '#f59e0b' : '#10b981',
          fontSize: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {isDraft ? '📝 Draft Mode' : '✅ Published'}
        </span>
      </div>
      
      {/* Last Saved Info */}
      {lastSaved && (
        <p style={{
          fontSize: '13px',
          color: '#6b7280',
          margin: '0 0 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>🕒</span>
          Last saved: {new Date(lastSaved).toLocaleTimeString()}
        </p>
      )}

      {/* Action Buttons */}
      <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
        <button
          onClick={onSaveDraft}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
          }}
          onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
        >
          {saving ? '💾 Saving...' : '💾 Save as Draft'}
        </button>
        
        <button
          onClick={onPublish}
          disabled={saving}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
        >
          {saving ? '🚀 Publishing...' : '🚀 Publish Profile'}
        </button>
      </div>

      {/* Warning Message */}
      {isDraft && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#fef3cd',
          borderRadius: '8px',
          border: '1px solid #fbbf24'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#92400e',
            margin: 0,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: '1.5'
          }}>
            <span style={{fontSize: '16px'}}>⚠️</span>
            <span>Your changes are not visible to others until you click "Publish Profile"</span>
          </p>
        </div>
      )}
      
      {/* Success Message */}
      {!isDraft && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#d1fae5',
          borderRadius: '8px',
          border: '1px solid #10b981'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#065f46',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>✅</span>
            Your profile is live and visible to everyone
          </p>
        </div>
      )}
    </div>
  );
};

// ✅ AUTO-SAVE Hook
const useAutoSave = (data, callback, delay = 3000) => {
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(data);
      setLastSaved(new Date());
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, callback, delay]);

  return lastSaved;
};

const FilePreviewModal = ({ isOpen, onClose, fileUrl, fileType, fileName }) => {
  if (!isOpen) return null;

  const createGoogleDocsUrl = (url) => {
    const cleanUrl = url.split('?')[0];
    return `https://docs.google.com/gview?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
  };

  const renderContent = () => {
    switch (fileType) {
      case 'video':
        return (
          <div className="modal-content-wrapper">
            <h3>🎥 {fileName}</h3>
            
            <div style={{marginBottom: '20px'}}>
              <h4 style={{fontSize: '16px', marginBottom: '10px'}}>Native Player:</h4>
              <video 
                src={fileUrl} 
                controls 
                className="modal-video"
                autoPlay={false}
              />
            </div>

            <div>
              <h4 style={{fontSize: '16px', marginBottom: '10px'}}>Google Docs Viewer:</h4>
              <iframe
                src={createGoogleDocsUrl(fileUrl)}
                className="modal-iframe"
                style={{height: '500px'}}
                title="Video Preview in Google Docs"
              />
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="modal-content-wrapper">
            <h3>📄 {fileName}</h3>
            
            <iframe
              src={createGoogleDocsUrl(fileUrl)}
              className="modal-iframe"
              title="Document Preview"
            />
            
            <div style={{textAlign: 'center'}}>
              <a 
                href={fileUrl.split('?')[0]}
                download
                className="download-btn"
              >
                📥 Download Original
              </a>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="modal-content-wrapper">
            <h3>🖼️ {fileName}</h3>
            <img 
              src={fileUrl}
              alt={fileName}
              className="modal-image"
            />
          </div>
        );

      default:
        return <div>Unsupported file type</div>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-btn">
          ×
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

const SkillsDropdown = ({ availableSkills, selectedSkills, onSkillAdd, onSkillRemove, disabled }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSkills = availableSkills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSkills.find(s => s.id === skill.id)
  );

  return (
    <div className="skills-section">
      <label>Skills</label>
      
      <div className="selected-skills">
        {selectedSkills.length > 0 ? (
          selectedSkills.map(skill => (
            <div key={skill.id} className="skill-tag">
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => onSkillRemove(skill.id)}
                disabled={disabled}
                className="skill-remove-btn"
              >
                ×
              </button>
            </div>
          ))
        ) : (
          <span className="no-skills">No skills selected</span>
        )}
      </div>

      <div ref={dropdownRef} className="skills-dropdown">
        <input
          type="text"
          placeholder="Search and add skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsDropdownOpen(true)}
          disabled={disabled}
          className="skills-input"
        />
        
        {isDropdownOpen && filteredSkills.length > 0 && (
          <div className="skills-dropdown-menu">
            {filteredSkills.map(skill => (
              <div
                key={skill.id}
                onClick={() => {
                  onSkillAdd(skill);
                  setSearchTerm('');
                }}
                className="skill-option"
              >
                <div className="skill-option-name">{skill.name}</div>
                <small className="skill-option-category">{skill.category}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ProfilePage = (props) => {
  // ✅ ALL HOOKS MUST BE AT THE TOP - BEFORE ANY RETURNS OR CONDITIONAL LOGIC
  const loader = useLoaderData?.() || null;
  const { user, updateUser } = useAuth();
  const { id: companyParamId } = useParams();

  // ✅ ALL STATE HOOKS
  const [companyFallback, setCompanyFallback] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [lastAutoSaved, setLastAutoSaved] = useState(null);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [showActionBar, setShowActionBar] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profilePhoto: '',
    resume: '',
    introVideo: '',
    companyLogo: '',
    about: ''
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    fileUrl: '',
    fileType: '',
    fileName: ''
  });

  // ✅ ALL REF HOOKS
  const resumeRef = useRef();
  const photoRef = useRef();
  const videoRef = useRef();
  const logoRef = useRef();
  const quillRef = useRef(null);

  // ✅ COMPUTED VALUES
  const isLoggedInCompany = user?.role === 'company';
  const loggedInCompanyId = isLoggedInCompany ? user?.id : null;
  const effectiveCompanyId = companyParamId || loggedInCompanyId;

  // ✅ ALL EFFECT HOOKS - keeping all existing effects unchanged
  
  // Company data fetching effect
  useEffect(() => {
    if (loader && loader.company) return;
    if (!effectiveCompanyId) return;

    const base = 'http://localhost:8000';
    let cancelled = false;
    
    const fetchCompanyData = async () => {
      setCompanyLoading(true);
      try {
        const [companyRes, jobsRes, usersRes] = await Promise.all([
          fetch(`${base}/companies/${encodeURIComponent(effectiveCompanyId)}`),
          fetch(`${base}/jobs?companyId=${encodeURIComponent(effectiveCompanyId)}`),
          fetch(`${base}/users`)
        ]);
        
        if (!companyRes.ok) throw new Error('Company fetch failed');
        const company = await companyRes.json();
        const jobs = jobsRes.ok ? await jobsRes.json() : [];
        const users = usersRes.ok ? await usersRes.json() : [];

        const employees = users.filter(u => String(u.companyId) === String(company.id));

        let apps = [];
        if (jobs.length > 0) {
          const qs = jobs.map(j => `jobId=${encodeURIComponent(j.id)}`).join('&');
          const appsRes = await fetch(`${base}/applications?${qs}`);
          apps = appsRes.ok ? await appsRes.json() : [];
        }
        
        const applicationsByJob = {};
        apps.forEach(a => {
          const k = String(a.jobId);
          if (!applicationsByJob[k]) applicationsByJob[k] = [];
          applicationsByJob[k].push(a);
        });

        if (!cancelled) {
          setCompanyFallback({ company, jobs, employees, applicationsByJob });
        }
      } catch (err) {
        console.error('Company fallback load error', err);
      } finally {
        if (!cancelled) setCompanyLoading(false);
      }
    };

    fetchCompanyData();
    return () => { cancelled = true; };
  }, [effectiveCompanyId, loader]);

  // Load skills effect
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await fetch('http://localhost:8000/skills');
        const skills = await response.json();
        setAvailableSkills(skills || []);
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };
    fetchSkills();
  }, []);

  // Load profile effect
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || availableSkills.length === 0) return;

      try {
        const response = await fetch(`http://localhost:8000/users/${user.id}`);
        const userData = await response.json();

        const hasDraftVersion = userData.draft && Object.keys(userData.draft).length > 0;
        setHasDraft(hasDraftVersion);
        setIsDraft(hasDraftVersion);

        if (isEditing && hasDraftVersion) {
          setProfile({
            name: userData.draft.name || '',
            email: user.email,
            profilePhoto: userData.draft.profilePhoto || '',
            resume: userData.draft.resume || '',
            introVideo: userData.draft.introVideo || '',
            companyLogo: userData.draft.companyLogo || '',
            about: userData.draft.about || ''
          });

          if (userData.draft.skills) {
            const draftSkillObjects = availableSkills.filter(skill => 
              userData.draft.skills.includes(skill.id)
            );
            setSelectedSkills(draftSkillObjects);
          }
        } else {
          setProfile({
            name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: user.email,
            profilePhoto: userData.profilePhoto || '',
            resume: userData.resume || '',
            introVideo: userData.introVideo || '',
            companyLogo: userData.companyLogo || '',
            about: userData.about || ''
          });

          if (userData.skills) {
            const userSkillObjects = availableSkills.filter(skill => 
              userData.skills.includes(skill.id)
            );
            setSelectedSkills(userSkillObjects);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadProfile();
  }, [user, availableSkills, isEditing]);

  // Auto-save effect
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSaveDraft(false);
      setLastAutoSaved(new Date());
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [profile, selectedSkills, isEditing, hasUnsavedChanges]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowActionBar(true);
      } else {
        setShowActionBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ✅ HELPER FUNCTIONS - DEFINED BEFORE RENDERING LOGIC
  const openModal = (url, type, name) => {
    setModalState({
      isOpen: true,
      fileUrl: url,
      fileType: type,
      fileName: name
    });
  };

  const closeModal = () => {
    setModalState({
      isOpen: false,
      fileUrl: '',
      fileType: '',
      fileName: ''
    });
  };

  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSkillAdd = (skill) => {
    if (!selectedSkills.find(s => s.id === skill.id)) {
      setSelectedSkills(prev => [...prev, skill]);
      setHasUnsavedChanges(true);
    }
  };

  const handleSkillRemove = (skillId) => {
    setSelectedSkills(prev => prev.filter(skill => skill.id !== skillId));
    setHasUnsavedChanges(true);
  };

  const uploadToS3 = async (file, type) => {
    try {
      let folder = '';
      if (type === 'resume') folder = 'resumes';
      if (type === 'photo' || type === 'logo') folder = 'images';
      if (type === 'video') folder = 'videos';
      
      const fileName = `${user.id}/${folder}/${file.name}`;
      const fileBody = await file.arrayBuffer();
      
      const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_AWS_BUCKET,
        Key: fileName,
        Body: new Uint8Array(fileBody),
        ContentType: file.type,
      });

      await s3Client.send(command);
      
      const publicUrl = `https://${import.meta.env.VITE_AWS_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${fileName}`;
      return publicUrl;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    const maxSize = type === 'video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${type === 'video' ? '50MB' : '5MB'}`);
      return;
    }
    
    setUploading(true);
    
    try {
      const fileUrl = await uploadToS3(file, type);
      const fileUrlWithTimestamp = `${fileUrl}?t=${Date.now()}`;
      
      const fieldName = type === 'photo' ? 'profilePhoto' : 
                       type === 'logo' ? 'companyLogo' : 
                       type === 'video' ? 'introVideo' : 'resume';
                       
      handleProfileChange(fieldName, fileUrlWithTimestamp);
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    }
    
    setUploading(false);
  };

  const handleSaveDraft = async (showSuccessMessage = false) => {
    setSaving(true);
    
    try {
      const draftData = {
        name: profile.name || '',
        profilePhoto: profile.profilePhoto || '',
        resume: profile.resume || '',
        introVideo: profile.introVideo || '',
        companyLogo: profile.companyLogo || '',
        about: profile.about || '',
        skills: selectedSkills.map(skill => skill.id),
        lastModified: new Date().toISOString()
      };

      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftData })
      });

      if (response.ok) {
        setHasDraft(true);
        setIsDraft(true);
        setHasUnsavedChanges(false);
        setDraftData(draftData);
        setLastAutoSaved(new Date().toISOString());
        
        if (showSuccessMessage) {
          alert('✅ Draft saved successfully!');
        }
        
        console.log('✅ Draft saved to jobs.json');
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      
      if (showSuccessMessage) {
        alert('Failed to save draft. Please try again.');
      }
    }
    
    setSaving(false);
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this profile? This will replace your current published version.')) {
      return;
    }

    setSaving(true);
    
    try {
      const publishedData = {
        name: profile.name || '',
        profilePhoto: profile.profilePhoto || '',
        resume: profile.resume || '',
        introVideo: profile.introVideo || '',
        companyLogo: profile.companyLogo || '',
        about: profile.about || '',
        skills: selectedSkills.map(skill => skill.id),
        profileStatus: 'published',
        publishedAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        draft: null
      };

      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publishedData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setHasDraft(false);
        setIsDraft(false);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        alert('🎉 Profile published successfully!');
        window.location.reload();
      } else {
        throw new Error('Failed to publish profile');
      }
    } catch (error) {
      console.error('Error publishing profile:', error);
      alert('Failed to publish profile');
    }
    
    setSaving(false);
  };

  const handleDiscardDraft = async () => {
    if (!window.confirm('Are you sure you want to discard all draft changes?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: null })
      });

      if (response.ok) {
        setHasDraft(false);
        setIsDraft(false);
        setIsEditing(false);
        setHasUnsavedChanges(false);
        alert('Draft discarded');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error discarding draft:', error);
      alert('Failed to discard draft');
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const getCurrentProfileImage = () => {
    if (user?.role === 'developer') {
      return profile.profilePhoto || 'https://placehold.co/120x120?text=Profile';
    } else {
      return profile.companyLogo || 'https://placehold.co/120x120?text=Logo';
    }
  };

  const getFileName = (url) => {
    if (!url) return '';
    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      return decodeURIComponent(fileName.split('?')[0]);
    } catch {
      return 'File';
    }
  };

  // ✅ NOW ALL HOOKS ARE DECLARED - SAFE TO DO CONDITIONAL RENDERING
  const companyData = (loader && loader.company) ? loader : companyFallback;

  // Company loading state
  if (!loader && effectiveCompanyId && companyLoading) {
    return <div className="p-6">Loading company profile...</div>;
  }

  // // Company profile view - keeping unchanged
  // if (companyData && companyData.company) {
  //   const { company, jobs = [] } = companyData;
  //   const employees = companyData.employees || [];

  //   return (
  //     <div className="min-h-screen bg-gray-50">
  //       <main className="max-w-5xl mx-auto p-6">
  //         <div className="bg-white p-6 rounded-lg shadow">
  //           <div className="flex gap-6 items-start">
  //             <img
  //               src={company.logo || 'https://placehold.co/80x80?text=Logo'}
  //               alt={company.name}
  //               className="w-20 h-20 rounded-md object-cover"
  //             />
  //             <div>
  //               <h1 className="text-2xl font-bold">{company.name}</h1>
  //               <p className="text-sm text-gray-600 mt-2">{company.industry || ''} • {company.companySize || ''}</p>
  //               <p className="text-sm text-gray-500 mt-3">{company.description || 'No description available.'}</p>
  //               <div className="mt-3 text-sm text-gray-700">
  //                 <div>Email: {company.contactEmail || 'N/A'}</div>
  //                 <div>Phone: {company.contactPhone || 'N/A'}</div>
  //                 {company.website && (
  //                   <div>Website: <a href={company.website} target="_blank" rel="noreferrer" className="text-indigo-600">{company.website}</a></div>
  //                 )}
  //               </div>
  //             </div>
  //           </div>
  //         </div>

  //         <section className="mt-6">
  //           <div className="flex items-center justify-between mb-4">
  //             <h2 className="text-lg font-semibold">Open Positions</h2>
  //             <span className="text-sm text-gray-500">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
  //           </div>

  //           {jobs.length === 0 ? (
  //             <div className="bg-white rounded-lg shadow p-6 text-gray-500">No jobs posted yet.</div>
  //           ) : (
  //             <div className="grid gap-4">
  //               {jobs.map((job) => (
  //                 <div key={job.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
  //                   <div>
  //                     <Link to={`/jobs/${job.id}`} className="text-indigo-600 font-medium">{job.title}</Link>
  //                     <div className="text-sm text-gray-600">{job.location} • {job.type}</div>
  //                   </div>
  //                   <div className="text-sm text-gray-500">{job.salary || '—'}</div>
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </section>

  //         <section className="mt-6">
  //           <h2 className="text-lg font-semibold mb-3">Employees</h2>
  //           {(!employees || employees.length === 0) ? (
  //             <div className="bg-white p-4 rounded">No employees listed for this company.</div>
  //           ) : (
  //             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  //               {employees.map(emp => (
  //                 <div key={emp.id} className="bg-white p-3 rounded flex items-center gap-3">
  //                   <img src={emp.profilePhoto || 'https://placehold.co/48x48?text=Profile'} alt={emp.name || emp.firstName} className="w-12 h-12 rounded-full object-cover" />
  //                   <div>
  //                     <div className="font-medium">{emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : (emp.name || emp.email)}</div>
  //                     <div className="text-xs text-gray-500">{emp.role || emp.position || 'Employee'}</div>
  //                   </div>
  //                   <div className="ml-auto">
  //                     <Link to={`/developer/${emp.id}`} className="text-indigo-600 text-sm">View</Link>
  //                   </div>
  //                 </div>
  //               ))}
  //             </div>
  //           )}
  //         </section>
  //       </main>
  //     </div>
  //   );
  // }
  
// Replace the company profile view section in ProfilePage.jsx with this CLEAN, PROFESSIONAL version:

// Company profile view - CLEAN & PROFESSIONAL VERSION
if (companyData && companyData.company) {
  const { company, jobs = [] } = companyData;
  const employees = companyData.employees || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean Header Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={company.logo || 'https://placehold.co/80x80?text=Logo'}
                alt={company.name}
                className="w-20 h-20 rounded-lg object-cover border border-gray-200"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-gray-600 mt-1">{company.industry || 'Company'}</p>
              </div>
            </div>
            {company.website && (
              <a 
                href={company.website} 
                target="_blank" 
                rel="noreferrer"
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Overview Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">About</h2>
          <p className="text-gray-700 leading-relaxed mb-8">
            {company.description || 'No description available.'}
          </p>

          {/* Company Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 border-t border-gray-200">
            {company.headquarters && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Location</div>
                <div className="text-gray-900 font-medium">{company.headquarters}</div>
              </div>
            )}
            {company.companySize && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Company Size</div>
                <div className="text-gray-900 font-medium">{company.companySize} employees</div>
              </div>
            )}
            {company.foundedYear && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Founded</div>
                <div className="text-gray-900 font-medium">{company.foundedYear}</div>
              </div>
            )}
            {company.industry && (
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Industry</div>
                <div className="text-gray-900 font-medium">{company.industry}</div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {company.contactEmail && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Email</div>
                  <a href={`mailto:${company.contactEmail}`} className="text-gray-900 hover:text-indigo-600 font-medium">
                    {company.contactEmail}
                  </a>
                </div>
              </div>
            )}
            {company.contactPhone && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Phone</div>
                  <a href={`tel:${company.contactPhone}`} className="text-gray-900 hover:text-indigo-600 font-medium">
                    {company.contactPhone}
                  </a>
                </div>
              </div>
            )}
            {company.website && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Website</div>
                  <a href={company.website} target="_blank" rel="noreferrer" className="text-gray-900 hover:text-indigo-600 font-medium">
                    {company.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            )}
            {(company.socialLinks?.linkedin || company.socialLinks?.twitter) && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-2">Social Media</div>
                  <div className="flex gap-2">
                    {company.socialLinks?.linkedin && (
                      <a href={company.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-indigo-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                    {company.socialLinks?.twitter && (
                      <a href={company.socialLinks.twitter} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-indigo-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section - Only if analytics exist */}
        {company.analytics && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  ₹{(company.analytics.monthlyRevenue / 100000).toFixed(1)}L
                </div>
                <div className="text-sm text-gray-600 mt-2">Monthly Revenue</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {company.analytics.activeProjects || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Active Projects</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {company.analytics.totalClients || 0}
                </div>
                <div className="text-sm text-gray-600 mt-2">Total Clients</div>
              </div>
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-3xl font-bold text-gray-900">
                  {company.analytics.projectSuccessRate || 0}%
                </div>
                <div className="text-sm text-gray-600 mt-2">Success Rate</div>
              </div>
            </div>
          </div>
        )}

        {/* Open Positions Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Open Positions</h2>
            <span className="text-sm text-gray-500">{jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}</span>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-600">No open positions at the moment</p>
              <p className="text-sm text-gray-500 mt-1">Check back later for new opportunities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link 
                        to={`/jobs/${job.id}`} 
                        className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                      >
                        {job.title}
                      </Link>
                      <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {job.type}
                        </span>
                        {job.salary && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.salary}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-gray-600 mt-3 line-clamp-2">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <Link
                      to={`/jobs/${job.id}`}
                      className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Our Team</h2>
            <span className="text-sm text-gray-500">{employees.length} {employees.length === 1 ? 'member' : 'members'}</span>
          </div>

          {(!employees || employees.length === 0) ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-gray-600">No team members listed</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map(emp => (
                <div 
                  key={emp.id} 
                  className="border border-gray-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={emp.profilePhoto || 'https://placehold.co/56x56?text=User'} 
                      alt={emp.name || emp.firstName} 
                      className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {emp.firstName ? `${emp.firstName} ${emp.lastName || ''}`.trim() : (emp.name || emp.email)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {emp.position || emp.role || 'Employee'}
                      </div>
                      <Link
                        to={`/developer/${emp.id}`}
                        className="inline-block mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View profile →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
  // ✅ DEVELOPER PROFILE - keeping all existing JSX except removing the floating indicator
  return (
    <div className="profile-container">
      <FilePreviewModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        fileUrl={modalState.fileUrl}
        fileType={modalState.fileType}
        fileName={modalState.fileName}
      />

      {/* Profile Header */}
      <div className="profile-header">
        <img 
          src={getCurrentProfileImage()}
          alt="Profile" 
          className="profile-photo"
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: hasDraft ? '4px solid #f59e0b' : '4px solid #5a67d8'
          }}
          onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=Profile'; }}
        />
        <div className="profile-info">
          <h2>
            {profile.name || user?.email}
            {hasDraft && (
              <span className="draft-badge" style={{
                marginLeft: '12px',
                padding: '4px 12px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600'
              }}>📝 DRAFT</span>
            )}
          </h2>
          <p>{profile.email}</p>
          <span className="role-badge">{user?.role}</span>
        </div>
        
        <div style={{display: 'flex', gap: '8px'}}>
          {!isEditing ? (
            <>
              <button onClick={() => setIsEditing(true)} className="edit-btn">
                {hasDraft ? 'Continue Editing Draft' : 'Edit Profile'}
              </button>
              {hasDraft && (
                <button onClick={handleDiscardDraft} className="discard-btn" style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  🗑️ Discard Draft
                </button>
              )}
            </>
          ) : (
            <button onClick={() => setIsEditing(false)} className="cancel-btn" style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="edit-form">
          {/* Draft warning banner */}
          {hasDraft && (
            <div style={{
              background: '#fef3cd',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <i className="fas fa-exclamation-triangle" style={{color: '#f59e0b'}}></i>
              <span style={{fontSize: '14px', color: '#856404'}}>
                You are editing a draft. Your changes are not visible to others until published.
              </span>
            </div>
          )}

          {/* Name field */}
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          {/* About section */}
          <div className="form-group">
            <label>About</label>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={profile.about}
              onChange={(value) => handleProfileChange('about', value)}
              modules={modules}
            />
          </div>

          {/* Skills section */}
          {user?.role === 'developer' && (
            <SkillsDropdown
              availableSkills={availableSkills}
              selectedSkills={selectedSkills}
              onSkillAdd={handleSkillAdd}
              onSkillRemove={handleSkillRemove}
              disabled={uploading || saving}
            />
          )}

          {/* Profile Photo */}
          {user?.role === 'developer' && (
            <div className="form-group">
              <label>Profile Photo</label>
              <input 
                ref={photoRef}
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0], 'photo')}
                disabled={uploading}
              />
              {profile.profilePhoto && (
                <div className="file-preview" style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <img 
                    src={profile.profilePhoto} 
                    alt="Profile Preview" 
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #5a67d8',
                      cursor: 'pointer',
                      display: 'block',
                      margin: '0 auto'
                    }}
                    key={profile.profilePhoto}
                    onClick={() => openModal(profile.profilePhoto, 'image', getFileName(profile.profilePhoto))}
                    onError={(e) => {
                      console.error('Image failed to load:', profile.profilePhoto);
                      e.target.src = 'https://placehold.co/120x120?text=Error';
                      e.target.style.border = '3px solid #dc3545';
                    }}
                  />
                  <small style={{
                    color: '#28a745',
                    display: 'block',
                    marginTop: '10px',
                    fontWeight: '500',
                    fontSize: '13px'
                  }}>
                    ✅ Photo uploaded successfully
                  </small>
                  <small style={{
                    color: '#6c757d',
                    display: 'block',
                    marginTop: '5px',
                    fontSize: '12px'
                  }}>
                    Click image to preview in full screen
                  </small>
                  <button
                    type="button"
                    onClick={() => handleProfileChange('profilePhoto', '')}
                    style={{
                      background: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Remove Photo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Resume */}
          {user?.role === 'developer' && (
            <div className="form-group">
              <label>
                Resume
                {profile.resume && (
                  <span style={{color: '#5a67d8', fontSize: '14px', marginLeft: '10px'}}>
                    Current: {getFileName(profile.resume)}
                  </span>
                )}
              </label>
              <input 
                ref={resumeRef}
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => handleFileUpload(e.target.files[0], 'resume')}
                disabled={uploading}
              />
              {profile.resume && (
                <div className="file-preview" style={{marginTop: '10px'}}>
                  <div style={{
                    background: '#f8f9fa',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{fontWeight: '500', color: '#495057'}}>
                        {getFileName(profile.resume)}
                      </div>
                      <small style={{color: '#6c757d'}}>Resume file uploaded</small>
                    </div>
                    <div style={{display: 'flex', gap: '8px'}}>
                      <button
                        type="button"
                        onClick={() => openModal(profile.resume, 'document', getFileName(profile.resume))}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        🔍 Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => handleProfileChange('resume', '')}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Introduction Video */}
          {user?.role === 'developer' && (
            <div className="form-group">
              <label>Introduction Video</label>
              <input 
                ref={videoRef}
                type="file" 
                accept="video/*"
                onChange={(e) => handleFileUpload(e.target.files[0], 'video')}
                disabled={uploading}
              />
              
              {profile.introVideo && (
                <div className="file-preview" style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}>
                    <div>
                      <div style={{fontWeight: '600', fontSize: '14px', color: '#495057'}}>
                        📹 {getFileName(profile.introVideo)}
                      </div>
                      <small style={{color: '#6c757d'}}>Current: intro.mp4</small>
                    </div>
                  </div>

                  <video 
                    src={profile.introVideo} 
                    controls 
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      height: 'auto',
                      aspectRatio: '16/9',
                      borderRadius: '8px',
                      border: '2px solid #5a67d8',
                      display: 'block',
                      margin: '0 auto',
                      background: '#000'
                    }}
                  />
                  
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'center'
                  }}>
                    <button
                      type="button"
                      onClick={() => openModal(profile.introVideo, 'video', getFileName(profile.introVideo))}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                    >
                      🔍 Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProfileChange('introVideo', '')}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      Remove Video
                    </button>
                  </div>
                  
                  <small style={{
                    display: 'block',
                    textAlign: 'center',
                    color: '#28a745',
                    marginTop: '8px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    ✅ Video uploaded successfully
                  </small>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            marginTop: '40px',
            paddingTop: '24px',
            borderTop: '2px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{flex: 1, minWidth: '200px'}}>
              {hasDraft && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    animation: 'pulse 2s infinite'
                  }}></div>
                  <span style={{
                    color: '#f59e0b',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    📝 Draft Mode - Changes not published
                  </span>
                </div>
              )}
              {lastAutoSaved && (
                <small style={{
                  color: '#6b7280',
                  fontSize: '12px',
                  display: 'block'
                }}>
                  🕒 Last saved: {new Date(lastAutoSaved).toLocaleTimeString()}
                </small>
              )}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexShrink: 0
            }}>
              <button 
                onClick={() => handleSaveDraft(true)}
                disabled={uploading || saving}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: uploading || saving ? 'not-allowed' : 'pointer',
                  opacity: uploading || saving ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '160px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Saving...
                  </>
                ) : (
                  <>💾 Save as Draft</>
                )}
              </button>
              
              <button 
                onClick={handlePublish}
                disabled={uploading || saving}
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: uploading || saving ? 'not-allowed' : 'pointer',
                  opacity: uploading || saving ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '180px',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => !saving && (e.target.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
              >
                {saving ? (
                  <>
                    <span className="spinner-small"></span>
                    Publishing...
                  </>
                ) : (
                  <>🚀 Publish Profile</>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="view-mode">
          {isDraft && (
            <div style={{
              background: '#fef3cd',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px'}}>
                  📝 This profile has unpublished changes
                </div>
                <div style={{fontSize: '14px', color: '#666'}}>
                  Your draft changes are not visible to others. Click "Edit Profile" to publish them.
                </div>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  background: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Edit & Publish
              </button>
            </div>
          )}

          <div className="about-section">
            <h3>About {user?.role === 'developer' ? 'Me' : 'Company'}</h3>
            <div 
              className="about-content" 
              dangerouslySetInnerHTML={{ 
                __html: profile.about || '<p class="no-content">No description added yet</p>' 
              }}
            />
          </div>

          {user?.role === 'developer' && (
            <div className="skills-view-section" style={{marginTop: '30px'}}>
              <h3>🛠️ Skills</h3>
              <div style={{
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '15px'
              }}>
                {selectedSkills.length > 0 ? (
                  <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                    {selectedSkills.map(skill => (
                      <div
                        key={skill.id}
                        style={{
                          background: '#5a67d8',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '25px',
                          fontSize: '14px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{skill.name}</span>
                        <small style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          fontSize: '11px'
                        }}>
                          {skill.category}
                        </small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{color: '#6c757d', fontStyle: 'italic'}}>No skills added yet</p>
                )}
              </div>
            </div>
          )}
          
          {user?.role === 'developer' && profile.resume && (
            <div className="resume-section" style={{marginTop: '30px'}}>
              <h3>Resume</h3>
              <div style={{
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '8px',
                padding: '20px',
                marginTop: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '15px'
                }}>
                  <div>
                    <div style={{fontWeight: '600', fontSize: '16px', color: '#495057'}}>
                      {getFileName(profile.resume)}
                    </div>
                    <small style={{color: '#6c757d'}}>Resume Document</small>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button
                      onClick={() => openModal(profile.resume, 'document', getFileName(profile.resume))}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Preview
                    </button>
                    <a 
                      href={profile.resume.split('?')[0]}
                      download
                      style={{
                        background: '#5a67d8',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      📥 Download
                    </a>
                  </div>
                </div>
                
                <div 
                  style={{
                    height: '200px',
                    background: '#f8f9fa',
                    border: '2px dashed #5a67d8',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => openModal(profile.resume, 'document', getFileName(profile.resume))}
                >
                  <div style={{textAlign: 'center', color: '#5a67d8'}}>
                    <div style={{fontSize: '48px', marginBottom: '10px'}}>📄</div>
                    <div style={{fontSize: '16px', fontWeight: '500'}}>Click to Preview Resume</div>
                    <div style={{fontSize: '14px', color: '#6c757d', marginTop: '5px'}}>
                      {getFileName(profile.resume)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {user?.role === 'developer' && profile.introVideo && (
            <div className="video-section" style={{marginTop: '30px'}}>
              <h3>🎥 Introduction Video</h3>
              <div style={{
                background: 'white',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '24px',
                marginTop: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{fontWeight: '600', fontSize: '16px', color: '#495057'}}>
                      {getFileName(profile.introVideo)}
                    </div>
                    <small style={{color: '#6c757d'}}>Introduction Video</small>
                  </div>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button
                      onClick={() => openModal(profile.introVideo, 'video', getFileName(profile.introVideo))}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Full Screen
                    </button>
                    <a 
                      href={profile.introVideo.split('?')[0]}
                      download
                      style={{
                        background: '#5a67d8',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      📥 Download
                    </a>
                  </div>
                </div>
                
                <div style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: '640px',
                  margin: '0 auto',
                  background: '#000',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }}>
                  <video 
                    src={profile.introVideo} 
                    controls
                    controlsList="nodownload"
                    style={{
                      width: '100%',
                      height: 'auto',
                      aspectRatio: '16/9',
                      display: 'block',
                      objectFit: 'contain'
                    }}
                    poster=""
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <p style={{
                  textAlign: 'center',
                  color: '#6c757d',
                  fontSize: '13px',
                  marginTop: '12px',
                  fontStyle: 'italic'
                }}>
                  💡 Click "Full Screen" button above for better viewing experience
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ❌ REMOVED: Floating Draft Status Indicator component */}
      {/* The if (companyData && companyData.company) {
DraftStatusIndicator component call has been removed */}
    </div>
  );
};

export default ProfilePage;