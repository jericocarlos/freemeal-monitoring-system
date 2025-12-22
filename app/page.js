'use client';

import { motion, AnimatePresence } from 'framer-motion';
import HIDListener from '@/lib/HIDListeners';
import Clock from '@/components/Clock';
import EmployeeCard from '@/components/layout/home/EmployeeCard';
import EmployeePhoto from '@/components/layout/home/EmployeePhoto';
import ErrorDisplay from '@/components/layout/home/ErrorDisplay';
import useAttendance from '@/hooks/useAttendance';
import { useState } from 'react';
import useF2Shortcut  from '@/hooks/useF2Shortcut';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { ANIMATIONS } from '@/constants';
import Image from 'next/image';

export default function Home() {
  const {
    employeeInfo,
    attendanceLog,
    employeeStatus,
    error,
    showInstructions,
    handleTagRead,
    clearEmployeeInfo,
    loading, // <-- Destructure loading
    submitManualDate,
    manualDateOverride,
  } = useAttendance();

  const [isManualDateOpen, setIsManualDateOpen] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const { ToastContainer, success, error: toastError } = useToast();
  // Format helper for the override and display
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const iso = dateString.includes('T') ? dateString : dateString.replace(' ', 'T');
      return new Date(iso).toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (err) {
      return dateString;
    }
  };

  useF2Shortcut(() => setIsManualDateOpen(true));

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Clock component at the top */}
      <motion.div 
        className="pt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <Clock overrideDate={manualDateOverride} />
      </motion.div>

      {/* Conditional main content */}
      <div className="container my-5 mx-auto px-8 pb-20">
        {/* Instructions or welcome message */}
        <AnimatePresence>
          {showInstructions && !error && (
            <motion.div 
              className="text-center my-10"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0 }}
              variants={ANIMATIONS.fadeIn}
            >
              <motion.h2 
                className="text-5xl font-bold text-cyan-300"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                Please Tap Your ID Card In Claiming Your Free Meal.
                <p style={{ fontWeight: "semibold" }}>Note: For Manual Date Change press F2.</p>
              </motion.h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Employee data display */}
        <AnimatePresence>
          
          {employeeInfo && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
              variants={ANIMATIONS.fadeIn}
            >
              {/* Left side - Employee Info */}
              <EmployeeCard 
                employeeInfo={employeeInfo} 
                attendanceLog={attendanceLog}
                employeeStatus={employeeStatus} 
              />
              
              {/* Right side - Photo and status */}
              <EmployeePhoto 
                employeeInfo={employeeInfo}
                employeeStatus={employeeStatus} 
              />
              
            </motion.div>
            
          )}
        </AnimatePresence>

        {/* Error display */}
        <AnimatePresence>
          {error && <ErrorDisplay error={error} />}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading && (
          <div className="flex justify-center items-center mt-10">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-cyan-500"></div>
            <span className="ml-6 text-3xl text-cyan-500 font-bold">Processing...</span>
          </div>
        )}
      </div>

      {/* Company branding footer */}
      <div className="fixed bottom-0 left-0 w-full bg-black/30 backdrop-blur">
        <div className="container mx-auto relative flex justify-between items-center px-8">
          {/* Title on the left */}
          <div className="text-2xl font-bold">Free Meal Monitoring System</div>
          
          {/* Spinner absolutely centered */}
          {loading && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-b-4 border-cyan-500"></div>
            </div>
          )}

          {/* Logo on the right */}
          <div>
            <Image
              src="/ew-logo-full.png" 
              alt="EWBPO Logo" 
              width={300}
              height={53}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Toast container */}
      <ToastContainer />

      {/* Manual Date Modal */}
      <Dialog open={isManualDateOpen} onOpenChange={setIsManualDateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Change Date Entry</DialogTitle>
            <DialogDescription className="text-red-500">
              Note: When changing date it must be the previous date and not the future date.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <label className="block mb-2 font-medium">Select Previous Date:</label>
            <input
              type="date"
              value={manualDate}
              onChange={(e) => setManualDate(e.target.value)}
              className="w-full rounded border px-3 py-2 bg-slate-800 text-white"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              className="px-4 py-2 rounded bg-gray-200 text-black"
              onClick={() => setIsManualDateOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="ml-3 px-4 py-2 rounded bg-cyan-500 text-white"
              onClick={async () => {
                try {
                  const payloadDate = manualDate ? manualDate.replace('T', ' ') : null;
                  const result = await submitManualDate(payloadDate);

                  if (result?.logType === 'OVERRIDE_SET') {
                    if (payloadDate) {
                      success(`Current date set: ${formatDateTime(payloadDate)}`);
                    } else {
                      success('Current date cleared');
                    }
                  } else {
                    success(`Manual date saved — ${result.logType}`);
                  }

                  setIsManualDateOpen(false);
                  setManualDate('');
                } catch (err) {
                  toastError(err.message || 'Failed to submit manual date.');
                }
              }}
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HID Listener */}
      <HIDListener onTagRead={handleTagRead} />
    </div>
  );
}