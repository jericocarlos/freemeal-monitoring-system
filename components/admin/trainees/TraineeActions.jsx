/**
 * Trainee management header actions
 * Contains the primary action buttons for trainee management
 */

import React, { memo } from 'react';
import { FiUserPlus, FiDownload, FiUpload } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

/**
 * TraineeActions Component
 * @param {Object} props - Component props
 * @param {Function} props.onAddTrainee - Handler for adding new trainee
 * @param {Function} props.onExportTrainees - Handler for exporting trainees
 * @param {Function} props.onImportTrainees - Handler for importing trainees
 * @param {boolean} props.loading - Loading state
 * @param {number} props.totalTrainees - Total number of trainees
 */
const TraineeActions = memo(({
  onAddTrainee,
  onExportTrainees,
  onImportTrainees,
  loading = false,
  totalTrainees = 0
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Add Trainee Button */}
      <Button
        onClick={onAddTrainee}
        disabled={loading}
        aria-label="Add new trainee"
        className="bg-primary hover:bg-primary/90"
      >
        <FiUserPlus className="mr-2 h-4 w-4" />
        Add Trainee
      </Button>
    </div>
  );
});

TraineeActions.displayName = 'TraineeActions';

export default TraineeActions;
