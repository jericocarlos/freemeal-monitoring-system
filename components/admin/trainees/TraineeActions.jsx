/**
 * Trainee management header actions
 * Contains the primary action buttons for trainee management
 */

import React, { memo } from 'react';
import { FiPlus, FiDownload, FiUpload } from 'react-icons/fi';
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
      {/* Export/Import Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={loading}
            aria-label="Export or import trainee data"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export/Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={onExportTrainees}
            disabled={loading || totalTrainees === 0}
            className="cursor-pointer"
          >
            <FiDownload className="mr-2 h-4 w-4" />
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onImportTrainees}
            disabled={loading}
            className="cursor-pointer"
          >
            <FiUpload className="mr-2 h-4 w-4" />
            Import from CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add Trainee Button */}
      <Button
        onClick={onAddTrainee}
        disabled={loading}
        aria-label="Add new trainee"
        className="bg-primary hover:bg-primary/90"
      >
        <FiPlus className="mr-2 h-4 w-4" />
        Add Trainee
      </Button>
    </div>
  );
});

TraineeActions.displayName = 'TraineeActions';

export default TraineeActions;
