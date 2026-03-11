export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr: string) => {
  if (!timeStr) return '-';
  try {
    let date: Date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
      
      // Handle Excel/Google Sheets time-only values (usually 1899-12-30)
      // If it's a very old date, we treat it as time only and don't adjust for timezone if it's UTC
      // However, new Date() usually adjusts to local. 
      // If the user says 03:52 UTC should be 07:01 am, that's +3:09. 
      // Actually, if it's 1899-12-30, it's often just the time part.
    } else {
      const [hours, minutes] = timeStr.split(':');
      date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    
    if (isNaN(date.getTime())) return timeStr;
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};
