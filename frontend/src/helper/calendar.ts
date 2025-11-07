import { toast } from "react-toastify";
import { Event } from "../pages/Events";

export const saveToCalendar = (event: Event) => {
  try {
    const baseDate = event.date.split("T")[0]; // "2025-11-05"
    const start = new Date(`${baseDate}T${event.startTime}:00`);
    const end = new Date(`${baseDate}T${event.endTime}:00`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      toast.error("Invalid event date or time");
      return;
    }

    const details = {
      text: event.title,
      details: event.description,
      location: event.location,
      start: start.toISOString().replace(/-|:|\.\d+/g, ""),
      end: end.toISOString().replace(/-|:|\.\d+/g, ""),
    };

    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      details.text
    )}&details=${encodeURIComponent(details.details)}&location=${encodeURIComponent(
      details.location
    )}&dates=${details.start}/${details.end}`;

    window.open(url, "_blank");
  } catch (err) {
    console.error(err);
    toast.error("Failed to add event to calendar");
  }
};
