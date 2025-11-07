import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, Filter, ArrowRight, LogIn, ArrowUp, Ticket } from 'lucide-react';
import axios from 'axios';
import { formatDate, formatTime } from '../helper/date';
import { toast } from 'react-toastify';
import { saveToCalendar } from '../helper/calendar';
import SaveToCalendarButton from '../ui/SaveToCalendarButton';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    category: string;
    ticketType: 'free' | 'paid';
    ticketPrice?: number;
    imageUrl?: string;
    organization: {
        name: string;
        logo?: string;
    };
    ticketsIssued: number;
    remainingCapacity: number;
    capacity: number;
}
const OrganizerEvents: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalEvents: 0,
        hasNext: false,
        hasPrev: false
    });


    useEffect(() => {
        fetchEvents();
    }, [pagination.currentPage]);


    //fetch events
    const fetchEvents = async () => {
        try {
            setLoading(true);

            // build query parameters for filter
            const params = new URLSearchParams(
                {
                    page: pagination.currentPage.toString(),
                    limit: '12'
                });

            // fetch events from API
            const response = await axios.get(`/events/organizer?${params.toString()}`);
            const { events, pagination: newPagination } = response.data;
            setEvents(events);
            setPagination(newPagination);
        }
        catch (error) {
            console.error('Error fetching events:', error);
        }
        finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPagination(prev => ({ ...prev, currentPage: page }));
    };


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
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Organizer Events</h1>
            </div>
            {/* Events Grid */}
            {events.length === 0 ? (
                <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event) => (
                        <div
                            key={event._id}
                            className="card bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all p-4"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                                    <p className="text-sm text-gray-500">{formatDate(event.date)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}</p>
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
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => exportAttendeesToCSV(event._id)}
                                        className="text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        Export CSV
                                    </button>
                                    <SaveToCalendarButton slimStyle event={event}/>
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
                            <Link
                                to={`/events/${event._id}`}
                                className="ml-1 mt-3 text-sm font-medium text-primary-600 hover:underline flex items-center"
                            >
                                View Details
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </div>

                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${page === pagination.currentPage
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default OrganizerEvents;
