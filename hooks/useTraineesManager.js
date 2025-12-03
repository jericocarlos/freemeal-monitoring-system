/**
 * Custom hook for managing employee data, state, and operations
 * Centralizes all employee-related business logic and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';

/**
 * Hook for managing trainees data and operations
 * @returns {Object} Trainee management state and functions
 */
export const useTraineesManager = () => {
  // Core data state
  const [trainees, setTrainees] = useState([]);
  const [totalTrainees, setTotalTrainees] = useState(0);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ 
    department: '', 
    position: '', 
    status: '' 
  });
  const [pagination, setPagination] = useState({ 
    pageIndex: 0, 
    pageSize: 10 
  });
  
  // Metadata state
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  
  // Dialog state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [currentTrainee, setCurrentTrainee] = useState(null);
  
  // Error state
  const [error, setError] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Fetches trainees with current filters and pagination
   */
  const fetchTrainees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams({
        search: searchQuery,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        department: filters.department || '',
        position: filters.position || '',
        status: filters.status || '',
      });

      const response = await fetch(`/api/admin/trainees?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch trainees');
      }
      
      const data = await response.json();
      setTrainees(data.data || []);
      setTotalTrainees(data.total || 0);
    } catch (error) {
      console.error('Error fetching trainees:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to fetch trainees', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters, searchQuery, enqueueSnackbar]);

  /**
   * Fetches metadata (departments, positions, leaders) for form options
   */
  const fetchMetadata = useCallback(async () => {
    try {
      setLoadingMetadata(true);
      setError(null);
      
      const [deptResponse, posResponse] = await Promise.all([
        fetch('/api/admin/departments'),
        fetch('/api/admin/positions'),
      ]);
      
      if (!deptResponse.ok || !posResponse.ok) {
        throw new Error('Failed to fetch form options');
      }
      
      const [deptData, posData] = await Promise.all([
        deptResponse.json(),
        posResponse.json(),
      ]);
      
      setDepartments(deptData.departments || []);
      setPositions(posData.positions || []);
    } catch (error) {
      console.error('Error fetching metadata:', error);
      setError(error.message);
      enqueueSnackbar('Failed to load form options', { variant: 'error' });
    } finally {
      setLoadingMetadata(false);
    }
  }, [enqueueSnackbar]);

  /**
   * Handles employee form submission (create/update)
   * @param {Object} formData - Employee form data
   * @param {string} imagePreview - Base64 image data
   */
  const handleTraineeSubmit = useCallback(async (formData, imagePreview) => {
    try {
      setSubmitting(true);
      setError(null);

      const method = currentTrainee ? 'PUT' : 'POST';
      const url = currentTrainee 
        ? `/api/admin/trainees/${currentTrainee.id}`
        : '/api/admin/trainees';

      const apiData = {
        ...formData,
        photo: imagePreview,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save trainee');
      }

      // Close dialog and refresh data
      setIsFormDialogOpen(false);
      setCurrentTrainee(null);
      await fetchTrainees();
      
      enqueueSnackbar(
        `Trainee ${currentTrainee ? 'updated' : 'added'} successfully`, 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting trainee data:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to save trainee', { 
        variant: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  }, [currentTrainee, fetchTrainees, enqueueSnackbar]);

  /**
   * Opens the trainee form dialog
   * @param {Object|null} trainee - Trainee to edit, or null for new trainee
   */
  const openTraineeForm = useCallback((trainee = null) => {
    setCurrentTrainee(trainee);
    setIsFormDialogOpen(true);
  }, []);

  /**
   * Resets all filters to default values
   */
  const resetFilters = useCallback(() => {
    setFilters({ department: '', position: '', leader: '', status: '' });
    setSearchQuery('');
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  /**
   * Refreshes trainee data
   */
  const refreshTrainees = useCallback(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  // Initial data loading
  useEffect(() => {
    fetchTrainees();
  }, [fetchTrainees]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    // Data state
    trainees,
    totalTrainees,
    departments,
    positions,
    
    // Loading states
    loading,
    loadingMetadata,
    submitting,
    
    // Filter and search state
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    pagination,
    setPagination,
    
    // Dialog state
    isFormDialogOpen,
    setIsFormDialogOpen,
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    currentTrainee,
    
    // Error state
    error,
    setError,
    
    // Actions
    handleTraineeSubmit,
    openTraineeForm,
    resetFilters,
    refreshTrainees,
    fetchTrainees,
    fetchMetadata,
  };
};
