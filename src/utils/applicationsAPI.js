const API_BASE = 'http://localhost:8000';

export const applicationsAPI = {
  // Get all applications for a specific job
  getByJobId: async (jobId) => {
    try {
      const response = await fetch(`${API_BASE}/applications?jobId=${jobId}`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      return await response.json();
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  // Update application status (accept/reject)
  updateStatus: async (applicationId, status) => {
    try {
      const response = await fetch(`${API_BASE}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error('Failed to update application status');
      return await response.json();
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  },

  // Get developer details
  getDeveloper: async (developerId) => {
    try {
      const response = await fetch(`${API_BASE}/users/${developerId}`);
      if (!response.ok) throw new Error('Failed to fetch developer');
      return await response.json();
    } catch (error) {
      console.error('Error fetching developer:', error);
      throw error;
    }
  }
};