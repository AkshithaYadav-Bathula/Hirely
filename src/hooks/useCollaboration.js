import { useState, useEffect, useCallback } from 'react';

export const useCollaboration = (companyId, userId, userName) => {
  const [activeEditors, setActiveEditors] = useState([]);
  const [lockedSections, setLockedSections] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Simulate WebSocket connection (you can replace with actual WebSocket)
  useEffect(() => {
    let interval;
    
    const startSession = async () => {
      try {
        // Register as active editor
        await fetch(`http://localhost:8000/collaboration/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyId,
            userId,
            userName,
            timestamp: new Date().toISOString()
          })
        });
        
        setIsConnected(true);
        
        // Poll for active editors every 5 seconds
        interval = setInterval(fetchActiveEditors, 5000);
        fetchActiveEditors();
        
      } catch (error) {
        console.error('Failed to start collaboration session:', error);
      }
    };

    const fetchActiveEditors = async () => {
      try {
        const response = await fetch(`http://localhost:8000/collaboration/${companyId}`);
        const data = await response.json();
        setActiveEditors(data.activeEditors || []);
        setLockedSections(data.lockedSections || {});
      } catch (error) {
        console.error('Failed to fetch active editors:', error);
      }
    };

    if (companyId && userId) {
      startSession();
    }

    return () => {
      if (interval) clearInterval(interval);
      // Leave session on cleanup
      if (companyId && userId) {
        fetch(`http://localhost:8000/collaboration/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId, userId })
        }).catch(console.error);
      }
    };
  }, [companyId, userId, userName]);

  const lockSection = useCallback(async (section) => {
    try {
      const response = await fetch(`http://localhost:8000/collaboration/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, userId, section })
      });
      
      if (response.ok) {
        setLockedSections(prev => ({ ...prev, [section]: userId }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to lock section:', error);
      return false;
    }
  }, [companyId, userId]);

  const unlockSection = useCallback(async (section) => {
    try {
      await fetch(`http://localhost:8000/collaboration/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, userId, section })
      });
      
      setLockedSections(prev => ({ ...prev, [section]: null }));
    } catch (error) {
      console.error('Failed to unlock section:', error);
    }
  }, [companyId, userId]);

  const heartbeat = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      await fetch(`http://localhost:8000/collaboration/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId, 
          userId, 
          timestamp: new Date().toISOString() 
        })
      });
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [companyId, userId, isConnected]);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const heartbeatInterval = setInterval(heartbeat, 30000);
    return () => clearInterval(heartbeatInterval);
  }, [heartbeat]);

  return {
    activeEditors,
    lockedSections,
    isConnected,
    lockSection,
    unlockSection
  };
};