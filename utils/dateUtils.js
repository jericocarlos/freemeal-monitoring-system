import dayjs from 'dayjs';

export function formatTime(timeString) {
  if (!timeString) return 'N/A';
  return dayjs(timeString).format('h:mm A');
}

export function formatDate(dateString) {
  return dayjs(dateString).format('dddd, MMMM D, YYYY');
}

export function getCurrentDateFormatted() {
  return dayjs().format('dddd, MMMM D, YYYY');
}

/**
 * Returns start and end dates (YYYY-MM-DD) for the previous calendar week (Monday - Sunday)
 */
export function getPreviousWeekRange() {
  const today = dayjs();
  const currentDow = today.day(); // 0 (Sun) - 6 (Sat)
  const daysSinceMonday = (currentDow + 6) % 7; // Monday -> 0
  const startOfCurrentWeek = today.subtract(daysSinceMonday, 'day').startOf('day');
  const previousWeekStart = startOfCurrentWeek.subtract(7, 'day');
  const previousWeekEnd = previousWeekStart.add(6, 'day').endOf('day');

  return {
    startDate: previousWeekStart.format('YYYY-MM-DD'),
    endDate: previousWeekEnd.format('YYYY-MM-DD')
  };
}

export function getFirstName(fullName) {
  return fullName.split(' ')[0];
}