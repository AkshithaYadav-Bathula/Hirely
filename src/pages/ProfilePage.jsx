import React, { useState, useEffect, useRef } from 'react';
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

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
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

  const resumeRef = useRef();
  const photoRef = useRef();
  const videoRef = useRef();
  const logoRef = useRef();
  const quillRef = useRef(null);

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

  // ✅ Load skills
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

  // ✅ Load profile data and check for draft
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || availableSkills.length === 0) return;

      try {
        const response = await fetch(`http://localhost:8000/users/${user.id}`);
        const userData = await response.json();

        // Check if user has draft
        const hasDraftVersion = userData.draft && Object.keys(userData.draft).length > 0;
        setHasDraft(hasDraftVersion);
        setIsDraft(hasDraftVersion);

        if (isEditing && hasDraftVersion) {
          // Load draft when editing
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
          // Load published version
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

  // ✅ Auto-save effect - SILENT (no popups)
  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSaveDraft(false); // ✅ Pass false for silent save
      setLastAutoSaved(new Date());
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [profile, selectedSkills, isEditing, hasUnsavedChanges]);

  // ✅ Handle profile changes
  const handleProfileChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // ✅ Skills management
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

  // ✅ File upload to S3
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

  // ✅ IMPROVED: Save Draft Function without annoying popups
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
        
        // ✅ Only show alert if manually triggered
        if (showSuccessMessage) {
          alert('✅ Draft saved successfully!');
        }
        
        console.log('✅ Draft saved to jobs.json');
      } else {
        throw new Error('Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      
      // ✅ Only show error alert if manually triggered
      if (showSuccessMessage) {
        alert('Failed to save draft. Please try again.');
      }
    }
    
    setSaving(false);
  };

  // ✅ PUBLISH PROFILE
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

  // ✅ DISCARD DRAFT
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

  // ✅ NEW: Track scroll position to show/hide action bar
  const [showActionBar, setShowActionBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show action bar when user scrolls down more than 200px
      if (window.scrollY > 200) {
        setShowActionBar(true);
      } else {
        setShowActionBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

          {/* Profile Photo / Company Logo */}
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
                      <small style={{color: '#6c757d'}}>Current: 1.mp4</small>
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

          {/* ✅ ACTION BUTTONS AT THE BOTTOM - RIGHT AFTER VIDEO */}
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
            {/* Left side - Status info */}
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
            
            {/* Right side - Action buttons */}
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
          {/* ✅ NEW: Show draft notice in view mode */}
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
          
          {/* Resume and Video sections remain the same */}
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
                
                {/* ✅ FIXED: Better sized video player with proper aspect ratio */}
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
    </div>
  );
};

export default ProfilePage;