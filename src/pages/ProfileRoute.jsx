import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfilePage from "./ProfilePage";

const ProfileRoute = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <div>Not logged in</div>;
  }

  // Use the unified ProfilePage for all users
  return (
    <ProfilePage
      extraContent={
        user?.role === "developer" && (
          <div className="skills-view-section">
            <h3>🛠️ Skills</h3>
            <div className="skills-view-container">
              {selectedSkills.length > 0 ? (
                <div className="skills-display">
                  {selectedSkills.map((skill) => (
                    <div key={skill.id} className="skill-display-tag">
                      <span>{skill.name}</span>
                      <small className="skill-category-badge">
                        {skill.category}
                      </small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-skills-message">No skills added yet</p>
              )}
            </div>
          </div>
        )
      }
    />
  );
};

export default ProfileRoute;