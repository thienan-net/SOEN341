export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  
  // Adjust to local timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  return localDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};
// Format a time string (HH:MM) in local time
export const formatTime = (timeString: string) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
