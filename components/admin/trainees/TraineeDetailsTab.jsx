/**
 * Trainee Details Tab Component
 * Handles the basic trainee information form fields
 */

import React, { memo } from 'react';
import { Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * TraineeDetailsTab Component
 * @param {Object} props - Component props
 * @param {Object} props.control - React Hook Form control
 * @param {Function} props.register - React Hook Form register function
 * @param {Object} props.errors - Form validation errors
 * @param {Array} props.departments - Available departments
 * @param {Array} props.positions - Available positions
 * @param {boolean} props.isEditing - Whether in edit mode
 * @param {boolean} props.loadingOptions - Loading state for form options
 */
const TraineeDetailsTab = memo(({
  control,
  register,
  errors,
  departments = [],
  positions = [],
  isEditing = false,
  loadingOptions = false
}) => {
  return (
    <div className="space-y-6" role="tabpanel" aria-labelledby="details-tab">
      {/* Basic Information Section */}
      <fieldset className="space-y-4">
        <legend className="sr-only">Basic Trainee Information</legend>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Trainee ID */}
          {/* <div className="space-y-2">
            <Label htmlFor="ashima_id" className="text-sm font-medium">
              Trainee ID <span className="text-destructive" aria-label="required">*</span>
            </Label>
            <Input
              id="ashima_id"
              type="text"
              autoComplete="trainee-id"
              disabled={isEditing}
              aria-describedby={errors.ashima_id ? 'ashima_id-error' : undefined}
              aria-invalid={!!errors.ashima_id}
              {...register('ashima_id', { 
                required: 'Trainee ID is required',
                pattern: {
                  value: /^[A-Za-z0-9-_]+$/,
                  message: 'Trainee ID can only contain letters, numbers, hyphens, and underscores'
                }
              })}
            />
            {errors.ashima_id && (
              <p 
                id="ashima_id-error" 
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.ashima_id.message}
              </p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">
                Trainee ID cannot be changed after creation
              </p>
            )}
          </div> */}

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name <span className="text-destructive" aria-label="required">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
              {...register('name', { 
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long'
                },
                maxLength: {
                  value: 100,
                  message: 'Name must be less than 100 characters'
                }
              })}
            />
            {errors.name && (
              <p 
                id="name-error" 
                className="text-sm text-destructive"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Department and Position Section */}
      <fieldset className="space-y-4">
        <legend className="sr-only">Department and Position Information</legend>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Department */}
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-medium">
              Department
            </Label>
            <Controller
              name="department_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={loadingOptions}
                >
                  <SelectTrigger 
                    id="department"
                    aria-label="Select department"
                  >
                    <SelectValue placeholder={
                      loadingOptions ? 'Loading departments...' : 'Select department'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.length === 0 && !loadingOptions ? (
                      <SelectItem value="no-departments" disabled>
                        No departments available
                      </SelectItem>
                    ) : (
                      departments.map((dept) => (
                        <SelectItem 
                          key={dept.id} 
                          value={dept.id.toString()}
                          title={dept.name}
                        >
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label htmlFor="position" className="text-sm font-medium">
              Position
            </Label>
            <Controller
              name="position_id"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ''}
                  disabled={loadingOptions}
                >
                  <SelectTrigger 
                    id="position"
                    aria-label="Select position"
                    className="w-full"
                  >
                    <SelectValue 
                      placeholder={
                        loadingOptions ? 'Loading positions...' : 'Select position'
                      }
                      className="truncate"
                    />
                  </SelectTrigger>
                  <SelectContent className="max-w-[300px]">
                    {positions.length === 0 && !loadingOptions ? (
                      <SelectItem value="no-positions" disabled>
                        No positions available
                      </SelectItem>
                    ) : (
                      positions.map((pos) => (
                        <SelectItem 
                          key={pos.id} 
                          value={pos.id.toString()}
                          className="truncate" 
                          title={pos.name}
                        >
                          {pos.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </fieldset>

      {/* Status Section */}
      <fieldset className="space-y-4">
        <legend className="sr-only">Status Information</legend>
        {/* Active Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value || 'active'}
                  disabled={!isEditing} // Only allow status change in edit mode
                >
                  <SelectTrigger 
                    id="status"
                    aria-label="Select trainee status"
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {!isEditing && (
              <p className="text-xs text-muted-foreground">
                Status can only be changed when editing an existing employee
              </p>
            )}
          </div>
        </div>
      </fieldset>
    </div>
  );
});

TraineeDetailsTab.displayName = 'TraineeDetailsTab';

export default TraineeDetailsTab;
