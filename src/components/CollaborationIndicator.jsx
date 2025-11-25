import React from 'react';
import { FaUser, FaLock, FaEdit } from 'react-icons/fa';

const CollaborationIndicator = ({ activeEditors, lockedSections, currentUserId }) => {
  return (
    <div className="bg-white border-l-4 border-blue-500 shadow-lg rounded-r-lg p-4 fixed top-20 left-0 z-50 min-w-64">
      <div className="flex items-center mb-3">
        <FaEdit className="text-blue-500 mr-2" />
        <h4 className="font-semibold text-gray-800">Active Editors</h4>
        <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {activeEditors.length}
        </span>
      </div>
      
      <div className="space-y-2">
        {activeEditors.map(editor => (
          <div 
            key={editor.userId}
            className={`flex items-center p-2 rounded-lg ${
              editor.userId === currentUserId 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50'
            }`}
          >
            <div className={`w-3 h-3 rounded-full mr-2 ${
              editor.userId === currentUserId ? 'bg-green-500' : 'bg-blue-500'
            }`}></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">
                {editor.userId === currentUserId ? 'You' : editor.userName}
              </div>
              {editor.editingSection && (
                <div className="text-xs text-gray-600 flex items-center">
                  <FaLock className="mr-1" />
                  Editing: {editor.editingSection}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(editor.lastActivity).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(lockedSections).length > 0 && (
        <>
          <div className="border-t mt-3 pt-3">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Locked Sections</h5>
            {Object.entries(lockedSections).map(([section, userId]) => 
              userId && (
                <div key={section} className="text-xs bg-red-50 text-red-700 p-2 rounded mb-1">
                  <FaLock className="inline mr-1" />
                  {section}: Locked by {userId === currentUserId ? 'You' : userId}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CollaborationIndicator;