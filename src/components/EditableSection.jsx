import React, { useState, useEffect } from 'react';
import { FaLock, FaEdit, FaExclamationTriangle } from 'react-icons/fa';

const EditableSection = ({ 
  sectionId, 
  title, 
  children, 
  isEditing, 
  onStartEdit, 
  onStopEdit,
  lockedBy,
  canEdit,
  currentUserId 
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedByUser, setLockedByUser] = useState(null);

  useEffect(() => {
    setIsLocked(lockedBy && lockedBy !== currentUserId);
    setLockedByUser(lockedBy);
  }, [lockedBy, currentUserId]);

  const handleStartEdit = () => {
    if (!isLocked && canEdit) {
      onStartEdit(sectionId);
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-all ${
      isEditing ? 'border-blue-500 bg-blue-50' : 
      isLocked ? 'border-red-300 bg-red-50' : 
      'border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          {title}
          {isLocked && (
            <span className="ml-2 text-red-500 text-sm flex items-center">
              <FaLock className="mr-1" />
              Locked
            </span>
          )}
          {isEditing && (
            <span className="ml-2 text-blue-500 text-sm flex items-center">
              <FaEdit className="mr-1" />
              Editing
            </span>
          )}
        </h3>

        <div className="flex items-center space-x-2">
          {isLocked && (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center">
              <FaExclamationTriangle className="mr-1" />
              Being edited by {lockedByUser === currentUserId ? 'you' : lockedByUser}
            </div>
          )}
          
          {!isEditing && !isLocked && canEdit && (
            <button
              onClick={handleStartEdit}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
            >
              <FaEdit className="mr-2" />
              Edit Section
            </button>
          )}
          
          {isEditing && (
            <button
              onClick={() => onStopEdit(sectionId)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Stop Editing
            </button>
          )}
        </div>
      </div>

      {isLocked && lockedByUser !== currentUserId ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <FaLock className="mx-auto text-red-500 text-2xl mb-2" />
          <p className="text-red-700">
            This section is currently being edited by <strong>{lockedByUser}</strong>
          </p>
          <p className="text-red-600 text-sm mt-1">
            Please wait for them to finish or contact them directly.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
};

export default EditableSection;