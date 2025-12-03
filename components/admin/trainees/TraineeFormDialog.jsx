/**
 * Trainee Form Dialog Component
 * 
 * A comprehensive form dialog for creating and editing trainee records.
 * Features include tabbed interface, image upload, form validation, and 
 * accessibility support.
 * 
 * @component
 * @example
 * <TraineeFormDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   trainee={selectedTrainee}
 *   departments={departments}
 *   positions={positions}
 *   leaders={leaders}
 *   onSubmit={handleSubmit}
 *   isLoadingOptions={loading}
 *   isSubmitting={submitting}
 * />
 */

"use client";

import React, { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTraineeForm } from "@/hooks/useTraineeForm";
import TraineeDetailsTab from "./TraineeDetailsTab";
import TraineeSettingsTab from "./TraineeSettingsTab";
import FormErrorDisplay from "./FormErrorDisplay";

/**
 * TraineeFormDialog Component
 * @param {Object} props - Component props
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onOpenChange - Dialog state change handler
 * @param {Object|null} props.trainee - Trainee data for editing (null for new)
 * @param {Array} props.departments - Available departments
 * @param {Array} props.positions - Available positions  
 * @param {Function} props.onSubmit - Form submission handler
 * @param {boolean} props.isLoadingOptions - Loading state for form options
 * @param {boolean} props.isSubmitting - External submission loading state
 */
const TraineeFormDialog = memo(({
  open,
  onOpenChange,
  trainee = null,
  departments = [],
  positions = [],
  onSubmit,
  isLoadingOptions = false,
  isSubmitting = false
}) => {
  // Use custom hook for form management
  const {
    register,
    handleSubmit,
    control,
    errors,
    isSubmitting: formIsSubmitting,
    status,
    isDiscontinued,
    imagePreview,
    handleImageChange,
    removeImage,
    activeTab,
    setActiveTab,
    submissionError,
    setSubmissionError,
  } = useTraineeForm(trainee, open, onSubmit);

  // Determine if we're in edit mode
  const isEditing = !!trainee;
  
  // Combine loading states
  const isFormSubmitting = formIsSubmitting || isSubmitting;

  /**
   * Handles dialog close with confirmation if form has changes
   */
  const handleDialogClose = (newOpen) => {
    if (!newOpen && !isFormSubmitting) {
      onOpenChange(false);
    }
  };

  /**
   * Handles keyboard shortcuts
   */
  const handleKeyDown = (event) => {
    // Close dialog on Escape (if not submitting)
    if (event.key === 'Escape' && !isFormSubmitting) {
      handleDialogClose(false);
      return;
    }

    // Save on Ctrl+Enter or Cmd+Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
        aria-labelledby="employee-form-title"
        aria-describedby="employee-form-description"
      >
        <DialogHeader className="space-y-3">
          <DialogTitle id="employee-form-title" className="text-xl font-semibold">
            {isEditing ? 'Edit Trainee' : 'Add New Trainee'}
          </DialogTitle>
          
          <DialogDescription id="employee-form-description" className="text-base">
            {isEditing 
              ? 'Update the trainee information below. Changes will be saved immediately.'
              : 'Fill in the trainee details below. All required fields must be completed.'
            }
          </DialogDescription>

          {/* Discontinued Trainee Notice */}
          {isDiscontinued && isEditing && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Notice:</strong> This trainee is marked as discontinued. 
                Their RFID tag and photo will be automatically removed and cannot be modified 
                until the status is changed.
              </p>
            </div>
          )}

          {/* Form Error Display */}
          <FormErrorDisplay 
            error={submissionError}
            onDismiss={() => setSubmissionError(null)}
          />
        </DialogHeader>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="details"
                id="details-tab"
                aria-controls="details-panel"
              >
                Trainee Details
              </TabsTrigger>
              <TabsTrigger 
                value="settings"
                id="settings-tab"
                aria-controls="settings-panel"
              >
                RFID & Photo
              </TabsTrigger>
            </TabsList>

            {/* Trainee Details Tab */}
            <TabsContent 
              value="details" 
              className="mt-6"
              id="details-panel"
              aria-labelledby="details-tab"
            >
              <TraineeDetailsTab
                control={control}
                register={register}
                errors={errors}
                departments={departments}
                positions={positions}
                isEditing={isEditing}
                loadingOptions={isLoadingOptions}
              />
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent 
              value="settings" 
              className="mt-6"
              id="settings-panel"
              aria-labelledby="settings-tab"
            >
              <TraineeSettingsTab
                register={register}
                errors={errors}
                imagePreview={imagePreview}
                onImageChange={handleImageChange}
                onImageRemove={removeImage}
                isDiscontinued={isDiscontinued}
                status={status}
              />
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleDialogClose(false)}
              disabled={isFormSubmitting}
              className="order-2 sm:order-1"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit" 
              disabled={isFormSubmitting || isLoadingOptions}
              className="order-1 sm:order-2"
              aria-describedby={isFormSubmitting ? 'submit-status' : undefined}
            >
              {isFormSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </>
              ) : (
                `${isEditing ? 'Update' : 'Create'} Trainee`
              )}
            </Button>
            
            {/* Screen reader status */}
            {isFormSubmitting && (
              <span id="submit-status" className="sr-only" aria-live="polite">
                Saving trainee information, please wait...
              </span>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

TraineeFormDialog.displayName = 'TraineeFormDialog';

export default TraineeFormDialog;