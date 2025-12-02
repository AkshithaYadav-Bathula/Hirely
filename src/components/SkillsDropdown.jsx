import { useState, useEffect } from 'react';

const SkillsDropdown = ({ selectedSkills = [], onSkillsChange, maxSkills = 5 }) => {
  const [availableSkills, setAvailableSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch skills from API or use static data
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        console.log('🔍 Fetching skills...');
        // Try to fetch from API first
        const response = await fetch('/api/skills');
        if (response.ok) {
          const skillsData = await response.json();
          console.log('📊 Fetched skills from API:', skillsData);
          setAvailableSkills(skillsData.skills || skillsData);
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.error('Failed to fetch skills from API, using static data:', error);
        // Fallback to static skills data - MAKE SURE IDs ARE STRINGS
        const staticSkills = [
          { id: "1", name: "JavaScript", category: "Programming Language" },
          { id: "2", name: "React", category: "Frontend Framework" },
          { id: "3", name: "Node.js", category: "Backend Technology" },
          { id: "4", name: "Python", category: "Programming Language" },
          { id: "5", name: "Java", category: "Programming Language" },
          { id: "6", name: "SQL", category: "Database" },
          { id: "7", name: "Redux", category: "State Management" },
          { id: "8", name: "CSS", category: "Styling" },
          { id: "9", name: "HTML", category: "Markup" },
          { id: "10", name: "TypeScript", category: "Programming Language" }
        ];
        console.log('📊 Using static skills:', staticSkills);
        setAvailableSkills(staticSkills);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);

  // Convert selectedSkills (array of IDs) to skill objects for display
  const getSelectedSkillObjects = () => {
    console.log('🔍 Converting selectedSkills to objects:', selectedSkills);
    console.log('🔍 Available skills:', availableSkills);
    
    return selectedSkills.map(skillId => {
      const skill = availableSkills.find(s => s.id === skillId);
      console.log(`🔍 Looking for skill ID ${skillId}, found:`, skill);
      return skill || { id: skillId, name: `Skill ${skillId}`, category: 'Unknown' };
    });
  };

  const handleSkillToggle = (skill) => {
    console.log('🎯 Skill toggled:', skill);
    console.log('🎯 Current selectedSkills:', selectedSkills);
    
    const isSelected = selectedSkills.includes(skill.id);
    console.log('🎯 Is skill selected?', isSelected);
    
    let updatedSkillIds;
    
    if (isSelected) {
      // Remove skill ID
      updatedSkillIds = selectedSkills.filter(id => id !== skill.id);
      console.log('🎯 Removing skill, new IDs:', updatedSkillIds);
    } else {
      // Add skill ID (if under limit)
      if (selectedSkills.length < maxSkills) {
        updatedSkillIds = [...selectedSkills, skill.id];
        console.log('🎯 Adding skill, new IDs:', updatedSkillIds);
      } else {
        console.log('🎯 Max skills reached, cannot add more');
        return;
      }
    }
    
    console.log('🎯 Calling onSkillsChange with:', updatedSkillIds);
    onSkillsChange(updatedSkillIds);
  };

  const removeSkill = (skillId) => {
    console.log('🗑️ Removing skill ID:', skillId);
    const updatedSkillIds = selectedSkills.filter(id => id !== skillId);
    console.log('🗑️ Updated skill IDs:', updatedSkillIds);
    onSkillsChange(updatedSkillIds);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Skills</label>
        <div className="animate-pulse bg-gray-200 h-10 rounded-md"></div>
      </div>
    );
  }

  const selectedSkillObjects = getSelectedSkillObjects();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Skills (Select up to {maxSkills}) *
      </label>
      
      {/* Selected Skills Display */}
      {selectedSkillObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkillObjects.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200 focus:outline-none focus:bg-indigo-200"
              >
                <span className="sr-only">Remove {skill.name}</span>
                <svg className="w-2 h-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="m1 1 6 6m0-6-6 6" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Skills Selection Dropdown */}
      <div className="relative">
        <select
          onChange={(e) => {
            console.log('📋 Dropdown selection changed:', e.target.value);
            if (e.target.value) {
              const skill = availableSkills.find(s => s.id === e.target.value);
              console.log('📋 Found skill object:', skill);
              if (skill) {
                handleSkillToggle(skill);
                e.target.value = ''; // Reset dropdown
              }
            }
          }}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={selectedSkills.length >= maxSkills}
        >
          <option value="">
            {selectedSkills.length >= maxSkills 
              ? `Maximum ${maxSkills} skills selected` 
              : 'Add a skill...'
            }
          </option>
          {availableSkills
            .filter(skill => !selectedSkills.includes(skill.id))
            .map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name} ({skill.category})
              </option>
            ))}
        </select>
      </div>

      {/* Skills count indicator */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>{selectedSkills.length} of {maxSkills} skills selected</span>
        <span className="text-gray-400">Selected IDs: {JSON.stringify(selectedSkills)}</span>
      </div>
      
      {/* Debug Info */}
      <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
        <div>Available Skills: {availableSkills.length}</div>
        <div>Selected Skills: {selectedSkills.length}</div>
        <div>Selected IDs: {JSON.stringify(selectedSkills)}</div>
      </div>
    </div>
  );
};

export default SkillsDropdown;