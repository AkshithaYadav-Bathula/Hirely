import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import ReactQuill from 'react-quill';  // ✅ Simple import
import 'react-quill/dist/quill.snow.css';
import './ProfilePage.css';

const s3Client = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

// ✅ FIXED: Modal with larger size
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

// ✅ UPDATED: Skills Dropdown Component with CSS classes
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
      
      {/* Selected Skills Display */}
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

      {/* Dropdown to Add Skills */}
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
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // ✅ NEW: Skills state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  
  const [modalState, setModalState] = useState({
    isOpen: false,
    fileUrl: '',
    fileType: '',
    fileName: ''
  });
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profilePhoto: '',
    resume: '',
    introVideo: '',
    companyLogo: '',
    about: ''
  });

  const resumeRef = useRef();
  const photoRef = useRef();
  const videoRef = useRef();
  
  // ✅ ADD THESE TWO LINES HERE (inside the component)
  const quillRef = useRef(null);

  // ✅ Fixed table insertion with paragraph
  const insertTable = () => {
    if (!quillRef.current) return;
    
    const quill = quillRef.current.getEditor();
    const range = quill.getSelection(true);
    
    // Insert a paragraph first, then the table
    const tableHTML = `
      <p>Here's a sample table:</p>
      <table style="border-collapse: collapse; width: 100%; margin: 10px 0; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Header 1</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Header 2</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Header 3</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 1, Col 1</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 1, Col 2</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 1, Col 3</td>
          </tr>
          <tr style="background-color: #f9f9f9;">
            <td style="border: 1px solid #ddd; padding: 12px;">Row 2, Col 1</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 2, Col 2</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 2, Col 3</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 3, Col 1</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 3, Col 2</td>
            <td style="border: 1px solid #ddd; padding: 12px;">Row 3, Col 3</td>
          </tr>
        </tbody>
      </table>
      <p>You can edit the table content above.</p>
    `;
    
    // Insert the HTML content
    quill.clipboard.dangerouslyPasteHTML(range.index, tableHTML);
    
    // Move cursor to after the inserted content
    const newPosition = range.index + tableHTML.length;
    quill.setSelection(newPosition);
  };

  // ✅ FIXED: Fetch available skills from json-server
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

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
        email: user.email || '',
        profilePhoto: user.profilePhoto || '',
        resume: user.resume || '',
        introVideo: user.introVideo || '',
        companyLogo: user.companyLogo || '',
        about: user.about || ''
      });

      // ✅ FIXED: Load user skills properly
      if (user.skills && availableSkills.length > 0) {
        const userSkillObjects = availableSkills.filter(skill => 
          user.skills.includes(skill.id)
        );
        setSelectedSkills(userSkillObjects);
      } else {
        setSelectedSkills([]);
      }
    }
  }, [user, availableSkills]);

  // ✅ NEW: Skills management functions
  const handleSkillAdd = (skill) => {
    const skillExists = selectedSkills.find(s => s.id === skill.id);
    if (!skillExists) {
      setSelectedSkills(prev => [...prev, skill]);
      console.log(`✅ Added skill: ${skill.name}`);
    }
  };

  const handleSkillRemove = (skillId) => {
    setSelectedSkills(prev => prev.filter(skill => skill.id !== skillId));
    console.log(`❌ Removed skill with ID: ${skillId}`);
  };

  const handleSave = async () => {
  setSaving(true);
  
  try {
    const updatedProfile = {
      ...profile,
      skills: selectedSkills.map(skill => skill.id) // Save only skill IDs
    };
    
    await updateProfile(updatedProfile);
    
    console.log('✅ Profile saved successfully!');
    alert('Profile updated successfully!');
    setIsEditing(false);
    
  } catch (error) {
    console.error('❌ Save failed:', error);
    alert('Failed to save profile. Please try again.');
  }
  
  setSaving(false);
};
  const openModal = (fileUrl, fileType, fileName) => {
    setModalState({
      isOpen: true,
      fileUrl: fileUrl,
      fileType: fileType,
      fileName: fileName
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

  const createGoogleDocsViewerUrl = (s3Url) => {
    if (!s3Url) return '';
    const cleanUrl = s3Url.split('?')[0];
    return `https://docs.google.com/gview?url=${encodeURIComponent(cleanUrl)}&embedded=true`;
  };

  const getFileUrls = (fileUrl, type) => {
    if (!fileUrl) return { direct: '', viewer: '', isViewable: false };
    
    const directUrl = fileUrl.split('?')[0];
    const viewerUrl = createGoogleDocsViewerUrl(fileUrl);
    
    return {
      direct: directUrl,
      viewer: viewerUrl,
      isViewable: true
    };
  };

  const uploadToS3 = async (file, type) => {
    try {
      let folder = '';
      if (type === 'resume') folder = 'resumes';
      if (type === 'photo' || type === 'logo') folder = 'images';
      if (type === 'video') folder = 'videos';
      
      const fileName = `Akshitha/${folder}/${file.name}`;
      
      const fileBody = await file.arrayBuffer();
      
      const command = new PutObjectCommand({
        Bucket: import.meta.env.VITE_AWS_BUCKET,
        Key: fileName,
        Body: new Uint8Array(fileBody),
        ContentType: file.type,
      });

      await s3Client.send(command);
      
      const publicUrl = `https://${import.meta.env.VITE_AWS_BUCKET}.s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${fileName}`;
      
      console.log(`✅ Uploaded to S3: ${publicUrl}`);
      
      const viewerUrl = createGoogleDocsViewerUrl(publicUrl);
      console.log(`📄 Google Docs Viewer URL: ${viewerUrl}`);
      console.log(`📁 Uploaded to folder: ${folder}`);
      
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
      
      setProfile(prev => ({
        ...prev,
        [type === 'photo' ? 'profilePhoto' : 
         type === 'logo' ? 'companyLogo' : 
         type === 'video' ? 'introVideo' : 'resume']: fileUrlWithTimestamp
      }));
      
      console.log(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`);
      
    } catch (error) {
      console.error('❌ Upload failed:', error.message);
      alert('Upload failed. Please try again.');
    }
    
    setUploading(false);
  };

 

  // const modules = {
  //   toolbar: [
  //     [{ 'header': [1, 2, 3, false] }],
  //     ['bold', 'italic', 'underline', 'strike'],
  //     [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  //     [{ 'indent': '-1'}, { 'indent': '+1' }],
  //     ['link'],
  //     [{ 'color': [] }, { 'background': [] }],
  //     [{ 'align': [] }],
  //     ['clean']
  //   ],
  // };
  const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'list': 'check' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'align': [] }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    ['table'], // ✅ ADD THIS - Table icon in toolbar
    ['clean']
  ],
  clipboard: {
    matchVisual: false
  }
};

  // const formats = [
  //   'header', 'bold', 'italic', 'underline', 'strike',
  //   'list', 'bullet', 'indent', 'link', 'color', 'background', 'align'
  // ];
  

const formats = [
  'header', 'font', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'script',
  'list', 'bullet', 'check',
  'indent',
  'direction', 'align',
  'blockquote', 'code-block',
  'link', 'image', 'video'
];

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
      const cleanFileName = fileName.split('?')[0];
      return decodeURIComponent(cleanFileName);
    } catch {
      return 'File';
    }
  };

  return (
    <div className="profile-container">
      <FilePreviewModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        fileUrl={modalState.fileUrl}
        fileType={modalState.fileType}
        fileName={modalState.fileName}
      />

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
            border: '4px solid #5a67d8',
            boxShadow: '0 4px 12px rgba(90, 103, 216, 0.3)',
            cursor: 'pointer'
          }}
          key={`${profile.profilePhoto}-${profile.companyLogo}-${Date.now()}`}
          onError={(e) => { e.target.src = 'https://placehold.co/120x120?text=Profile'; }}
          onClick={() => {
            const imageUrl = user?.role === 'developer' ? profile.profilePhoto : profile.companyLogo;
            if (imageUrl) {
              openModal(imageUrl, 'image', getFileName(imageUrl));
            }
          }}
        />
        <div className="profile-info">
          <h2>{profile.name || user?.email}</h2>
          <p>{profile.email}</p>
          <span className="role-badge">{user?.role}</span>
        </div>
        <button 
          onClick={() => setIsEditing(!isEditing)} 
          className="edit-btn"
          disabled={uploading || saving}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {isEditing ? (
        <div className="edit-form">
          <div className="form-group">
            <label>Name</label>
            <input 
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({...prev, name: e.target.value}))}
              placeholder="Enter your name"
            />
          </div>
          <div className="form-group">
            <label className="editor-label">
              About {user?.role === 'developer' ? 'Me' : 'Company'}
            </label>
            <div className="editor-wrapper">
              {/* ✅ Updated table button */}
              <button
                type="button"
                onClick={insertTable}
                style={{
                  marginBottom: '10px',
                  padding: '8px 16px',
                  background: '#5a67d8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📊 Insert Table (3×3)
              </button>
              
              <ReactQuill
                ref={quillRef}  // ✅ Add ref
                theme="snow"
                value={profile.about}
                onChange={(value) => setProfile(prev => ({...prev, about: value}))}
                modules={modules}
                formats={formats}
                placeholder="Tell us about yourself, your experience, skills, and what makes you unique..."
                className="custom-quill"
              />
            </div>
          </div>

          {/* ✅ NEW: Skills Section for Developers */}
          {user?.role === 'developer' && (
            <div className="form-group">
              <SkillsDropdown
                availableSkills={availableSkills}
                selectedSkills={selectedSkills}
                onSkillAdd={handleSkillAdd}
                onSkillRemove={handleSkillRemove}
                disabled={uploading || saving}
              />
            </div>
          )}

          {user?.role === 'developer' && (
            <>
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
                  <div className="file-preview" style={{marginTop: '10px'}}>
                    <img 
                      src={profile.profilePhoto} 
                      alt="Profile Preview" 
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #5a67d8',
                        cursor: 'pointer'
                      }}
                      key={profile.profilePhoto}
                      onClick={() => openModal(profile.profilePhoto, 'image', getFileName(profile.profilePhoto))}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <small style={{color: '#28a745', display: 'block', marginTop: '5px'}}>
                     Photo uploaded successfully (click to preview)
                    </small>
                  </div>
                )}
              </div>

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
                          onClick={() => setProfile(prev => ({...prev, resume: ''}))}
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

              <div className="form-group">
                <label>
                  Introduction Video
                  {profile.introVideo && (
                    <span style={{color: '#5a67d8', fontSize: '14px', marginLeft: '10px'}}>
                      Current: {getFileName(profile.introVideo)}
                    </span>
                  )}
                </label>
                <input 
                  ref={videoRef}
                  type="file" 
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e.target.files[0], 'video')}
                  disabled={uploading}
                />
                {profile.introVideo && (
                  <div className="file-preview" style={{marginTop: '10px'}}>
                    <video 
                      src={profile.introVideo} 
                      controls 
                      style={{
                        width: '320px',
                        height: '180px',
                        borderRadius: '8px',
                        border: '2px solid #5a67d8'
                      }}
                    />
                    <div style={{marginTop: '8px', display: 'flex', gap: '8px'}}>
                      <button
                        type="button"
                        onClick={() => openModal(profile.introVideo, 'video', getFileName(profile.introVideo))}
                        style={{
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        🔍 Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfile(prev => ({...prev, introVideo: ''}))}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {user?.role === 'employer' && (
            <div className="form-group">
              <label>Company Logo</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files[0], 'logo')}
                disabled={uploading}
              />
              {profile.companyLogo && (
                <div className="file-preview" style={{marginTop: '10px'}}>
                  <img 
                    src={profile.companyLogo} 
                    alt="Logo Preview" 
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #5a67d8',
                      cursor: 'pointer'
                    }}
                    key={profile.companyLogo}
                    onClick={() => openModal(profile.companyLogo, 'image', getFileName(profile.companyLogo))}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <small style={{color: '#28a745', display: 'block', marginTop: '5px'}}>
                    Logo uploaded successfully (click to preview)
                  </small>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={handleSave} 
            disabled={uploading || saving} 
            className="save-btn"
          >
            {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Profile'}
          </button>
        </div>
      ) : (
        <div className="view-mode">
          <div className="about-section">
            <h3>About {user?.role === 'developer' ? 'Me' : 'Company'}</h3>
            <div 
              className="about-content" 
              dangerouslySetInnerHTML={{ 
                __html: profile.about || '<p class="no-content">No description added yet</p>' 
              }}
            />
          </div>

          {/* ✅ NEW: Skills Display in View Mode */}
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
          
          {/* Resume, Video, and Photo sections remain the same as before */}
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
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Preview
                    </button>
                    <a 
                      href={getFileUrls(profile.resume, 'resume').direct}
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
                  onMouseEnter={(e) => {
                    e.target.style.background = '#e9ecef';
                    e.target.style.borderColor = '#495057';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#f8f9fa';
                    e.target.style.borderColor = '#5a67d8';
                  }}
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
              <h3>Introduction Video</h3>
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
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      🔍 Preview
                    </button>
                    <a 
                      href={getFileUrls(profile.introVideo, 'video').direct}
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
                
                {/* Video Thumbnail */}
                <div 
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                  onClick={() => openModal(profile.introVideo, 'video', getFileName(profile.introVideo))}
                >
                  <video 
                    src={profile.introVideo} 
                    style={{
                      width: '100%',
                      maxWidth: '600px',
                      height: 'auto',
                      borderRadius: '8px',
                      border: '2px solid #5a67d8'
                    }}
                    poster="" // You can add a poster image here
                  />
                  {/* Play overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.7)',
                    borderRadius: '50%',
                    width: '80px',
                    height: '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    color: 'white',
                    cursor: 'pointer'
                  }}>
                    ▶️
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
