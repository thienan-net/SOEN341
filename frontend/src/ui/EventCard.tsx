import { ArrowRight, Calendar, Clock, ImageIcon, MapPin, Users } from "lucide-react"
import { Event } from "../pages/Events"
import { formatDate, formatTime } from "../helper/date"
import { Link } from "react-router-dom"
import SaveToCalendarButton from "./SaveToCalendarButton"


export const EventCard = ({event} : {event: Event}) => {
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
    return (
        <div key={event._id} className="card hover:shadow-lg transition-shadow" style={{position: "relative"}}>
            {event.userHasTicket ? (
                <span className="absolute top-[-5px] right-[-15px] bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-3">
                    Ticket Claimed
                </span>
            ) : !event.isClaimable && 
            <   span className="absolute top-[-5px] right-[-15px] bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded-full z-3">
                    Tickets unavailable
                </span>
            }
            {event.imageUrl ? (
                <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                />
                )
                :
                <div className="w-full h-48 rounded-lg mb-4 bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-sm">No image available</span>
                </div>
            }
            <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(event.category)}`}>
                {event.category}
                </span>
                <span className="text-sm text-gray-500">
                {event.ticketType === 'free' ? 'Free' : `$${event.ticketPrice}`}
                </span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {event.title}
            </h3>
            
            <p className="text-gray-600 line-clamp-3">
                {event.description}
            </p>
            
            <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                <Calendar className="w-4 h-4 mr-2" />
                {formatDate(event.date)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-2" />
                {event.organization.name}
                </div>
            </div>
            
            <div className="pt-4">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <span>{event.ticketsIssued} tickets issued</span>
                <span>{event.remainingCapacity} remaining</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                    width: `${(event.ticketsIssued / event.capacity) * 100}%`
                    }}
                ></div>
                </div>
            </div>
            
            <Link
                to={`/events/${event._id}`}
                className="w-full btn-primary flex items-center justify-center text-white hover:text-white no-underline hover:no-underline"
            >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
            </Link>


            <SaveToCalendarButton event={event} />
            </div>
        </div>
    )
}