/**
 * Custom hook for managing intern data, state, and operations
 * Centralizes all intern-related business logic and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';

/**
 * Hook for managing interns data and operations
 * @returns {Object} Intern management state and functions
 */
export const useInternsManager = () => {
  // Core data state
  const [interns, setInterns] = useState([]);
  const [totalInterns, setTotalInterns] = useState(0);
  
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
  const [currentIntern, setCurrentIntern] = useState(null);
  
  // Error state
  const [error, setError] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Fetches interns with current filters and pagination
   */
  const fetchInterns = useCallback(async () => {
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

      const response = await fetch(`/api/admin/interns?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch interns');
      }
      
      const data = await response.json();
      setInterns(data.data || []);
      setTotalInterns(data.total || 0);
    } catch (error) {
      console.error('Error fetching interns:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to fetch interns', { 
        variant: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters, searchQuery, enqueueSnackbar]);

  /**
   * Fetches metadata (departments, positions) for form options
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
   * Handles intern form submission (create/update)
   * @param {Object} formData - Intern form data
   * @param {string} imagePreview - Base64 image data
   */
  const handleInternSubmit = useCallback(async (formData, imagePreview) => {
    try {
      setSubmitting(true);
      setError(null);

      const method = currentIntern ? 'PUT' : 'POST';
      const url = currentIntern 
        ? `/api/admin/interns/${currentIntern.id}`
        : '/api/admin/interns';

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
        throw new Error(errorData.message || 'Failed to save intern');
      }

      // Close dialog and refresh data
      setIsFormDialogOpen(false);
      setCurrentIntern(null);
      await fetchInterns();
      
      enqueueSnackbar(
        `Intern ${currentIntern ? 'updated' : 'added'} successfully`, 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting intern data:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to save intern', { 
        variant: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  }, [currentIntern, fetchInterns, enqueueSnackbar]);

  /**
   * Opens the intern form dialog
   * @param {Object|null} intern - Intern to edit, or null for new intern
   */
  const openInternForm = useCallback((intern = null) => {
    setCurrentIntern(intern);
    setIsFormDialogOpen(true);
  }, []);

  /**
   * Resets all filters to default values
   */
  const resetFilters = useCallback(() => {
    setFilters({ department: '', position: '', status: '' });
    setSearchQuery('');
    setPagination({ pageIndex: 0, pageSize: 10 });
  }, []);

  /**
   * Refreshes intern data
   */
  const refreshInterns = useCallback(() => {
    fetchInterns();
  }, [fetchInterns]);
  // Initial data loading
  useEffect(() => {
    fetchInterns();
  }, [fetchInterns]);
  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    // Data state
    interns,
    totalInterns,
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
    currentIntern,
    
    // Error state
    error,
    setError,
    
    // Actions
    handleInternSubmit,
    openInternForm,
    resetFilters,
    refreshInterns,
    fetchInterns,
    fetchMetadata,
  };
};
