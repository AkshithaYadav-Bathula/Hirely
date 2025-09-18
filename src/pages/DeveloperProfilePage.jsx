import React, { useEffect, useState, useContext } from "react";
import "./DeveloperProfilePage.css";
import { AuthContext } from "../context/AuthContext";
import {
  AWS_ACCESS_KEY_ID,
  AWS_ACCESS_KEY,
  AWS_REGION,
  AWS_BUCKET,
  VIDEO_FILE_SIZE_LIMIT,
  VIDEO_LENGTH_LIMIT,
  VIDEO_INPUT_S3_URL,
  VIDEO_DELETE_S3_URL
} from "../awsConfig";
import S3FileUpload from '../components/S3FileUpload';

// JSON server for skills and profile
const JSON_API = "http://localhost:8000";

const DeveloperProfilePage = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [about, setAbout] = useState("");
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [resumeUrl, setResumeUrl] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [introVideoUrl, setIntroVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch skills from JSON server
  useEffect(() => {
    fetch(`${JSON_API}/skills`)
      .then(res => res.json())
      .then(data => setAllSkills(data));
  }, []);

  // Fetch developer profile from JSON server
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${JSON_API}/developers/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setAbout(data.about || "");
        setSkills(data.skills || []);
        setResumeUrl(data.resumeUrl || "");
        setProfilePhotoUrl(data.profilePhotoUrl || "");
        setIntroVideoUrl(data.introVideoUrl || "");
      });
  }, [user]);

  // Helper: Upload file to S3
  const uploadToS3 = async (file, folder = "") => {
    const fileName = `${folder}${Date.now()}_${file.name}`;
    const url = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
        "x-amz-acl": "public-read"
      },
      body: file
    });
    if (res.ok) return url;
    throw new Error("Upload failed");
  };

  // Handle file uploads
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      let url = "";
      if (type === "resume") url = await uploadToS3(file, "resumes/");
      if (type === "profilePhoto") url = await uploadToS3(file, "profile_photos/");
      if (type === "introVideo") {
        if (file.size > VIDEO_FILE_SIZE_LIMIT) throw new Error("File too large");
        url = await uploadToS3(file, "intro_videos/");
      }
      if (type === "resume") setResumeUrl(url);
      if (type === "profilePhoto") setProfilePhotoUrl(url);
      if (type === "introVideo") setIntroVideoUrl(url);
      setSuccessMsg(`${type} uploaded!`);
    } catch (err) {
      setSuccessMsg(err.message);
    }
    setLoading(false);
  };

  // Save profile to JSON server
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setLoading(true);
    try {
      const res = await fetch(`${JSON_API}/developers/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          about,
          skills,
          resumeUrl,
          profilePhotoUrl,
          introVideoUrl,
        }),
      });
      if (res.ok) {
        setSuccessMsg("Profile saved successfully!");
        const updatedProfile = await res.json();
        setProfile(updatedProfile);
      } else {
        setSuccessMsg("Failed to save profile.");
      }
    } catch (err) {
      setSuccessMsg("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading profile...</div>;

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <img
          src={profilePhotoUrl || "https://via.placeholder.com/120"}
          alt="Profile"
          className="profile-photo"
        />
        <div className="profile-info">
          <h2 className="profile-name">{profile.first_name} {profile.last_name}</h2>
          <p className="profile-headline">Full Stack Developer | React | Node.js</p>
          <p className="profile-location">📍 Hyderabad, India</p>
        </div>
      </div>

      <form onSubmit={handleUpdate}>
        <S3FileUpload
          value={resumeUrl}
          onChange={e => setResumeUrl(e.target.value)}
          name="resume"
          fileType="file"
          folder="resumes/"
          sizeLimit={10 * 1024 * 1024}
          accept=".pdf,.doc,.docx"
          label="Upload Resume"
        />
        <S3FileUpload
          value={profilePhotoUrl}
          onChange={e => setProfilePhotoUrl(e.target.value)}
          name="profilePhoto"
          fileType="image"
          folder="profile_photos/"
          sizeLimit={5 * 1024 * 1024}
          accept="image/*"
          label="Profile Photo"
        />
        <S3FileUpload
          value={introVideoUrl}
          onChange={e => setIntroVideoUrl(e.target.value)}
          name="introVideo"
          fileType="video"
          folder="intro_videos/"
          sizeLimit={VIDEO_FILE_SIZE_LIMIT}
          accept="video/*"
          label="Intro Video"
        />
        {/* Skills */}
        <div className="profile-section">
          <label className="profile-label">Skills</label>
          <select multiple value={skills} onChange={e => setSkills(Array.from(e.target.selectedOptions, opt => opt.value))} className="profile-input">
            {allSkills.map(skill => (
              <option key={skill.id} value={skill.id}>{skill.name}</option>
            ))}
          </select>
          <div className="skills-tags" style={{ marginTop: 8 }}>
            {skills.length > 0
              ? skills.map(skillId => {
                  const skill = allSkills.find(s => s.id === skillId);
                  return skill ? <span key={skill.id} className="skill-tag">{skill.name}</span> : null;
                })
              : <span className="skill-tag">No skills added yet</span>
            }
            <span className="skill-tag add-skill">+ Add Skill</span>
          </div>
        </div>

        {/* About */}
        <div className="profile-section">
          <label className="profile-label">About Me</label>
          <textarea
            className="profile-textarea"
            rows={4}
            value={about}
            onChange={e => setAbout(e.target.value)}
            placeholder="Write a short bio about your work, experience, and goals..."
          />
        </div>

        {/* Projects (static for now) */}
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

        {successMsg && (
          <div style={{
            background: "#e0ffe0",
            color: "#1a7f37",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            textAlign: "center",
            fontWeight: "600"
          }}>
            {successMsg}
          </div>
        )}

        <button className="profile-btn" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save & Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default DeveloperProfilePage;