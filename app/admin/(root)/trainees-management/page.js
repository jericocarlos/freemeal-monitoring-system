/**
 * Trainees Management Page
 * 
 * Main page for managing trainees with comprehensive CRUD operations,
 * filtering, searching, and data export/import capabilities.
 * 
 * Features:
 * - Trainee listing with pagination
 * - Advanced search and filtering
 * - Trainee creation and editing
 * - Trainee deletion with confirmation
 * - Dashboard statistics
 * - Data export/import (future feature)
 * - Responsive design and accessibility
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TraineeTable, 
  TraineeFormDialog, 
  FilterDialog, 
  DashboardStats,
  SearchAndFilterControls,
  TraineeActions,
  LoadingState,
  EmptyState,
  ErrorState
} from "@/components/admin/trainees";
import { useTraineesManager } from "@/hooks/useTraineesManager";
import PermissionGuard from "@/components/auth/PermissionGuard";

/**
 * TraineesManagementPage Component
 * Main component for trainee management functionality
 */
export default function TraineesManagementPage() {
  const {
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
    
    // Actions
    handleTraineeSubmit,
    deleteTrainee,
    openTraineeForm,
    resetFilters,
    refreshTrainees,
  } = useTraineesManager();

  /**
   * Memoized computed values for better performance
   */
  const computedValues = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(Boolean);
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasFiltersOrSearch = hasActiveFilters || hasSearchQuery;
    const showEmptyState = !loading && trainees.length === 0;
    
    return {
      hasActiveFilters,
      hasSearchQuery,
      hasFiltersOrSearch,
      showEmptyState,
    };
  }, [filters, searchQuery, loading, trainees.length]);

  /**
   * Placeholder handlers for future features
   */
  const handleExportTrainees = () => {
    // TODO: Implement trainee data export
    console.log('Export trainees functionality to be implemented');
  };

  const handleImportTrainees = () => {
    // TODO: Implement trainee data import
    console.log('Import trainees functionality to be implemented');
  };

  /**
   * Handles opening the filter dialog
   */
  const handleOpenFilter = () => {
    setIsFilterDialogOpen(true);
  };

  /**
   * Main content rendering based on current state
   */
  const renderMainContent = () => {
    // Error state
    if (error && !loading) {
      return (
        <ErrorState 
          error={error} 
          onRetry={refreshTrainees} 
        />
      );
    }

    // Loading state
    if (loading) {
      return <LoadingState message="Loading trainees..." />;
    }

    // Empty state
    if (computedValues.showEmptyState) {
      return (
        <EmptyState
          hasFilters={computedValues.hasFiltersOrSearch}
          onAddTrainee={() => openTraineeForm()}
          onResetFilters={resetFilters}
        />
      );
    }

    // Trainee table
    return (
      <TraineeTable 
        trainees={trainees}
        totalTrainees={totalTrainees}
        pagination={pagination}
        setPagination={setPagination}
        onEdit={openTraineeForm}
        onDelete={deleteTrainee}
        loading={loading}
      />
    );
  };

  return (
    <PermissionGuard module="trainees_management">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Statistics */}
        {/* <DashboardStats /> */}

        {/* Main Trainee Management Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Trainee Free Meal Lists
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Manage trainee free meal lists.
                </p>
              </div>
              
              {/* Header Actions */}
              <TraineeActions
                onAddTrainee={() => openTraineeForm()}
                onExportTrainees={handleExportTrainees}
                onImportTrainees={handleImportTrainees}
                loading={loading}
                totalTrainees={totalTrainees}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search and Filter Controls */}
            <SearchAndFilterControls
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onOpenFilter={handleOpenFilter}
              onResetFilters={resetFilters}
              onRefresh={refreshTrainees}
              loading={loading}
            />

            {/* Main Content */}
            {renderMainContent()}
          </CardContent>
        </Card>

        {/* Trainee Form Dialog */}
        <TraineeFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          trainee={currentTrainee}
          departments={departments}
          positions={positions}
          onSubmit={handleTraineeSubmit}
          isLoadingOptions={loadingMetadata}
          isSubmitting={submitting}
        />

        {/* Filter Dialog */}
        <FilterDialog
          open={isFilterDialogOpen}
          onOpenChange={setIsFilterDialogOpen}
          departments={departments}
          positions={positions}
          filters={filters}
          setFilters={setFilters}
          loading={loadingMetadata}
        />
      </div>
    </PermissionGuard>
  );
}