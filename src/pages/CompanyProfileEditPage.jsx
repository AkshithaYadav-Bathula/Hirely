import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import CollaborationIndicator from '../components/CollaborationIndicator';
import EditableSection from '../components/EditableSection';

const CompanyProfileEditPage = () => {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [editingSections, setEditingSections] = useState(new Set());
  
  const {
    activeEditors,
    lockedSections,
    isConnected,
    lockSection,
    unlockSection
  } = useCollaboration(user?.companyId, user?.id, user?.name);

  const handleStartEdit = async (sectionId) => {
    const success = await lockSection(sectionId);
    if (success) {
      setEditingSections(prev => new Set([...prev, sectionId]));
    } else {
      alert('This section is currently being edited by another user.');
    }
  };

  const handleStopEdit = async (sectionId) => {
    await unlockSection(sectionId);
    setEditingSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(sectionId);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Collaboration Indicator */}
      {isConnected && activeEditors.length > 0 && (
        <CollaborationIndicator 
          activeEditors={activeEditors}
          lockedSections={lockedSections}
          currentUserId={user?.id}
        />
      )}

      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              Edit Company Profile
              {isConnected && (
                <span className="ml-3 bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                  ● Live Collaboration
                </span>
              )}
            </h1>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Information Section */}
            <EditableSection
              sectionId="basic-info"
              title="Basic Information"
              isEditing={editingSections.has('basic-info')}
              onStartEdit={handleStartEdit}
              onStopEdit={handleStopEdit}
              lockedBy={lockedSections['basic-info']}
              canEdit={true}
              currentUserId={user?.id}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={!editingSections.has('basic-info')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    disabled={!editingSections.has('basic-info')}
                  />
                </div>
              </div>
            </EditableSection>

            {/* Jobs Section */}
            <EditableSection
              sectionId="jobs"
              title="Job Listings"
              isEditing={editingSections.has('jobs')}
              onStartEdit={handleStartEdit}
              onStopEdit={handleStopEdit}
              lockedBy={lockedSections['jobs']}
              canEdit={true}
              currentUserId={user?.id}
            >
              <div className="space-y-3">
                <p>Manage your job listings here...</p>
                {/* Job listings content */}
              </div>
            </EditableSection>

            {/* Team Section */}
            <EditableSection
              sectionId="team"
              title="Team Management"
              isEditing={editingSections.has('team')}
              onStartEdit={handleStartEdit}
              onStopEdit={handleStopEdit}
              lockedBy={lockedSections['team']}
              canEdit={true}
              currentUserId={user?.id}
            >
              <div className="space-y-3">
                <p>Manage team members here...</p>
                {/* Team management content */}
              </div>
            </EditableSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyProfileEditPage;

// Add these routes to your backend
app.post('/collaboration/join', (req, res) => {
  const { companyId, userId, userName } = req.body;
  // Add user to active editors list
});

app.post('/collaboration/leave', (req, res) => {
  const { companyId, userId } = req.body;
  // Remove user from active editors and unlock their sections
});

app.get('/collaboration/:companyId', (req, res) => {
  // Return active editors and locked sections
});

app.post('/collaboration/lock', (req, res) => {
  const { companyId, userId, section } = req.body;
  // Lock section for user if available
});

app.post('/collaboration/unlock', (req, res) => {
  // Unlock section
});

app.post('/collaboration/heartbeat', (req, res) => {
  // Update user's last activity timestamp
});