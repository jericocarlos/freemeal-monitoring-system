/**
 * Custom hook for managing employee form state and logic
 * Handles form data, validation, image preview, and submission
 */

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';

/**
 * Hook for managing employee form operations
 * @param {Object} employee - Employee data for editing (null for new employee)
 * @param {boolean} open - Dialog open state
 * @param {Function} onSubmit - Form submission handler
 * @returns {Object} Form management state and functions
 */
export const useTraineeForm = (employee, open, onSubmit) => {
  // Form state
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [submissionError, setSubmissionError] = useState(null);

  // Form hook
  const form = useForm({
    defaultValues: {
      ashima_id: '',
      name: '',
      department_id: '',
      position_id: '',
      rfid_tag: '',
      status: 'active',
    },
  });

  const { 
    register, 
    handleSubmit, 
    reset, 
    control, 
    setValue, 
    watch, 
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = form;

  // Watch status for conditional logic
  const status = watch('status');
  const isDiscontinued = status === 'discontinued';

  /**
   * Resets form to initial state
   */
  const resetForm = useCallback(() => {
    reset({
      ashima_id: '',
      name: '',
      department_id: '',
      position_id: '',
      rfid_tag: '',
      status: 'active',
    });
    setImagePreview(null);
    setActiveTab('details');
    setSubmissionError(null);
    clearErrors();
  }, [reset, clearErrors]);

  /**
   * Populates form with employee data for editing
   */
  const populateForm = useCallback((employeeData) => {
    setValue('ashima_id', employeeData.ashima_id || '');
    setValue('name', employeeData.name || '');
    setValue('department_id', employeeData.department_id?.toString() || '');
    setValue('position_id', employeeData.position_id?.toString() || '');
    setValue('rfid_tag', employeeData.rfid_tag || '');
    setValue('status', employeeData.status || 'active');
    setImagePreview(employeeData.photo || null);
    setSubmissionError(null);
  }, [setValue]);

  /**
   * Handles image file selection and preview
   */
  const handleImageChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSubmissionError('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSubmissionError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
      setSubmissionError(null);
    };
    reader.onerror = () => {
      setSubmissionError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Removes the current image preview
   */
  const removeImage = useCallback(() => {
    setImagePreview(null);
  }, []);

  /**
   * Validates form data before submission
   */
  const validateFormData = useCallback((data) => {
    // Clear previous errors
    clearErrors();
    setSubmissionError(null);

    // Validate required fields
    if (!data.ashima_id?.trim()) {
      setError('ashima_id', { type: 'manual', message: 'Employee ID is required' });
      setActiveTab('details');
      return false;
    }

    if (!data.name?.trim()) {
      setError('name', { type: 'manual', message: 'Employee name is required' });
      setActiveTab('details');
      return false;
    }

    // Validate RFID for active trainees
    if (data.status !== 'discontinued' && !data.rfid_tag?.trim()) {
      setError('rfid_tag', { 
        type: 'manual', 
        message: 'RFID Tag is required for active trainees' 
      });
      setActiveTab('settings');
      return false;
    }

    return true;
  }, [setError, clearErrors, setActiveTab]);

  /**
   * Handles form submission with validation
   */
  const handleFormSubmit = useCallback(async (data) => {
    try {
      setSubmissionError(null);

      // Validate form data
      if (!validateFormData(data)) {
        return;
      }

      // Process form data
      const processedData = {
        ...data,
      };

      // Handle discontinued trainee data
      if (processedData.status === 'discontinued') {
        processedData.rfid_tag = null;
        processedData.removePhoto = true;
      }

      // Submit form
      const result = await onSubmit(
        processedData, 
        processedData.status === 'discontinued' ? null : imagePreview
      );

      // Reset form on successful submission
      if (result !== false) {
        resetForm();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmissionError(error.message || 'Failed to save trainee. Please try again.');
    }
  }, [validateFormData, onSubmit, imagePreview, resetForm]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (open) {
      if (employee) {
        populateForm(employee);
      } else {
        resetForm();
      }
    }
  }, [open, employee, populateForm, resetForm]);

  // Handle status changes for discontinued trainees
  useEffect(() => {
    if (employee && isDiscontinued) {
      setValue('rfid_tag', '');
      setImagePreview(null);
      setActiveTab('settings');
    }
  }, [isDiscontinued, employee, setValue]);

  return {
    // Form state
    form,
    register,
    handleSubmit: handleSubmit(handleFormSubmit),
    control,
    errors,
    isSubmitting,
    status,
    isDiscontinued,

    // Image state
    imagePreview,
    handleImageChange,
    removeImage,

    // Tab state
    activeTab,
    setActiveTab,

    // Error state
    submissionError,
    setSubmissionError,

    // Actions
    resetForm,
  };
};
