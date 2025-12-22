'use client';

import { useState, useEffect, useCallback } from 'react';
import useSound from 'use-sound';
import { API, STATUS, SETTINGS } from '@/constants';

export default function useAttendance() {
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [attendanceLog, setAttendanceLog] = useState(null);
  const [employeeStatus, setEmployeeStatus] = useState(null);
  const [error, setError] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading] = useState(false); // <-- Add loading state
  const [manualDateOverride, setManualDateOverride] = useState(null);

  const [playSuccess] = useSound('/sounds/success.mp3');
  const [playError] = useSound('/sounds/error.mp3');

  useEffect(() => {
    if (!employeeInfo) return;
    setShowInstructions(false);
    const timer = setTimeout(() => {
      clearEmployeeInfo();
      setShowInstructions(true);
    }, SETTINGS.AUTO_CLEAR_TIMEOUT);
    return () => clearTimeout(timer);
  }, [employeeInfo]);

  const clearEmployeeInfo = useCallback(() => {
    setEmployeeInfo(null);
    setAttendanceLog(null);
    setEmployeeStatus(null);
    setLoading(false); // <-- Reset loading on clear
  }, []);

  const handleTagRead = useCallback(async (tag) => {
    setLoading(true); // <-- Set loading true at start
    setEmployeeInfo({ name: 'Processing...', photo: null });
    setAttendanceLog(null);
    setEmployeeStatus('Processing...');
    setError(null);

    try {
      // include manual date override (if set) when processing tag reads
      const payload = { rfid_tag: tag };
      if (manualDateOverride) payload.time_claimed = manualDateOverride;
      const response = await fetch(API.ADD_ATTENDANCE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (response.ok) {
        setEmployeeInfo(result.employee);
        setAttendanceLog(result.attendanceLog);
        setEmployeeStatus(result.logType === 'CLAIMED' && result.flag !== 1 ? STATUS.CLAIMED : STATUS.CLAIMED_ALREADY);
        setError(null);
        playSuccess();
      } else {
        setError(result.error || 'An unexpected error occurred.');
        clearEmployeeInfo();
        playError();
      }
    } catch (err) {
      setError('An unexpected error occurred while processing the RFID tag.');
      clearEmployeeInfo();
      playError();
    } finally {
      setLoading(false); // <-- Always reset loading
    }
  }, [clearEmployeeInfo, playSuccess, playError]);

  // Submit a manual date/time for the currently selected employee.
  // If no employee is selected, set a persistent override for subsequent scans.
  const submitManualDate = useCallback(async (manualDate) => {
    // Helper to combine a date-only string with a time source (preserve time)
    const combineDateWithTime = (dateOnlyStr, source) => {
      const datePart = dateOnlyStr.includes('T') ? dateOnlyStr.split('T')[0] : dateOnlyStr.split(' ')[0];
      const src = source ? new Date(source) : new Date();
      const pad = (n) => String(n).padStart(2, '0');
      return `${datePart} ${pad(src.getHours())}:${pad(src.getMinutes())}:${pad(src.getSeconds())}`;
    };

    // If no employee selected, set a persistent override (store full timestamp if possible)
    if (!employeeInfo) {
      let timeClaimed = null;
      if (manualDate) {
        const hasTime = /T.*:|:/.test(manualDate);
        if (hasTime) {
          timeClaimed = manualDate.replace('T', ' ');
        } else {
          const source = manualDateOverride || new Date().toISOString();
          timeClaimed = combineDateWithTime(manualDate, source);
        }
      }

      setManualDateOverride(timeClaimed || null);
      setEmployeeStatus('Manual date override set');
      return { logType: 'OVERRIDE_SET', time_claimed: timeClaimed || null };
    }

    setLoading(true);
    setError(null);
    setEmployeeStatus('Processing...');

    try {
      // Build the payload time_claimed value — combine date-only with preserved time if needed
      let timeClaimed = null;
      if (manualDate) {
        const hasTime = /T.*:|:/.test(manualDate);
        if (hasTime) {
          timeClaimed = manualDate.replace('T', ' ');
        } else {
          const source = manualDateOverride || new Date().toISOString();
          timeClaimed = combineDateWithTime(manualDate, source);
        }
      }

      const payload = {
        ashima_id: employeeInfo.ashima_id,
        time_claimed: timeClaimed || null
      };

      const response = await fetch(API.ADD_ATTENDANCE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        setEmployeeInfo(result.employee);
        setAttendanceLog(result.attendanceLog);
        setEmployeeStatus(result.logType === 'CLAIMED' && result.flag !== 1 ? STATUS.CLAIMED : STATUS.CLAIMED_ALREADY);
        playSuccess();
        return result;
      } else {
        setError(result.error || 'An unexpected error occurred.');
        playError();
        throw new Error(result.error || 'Failed to submit manual date.');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while submitting manual date.');
      playError();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [employeeInfo, playSuccess, playError, manualDateOverride]);

  const clearManualDateOverride = useCallback(() => setManualDateOverride(null), []);

  return {
    employeeInfo,
    attendanceLog,
    employeeStatus,
    error,
    showInstructions,
    handleTagRead,
    clearEmployeeInfo,
    loading, // <-- Return loading
    submitManualDate,
    manualDateOverride,
    clearManualDateOverride
  };
}