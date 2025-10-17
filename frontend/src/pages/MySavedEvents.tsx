import React, { useState, useEffect } from 'react';
import { Bookmark, Calendar, MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import axios from 'axios';

interface SavedEvent {
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

const MySavedEvents: React.FC = () => {
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedEvents();
  }, []);

  const fetchSavedEvents = async () => {
    try {
      const response = await axios.get('/events/saved/my');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching saved events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Saved Events</h1>
        <p className="text-gray-600">Events you've saved to your calendar</p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved events</h3>
          <p className="text-gray-600">Start by saving events you're interested in!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} className="card hover:shadow-lg transition-shadow">
              {event.imageUrl && (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
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
                
                <a
                  href={`/events/${event._id}`}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySavedEvents;