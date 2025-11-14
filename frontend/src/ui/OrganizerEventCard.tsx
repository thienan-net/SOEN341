import { Link } from "react-router-dom"
import { Event } from "../pages/OrganizerEvents";
import { Clock, MapPin, Ticket, Users } from "lucide-react";
import SaveToCalendarButton from "./SaveToCalendarButton";
import { toast } from "react-toastify";
import axios from "axios";
import { formatDate, formatTime } from "../helper/date";

interface Props {
    event: Event;
    events: Event[];
    setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
}

export const OrganizerEventCard = (props : Props) => {
    const { event, events, setEvents } = props;
    
    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            academic: 'bg-blue-100 text-blue-800',
            social: 'bg-pink-100 text-pink-800',
            sports: 'bg-green-100 text-green-800',
            cultural: 'bg-purple-100 text-purple-800',
            career: 'bg-yellow-100 text-yellow-800',
            volunteer: 'bg-orange-100 text-orange-800',
            other: 'bg-gray-100 text-gray-800'
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };
    const exportAttendeesToCSV = async (id: string) => {
        try {
            const res = await axios.get(`/events/attendees/${id}`);
            const { attendees, eventTitle } = res.data;
            if (!attendees || attendees.length === 0) {
                toast.error("No attendees found for this event");
                return;
            }
            const headers = ["Ticket ID", "Name", "Email", "Status", "Purchased At"];
            const rows = attendees.map((a: any) => [
            a.ticketId,
            `"${a.name}"`,
            a.email,
            a.status,
            new Date(a.purchasedAt).toLocaleString(),
            ]);

            const csvContent =
            headers.join(",") + "\n" + rows.map((r : any) => r.join(",")).join("\n");

            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.setAttribute(
            "download",
            `${eventTitle.replace(/\s+/g, "_")}_attendees.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            toast.success("Attendee list exported successfully");
            console.log(res.data)
        }
        catch(error : any) {
            toast.error(error.response.data || error.mesage)
        }
    }
    const deleteEvent = async (id: string) => {
        try {
            const res = await axios.delete(`/events/${id}`);
            const temp = [...events];
            // locally update the UI
            setEvents(temp.filter(x=> x._id != id));
            toast.success(res.data.message)
        }
        catch (error : any) {
            toast.error(error.response.data || error.message)
        }   
    }
    return (
       <div
            key={event._id}
            className={`card bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all p-4
                        ${event.isApproved 
                            ? 'border-blue-300 shadow-blue-200/50' 
                            : 'border-red-300 shadow-red-200/50'
            }`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div>
                    <Link to={`/events/${event._id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 hover:underline transition">
                            {event.title}
                        </h3>
                    </Link>
                    <p className="text-sm text-gray-500">
                        {formatDate(event.date)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                        <small
                            className={`mt-2 inline-block px-2 py-1 text-xs font-semibold rounded-full
                                ${event.isApproved ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}
                            `}
                        >
                            {event.isApproved ? 'Approved' : 'Pending Approval'}
                        </small>     
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                    {event.category}
                </span>
            </div>

            {/* Image */}
            {event.imageUrl && (
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                />
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" /> {event.location}
                </div>
                <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" /> {event.organization.name}
                </div>
                <div className="flex items-center">
                    <Ticket className="w-4 h-4 mr-2" /> {event.ticketsIssued} issued
                </div>
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" /> {event.remainingCapacity} left
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${(event.ticketsIssued / event.capacity) * 100}%` }}
                />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-[10px]">
                <div className="flex items-center flex-wrap gap-2">
                    <button
                        onClick={() => exportAttendeesToCSV(event._id)}
                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Export CSV
                    </button>
                    <SaveToCalendarButton slimStyle event={event} />
                    <Link
                        to={`/organizer/events/edit/${event._id}`}
                        className="text-xs px-3 py-1.5 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50"
                    >
                        Edit
                    </Link>

                    <button
                        onClick={() => deleteEvent(event._id)}
                        className="text-xs px-3 py-1.5 border border-red-500 text-red-600 rounded-md hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>


    )
}