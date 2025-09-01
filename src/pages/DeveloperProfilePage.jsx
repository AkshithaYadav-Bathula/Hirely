import React, { useContext, useRef, useState } from "react";
import "./DeveloperProfilePage.css";
import { AuthContext } from "../context/AuthContext";

const DeveloperProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [introVideo, setIntroVideo] = useState(null);
  const videoRef = useRef();

  // Fallback if no user or no skills
  const skills = user?.skills || [];

  // Handle video upload and preview
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIntroVideo(URL.createObjectURL(file));
    }
  };

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <img
          src="https://via.placeholder.com/120"
          alt="Profile"
          className="profile-photo"
        />
        <div className="profile-info">
          <h2 className="profile-name">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="profile-headline">
            Full Stack Developer | React | Node.js
          </p>
          <p className="profile-location">📍 Hyderabad, India</p>
        </div>
      </div>

      {/* Uploads */}
      <div className="profile-section">
        <label className="profile-label">Upload Resume</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="profile-input"
        />
      </div>

      {/* Skills */}
      <div className="profile-section">
        <label className="profile-label">Skills</label>
        <div className="skills-tags">
          {skills.length > 0 ? (
            skills.map((skill) => (
              <span key={skill.id} className="skill-tag">
                {skill.name}
              </span>
            ))
          ) : (
            <span className="skill-tag">No skills added yet</span>
          )}
          <span className="skill-tag add-skill">+ Add Skill</span>
        </div>
      </div>

      {/* About */}
      <div className="profile-section">
        <label className="profile-label">About Me</label>
        <textarea
          className="profile-textarea"
          rows={4}
          placeholder="Write a short bio about your work, experience, and goals..."
        />
      </div>

      {/* Self Intro Video */}
      <div className="profile-section">
        <label className="profile-label">Self Intro Video</label>
        <input
          type="file"
          accept="video/*"
          className="profile-input"
          onChange={handleVideoChange}
        />
        {introVideo && (
          <div className="video-preview-container">
            <video
              ref={videoRef}
              src={introVideo}
              controls
              className="video-preview"
            />
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="profile-section">
        <label className="profile-label">Projects</label>
        <div className="project-card">
          <h4>Autism Detection Tool</h4>
          <p>
            Built using Deep Learning (CNN) for early autism spectrum disorder
            detection. <a href="#">GitHub</a>
          </p>
        </div>
        <div className="project-card">
          <h4>Mass Mailing Application</h4>
          <p>
            Flask + MySQL based email campaign tool integrated with Gmail/Outlook.
            <a href="#">GitHub</a>
          </p>
        </div>
      </div>

      <button className="profile-btn">Save & Update Profile</button>
    </div>
  );
};

export default DeveloperProfilePage;
