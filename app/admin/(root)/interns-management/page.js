/**
 * Intern Management Page
 * 
 * Main page for managing interns or ojt with comprehensive CRUD operations,
 * filtering, searching, and data export/import capabilities.
 * 
 * Features:
 * - Intern listing with pagination
 * - Advanced search and filtering
 * - Intern creation and editing
 * - Intern deletion with confirmation
 * - Dashboard statistics
 * - Data export/import (future feature)
 * - Responsive design and accessibility
 */

"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  InternTable, 
  InternFormDialog, 
  FilterDialog, 
  DashboardStats,
  SearchAndFilterControls,
  InternActions,
  LoadingState,
  EmptyState,
  ErrorState
} from "@/components/admin/interns";
import { useInternsManager } from "@/hooks/useInternsManager";
import PermissionGuard from "@/components/auth/PermissionGuard";

/**
 * InternsManagementPage Component
 * Main component for intern management functionality
 */
export default function InternsManagementPage() {
  const {
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
    
    // Actions
    handleInternSubmit,
    deleteIntern,
    openInternForm,
    resetFilters,
    refreshInterns,
  } = useInternsManager();

  /**
   * Memoized computed values for better performance
   */
  const computedValues = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(Boolean);
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasFiltersOrSearch = hasActiveFilters || hasSearchQuery;
    const showEmptyState = !loading && interns.length === 0;
    
    return {
      hasActiveFilters,
      hasSearchQuery,
      hasFiltersOrSearch,
      showEmptyState,
    };
  }, [filters, searchQuery, loading, interns.length]);

  /**
   * Placeholder handlers for future features
   */
  const handleExportInterns = () => {
    // TODO: Implement intern data export
    console.log('Export interns functionality to be implemented');
  };

  const handleImportInterns = () => {
    // TODO: Implement intern data import
    console.log('Import interns functionality to be implemented');
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
          onRetry={refreshInterns} 
        />
      );
    }

    // Loading state
    if (loading) {
      return <LoadingState message="Loading interns..." />;
    }

    // Empty state
    if (computedValues.showEmptyState) {
      return (
        <EmptyState
          hasFilters={computedValues.hasFiltersOrSearch}
          onAddIntern={() => openInternForm()}
          onResetFilters={resetFilters}
        />
      );
    }

    // Intern table
    return (
      <InternTable 
        interns={interns}
        totalInterns={totalInterns}
        pagination={pagination}
        setPagination={setPagination}
        onEdit={openInternForm}
        onDelete={deleteIntern}
        loading={loading}
      />
    );
  };

  return (
    <PermissionGuard module="interns_management">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Dashboard Statistics */}
        {/* <DashboardStats /> */}

        {/* Main Intern Management Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold">
                  Intern / OJT Free Meal Lists
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Manage qualified free meal intern lists.
                </p>
              </div>
              
              {/* Header Actions */}
              <InternActions
                onAddIntern={() => openInternForm()}
                onExportInterns={handleExportInterns}
                onImportInterns={handleImportInterns}
                loading={loading}
                totalInterns={totalInterns}
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
              onRefresh={refreshInterns}
              loading={loading}
            />

            {/* Main Content */}
            {renderMainContent()}
          </CardContent>
        </Card>

        {/* Intern Form Dialog */}
        <InternFormDialog
          open={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          intern={currentIntern}
          departments={departments}
          positions={positions}
          onSubmit={handleInternSubmit}
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