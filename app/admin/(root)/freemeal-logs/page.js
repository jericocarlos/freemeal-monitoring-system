"use client";

import { 
  FreemealTable, 
  FilterDialog, 
  DashboardStats,
  SearchAndFilterControls,
  FreemealHeader,
  FreemealStates
} from "@/components/admin/freemeal";
import PermissionGuard from "@/components/auth/PermissionGuard";
import { useFreemealLogsManager } from "@/hooks/useFreemealLogsManager";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Free Meal Logs Page Component
 * Provides a comprehensive view of free meal logs with search, filtering, and export capabilities
 *
 * Features:
 * - Dashboard statistics overview
 * - Real-time search with debouncing
 * - Advanced filtering by log type, department, and date range
 * - CSV export functionality
 * - Paginated table view
 * - Accessible UI with ARIA labels and keyboard navigation
 */
export default function FreemealLogsPage() {
  const {
    // Data state
    logs,
    totalLogs,
    departments,
    
    // Loading states
    loading,
    loadingDepartments,
    exporting,
    emailSending,
    
    // Filter and search state
    searchQuery,
    filters,
    setFilters,
    pagination,
    setPagination,
    
    // Dialog state
    isFilterDialogOpen,
    setIsFilterDialogOpen,
    
    // Error state
    error,
    
    // Computed values
    computedValues,
    
    // Actions
    handleSearchChange,
    handleExportLogs,
    handleSendLogsByEmail,
    handleSendPreviousWeekByEmail,
    handleExportPreviousWeek,
    openFilterDialog,
    resetFilters,
    refreshLogs,
  } = useFreemealLogsManager();

  return (
    <PermissionGuard module="freemeal_logs">
      <div 
        className="container mx-auto px-4 py-8"
        role="main"
        aria-label="Free Meal Logs Management"
      >
        {/* Dashboard Statistics */}
        {/* <DashboardStats /> */}

        {/* Main Free Meal Logs Card */}
        <Card>
          <FreemealHeader 
            onFilterClick={openFilterDialog}
            onExportClick={handleExportLogs}
            onSendEmailClick={handleSendLogsByEmail}
            onSendPreviousWeekClick={handleSendPreviousWeekByEmail}
            onExportPreviousWeekClick={handleExportPreviousWeek}
            onSearchChange={handleSearchChange}
            exporting={exporting}
            emailSending={emailSending}
            hasActiveFilters={computedValues.hasActiveFilters}
            onResetFilters={resetFilters}
          />
          
          <CardContent>
            <FreemealStates 
              loading={loading}
              error={error}
              showEmptyState={computedValues.showEmptyState}
              hasFiltersOrSearch={computedValues.hasFiltersOrSearch}
              onRefresh={refreshLogs}
              onResetFilters={resetFilters}
            />
            
            {!loading && !error && logs.length > 0 && (
              <FreemealTable
                logs={logs}
                totalLogs={totalLogs}
                pagination={pagination}
                setPagination={setPagination}
                loading={loading}
              />
            )}
          </CardContent>
        </Card>

        {/* Filter Dialog */}
        <FilterDialog
          open={isFilterDialogOpen}
          onOpenChange={setIsFilterDialogOpen}
          filters={filters}
          setFilters={setFilters}
          departments={departments}
          loadingDepartments={loadingDepartments}
        />
      </div>
    </PermissionGuard>
  );
}