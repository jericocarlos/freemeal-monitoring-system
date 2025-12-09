/**
 * Custom hook for managing employee data, state, and operations
 * Centralizes all employee-related business logic and API calls
 */

import { useState, useCallback, useEffect } from 'react';
import { useSnackbar } from 'notistack';

/**
 * Hook for managing employees data and operations
 * @returns {Object} Employee management state and functions
 */
export const useEmployeesManager = () => {
  // Core data state
  const [employees, setEmployees] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  
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
  const [currentEmployee, setCurrentEmployee] = useState(null);
  
  // Error state
  const [error, setError] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  /**
   * Fetches employees with current filters and pagination
   */
  const fetchEmployees = useCallback(async () => {
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

      const response = await fetch(`/api/admin/employees?${searchParams}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch employees');
      }
      
      const data = await response.json();
      setEmployees(data.data || []);
      setTotalEmployees(data.total || 0);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to fetch employees', { 
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
  const handleEmployeeSubmit = useCallback(async (formData, imagePreview) => {
    try {
      setSubmitting(true);
      setError(null);

      const method = currentEmployee ? 'PUT' : 'POST';
      const url = currentEmployee 
        ? `/api/admin/employees/${currentEmployee.id}`
        : '/api/admin/employees';

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
        throw new Error(errorData.message || 'Failed to save employee');
      }

      // Close dialog and refresh data
      setIsFormDialogOpen(false);
      setCurrentEmployee(null);
      await fetchEmployees();
      
      enqueueSnackbar(
        `Employee ${currentEmployee ? 'updated' : 'added'} successfully`, 
        { variant: 'success' }
      );
    } catch (error) {
      console.error('Error submitting employee data:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to save employee', { 
        variant: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  }, [currentEmployee, fetchEmployees, enqueueSnackbar]);

  /**
   * Deletes an employee
   * @param {Object} employee - Employee to delete
   */
  const deleteEmployee = useCallback(async (employee) => {
    if (!employee?.id) {
      enqueueSnackbar('Employee ID is required for deletion', { variant: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/admin/employees/${employee.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete employee');
      }

      // Refresh data
      await fetchEmployees();
      
      enqueueSnackbar('Employee deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error.message);
      enqueueSnackbar(error.message || 'Failed to delete employee', { 
        variant: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  }, [fetchEmployees, enqueueSnackbar]);

  /**
   * Opens the employee form dialog
   * @param {Object|null} employee - Employee to edit, or null for new employee
   */
  const openEmployeeForm = useCallback((employee = null) => {
    setCurrentEmployee(employee);
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
   * Refreshes employee data
   */
  const refreshEmployees = useCallback(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Initial data loading
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  return {
    // Data state
    employees,
    totalEmployees,
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
    currentEmployee,
    
    // Error state
    error,
    setError,
    
    // Actions
    handleEmployeeSubmit,
    deleteEmployee,
    openEmployeeForm,
    resetFilters,
    refreshEmployees,
    fetchEmployees,
    fetchMetadata,
  };
};
