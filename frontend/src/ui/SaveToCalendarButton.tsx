import React, { useState, useRef, useEffect } from 'react';
import { Calendar, FileText } from 'lucide-react';
import { Event } from '../pages/Events';
import { toast } from 'react-toastify';

const SaveToCalendarButton = ({ event, slimStyle = false }: { event: Event; slimStyle?: boolean }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setOpen(!open);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAppleDevice = () =>
    /Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);

  const parseEventDate = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(dateStr);
    d.setHours(hours, minutes, 0, 0);
    if (isNaN(d.getTime())) toast.error('Invalid event date/time');
    return d;
  };

  const getCalendarLinks = (event: Event) => {
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');
    const start = parseEventDate(event.date, event.startTime);
    const end = parseEventDate(event.date, event.endTime);
    const startStr = start.toISOString().replace(/-|:|\.\d+/g, '');
    const endStr = end.toISOString().replace(/-|:|\.\d+/g, '');
    return {
      google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${startStr}/${endStr}`,
      outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&body=${description}&location=${location}&startdt=${start.toISOString()}&enddt=${end.toISOString()}`,
      apple: `data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${title}%0ADESCRIPTION:${description}%0ALOCATION:${location}%0ADTSTART:${startStr}%0ADTEND:${endStr}%0AEND:VEVENT%0AEND:VCALENDAR`,
    };
  };

  const downloadICS = (event: Event) => {
    const start = parseEventDate(event.date, event.startTime);
    const end = parseEventDate(event.date, event.endTime);
    const startStr = start.toISOString().replace(/-|:|\.\d+/g, '');
    const endStr = end.toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
LOCATION:${event.location || ''}
DTSTART:${startStr}
DTEND:${endStr}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const links = getCalendarLinks(event);

  // Button style based on slimStyle
  const buttonClass = slimStyle
    ? 'text-xs px-3 py-1.5 border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition inline-flex items-center'
    : 'w-full flex items-center justify-center text-sm text-green-700 border border-green-500 rounded-md px-3 py-2 hover:bg-green-50 transition';

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className={buttonClass}>
        {!slimStyle && <Calendar className="w-4 h-4 mr-2" />}
        Save to Calendar
      </button>

      {open && (
        <div className="absolute z-10 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden divide-y divide-gray-200">
          <button
            onClick={() => window.open(links.google, '_blank')}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-green-50 transition"
          >
            <Calendar className="w-4 h-4 mr-2" /> Google Calendar
          </button>
          <button
            onClick={() => window.open(links.outlook, '_blank')}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-green-50 transition"
          >
            <Calendar className="w-4 h-4 mr-2" /> Outlook
          </button>
          {isAppleDevice() && (
            <button
              onClick={() => window.open(links.apple, '_blank')}
              className="flex items-center w-full px-4 py-2 text-sm hover:bg-green-50 transition"
            >
              <Calendar className="w-4 h-4 mr-2" /> Apple Calendar
            </button>
          )}
          <button
            onClick={() => downloadICS(event)}
            className="flex items-center w-full px-4 py-2 text-sm hover:bg-green-50 transition"
          >
            <FileText className="w-4 h-4 mr-2" /> Download .ics File
          </button>
        </div>
      )}
    </div>
  );
};

export default SaveToCalendarButton;
